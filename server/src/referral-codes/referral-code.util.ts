import { createHash, createHmac, randomInt } from 'node:crypto';

/** Alphabet excludes visually ambiguous characters (0/O, 1/I) so codes are easy to read and dictate. */
export const PUBLIC_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const PUBLIC_CODE_LENGTH = 8;
export const PUBLIC_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{8}$/;
export const PUBLIC_CODE_INPUT_PATTERN = /^[A-Za-z0-9_-]{4,16}$/;

/**
 * PLACEHOLDER rule — "exact click definitions and click-deduplication/retention rules"
 * is an open project decision. Default for Sprint 1: repeats from the same visitor
 * inside this window are recorded once (idempotent within the window).
 */
export const CLICK_DEDUPE_WINDOW_MS = 5 * 60 * 1000;

export type ReferralCodeState = 'ACTIVE' | 'EXPIRED' | 'INACTIVE';

export function generatePublicCode(): string {
  let code = '';
  for (let i = 0; i < PUBLIC_CODE_LENGTH; i += 1) {
    code += PUBLIC_CODE_ALPHABET[randomInt(PUBLIC_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizePublicCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * A link is ACTIVE only while explicitly enabled AND not past its expiry.
 * `expiresAt === null` means evergreen. An expired-but-enabled code reports EXPIRED;
 * an explicitly deactivated code reports INACTIVE regardless of expiry.
 */
export function computeCodeState(
  code: { isActive: boolean; expiresAt: Date | null },
  now: Date = new Date(),
): ReferralCodeState {
  if (!code.isActive) {
    return 'INACTIVE';
  }
  if (code.expiresAt !== null && code.expiresAt.getTime() <= now.getTime()) {
    return 'EXPIRED';
  }
  return 'ACTIVE';
}

export function buildShareUrl(baseUrl: string, publicCode: string): string {
  return `${baseUrl}${publicCode}`;
}

/** One-way hash; the raw visitor token is never persisted (privacy-minimized click counting). */
/**
 * Privacy-preserving visitor fingerprint used only for click dedupe.
 * With a pepper configured (required in production) this is HMAC-SHA256(pepper, token), so a
 * leaked database/backup cannot be brute-forced back to device tokens; without a pepper it
 * falls back to a plain SHA-256 (local development only).
 */
export function hashVisitorToken(visitorToken: string, pepper?: string): string {
  const digest = pepper
    ? createHmac('sha256', pepper).update(visitorToken).digest('hex')
    : createHash('sha256').update(visitorToken).digest('hex');
  return digest.slice(0, 32);
}

export function bucketStart(occurredAt: Date, windowMs: number = CLICK_DEDUPE_WINDOW_MS): number {
  return Math.floor(occurredAt.getTime() / windowMs) * windowMs;
}

export function buildClickVisitorPrefix(referralCodeId: string, visitorHash: string): string {
  return `click|${referralCodeId}|${visitorHash}|`;
}

export function buildClickDedupeKey(
  referralCodeId: string,
  visitorHash: string,
  occurredAt: Date,
): string {
  return `${buildClickVisitorPrefix(referralCodeId, visitorHash)}${bucketStart(occurredAt)}`;
}

/** Clicks without a visitor token cannot be deduplicated and count per request (documented placeholder). */
export function buildAnonymousClickDedupeKey(referralCodeId: string, nonce: string): string {
  return `click|${referralCodeId}|anonymous|${nonce}`;
}

export function buildVerifiedEventDedupeKey(
  eventType: 'REFERRAL_ATTRIBUTED' | 'CONVERSION',
  referralCodeId: string,
  sourceEventId: string,
): string {
  const kind = eventType === 'REFERRAL_ATTRIBUTED' ? 'referral' : 'conversion';
  return `${kind}|${referralCodeId}|${sourceEventId}`;
}

/** Prisma returns counters as BigInt; API responses use plain JSON numbers. */
export function toNumber(value: bigint | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return typeof value === 'bigint' ? Number(value) : value;
}
