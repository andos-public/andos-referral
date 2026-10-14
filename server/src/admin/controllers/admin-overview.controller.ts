import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { AdminOverviewDto } from '../admin.dto';
import { AdminOverviewService } from '../admin-overview.service';

@ApiTags('admin')
@ApiHeader({ name: 'x-admin-key', required: true, description: 'Static admin API key (Phase-1 placeholder).' })
@UseGuards(AdminAuthGuard)
@Controller('admin/overview')
export class AdminOverviewController {
  constructor(private readonly overview: AdminOverviewService) {}

  @Get()
  @ApiOperation({
    summary: 'Operational dashboard',
    description:
      'Live counters for users, codes, attribution, orders, wallets, the commission-hold queue, payouts, ledger and audit trail. Read-only.',
  })
  @ApiOkResponse({ type: AdminOverviewDto })
  overviewSnapshot(): Promise<AdminOverviewDto> {
    return this.overview.overview();
  }
}
