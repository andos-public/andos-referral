import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ReferralCodeState } from '../referral-code.util';

export class MetricsCountersDto {
  @ApiProperty({
    example: 128,
    description:
      'Total clicks received. Placeholder rules: repeats from one visitor inside a 5-minute window count once; clicks without a visitor token count per request.',
  })
  clickCount!: number;

  @ApiProperty({
    example: 54,
    description:
      'Distinct hashed visitors seen. Exact uniqueness/anti-abuse rules are an open decision — treat as indicative.',
  })
  uniqueClickCount!: number;

  @ApiProperty({ example: 12, description: 'Referral attributions recorded for this link.' })
  referralCount!: number;

  @ApiProperty({ example: 7, description: 'Conversions (verified, credited orders) recorded for this link.' })
  conversionCount!: number;
}

export class ReferralCodeMetricsDto extends MetricsCountersDto {
  @ApiPropertyOptional({ type: String, nullable: true, example: '2026-10-13T10:15:00.000Z' })
  updatedAt!: string | null;
}

export class ReferralCodeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'AB7KQ29M' })
  publicCode!: string;

  @ApiProperty({
    example: 'https://andostpsite.vercel.app/#ref=AB7KQ29M',
    description: 'Ready-to-share link composed from the configured base URL.',
  })
  shareUrl!: string;

  @ApiProperty({ enum: ['ACTIVE', 'EXPIRED', 'INACTIVE'] })
  state!: ReferralCodeState;

  @ApiProperty()
  isActive!: boolean;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'null = evergreen' })
  expiresAt!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid' })
  campaignId!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty({ type: ReferralCodeMetricsDto })
  metrics!: ReferralCodeMetricsDto;
}

export class ReferralCodeListResponseDto {
  @ApiProperty({ type: [ReferralCodeResponseDto] })
  data!: ReferralCodeResponseDto[];

  @ApiProperty({ example: 2 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}

export class AdminOwnerDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'andos_owner' })
  username!: string | null;
}

export class AdminReferralCodeResponseDto extends ReferralCodeResponseDto {
  @ApiProperty({ type: AdminOwnerDto })
  owner!: AdminOwnerDto;
}

export class AdminReferralCodeListResponseDto {
  @ApiProperty({ type: [AdminReferralCodeResponseDto] })
  data!: AdminReferralCodeResponseDto[];

  @ApiProperty({ example: 2 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}

export class AdminCodesBreakdownDto {
  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: 9 })
  active!: number;

  @ApiProperty({ example: 2 })
  expired!: number;

  @ApiProperty({ example: 1 })
  inactive!: number;
}

export class AdminSummaryResponseDto {
  @ApiProperty({ type: AdminCodesBreakdownDto })
  codes!: AdminCodesBreakdownDto;

  @ApiProperty({ type: MetricsCountersDto })
  totals!: MetricsCountersDto;
}

export class RecordedLinkEventResponseDto {
  @ApiProperty({ example: true, description: 'true when this call stored a new event.' })
  recorded!: boolean;

  @ApiProperty({ example: false, description: 'true when the event was a duplicate and was ignored.' })
  deduplicated!: boolean;

  @ApiPropertyOptional({
    enum: ['CODE_NOT_FOUND', 'CODE_INACTIVE', 'CODE_EXPIRED'],
    description: 'Present when nothing was recorded because the link cannot currently receive this event.',
  })
  reason?: string;
}
