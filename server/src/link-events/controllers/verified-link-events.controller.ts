import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SIGNATURE_HEADER, WebhookSignatureGuard } from '../../auth/webhook-signature.guard';
import { RecordedLinkEventResponseDto } from '../../referral-codes/dto/referral-code-response.dto';
import { VerifiedConversionEventDto, VerifiedLinkEventDto } from '../dto/record-link-event.dto';
import { LinkEventsService } from '../link-events.service';

/**
 * Server-to-server verified events. Requires a valid HMAC-SHA256 signature over the
 * raw request body (`x-andos-signature`). These endpoints are the ONLY source of
 * referral and conversion counts. Sprint 3 will add commission calculation on top.
 */
@ApiTags('link-events')
@ApiHeader({
  name: SIGNATURE_HEADER,
  required: true,
  description: 'HMAC-SHA256 of the raw body, hex (optionally prefixed `sha256=`).',
})
@UseGuards(WebhookSignatureGuard)
@Controller('referral-link-events/verified')
export class VerifiedLinkEventsController {
  constructor(private readonly linkEvents: LinkEventsService) {}

  @Post('referral')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a verified referral attribution event',
    description: 'Replays with the same sourceEventId are ignored (idempotent).',
  })
  @ApiOkResponse({ type: RecordedLinkEventResponseDto })
  referral(@Body() dto: VerifiedLinkEventDto): Promise<RecordedLinkEventResponseDto> {
    return this.linkEvents.recordReferralAttributed(dto);
  }

  @Post('conversion')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a verified conversion (e.g. order completed)',
    description:
      'Counts the conversion and links it to an existing attribution for the same source event when one exists. Amounts/commission are out of Sprint 1 scope.',
  })
  @ApiOkResponse({ type: RecordedLinkEventResponseDto })
  conversion(@Body() dto: VerifiedConversionEventDto): Promise<RecordedLinkEventResponseDto> {
    return this.linkEvents.recordConversion(dto);
  }
}
