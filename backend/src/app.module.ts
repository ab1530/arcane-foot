import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { SentryModule, SentryGlobalFilter } from '@sentry/nestjs/setup';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PlayersModule } from './modules/players/players.module';
import { ClubsModule } from './modules/clubs/clubs.module';
import { MatchesModule } from './modules/matches/matches.module';
import { HealthModule } from './modules/health/health.module';
import { SupabaseModule } from './modules/supabase/supabase.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { FirebaseModule } from './modules/firebase/firebase.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { MediaModule } from './modules/media/media.module';
import { EventsModule } from './modules/events/events.module';
import { ScoutingReportsModule } from './modules/scouting-reports/scouting-reports.module';
import { KanbanModule } from './modules/kanban/kanban.module';
import { ClubRequestsModule } from './modules/club-requests/club-requests.module';
import { SearchModule } from './modules/search/search.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { CampsModule } from './modules/camps/camps.module';
import { CoachingModule } from './modules/coaching/coaching.module';
import { PassportModule } from './passport/passport.module';
import { AiModule } from './modules/ai/ai.module';
import { DataSyncModule } from './modules/data-sync/data-sync.module';
import { PlayerValidationModule } from './modules/player-validation/player-validation.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { ArkaneMatchModule } from './modules/arkane-match/arkane-match.module';
// import { ExternalApisModule } from './modules/external-apis/external-apis.module'; // Temporarily disabled - has schema issues
import { CacheModule } from './modules/cache/cache.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { VoiceToReportModule } from './modules/voice-to-report/voice-to-report.module';
import { SmartScoutModule } from './modules/smart-scout/smart-scout.module';
import { AutoScoutModule } from './modules/auto-scout/auto-scout.module';
import { MarketValueModule } from './modules/market-value/market-value.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL) || 60000,
        limit: parseInt(process.env.RATE_LIMIT_MAX) || 100,
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
    // ExternalApisModule, // Temporarily disabled - has schema issues
    CacheModule,
    WebSocketModule,
    VoiceToReportModule,
    SmartScoutModule,
    AutoScoutModule,
    MarketValueModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
