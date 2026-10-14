import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuditLogService } from './audit-log.service';

export interface AdminActorContext {
  /** `admin-key:<sha256 prefix>` — identifies the acting key without storing it. */
  ref: string;
  requestId: string | null;
}

/**
 * Resolves the acting admin for audit rows: a key reference plus the request correlation id.
 * The raw admin key never leaves this decorator and is never stored.
 */
export const AdminActor = createParamDecorator((_data: unknown, ctx: ExecutionContext): AdminActorContext => {
  const request = ctx.switchToHttp().getRequest<Request>() as Request & { requestId?: string };
  const raw = request.headers['x-admin-key'];
  const key = (Array.isArray(raw) ? raw[0] : raw) ?? '';
  return {
    ref: AuditLogService.adminKeyRef(key),
    requestId: request.requestId ?? null,
  };
});
