import fc from 'fast-check';
import {
  CANONICAL_TEAMCHX_PROMO,
  DEFAULT_RATE_BPS,
  RewardRuleLike,
  TEAMCHX_RATE_BPS,
  calculateCommissionMinorUnits,
  normalizePromoCode,
  selectRewardRule,
} from './commission.util';

/**
 * Property-based tests (fast-check) for the locked commission rules.
 * These are the money-critical invariants: integer-only math, floor rounding,
 * monotonicity and exact promo canonicalization.
 */
describe('commission.util — property-based (locked money rules)', () => {
  const baseArb = fc.bigInt({ min: 0n, max: 10n ** 15n });
  const bpsArb = fc.integer({ min: 0, max: 10000 });

  describe('calculateCommissionMinorUnits', () => {
    it('is exactly floor(base * rateBps / 10000) for every base and rate', () => {
      fc.assert(
        fc.property(baseArb, bpsArb, (base, bps) => {
          const product = base * BigInt(bps);
          const expectedFloor = (product - (product % 10000n)) / 10000n; // remainder-based floor
          expect(calculateCommissionMinorUnits(base, bps)).toBe(expectedFloor);
        }),
        { numRuns: 500 },
      );
    });

    it('never exceeds the base and is never negative', () => {
      fc.assert(
        fc.property(baseArb, bpsArb, (base, bps) => {
          const commission = calculateCommissionMinorUnits(base, bps);
          expect(commission).toBeGreaterThanOrEqual(0n);
          expect(commission).toBeLessThanOrEqual(base);
        }),
        { numRuns: 500 },
      );
    });

    it('is monotonic in both base and rate', () => {
      fc.assert(
        fc.property(
          baseArb,
          fc.bigInt({ min: 0n, max: 10n ** 12n }),
          fc.integer({ min: 0, max: 10000 }),
          fc.integer({ min: 0, max: 10000 }),
          (base, increment, rateA, rateB) => {
            // Order the rates so the second argument set is always >= the first.
            const [lowRate, highRate] = rateA <= rateB ? [rateA, rateB] : [rateB, rateA];
            const c1 = calculateCommissionMinorUnits(base, lowRate);
            const c2 = calculateCommissionMinorUnits(base + increment, highRate);
            expect(c2).toBeGreaterThanOrEqual(c1);
          },
        ),
        { numRuns: 300 },
      );
    });

    it('rounding error stays strictly below one paise', () => {
      fc.assert(
        fc.property(baseArb, bpsArb, (base, bps) => {
          // exact rational comparison: commission * 10000 <= base * bps < (commission+1) * 10000
          const commission = calculateCommissionMinorUnits(base, bps);
          const product = base * BigInt(bps);
          expect(commission * 10000n).toBeLessThanOrEqual(product);
          expect((commission + 1n) * 10000n).toBeGreaterThan(product);
        }),
        { numRuns: 500 },
      );
    });

    it('boundary rates: 0% credits nothing, 100% credits the whole base', () => {
      fc.assert(
        fc.property(baseArb, (base) => {
          expect(calculateCommissionMinorUnits(base, 0)).toBe(0n);
          expect(calculateCommissionMinorUnits(base, 10000)).toBe(base);
        }),
      );
    });

    it('rejects invalid rates and negative bases', () => {
      expect(() => calculateCommissionMinorUnits(100n, 10001)).toThrow(RangeError);
      expect(() => calculateCommissionMinorUnits(100n, -1)).toThrow(RangeError);
      expect(() => calculateCommissionMinorUnits(100n, 12.5)).toThrow(RangeError);
      expect(() => calculateCommissionMinorUnits(-1n, 2500)).toThrow(RangeError);
    });

    it('documented acceptance example: ₹200 at 25% → ₹50·00, at 50% → ₹100·00', () => {
      const base = 20_000n; // ₹200 in paise
      expect(calculateCommissionMinorUnits(base, DEFAULT_RATE_BPS)).toBe(5_000n); // ₹50
      expect(calculateCommissionMinorUnits(base, TEAMCHX_RATE_BPS)).toBe(10_000n); // ₹100
    });
  });

  describe('normalizePromoCode', () => {
    const promoish = fc.stringMatching(/^[a-zA-Z\s]{0,24}$/);

    it('is idempotent', () => {
      fc.assert(
        fc.property(promoish, (input) => {
          const once = normalizePromoCode(input);
          expect(normalizePromoCode(once)).toBe(once);
        }),
        { numRuns: 300 },
      );
    });

    it('is whitespace- and case-insensitive', () => {
      fc.assert(
        fc.property(promoish, (input) => {
          const canonical = normalizePromoCode(input);
          expect(normalizePromoCode(` ${input} `)).toBe(canonical);
          expect(normalizePromoCode(input.toLowerCase())).toBe(canonical);
          expect(normalizePromoCode(input.replace(/ /g, '\t'))).toBe(canonical);
        }),
        { numRuns: 300 },
      );
    });

    it.each(['TEAMCHX', 'teamchx', 'TEAM CHX', ' Team  Chx ', 'tEaMcHx'])(
      'maps %p to the canonical TEAMCHX',
      (input) => {
        expect(normalizePromoCode(input)).toBe(CANONICAL_TEAMCHX_PROMO);
      },
    );

    it('maps blank input to null', () => {
      expect(normalizePromoCode('')).toBeNull();
      expect(normalizePromoCode('   ')).toBeNull();
      expect(normalizePromoCode(null)).toBeNull();
      expect(normalizePromoCode(undefined)).toBeNull();
    });
  });

  describe('selectRewardRule', () => {
    const at = new Date('2026-10-14T12:00:00.000Z');
    const rule = (overrides: Partial<RewardRuleLike> & Pick<RewardRuleLike, 'ruleKey'>): RewardRuleLike => ({
      id: `rule-${overrides.ruleKey}-${overrides.ruleVersion ?? 1}`,
      campaignId: null,
      ruleVersion: 1,
      matchType: 'DEFAULT',
      promoCodeNormalized: null,
      rateBps: 2500,
      currency: 'INR',
      effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      effectiveUntil: null,
      isActive: true,
      ...overrides,
    });

    const defaultRule = rule({ ruleKey: 'DEFAULT_REFERRAL' });
    const promoRule = rule({
      ruleKey: 'PROMO_TEAMCHX',
      matchType: 'PROMO_CODE',
      promoCodeNormalized: CANONICAL_TEAMCHX_PROMO,
      rateBps: TEAMCHX_RATE_BPS,
    });

    it('picks the promo rule only when the canonical promo is supplied', () => {
      expect(
        selectRewardRule([defaultRule, promoRule], { canonicalPromoCode: 'TEAMCHX', campaignId: null, at })
          ?.rateBps,
      ).toBe(TEAMCHX_RATE_BPS);
      expect(
        selectRewardRule([defaultRule, promoRule], { canonicalPromoCode: null, campaignId: null, at })
          ?.rateBps,
      ).toBe(DEFAULT_RATE_BPS);
      expect(
        selectRewardRule([defaultRule, promoRule], { canonicalPromoCode: 'SOMEOTHER', campaignId: null, at })
          ?.rateBps,
      ).toBe(DEFAULT_RATE_BPS);
    });

    it('prefers a campaign-scoped rule over the global one, then the highest version', () => {
      const campaignDefault = rule({ ruleKey: 'DEFAULT_REFERRAL', campaignId: 'camp-1', rateBps: 3000 });
      const v2Global = rule({ ruleKey: 'DEFAULT_REFERRAL', ruleVersion: 2, rateBps: 2600 });
      expect(
        selectRewardRule([defaultRule, v2Global, campaignDefault], {
          canonicalPromoCode: null,
          campaignId: 'camp-1',
          at,
        })?.rateBps,
      ).toBe(3000);
      expect(
        selectRewardRule([defaultRule, v2Global], { canonicalPromoCode: null, campaignId: 'camp-1', at })
          ?.ruleVersion,
      ).toBe(2);
    });

    it('ignores inactive rules and rules outside their effective window', () => {
      const inactive = rule({ ruleKey: 'DEFAULT_REFERRAL', isActive: false });
      const notYet = rule({ ruleKey: 'DEFAULT_REFERRAL', effectiveFrom: new Date('2027-01-01T00:00:00.000Z') });
      const ended = rule({
        ruleKey: 'DEFAULT_REFERRAL',
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        effectiveUntil: new Date('2026-06-01T00:00:00.000Z'),
      });
      expect(selectRewardRule([inactive, notYet, ended], { canonicalPromoCode: null, campaignId: null, at })).toBeNull();
    });

    it('randomized: never returns a rule that violates the input constraints', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 1, maxLength: 6 }),
          fc.boolean(),
          (flags, usePromo) => {
            const rules = flags.map((active, index) =>
              rule({
                ruleKey: index === 0 ? 'DEFAULT_REFERRAL' : `PROMO_${index}`,
                matchType: index === 0 ? 'DEFAULT' : 'PROMO_CODE',
                promoCodeNormalized: index === 0 ? null : CANONICAL_TEAMCHX_PROMO,
                isActive: active,
                rateBps: index === 0 ? DEFAULT_RATE_BPS : TEAMCHX_RATE_BPS,
              }),
            );
            const selected = selectRewardRule(rules, {
              canonicalPromoCode: usePromo ? CANONICAL_TEAMCHX_PROMO : null,
              campaignId: null,
              at,
            });
            if (selected !== null) {
              expect(selected.isActive).toBe(true);
              expect(selected.effectiveFrom <= at).toBe(true);
              expect([DEFAULT_RATE_BPS, TEAMCHX_RATE_BPS]).toContain(selected.rateBps);
            }
          },
        ),
        { numRuns: 200 },
      );
    });
  });
});
