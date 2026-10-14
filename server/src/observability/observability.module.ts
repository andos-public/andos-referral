import { Global, Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { RequestContextService } from './request-context.service';

/** Global so every feature module can record metrics / read the request id without re-importing. */
@Global()
@Module({
  providers: [RequestContextService, MetricsService],
  exports: [RequestContextService, MetricsService],
})
export class ObservabilityModule {}
