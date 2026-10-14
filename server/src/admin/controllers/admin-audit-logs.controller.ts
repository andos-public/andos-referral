import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { AuditLogService } from '../../audit/audit-log.service';
import { AuditLogListDto, ListAuditLogsQueryDto } from '../../audit/audit.dto';

/**
 * Read-only view of the immutable audit trail. Rows are written by audited admin/system actions
 * and can never be edited or deleted (database trigger enforces append-only).
 */
@ApiTags('admin')
@ApiHeader({ name: 'x-admin-key', required: true, description: 'Static admin API key (Phase-1 placeholder).' })
@UseGuards(AdminAuthGuard)
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly auditLogs: AuditLogService) {}

  @Get()
  @ApiOperation({ summary: 'List audit entries (newest first)' })
  @ApiOkResponse({ type: AuditLogListDto })
  list(@Query() query: ListAuditLogsQueryDto): Promise<AuditLogListDto> {
    return this.auditLogs.list(query);
  }
}
