// Import Sentry instrumentation FIRST, before any other imports
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: process.env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Enable compression for responses
  app.use(compression());

  // Enable CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.API_PORT || 3000;
  await app.listen(port);

  console.log(`[START] Arcane API running on: http://localhost:${port}/api`);
  console.log(`[HEALTH] Health check: http://localhost:${port}/api/health`);
  console.log(`[SECURITY] Helmet enabled`);
  console.log(`[PERF] Compression enabled`);
}

bootstrap();
