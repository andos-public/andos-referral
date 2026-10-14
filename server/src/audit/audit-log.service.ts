import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RequestContextService } from '../observability/request-context.service';
import { AuditActorType, AuditLogEntryDto, AuditLogListDto, ListAuditLogsQueryDto } from './audit.dto';

export interface AuditRecordInput {
  actorType: AuditActorType;
  actorRef?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  /** Defaults to the current request id when available. */
  requestId?: string | null;
}

/** Metadata is capped so a single audit row can never be used as bulk storage. */
const MAX_METADATA_BYTES = 8_192;

/**
 * Append-only admin/system audit trail.
 *
 * Immutability is enforced by the database: an `admin_audit_logs_append_only` trigger rejects
 * UPDATE and DELETE, so even a compromised application path cannot rewrite history. This
 * service therefore exposes only `record` and `list` — there is no update/delete by design.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly requestContext: RequestContextService,
  ) {}

  async record(input: AuditRecordInput): Promise<void> {
    const metadata = (input.metadata ?? {}) as Prisma.InputJsonValue;
    if (Buffer.byteLength(JSON.stringify(metadata), 'utf8') > MAX_METADATA_BYTES) {
      throw new Error('Audit metadata exceeds the 8 KiB limit');
    }
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          actorType: input.actorType,
          actorRef: input.actorRef ?? null,
          action: input.action,
          targetType: input.targetType ?? null,
          targetId: input.targetId ?? null,
          requestId: input.requestId ?? this.requestContext.requestId(),
          metadata,
        },
      });
    } catch (error) {
      // An audit write must never break the business operation it describes, but it must be loud.
      this.logger.error(
        JSON.stringify({
          msg: 'audit_write_failed',
          action: input.action,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
  }

  async list(query: ListAuditLogsQueryDto): Promise<AuditLogListDto> {
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(query.action ? { action: query.action } : {}),
      ...(query.targetType ? { targetType: query.targetType } : {}),
      ...(query.targetId ? { targetId: query.targetId } : {}),
      ...(query.actorType ? { actorType: query.actorType } : {}),
      ...(query.userId
        ? { OR: [{ targetId: query.userId }, { actorRef: `user:${query.userId}` }] }
        : {}),
    };
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      data: rows.map((row) => this.toDto(row)),
      total,
      limit,
      offset,
    };
  }

  /** Stable, non-reversible reference for the acting admin key — the raw key is never stored. */
  static adminKeyRef(adminKey: string): string {
    return `admin-key:${createHash('sha256').update(adminKey).digest('hex').slice(0, 12)}`;
  }

  private toDto(row: {
    id: string;
    actorType: string;
    actorRef: string | null;
    action: string;
    targetType: string | null;
    targetId: string | null;
    requestId: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }): AuditLogEntryDto {
    return {
      id: row.id,
      actorType: row.actorType,
      actorRef: row.actorRef,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      requestId: row.requestId,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
