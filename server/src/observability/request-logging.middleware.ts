import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { MetricsService } from './metrics.service';
import { RequestContextService } from './request-context.service';

export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestLogPayload {
  level: 'info' | 'error';
  msg: string;
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
  userId?: string;
}

/**
 * Correlation id + one structured JSON log line per request.
 * The id is echoed back in `x-request-id`, so a client or a log aggregator can join the two.
 * Client-supplied ids are accepted but sanitized (bounded length, safe charset).
 */
export function requestLoggingMiddleware(
  context: RequestContextService,
  metrics: MetricsService,
  options: { enabled: boolean },
): (req: Request, res: Response, next: NextFunction) => void {
  const logger = new Logger('HTTP');

  return (req: Request, res: Response, next: NextFunction): void => {
    const requestId = sanitizeRequestId(req.headers[REQUEST_ID_HEADER]) ?? randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);
    // Also exposed on the request so decorators/audit rows can read it synchronously.
    (req as Request & { requestId?: string }).requestId = requestId;
    const startedAt = process.hrtime.bigint();

    context.run({ requestId }, () => {
      res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        metrics.observeHttp(req.method, res.statusCode, durationMs);

        const state = context.get();
        const payload = buildRequestLogPayload({
          requestId,
          method: req.method,
          route: req.originalUrl ?? req.url,
          status: res.statusCode,
          durationMs,
          userId: state?.userId,
        });
        if (!options.enabled) {
          return;
        }
        if (payload.level === 'error') {
          logger.error(JSON.stringify(payload));
        } else {
          logger.log(JSON.stringify(payload));
        }
      });
      next();
    });
  };
}

export function buildRequestLogPayload(input: Omit<RequestLogPayload, 'level' | 'msg'>): RequestLogPayload {
  return {
    level: input.status >= 500 ? 'error' : 'info',
    msg: 'http_request',
    requestId: input.requestId,
    method: input.method,
    route: input.route,
    status: input.status,
    durationMs: Math.round(input.durationMs * 100) / 100,
    ...(input.userId ? { userId: input.userId } : {}),
  };
}

export function sanitizeRequestId(value: unknown): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed.length > 128) {
    return null;
  }
  return /^[A-Za-z0-9._:-]+$/.test(trimmed) ? trimmed : null;
}
