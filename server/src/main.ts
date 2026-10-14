import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap(): Promise<void> {
  // rawBody: true keeps the exact request bytes for HMAC verification of signed events.
  const app = await NestFactory.create(AppModule, { rawBody: true });
  configureApp(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
  Logger.log(
    `API listening on http://localhost:${port}/v1 (docs: /docs when DOCS_ENABLED=true)`,
    'Bootstrap',
  );
}

void bootstrap();
