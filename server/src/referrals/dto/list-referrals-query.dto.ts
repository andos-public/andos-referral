import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const REFERRAL_CHAT_STATE_FILTERS = ['LOCKED', 'UNLOCKED'] as const;
export type ReferralChatStateFilter = (typeof REFERRAL_CHAT_STATE_FILTERS)[number];

export const REFERRAL_STATUS_FILTERS = ['ATTRIBUTED', 'ACTIVE', 'DISQUALIFIED'] as const;
export type ReferralStatusFilter = (typeof REFERRAL_STATUS_FILTERS)[number];

export class ListReferralsQueryDto {
  @ApiPropertyOptional({
    enum: REFERRAL_CHAT_STATE_FILTERS,
    description: 'Filter by referral-chat entitlement state (missing row counts as LOCKED).',
  })
  @IsOptional()
  @IsIn(REFERRAL_CHAT_STATE_FILTERS)
  chatState?: ReferralChatStateFilter;

  @ApiPropertyOptional({ enum: REFERRAL_STATUS_FILTERS })
  @IsOptional()
  @IsIn(REFERRAL_STATUS_FILTERS)
  status?: ReferralStatusFilter;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}


