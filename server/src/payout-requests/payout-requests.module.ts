import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { AdminPayoutRequestsController } from './controllers/admin-payout-requests.controller';
import { PayoutRequestsController } from './controllers/payout-requests.controller';
import { PayoutRequestsService } from './payout-requests.service';

@Module({
  imports: [AuthModule, WalletModule],
  controllers: [PayoutRequestsController, AdminPayoutRequestsController],
  providers: [PayoutRequestsService],
  exports: [PayoutRequestsService],
})
export class PayoutRequestsModule {}
