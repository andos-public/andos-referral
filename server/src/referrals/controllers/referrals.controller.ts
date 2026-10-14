import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { ListReferralsQueryDto } from '../dto/list-referrals-query.dto';
import {
  ReferralChatAccessDto,
  ReferralDetailResponseDto,
  ReferralListResponseDto,
} from '../dto/referral-response.dto';
import { ReferralsService } from '../referrals.service';

/**
 * Sprint 2 referral reads. Ownership: `referrals` lists the caller's own referrals
 * (as referrer); a single referral is readable by its two participants only.
 */
@ApiTags('referrals')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  description: 'Phase-1 trusted identity header (temporary; replaced by main-app auth exchange).',
})
@UseGuards(UserAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get()
  @ApiOperation({
    summary: 'Referrals I brought in (as referrer), newest first',
    description:
      'Milestone projection per referral: ATTRIBUTED → SIGNED_UP → INSTALL_LOGIN_VERIFIED → CHAT_UNLOCKED.',
  })
  @ApiOkResponse({ type: ReferralListResponseDto })
  list(
    @CurrentUser() user: { id: string },
    @Query() query: ListReferralsQueryDto,
  ): Promise<ReferralListResponseDto> {
    return this.referrals.listOwn(user.id, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'One referral with its verified events — participants only',
    description: 'Foreign or unknown ids answer 404. `viewerRole` tells you if you are REFERRER or REFERRED.',
  })
  @ApiOkResponse({ type: ReferralDetailResponseDto })
  detail(
    @CurrentUser() user: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReferralDetailResponseDto> {
    return this.referrals.getForParticipant(user.id, id);
  }

  @Get(':id/chat-access')
  @ApiOperation({
    summary: 'Referral-chat entitlement for one referral (participants only)',
    description:
      'LOCKED until a trusted main-app install+login verification (INSTALL_LOGIN event). Entitlement is independent of friendships/connections.',
  })
  @ApiOkResponse({ type: ReferralChatAccessDto })
  chatAccess(
    @CurrentUser() user: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ReferralChatAccessDto> {
    return this.referrals.getChatAccess(user.id, id);
  }
}
