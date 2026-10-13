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

/**
 * Verifies the HMAC-SHA256 signature of a server-to-server event body.
 * Header value is either the hex digest or `sha256=<hex>`. The digest is computed over the
 * exact raw request bytes, then compared with a timing-safe equality check.
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
    const rawHeader = request.headers[SIGNATURE_HEADER];
    const provided = (Array.isArray(rawHeader) ? rawHeader[0] : rawHeader)
      ?.trim()
      .replace(/^sha256=/i, '');
    if (!provided) {
      throw new UnauthorizedException(`Missing ${SIGNATURE_HEADER} header`);
    }

    const rawBody = request.rawBody;
    if (!rawBody || rawBody.length === 0) {
      throw new UnauthorizedException('Raw request body is unavailable for signature verification');
    }

    const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
    if (!constantTimeEqualsHex(provided, expected)) {
      throw new UnauthorizedException('Invalid event signature');
    }
    return true;
  }
}

function constantTimeEqualsHex(provided: string, expected: string): boolean {
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
