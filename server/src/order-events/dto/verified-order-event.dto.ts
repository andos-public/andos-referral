import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

/** Trusted main-app order lifecycle events (HMAC-signed, idempotent per `sourceEventId`). */
export enum OrderEventTypeDto {
  ORDER_COMPLETED = 'ORDER_COMPLETED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_REFUNDED = 'ORDER_REFUNDED',
}

const PAISE = /^\d{1,15}$/;

export class VerifiedOrderEventDto {
  @ApiProperty({ enum: OrderEventTypeDto })
  @IsEnum(OrderEventTypeDto)
  eventType!: OrderEventTypeDto;

  @ApiProperty({ example: 'andos-order-88213', description: 'Main-app order id (stable).' })
  @IsString()
  @Length(3, 128)
  orderId!: string;

  @ApiPropertyOptional({
    example: 'AB7KQ29M',
    description:
      'Link the order arrived through — traceability only. The beneficiary is ALWAYS the referred user\'s first-touch attribution, never this code.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{4,16}$/)
  publicCode?: string;

  @ApiProperty({
    example: 'order-completed-00123',
    description: 'Stable id of the source event. Replays with the same id are ignored.',
  })
  @IsString()
  @Length(3, 128)
  sourceEventId!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Our user id (either this or `externalUserId`).' })
  @IsOptional()
  @IsUUID()
  referredUserId?: string;

  @ApiPropertyOptional({
    example: 'firebase-uid-9f3k…',
    description: 'Firebase Auth uid (maps 1:1 to users.external_subject). Either this or `referredUserId`.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 128)
  externalUserId?: string;

  @ApiPropertyOptional({
    example: '20000',
    description:
      'Authoritative net paid amount in paise as a decimal string (required for ORDER_COMPLETED). ₹200 → "20000".',
  })
  @IsOptional()
  @Matches(PAISE, { message: 'netPaidAmountPaise must be digits only (minor units, e.g. "20000")' })
  netPaidAmountPaise?: string;

  @ApiPropertyOptional({
    example: '5000',
    description: 'Refunded amount in paise (audit only; the full posted commission is reversed).',
  })
  @IsOptional()
  @Matches(PAISE, { message: 'refundAmountPaise must be digits only (minor units)' })
  refundAmountPaise?: string;

  @ApiPropertyOptional({
    example: 'TEAM CHX',
    description: 'Promo code as entered. Canonicalized server-side (trim + case + spaces); selects the rate only.',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  appliedPromoCode?: string;

  @ApiPropertyOptional({ example: 'INR', default: 'INR' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @ApiPropertyOptional({ type: String, description: 'When the order event happened (ISO-8601).' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({ example: 'andos-main-app' })
  @IsOptional()
  @IsString()
  @Length(2, 64)
  sourceSystem?: string;
}
