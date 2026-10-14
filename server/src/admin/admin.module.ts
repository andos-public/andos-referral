import { Module } from '@nestjs/common';
import { AdminInspectionService } from './admin-inspection.service';
import { AdminOverviewService } from './admin-overview.service';
import { AdminAuditLogsController } from './controllers/admin-audit-logs.controller';
import { AdminInspectionController } from './controllers/admin-inspection.controller';
import { AdminMetricsController } from './controllers/admin-metrics.controller';
import { AdminOverviewController } from './controllers/admin-overview.controller';

/** Phase-1 admin console slice: dashboard, inspection and audit reads (all x-admin-key guarded). */
@Module({
  controllers: [
    AdminOverviewController,
    AdminInspectionController,
    AdminAuditLogsController,
    AdminMetricsController,
  ],
  providers: [AdminOverviewService, AdminInspectionService],
  exports: [AdminInspectionService, AdminOverviewService],
})
export class AdminModule {}
