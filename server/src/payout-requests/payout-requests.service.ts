import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayoutRequest, PayoutRequestStatus, Prisma } from '@prisma/client';
import { formatMinorUnits, parseMinorUnits } from '../common/money.util';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService, ledgerKeys } from '../wallet/ledger.service';
import {
  AdminListPayoutRequestsQueryDto,
  AdminPayoutRequestListDto,
  CompletePayoutRequestDto,
  CreatePayoutRequestDto,
  ListPayoutRequestsQueryDto,
  PayoutMethodSummaryDto,
  PayoutRequestListDto,
  PayoutRequestResponseDto,
  RejectPayoutRequestDto,
} from './payout-requests.dto';

type MethodRow = { id: string; methodType: PayoutMethodSummaryDto['methodType']; maskedLabel: string };

/**
 * Withdrawal requests — locked lifecycle (2026-10-14):
 *
 *  - No configured minimum/maximum; the request must be positive and ≤ AVAILABLE.
 *  - Funds are RESERVED atomically at request time (wallet row lock): AVAILABLE → RESERVED.
 *  - Status starts PENDING_APPROVAL. Admin approve → APPROVED (no money moves yet).
 *  - Reject / owner-cancel → REJECTED/CANCELLED and the reservation is released back to AVAILABLE.
 *  - COMPLETED only via an admin action carrying a valid payment UTR; RESERVED → WITHDRAWN.
 *
 * Every movement is an append-only ledger transaction with its own idempotency key, and each
 * status change is a compare-and-set guarded by the previous status, so retries/concurrency
 * can neither double-reserve nor double-pay.
 */
@Injectable()
export class PayoutRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly config: ConfigService,
  ) {}

  // ───────────────────────────── owner side ─────────────────────────────

  async create(userId: string, dto: CreatePayoutRequestDto): Promise<PayoutRequestResponseDto> {
    const amount = parseMinorUnits(dto.amountMinorUnits, 'amountMinorUnits');
    if (amount <= 0n) {
      throw new BadRequestException('amountMinorUnits must be positive');
    }
    const currency = dto.currency ?? 'INR';

    const method = await this.prisma.payoutMethod.findUnique({
      where: { userId_id: { userId, id: dto.payoutMethodId } },
      select: { id: true, isActive: true, methodType: true, maskedLabel: true },
    });
    if (!method) {
      throw new NotFoundException('Payout method not found');
    }
    if (!method.isActive) {
      throw new ConflictException('Payout method is inactive');
    }

    // Idempotent on (user, idempotencyKey): a retry returns the original request unchanged.
    const existing = await this.prisma.payoutRequest.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: dto.idempotencyKey } },
    });
    if (existing) {
      return this.toResponse(existing, method);
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const request = await tx.payoutRequest.create({
          data: { userId, payoutMethodId: dto.payoutMethodId, amountMinorUnits: amount, currency, idempotencyKey: dto.idempotencyKey },
          select: { id: true },
        });
        await tx.payoutRequestEvent.create({
          data: {
            payoutRequestId: request.id,
            eventType: 'REQUESTED',
            toStatus: 'PENDING_APPROVAL',
            actorUserId: userId,
            eventKey: `requested|${request.id}`,
          },
        });
        // Atomic reservation: AVAILABLE → RESERVED, never overspending.
        await this.ledger.postWithin(tx, {
          userId,
          currency,
          transactionType: 'WITHDRAWAL_RESERVATION',
          referenceType: 'payout_request',
          referenceId: request.id,
          idempotencyKey: ledgerKeys.withdrawalReservation(request.id),
          lines: [
            { bucket: 'AVAILABLE', amountMinorUnits: -amount },
            { bucket: 'RESERVED', amountMinorUnits: amount },
          ],
          guard: (balances) => {
            if (balances.availableMinorUnits < amount) {
              throw new ConflictException(
                `Insufficient available balance: ${formatMinorUnits(balances.availableMinorUnits)} paise available`,
              );
            }
          },
        });
        return request.id;
      });

      const row = await this.prisma.payoutRequest.findUniqueOrThrow({ where: { id: created } });
      return this.toResponse(row, method, true);
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        const raced = await this.prisma.payoutRequest.findUnique({
          where: { userId_idempotencyKey: { userId, idempotencyKey: dto.idempotencyKey } },
        });
        if (raced) {
          return this.toResponse(raced, method);
        }
      }
      throw error;
    }
  }

  async listOwn(userId: string, query: ListPayoutRequestsQueryDto): Promise<PayoutRequestListDto> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const where: Prisma.PayoutRequestWhereInput = { userId, ...(query.status ? { status: query.status } : {}) };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payoutRequest.findMany({
        where,
        include: { payoutMethod: { select: { id: true, methodType: true, maskedLabel: true } } },
        orderBy: [{ requestedAt: 'desc' }, { id: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);
    return { data: rows.map((row) => this.toResponse(row, row.payoutMethod)), total, limit, offset };
  }

  async getOwn(userId: string, id: string): Promise<PayoutRequestResponseDto> {
    const row = await this.prisma.payoutRequest.findUnique({
      where: { id },
      include: { payoutMethod: { select: { id: true, methodType: true, maskedLabel: true } } },
    });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('Payout request not found');
    }
    return this.toResponse(row, row.payoutMethod);
  }

  /** Owner cancels a request that has not been paid yet; the reservation returns to AVAILABLE. */
  async cancel(userId: string, id: string): Promise<PayoutRequestResponseDto> {
    const result = await this.transition({
      id,
      actorUserId: userId,
      ownerId: userId,
      allowedFrom: ['PENDING_APPROVAL', 'APPROVED'],
      terminalStatus: 'CANCELLED',
      toStatus: 'CANCELLED',
      eventType: 'CANCELLED',
      eventKeyPrefix: 'cancelled',
      releaseReservation: true,
    });
    return result;
  }

  // ───────────────────────────── admin side ─────────────────────────────

  async adminList(query: AdminListPayoutRequestsQueryDto): Promise<AdminPayoutRequestListDto> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const where: Prisma.PayoutRequestWhereInput = {
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.payoutRequest.findMany({
        where,
        include: { payoutMethod: { select: { id: true, methodType: true, maskedLabel: true } } },
        orderBy: [{ requestedAt: 'asc' }, { id: 'asc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);
    const userIds = [...new Set(rows.map((row) => row.userId))];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });
    const userById = new Map(users.map((user) => [user.id, user]));
    return {
      data: rows.map((row) => ({
        ...this.toResponse(row, row.payoutMethod),
        user: userById.get(row.userId) ?? { id: row.userId, username: null },
        reviewedByUserId: row.reviewedByUserId,
        completedByUserId: row.completedByUserId,
      })),
      total,
      limit,
      offset,
    };
  }

  /** PENDING_APPROVAL → APPROVED. No money moves; the reservation stays in RESERVED. */
  async approve(id: string): Promise<PayoutRequestResponseDto> {
    const actor = await this.requireAdminActor();
    return this.transition({
      id,
      actorUserId: actor.id,
      allowedFrom: ['PENDING_APPROVAL'],
      terminalStatus: 'APPROVED',
      toStatus: 'APPROVED',
      eventType: 'APPROVED',
      eventKeyPrefix: 'approved',
      setReview: true,
    });
  }

  /** PENDING_APPROVAL|APPROVED → REJECTED, releasing the reservation back to AVAILABLE. */
  async reject(id: string, dto: RejectPayoutRequestDto): Promise<PayoutRequestResponseDto> {
    const actor = await this.requireAdminActor();
    return this.transition({
      id,
      actorUserId: actor.id,
      allowedFrom: ['PENDING_APPROVAL', 'APPROVED'],
      terminalStatus: 'REJECTED',
      toStatus: 'REJECTED',
      eventType: 'REJECTED',
      eventKeyPrefix: 'rejected',
      setReview: true,
      rejectionReason: dto.reason,
      releaseReservation: true,
    });
  }

  /** APPROVED (or PENDING_APPROVAL) → COMPLETED. Requires a valid payment UTR; RESERVED → WITHDRAWN. */
  async complete(id: string, dto: CompletePayoutRequestDto): Promise<PayoutRequestResponseDto> {
    const actor = await this.requireAdminActor();
    return this.transition({
      id,
      actorUserId: actor.id,
      allowedFrom: ['APPROVED', 'PENDING_APPROVAL'],
      terminalStatus: 'COMPLETED',
      toStatus: 'COMPLETED',
      eventType: 'COMPLETED',
      eventKeyPrefix: 'completed',
      setReview: true,
      complete: { paymentUtr: dto.paymentUtr, actorUserId: actor.id },
    });
  }

  // ───────────────────────────── internals ─────────────────────────────

  /**
   * Shared compare-and-set transition. Retries are safe: the status guard rejects a second
   * application, and the ledger idempotency key prevents a double money movement.
   */
  private async transition(input: {
    id: string;
    actorUserId: string;
    ownerId?: string;
    allowedFrom: PayoutRequestStatus[];
    terminalStatus: PayoutRequestStatus;
    toStatus: PayoutRequestStatus;
    eventType: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
    eventKeyPrefix: string;
    setReview?: boolean;
    rejectionReason?: string;
    releaseReservation?: boolean;
    complete?: { paymentUtr: string; actorUserId: string };
  }): Promise<PayoutRequestResponseDto> {
    const id = input.id;
    const before = await this.prisma.payoutRequest.findUnique({
      where: { id },
      include: { payoutMethod: { select: { id: true, methodType: true, maskedLabel: true } } },
    });
    if (!before || (input.ownerId !== undefined && before.userId !== input.ownerId)) {
      throw new NotFoundException('Payout request not found');
    }
    if (before.status === input.terminalStatus) {
      // Idempotent: already in the requested terminal/next state.
      return this.toResponse(before, before.payoutMethod, false);
    }
    if (!input.allowedFrom.includes(before.status)) {
      throw new ConflictException(`Cannot move payout request from ${before.status} to ${input.toStatus}`);
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const now = new Date();
        const cas = await tx.payoutRequest.updateMany({
          where: { id, status: { in: input.allowedFrom } },
          data: {
            status: input.toStatus,
            ...(input.setReview || input.complete
              ? {
                  reviewedByUserId: before.reviewedByUserId ?? input.actorUserId,
                  reviewedAt: before.reviewedAt ?? now,
                }
              : {}),
            ...(input.rejectionReason ? { rejectionReason: input.rejectionReason } : {}),
            ...(input.complete
              ? {
                  completedByUserId: input.complete.actorUserId,
                  completedAt: now,
                  paymentUtr: input.complete.paymentUtr,
                }
              : {}),
          },
        });
        if (cas.count === 0) {
          throw new ConflictException('Payout request changed concurrently — retry');
        }

        const event = await tx.payoutRequestEvent.create({
          data: {
            payoutRequestId: id,
            eventType: input.eventType,
            fromStatus: before.status,
            toStatus: input.toStatus,
            actorUserId: input.actorUserId,
            eventKey: `${input.eventKeyPrefix}|${id}`,
            safeMetadata: input.complete
              ? { paymentUtrSuffix: input.complete.paymentUtr.slice(-4) }
              : {},
          },
          select: { id: true },
        });

        const amount = before.amountMinorUnits;
        const currency = before.currency;

        if (input.releaseReservation) {
          await this.ledger.postWithin(tx, {
            userId: before.userId,
            currency,
            transactionType: 'WITHDRAWAL_RELEASE',
            referenceType: 'payout_request',
            referenceId: id,
            idempotencyKey: ledgerKeys.withdrawalRelease(event.id),
            lines: [
              { bucket: 'RESERVED', amountMinorUnits: -amount },
              { bucket: 'AVAILABLE', amountMinorUnits: amount },
            ],
            guard: (balances) => {
              if (balances.reservedMinorUnits < amount) {
                throw new ConflictException('reserved balance is inconsistent with this payout request');
              }
            },
          });
        }

        if (input.complete) {
          await this.ledger.postWithin(tx, {
            userId: before.userId,
            currency,
            transactionType: 'WITHDRAWAL_COMPLETION',
            referenceType: 'payout_request',
            referenceId: id,
            idempotencyKey: ledgerKeys.withdrawalCompletion(id),
            lines: [
              { bucket: 'RESERVED', amountMinorUnits: -amount },
              { bucket: 'WITHDRAWN', amountMinorUnits: amount },
            ],
            guard: (balances) => {
              if (balances.reservedMinorUnits < amount) {
                throw new ConflictException('reserved balance is inconsistent with this payout request');
              }
            },
          });
        }
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error) || error instanceof ConflictException) {
        // Concurrent duplicate action — return the settled state instead of failing the caller.
        const settled = await this.prisma.payoutRequest.findUnique({
          where: { id },
          include: { payoutMethod: { select: { id: true, methodType: true, maskedLabel: true } } },
        });
        if (settled && settled.status === input.terminalStatus) {
          return this.toResponse(settled, settled.payoutMethod, false);
        }
        if (error instanceof ConflictException) {
          throw error;
        }
      }
      throw error;
    }

    const after = await this.prisma.payoutRequest.findUniqueOrThrow({
      where: { id },
      include: { payoutMethod: { select: { id: true, methodType: true, maskedLabel: true } } },
    });
    // `ledgerPosted` answers "did THIS action move money?" — approve only changes status.
    return this.toResponse(after, after.payoutMethod, Boolean(input.releaseReservation || input.complete));
  }

  private async requireAdminActor(): Promise<{ id: string }> {
    const configured = this.config.get<string>('ADMIN_ACTOR_USER_ID')?.trim();
    if (!configured) {
      throw new ServiceUnavailableException(
        'ADMIN_ACTOR_USER_ID is not configured — admin payout decisions are disabled',
      );
    }
    const user = await this.prisma.user.findUnique({ where: { id: configured }, select: { id: true } });
    if (!user) {
      throw new ServiceUnavailableException('ADMIN_ACTOR_USER_ID does not reference an existing user');
    }
    return user;
  }

  private toResponse(
    row: PayoutRequest,
    method: MethodRow,
    ledgerPosted?: boolean,
  ): PayoutRequestResponseDto {
    return {
      id: row.id,
      status: row.status,
      amountMinorUnits: formatMinorUnits(row.amountMinorUnits),
      currency: row.currency,
      payoutMethod: { id: method.id, methodType: method.methodType, maskedLabel: method.maskedLabel },
      idempotencyKey: row.idempotencyKey,
      requestedAt: row.requestedAt.toISOString(),
      reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      rejectionReason: row.rejectionReason,
      paymentUtr: row.paymentUtr,
      ...(ledgerPosted === undefined ? {} : { ledgerPosted }),
    };
  }
}
