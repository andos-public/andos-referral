import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { parseTrustProxy } from './config/trust-proxy.util';
import { MetricsService } from './observability/metrics.service';
import { RequestContextService } from './observability/request-context.service';
import { REQUEST_ID_HEADER, requestLoggingMiddleware } from './observability/request-logging.middleware';

/**
 * Shared app wiring for `main.ts` and the e2e tests, so what the tests exercise is what
 * production runs: global prefix, validation, CORS and (env-gated) Swagger.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('v1');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(ConfigService);

  // Behind a load balancer/proxy the client IP and the rate-limit key must come from
  // X-Forwarded-For — but only when the deployment actually sits behind trusted hops.
  const trustProxy = parseTrustProxy(config.get<string>('TRUST_PROXY'));
  if (trustProxy !== false) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
  }

  // Correlation id first so every later log line (and audit row) can reference it.
  app.use(
    requestLoggingMiddleware(app.get(RequestContextService), app.get(MetricsService), {
      enabled: config.get<boolean>('REQUEST_LOG_ENABLED') ?? true,
    }),
  );

  // Raw database constraint failures become stable 4xx responses instead of leaking a 500.
  app.useGlobalFilters(
    new PrismaExceptionFilter(
      app.getHttpAdapter() as unknown as ConstructorParameters<typeof PrismaExceptionFilter>[0],
      app.get(RequestContextService),
    ),
  );

  // CORS is denied by default: only explicitly configured origins may call the API from a
  // browser (native/mobile clients are unaffected). Wildcard origins are intentionally not
  // supported; the API never uses cookies/credentials, only explicit headers.
  const origins = (config.get<string>('CORS_ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (origins.length > 0) {
    app.enableCors({
      origin: origins,
      methods: ['GET', 'POST'],
      allowedHeaders: [
        'content-type',
        'x-user-id',
        'x-admin-key',
        'x-andos-signature',
        'x-andos-timestamp',
        REQUEST_ID_HEADER,
      ],
      exposedHeaders: [REQUEST_ID_HEADER],
      maxAge: 600,
    });
  }

  // Swagger is opt-in via DOCS_ENABLED (default OFF — production-safe: /docs maps admin routes).
  if (config.get<boolean>('DOCS_ENABLED')) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Andos Referral API')
      .setDescription(
        'Referral service — Phase 1 foundation. Contracts remain proposals until agreed with the main-app team.',
      )
      .setVersion('0.1')
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));
  }
}
