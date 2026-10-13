import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { LinkEventType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecordedLinkEventResponseDto,
} from '../referral-codes/dto/referral-code-response.dto';
import {
  buildAnonymousClickDedupeKey,
  buildClickDedupeKey,
  buildClickVisitorPrefix,
  buildVerifiedEventDedupeKey,
  computeCodeState,
  hashVisitorToken,
  normalizePublicCode,
} from '../referral-codes/referral-code.util';
import { RecordLinkEventDto, VerifiedConversionEventDto, VerifiedLinkEventDto } from './dto/record-link-event.dto';

type OutcomeReason = 'CODE_NOT_FOUND' | 'CODE_INACTIVE' | 'CODE_EXPIRED';

/**
 * `publicCode` uniqueness comes from a case-insensitive functional index added in the
 * migration (not expressible in the Prisma schema), so lookups use findFirst.
 */
type VerifiedEventType = typeof LinkEventType.REFERRAL_ATTRIBUTED | typeof LinkEventType.CONVERSION;

/**
 * Counts link activity. Click rules are a documented PLACEHOLDER (exact dedupe/retention
 * definition is an open decision); referral and conversion counts come only from
 * verified, HMAC-signed backend events and are idempotent per source event id.
 */
@Injectable()
export class LinkEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordClick(dto: RecordLinkEventDto): Promise<RecordedLinkEventResponseDto> {
    const code = await this.prisma.referralCode.findFirst({
      where: { publicCode: normalizePublicCode(dto.publicCode) },
      select: { id: true, isActive: true, expiresAt: true },
    });
    if (!code) {
      return this.rejected('CODE_NOT_FOUND');
    }
    const state = computeCodeState(code);
    if (state !== 'ACTIVE') {
      return this.rejected(state === 'EXPIRED' ? 'CODE_EXPIRED' : 'CODE_INACTIVE');
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const visitorHash = dto.visitorToken ? hashVisitorToken(dto.visitorToken) : null;
    const dedupeKey = visitorHash
      ? dto.idempotent
        ? `click|${code.id}|${visitorHash}|idempotent`
        : buildClickDedupeKey(code.id, visitorHash, occurredAt)
      : buildAnonymousClickDedupeKey(code.id, randomUUID());
    const countsUnique = visitorHash
      ? await this.isFirstVisitForVisitor(code.id, visitorHash, dedupeKey)
      : true;

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.referralLinkEvent.create({
          data: {
            referralCodeId: code.id,
            eventType: LinkEventType.CLICK,
            dedupeKey,
            occurredAt,
          },
        });
        await tx.referralLinkMetric.upsert({
          where: { referralCodeId: code.id },
          create: {
            referralCodeId: code.id,
            clickCount: 1n,
            uniqueClickCount: countsUnique ? 1n : 0n,
          },
          update: {
            clickCount: { increment: 1n },
            ...(countsUnique ? { uniqueClickCount: { increment: 1n } } : {}),
          },
        });
      });
      return { recorded: true, deduplicated: false };
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        return { recorded: false, deduplicated: true };
      }
      throw error;
    }
  }

  async recordReferralAttributed(dto: VerifiedLinkEventDto): Promise<RecordedLinkEventResponseDto> {
    return this.recordVerifiedEvent(dto, LinkEventType.REFERRAL_ATTRIBUTED);
  }

  async recordConversion(dto: VerifiedConversionEventDto): Promise<RecordedLinkEventResponseDto> {
    return this.recordVerifiedEvent(dto, LinkEventType.CONVERSION, dto.conversionKind);
  }

  private async recordVerifiedEvent(
    dto: VerifiedLinkEventDto,
    eventType: VerifiedEventType,
    conversionKind?: string,
  ): Promise<RecordedLinkEventResponseDto> {
    const code = await this.prisma.referralCode.findFirst({
      where: { publicCode: normalizePublicCode(dto.publicCode) },
      select: { id: true, isActive: true, expiresAt: true, ownerUserId: true, campaignId: true },
    });
    if (!code) {
      return this.rejected('CODE_NOT_FOUND');
    }
    const state = computeCodeState(code);
    if (state !== 'ACTIVE') {
      return this.rejected(state === 'EXPIRED' ? 'CODE_EXPIRED' : 'CODE_INACTIVE');
    }

    const referredUser = await this.prisma.user.findUnique({
      where: { id: dto.referredUserId },
      select: { id: true },
    });
    if (!referredUser) {
      throw new UnprocessableEntityException('Unknown referredUserId');
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const dedupeKey = buildVerifiedEventDedupeKey(eventType, code.id, dto.sourceEventId);

    // The link-event CHECK constraint requires attribution_id on referral/conversion events.
    // Sprint 1 therefore get-or-creates a minimal ATTRIBUTED attribution; Sprint 2 layers the
    // full signed install/login verification, campaign resolution and chat entitlement on top.
    const attributionId = await this.getOrCreateAttribution(
      code.id,
      code.ownerUserId,
      code.campaignId,
      dto.referredUserId,
      dto.sourceEventId,
    );

    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.referralLinkEvent.create({
          data: {
            referralCodeId: code.id,
            attributionId,
            eventType,
            conversionKind: conversionKind ?? null,
            dedupeKey,
            occurredAt,
          },
        });

        const increment =
          eventType === LinkEventType.REFERRAL_ATTRIBUTED
            ? { referralCount: { increment: 1n } }
            : { conversionCount: { increment: 1n } };
        await tx.referralLinkMetric.upsert({
          where: { referralCodeId: code.id },
          create: {
            referralCodeId: code.id,
            ...(eventType === LinkEventType.REFERRAL_ATTRIBUTED
              ? { referralCount: 1n }
              : { conversionCount: 1n }),
          },
          update: increment,
        });
      });
      return { recorded: true, deduplicated: false };
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        return { recorded: false, deduplicated: true };
      }
      throw error;
    }
  }

  /**
   * Attribution for (code, referred user); race-safe. The unique constraint intentionally
   * only prevents duplicates through the same link — one-vs-multiple-referrer policy is open.
   */
  private async getOrCreateAttribution(
    referralCodeId: string,
    referrerUserId: string,
    campaignId: string | null,
    referredUserId: string,
    sourceEventId: string,
  ): Promise<string> {
    const where = { referralCodeId_referredUserId: { referralCodeId, referredUserId } };
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
          referralCodeId,
          referrerUserId,
          referredUserId,
          campaignId,
          sourceEventId,
        },
        select: { id: true },
      });
      return created.id;
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
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

  /**
   * True when this visitor produced no prior click for this code in the current dedupe
   * window (and was not seen at all before in idempotent mode).
   */
  private async isFirstVisitForVisitor(
    referralCodeId: string,
    visitorHash: string,
    dedupeKey: string,
  ): Promise<boolean> {
    const earliest = await this.prisma.referralLinkEvent.findFirst({
      where: {
        referralCodeId,
        dedupeKey: { startsWith: buildClickVisitorPrefix(referralCodeId, visitorHash) },
      },
      select: { dedupeKey: true },
      orderBy: { occurredAt: 'asc' },
    });
    return earliest === null || earliest.dedupeKey === dedupeKey;
  }

  private rejected(reason: OutcomeReason): RecordedLinkEventResponseDto {
    return { recorded: false, deduplicated: false, reason };
  }
}
