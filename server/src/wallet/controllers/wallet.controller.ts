import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import { UserAuthGuard } from '../../auth/user-auth.guard';
import { WalletLedgerListDto, WalletOverviewDto } from '../wallet.service';
import { WalletService } from '../wallet.service';

class LedgerListQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

/** Referrer wallet: balances (PENDING hold · AVAILABLE · RESERVED · WITHDRAWN) and ledger. */
@ApiTags('wallet')
@ApiHeader({
  name: 'x-user-id',
  required: true,
  description: 'Phase-1 trusted identity header (temporary; replaced by main-app auth exchange).',
})
@UseGuards(UserAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  @ApiOperation({
    summary: 'My wallet balances',
    description:
      'PENDING = held commission (released 168 h after ORDER_COMPLETED) · AVAILABLE = withdrawable · RESERVED = locked by pending payout requests · WITHDRAWN = paid out. All amounts are paise decimal strings.',
  })
  @ApiOkResponse({ type: WalletOverviewDto })
  overview(@CurrentUser() user: { id: string }): Promise<WalletOverviewDto> {
    return this.wallet.overview(user.id);
  }

  @Get('ledger')
  @ApiOperation({
    summary: 'My append-only ledger (newest first)',
    description: 'Every money movement with its entries. Rows are never edited; corrections are new compensating transactions.',
  })
  @ApiOkResponse({ type: WalletLedgerListDto })
  ledger(
    @CurrentUser() user: { id: string },
    @Query() query: LedgerListQueryDto,
  ): Promise<WalletLedgerListDto> {
    return this.wallet.listLedger(user.id, {
      limit: query.limit ?? 20,
      offset: query.offset ?? 0,
    });
  }
}
