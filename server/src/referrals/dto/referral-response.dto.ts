import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AttributionStatus } from '@prisma/client';
import type { ChatEntitlementState, ReferralMilestone, ReferralViewerRole } from '../referrals.util';

export class ReferralUserDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'andos_owner' })
  username!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'Prakash' })
  displayName!: string | null;
}

export class ReferralChatAccessDto {
  @ApiProperty({ format: 'uuid', description: 'Attribution this entitlement belongs to.' })
  attributionId!: string;

  @ApiProperty({ enum: ['LOCKED', 'UNLOCKED'] })
  state!: ChatEntitlementState;

  @ApiPropertyOptional({ type: String, nullable: true })
  unlockedAt!: string | null;

  @ApiPropertyOptional({
    format: 'uuid',
    type: String,
    nullable: true,
    description: 'Referral event that unlocked access (first unlocking event wins).',
  })
  unlockSourceEventId!: string | null;
}

export class ReferralMilestonesDto {
  @ApiPropertyOptional({ type: String, nullable: true, description: 'Earliest SIGNUP event from the main app.' })
  signedUpAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'First verified install+login.' })
  installLoginVerifiedAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  chatUnlockedAt!: string | null;

  @ApiProperty({
    enum: ['ATTRIBUTED', 'SIGNED_UP', 'INSTALL_LOGIN_VERIFIED', 'CHAT_UNLOCKED'],
    description: 'Furthest milestone this referral has reached.',
  })
  currentMilestone!: ReferralMilestone;
}

export class ReferralEventDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'INSTALL_LOGIN', description: 'SIGNUP | INSTALL_LOGIN (main-app lifecycle).' })
  eventType!: string;

  @ApiProperty({ example: 'andos-main-app' })
  sourceSystem!: string;

  @ApiProperty({ example: '2026-10-13T10:15:00.000Z' })
  occurredAt!: string;

  @ApiProperty({ example: '2026-10-13T10:15:02.000Z' })
  verifiedAt!: string;
}

export class ReferralItemDto {
  @ApiProperty({ format: 'uuid', description: 'Attribution id.' })
  id!: string;

  @ApiProperty({ format: 'uuid', description: 'Referral code (link) that brought this user.' })
  codeId!: string;

  @ApiProperty({ example: 'AB7KQ29M' })
  publicCode!: string;

  @ApiProperty({ type: ReferralUserDto, description: 'The referrer (link owner) — attribution beneficiary.' })
  referrer!: ReferralUserDto;

  @ApiProperty({ type: ReferralUserDto })
  referredUser!: ReferralUserDto;

  @ApiProperty({ enum: ['ATTRIBUTED', 'ACTIVE', 'DISQUALIFIED'] })
  attributionStatus!: AttributionStatus;

  @ApiProperty({ example: '2026-10-13T10:00:00.000Z' })
  attributedAt!: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'Main-app source event that created this attribution.',
  })
  sourceEventId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  mainAppInstallLoginAt!: string | null;

  @ApiProperty({ type: ReferralMilestonesDto })
  milestones!: ReferralMilestonesDto;

  @ApiProperty({ type: ReferralChatAccessDto })
  chatAccess!: ReferralChatAccessDto;
}

export class ReferralListResponseDto {
  @ApiProperty({ type: [ReferralItemDto] })
  data!: ReferralItemDto[];

  @ApiProperty({ example: 3 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}

export class ReferralDetailResponseDto extends ReferralItemDto {
  @ApiProperty({ enum: ['REFERRER', 'REFERRED'], description: 'How the authenticated caller relates to this referral.' })
  viewerRole!: ReferralViewerRole;

  @ApiProperty({ type: [ReferralEventDto], description: 'Verified main-app events, oldest first.' })
  events!: ReferralEventDto[];
}

export class AdminReferralItemDto extends ReferralItemDto {}

export class AdminReferralListResponseDto {
  @ApiProperty({ type: [AdminReferralItemDto] })
  data!: AdminReferralItemDto[];

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}
