import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

/** Global: any module that performs an auditable action can record it without re-importing. */
@Global()
@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}
