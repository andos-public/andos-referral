import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsISO8601, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

/** Public, privacy-minimized click/landing event. Deliberately unauthenticated. */
export class RecordLinkEventDto {
  @ApiProperty({ example: 'AB7KQ29M', description: 'Public referral code taken from the shared link.' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{4,16}$/)
  publicCode!: string;

  @ApiPropertyOptional({
    description:
      'Opaque client/device token used only for deduplication. Never stored raw — only a truncated SHA-256 hash is kept.',
  })
  @IsOptional()
  @IsString()
  @Length(8, 256)
  visitorToken?: string;

  @ApiPropertyOptional({ type: String, description: 'Client-observed time (ISO-8601); defaults to server time.' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Set true when the sender guarantees a single logical click (e.g. a landing beacon); deduplicates without a time window.',
  })
  @IsOptional()
  @IsBoolean()
  idempotent?: boolean;
}

/** Server-to-server verified event (HMAC-signed). Referral/conversion counts derive from these only. */
export class VerifiedLinkEventDto {
  @ApiProperty({ example: 'AB7KQ29M', description: 'Public referral code this event belongs to.' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{4,16}$/)
  publicCode!: string;

  @ApiProperty({
    example: 'andos-signup-00123',
    description:
      'Stable id of the source event in the main app. Replays with the same id are ignored (idempotency).',
  })
  @IsString()
  @Length(3, 128)
  sourceEventId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'The referred user (our UUID). Provide this or `externalUserId`. The event is linked to the user\'s FIRST-TOUCH attribution — never a second referrer.',
  })
  @IsOptional()
  @IsUUID()
  referredUserId?: string;

  @ApiPropertyOptional({
    example: 'firebase-uid-9f3k…',
    description:
      'Firebase Auth uid (1:1 with users.external_subject; auto-provisioned on first sight). Provide this or `referredUserId`.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 128)
  externalUserId?: string;

  @ApiPropertyOptional({
    example: 'andos-main-app',
    description: 'Origin system identifier.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 64)
  sourceSystem?: string;

  @ApiPropertyOptional({ type: String, description: 'When the event happened in the source system.' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}

export class VerifiedConversionEventDto extends VerifiedLinkEventDto {
  @ApiPropertyOptional({
    example: 'ORDER_COMPLETED',
    description:
      'Kind of conversion. Commission amounts are computed from verified order events (`/order-events/verified`), not from this counter.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 64)
  conversionKind?: string;
}
