import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminListReferralsQueryDto } from './dto/admin-list-referrals-query.dto';
import { ListReferralsQueryDto } from './dto/list-referrals-query.dto';
import {
  AdminReferralListResponseDto,
  ReferralChatAccessDto,
  ReferralDetailResponseDto,
  ReferralEventDto,
  ReferralItemDto,
  ReferralListResponseDto,
} from './dto/referral-response.dto';
import {
  earliestEventAt,
  entitlementFrom,
  projectMilestones,
  ReferralViewerRole,
  toIso,
} from './referrals.util';

const MAIN_APP_SIGNUP_EVENT = 'SIGNUP';

/** One join shape for every referral read — referrer, referred user, entitlement, events. */
const REFERRAL_INCLUDE = {
  referralCode: {
    select: {
      id: true,
      publicCode: true,
      owner: { select: { id: true, username: true, displayName: true } },
    },
  },
  referredUser: { select: { id: true, username: true, displayName: true } },
  chatAccess: { select: { accessState: true, unlockedAt: true, unlockSourceEventId: true } },
  referralEvents: {
    select: { id: true, eventType: true, sourceSystem: true, occurredAt: true, verifiedAt: true },
    orderBy: { occurredAt: 'asc' as const },
  },
} as const;

type ReferralRow = Prisma.ReferralAttributionGetPayload<{ include: typeof REFERRAL_INCLUDE }>;

/**
 * Sprint 2 read model: referral list / milestone projection / chat entitlement.
 *
 * Privacy rules: referrers only ever see their own attributions (`listOwn`); a single
 * referral is readable by the two participants only, and foreign ids answer 404 (no
 * existence leak). Admin views use the separate `x-admin-key` guard.
 */
@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async listOwn(userId: string, query: ListReferralsQueryDto): Promise<ReferralListResponseDto> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const where: Prisma.ReferralAttributionWhereInput = { referrerUserId: userId };
    this.applyFilters(where, query);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.referralAttribution.findMany({
        where,
        include: REFERRAL_INCLUDE,
        orderBy: [{ attributedAt: 'desc' }, { id: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.referralAttribution.count({ where }),
    ]);

    return { data: rows.map((row) => this.toItem(row)), total, limit, offset };
  }

  async getForParticipant(userId: string, id: string): Promise<ReferralDetailResponseDto> {
    const row = await this.prisma.referralAttribution.findUnique({
      where: { id },
      include: REFERRAL_INCLUDE,
    });
    if (!row || (row.referrerUserId !== userId && row.referredUserId !== userId)) {
      throw new NotFoundException('Referral not found');
    }
    const viewerRole: ReferralViewerRole = row.referrerUserId === userId ? 'REFERRER' : 'REFERRED';
    return {
      ...this.toItem(row),
      viewerRole,
      events: row.referralEvents.map((event) => this.toEvent(event)),
    };
  }

  async getChatAccess(userId: string, id: string): Promise<ReferralChatAccessDto> {
    const row = await this.prisma.referralAttribution.findUnique({
      where: { id },
      select: {
        referrerUserId: true,
        referredUserId: true,
        chatAccess: { select: { accessState: true, unlockedAt: true, unlockSourceEventId: true } },
      },
    });
    if (!row || (row.referrerUserId !== userId && row.referredUserId !== userId)) {
      throw new NotFoundException('Referral not found');
    }
    return {
      attributionId: id,
      state: entitlementFrom(row.chatAccess),
      unlockedAt: toIso(row.chatAccess?.unlockedAt ?? null),
      unlockSourceEventId: row.chatAccess?.unlockSourceEventId ?? null,
    };
  }

  async adminList(query: AdminListReferralsQueryDto): Promise<AdminReferralListResponseDto> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const where: Prisma.ReferralAttributionWhereInput = {};
    if (query.referrerUserId) {
      where.referrerUserId = query.referrerUserId;
    }
    this.applyFilters(where, query);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.referralAttribution.findMany({
        where,
        include: REFERRAL_INCLUDE,
        orderBy: [{ attributedAt: 'desc' }, { id: 'desc' }],
        take: limit,
        skip: offset,
      }),
      this.prisma.referralAttribution.count({ where }),
    ]);

    return { data: rows.map((row) => this.toItem(row)), total, limit, offset };
  }

  private applyFilters(
    where: Prisma.ReferralAttributionWhereInput,
    query: ListReferralsQueryDto,
  ): void {
    if (query.status) {
      where.attributionStatus = query.status;
    }
    if (query.chatState === 'UNLOCKED') {
      where.chatAccess = { accessState: 'UNLOCKED' };
    } else if (query.chatState === 'LOCKED') {
      // A missing entitlement row means LOCKED — never unlocked.
      where.OR = [{ chatAccess: { is: null } }, { chatAccess: { accessState: 'LOCKED' } }];
    }
  }

  private toItem(row: ReferralRow): ReferralItemDto {
    const chatState = entitlementFrom(row.chatAccess);
    const milestones = projectMilestones({
      signedUpAt: earliestEventAt(row.referralEvents, MAIN_APP_SIGNUP_EVENT),
      installLoginVerifiedAt: row.mainAppInstallLoginAt,
      chatUnlockedAt: chatState === 'UNLOCKED' ? (row.chatAccess?.unlockedAt ?? null) : null,
    });

    return {
      id: row.id,
      codeId: row.referralCode.id,
      publicCode: row.referralCode.publicCode,
      referrer: {
        id: row.referralCode.owner.id,
        username: row.referralCode.owner.username,
        displayName: row.referralCode.owner.displayName,
      },
      referredUser: {
        id: row.referredUser.id,
        username: row.referredUser.username,
        displayName: row.referredUser.displayName,
      },
      attributionStatus: row.attributionStatus,
      attributedAt: row.attributedAt.toISOString(),
      sourceEventId: row.sourceEventId,
      mainAppInstallLoginAt: toIso(row.mainAppInstallLoginAt),
      milestones,
      chatAccess: {
        attributionId: row.id,
        state: chatState,
        unlockedAt: toIso(row.chatAccess?.unlockedAt ?? null),
        unlockSourceEventId: row.chatAccess?.unlockSourceEventId ?? null,
      },
    };
  }

  private toEvent(event: ReferralRow['referralEvents'][number]): ReferralEventDto {
    return {
      id: event.id,
      eventType: event.eventType,
      sourceSystem: event.sourceSystem,
      occurredAt: event.occurredAt.toISOString(),
      verifiedAt: event.verifiedAt.toISOString(),
    };
  }
}
