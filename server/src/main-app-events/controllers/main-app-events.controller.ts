import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SIGNATURE_HEADER, WebhookSignatureGuard } from '../../auth/webhook-signature.guard';
import { VerifiedMainAppEventResponseDto } from '../dto/main-app-event-response.dto';
import { VerifiedMainAppEventDto } from '../dto/verified-main-app-event.dto';
import { MainAppEventsService } from '../main-app-events.service';

/**
 * Trusted main-app lifecycle events (signup, install+login). Server-to-server only:
 * requires a valid HMAC-SHA256 signature over the raw request body (`x-andos-signature`).
 * Responses are business outcomes (`recorded`/`deduplicated`/`reason`) with HTTP 200.
 */
@ApiTags('main-app-events')
@ApiHeader({
  name: SIGNATURE_HEADER,
  required: true,
  description: 'HMAC-SHA256 of the raw body, hex (optionally prefixed `sha256=`).',
})
@UseGuards(WebhookSignatureGuard)
@Controller('main-app-events')
export class MainAppEventsController {
  constructor(private readonly mainAppEvents: MainAppEventsService) {}

  @Post('verified')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Record a verified main-app event (SIGNUP | INSTALL_LOGIN)',
    description:
      'Idempotent per sourceEventId. INSTALL_LOGIN stamps the verified install+login time and unlocks the referral-chat entitlement; SIGNUP is a milestone only. Self-referrals are rejected.',
  })
  @ApiOkResponse({ type: VerifiedMainAppEventResponseDto })
  verified(@Body() dto: VerifiedMainAppEventDto): Promise<VerifiedMainAppEventResponseDto> {
    return this.mainAppEvents.recordVerified(dto);
  }
}
