import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RewardRuleLike,
  calculateCommissionMinorUnits,
  normalizePromoCode,
  selectRewardRule,
} from './commission.util';

export interface CommissionQuote {
  rule: RewardRuleLike;
  canonicalPromoCode: string | null;
  baseMinorUnits: bigint;
  rateBps: number;
  commissionMinorUnits: bigint;
}

/**
 * Reads rate rules from `reward_rules` (data, versioned — never hardcoded) and applies the
 * locked commission math. If no rule matches, the service refuses to credit anything
 * (loud 503) instead of guessing a rate.
 */
@Injectable()
export class CommissionService {
  constructor(private readonly prisma: PrismaService) {}

  async quote(input: {
    baseMinorUnits: bigint;
    appliedPromoCode?: string | null;
    campaignId: string | null;
    at: Date;
    currency: string;
  }): Promise<CommissionQuote> {
    const canonicalPromoCode = normalizePromoCode(input.appliedPromoCode);

    const rules = await this.prisma.rewardRule.findMany({
      where: {
        isActive: true,
        currency: input.currency,
        OR: [{ campaignId: null }, { campaignId: input.campaignId ?? undefined }].filter(
          (clause) => clause.campaignId !== undefined,
        ),
      },
    });

    const selected = selectRewardRule(rules as RewardRuleLike[], {
      canonicalPromoCode,
      campaignId: input.campaignId,
      at: input.at,
      currency: input.currency,
    });

    if (!selected) {
      throw new ServiceUnavailableException(
        'No active reward rule matches this order — commission is not credited (configuration issue)',
      );
    }

    return {
      rule: selected,
      canonicalPromoCode,
      baseMinorUnits: input.baseMinorUnits,
      rateBps: selected.rateBps,
      commissionMinorUnits: calculateCommissionMinorUnits(input.baseMinorUnits, selected.rateBps),
    };
  }
}
