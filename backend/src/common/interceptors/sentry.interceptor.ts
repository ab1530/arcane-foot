import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from '../../modules/prisma/prisma.service';

/**
 * Sentry Interceptor for tracking 403 errors and subscription conversion events
 *
 * This interceptor:
 * 1. Captures 403 errors with detailed context (user tier, endpoint, feature)
 * 2. Logs user journey for better debugging
 * 3. Stores metrics in database for analytics
 * 4. Tags events for easy filtering in Sentry
 */
@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private readonly logger = new Logger(SentryInterceptor.name);
  private readonly userJourneys = new Map<string, Array<{ path: string; timestamp: Date }>>();

  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const path = request.url;
    const method = request.method;

    // Track user journey (last 5 pages)
    if (user?.id) {
      this.trackUserJourney(user.id, path);
    }

    return next.handle().pipe(
      tap(() => {
        // Success - nothing to track
      }),
      catchError((error) => {
        // Only process 403 errors from subscription tier guard
        if (error instanceof ForbiddenException && error.message.includes('subscription tier')) {
          this.handle403Error(request, error, context);
        } else {
          // Log other errors to Sentry normally
          Sentry.captureException(error, {
            extra: {
              url: path,
              method,
              userId: user?.id,
            },
          });
        }

        return throwError(() => error);
      }),
    );
  }

  /**
   * Handle 403 errors with comprehensive tracking
   */
  private async handle403Error(
    request: any,
    error: ForbiddenException,
    context: ExecutionContext,
  ) {
    const user = request.user;
    const path = request.url;
    const method = request.method;

    // Extract required tier from error message
    const tierMatch = error.message.match(/(FREE|BASIC|PRO|GOLD|ENTERPRISE)/);
    const requiredTier = tierMatch ? tierMatch[1] : 'UNKNOWN';

    // Get user's current tier
    let currentTier = 'FREE';
    let userEmail = 'unknown';

    if (user?.id) {
      try {
        const subscription = await this.prisma.subscriptions.findUnique({
          where: { userId: user.id },
          select: { tier: true },
        });
        const userInfo = await this.prisma.users.findUnique({
          where: { id: user.id },
          select: { email: true },
        });
        currentTier = subscription?.tier || 'FREE';
        userEmail = userInfo?.email || 'unknown';
      } catch (err) {
        this.logger.warn('Failed to fetch user subscription info', err);
      }
    }

    // Extract feature name from path
    const feature = this.extractFeatureName(path);

    // Get user journey
    const journey = user?.id ? this.getUserJourney(user.id) : [];

    // Send to Sentry with custom tags
    Sentry.captureException(error, {
      level: 'warning',
      tags: {
        event_type: 'subscription.tier_blocked',
        feature: feature,
        required_tier: requiredTier,
        user_tier: currentTier,
        endpoint: path,
      },
      user: {
        id: user?.id || 'anonymous',
        email: userEmail,
      },
      extra: {
        method,
        path,
        requiredTier,
        currentTier,
        feature,
        userJourney: journey,
        timestamp: new Date().toISOString(),
      },
      fingerprint: ['403-tier-blocked', feature, currentTier, requiredTier],
    });

    // Store in database for analytics
    if (user?.id) {
      try {
        await this.prisma.rbac_events.create({
          data: {
            userId: user.id,
            eventType: 'FEATURE_BLOCKED',
            feature: feature,
            endpoint: path,
            method: method,
            currentTier: currentTier,
            requiredTier: requiredTier,
            userJourney: JSON.stringify(journey),
            ipAddress: request.ip,
            userAgent: request.headers['user-agent'],
            timestamp: new Date(),
          },
        });
      } catch (err) {
        this.logger.error('Failed to store RBAC event in database', err);
      }
    }

    this.logger.warn(
      `403 Tier Blocked: user=${user?.id} tier=${currentTier} required=${requiredTier} feature=${feature} path=${path}`,
    );
  }

  /**
   * Extract feature name from API path
   */
  private extractFeatureName(path: string): string {
    // Remove query params
    const cleanPath = path.split('?')[0];

    // Map endpoints to feature names
    const featureMap: Record<string, string> = {
      '/ai/': 'AI Analysis',
      '/arkane-match/': 'ArkaneMatch Chat',
      '/auto-scout/': 'AutoScout',
      '/market-value/': 'Market Value AI',
      '/performance-predictor/': 'Performance Predictor',
      '/playstyle-dna/': 'Playstyle DNA',
      '/smart-scout/': 'SmartScout AI',
      '/voice-to-report/': 'Voice to Report',
      '/marketplace/': 'Marketplace',
      '/camps/': 'Camps & Detection',
      '/coaching/': 'Coaching Bookings',
    };

    for (const [pathPattern, featureName] of Object.entries(featureMap)) {
      if (cleanPath.includes(pathPattern)) {
        return featureName;
      }
    }

    return 'Unknown Feature';
  }

  /**
   * Track user journey (last 5 pages)
   */
  private trackUserJourney(userId: string, path: string) {
    if (!this.userJourneys.has(userId)) {
      this.userJourneys.set(userId, []);
    }

    const journey = this.userJourneys.get(userId)!;
    journey.push({ path, timestamp: new Date() });

    // Keep only last 5 pages
    if (journey.length > 5) {
      journey.shift();
    }

    // Clean up old journeys (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    for (const [id, userJourney] of this.userJourneys.entries()) {
      if (userJourney.length > 0 && userJourney[userJourney.length - 1].timestamp < oneHourAgo) {
        this.userJourneys.delete(id);
      }
    }
  }

  /**
   * Get user journey
   */
  private getUserJourney(userId: string): Array<{ path: string; timestamp: Date }> {
    return this.userJourneys.get(userId) || [];
  }
}
