import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrderEventTypeDto } from './verified-order-event.dto';

/**
 * Outcome of a verified order event. Always HTTP 200: `recorded=false` + `reason` means the
 * event was understood but could not be applied (no retry storms). Money fields are decimal
 * strings in minor units (paise).
 */
export class VerifiedOrderEventResponseDto {
  @ApiProperty({ example: true })
  recorded!: boolean;

  @ApiProperty({ example: false })
  deduplicated!: boolean;

  @ApiPropertyOptional({
    enum: ['NO_ATTRIBUTION', 'SELF_REFERRAL', 'NO_PRIOR_CREDIT', 'ORDER_ALREADY_CREDITED'],
  })
  reason?: string;

  @ApiPropertyOptional({ enum: OrderEventTypeDto })
  eventType?: OrderEventTypeDto;

  @ApiPropertyOptional({ format: 'uuid' })
  orderEventId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  attributionId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Beneficiary (link owner) whose wallet is credited.' })
  referrerUserId?: string;

  @ApiPropertyOptional({ type: String, example: '20000', description: 'Commission base in paise (decimal string).' })
  commissionBaseMinorUnits?: string;

  @ApiPropertyOptional({ example: 2500, description: 'Selected rate in basis points (2500 = 25%).' })
  rateBps?: number;

  @ApiPropertyOptional({ example: 'DEFAULT_REFERRAL' })
  rewardRuleKey?: string;

  @ApiPropertyOptional({ example: 1 })
  rewardRuleVersion?: number;

  @ApiPropertyOptional({ example: 'TEAMCHX', description: 'Canonical promo code that selected the rate, if any.' })
  promoCodeNormalized?: string | null;

  @ApiPropertyOptional({ type: String, example: '5000', description: 'Commission in paise (decimal string).' })
  commissionMinorUnits?: string;

  @ApiPropertyOptional({ example: 'HOLD', description: 'Reward eligibility (HOLD until the 7-day window elapses).' })
  rewardEligibility?: string;

  @ApiPropertyOptional({
    type: String,
    example: '2026-10-21T12:00:00.000Z',
    description: 'When the held commission becomes release-eligible (ORDER_COMPLETED + 168 h).',
  })
  holdReleaseEligibleAt?: string | null;

  @ApiPropertyOptional({ example: true, description: 'False when the commission was 0 paise or already posted.' })
  ledgerPosted?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Reversal events: whether a compensating entry was posted.' })
  reversed?: boolean;

  @ApiPropertyOptional({ enum: ['PENDING', 'AVAILABLE'], description: 'Bucket the reversal was taken from.' })
  reversalBucket?: string;
}
