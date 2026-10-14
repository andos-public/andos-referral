import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { HoldsService, ReleaseSweepResult } from '../holds.service';

class ReleaseSweepDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 1000, default: 200 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 200;
}

/**
 * Ops/automation surface for the 168-hour reward hold. A scheduler (BullMQ worker or cron)
 * calls this repeatedly; it is idempotent and safe to run concurrently.
 */
@ApiTags('admin')
@ApiHeader({
  name: 'x-admin-key',
  required: true,
  description: 'Static admin API key (Phase-1 placeholder for the Phase-5 admin console).',
})
@UseGuards(AdminAuthGuard)
@Controller('admin/wallet')
export class AdminWalletController {
  constructor(private readonly holds: HoldsService) {}

  @Post('release-due')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Release commissions whose 168-hour hold has elapsed',
    description:
      'Moves PENDING → AVAILABLE for every ORDER_COMPLETED event older than the hold window that was neither reversed nor released yet. Idempotent; returns scan/release counters.',
  })
  @ApiOkResponse({ description: 'Sweep result counters' })
  releaseDue(@Body() dto: ReleaseSweepDto): Promise<ReleaseSweepResult> {
    return this.holds.sweep(dto.limit ?? 200);
  }
}
