import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AttributionModule } from './attribution/attribution.module';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { LinkEventsModule } from './link-events/link-events.module';
import { MainAppEventsModule } from './main-app-events/main-app-events.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReferralCodesModule } from './referral-codes/referral-codes.module';
import { ReferralsModule } from './referrals/referrals.module';

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
    PrismaModule,
    HealthModule,
    AttributionModule,
    ReferralCodesModule,
    LinkEventsModule,
    MainAppEventsModule,
    ReferralsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
