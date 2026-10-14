import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { AttributionModule } from './attribution/attribution.module';
import { AuditModule } from './audit/audit.module';
import { CommissionModule } from './commission/commission.module';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './identity/identity.module';
import { LinkEventsModule } from './link-events/link-events.module';
import { MainAppEventsModule } from './main-app-events/main-app-events.module';
import { ObservabilityModule } from './observability/observability.module';
import { OrderEventsModule } from './order-events/order-events.module';
import { PayoutMethodsModule } from './payout-methods/payout-methods.module';
import { PayoutRequestsModule } from './payout-requests/payout-requests.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReferralCodesModule } from './referral-codes/referral-codes.module';
import { ReferralsModule } from './referrals/referrals.module';
import { WalletModule } from './wallet/wallet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      // In tests the environment comes exclusively from process.env so a developer's
      // local .env can never change e2e behaviour (or leak dev secrets into assertions).
      ignoreEnvFile: process.env.NODE_ENV === 'test',
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('THROTTLE_TTL_MS') ?? 60_000,
            limit: config.get<number>('THROTTLE_LIMIT') ?? 300,
          },
        ],
      }),
    }),
    ObservabilityModule,
    AuditModule,
    PrismaModule,
    HealthModule,
    AdminModule,
    IdentityModule,
    AttributionModule,
    CommissionModule,
    WalletModule,
    ReferralCodesModule,
    LinkEventsModule,
    MainAppEventsModule,
    OrderEventsModule,
    PayoutMethodsModule,
    PayoutRequestsModule,
    ReferralsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
