import * as Sentry from '@sentry/node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,

    // Performance Monitoring
    tracesSampleRate: 1.0,

    // Integrations
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],

    // Environment
    environment: process.env.NODE_ENV || 'development',

    // Release tracking
    release: process.env.APP_VERSION || 'development',

    // Error filtering
    beforeSend(event, _hint) {
      // Don't send errors in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }
      return event;
    },

    // Tag all events with server info
    initialScope: {
      tags: {
        service: 'backend',
        runtime: 'nestjs',
      },
    },
  });
}

export { Sentry };
