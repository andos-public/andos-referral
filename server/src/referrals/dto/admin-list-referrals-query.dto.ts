import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { ListReferralsQueryDto } from './list-referrals-query.dto';

export class AdminListReferralsQueryDto extends ListReferralsQueryDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Only referrals whose referrer is this user.' })
  @IsOptional()
  @IsUUID()
  referrerUserId?: string;
}
