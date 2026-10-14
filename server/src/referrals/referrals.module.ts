import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminReferralsController } from './controllers/admin-referrals.controller';
import { ReferralsController } from './controllers/referrals.controller';
import { ReferralsService } from './referrals.service';

@Module({
  imports: [AuthModule],
  controllers: [ReferralsController, AdminReferralsController],
  providers: [ReferralsService],
})
export class ReferralsModule {}
