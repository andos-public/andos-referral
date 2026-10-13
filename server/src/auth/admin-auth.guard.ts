import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

/**
 * Guards the authorized admin views with a static API key (`x-admin-key`).
 * Comparison is timing-safe. The proper admin identity provider is decided in Phase 5;
 * this key is rotated through the environment, never the repository.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_API_KEY');
    if (!expected) {
      throw new UnauthorizedException('Admin access is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const raw = request.headers['x-admin-key'];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    if (!provided || !constantTimeEquals(provided, expected)) {
      throw new UnauthorizedException('Invalid admin key');
    }
    return true;
  }
}

function constantTimeEquals(provided: string, expected: string): boolean {
  // Hash both sides first so inputs of different lengths compare safely.
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}
