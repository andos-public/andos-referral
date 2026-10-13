import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const REFERRAL_CODE_STATE_FILTERS = ['ALL', 'ACTIVE', 'EXPIRED', 'INACTIVE'] as const;
export type ReferralCodeStateFilter = (typeof REFERRAL_CODE_STATE_FILTERS)[number];

export class ListReferralCodesQueryDto {
  @ApiPropertyOptional({ enum: REFERRAL_CODE_STATE_FILTERS, default: 'ALL' })
  @IsOptional()
  @IsIn(REFERRAL_CODE_STATE_FILTERS)
  state?: ReferralCodeStateFilter = 'ALL';

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
