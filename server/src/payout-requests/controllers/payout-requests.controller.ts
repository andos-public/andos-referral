import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import {
  CreatePayoutRequestDto,
  ListPayoutRequestsQueryDto,
  PayoutRequestListDto,
  PayoutRequestResponseDto,
} from '../payout-requests.dto';
import { PayoutRequestsService } from '../payout-requests.service';

/**
 * Withdrawal requests (owner side). No configured min/max: any positive amount up to the
 * AVAILABLE balance. Funds are reserved immediately; the request starts PENDING_APPROVAL.
 */
@ApiTags('payout-requests')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  description: 'Phase-1 trusted identity header (temporary; replaced by main-app auth exchange).',
})
@UseGuards(UserAuthGuard)
@Controller('payout-requests')
export class PayoutRequestsController {
  constructor(private readonly payoutRequests: PayoutRequestsService) {}

  @Post()
  @ApiOperation({
    summary: 'Request a withdrawal',
    description:
      'Amount must be positive and ≤ AVAILABLE (paise decimal string). Funds are reserved atomically. Idempotent per idempotencyKey.',
  })
  @ApiCreatedResponse({ type: PayoutRequestResponseDto })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePayoutRequestDto,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutRequests.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'My withdrawal requests (newest first)' })
  @ApiOkResponse({ type: PayoutRequestListDto })
  list(
    @CurrentUser() user: { id: string },
    @Query() query: ListPayoutRequestsQueryDto,
  ): Promise<PayoutRequestListDto> {
    return this.payoutRequests.listOwn(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One of my withdrawal requests' })
  @ApiOkResponse({ type: PayoutRequestResponseDto })
  get(
    @CurrentUser() user: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutRequests.getOwn(user.id, id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel my pending/approved request',
    description: 'Releases the reservation back to AVAILABLE. Idempotent once cancelled.',
  })
  @ApiOkResponse({ type: PayoutRequestResponseDto })
  cancel(
    @CurrentUser() user: { id: string },
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutRequests.cancel(user.id, id);
  }
}
