/**
 * Pure commission + promo rules (locked 2026-10-14, owner-decided).
 *
 *  - Default rate 25% (2500 bps); promo TEAMCHX selects 50% (5000 bps).
 *  - Commission = floor((netPaidPaise * rateBps) / 10000) — integer math only, so the
 *    result is always whole paise and never depends on floating point.
 *  - The promo code selects the RATE only; the beneficiary always comes from the
 *    referral-link attribution (first-touch).
 *
 * Rates live in `reward_rules` (data), not in this file — the constants here are only the
 * canonical defaults used for seeds/documentation and as a last-resort fallback.
 */

export const DEFAULT_RATE_BPS = 2500;
export const TEAMCHX_RATE_BPS = 5000;
export const CANONICAL_TEAMCHX_PROMO = 'TEAMCHX';
export const RATE_BPS_DENOMINATOR = 10000n;

/**
 * Canonical promo form: trim, remove ALL internal whitespace, uppercase.
 * `TEAM CHX`, `teamchx`, `  TeamChx ` all become `TEAMCHX`. Empty/blank input → null.
 */
export function normalizePromoCode(input: string | null | undefined): string | null {
  if (input === null || input === undefined) {
    return null;
  }
  const canonical = input.replace(/\s+/g, '').toUpperCase();
  return canonical.length === 0 ? null : canonical;
}

/** floor((base * rateBps) / 10000) in integer arithmetic. */
export function calculateCommissionMinorUnits(baseMinorUnits: bigint, rateBps: number): bigint {
  if (baseMinorUnits < 0n) {
    throw new RangeError('commission base must not be negative');
  }
  if (!Number.isInteger(rateBps) || rateBps < 0 || rateBps > 10000) {
    throw new RangeError('rateBps must be an integer between 0 and 10000');
  }
  return (baseMinorUnits * BigInt(rateBps)) / RATE_BPS_DENOMINATOR;
}

export type RewardRuleMatchTypeLike = 'DEFAULT' | 'PROMO_CODE';

/** Structural subset of the `reward_rules` row used for selection (kept pure/testable). */
export interface RewardRuleLike {
  id: string;
  campaignId: string | null;
  ruleKey: string;
  ruleVersion: number;
  matchType: RewardRuleMatchTypeLike;
  promoCodeNormalized: string | null;
  rateBps: number;
  currency: string;
  effectiveFrom: Date;
  effectiveUntil: Date | null;
  isActive: boolean;
}

export interface RuleSelectionInput {
  canonicalPromoCode: string | null;
  campaignId: string | null;
  at: Date;
  currency?: string;
}

/**
 * Deterministic rule selection:
 *   1. active + inside the effective window (+currency match when asked)
 *   2. a PROMO_CODE rule for the canonical promo wins over DEFAULT; with no promo match
 *      (or no promo supplied) the DEFAULT rule applies
 *   3. campaign-scoped rule beats the global rule; then the highest ruleVersion wins
 * Returns null when nothing matches — callers must then refuse to credit rather than guess.
 */
export function selectRewardRule(
  rules: readonly RewardRuleLike[],
  input: RuleSelectionInput,
): RewardRuleLike | null {
  const eligible = rules.filter(
    (rule) =>
      rule.isActive &&
      rule.effectiveFrom <= input.at &&
      (rule.effectiveUntil === null || rule.effectiveUntil > input.at) &&
      (input.currency === undefined || rule.currency === input.currency),
  );

  const promoMatches =
    input.canonicalPromoCode === null
      ? []
      : eligible.filter(
          (rule) =>
            rule.matchType === 'PROMO_CODE' &&
            rule.promoCodeNormalized === input.canonicalPromoCode,
        );
  const fallbackDefaults = eligible.filter((rule) => rule.matchType === 'DEFAULT');

  const candidates = chooseScope(promoMatches).length > 0 ? promoMatches : fallbackDefaults;
  const scoped = chooseScope(candidates);
  if (scoped.length === 0) {
    return null;
  }
  return scoped.reduce((best, rule) => (rule.ruleVersion > best.ruleVersion ? rule : best));
}

/** Campaign-scoped rules win over global ones; if no campaign applies, only globals remain. */
function chooseScope(rules: readonly RewardRuleLike[]): RewardRuleLike[] {
  const campaignScoped = rules.filter((rule) => rule.campaignId !== null);
  if (campaignScoped.length > 0) {
    return campaignScoped;
  }
  return rules.filter((rule) => rule.campaignId === null);
}
