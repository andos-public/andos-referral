import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LinkEventsController } from './controllers/link-events.controller';
import { VerifiedLinkEventsController } from './controllers/verified-link-events.controller';
import { LinkEventsService } from './link-events.service';

@Module({
  imports: [AuthModule],
  controllers: [LinkEventsController, VerifiedLinkEventsController],
  providers: [LinkEventsService],
  exports: [LinkEventsService],
})
export class LinkEventsModule {}
