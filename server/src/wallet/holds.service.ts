import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_COMMISSION_HOLD_HOURS } from '../order-events/order-events.service';
import { LedgerService, ledgerKeys } from './ledger.service';

export interface ReleaseSweepResult {
  cutoff: string;
  scanned: number;
  released: number;
  skipped: number;
  failed: number;
}

/**
 * The 7-day (168 h) reward hold: released commissions move PENDING → AVAILABLE once the
 * window has elapsed, unless the order was cancelled/refunded in the meantime.
 *
 * `sweep()` is idempotent and race-safe (every release carries its own ledger idempotency
 * key + a PENDING balance guard), so it can be called by a cron/BullMQ worker, by ops, or
 * from several instances at once without double-releasing.
 */
@Injectable()
export class HoldsService {
  private readonly logger = new Logger(HoldsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly config: ConfigService,
  ) {}

  async sweep(limit = 200): Promise<ReleaseSweepResult> {
    const now = Date.now();
    const holdHours = this.config.get<number>('COMMISSION_HOLD_HOURS') ?? DEFAULT_COMMISSION_HOLD_HOURS;
    const cutoff = new Date(now - holdHours * 60 * 60 * 1000);

    const candidates = await this.prisma.referralOrderEvent.findMany({
      where: { eventType: OrderEventType.ORDER_COMPLETED, occurredAt: { lte: cutoff } },
      orderBy: { occurredAt: 'asc' },
      take: limit,
      select: {
        id: true,
        sourceSystem: true,
        orderId: true,
        occurredAt: true,
        attribution: { select: { referrerUserId: true } },
      },
    });

    const result: ReleaseSweepResult = {
      cutoff: cutoff.toISOString(),
      scanned: candidates.length,
      released: 0,
      skipped: 0,
      failed: 0,
    };
    if (candidates.length === 0) {
      return result;
    }

    const ids = candidates.map((candidate) => candidate.id);
    const [lockTransactions, releaseTransactions, reversalTransactions] = await Promise.all([
      this.prisma.walletLedgerTransaction.findMany({
        where: { idempotencyKey: { in: ids.map((id) => ledgerKeys.commissionLock(id)) } },
        select: { idempotencyKey: true, commissionMinorUnits: true, currency: true },
      }),
      this.prisma.walletLedgerTransaction.findMany({
        where: { idempotencyKey: { in: ids.map((id) => ledgerKeys.commissionRelease(id)) } },
        select: { idempotencyKey: true },
      }),
      this.prisma.walletLedgerTransaction.findMany({
        where: { idempotencyKey: { in: ids.map((id) => ledgerKeys.commissionReversal(id)) } },
        select: { idempotencyKey: true },
      }),
    ]);

    const lockById = new Map(lockTransactions.map((t) => [t.idempotencyKey, t]));
    const releasedIds = new Set(releaseTransactions.map((t) => t.idempotencyKey));
    const reversedIds = new Set(reversalTransactions.map((t) => t.idempotencyKey));

    for (const candidate of candidates) {
      const lockKey = ledgerKeys.commissionLock(candidate.id);
      const releaseKey = ledgerKeys.commissionRelease(candidate.id);
      const reversalKey = ledgerKeys.commissionReversal(candidate.id);
      const lock = lockById.get(lockKey);
      const commission = lock?.commissionMinorUnits ?? 0n;

      if (!lock || commission === 0n || releasedIds.has(releaseKey) || reversedIds.has(reversalKey)) {
        result.skipped += 1;
        continue;
      }

      try {
        const posted = await this.ledger.post({
          userId: candidate.attribution.referrerUserId,
          currency: lock.currency,
          transactionType: 'COMMISSION_RELEASE',
          referenceType: 'order_event',
          referenceId: candidate.id,
          idempotencyKey: releaseKey,
          lines: [
            { bucket: 'PENDING', amountMinorUnits: -commission },
            { bucket: 'AVAILABLE', amountMinorUnits: commission },
          ],
          guard: (balances) => {
            if (balances.pendingMinorUnits < commission) {
              throw new ConflictException('held commission is no longer in PENDING');
            }
          },
        });
        if (posted.deduplicated) {
          result.skipped += 1;
        } else {
          result.released += 1;
        }
      } catch (error) {
        // A concurrent reversal (cancel/refund) or sweep won the race — that is not an error.
        if (error instanceof ConflictException || isUniqueViolation(error)) {
          result.skipped += 1;
          continue;
        }
        this.logger.error(`hold release failed for order event ${candidate.id}`, error as Error);
        result.failed += 1;
      }
    }

    return result;
  }
}

function isUniqueViolation(error: unknown): boolean {
  return (error as { code?: unknown } | null)?.code === 'P2002';
}

/** Same instant the sweep becomes eligible for, given the configured window. */
export function holdReleaseEligibleAt(occurredAt: Date, holdHours = DEFAULT_COMMISSION_HOLD_HOURS): Date {
  return new Date(occurredAt.getTime() + holdHours * 60 * 60 * 1000);
}
