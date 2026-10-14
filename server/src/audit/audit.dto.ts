import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';

export const AUDIT_ACTOR_TYPES = ['ADMIN_KEY', 'SYSTEM', 'USER'] as const;
export type AuditActorType = (typeof AUDIT_ACTOR_TYPES)[number];

export class ListAuditLogsQueryDto {
  @ApiPropertyOptional({ example: 'payout.approve', description: 'Exact action filter.' })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  action?: string;

  @ApiPropertyOptional({ example: 'payout_request' })
  @IsOptional()
  @IsString()
  @Length(2, 40)
  targetType?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Only entries for this user (actor or target).' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ enum: AUDIT_ACTOR_TYPES })
  @IsOptional()
  @IsIn(AUDIT_ACTOR_TYPES)
  actorType?: AuditActorType;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

export class AuditLogEntryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: AUDIT_ACTOR_TYPES })
  actorType!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'admin-key:9f2c1a4b7d0e' })
  actorRef!: string | null;

  @ApiProperty({ example: 'payout.approve' })
  action!: string;

  @ApiPropertyOptional({ type: String, nullable: true, example: 'payout_request' })
  targetType!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, format: 'uuid' })
  targetId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true, description: 'Correlation id of the request that wrote it.' })
  requestId!: string | null;

  @ApiProperty({ example: { amountMinorUnits: '10000' } })
  metadata!: Record<string, unknown>;

  @ApiProperty({ example: '2026-10-15T09:00:00.000Z' })
  createdAt!: string;
}

export class AuditLogListDto {
  @ApiProperty({ type: [AuditLogEntryDto] })
  data!: AuditLogEntryDto[];

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: 25 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}
