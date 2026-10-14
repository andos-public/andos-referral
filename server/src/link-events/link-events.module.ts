import { Module } from '@nestjs/common';
import { AttributionModule } from '../attribution/attribution.module';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { LinkEventsController } from './controllers/link-events.controller';
import { VerifiedLinkEventsController } from './controllers/verified-link-events.controller';
import { LinkEventsService } from './link-events.service';

@Module({
  imports: [AuthModule, AttributionModule, IdentityModule],
  controllers: [LinkEventsController, VerifiedLinkEventsController],
  providers: [LinkEventsService],
  exports: [LinkEventsService],
})
export class LinkEventsModule {}
