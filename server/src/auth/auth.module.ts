import { Module } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { UserAuthGuard } from './user-auth.guard';
import { WebhookSignatureGuard } from './webhook-signature.guard';

/**
 * Authentication/authorization building blocks. Guards depend only on the globally
 * available ConfigModule and PrismaModule, so this module mainly wires them for
 * explicit import by feature modules.
 */
@Module({
  providers: [UserAuthGuard, AdminAuthGuard, WebhookSignatureGuard],
  exports: [UserAuthGuard, AdminAuthGuard, WebhookSignatureGuard],
})
export class AuthModule {}
