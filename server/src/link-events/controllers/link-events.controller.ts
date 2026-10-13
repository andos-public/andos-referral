import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RecordedLinkEventResponseDto } from '../../referral-codes/dto/referral-code-response.dto';
import { RecordLinkEventDto } from '../dto/record-link-event.dto';
import { LinkEventsService } from '../link-events.service';

/**
 * Public click endpoint. Idempotent by design: duplicates answer 200 with
 * `deduplicated: true` so clients can retry beacons safely.
 */
@ApiTags('link-events')
@Controller('referral-link-events')
export class LinkEventsController {
  constructor(private readonly linkEvents: LinkEventsService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Record a link click (privacy-minimized, deduplicated)',
    description:
      'No auth required. Provide a stable visitorToken to enable window-based dedupe; without one every request counts as a click.',
  })
  @ApiOkResponse({ type: RecordedLinkEventResponseDto })
  record(@Body() dto: RecordLinkEventDto): Promise<RecordedLinkEventResponseDto> {
    return this.linkEvents.recordClick(dto);
  }
}
