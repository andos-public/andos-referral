import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { ListReferralCodesQueryDto } from './list-referral-codes-query.dto';

export class AdminListReferralCodesQueryDto extends ListReferralCodesQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Filter by owner user id.' })
  @IsOptional()
  @IsUUID()
  ownerUserId?: string;

  @ApiPropertyOptional({ description: 'Exact public code (case-insensitive).', example: 'AB7KQ29M' })
  @IsOptional()
  @IsString()
  @Length(4, 16)
  publicCode?: string;
}
