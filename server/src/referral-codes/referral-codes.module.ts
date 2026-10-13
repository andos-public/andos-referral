import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminReferralCodesController } from './controllers/admin-referral-codes.controller';
import { ReferralCodesController } from './controllers/referral-codes.controller';
import { ReferralCodesService } from './referral-codes.service';

@Module({
  imports: [AuthModule],
  controllers: [ReferralCodesController, AdminReferralCodesController],
  providers: [ReferralCodesService],
  exports: [ReferralCodesService],
})
export class ReferralCodesModule {}
