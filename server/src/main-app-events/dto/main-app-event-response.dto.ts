import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MainAppEventType } from './verified-main-app-event.dto';

/**
 * Business outcome of a verified main-app event. Always HTTP 200: `recorded=false` with a
 * `reason` means the event was understood but could not be applied (never a retry storm).
 */
export class VerifiedMainAppEventResponseDto {
  @ApiProperty({ example: true, description: 'true when this call stored a new event.' })
  recorded!: boolean;

  @ApiProperty({ example: false, description: 'true when the event was a replay and was ignored.' })
  deduplicated!: boolean;

  @ApiPropertyOptional({
    enum: ['CODE_NOT_FOUND', 'CODE_INACTIVE', 'CODE_EXPIRED', 'SELF_REFERRAL'],
    description: 'Present when nothing was recorded.',
  })
  reason?: string;

  @ApiPropertyOptional({ enum: MainAppEventType })
  eventType?: MainAppEventType;

  @ApiPropertyOptional({ format: 'uuid', description: 'Attribution this event was recorded against.' })
  attributionId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Stored referral event id (new records only).' })
  eventId?: string;

  @ApiPropertyOptional({
    enum: ['LOCKED', 'UNLOCKED'],
    description: 'Referral-chat entitlement after this event (INSTALL_LOGIN unlocks).',
  })
  chatAccessState?: 'LOCKED' | 'UNLOCKED';

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    description: 'First verified install+login time for the attribution (never overwritten by replays).',
  })
  installLoginVerifiedAt?: string | null;
}
