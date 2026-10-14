import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { MetricsService, MetricsSnapshot } from '../../observability/metrics.service';

@ApiTags('admin')
@ApiHeader({ name: 'x-admin-key', required: true, description: 'Static admin API key (Phase-1 placeholder).' })
@UseGuards(AdminAuthGuard)
@Controller('admin/metrics')
export class AdminMetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  @ApiOperation({
    summary: 'In-process operational counters',
    description:
      'Request counts by method/status class, webhook outcomes, commission locked/released/reversed, hold sweeps, payout transitions and error counts since process start.',
  })
  @ApiOkResponse({ description: 'Counter snapshot' })
  snapshot(): MetricsSnapshot {
    return this.metrics.snapshot();
  }
}
