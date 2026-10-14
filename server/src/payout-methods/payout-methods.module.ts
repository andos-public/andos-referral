import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PayoutMethodsController } from './payout-methods.controller';
import { PayoutMethodsService } from './payout-methods.service';

@Module({
  imports: [AuthModule],
  controllers: [PayoutMethodsController],
  providers: [PayoutMethodsService],
  exports: [PayoutMethodsService],
})
export class PayoutMethodsModule {}
