import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthResponse {
  status: 'ok' | 'degraded';
  db: boolean;
  uptimeSeconds: number;
  version: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness + database connectivity' })
  @ApiOkResponse({ description: 'Service and database status' })
  async check(): Promise<HealthResponse> {
    const db = await this.prisma.isHealthy();
    return {
      status: db ? 'ok' : 'degraded',
      db,
      uptimeSeconds: Math.round(process.uptime()),
      version: '0.1.0',
    };
  }
}
