import { BadRequestException, Injectable } from '@nestjs/common';
import { ChatAccessState, Prisma } from '@prisma/client';
import { AttributionService } from '../attribution/attribution.service';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { IdentityService } from '../identity/identity.service';
import { PrismaService } from '../prisma/prisma.service';
import { computeCodeState, normalizePublicCode } from '../referral-codes/referral-code.util';
import { VerifiedMainAppEventResponseDto } from './dto/main-app-event-response.dto';
import { MainAppEventType, VerifiedMainAppEventDto } from './dto/verified-main-app-event.dto';

const DEFAULT_SOURCE_SYSTEM = 'andos-main-app';

/**
 * `safe_metadata` is an audit aid, not a data dump — cap it so a buggy or compromised
 * main-app integration cannot store unbounded blobs (security review, PR-D).
 */
const MAX_SAFE_METADATA_BYTES = 2048;

type RejectionReason = 'CODE_NOT_FOUND' | 'CODE_INACTIVE' | 'CODE_EXPIRED' | 'SELF_REFERRAL';

/**
 * Sprint 2/3 — trusted main-app lifecycle events.
 *
 *  - The user is resolved by our UUID or by the Firebase uid (1:1 `users.external_subject`,
 *    auto-provisioned on first sight); one of the two is required.
 *  - Events attach to the user's FIRST-TOUCH attribution (locked policy) — a lifecycle fact
 *    is never lost just because a stale/different link was used, and it never re-attributes.
 *  - `INSTALL_LOGIN` stamps `main_app_install_login_at` (first verification wins) and flips the
 *    referral-chat entitlement LOCKED → UNLOCKED. Never creates a friendship/connection.
 *  - Self-referrals are rejected on the internal id AND the external identity.
 */
@Injectable()
export class MainAppEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attribution: AttributionService,
    private readonly identity: IdentityService,
  ) {}

  async recordVerified(dto: VerifiedMainAppEventDto): Promise<VerifiedMainAppEventResponseDto> {
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

    const referredUser = await this.identity.resolveEventUser({
      referredUserId: dto.referredUserId,
      externalUserId: dto.externalUserId,
    });

    // Self-referral never counts — internal id and Firebase identity both checked.
    if (
      code.ownerUserId === referredUser.id ||
      (code.owner.externalSubject !== null &&
        referredUser.externalSubject !== null &&
        code.owner.externalSubject === referredUser.externalSubject)
    ) {
      return this.rejected('SELF_REFERRAL');
    }

    if (dto.safeMetadata && JSON.stringify(dto.safeMetadata).length > MAX_SAFE_METADATA_BYTES) {
      throw new BadRequestException(
        `safeMetadata must be at most ${MAX_SAFE_METADATA_BYTES} bytes of JSON`,
      );
    }

    // First-touch wins: attach to the existing attribution when there is one. Only a brand-new
    // referral needs an ACTIVE link (deactivated/expired links still carry their existing users).
    const existing = await this.attribution.findByReferredUser(referredUser.id);
    let attributionId: string;
    let firstTouchPreserved = false;
    if (existing) {
      attributionId = existing.id;
      firstTouchPreserved = existing.referralCodeId !== code.id;
    } else {
      const state = computeCodeState(code);
      if (state !== 'ACTIVE') {
        return this.rejected(state === 'EXPIRED' ? 'CODE_EXPIRED' : 'CODE_INACTIVE');
      }
      const resolution = await this.attribution.getOrCreate({
        referralCodeId: code.id,
        referrerUserId: code.ownerUserId,
        campaignId: code.campaignId,
        referredUserId: referredUser.id,
        sourceEventId: dto.sourceEventId,
      });
      attributionId = resolution.attribution.id;
      firstTouchPreserved = resolution.firstTouchPreserved;
    }

    // The referrer whose wallet/entitlement this event belongs to = the first-touch referrer.
    const attribution = await this.prisma.referralAttribution.findUniqueOrThrow({
      where: { id: attributionId },
      select: { id: true, referrerUserId: true },
    });

    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const sourceSystem = dto.sourceSystem ?? DEFAULT_SOURCE_SYSTEM;

    try {
      const outcome = await this.prisma.$transaction(async (tx) => {
        const event = await tx.referralEvent.create({
          data: {
            attributionId,
            sourceSystem,
            sourceEventId: dto.sourceEventId,
            eventType: dto.eventType,
            occurredAt,
            safeMetadata: (dto.safeMetadata ?? {}) as Prisma.InputJsonValue,
          },
          select: { id: true },
        });

        if (dto.eventType === MainAppEventType.INSTALL_LOGIN) {
          // First verified install+login wins; replays or late duplicates never move it.
          await tx.referralAttribution.updateMany({
            where: { id: attributionId, mainAppInstallLoginAt: null },
            data: { mainAppInstallLoginAt: occurredAt },
          });

          // Entitlement: create-on-unlock, only flip when not already unlocked, so the
          // first unlocking event stays the recorded source.
          const access = await tx.referralChatAccess.findUnique({
            where: { attributionId },
            select: { accessState: true },
          });
          if (!access) {
            await tx.referralChatAccess.create({
              data: {
                attributionId,
                accessState: ChatAccessState.UNLOCKED,
                unlockedAt: occurredAt,
                unlockSourceEventId: event.id,
              },
            });
          } else if (access.accessState !== ChatAccessState.UNLOCKED) {
            await tx.referralChatAccess.update({
              where: { attributionId },
              data: {
                accessState: ChatAccessState.UNLOCKED,
                unlockedAt: occurredAt,
                unlockSourceEventId: event.id,
              },
            });
          }
        }

        const attributionRow = await tx.referralAttribution.findUnique({
          where: { id: attributionId },
          select: { mainAppInstallLoginAt: true },
        });
        const access = await tx.referralChatAccess.findUnique({
          where: { attributionId },
          select: { accessState: true },
        });
        return {
          eventId: event.id,
          installLoginVerifiedAt: attributionRow?.mainAppInstallLoginAt ?? null,
          chatAccessState: access?.accessState ?? ChatAccessState.LOCKED,
        };
      });

      return {
        recorded: true,
        deduplicated: false,
        eventType: dto.eventType,
        attributionId,
        referrerUserId: attribution.referrerUserId,
        firstTouchPreserved,
        eventId: outcome.eventId,
        chatAccessState: outcome.chatAccessState,
        installLoginVerifiedAt: outcome.installLoginVerifiedAt
          ? outcome.installLoginVerifiedAt.toISOString()
          : null,
      };
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        // Same (sourceSystem, sourceEventId) already stored — safe to ignore.
        return {
          recorded: false,
          deduplicated: true,
          eventType: dto.eventType,
          attributionId,
        };
      }
      throw error;
    }
  }

  private rejected(reason: RejectionReason): VerifiedMainAppEventResponseDto {
    return { recorded: false, deduplicated: false, reason };
  }
}
