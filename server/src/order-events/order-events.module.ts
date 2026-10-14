import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CommissionModule } from '../commission/commission.module';
import { IdentityModule } from '../identity/identity.module';
import { WalletModule } from '../wallet/wallet.module';
import { OrderEventsController } from './controllers/order-events.controller';
import { OrderEventsService } from './order-events.service';

@Module({
  imports: [AuthModule, IdentityModule, CommissionModule, WalletModule],
  controllers: [OrderEventsController],
  providers: [OrderEventsService],
  exports: [OrderEventsService],
})
export class OrderEventsModule {}
