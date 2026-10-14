import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { AdminListReferralsQueryDto } from '../dto/admin-list-referrals-query.dto';
import { AdminReferralListResponseDto } from '../dto/referral-response.dto';
import { ReferralsService } from '../referrals.service';

@ApiTags('admin')
@ApiHeader({
  name: 'x-admin-key',
  required: true,
  description: 'Static admin API key (Phase-1 placeholder for the Phase-5 admin console).',
})
@UseGuards(AdminAuthGuard)
@Controller('admin/referrals')
export class AdminReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get()
  @ApiOperation({
    summary: 'All referrals across referrers (support/ops view)',
    description: 'Filter by referrerUserId, attribution status or referral-chat entitlement state.',
  })
  @ApiOkResponse({ type: AdminReferralListResponseDto })
  list(@Query() query: AdminListReferralsQueryDto): Promise<AdminReferralListResponseDto> {
    return this.referrals.adminList(query);
  }
}
