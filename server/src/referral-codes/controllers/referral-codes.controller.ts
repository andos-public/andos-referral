import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { CreateReferralCodeDto } from '../dto/create-referral-code.dto';
import { ListReferralCodesQueryDto } from '../dto/list-referral-codes-query.dto';
import {
  ReferralCodeListResponseDto,
  ReferralCodeMetricsDto,
  ReferralCodeResponseDto,
} from '../dto/referral-code-response.dto';
import { ReferralCodesService } from '../referral-codes.service';

@ApiTags('referral-codes')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  description: 'Phase-1 trusted identity header (temporary; replaced by main-app auth exchange).',
})
@UseGuards(UserAuthGuard)
@Controller('referral-codes')
export class ReferralCodesController {
  constructor(private readonly referralCodes: ReferralCodesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a reusable referral link',
    description:
      'Every call creates a fresh code. Omit `expiresAt` (or pass null) for an evergreen link. Links are reusable without a use cap.',
  })
  @ApiCreatedResponse({ type: ReferralCodeResponseDto })
  create(
    @CurrentUser() owner: { id: string },
    @Body() dto: CreateReferralCodeDto,
  ): Promise<ReferralCodeResponseDto> {
    return this.referralCodes.create(owner.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List my referral links (newest first)' })
  @ApiOkResponse({ type: ReferralCodeListResponseDto })
  list(
    @CurrentUser() owner: { id: string },
    @Query() query: ListReferralCodesQueryDto,
  ): Promise<ReferralCodeListResponseDto> {
    return this.referralCodes.listOwn(owner.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one of my referral links' })
  @ApiOkResponse({ type: ReferralCodeResponseDto })
  get(
    @CurrentUser() owner: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReferralCodeResponseDto> {
    return this.referralCodes.getOwn(owner.id, id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a referral link (idempotent)' })
  @ApiOkResponse({ type: ReferralCodeResponseDto })
  deactivate(
    @CurrentUser() owner: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReferralCodeResponseDto> {
    return this.referralCodes.deactivate(owner.id, id);
  }

  @Get(':id/metrics')
  @ApiOperation({
    summary: 'Metrics for one of my links',
    description:
      'Clicks are counted with placeholder dedupe rules (see clickCount docs); referrals and conversions count verified backend events only.',
  })
  @ApiOkResponse({ type: ReferralCodeMetricsDto })
  metrics(
    @CurrentUser() owner: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReferralCodeMetricsDto> {
    return this.referralCodes.getMetrics(owner.id, id);
  }
}
