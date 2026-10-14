import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminActor, AdminActorContext } from '../../audit/admin-actor.decorator';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import {
  AdminListPayoutRequestsQueryDto,
  AdminPayoutRequestListDto,
  CompletePayoutRequestDto,
  PayoutRequestResponseDto,
  RejectPayoutRequestDto,
} from '../payout-requests.dto';
import { PayoutRequestsService } from '../payout-requests.service';

/**
 * Admin payout decisions. The Phase-5 console will replace the static `x-admin-key`; the
 * acting admin user is configured via `ADMIN_ACTOR_USER_ID` (audit columns are NOT NULL for
 * APPROVED/REJECTED/COMPLETED by DB constraint — a real actor is always recorded).
 */
@ApiTags('admin')
@ApiHeader({
  name: 'x-admin-key',
  required: true,
  description: 'Static admin API key (Phase-1 placeholder for the Phase-5 admin console).',
})
@UseGuards(AdminAuthGuard)
@Controller('admin/payout-requests')
export class AdminPayoutRequestsController {
  constructor(private readonly payoutRequests: PayoutRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Payout queue (oldest first), filter by status/user' })
  @ApiOkResponse({ type: AdminPayoutRequestListDto })
  list(@Query() query: AdminListPayoutRequestsQueryDto): Promise<AdminPayoutRequestListDto> {
    return this.payoutRequests.adminList(query);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve a pending request (no money moves)' })
  @ApiOkResponse({ type: PayoutRequestResponseDto })
  approve(
    @Param('id', new ParseUUIDPipe()) id: string,
    @AdminActor() actor: AdminActorContext,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutRequests.approve(id, actor.ref, actor.requestId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a request and release the reservation' })
  @ApiOkResponse({ type: PayoutRequestResponseDto })
  reject(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: RejectPayoutRequestDto,
    @AdminActor() actor: AdminActorContext,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutRequests.reject(id, dto, actor.ref, actor.requestId);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark as paid with the bank UTR (RESERVED → WITHDRAWN)',
    description: 'Requires a valid payment UTR — COMPLETED is never written without one.',
  })
  @ApiOkResponse({ type: PayoutRequestResponseDto })
  complete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CompletePayoutRequestDto,
    @AdminActor() actor: AdminActorContext,
  ): Promise<PayoutRequestResponseDto> {
    return this.payoutRequests.complete(id, dto, actor.ref, actor.requestId);
  }
}
