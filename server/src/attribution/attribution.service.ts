import { Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';

export interface ExistingAttribution {
  id: string;
  referralCodeId: string;
  referrerUserId: string;
  campaignId: string | null;
  mainAppInstallLoginAt: Date | null;
}

export interface ResolveAttributionParams {
  referralCodeId: string;
  referrerUserId: string;
  campaignId: string | null;
  referredUserId: string;
  /** Main-app source event that first linked this user to the code (traceability). */
  sourceEventId: string;
}

export interface AttributionResolution {
  attribution: ExistingAttribution;
  /** True when this call created the row (false = an existing first-touch attribution was reused). */
  created: boolean;
  /**
   * True when an existing FIRST-TOUCH attribution was kept instead of the one implied by this
   * payload (a different link/referrer than the user's original). The attribution never moves.
   */
  firstTouchPreserved: boolean;
}

const ATTRIBUTION_SELECT = {
  id: true,
  referralCodeId: true,
  referrerUserId: true,
  campaignId: true,
  mainAppInstallLoginAt: true,
} as const;

/**
 * Owns `referral_attributions` under the LOCKED policy (2026-10-14):
 *
 *  - First-touch single attribution: one referred user is attributed to exactly one referrer
 *    for life (`referred_user_id` is unique at the DB level). A referrer may have unlimited
 *    referred users (1-to-many), but a user is never re-attributed.
 *  - Self-referral is invalid; callers verify the internal id AND the external (Firebase)
 *    identity before calling this service.
 *
 * All flows (verified link events, main-app lifecycle events) converge here, race-safely.
 */
@Injectable()
export class AttributionService {
  constructor(private readonly prisma: PrismaService) {}

  async findByReferredUser(referredUserId: string): Promise<ExistingAttribution | null> {
    return this.prisma.referralAttribution.findFirst({
      where: { referredUserId },
      select: ATTRIBUTION_SELECT,
    });
  }

  async getOrCreate(params: ResolveAttributionParams): Promise<AttributionResolution> {
    // 1) First touch wins — always reused, never replaced.
    const existing = await this.findByReferredUser(params.referredUserId);
    if (existing) {
      return {
        attribution: existing,
        created: false,
        firstTouchPreserved: existing.referralCodeId !== params.referralCodeId,
      };
    }

    try {
      const created = await this.prisma.referralAttribution.create({
        data: {
          referralCodeId: params.referralCodeId,
          referrerUserId: params.referrerUserId,
          referredUserId: params.referredUserId,
          campaignId: params.campaignId,
          sourceEventId: params.sourceEventId,
        },
        select: ATTRIBUTION_SELECT,
      });
      return { attribution: created, created: true, firstTouchPreserved: false };
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        // A concurrent request created the (single) attribution first — reuse it.
        const raced = await this.findByReferredUser(params.referredUserId);
        if (raced) {
          return {
            attribution: raced,
            created: false,
            firstTouchPreserved: raced.referralCodeId !== params.referralCodeId,
          };
        }
      }
      throw error;
    }
  }
}
