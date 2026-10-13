import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser, UserRequest } from './auth.types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * TEMPORARY Phase-1 identity strategy: trusts the `x-user-id` header (set by a trusted
 * upstream, e.g. the main app or local tooling) and verifies the user exists and is ACTIVE.
 *
 * The production authentication strategy (main-app token/session exchange) is an OPEN
 * project decision — when it lands, this guard is replaced. `TRUSTED_USER_HEADER_AUTH=false`
 * disables the strategy, and production boot refuses to run with it enabled (see env validation).
 */
@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.config.get<boolean>('TRUSTED_USER_HEADER_AUTH') !== true) {
      throw new UnauthorizedException('No user authentication strategy is configured');
    }

    const request = context.switchToHttp().getRequest<UserRequest>();
    const raw = request.headers['x-user-id'];
    const userId = Array.isArray(raw) ? raw[0] : raw;
    if (!userId || !UUID_PATTERN.test(userId)) {
      throw new UnauthorizedException('Missing or malformed x-user-id header');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, accountStatus: true },
    });
    if (!user) {
      throw new UnauthorizedException('Unknown user');
    }
    if (user.accountStatus !== AccountStatus.ACTIVE) {
      throw new ForbiddenException(`Account is ${user.accountStatus}`);
    }

    const authenticated: AuthenticatedUser = {
      id: user.id,
      username: user.username,
      accountStatus: user.accountStatus,
    };
    request.user = authenticated;
    return true;
  }
}
