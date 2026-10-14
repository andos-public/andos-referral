import { Injectable, NotFoundException } from '@nestjs/common';
import { PayoutMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePayoutMethodDto,
  PayoutMethodListDto,
  PayoutMethodResponseDto,
  UpdatePayoutMethodDto,
} from './payout-methods.dto';

/**
 * Payout methods hold ONLY a vault reference + a masked label — never raw bank/UPI details.
 * Owner-scoped: foreign or unknown ids answer 404 (no existence leak).
 */
@Injectable()
export class PayoutMethodsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePayoutMethodDto): Promise<PayoutMethodResponseDto> {
    const method = await this.prisma.payoutMethod.create({
      data: {
        userId,
        methodType: dto.methodType,
        providerVaultRef: dto.providerVaultRef,
        maskedLabel: dto.maskedLabel,
      },
    });
    return this.toResponse(method);
  }

  async listOwn(userId: string): Promise<PayoutMethodListDto> {
    const rows = await this.prisma.payoutMethod.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return { data: rows.map((row) => this.toResponse(row)) };
  }

  async update(userId: string, id: string, dto: UpdatePayoutMethodDto): Promise<PayoutMethodResponseDto> {
    const existing = await this.prisma.payoutMethod.findUnique({
      where: { userId_id: { userId, id } },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Payout method not found');
    }
    const updated = await this.prisma.payoutMethod.update({
      where: { id },
      data: {
        ...(dto.isActive === undefined ? {} : { isActive: dto.isActive }),
        ...(dto.maskedLabel === undefined ? {} : { maskedLabel: dto.maskedLabel }),
      },
    });
    return this.toResponse(updated);
  }

  async deactivate(userId: string, id: string): Promise<PayoutMethodResponseDto> {
    return this.update(userId, id, { isActive: false });
  }

  private toResponse(method: PayoutMethod): PayoutMethodResponseDto {
    return {
      id: method.id,
      methodType: method.methodType,
      maskedLabel: method.maskedLabel,
      isActive: method.isActive,
      createdAt: method.createdAt.toISOString(),
      updatedAt: method.updatedAt.toISOString(),
    };
  }
}
