import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

import { APP_VERSION } from '../common/app-version';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  db: boolean;
  uptimeSeconds: number;
  version: string;
}

export interface LivenessResponse {
  status: 'ok';
  uptimeSeconds: number;
  version: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  version: string;
  checks: {
    database: { status: 'up' | 'down'; latencyMs: number | null; error?: string };
    schema: { status: 'up' | 'down'; tables?: number; error?: string };
  };
}

/** Tables the Phase-1 API cannot serve without; readiness fails loudly if any is missing. */
const REQUIRED_TABLES = [
  'users',
  'referral_codes',
  'referral_attributions',
  'referral_link_events',
  'referral_order_events',
  'wallet_ledger_transactions',
  'wallet_accounts',
  'payout_requests',
  'admin_audit_logs',
];

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + database connectivity (legacy shape, always 200)' })
  @ApiOkResponse({ description: 'Service and database status' })
  async check(): Promise<HealthResponse> {
    const db = await this.prisma.isHealthy();
    return {
      status: db ? 'ok' : 'degraded',
      db,
      uptimeSeconds: Math.round(process.uptime()),
      version: APP_VERSION,
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe — process is up (no dependencies touched)' })
  @ApiOkResponse({ description: 'Process is alive' })
  live(): LivenessResponse {
    return { status: 'ok', uptimeSeconds: Math.round(process.uptime()), version: APP_VERSION };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe — database reachable and Phase-1 schema present',
    description: 'Returns 200 when the instance can serve traffic and 503 otherwise (no partial reads).',
  })
  @ApiOkResponse({ description: 'Instance is ready' })
  @ApiServiceUnavailableResponse({ description: 'Instance is not ready (database or schema check failed)' })
  async ready(@Res({ passthrough: true }) response: Response): Promise<ReadinessResponse> {
    const database = await this.checkDatabase();
    const schema = database.status === 'up' ? await this.checkSchema() : { status: 'down' as const, error: 'database unavailable' };
    const ready = database.status === 'up' && schema.status === 'up';

    response.status(ready ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE);
    return {
      status: ready ? 'ready' : 'not_ready',
      version: APP_VERSION,
      checks: { database, schema },
    };
  }

  private async checkDatabase(): Promise<ReadinessResponse['checks']['database']> {
    const startedAt = process.hrtime.bigint();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latencyMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      return { status: 'up', latencyMs: Math.round(latencyMs * 100) / 100 };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: null,
        error: error instanceof Error ? error.message : 'unknown database error',
      };
    }
  }

  private async checkSchema(): Promise<ReadinessResponse['checks']['schema']> {
    try {
      const rows = await this.prisma.$queryRaw<{ present: bigint }[]>`
        SELECT count(*)::bigint AS present
        FROM unnest(${REQUIRED_TABLES}::text[]) AS required(name)
        WHERE to_regclass('referral_app.' || required.name) IS NOT NULL
      `;
      const present = Number(rows[0]?.present ?? 0n);
      return present === REQUIRED_TABLES.length
        ? { status: 'up', tables: present }
        : { status: 'down', tables: present, error: `expected ${REQUIRED_TABLES.length} tables, found ${present}` };
    } catch (error) {
      return { status: 'down', error: error instanceof Error ? error.message : 'schema check failed' };
    }
  }
}
