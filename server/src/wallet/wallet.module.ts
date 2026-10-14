import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminWalletController } from './controllers/admin-wallet.controller';
import { WalletController } from './controllers/wallet.controller';
import { HoldsService } from './holds.service';
import { LedgerService } from './ledger.service';
import { WalletService } from './wallet.service';

@Module({
  imports: [AuthModule],
  controllers: [WalletController, AdminWalletController],
  providers: [LedgerService, WalletService, HoldsService],
  exports: [LedgerService, WalletService, HoldsService],
})
export class WalletModule {}
