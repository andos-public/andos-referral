import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SIGNATURE_HEADER, WebhookSignatureGuard } from '../../auth/webhook-signature.guard';
import { VerifiedOrderEventResponseDto } from '../dto/order-event-response.dto';
import { VerifiedOrderEventDto } from '../dto/verified-order-event.dto';
import { OrderEventsService } from '../order-events.service';

/**
 * Trusted main-app order events. HMAC-SHA256 over the raw body (`x-andos-signature`).
 * The beneficiary comes from the referred user's first-touch attribution; the promo code
 * only selects the commission rate (25% default, TEAMCHX 50%).
 */
@ApiTags('order-events')
@ApiHeader({
  name: SIGNATURE_HEADER,
  required: true,
  description: 'HMAC-SHA256 of the raw body, hex (optionally prefixed `sha256=`).',
})
@UseGuards(WebhookSignatureGuard)
@Controller('order-events')
export class OrderEventsController {
  constructor(private readonly orderEvents: OrderEventsService) {}

  @Post('verified')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a verified order event (ORDER_COMPLETED | ORDER_CANCELLED | ORDER_REFUNDED)',
    description:
      'ORDER_COMPLETED locks commission = floor(netPaid × rateBps / 10000) in the referrer wallet for 7 days (168 h). CANCELLED/REFUNDED post a linked compensating reversal. Idempotent per sourceEventId; replays are safe.',
  })
  @ApiOkResponse({ type: VerifiedOrderEventResponseDto })
  verified(@Body() dto: VerifiedOrderEventDto): Promise<VerifiedOrderEventResponseDto> {
    return this.orderEvents.recordVerified(dto);
  }
}
