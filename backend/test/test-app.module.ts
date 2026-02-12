import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { PrismaModule } from '../src/modules/prisma/prisma.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PlayersModule } from '../src/modules/players/players.module';
import { ClubsModule } from '../src/modules/clubs/clubs.module';
import { MatchesModule } from '../src/modules/matches/matches.module';
import { HealthModule } from '../src/modules/health/health.module';
import { SupabaseModule } from '../src/modules/supabase/supabase.module';
import { StripeModule } from '../src/modules/stripe/stripe.module';
import { FirebaseModule } from '../src/modules/firebase/firebase.module';
import { PaymentsModule } from '../src/modules/payments/payments.module';
import { NotificationsModule } from '../src/modules/notifications/notifications.module';
import { MediaModule } from '../src/modules/media/media.module';
import { EventsModule } from '../src/modules/events/events.module';
import { ScoutingReportsModule } from '../src/modules/scouting-reports/scouting-reports.module';
import { KanbanModule } from '../src/modules/kanban/kanban.module';
import { ClubRequestsModule } from '../src/modules/club-requests/club-requests.module';
import { SearchModule } from '../src/modules/search/search.module';
import { AnalyticsModule } from '../src/modules/analytics/analytics.module';
import { SubscriptionsModule } from '../src/modules/subscriptions/subscriptions.module';
import { CampsModule } from '../src/modules/camps/camps.module';
import { CoachingModule } from '../src/modules/coaching/coaching.module';
import { PassportModule } from '../src/passport/passport.module';
import { AiModule } from '../src/modules/ai/ai.module';
import { DataSyncModule } from '../src/modules/data-sync/data-sync.module';
import { PlayerValidationModule } from '../src/modules/player-validation/player-validation.module';
import { GamificationModule } from '../src/modules/gamification/gamification.module';
import { OnboardingModule } from '../src/modules/onboarding/onboarding.module';
import { MarketplaceModule } from '../src/modules/marketplace/marketplace.module';
import { ArkaneMatchModule } from '../src/modules/arkane-match/arkane-match.module';
import { CacheModule } from '../src/modules/cache/cache.module';
import { WebSocketModule } from '../src/modules/websocket/websocket.module';
import { VoiceToReportModule } from '../src/modules/voice-to-report/voice-to-report.module';
import { SmartScoutModule } from '../src/modules/smart-scout/smart-scout.module';
import { AutoScoutModule } from '../src/modules/auto-scout/auto-scout.module';
import { MarketValueModule } from '../src/modules/market-value/market-value.module';
import { PerformancePredictorModule } from '../src/modules/performance-predictor/performance-predictor.module';
import { PlaystyleDnaModule } from '../src/modules/playstyle-dna/playstyle-dna.module';

/**
 * Test App Module
 *
 * Same as AppModule but WITHOUT ThrottlerModule to allow unlimited requests in tests.
 * This prevents rate limiting (429 errors) from interfering with E2E tests.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // ThrottlerModule with very high limits for tests (required by custom throttler guards)
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 seconds
        limit: 100000, // 100k requests per minute (effectively unlimited)
      },
      {
        name: 'ai',
        ttl: 60000,
        limit: 100000,
      },
      {
        name: 'auth',
        ttl: 60000,
        limit: 100000,
      },
    ]),
    SentryModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    PlayersModule,
    ClubsModule,
    MatchesModule,
    SupabaseModule,
    StripeModule,
    FirebaseModule,
    PaymentsModule,
    NotificationsModule,
    MediaModule,
    EventsModule,
    ScoutingReportsModule,
    KanbanModule,
    ClubRequestsModule,
    SearchModule,
    AnalyticsModule,
    SubscriptionsModule,
    CampsModule,
    CoachingModule,
    PassportModule,
    AiModule,
    DataSyncModule,
    PlayerValidationModule,
    GamificationModule,
    OnboardingModule,
    MarketplaceModule,
    ArkaneMatchModule,
    CacheModule,
    WebSocketModule,
    VoiceToReportModule,
    SmartScoutModule,
    AutoScoutModule,
    MarketValueModule,
    PerformancePredictorModule,
    PlaystyleDnaModule,
  ],
  providers: [
    // NOTE: APP_GUARD with ThrottlerGuard intentionally omitted for tests
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class TestAppModule {}
