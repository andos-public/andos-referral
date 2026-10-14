import { Injectable } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { formatMinorUnits } from '../common/money.util';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from './ledger.service';

export class WalletBalancesDto {
  @ApiProperty({ example: '5000', description: 'Held commission (paise, decimal string) — released after 168 h.' })
  pendingMinorUnits!: string;

  @ApiProperty({ example: '12000', description: 'Withdrawable balance (paise, decimal string).' })
  availableMinorUnits!: string;

  @ApiProperty({ example: '3000', description: 'Reserved by pending payout requests (paise).' })
  reservedMinorUnits!: string;

  @ApiProperty({ example: '9000', description: 'Already paid out (paise).' })
  withdrawnMinorUnits!: string;
}

export class WalletOverviewDto {
  @ApiProperty({ example: 'INR' })
  currency!: string;

  @ApiProperty({ type: WalletBalancesDto })
  balances!: WalletBalancesDto;

  @ApiPropertyOptional({ type: String, nullable: true })
  updatedAt!: string | null;

  @ApiProperty({ example: 7, description: 'Number of ledger transactions on this wallet.' })
  ledgerTransactionCount!: number;
}

export class WalletLedgerEntryDto {
  @ApiProperty({ enum: ['PENDING', 'AVAILABLE', 'RESERVED', 'WITHDRAWN'] })
  bucket!: string;

  @ApiProperty({ example: '-5000', description: 'Signed paise (decimal string).' })
  amountMinorUnits!: string;
}

export class WalletLedgerTransactionDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: ['COMMISSION_LOCKED', 'COMMISSION_RELEASE', 'COMMISSION_REVERSAL', 'WITHDRAWAL_RESERVATION', 'WITHDRAWAL_RELEASE', 'WITHDRAWAL_COMPLETION'] })
  transactionType!: string;

  @ApiProperty({ example: 'order_event' })
  referenceType!: string;

  @ApiProperty({ format: 'uuid' })
  referenceId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  commissionBaseMinorUnits!: string | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  rateBps!: number | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  commissionMinorUnits!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  promoCodeNormalized!: string | null;

  @ApiProperty({ example: '2026-10-14T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ type: [WalletLedgerEntryDto] })
  entries!: WalletLedgerEntryDto[];
}

export class WalletLedgerListDto {
  @ApiProperty({ type: [WalletLedgerTransactionDto] })
  data!: WalletLedgerTransactionDto[];

  @ApiProperty({ example: 9 })
  total!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 0 })
  offset!: number;
}

const LEDGER_INCLUDE = {
  entries: { select: { bucket: true, amountMinorUnits: true }, orderBy: { lineNumber: 'asc' } },
} as const;

type LedgerRow = Prisma.WalletLedgerTransactionGetPayload<{ include: typeof LEDGER_INCLUDE }>;

/**
 * Read side of the wallet. Balances come from the projection row; the append-only ledger is
 * the audit trail (and the rebuildable source of truth — see LedgerService.projectBalancesFromLedger).
 */
@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  async overview(userId: string, currency = 'INR'): Promise<WalletOverviewDto> {
    const [balances, transactionCount] = await Promise.all([
      this.ledger.getBalances(userId, currency),
      this.prisma.walletLedgerTransaction.count({ where: { userId, currency } }),
    ]);
    return {
      currency,
      balances: {
        pendingMinorUnits: formatMinorUnits(balances.pendingMinorUnits),
        availableMinorUnits: formatMinorUnits(balances.availableMinorUnits),
        reservedMinorUnits: formatMinorUnits(balances.reservedMinorUnits),
        withdrawnMinorUnits: formatMinorUnits(balances.withdrawnMinorUnits),
      },
      updatedAt: balances.updatedAt ? balances.updatedAt.toISOString() : null,
      ledgerTransactionCount: transactionCount,
    };
  }

  async listLedger(
    userId: string,
    options: { limit: number; offset: number; currency?: string },
  ): Promise<WalletLedgerListDto> {
    const currency = options.currency ?? 'INR';
    const where = { userId, currency };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.walletLedgerTransaction.findMany({
        where,
        include: LEDGER_INCLUDE,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: options.limit,
        skip: options.offset,
      }),
      this.prisma.walletLedgerTransaction.count({ where }),
    ]);
    return {
      data: rows.map((row) => this.toTransaction(row)),
      total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  private toTransaction(row: LedgerRow): WalletLedgerTransactionDto {
    return {
      id: row.id,
      transactionType: row.transactionType,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      commissionBaseMinorUnits:
        row.commissionBaseMinorUnits === null ? null : formatMinorUnits(row.commissionBaseMinorUnits),
      rateBps: row.rateBps,
      commissionMinorUnits:
        row.commissionMinorUnits === null ? null : formatMinorUnits(row.commissionMinorUnits),
      promoCodeNormalized: row.promoCodeNormalized,
      createdAt: row.createdAt.toISOString(),
      entries: row.entries.map((entry) => ({
        bucket: entry.bucket,
        amountMinorUnits: formatMinorUnits(entry.amountMinorUnits),
      })),
    };
  }
}
