import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderEventType } from '@prisma/client';
import { CommissionService } from '../commission/commission.service';
import { formatMinorUnits, parseMinorUnits } from '../common/money.util';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { IdentityService } from '../identity/identity.service';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService, ledgerKeys } from '../wallet/ledger.service';
import { VerifiedOrderEventResponseDto } from './dto/order-event-response.dto';
import { OrderEventTypeDto, VerifiedOrderEventDto } from './dto/verified-order-event.dto';

const DEFAULT_SOURCE_SYSTEM = 'andos-main-app';
const DEFAULT_CURRENCY = 'INR';

/** Locked hold window: 7 days (168 hours) from the ORDER_COMPLETED timestamp. */
export const DEFAULT_COMMISSION_HOLD_HOURS = 168;

type RejectionReason = 'NO_ATTRIBUTION' | 'SELF_REFERRAL' | 'NO_PRIOR_CREDIT' | 'ORDER_ALREADY_CREDITED';

/**
 * Sprint 3 — trusted order events drive the commission ledger.
 *
 *  ORDER_COMPLETED: first-touch attribution decides the beneficiary; the promo code selects
 *    the rate only; commission = floor(netPaid * rateBps / 10000) is locked into the wallet
 *    PENDING bucket for 168 h (wallet-ledger transaction COMMISSION_LOCKED).
 *  ORDER_CANCELLED / ORDER_REFUNDED: append a linked compensating COMMISSION_REVERSAL entry
 *    (PENDING if still held, AVAILABLE if already released) — posted rows are never edited.
 *
 * Idempotency: the order event is unique per `sourceEventId` (and a partial unique index
 * blocks a second ORDER_COMPLETED for the same order); each ledger movement has its own
 * idempotency key, so replaying a whole webhook is always safe and self-healing.
 */
@Injectable()
export class OrderEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly identity: IdentityService,
    private readonly commission: CommissionService,
    private readonly ledger: LedgerService,
    private readonly config: ConfigService,
  ) {}

  private holdHours(): number {
    return this.config.get<number>('COMMISSION_HOLD_HOURS') ?? DEFAULT_COMMISSION_HOLD_HOURS;
  }

  async recordVerified(dto: VerifiedOrderEventDto): Promise<VerifiedOrderEventResponseDto> {
    const user = await this.identity.resolveEventUser({
      referredUserId: dto.referredUserId,
      externalUserId: dto.externalUserId,
    });

    // First-touch wins: the referred user's single attribution is the beneficiary.
    const attribution = await this.prisma.referralAttribution.findFirst({
      where: { referredUserId: user.id },
      select: {
        id: true,
        referrerUserId: true,
        campaignId: true,
        referralCode: { select: { owner: { select: { id: true, externalSubject: true } } } },
      },
    });
    if (!attribution) {
      return this.rejected('NO_ATTRIBUTION');
    }

    // Self-referral is never valid — checked on the internal id and on the Firebase identity.
    const referrerExternal = attribution.referralCode.owner.externalSubject;
    if (
      attribution.referrerUserId === user.id ||
      (referrerExternal !== null && user.externalSubject !== null && referrerExternal === user.externalSubject)
    ) {
      return this.rejected('SELF_REFERRAL');
    }

    return dto.eventType === OrderEventTypeDto.ORDER_COMPLETED
      ? this.recordCompleted(dto, attribution.id, attribution.referrerUserId, attribution.campaignId)
      : this.recordReversal(dto, attribution.id, attribution.referrerUserId);
  }

  private async recordCompleted(
    dto: VerifiedOrderEventDto,
    attributionId: string,
    referrerUserId: string,
    campaignId: string | null,
  ): Promise<VerifiedOrderEventResponseDto> {
    if (!dto.netPaidAmountPaise) {
      throw new BadRequestException('netPaidAmountPaise is required for ORDER_COMPLETED');
    }
    const currency = dto.currency ?? DEFAULT_CURRENCY;
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const base = parseMinorUnits(dto.netPaidAmountPaise, 'netPaidAmountPaise');
    const sourceSystem = dto.sourceSystem ?? DEFAULT_SOURCE_SYSTEM;

    const quote = await this.commission.quote({
      baseMinorUnits: base,
      appliedPromoCode: dto.appliedPromoCode ?? null,
      campaignId,
      at: occurredAt,
      currency,
    });

    // Create (or find) the order event — idempotent on both the event id and the order id.
    let orderEventId: string;
    let createdNow = false;
    try {
      const created = await this.prisma.referralOrderEvent.create({
        data: {
          sourceSystem,
          sourceEventId: dto.sourceEventId,
          eventType: OrderEventType.ORDER_COMPLETED,
          orderId: dto.orderId,
          referralAttributionId: attributionId,
          commissionableNetAmountMinorUnits: base,
          refundAmountMinorUnits: 0n,
          currency,
          appliedPromoCodeInput: dto.appliedPromoCode ?? null,
          promoCodeNormalized: quote.canonicalPromoCode,
          occurredAt,
        },
        select: { id: true },
      });
      orderEventId = created.id;
      createdNow = true;
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }
      const existing = await this.prisma.referralOrderEvent.findFirst({
        where: { sourceSystem, sourceEventId: dto.sourceEventId },
        select: { id: true },
      });
      if (!existing) {
        // The partial unique index (source_system, order_id) fired: a different event id
        // tried to credit the same order again.
        return this.rejected('ORDER_ALREADY_CREDITED');
      }
      orderEventId = existing.id;
    }

    // Always attempt the ledger posting (idempotent) — this also repairs a crash that
    // happened between storing the event and posting the commission.
    let ledgerPosted = false;
    if (quote.commissionMinorUnits > 0n) {
      const posted = await this.ledger.post({
        userId: referrerUserId,
        currency,
        transactionType: 'COMMISSION_LOCKED',
        referenceType: 'order_event',
        referenceId: orderEventId,
        idempotencyKey: ledgerKeys.commissionLock(orderEventId),
        lines: [{ bucket: 'PENDING', amountMinorUnits: quote.commissionMinorUnits }],
        ruleId: quote.rule.id,
        sourceEventId: dto.sourceEventId,
        commissionBaseMinorUnits: base,
        rateBps: quote.rateBps,
        commissionMinorUnits: quote.commissionMinorUnits,
        promoCodeNormalized: quote.canonicalPromoCode,
      });
      ledgerPosted = !posted.deduplicated;
    }

    return {
      recorded: true,
      deduplicated: !createdNow,
      eventType: dto.eventType,
      orderEventId,
      attributionId,
      referrerUserId,
      commissionBaseMinorUnits: formatMinorUnits(base),
      rateBps: quote.rateBps,
      rewardRuleKey: quote.rule.ruleKey,
      rewardRuleVersion: quote.rule.ruleVersion,
      promoCodeNormalized: quote.canonicalPromoCode,
      commissionMinorUnits: formatMinorUnits(quote.commissionMinorUnits),
      rewardEligibility: 'HOLD',
      holdReleaseEligibleAt: new Date(
        occurredAt.getTime() + this.holdHours() * 60 * 60 * 1000,
      ).toISOString(),
      ledgerPosted,
    };
  }

  private async recordReversal(
    dto: VerifiedOrderEventDto,
    attributionId: string,
    referrerUserId: string,
  ): Promise<VerifiedOrderEventResponseDto> {
    const currency = dto.currency ?? DEFAULT_CURRENCY;
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const sourceSystem = dto.sourceSystem ?? DEFAULT_SOURCE_SYSTEM;
    const refundAmount = dto.refundAmountPaise
      ? parseMinorUnits(dto.refundAmountPaise, 'refundAmountPaise')
      : 0n;
    const eventType =
      dto.eventType === OrderEventTypeDto.ORDER_REFUNDED
        ? OrderEventType.ORDER_REFUNDED
        : OrderEventType.ORDER_CANCELLED;

    // Record the cancellation/refund event itself (idempotent per source event id).
    let createdNow = false;
    let orderEventId: string;
    try {
      const created = await this.prisma.referralOrderEvent.create({
        data: {
          sourceSystem,
          sourceEventId: dto.sourceEventId,
          eventType,
          orderId: dto.orderId,
          referralAttributionId: attributionId,
          commissionableNetAmountMinorUnits: 0n,
          refundAmountMinorUnits: refundAmount,
          currency,
          occurredAt,
        },
        select: { id: true },
      });
      orderEventId = created.id;
      createdNow = true;
    } catch (error) {
      if (!isUniqueConstraintViolation(error)) {
        throw error;
      }
      const existing = await this.prisma.referralOrderEvent.findFirst({
        where: { sourceSystem, sourceEventId: dto.sourceEventId },
        select: { id: true },
      });
      if (!existing) {
        throw new ConflictException('Order event conflicts with an existing record for this order');
      }
      orderEventId = existing.id;
    }

    // Find the original credit for this order — scoped to the SAME attribution, so one
    // referred user's refund can never touch another user's credit for a shared order id.
    const completed = await this.prisma.referralOrderEvent.findFirst({
      where: {
        sourceSystem,
        orderId: dto.orderId,
        eventType: OrderEventType.ORDER_COMPLETED,
        referralAttributionId: attributionId,
      },
      orderBy: { occurredAt: 'asc' },
      select: { id: true },
    });
    if (!completed) {
      return {
        ...this.rejected('NO_PRIOR_CREDIT'),
        recorded: true,
        deduplicated: !createdNow,
        eventType: dto.eventType,
        orderEventId,
        attributionId,
        reversed: false,
      };
    }

    const lockTransaction = await this.prisma.walletLedgerTransaction.findUnique({
      where: { idempotencyKey: ledgerKeys.commissionLock(completed.id) },
      select: { commissionMinorUnits: true },
    });
    const commission = lockTransaction?.commissionMinorUnits ?? 0n;
    if (!lockTransaction || commission === 0n) {
      return {
        ...this.rejected('NO_PRIOR_CREDIT'),
        recorded: true,
        deduplicated: !createdNow,
        eventType: dto.eventType,
        orderEventId,
        attributionId,
        reversed: false,
      };
    }

    // Prefer reversing from PENDING (still held). If a release already happened (or races
    // with us), the guard fails and we retry from AVAILABLE — the ledger stays append-only.
    const releasePosted = await this.prisma.walletLedgerTransaction.findUnique({
      where: { idempotencyKey: ledgerKeys.commissionRelease(completed.id) },
      select: { id: true },
    });
    const bucket = releasePosted ? 'AVAILABLE' : 'PENDING';

    const post = (targetBucket: 'PENDING' | 'AVAILABLE') =>
      this.ledger.post({
        userId: referrerUserId,
        currency,
        transactionType: 'COMMISSION_REVERSAL',
        referenceType: 'order_event',
        referenceId: completed.id,
        idempotencyKey: ledgerKeys.commissionReversal(completed.id),
        lines: [{ bucket: targetBucket, amountMinorUnits: -commission }],
        guard: (balances) => {
          const available = targetBucket === 'PENDING' ? balances.pendingMinorUnits : undefined;
          if (targetBucket === 'PENDING' && available !== undefined && available < commission) {
            throw new ConflictException('commission is no longer held in PENDING');
          }
        },
      });

    let reversed = false;
    let reversalBucket = bucket;
    try {
      const posted = await post(bucket);
      reversed = !posted.deduplicated;
    } catch (error) {
      if (!(error instanceof ConflictException) || bucket !== 'PENDING') {
        throw error;
      }
      const posted = await post('AVAILABLE');
      reversed = !posted.deduplicated;
      reversalBucket = 'AVAILABLE';
    }

    return {
      recorded: true,
      deduplicated: !createdNow,
      eventType: dto.eventType,
      orderEventId,
      attributionId,
      reversed,
      reversalBucket: reversed ? reversalBucket : undefined,
      commissionMinorUnits: formatMinorUnits(commission),
    };
  }

  private rejected(reason: RejectionReason): VerifiedOrderEventResponseDto {
    return { recorded: false, deduplicated: false, reason };
  }
}
