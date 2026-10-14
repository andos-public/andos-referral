import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';

export interface ResolvedEventUser {
  id: string;
  externalSubject: string | null;
}

/**
 * Resolves the user a trusted main-app event is about.
 *
 * Locked mapping (2026-10-14): the main app identifies users by Firebase Auth uid and maps
 * 1:1 onto `users.external_subject` (unique). Webhooks may therefore identify the user either
 * by our UUID (`referredUserId`) or by the Firebase uid (`externalUserId`). A previously
 * unseen uid is auto-provisioned (upsert) — the caller is HMAC-verified, so the uid is
 * trusted; credentials are never mirrored here.
 */
@Injectable()
export class IdentityService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveEventUser(input: {
    referredUserId?: string | null;
    externalUserId?: string | null;
  }): Promise<ResolvedEventUser> {
    const hasInternal = typeof input.referredUserId === 'string' && input.referredUserId.length > 0;
    const hasExternal = typeof input.externalUserId === 'string' && input.externalUserId.length > 0;

    if (hasInternal && hasExternal) {
      throw new BadRequestException('Provide either referredUserId or externalUserId, not both');
    }
    if (!hasInternal && !hasExternal) {
      throw new BadRequestException('referredUserId or externalUserId is required');
    }

    if (hasInternal) {
      const user = await this.prisma.user.findUnique({
        where: { id: input.referredUserId! },
        select: { id: true, externalSubject: true },
      });
      if (!user) {
        throw new UnprocessableEntityException('Unknown referredUserId');
      }
      return user;
    }

    return this.findOrCreateByExternalId(input.externalUserId!);
  }

  /** Lookup by Firebase uid; auto-provision on first sight (race-safe). */
  async findOrCreateByExternalId(externalUserId: string): Promise<ResolvedEventUser> {
    const existing = await this.prisma.user.findUnique({
      where: { externalSubject: externalUserId },
      select: { id: true, externalSubject: true },
    });
    if (existing) {
      return existing;
    }
    try {
      return await this.prisma.user.create({
        data: { externalSubject: externalUserId },
        select: { id: true, externalSubject: true },
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        const raced = await this.prisma.user.findUnique({
          where: { externalSubject: externalUserId },
          select: { id: true, externalSubject: true },
        });
        if (raced) {
          return raced;
        }
      }
      throw error;
    }
  }
}
