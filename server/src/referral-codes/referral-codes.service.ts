import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, ReferralCode } from '@prisma/client';
import { isUniqueConstraintViolation } from '../common/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { AdminListReferralCodesQueryDto } from './dto/admin-list-referral-codes-query.dto';
import { CreateReferralCodeDto } from './dto/create-referral-code.dto';
import {
  ListReferralCodesQueryDto,
  ReferralCodeStateFilter,
} from './dto/list-referral-codes-query.dto';
import {
  AdminReferralCodeListResponseDto,
  AdminReferralCodeResponseDto,
  AdminSummaryResponseDto,
  ReferralCodeListResponseDto,
  ReferralCodeMetricsDto,
  ReferralCodeResponseDto,
} from './dto/referral-code-response.dto';
import {
  buildShareUrl,
  computeCodeState,
  generatePublicCode,
  normalizePublicCode,
  toNumber,
} from './referral-code.util';

const CODE_ALLOCATION_ATTEMPTS = 5;

type MetricRow = {
  clickCount: bigint;
  uniqueClickCount: bigint;
  referralCount: bigint;
  conversionCount: bigint;
  updatedAt: Date;
} | null;

type CodeWithMetric = ReferralCode & { metric: MetricRow };
type CodeWithMetricAndOwner = CodeWithMetric & { owner: { id: string; username: string | null } };

@Injectable()
export class ReferralCodesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  /** Creates a reusable referral code for the authenticated owner. `expiresAt: null` = evergreen. */
  async create(ownerUserId: string, dto: CreateReferralCodeDto): Promise<ReferralCodeResponseDto> {
    const expiresAt = this.parseExpiry(dto.expiresAt);

    if (dto.campaignId) {
      const campaign = await this.prisma.referralCampaign.findUnique({
        where: { id: dto.campaignId },
        select: { id: true },
      });
      if (!campaign) {
        throw new BadRequestException('Unknown campaignId');
      }
    }

    for (let attempt = 0; attempt < CODE_ALLOCATION_ATTEMPTS; attempt += 1) {
      const publicCode = generatePublicCode();
      const existing = await this.prisma.referralCode.findFirst({
        where: { publicCode },
        select: { id: true },
      });
      if (existing) {
        continue;
      }
      try {
        const created = await this.prisma.referralCode.create({
          data: {
            ownerUserId,
            publicCode,
            expiresAt,
            campaignId: dto.campaignId ?? null,
          },
          include: { metric: true },
        });
        return this.toResponse(created);
      } catch (error) {
        // Astronomically unlikely collision (case-insensitive functional unique index) — retry.
        if (isUniqueConstraintViolation(error)) {
          continue;
        }
        throw error;
      }
    }
    throw new ServiceUnavailableException('Could not allocate a unique referral code, please retry');
  }

  async listOwn(
    ownerUserId: string,
    query: ListReferralCodesQueryDto,
  ): Promise<ReferralCodeListResponseDto> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const where: Prisma.ReferralCodeWhereInput = {
      ownerUserId,
      ...this.stateFilter(query.state),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.referralCode.findMany({
        where,
        include: { metric: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.referralCode.count({ where }),
    ]);

    return { data: rows.map((row) => this.toResponse(row)), total, limit, offset };
  }

  /** Owners can only read their own codes; foreign ids answer 404 so existence is not leaked. */
  async getOwn(ownerUserId: string, id: string): Promise<ReferralCodeResponseDto> {
    const row = await this.prisma.referralCode.findFirst({
      where: { id, ownerUserId },
      include: { metric: true },
    });
    if (!row) {
      throw new NotFoundException('Referral code not found');
    }
    return this.toResponse(row);
  }

  /** Explicitly disables a link. Idempotent: deactivating an already-inactive code is a no-op. */
  async deactivate(ownerUserId: string, id: string): Promise<ReferralCodeResponseDto> {
    const row = await this.prisma.referralCode.findFirst({
      where: { id, ownerUserId },
      include: { metric: true },
    });
    if (!row) {
      throw new NotFoundException('Referral code not found');
    }
    if (!row.isActive) {
      return this.toResponse(row);
    }
    const updated = await this.prisma.referralCode.update({
      where: { id },
      data: { isActive: false },
      include: { metric: true },
    });
    return this.toResponse(updated);
  }

  async getMetrics(ownerUserId: string, id: string): Promise<ReferralCodeMetricsDto> {
    const row = await this.prisma.referralCode.findFirst({
      where: { id, ownerUserId },
      select: { id: true, metric: true },
    });
    if (!row) {
      throw new NotFoundException('Referral code not found');
    }
    return this.metricsDto(row.metric);
  }

  // ───────────────────────────── authorized admin views ─────────────────────────────

  async adminList(query: AdminListReferralCodesQueryDto): Promise<AdminReferralCodeListResponseDto> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;
    const where: Prisma.ReferralCodeWhereInput = {
      ...(query.ownerUserId ? { ownerUserId: query.ownerUserId } : {}),
      ...(query.publicCode ? { publicCode: normalizePublicCode(query.publicCode) } : {}),
      ...this.stateFilter(query.state),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.referralCode.findMany({
        where,
        include: { metric: true, owner: { select: { id: true, username: true } } },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.referralCode.count({ where }),
    ]);

    return { data: rows.map((row) => this.toAdminResponse(row)), total, limit, offset };
  }

  async adminGet(id: string): Promise<AdminReferralCodeResponseDto> {
    const row = await this.prisma.referralCode.findUnique({
      where: { id },
      include: { metric: true, owner: { select: { id: true, username: true } } },
    });
    if (!row) {
      throw new NotFoundException('Referral code not found');
    }
    return this.toAdminResponse(row);
  }

  async adminSummary(): Promise<AdminSummaryResponseDto> {
    const now = new Date();
    const [total, inactive, expired, aggregate] = await this.prisma.$transaction([
      this.prisma.referralCode.count(),
      this.prisma.referralCode.count({ where: { isActive: false } }),
      this.prisma.referralCode.count({ where: { isActive: true, expiresAt: { lte: now } } }),
      this.prisma.referralLinkMetric.aggregate({
        _sum: {
          clickCount: true,
          uniqueClickCount: true,
          referralCount: true,
          conversionCount: true,
        },
      }),
    ]);

    return {
      codes: { total, active: total - inactive - expired, expired, inactive },
      totals: {
        clickCount: toNumber(aggregate._sum.clickCount),
        uniqueClickCount: toNumber(aggregate._sum.uniqueClickCount),
        referralCount: toNumber(aggregate._sum.referralCount),
        conversionCount: toNumber(aggregate._sum.conversionCount),
      },
    };
  }

  // ───────────────────────────────────── helpers ─────────────────────────────────────

  private parseExpiry(raw: string | null | undefined): Date | null {
    if (raw === null || raw === undefined || raw === '') {
      return null;
    }
    const expiresAt = new Date(raw);
    if (Number.isNaN(expiresAt.getTime())) {
      throw new BadRequestException('expiresAt must be a valid ISO-8601 timestamp');
    }
    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'expiresAt must be in the future — omit it or pass null for an evergreen link',
      );
    }
    return expiresAt;
  }

  private stateFilter(state: ReferralCodeStateFilter | undefined): Prisma.ReferralCodeWhereInput {
    const now = new Date();
    switch (state) {
      case 'ACTIVE':
        return { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] };
      case 'EXPIRED':
        return { isActive: true, expiresAt: { lte: now } };
      case 'INACTIVE':
        return { isActive: false };
      default:
        return {};
    }
  }

  private toResponse(code: CodeWithMetric): ReferralCodeResponseDto {
    return {
      id: code.id,
      publicCode: code.publicCode,
      shareUrl: buildShareUrl(this.shareBaseUrl, code.publicCode),
      state: computeCodeState(code),
      isActive: code.isActive,
      expiresAt: code.expiresAt ? code.expiresAt.toISOString() : null,
      campaignId: code.campaignId,
      createdAt: code.createdAt.toISOString(),
      updatedAt: code.updatedAt.toISOString(),
      metrics: this.metricsDto(code.metric),
    };
  }

  private toAdminResponse(code: CodeWithMetricAndOwner): AdminReferralCodeResponseDto {
    return {
      ...this.toResponse(code),
      owner: { id: code.owner.id, username: code.owner.username },
    };
  }

  private metricsDto(metric: MetricRow): ReferralCodeMetricsDto {
    return {
      clickCount: toNumber(metric?.clickCount),
      uniqueClickCount: toNumber(metric?.uniqueClickCount),
      referralCount: toNumber(metric?.referralCount),
      conversionCount: toNumber(metric?.conversionCount),
      updatedAt: metric ? metric.updatedAt.toISOString() : null,
    };
  }

  private get shareBaseUrl(): string {
    return this.config.get<string>('REFERRAL_LINK_BASE_URL') ?? '';
  }
}
