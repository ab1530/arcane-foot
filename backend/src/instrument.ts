import { Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

const logger = new Logger('Sentry');

// Initialize Sentry as early as possible
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  integrations: [nodeProfilingIntegration()],
  sendDefaultPii: true,
});

logger.log(
  '[OK] Sentry initialized for ' +
  (process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development'),
);

if (process.env.SENTRY_VALIDATE === 'true') {
  Sentry.captureException(new Error('Sentry validation heartbeat'));
}
