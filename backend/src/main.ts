// Import Sentry instrumentation FIRST, before any other imports
import './instrument';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOriginsEnv = process.env.CORS_ALLOWED_ORIGINS ?? '';
  const envOrigins = allowedOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (isProduction && envOrigins.length === 0) {
    throw new Error(
      '[CORS] CORS_ALLOWED_ORIGINS must be configured in production to avoid wildcard origins.',
    );
  }

  const defaultDevOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3003',
  ];
  const corsOrigins = envOrigins.length > 0 ? envOrigins : defaultDevOrigins;

  // Cookie parser for CSRF tokens
  app.use(cookieParser());

  // Attach a request ID to every request for cross-service tracing
  app.use((req: any, res: any, next: any) => {
    const headerReqId = req.headers['x-request-id'];
    const requestId =
      (Array.isArray(headerReqId) ? headerReqId[0] : headerReqId) || randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });

  // CSRF Protection (only in production or if explicitly enabled)
  const csrfEnabled = process.env.CSRF_ENABLED === 'true' || isProduction;
  if (csrfEnabled) {
    const {
      doubleCsrfProtection, // CSRF protection middleware
    } = doubleCsrf({
      getSecret: () => process.env.CSRF_SECRET || 'arcane-csrf-secret-change-in-production',
      getSessionIdentifier: (req) => {
        // Type assertion for req.user which is set by passport-jwt
        const user = req.user as { id?: string } | undefined;
        return user?.id || req.ip || 'anonymous';
      },
      cookieName: '__Host-psifi.x-csrf-token',
      cookieOptions: {
        sameSite: 'strict',
        path: '/',
        secure: isProduction,
        httpOnly: true,
      },
      size: 64,
      ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
    });

    // Apply CSRF protection globally (except for excluded routes)
    app.use((req: any, res: any, next: any) => {
      // Skip CSRF for Swagger, health checks, and webhooks
      if (
        req.path.startsWith('/api/docs') ||
        req.path.startsWith('/api/health') ||
        req.path.includes('/webhook')
      ) {
        return next();
      }

      // Apply CSRF protection
      doubleCsrfProtection(req, res, next);
    });

    logger.log(`🛡️  [SECURITY] CSRF Protection enabled`);
  } else {
    logger.warn(`⚠️  [SECURITY] CSRF Protection DISABLED (development mode)`);
  }

  // Security headers with Helmet (comprehensive configuration)
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
              scriptSrc: ["'self'", 'https://cdnjs.cloudflare.com'],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'", 'data:'],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,

      // Cross-Origin policies
      crossOriginEmbedderPolicy: false, // Disabled for API
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },

      // DNS Prefetch Control
      dnsPrefetchControl: { allow: false },

      // Frame Options (prevents clickjacking)
      frameguard: { action: 'deny' },

      // Hide Powered By Header
      hidePoweredBy: true,

      // HTTP Strict Transport Security (HSTS)
      hsts: isProduction
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
          }
        : false,

      // IE No Open
      ieNoOpen: true,

      // No Sniff (prevents MIME type sniffing)
      noSniff: true,

      // Origin Agent Cluster
      originAgentCluster: true,

      // Permitted Cross-Domain Policies
      permittedCrossDomainPolicies: { permittedPolicies: 'none' },

      // Referrer Policy
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },

      // X-XSS-Protection
      xssFilter: true,
    }),
  );

  // Enable compression for responses
  app.use(compression());

  // Enable CORS - En développement, accepter toutes les origines
  app.enableCors({
    origin: isProduction ? corsOrigins : true, // En dev, accepte tout
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

  // Swagger Documentation (exposed in all environments)
  const config = new DocumentBuilder()
    .setTitle('Arcane Platform API')
    .setDescription('Football Agency Management Platform - AI-Powered Scouting API Documentation')
    .setVersion('1.0.0')
    .setContact('Arcane Football', 'https://arcane.football', 'support@arcane.football')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Players', 'Player management endpoints')
    .addTag('Clubs', 'Club management endpoints')
    .addTag('Matches', 'Match management endpoints')
    .addTag('Reports', 'Scouting report endpoints')
    .addTag('Camps', 'Training camps and showcases')
    .addTag('Analytics', 'Custom analytics tracking')
    .addTag('AI', 'Arkane AI endpoints (summary, index, matchmaking)')
    .addTag('Subscriptions', 'Tier-based subscription management')
    .addTag('Media', 'Media upload and management')
    .addTag('Payments', 'Stripe payment endpoints')
    .addTag('Notifications', 'Push notification endpoints')
    .addTag('Hardware', 'GPS hardware ingestion and player metrics sessions')
    .addTag('Health', 'Health check and monitoring endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Arcane Platform API Docs',
    customfavIcon: 'https://nestjs.com/img/logo_text.svg',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: ['https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.5/swagger-ui.min.css'],
  });

  const port = process.env.API_PORT || 3000;
  await app.listen(port);

  logger.log(`\n🚀 [START] Arcane API running on: http://localhost:${port}/api`);
  logger.log(`📚 [DOCS] Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`💚 [HEALTH] Health check: http://localhost:${port}/api/health`);
  logger.log(`🔒 [SECURITY] Helmet enabled`);
  logger.log(`⚡ [PERF] Compression enabled`);
  logger.log(`🌍 [CORS] Allowed origins: ${corsOrigins.join(', ')}`);
  logger.log(`🔧 [ENV] Mode: ${process.env.NODE_ENV || 'development'}\n`);
}

bootstrap();
