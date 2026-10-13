import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class CreateReferralCodeDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '2026-12-31T18:30:00.000Z',
    description:
      'ISO-8601 timestamp after which the link stops working. Omit it or pass null for an evergreen link.',
  })
  @IsOptional()
  @IsISO8601({ strict: true })
  expiresAt?: string | null;

  @ApiPropertyOptional({ format: 'uuid', description: 'Optional campaign this link belongs to.' })
  @IsOptional()
  @IsUUID()
  campaignId?: string;
}
