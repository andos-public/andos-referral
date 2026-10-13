import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { AdminListReferralCodesQueryDto } from '../dto/admin-list-referral-codes-query.dto';
import {
  AdminReferralCodeListResponseDto,
  AdminReferralCodeResponseDto,
  AdminSummaryResponseDto,
} from '../dto/referral-code-response.dto';
import { ReferralCodesService } from '../referral-codes.service';

@ApiTags('admin')
@ApiHeader({
  name: 'x-admin-key',
  required: true,
  description: 'Static admin API key (Phase-1 placeholder for the Phase-5 admin console).',
})
@UseGuards(AdminAuthGuard)
@Controller('admin/referral-codes')
export class AdminReferralCodesController {
  constructor(private readonly referralCodes: ReferralCodesService) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Authorized aggregate view: link counts + metrics totals',
    description: 'Registered before `:id` routes so this literal path is not captured as a UUID.',
  })
  @ApiOkResponse({ type: AdminSummaryResponseDto })
  summary(): Promise<AdminSummaryResponseDto> {
    return this.referralCodes.adminSummary();
  }

  @Get()
  @ApiOperation({ summary: 'All referral links across referrers (owner-joined)' })
  @ApiOkResponse({ type: AdminReferralCodeListResponseDto })
  list(@Query() query: AdminListReferralCodesQueryDto): Promise<AdminReferralCodeListResponseDto> {
    return this.referralCodes.adminList(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One referral link across referrers' })
  @ApiOkResponse({ type: AdminReferralCodeResponseDto })
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<AdminReferralCodeResponseDto> {
    return this.referralCodes.adminGet(id);
  }
}
