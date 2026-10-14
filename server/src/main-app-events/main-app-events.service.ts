import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { ChatAccessState, Prisma } from '@prisma/client';
import { AttributionService } from '../attribution/attribution.service';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
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
 * Sprint 2 — trusted main-app lifecycle events on top of the Sprint-1 attribution.
 *
 *  - Records an auditable `referral_events` row (idempotent per `sourceSystem` + `sourceEventId`).
 *  - `INSTALL_LOGIN` additionally stamps `main_app_install_login_at` (first verification wins)
 *    and flips the referral-chat entitlement `LOCKED → UNLOCKED` on the attribution.
 *  - Never creates a friendship/connection; entitlement is a separate concept.
 */
@Injectable()
export class MainAppEventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly attribution: AttributionService,
  ) {}

  async recordVerified(dto: VerifiedMainAppEventDto): Promise<VerifiedMainAppEventResponseDto> {
    const code = await this.prisma.referralCode.findFirst({
      where: { publicCode: normalizePublicCode(dto.publicCode) },
      select: { id: true, isActive: true, expiresAt: true, ownerUserId: true, campaignId: true },
    });
    if (!code) {
      return this.rejected('CODE_NOT_FOUND');
    }

    const referredUser = await this.prisma.user.findUnique({
      where: { id: dto.referredUserId },
      select: { id: true },
    });
    if (!referredUser) {
      throw new UnprocessableEntityException('Unknown referredUserId');
    }

    if (dto.safeMetadata && JSON.stringify(dto.safeMetadata).length > MAX_SAFE_METADATA_BYTES) {
      throw new BadRequestException(
        `safeMetadata must be at most ${MAX_SAFE_METADATA_BYTES} bytes of JSON`,
      );
    }

    // Self-referral never counts. Policy placeholder: the owner may relax this later, but
    // nothing is recorded or unlocked for self-referrals today.
    if (code.ownerUserId === dto.referredUserId) {
      return this.rejected('SELF_REFERRAL');
    }

    // Lifecycle events are trusted facts about an EXISTING referral, so an already-attributed
    // (link, user) pair is honoured even if the link was deactivated/expired afterwards — a
    // non-ACTIVE code only stops NEW attributions.
    const existing = await this.attribution.findForCodeAndUser(code.id, dto.referredUserId);
    if (!existing) {
      const state = computeCodeState(code);
      if (state !== 'ACTIVE') {
        return this.rejected(state === 'EXPIRED' ? 'CODE_EXPIRED' : 'CODE_INACTIVE');
      }
    }

    const attributionId =
      existing?.id ??
      (await this.attribution.getOrCreate({
        referralCodeId: code.id,
        referrerUserId: code.ownerUserId,
        campaignId: code.campaignId,
        referredUserId: dto.referredUserId,
        sourceEventId: dto.sourceEventId,
      }));

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

          // Entitlement: create-on-unlock, and only flip when not already unlocked, so the
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

        const attribution = await tx.referralAttribution.findUnique({
          where: { id: attributionId },
          select: { mainAppInstallLoginAt: true },
        });
        const access = await tx.referralChatAccess.findUnique({
          where: { attributionId },
          select: { accessState: true },
        });
        return {
          eventId: event.id,
          installLoginVerifiedAt: attribution?.mainAppInstallLoginAt ?? null,
          chatAccessState: access?.accessState ?? ChatAccessState.LOCKED,
        };
      });

      return {
        recorded: true,
        deduplicated: false,
        eventType: dto.eventType,
        attributionId,
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
