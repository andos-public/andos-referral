import { LedgerBucket } from '@prisma/client';

/**
 * Pure wallet-balance math. `wallet_accounts` is a REBUILDABLE PROJECTION of the append-only
 * ledger, so the same functions are used to (a) update the projection and (b) recompute it
 * from entries in tests/verification — any drift is a bug.
 */
export interface WalletBalances {
  pendingMinorUnits: bigint;
  availableMinorUnits: bigint;
  reservedMinorUnits: bigint;
  withdrawnMinorUnits: bigint;
}

export interface LedgerLine {
  bucket: LedgerBucket;
  /** Signed minor units: positive credits the bucket, negative debits it. Never zero. */
  amountMinorUnits: bigint;
}

export const ZERO_BALANCES: WalletBalances = {
  pendingMinorUnits: 0n,
  availableMinorUnits: 0n,
  reservedMinorUnits: 0n,
  withdrawnMinorUnits: 0n,
};

export const BUCKET_COLUMN: Record<LedgerBucket, keyof WalletBalances> = {
  PENDING: 'pendingMinorUnits',
  AVAILABLE: 'availableMinorUnits',
  RESERVED: 'reservedMinorUnits',
  WITHDRAWN: 'withdrawnMinorUnits',
};

export function applyLines(balances: WalletBalances, lines: readonly LedgerLine[]): WalletBalances {
  const next: WalletBalances = { ...balances };
  for (const line of lines) {
    const column = BUCKET_COLUMN[line.bucket];
    next[column] = next[column] + line.amountMinorUnits;
  }
  return next;
}

/** Rebuilds balances from ledger entries — the projection must always equal this. */
export function balancesFromEntries(
  entries: readonly { bucket: LedgerBucket; amountMinorUnits: bigint }[],
): WalletBalances {
  return applyLines(
    ZERO_BALANCES,
    entries.map((entry) => ({ bucket: entry.bucket, amountMinorUnits: entry.amountMinorUnits })),
  );
}

/** Net movement across ALL buckets: zero for internal transfers (release/reserve), non-zero for credit/clawback. */
export function netMovement(lines: readonly LedgerLine[]): bigint {
  return lines.reduce((sum, line) => sum + line.amountMinorUnits, 0n);
}

/** Locked reward-hold total that is due for release — PENDING never goes negative in valid operation. */
export function isNonNegative(balances: WalletBalances, buckets: readonly (keyof WalletBalances)[]): boolean {
  return buckets.every((bucket) => balances[bucket] >= 0n);
}
