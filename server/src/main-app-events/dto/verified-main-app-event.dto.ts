import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsObject, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';

/**
 * Trusted main-app lifecycle events (HMAC-signed, idempotent per `sourceEventId`):
 *
 *  - `SIGNUP`        — the main-app account was created (milestone only).
 *  - `INSTALL_LOGIN` — the app is installed AND the referred user logged in. The main app
 *                      only emits this after both signals are verified, so this single
 *                      event satisfies the "trusted install + login" entitlement rule.
 *
 * Neither event creates a friendship/connection — referral-chat entitlement is separate.
 */
export enum MainAppEventType {
  SIGNUP = 'SIGNUP',
  INSTALL_LOGIN = 'INSTALL_LOGIN',
}

export class VerifiedMainAppEventDto {
  @ApiProperty({
    enum: MainAppEventType,
    description:
      'SIGNUP = main-app account created · INSTALL_LOGIN = install and login both verified (unlocks referral chat).',
  })
  @IsEnum(MainAppEventType)
  eventType!: MainAppEventType;

  @ApiProperty({ example: 'AB7KQ29M', description: 'Public referral code from the shared link.' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{4,16}$/)
  publicCode!: string;

  @ApiProperty({
    example: 'andos-install-00042',
    description: 'Stable id of the source event in the main app. Replays with the same id are ignored.',
  })
  @IsString()
  @Length(3, 128)
  sourceEventId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'The referred user this event belongs to (must already be provisioned in this service).',
  })
  @IsUUID()
  referredUserId!: string;

  @ApiPropertyOptional({
    example: 'andos-main-app',
    default: 'andos-main-app',
    description: 'Origin system identifier; stored on the referral event for audit.',
  })
  @IsOptional()
  @IsString()
  @Length(2, 64)
  sourceSystem?: string;

  @ApiPropertyOptional({ type: String, description: 'When the event happened in the source system (ISO-8601).' })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @ApiPropertyOptional({
    type: Object,
    description:
      'Non-sensitive metadata only. Never send emails, phone numbers, device ids, UPI or payment identifiers.',
  })
  @IsOptional()
  @IsObject()
  safeMetadata?: Record<string, unknown>;
}
