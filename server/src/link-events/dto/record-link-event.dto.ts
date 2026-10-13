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

  @ApiProperty({
    example: '3f7a2f10-9f4e-4d1c-8a2b-6c5e4d3c2b1a',
    description:
      'The referred user this event belongs to. The service links the verified event to the (code, user) attribution, creating a minimal ATTRIBUTED attribution if none exists yet — full install/login verification refines this in Sprint 2.',
  })
  @IsUUID()
  referredUserId!: string;

  @ApiPropertyOptional({
    example: 'andos-main-app',
    description: 'Origin system identifier (accepted for contract-readiness; not stored in Sprint 1).',
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
      'Kind of conversion. Sprint 1 counts the event only — commission amounts, splits and eligibility rules belong to Sprint 3.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 64)
  conversionKind?: string;
}
