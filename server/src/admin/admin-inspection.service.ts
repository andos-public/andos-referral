import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { formatMinorUnits } from '../common/money.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminHoldListDto,
  AdminHoldRowDto,
  AdminUserListDto,
  AdminUserSummaryDto,
  HoldStatus,
  ListAdminUsersQueryDto,
  ListHoldsQueryDto,
} from './admin.dto';

/**
 * Read-only inspection surface for the Phase-1 admin console: users, wallets, referrals and the
 * commission-hold queue. Nothing here mutates state — every write stays behind an audited action.
 */
@Injectable()
export class AdminInspectionService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(query: ListAdminUsersQueryDto): Promise<AdminUserListDto> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    const where: Prisma.UserWhereInput = {
      ...(query.accountStatus ? { accountStatus: query.accountStatus as never } : {}),
      ...(query.query
        ? {
            OR: [
              { username: { contains: query.query, mode: 'insensitive' } },
              { displayName: { contains: query.query, mode: 'insensitive' } },
              { externalSubject: { contains: query.query, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.hasReferralCode === 'true' ? { referralCodes: { some: {} } } : {}),
      ...(query.hasReferralCode === 'false' ? { referralCodes: { none: {} } } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          username: true,
          displayName: true,
          externalSubject: true,
          accountStatus: true,
          createdAt: true,
          _count: { select: { referralCodes: true, attributionsAsReferred: true } },
          walletAccounts: {
            select: {
              currency: true,
              pendingMinorUnits: true,
              availableMinorUnits: true,
              reservedMinorUnits: true,
              withdrawnMinorUnits: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const referredByByUser = await this.referredByMap(rows.map((row) => row.id));

    return {
      data: rows.map((row) => ({
        id: row.id,
        username: row.username,
        displayName: row.displayName,
        externalSubject: row.externalSubject,
        accountStatus: row.accountStatus,
        createdAt: row.createdAt.toISOString(),
        referralSummary: {
          referralCodes: row._count.referralCodes,
          referredUsers: row._count.attributionsAsReferred,
          referredBy: referredByByUser.get(row.id) ?? null,
        },
        wallet: this.walletSummary(row.walletAccounts),
      })),
      total,
      limit,
      offset,
    };
  }

  /** Full bundle for one user: identity, codes, attributions (both directions), wallet, payouts. */
  async userDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        externalSubject: true,
        accountStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [codes, asReferrer, asReferred, wallet, payoutMethods, payoutRequests] = await this.prisma.$transaction([
      this.prisma.referralCode.findMany({
        where: { ownerUserId: userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, publicCode: true, isActive: true, expiresAt: true, createdAt: true },
      }),
      this.prisma.referralAttribution.findMany({
        where: { referrerUserId: userId },
        orderBy: { attributedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          referredUserId: true,
          attributedAt: true,
          mainAppInstallLoginAt: true,
          chatAccess: { select: { accessState: true, unlockedAt: true } },
          referralEvents: {
            where: { eventType: 'SIGNUP' },
            orderBy: { occurredAt: 'asc' },
            take: 1,
            select: { occurredAt: true },
          },
        },
      }),
      this.prisma.referralAttribution.findMany({
        where: { referredUserId: userId },
        select: { id: true, referrerUserId: true, attributedAt: true, referralCodeId: true },
      }),
      this.prisma.walletAccount.findMany({
        where: { userId },
        select: {
          currency: true,
          pendingMinorUnits: true,
          availableMinorUnits: true,
          reservedMinorUnits: true,
          withdrawnMinorUnits: true,
          updatedAt: true,
        },
      }),
      this.prisma.payoutMethod.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true, methodType: true, maskedLabel: true, isActive: true, createdAt: true },
      }),
      this.prisma.payoutRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' },
        take: 25,
        select: {
          id: true,
          status: true,
          amountMinorUnits: true,
          currency: true,
          requestedAt: true,
          reviewedAt: true,
          completedAt: true,
          paymentUtr: true,
          rejectionReason: true,
        },
      }),
    ]);

    return {
      user: { ...user, createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString() },
      referralCodes: codes.map((code) => ({
        ...code,
        expiresAt: code.expiresAt?.toISOString() ?? null,
        createdAt: code.createdAt.toISOString(),
      })),
      attributionsAsReferrer: asReferrer.map((row) => ({
        id: row.id,
        referredUserId: row.referredUserId,
        attributedAt: row.attributedAt.toISOString(),
        signedUpAt: row.referralEvents[0]?.occurredAt.toISOString() ?? null,
        installLoginVerifiedAt: row.mainAppInstallLoginAt?.toISOString() ?? null,
        chatAccessState: row.chatAccess?.accessState ?? 'LOCKED',
        chatUnlockedAt: row.chatAccess?.unlockedAt?.toISOString() ?? null,
      })),
      attributionAsReferred: asReferred.map((row) => ({
        id: row.id,
        referrerUserId: row.referrerUserId,
        referralCodeId: row.referralCodeId,
        attributedAt: row.attributedAt.toISOString(),
      })),
      wallet: wallet.map((row) => ({
        currency: row.currency,
        balances: {
          pendingMinorUnits: formatMinorUnits(row.pendingMinorUnits),
          availableMinorUnits: formatMinorUnits(row.availableMinorUnits),
          reservedMinorUnits: formatMinorUnits(row.reservedMinorUnits),
          withdrawnMinorUnits: formatMinorUnits(row.withdrawnMinorUnits),
        },
        updatedAt: row.updatedAt.toISOString(),
      })),
      payoutMethods,
      payoutRequests: payoutRequests.map((row) => ({
        ...row,
        amountMinorUnits: formatMinorUnits(row.amountMinorUnits),
        requestedAt: row.requestedAt.toISOString(),
        reviewedAt: row.reviewedAt?.toISOString() ?? null,
        completedAt: row.completedAt?.toISOString() ?? null,
      })),
    };
  }

  /** Wallet + ledger page for one user (admin sees exactly what the user sees, plus totals). */
  async walletDetail(userId: string, limit: number, offset: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [accounts, transactions, total] = await this.prisma.$transaction([
      this.prisma.walletAccount.findMany({ where: { userId }, select: { currency: true, pendingMinorUnits: true, availableMinorUnits: true, reservedMinorUnits: true, withdrawnMinorUnits: true } }),
      this.prisma.walletLedgerTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: { entries: { select: { bucket: true, amountMinorUnits: true } } },
      }),
      this.prisma.walletLedgerTransaction.count({ where: { userId } }),
    ]);

    return {
      userId,
      balances: accounts.map((row) => ({
        currency: row.currency,
        pendingMinorUnits: formatMinorUnits(row.pendingMinorUnits),
        availableMinorUnits: formatMinorUnits(row.availableMinorUnits),
        reservedMinorUnits: formatMinorUnits(row.reservedMinorUnits),
        withdrawnMinorUnits: formatMinorUnits(row.withdrawnMinorUnits),
      })),
      ledger: {
        data: transactions.map((row) => ({
          id: row.id,
          transactionType: row.transactionType,
          referenceType: row.referenceType,
          referenceId: row.referenceId,
          commissionBaseMinorUnits: row.commissionBaseMinorUnits === null ? null : formatMinorUnits(row.commissionBaseMinorUnits),
          rateBps: row.rateBps,
          commissionMinorUnits: row.commissionMinorUnits === null ? null : formatMinorUnits(row.commissionMinorUnits),
          promoCodeNormalized: row.promoCodeNormalized,
          createdAt: row.createdAt.toISOString(),
          entries: row.entries.map((entry) => ({
            bucket: entry.bucket,
            amountMinorUnits: formatMinorUnits(entry.amountMinorUnits),
          })),
        })),
        total,
        limit,
        offset,
      },
    };
  }

  /** Attribution detail: participants, milestones, chat gate, order events and their ledger lines. */
  async referralDetail(attributionId: string) {
    const attribution = await this.prisma.referralAttribution.findUnique({
      where: { id: attributionId },
      include: {
        referredUser: { select: { id: true, username: true, externalSubject: true } },
        referralCode: { select: { id: true, publicCode: true, isActive: true } },
        chatAccess: { select: { accessState: true, unlockedAt: true, updatedAt: true } },
        referralEvents: { orderBy: { occurredAt: 'asc' }, select: { eventType: true, occurredAt: true } },
      },
    });
    if (!attribution) {
      throw new NotFoundException('Referral attribution not found');
    }

    const [referrer, orderEvents, referralEvents] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: attribution.referrerUserId },
        select: { id: true, username: true, externalSubject: true },
      }),
      this.prisma.referralOrderEvent.findMany({
        where: { referralAttributionId: attributionId },
        orderBy: { occurredAt: 'asc' },
        select: {
          id: true,
          eventType: true,
          orderId: true,
          sourceSystem: true,
          sourceEventId: true,
          commissionableNetAmountMinorUnits: true,
          refundAmountMinorUnits: true,
          promoCodeNormalized: true,
          occurredAt: true,
        },
      }),
      this.prisma.referralEvent.findMany({
        where: { attributionId },
        orderBy: { occurredAt: 'asc' },
        take: 100,
        select: { id: true, eventType: true, sourceSystem: true, sourceEventId: true, occurredAt: true },
      }),
    ]);
    const chatAccess = attribution.chatAccess;

    const ledgerLines = await this.prisma.walletLedgerTransaction.findMany({
      where: { referenceId: { in: orderEvents.map((event) => event.id) } },
      select: {
        id: true,
        transactionType: true,
        referenceId: true,
        commissionMinorUnits: true,
        rateBps: true,
        createdAt: true,
        entries: { select: { bucket: true, amountMinorUnits: true } },
      },
    });

    return {
      attribution: {
        id: attribution.id,
        firstTouchAt: attribution.attributedAt.toISOString(),
        signedUpAt:
          attribution.referralEvents
            .filter((event) => event.eventType === 'SIGNUP')
            .map((event) => event.occurredAt.toISOString())
            .sort()[0] ?? null,
        installLoginVerifiedAt: attribution.mainAppInstallLoginAt?.toISOString() ?? null,
        referralCode: attribution.referralCode,
        referrer,
        referredUser: attribution.referredUser,
      },
      chatAccess: chatAccess
        ? {
            state: chatAccess.accessState,
            unlockedAt: chatAccess.unlockedAt?.toISOString() ?? null,
            updatedAt: chatAccess.updatedAt.toISOString(),
          }
        : { state: 'LOCKED', unlockedAt: null, updatedAt: null },
      orderEvents: orderEvents.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        orderId: event.orderId,
        sourceSystem: event.sourceSystem,
        sourceEventId: event.sourceEventId,
        commissionableNetAmountMinorUnits:
          event.commissionableNetAmountMinorUnits === null
            ? null
            : formatMinorUnits(event.commissionableNetAmountMinorUnits),
        refundAmountMinorUnits:
          event.refundAmountMinorUnits === null ? null : formatMinorUnits(event.refundAmountMinorUnits),
        promoCodeNormalized: event.promoCodeNormalized,
        occurredAt: event.occurredAt.toISOString(),
      })),
      referralEvents: referralEvents.map((event) => ({
        ...event,
        occurredAt: event.occurredAt.toISOString(),
      })),
      ledger: ledgerLines.map((line) => ({
        id: line.id,
        transactionType: line.transactionType,
        referenceId: line.referenceId,
        commissionMinorUnits: line.commissionMinorUnits === null ? null : formatMinorUnits(line.commissionMinorUnits),
        rateBps: line.rateBps,
        createdAt: line.createdAt.toISOString(),
        entries: line.entries.map((entry) => ({
          bucket: entry.bucket,
          amountMinorUnits: formatMinorUnits(entry.amountMinorUnits),
        })),
      })),
    };
  }

  /**
   * Commission-hold queue: every COMMISSION_LOCKED posting with its eligibility instant and
   * current state (DUE / HELD / RELEASED / REVERSED). Computed in SQL so filters and pagination
   * stay correct across the whole table, not just the current page.
   */
  async listHolds(query: ListHoldsQueryDto): Promise<AdminHoldListDto> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    const holdHours = 168;
    const cutoff = new Date(Date.now() - holdHours * 3_600_000);

    const rows = await this.prisma.$queryRaw<
      {
        ledger_transaction_id: string;
        order_event_id: string;
        order_id: string;
        attribution_id: string;
        referrer_user_id: string;
        referred_user_id: string | null;
        commission_base: bigint | null;
        rate_bps: number | null;
        commission: bigint | null;
        occurred_at: Date;
        released_at: Date | null;
        reversed_at: Date | null;
        status: HoldStatus;
        total: bigint;
      }[]
    >(Prisma.sql`
      WITH locks AS (
        SELECT t.id AS ledger_transaction_id, t.reference_id AS order_event_id, t.user_id AS referrer_user_id,
               t.commission_base_minor_units AS commission_base, t.rate_bps, t.commission_minor_units AS commission,
               oe.occurred_at, oe.order_id, oe.referral_attribution_id AS attribution_id, a.referred_user_id
        FROM referral_app.wallet_ledger_transactions t
        JOIN referral_app.referral_order_events oe ON oe.id = t.reference_id
        JOIN referral_app.referral_attributions a ON a.id = oe.referral_attribution_id
        WHERE t.transaction_type = 'COMMISSION_LOCKED'
          AND (${query.referrerUserId ?? null}::uuid IS NULL OR t.user_id = ${query.referrerUserId ?? null}::uuid)
      ),
      rel AS (
        SELECT reference_id, min(created_at) AS released_at
        FROM referral_app.wallet_ledger_transactions WHERE transaction_type = 'COMMISSION_RELEASE' GROUP BY 1
      ),
      rev AS (
        SELECT reference_id, min(created_at) AS reversed_at
        FROM referral_app.wallet_ledger_transactions WHERE transaction_type = 'COMMISSION_REVERSAL' GROUP BY 1
      ),
      enriched AS (
        SELECT locks.*, rel.released_at, rev.reversed_at,
               CASE
                 WHEN rev.reversed_at IS NOT NULL THEN 'REVERSED'
                 WHEN rel.released_at IS NOT NULL THEN 'RELEASED'
                 WHEN locks.occurred_at <= ${cutoff} THEN 'DUE'
                 ELSE 'HELD'
               END AS status
        FROM locks
        LEFT JOIN rel ON rel.reference_id = locks.order_event_id
        LEFT JOIN rev ON rev.reference_id = locks.order_event_id
      )
      SELECT *, count(*) OVER () AS total
      FROM enriched
      WHERE (${query.status ?? null}::text IS NULL OR status = ${query.status ?? null}::text)
      ORDER BY occurred_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    const asOf = new Date();
    return {
      data: rows.map((row) => this.toHoldRow(row, holdHours, asOf)),
      total: Number(rows[0]?.total ?? 0n),
      limit,
      offset,
      asOf: asOf.toISOString(),
    };
  }

  private toHoldRow(
    row: {
      ledger_transaction_id: string;
      order_event_id: string;
      order_id: string;
      attribution_id: string;
      referrer_user_id: string;
      referred_user_id: string | null;
      commission_base: bigint | null;
      rate_bps: number | null;
      commission: bigint | null;
      occurred_at: Date;
      released_at: Date | null;
      reversed_at: Date | null;
      status: HoldStatus;
    },
    holdHours: number,
    asOf: Date,
  ): AdminHoldRowDto {
    const eligibleAt = new Date(row.occurred_at.getTime() + holdHours * 3_600_000);
    const dueInSeconds = Math.max(0, Math.round((eligibleAt.getTime() - asOf.getTime()) / 1000));
    return {
      ledgerTransactionId: row.ledger_transaction_id,
      orderEventId: row.order_event_id,
      orderId: row.order_id,
      attributionId: row.attribution_id,
      referrerUserId: row.referrer_user_id,
      referredUserId: row.referred_user_id,
      commissionBasePaise: formatMinorUnits(row.commission_base ?? 0n),
      rateBps: row.rate_bps ?? 0,
      commissionPaise: formatMinorUnits(row.commission ?? 0n),
      occurredAt: row.occurred_at.toISOString(),
      eligibleAt: eligibleAt.toISOString(),
      dueInSeconds: dueSecondsFor(row.status, dueInSeconds),
      status: row.status,
      releasedAt: row.released_at?.toISOString() ?? null,
      reversedAt: row.reversed_at?.toISOString() ?? null,
    };
  }

  private walletSummary(
    accounts: {
      currency: string;
      pendingMinorUnits: bigint;
      availableMinorUnits: bigint;
      reservedMinorUnits: bigint;
      withdrawnMinorUnits: bigint;
    }[],
  ): AdminUserSummaryDto['wallet'] {
    const preferred = accounts.find((account) => account.currency === 'INR') ?? accounts[0];
    return {
      pendingPaise: formatMinorUnits(preferred?.pendingMinorUnits ?? 0n),
      availablePaise: formatMinorUnits(preferred?.availableMinorUnits ?? 0n),
      reservedPaise: formatMinorUnits(preferred?.reservedMinorUnits ?? 0n),
      withdrawnPaise: formatMinorUnits(preferred?.withdrawnMinorUnits ?? 0n),
    };
  }

  private async referredByMap(userIds: string[]): Promise<Map<string, string>> {
    if (userIds.length === 0) {
      return new Map();
    }
    const rows = await this.prisma.referralAttribution.findMany({
      where: { referredUserId: { in: userIds } },
      select: { referredUserId: true, referrerUserId: true },
    });
    return new Map(rows.map((row) => [row.referredUserId, row.referrerUserId]));
  }
}

function dueSecondsFor(status: HoldStatus, computed: number): number {
  return status === 'HELD' ? computed : 0;
}
