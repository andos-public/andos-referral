import { Module } from '@nestjs/common';
import { AttributionService } from './attribution.service';

/**
 * Shared attribution resolution (Sprint 2 refactor): verified link events and verified
 * main-app events both resolve their (code, referred user) attribution through this
 * service instead of each owning a private copy.
 */
@Module({
  providers: [AttributionService],
  exports: [AttributionService],
})
export class AttributionModule {}
