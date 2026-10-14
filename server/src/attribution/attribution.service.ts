import { Injectable } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';

export interface GetOrCreateAttributionParams {
  referralCodeId: string;
  referrerUserId: string;
  campaignId: string | null;
  referredUserId: string;
  /** Main-app source event that first linked this user to the code (traceability). */
  sourceEventId: string;
}

export interface ExistingAttribution {
  id: string;
  mainAppInstallLoginAt: Date | null;
}

/**
 * Owns the `referral_attributions` row for a (code, referred user) pair.
 *
 * The unique constraint intentionally prevents duplicates through the *same* link only —
 * one-vs-multiple-referrer cardinality is an open product decision. Both the Sprint-1
 * verified link events and the Sprint-2 verified main-app events converge here so a
 * (link, user) pair always resolves to a single attribution row, race-safely.
 */
@Injectable()
export class AttributionService {
  constructor(private readonly prisma: PrismaService) {}

  async findForCodeAndUser(
    referralCodeId: string,
    referredUserId: string,
  ): Promise<ExistingAttribution | null> {
    return this.prisma.referralAttribution.findUnique({
      where: { referralCodeId_referredUserId: { referralCodeId, referredUserId } },
      select: { id: true, mainAppInstallLoginAt: true },
    });
  }

  async getOrCreate(params: GetOrCreateAttributionParams): Promise<string> {
    const where = {
      referralCodeId_referredUserId: {
        referralCodeId: params.referralCodeId,
        referredUserId: params.referredUserId,
      },
    };
    const existing = await this.prisma.referralAttribution.findUnique({
      where,
      select: { id: true },
    });
    if (existing) {
      return existing.id;
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
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        // Another request created the same attribution between our read and write.
        const raced = await this.prisma.referralAttribution.findUnique({
          where,
          select: { id: true },
        });
        if (raced) {
          return raced.id;
        }
      }
      throw error;
    }
  }
}
