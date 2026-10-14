import {
  CanActivate,
  ExecutionContext,
  Injectable,
  RawBodyRequest,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

export const SIGNATURE_HEADER = 'x-andos-signature';
export const TIMESTAMP_HEADER = 'x-andos-timestamp';

export type WebhookSignatureMode = 'body-only' | 'timestamp-bound';

export interface VerifiedSignature {
  mode: WebhookSignatureMode;
  /** Epoch millis of the bound timestamp, or null for a legacy body-only signature. */
  timestampMs: number | null;
}

/**
 * Verifies HMAC-SHA256 signatures on server-to-server event bodies.
 *
 * Replay defence (Sprint 4):
 *  - `x-andos-timestamp` (unix seconds, unix millis or ISO-8601) must be within
 *    WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS (default 300 s) of now — stale or future-dated
 *    requests are rejected.
 *  - when the header is present the signature MUST be computed over `${timestamp}.${rawBody}`
 *    (binding), so a captured body cannot be re-signed with a fresh timestamp.
 *  - WEBHOOK_REQUIRE_TIMESTAMP (forced on in production) makes the header mandatory.
 *
 * Header value is a hex digest or `sha256=<hex>`; comparison is timing-safe over SHA-256
 * digests so unequal lengths cannot leak information.
 */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const secret = this.config.get<string>('MAIN_APP_WEBHOOK_SECRET');
    if (!secret) {
      throw new UnauthorizedException('Webhook signature verification is not configured');
    }

    const request = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const provided = readHeader(request, SIGNATURE_HEADER)?.trim().replace(/^sha256=/i, '');
    if (!provided) {
      throw new UnauthorizedException(`Missing ${SIGNATURE_HEADER} header`);
    }

    const rawBody = request.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new UnauthorizedException('Raw request body is unavailable for signature verification');
    }

    const timestampHeader = readHeader(request, TIMESTAMP_HEADER);
    if (!timestampHeader) {
      if (this.requireTimestamp()) {
        throw new UnauthorizedException(`Missing ${TIMESTAMP_HEADER} header`);
      }
      if (!constantTimeEqualsHex(provided, signBody(secret, rawBody))) {
        throw new UnauthorizedException('Invalid event signature');
      }
      return true;
    }

    const timestampMs = parseTimestampHeader(timestampHeader);
    if (timestampMs === null) {
      throw new UnauthorizedException(`Malformed ${TIMESTAMP_HEADER} header`);
    }

    const toleranceMs = (this.config.get<number>('WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS') ?? 300) * 1000;
    const skewMs = Date.now() - timestampMs;
    if (skewMs > toleranceMs) {
      throw new UnauthorizedException('Stale webhook timestamp — request rejected (replay defence)');
    }
    if (skewMs < -toleranceMs) {
      throw new UnauthorizedException('Webhook timestamp is too far in the future');
    }

    const expected = signBody(secret, rawBody, timestampHeader.trim(), true);
    if (!constantTimeEqualsHex(provided, expected)) {
      throw new UnauthorizedException('Invalid event signature');
    }
    return true;
  }

  private requireTimestamp(): boolean {
    return this.config.get<boolean>('WEBHOOK_REQUIRE_TIMESTAMP') ?? false;
  }
}

/** `timestamp.rawBody` binding — the timestamp is the header value exactly as sent. */
export function buildSignedPayload(rawBody: Buffer | string, timestamp: string): Buffer {
  return Buffer.concat([Buffer.from(`${timestamp}.`, 'utf8'), Buffer.from(rawBody)]);
}

function signBody(secret: string, rawBody: Buffer, timestamp?: string, bind = false): string {
  const payload = bind && timestamp !== undefined ? buildSignedPayload(rawBody, timestamp) : rawBody;
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Accepts unix seconds, unix millis or ISO-8601; returns epoch millis or null when unusable. */
export function parseTimestampHeader(value: string): number | null {
  const raw = value.trim();
  if (raw.length === 0) {
    return null;
  }
  if (/^\d{9,11}$/.test(raw)) {
    return Number(raw) * 1000;
  }
  if (/^\d{12,14}$/.test(raw)) {
    return Number(raw);
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? null : parsed;
}

function readHeader(request: Request, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

function constantTimeEqualsHex(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
