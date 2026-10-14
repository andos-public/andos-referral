import { Module } from '@nestjs/common';
import { AttributionModule } from '../attribution/attribution.module';
import { AuthModule } from '../auth/auth.module';
import { IdentityModule } from '../identity/identity.module';
import { MainAppEventsController } from './controllers/main-app-events.controller';
import { MainAppEventsService } from './main-app-events.service';

@Module({
  imports: [AuthModule, AttributionModule, IdentityModule],
  controllers: [MainAppEventsController],
  providers: [MainAppEventsService],
  exports: [MainAppEventsService],
})
export class MainAppEventsModule {}
