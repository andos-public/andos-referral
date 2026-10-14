import { ConflictException, Injectable } from '@nestjs/common';
import { LedgerTransactionType, Prisma } from '@prisma/client';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import {
  LedgerLine,
  WalletBalances,
  balancesFromEntries,
  BUCKET_COLUMN,
} from './wallet-balance.util';

export interface LedgerPostParams {
  userId: string;
  currency: string;
  transactionType: LedgerTransactionType;
  referenceType: 'order_event' | 'payout_request';
  referenceId: string;
  idempotencyKey: string;
  lines: readonly LedgerLine[];
  guard?: (balances: WalletBalances) => void;
  ruleId?: string | null;
  sourceEventId?: string | null;
  commissionBaseMinorUnits?: bigint | null;
  rateBps?: number | null;
  commissionMinorUnits?: bigint | null;
  promoCodeNormalized?: string | null;
}

export interface LedgerPostResult {
  deduplicated: boolean;
  transactionId: string | null;
}

/**
 * Append-only ledger writer. Every money movement is a transaction row plus entries; the
 * `wallet_accounts` projection is updated in the SAME transaction under a row lock
 * (`SELECT ... FOR UPDATE`), so concurrent requests can never oversell.
 *
 * Guarantees:
 *  - entries are never updated or deleted (append-only);
 *  - each transaction carries a unique idempotency key — replays are reported, not duplicated;
 *  - callers pass a `guard` that fails the whole transaction when a balance rule is violated
 *    (e.g. reserving more than AVAILABLE).
 */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Standalone posting: runs in its own transaction and reports replays as `deduplicated`. */
  async post(params: LedgerPostParams): Promise<LedgerPostResult> {
    try {
      const transactionId = await this.prisma.$transaction((tx) => this.runPost(tx, params));
      return { deduplicated: false, transactionId };
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        // Same idempotency key already posted — the append-only ledger stays untouched.
        return { deduplicated: true, transactionId: null };
      }
      throw error;
    }
  }

  /**
   * Posting inside a caller-provided transaction (used when a payout status change and its
   * ledger movement must commit atomically). Unique-key violations are NOT swallowed here —
   * they abort the caller's transaction, and the caller decides how to respond.
   */
  async postWithin(tx: Prisma.TransactionClient, params: LedgerPostParams): Promise<string> {
    return this.runPost(tx, params);
  }

  private async runPost(tx: Prisma.TransactionClient, params: LedgerPostParams): Promise<string> {
    this.assertLinesValid(params.lines);

    // 1) Ensure the projection row exists, then lock it for the whole posting.
    await tx.walletAccount.upsert({
      where: { userId_currency: { userId: params.userId, currency: params.currency } },
      create: { userId: params.userId, currency: params.currency },
      update: {},
    });
    const locked = await tx.$queryRaw<
      {
        pending_minor_units: bigint;
        available_minor_units: bigint;
        reserved_minor_units: bigint;
        withdrawn_minor_units: bigint;
      }[]
    >`SELECT pending_minor_units, available_minor_units, reserved_minor_units, withdrawn_minor_units
        FROM referral_app.wallet_accounts
       WHERE user_id = ${params.userId}::uuid AND currency = ${params.currency}
       FOR UPDATE`;
    const current: WalletBalances = {
      pendingMinorUnits: locked[0].pending_minor_units,
      availableMinorUnits: locked[0].available_minor_units,
      reservedMinorUnits: locked[0].reserved_minor_units,
      withdrawnMinorUnits: locked[0].withdrawn_minor_units,
    };

    // 2) Business guard (throws → the whole transaction rolls back, no partial write).
    params.guard?.(current);

    // 3) Append the transaction + entries.
    const transaction = await tx.walletLedgerTransaction.create({
      data: {
        userId: params.userId,
        currency: params.currency,
        transactionType: params.transactionType,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        idempotencyKey: params.idempotencyKey,
        ruleId: params.ruleId ?? null,
        sourceEventId: params.sourceEventId ?? null,
        commissionBaseMinorUnits: params.commissionBaseMinorUnits ?? null,
        rateBps: params.rateBps ?? null,
        commissionMinorUnits: params.commissionMinorUnits ?? null,
        promoCodeNormalized: params.promoCodeNormalized ?? null,
        entries: {
          create: params.lines.map((line, index) => ({
            lineNumber: index + 1,
            bucket: line.bucket,
            amountMinorUnits: line.amountMinorUnits,
          })),
        },
      },
      select: { id: true },
    });

    // 4) Update the rebuildable projection with the same deltas.
    const data: Prisma.WalletAccountUpdateInput = {};
    for (const line of params.lines) {
      const column = BUCKET_COLUMN[line.bucket];
      data[column] = { increment: line.amountMinorUnits };
    }
    await tx.walletAccount.update({
      where: { userId_currency: { userId: params.userId, currency: params.currency } },
      data,
    });

    return transaction.id;
  }

  /** Current projection values (fast path; the ledger remains the source of truth). */
  async getBalances(userId: string, currency = 'INR'): Promise<WalletBalances & { updatedAt: Date | null }> {
    const account = await this.prisma.walletAccount.findUnique({
      where: { userId_currency: { userId, currency } },
      select: {
        pendingMinorUnits: true,
        availableMinorUnits: true,
        reservedMinorUnits: true,
        withdrawnMinorUnits: true,
        updatedAt: true,
      },
    });
    if (!account) {
      return {
        pendingMinorUnits: 0n,
        availableMinorUnits: 0n,
        reservedMinorUnits: 0n,
        withdrawnMinorUnits: 0n,
        updatedAt: null,
      };
    }
    return { ...account };
  }

  /** Rebuilds balances from the append-only entries — used by verification/tests. */
  async projectBalancesFromLedger(userId: string, currency = 'INR'): Promise<WalletBalances> {
    const entries = await this.prisma.walletLedgerEntry.findMany({
      where: { transaction: { userId, currency } },
      select: { bucket: true, amountMinorUnits: true },
    });
    return balancesFromEntries(entries);
  }

  async findTransactionByIdempotencyKey(idempotencyKey: string): Promise<{ id: string } | null> {
    return this.prisma.walletLedgerTransaction.findUnique({
      where: { idempotencyKey },
      select: { id: true },
    });
  }

  private assertLinesValid(lines: readonly LedgerLine[]): void {
    if (lines.length === 0) {
      throw new ConflictException('a ledger transaction must have at least one entry');
    }
    for (const line of lines) {
      if (line.amountMinorUnits === 0n) {
        // Mirrors the DB CHECK wallet_ledger_entries_amount_chk.
        throw new ConflictException('ledger entries must not be zero');
      }
    }
  }
}

/** Canonical idempotency keys — one logical money movement per key, forever. */
export const ledgerKeys = {
  commissionLock: (orderEventId: string): string => `commission-lock|${orderEventId}`,
  commissionRelease: (orderEventId: string): string => `commission-release|${orderEventId}`,
  commissionReversal: (orderEventId: string): string => `commission-reversal|${orderEventId}`,
  withdrawalReservation: (payoutRequestId: string): string => `withdrawal-reservation|${payoutRequestId}`,
  withdrawalRelease: (payoutRequestEventId: string): string => `withdrawal-release|${payoutRequestEventId}`,
  withdrawalCompletion: (payoutRequestId: string): string => `withdrawal-completion|${payoutRequestId}`,
};
