import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LinkEventType } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AttributionService } from '../attribution/attribution.service';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { IdentityService } from '../identity/identity.service';
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

type OutcomeReason = 'CODE_NOT_FOUND' | 'CODE_INACTIVE' | 'CODE_EXPIRED' | 'ALREADY_ATTRIBUTED' | 'SELF_REFERRAL';

/**
 * `publicCode` uniqueness comes from a case-insensitive functional index added in the
 * migration (not expressible in the Prisma schema), so lookups use findFirst.
 */
type VerifiedEventType = typeof LinkEventType.REFERRAL_ATTRIBUTED | typeof LinkEventType.CONVERSION;

/**
 * Counts link activity. Click rules are a documented PLACEHOLDER (exact dedupe/retention
 * definition is an open decision); referral and conversion counts come only from
 * verified, HMAC-signed backend events and are idempotent per source event id.
 *
 * LOCKED attribution policy (Sprint 3): first-touch single attribution — a referral event
 * through a link belonging to a DIFFERENT referrer than the user's first touch is refused
 * with `ALREADY_ATTRIBUTED`; the first attribution is never replaced.
 */
@Injectable()
export class LinkEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attribution: AttributionService,
    private readonly identity: IdentityService,
    private readonly config: ConfigService,
  ) {}

  /** Optional secret pepper for visitor-token hashing (required in production). */
  private visitorPepper(): string | undefined {
    return this.config.get<string>('VISITOR_HASH_PEPPER') ?? undefined;
  }

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
    const visitorHash = dto.visitorToken
      ? hashVisitorToken(dto.visitorToken, this.visitorPepper())
      : null;
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
      select: {
        id: true,
        isActive: true,
        expiresAt: true,
        ownerUserId: true,
        campaignId: true,
        owner: { select: { externalSubject: true } },
      },
    });
    if (!code) {
      return this.rejected('CODE_NOT_FOUND');
    }

    // A non-active link can never record an event — checked BEFORE attribution so an expired or
    // deactivated code answers CODE_EXPIRED / CODE_INACTIVE even for an already-attributed user.
    const state = computeCodeState(code);
    if (state !== 'ACTIVE') {
      return this.rejected(state === 'EXPIRED' ? 'CODE_EXPIRED' : 'CODE_INACTIVE');
    }

    // Trusted identity: our UUID or the Firebase uid (auto-provisioned).
    const referredUser = await this.identity.resolveEventUser({
      referredUserId: dto.referredUserId,
      externalUserId: dto.externalUserId,
    });

    // Self-referral is blocked on the internal id AND on the external (Firebase) identity.
    if (
      code.ownerUserId === referredUser.id ||
      (code.owner.externalSubject !== null &&
        referredUser.externalSubject !== null &&
        code.owner.externalSubject === referredUser.externalSubject)
    ) {
      return this.rejected('SELF_REFERRAL');
    }

    const existingAttribution = await this.attribution.findByReferredUser(referredUser.id);
    if (existingAttribution) {
      // First-touch stands: only the original referrer may keep counting events for this user.
      if (existingAttribution.referrerUserId !== code.ownerUserId) {
        return this.rejected('ALREADY_ATTRIBUTED');
      }
      return this.recordAgainstExisting(dto, eventType, existingAttribution.id, code.id, conversionKind);
    }

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const dedupeKey = buildVerifiedEventDedupeKey(eventType, code.id, dto.sourceEventId);

    const resolution = await this.attribution.getOrCreate({
      referralCodeId: code.id,
      referrerUserId: code.ownerUserId,
      campaignId: code.campaignId,
      referredUserId: referredUser.id,
      sourceEventId: dto.sourceEventId,
    });

    if (resolution.firstTouchPreserved) {
      // A concurrent first touch won with a different link/referrer — do not double-count.
      return this.rejected('ALREADY_ATTRIBUTED');
    }

    return this.writeEvent({
      eventType,
      referralCodeId: code.id,
      attributionId: resolution.attribution.id,
      dedupeKey,
      occurredAt,
      conversionKind,
    });
  }

  /** Same-referrer events keep counting; the attribution row itself never moves. */
  private async recordAgainstExisting(
    dto: VerifiedLinkEventDto,
    eventType: VerifiedEventType,
    attributionId: string,
    referralCodeId: string,
    conversionKind?: string,
  ): Promise<RecordedLinkEventResponseDto> {
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    return this.writeEvent({
      eventType,
      referralCodeId,
      attributionId,
      dedupeKey: buildVerifiedEventDedupeKey(eventType, referralCodeId, dto.sourceEventId),
      occurredAt,
      conversionKind,
    });
  }

  private async writeEvent(input: {
    eventType: VerifiedEventType;
    referralCodeId: string;
    attributionId: string;
    dedupeKey: string;
    occurredAt: Date;
    conversionKind?: string;
  }): Promise<RecordedLinkEventResponseDto> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.referralLinkEvent.create({
          data: {
            referralCodeId: input.referralCodeId,
            attributionId: input.attributionId,
            eventType: input.eventType,
            conversionKind: input.conversionKind ?? null,
            dedupeKey: input.dedupeKey,
            occurredAt: input.occurredAt,
          },
        });

        const increment =
          input.eventType === LinkEventType.REFERRAL_ATTRIBUTED
            ? { referralCount: { increment: 1n } }
            : { conversionCount: { increment: 1n } };
        await tx.referralLinkMetric.upsert({
          where: { referralCodeId: input.referralCodeId },
          create: {
            referralCodeId: input.referralCodeId,
            ...(input.eventType === LinkEventType.REFERRAL_ATTRIBUTED
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
