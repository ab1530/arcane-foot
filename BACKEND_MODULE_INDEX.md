# BACKEND MODULE INDEX - ALPHABETICAL

**Quick alphabetical reference for all backend modules**
**Generated**: 2025-11-16

---

## A

### ai (AI Intelligence Hub)
- **Path**: `/src/modules/ai`
- **Route**: `/api/ai`
- **Tier**: GOLD
- **Endpoints**: 7
- **Key Features**:
  - AI summary generation
  - Player AI index (ArkaneIndex)
  - AI matchmaking
  - Player performance analysis
  - Talent prediction
  - Club recommendations
  - Suspicious profile detection
- **Guards**: JwtAuthGuard, AiThrottlerGuard, SubscriptionTierGuard
- **Rate Limit**: 10 requests/minute
- **Cost**: ~$0.02-0.05 per request

### analytics (Platform Analytics & Monitoring)
- **Path**: `/src/modules/analytics`
- **Route**: `/api/analytics`
- **Auth**: Required
- **Endpoints**: 9
- **Key Features**:
  - Platform overview statistics
  - Players/clubs/reports analytics
  - Activity trends
  - RBAC monitoring (403 errors, conversions)
  - Conversion rate tracking
- **Guards**: JwtAuthGuard
- **Database Tables**: `rbac_events`, `upgrade_modals`, `subscription_conversions`

### arkane-match (AI Match Chat)
- **Path**: `/src/modules/arkane-match`
- **Route**: `/api/arkane-match`
- **Tier**: GOLD (expected)
- **Status**: Coming Soon
- **Key Features**: AI-powered chat about matches and players

### auth (Authentication & Authorization)
- **Path**: `/src/modules/auth`
- **Route**: `/api/auth`
- **Public Routes**: signup, login, refresh, csrf-token
- **Protected Routes**: me, logout, logout-all
- **Endpoints**: 7
- **Key Features**:
  - Signup/Login with email/password
  - OAuth (Google, Apple)
  - JWT + Refresh tokens
  - Token blacklisting
  - CSRF protection
  - Multi-device logout
- **Rate Limits**:
  - Signup: 3/minute
  - Login: 5/minute
- **Database Tables**: `users`, custom token blacklist in Redis

### auto-scout (AI Report Generation)
- **Path**: `/src/modules/auto-scout`
- **Route**: `/api/auto-scout`
- **Tier**: GOLD
- **Roles**: SCOUT, ADMIN, SUPER_ADMIN
- **Endpoints**: 12
- **Key Features**:
  - AI-generated scouting reports (GPT-4)
  - Bulk report generation (Admin only)
  - Report enhancement
  - Custom templates
  - Report preview (no save)
  - Quality scoring (A-F grading)
  - Cost estimation
  - Analytics & usage tracking
  - Report history
- **Rate Limits**:
  - Generate: 10/hour
  - Bulk: 3/hour (Admin)
  - Enhance: 15/hour
  - Preview: 20/hour
  - Custom: 5/hour (Admin)
- **Cost**: $0.016-$0.032 per report
- **Database Tables**: `auto_generated_reports`
- **DTOs**: GenerateReportDto, BulkGenerateDto, EnhanceReportDto, CustomGenerateDto

---

## C

### cache (Caching Service)
- **Path**: `/src/modules/cache`
- **No Controller**: Service only
- **Key Features**:
  - Redis cache (primary)
  - In-memory cache (fallback)
  - Cache invalidation
  - TTL management
- **Usage**: Internal service, used by other modules

### camps (Training Camps & Events)
- **Path**: `/src/modules/camps`
- **Route**: `/api/camps`
- **Auth**: Mixed (view: public, register: required)
- **Endpoints**: 8+
- **Key Features**:
  - Camp management (CRUD)
  - Camp types: CAMP, DETECTION, SHOWCASE, TRAINING
  - Participant registration
  - Payment processing
  - Participant evaluation
  - Showcase selection
  - Medical waivers & consent
- **Database Tables**: `camps`, `camp_participations`
- **Enums**: CampStatus, CampType, ParticipationStatus

### club-requests (Club-Player Interactions)
- **Path**: `/src/modules/club-requests`
- **Route**: `/api/club-requests`
- **Auth**: Required
- **Endpoints**: 5+
- **Key Features**:
  - Clubs request player info
  - Trial requests
  - Offer management
  - Request status tracking (PENDING, ACCEPTED, REJECTED, etc.)
- **Database Tables**: `club_requests`
- **Enums**: ClubRequestStatus

### clubs (Club Management)
- **Path**: `/src/modules/clubs`
- **Route**: `/api/clubs`
- **Auth**: Mixed (view: public, edit: admin)
- **Endpoints**: 5+
- **Key Features**:
  - Club CRUD
  - Club search & filters
  - Club statistics
  - External data sync support
- **Database Tables**: `clubs`

### coaching (Coaching Services)
- **Path**: `/src/modules/coaching`
- **Route**: `/api/coaching`
- **Auth**: Required
- **Tier**: PRO+
- **Endpoints**: 10+
- **Key Features**:
  - Coach profiles
  - Booking system
  - Payment integration
  - Session management
  - Reviews & ratings
  - Coaching types: MENTAL_COACHING, PHYSICAL_TRAINING, NUTRITIONIST, etc.
- **Database Tables**: `coaches`, `coaching_bookings`
- **Enums**: CoachingType, CoachingBookingStatus

---

## D

### data-sync (External API Integration)
- **Path**: `/src/modules/data-sync`
- **Route**: `/api/data-sync`
- **Auth**: Required
- **Roles**: ADMIN, SUPER_ADMIN
- **Endpoints**: 4
- **Key Features**:
  - Sync players from external APIs
  - Sync clubs
  - Sync matches
  - Deduplication logic
  - Sync status tracking
- **External Sources**: API-Football, TransferMarkt (configurable)

---

## E

### events (Calendar & Event Management)
- **Path**: `/src/modules/events`
- **Route**: `/api/events`
- **Auth**: Required
- **Endpoints**: 6+
- **Key Features**:
  - Event creation (MATCH, TRAINING, MEETING, CAMP, OTHER)
  - Event assignments (assign users)
  - Calendar management
  - Location tracking (lat/long)
  - Event status tracking
- **Database Tables**: `events`, `event_assignments`
- **Enums**: EventType, EventStatus

---

## F

### firebase (Push Notifications)
- **Path**: `/src/modules/firebase`
- **No Controller**: Service only
- **Key Features**:
  - FCM token management
  - Push notifications (iOS, Android, Web)
  - Device registration
  - Notification delivery
- **Integration**: Used by notifications module

---

## G

### gamification (XP, Levels, Achievements)
- **Path**: `/src/modules/gamification`
- **Route**: `/api/gamification`
- **Auth**: Required
- **Endpoints**: 10+
- **Key Features**:
  - User levels & XP system
  - Achievements (unlockable)
  - Badges (BRONZE, SILVER, GOLD, PLATINUM, DIAMOND)
  - Leaderboards (Weekly, Monthly, All-Time)
  - Daily challenges
  - Streak tracking
  - Action tracking
  - Achievement sharing
  - Badge pinning
- **Database Tables**: `user_stats`, `achievements`, `user_achievements`, `leaderboards`, `daily_challenges`, `user_daily_challenges`
- **Enums**: AchievementCategory, AchievementRarity, BadgeType
- **Categories**: PLAYER_MILESTONE, SCOUT_EXPERTISE, CLUB_ACHIEVEMENT, SOCIAL_ENGAGEMENT, PERFORMANCE

---

## H

### health (Health Checks)
- **Path**: `/src/modules/health`
- **Route**: `/api/health`
- **Public**: Yes
- **Endpoints**: 3
- **Key Features**:
  - Overall health status
  - Database health
  - External services health (OpenAI, Stripe, Supabase, Firebase)
- **Usage**: Monitoring & alerting

---

## K

### kanban (Scout Pipeline/CRM)
- **Path**: `/src/modules/kanban`
- **Route**: `/api/kanban`
- **Auth**: Required
- **Roles**: SCOUT, ADMIN
- **Tier**: PRO+
- **Endpoints**: 10+
- **Key Features**:
  - Kanban boards
  - Pipeline columns
  - Player cards
  - Card positioning
  - Activity tracking
  - Column types: PROSPECT, CONTACTED, INTERESTED, NEGOTIATING, OFFER_MADE, SIGNED, ARCHIVED, CUSTOM
- **Database Tables**: `kanban_boards`, `kanban_columns`, `kanban_cards`, `kanban_card_activities`
- **Enums**: KanbanColumnType, TaskPriority

---

## M

### market-value (AI Market Valuation)
- **Path**: `/src/modules/market-value`
- **Route**: `/api/market-value`
- **Tier**: GOLD
- **Endpoints**: 5
- **Key Features**:
  - AI-powered player valuation
  - Valuation trends (historical)
  - Player comparisons (max 10 players)
  - Model retraining
  - Service health check
- **Guards**: JwtAuthGuard, SubscriptionTierGuard
- **Database Tables**: `player_valuations`
- **Model**: GPT-4 or Custom ML

### marketplace (Scout-Club Marketplace)
- **Path**: `/src/modules/marketplace`
- **Route**: `/api/marketplace`
- **Auth**: Required
- **Tier**: PRO+
- **Endpoints**: 20+
- **Key Features**:
  - Scout listing management
  - Club offers
  - AI matching algorithm
  - Reviews & ratings
  - Favorites system
  - Offer types: MATCH_ASSIGNMENT, PLAYER_REPORT, CONSULTATION, RETAINER
- **Database Tables**: `scout_listings`, `marketplace_offers`, `marketplace_reviews`, `scout_favorites`
- **Enums**: ScoutListingStatus, OfferStatus, OfferType

### matches (Match Management)
- **Path**: `/src/modules/matches`
- **Route**: `/api/matches`
- **Auth**: Required
- **Endpoints**: 5+
- **Key Features**:
  - Match CRUD
  - Scout assignments
  - Match statistics
  - Live score updates
  - Match status tracking
- **Database Tables**: `matches`, `match_assignments`
- **Enums**: MatchStatus, MatchAssignmentStatus, MatchAssignmentRole

### media (File Upload & Storage)
- **Path**: `/src/modules/media`
- **Route**: `/api/media`
- **Auth**: Required
- **Endpoints**: 5+
- **Key Features**:
  - Image/video upload
  - Supabase integration
  - Media library
  - Media types: IMAGE, VIDEO, DOCUMENT, AUDIO
- **Database Tables**: `media`
- **Enums**: MediaType
- **Max File Size**: Configurable (typically 50MB)

---

## N

### notifications (In-App Notifications)
- **Path**: `/src/modules/notifications`
- **Route**: `/api/notifications`
- **Auth**: Required
- **Endpoints**: 5+
- **Key Features**:
  - Create notifications
  - Mark as read
  - Notification history
  - FCM integration
  - Bulk operations (mark all read)
- **Database Tables**: `notifications`

---

## O

### onboarding (User Onboarding Flow)
- **Path**: `/src/modules/onboarding`
- **Route**: `/api/onboarding`
- **Auth**: Required
- **Endpoints**: 6+
- **Key Features**:
  - Step-by-step onboarding
  - Progress tracking
  - Skip steps
  - Complete steps
  - Onboarding status
- **Database Tables**: `user_onboarding`, `onboarding_steps`
- **Enums**: OnboardingStepStatus (NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED)

---

## P

### passport (Player Digital Passport)
- **Path**: `/src/passport`
- **Route**: `/api/passport`
- **Auth**: Mixed (create: auth required, view by token: public)
- **Endpoints**: 6
- **Key Features**:
  - Create player passport
  - Verify passport (Admin only)
  - Public token access
  - QR code generation
  - Passport status tracking
- **Roles**:
  - Create: ADMIN, AGENT, SCOUT
  - Verify: ADMIN, SUPER_ADMIN
- **Database Tables**: `player_passports`
- **Enums**: PassportStatus (PENDING, VERIFIED, EXPIRED, REVOKED)

### payments (Stripe Integration)
- **Path**: `/src/modules/payments`
- **Route**: `/api/payments`
- **Auth**: Mixed (webhook: public)
- **Endpoints**: 3
- **Key Features**:
  - Stripe checkout sessions
  - Webhook handling
  - Payment history
- **Integration**: Works with subscriptions module

### performance-predictor (ML Performance Prediction)
- **Path**: `/src/modules/performance-predictor`
- **Route**: `/api/performance-predictor`
- **Tier**: GOLD
- **Endpoints**: 6
- **Key Features**:
  - Predict player performance for matches
  - Batch predictions (all players in match)
  - Accuracy metrics
  - Feature importance
  - Model retraining
- **Database Tables**: `performance_predictions`, `prediction_accuracy_log`
- **Model**: Custom ML (scikit-learn or similar)
- **Output**: Predicted rating, confidence interval, recommendations

### player-validation (Agency Player Verification)
- **Path**: `/src/modules/player-validation`
- **Route**: `/api/player-validation`
- **Auth**: Required
- **Roles**: AGENT, ADMIN, SUPER_ADMIN
- **Endpoints**: 4
- **Key Features**:
  - Validate player profiles
  - Convert to verified status
  - Reject suspicious players
  - Pending validations list
- **Database Tables**: `players` (verificationStatus field)
- **Enums**: VerificationStatus (PENDING, VERIFIED, REJECTED, SUSPICIOUS)

### players (Player Management)
- **Path**: `/src/modules/players`
- **Route**: `/api/players`
- **Auth**: Mixed (view: public, edit: authenticated)
- **Endpoints**: 7
- **Key Features**:
  - Player CRUD
  - Advanced filters (age, height, weight, position, market value, etc.)
  - Player statistics
  - Player reports history
  - External data sync support
- **Database Tables**: `players`
- **Enums**: PlayerStatus, PlayerType, VerificationStatus
- **DTOs**: CreatePlayerDto, UpdatePlayerDto, FilterPlayersDto

### playstyle-dna (Player Style Analysis)
- **Path**: `/src/modules/playstyle-dna`
- **Route**: `/api/playstyle-dna`
- **Tier**: GOLD (likely)
- **Endpoints**: 3+
- **Key Features**:
  - Generate PlayStyle DNA
  - Radar chart data
  - Style comparisons
  - Player archetype classification
- **Model**: GPT-4 or rule-based

### prisma (Database Service)
- **Path**: `/src/modules/prisma`
- **No Controller**: Service only
- **Key Features**:
  - Global Prisma Client instance
  - Database connection management
  - Transaction support
- **Usage**: Imported by all modules that access database

---

## S

### search (Global Search)
- **Path**: `/src/modules/search`
- **Route**: `/api/search`
- **Auth**: Optional (public search available)
- **Endpoints**: 2+
- **Key Features**:
  - Search players, clubs, matches
  - Autocomplete
  - Advanced filters
  - Full-text search
- **Database**: Uses Prisma full-text search

### scouting-reports (Manual Scouting Reports)
- **Path**: `/src/modules/scouting-reports`
- **Route**: `/api/scouting-reports`
- **Auth**: Mixed (view: public, create/edit: authenticated)
- **Endpoints**: 13+
- **Key Features**:
  - Create/edit reports
  - Submit for review
  - Approve/reject reports (Admin)
  - PDF export
  - Query filters (player, scout, match, status)
  - Scouting notes (timestamped)
  - Recommendation types
- **Database Tables**: `scouting_reports`, `scouting_notes`
- **Enums**: ReportStatus, RecommendationType
- **DTOs**: CreateScoutingReportDto, UpdateScoutingReportDto, QueryScoutingReportDto

### smart-scout (AI Autocomplete & Suggestions)
- **Path**: `/src/modules/smart-scout`
- **Route**: `/api/smart-scout`
- **Tier**: GOLD
- **Roles**: SCOUT, ANALYST, ADMIN, SUPER_ADMIN
- **Endpoints**: 5
- **Key Features**:
  - Smart report autocomplete
  - Suggestion engine (based on partial reports)
  - Report insights (AI-powered)
  - Vector similarity search
  - Report indexing/reindexing (Admin)
- **Database Tables**: `report_embeddings`
- **Models**: text-embedding-3-small + GPT-4
- **Rate Limit**: 20 requests/hour (suggestions)

### stripe (Stripe Service Wrapper)
- **Path**: `/src/modules/stripe`
- **No Controller**: Service only
- **Key Features**:
  - Stripe API wrapper
  - Checkout session creation
  - Subscription management
- **Integration**: Used by payments & subscriptions modules

### subscriptions (Subscription Management)
- **Path**: `/src/modules/subscriptions`
- **Route**: `/api/subscriptions`
- **Auth**: Mixed (pricing: public, manage: authenticated)
- **Endpoints**: 6
- **Key Features**:
  - Get pricing plans
  - Manage user subscription
  - Cancel/reactivate
  - Tier changes (upgrade/downgrade)
  - Tier verification (RBAC)
- **Database Tables**: `subscriptions`
- **Enums**: SubscriptionTier, SubscriptionStatus
- **DTOs**: CreateSubscriptionDto, CancelSubscriptionDto

### supabase (File Storage Service)
- **Path**: `/src/modules/supabase`
- **No Controller**: Service only
- **Key Features**:
  - Supabase client wrapper
  - File upload/download
  - Storage bucket management
- **Integration**: Used by media & voice-to-report modules

---

## U

### users (User Management)
- **Path**: `/src/modules/users`
- **No Controller**: Service only (auth module handles endpoints)
- **Key Features**:
  - User CRUD operations
  - User lookup by ID/email
  - User profile updates
- **Database Tables**: `users`
- **Enums**: UserRole

---

## V

### voice-to-report (Voice Transcription)
- **Path**: `/src/modules/voice-to-report`
- **Route**: `/api/voice-to-report`
- **Tier**: GOLD
- **Endpoints**: 4
- **Key Features**:
  - Audio upload (max 25MB)
  - Whisper transcription
  - NLU data extraction (GPT-4)
  - Multilingual support (EN, ES, FR, DE, IT, PT)
  - Quality scoring
  - Test transcription (no audio)
- **Rate Limit**: 10 requests/minute
- **Cost**: ~$0.01-0.02 per transcription
- **Supported Formats**: mp3, wav, webm, m4a, ogg
- **DTOs**: ProcessVoiceReportDto, VoiceReportResponseDto, LanguageInfo, VoiceReportExample

---

## W

### websocket (Real-Time Communication)
- **Path**: `/src/modules/websocket`
- **No Controller**: Gateway
- **Key Features**:
  - WebSocket events
  - Real-time updates
  - Room management
  - Event broadcasting
- **Usage**: Real-time notifications, live match updates

---

## ENUMS REFERENCE

### AchievementCategory
```typescript
PLAYER_MILESTONE
SCOUT_EXPERTISE
CLUB_ACHIEVEMENT
SOCIAL_ENGAGEMENT
PERFORMANCE
```

### AchievementRarity
```typescript
COMMON      // 10 points
RARE        // 25 points
EPIC        // 50 points
LEGENDARY   // 100 points
MYTHIC      // 250 points
```

### BadgeType
```typescript
BRONZE
SILVER
GOLD
PLATINUM
DIAMOND
```

### CampStatus
```typescript
DRAFT
PUBLISHED
FULL
IN_PROGRESS
COMPLETED
CANCELLED
```

### CampType
```typescript
CAMP
DETECTION
SHOWCASE
TRAINING
```

### ClubRequestStatus
```typescript
PENDING
ACCEPTED
REJECTED
NEGOTIATING
COMPLETED
```

### CoachingBookingStatus
```typescript
PENDING
CONFIRMED
PAID
COMPLETED
CANCELLED
NO_SHOW
```

### CoachingType
```typescript
MENTAL_COACHING
PHYSICAL_TRAINING
NUTRITIONIST
PHYSIOTHERAPIST
TECHNICAL_COACH
TACTICAL_COACH
VIDEO_ANALYSIS
OTHER
```

### EventStatus
```typescript
PLANNED
CONFIRMED
COMPLETED
CANCELLED
```

### EventType
```typescript
MATCH
TRAINING
MEETING
CAMP
OTHER
```

### KanbanColumnType
```typescript
PROSPECT
CONTACTED
INTERESTED
NEGOTIATING
OFFER_MADE
SIGNED
ARCHIVED
CUSTOM
```

### MatchAssignmentRole
```typescript
PRIMARY_SCOUT
ASSISTANT
ANALYST
VIDEO_ANALYST
```

### MatchAssignmentStatus
```typescript
ASSIGNED
CONFIRMED
IN_PROGRESS
COMPLETED
CANCELLED
```

### MatchStatus
```typescript
SCHEDULED
LIVE
COMPLETED
CANCELLED
POSTPONED
```

### MediaType
```typescript
IMAGE
VIDEO
DOCUMENT
AUDIO
```

### OfferStatus
```typescript
PENDING
VIEWED
ACCEPTED
REJECTED
IN_PROGRESS
COMPLETED
CANCELLED
```

### OfferType
```typescript
MATCH_ASSIGNMENT
PLAYER_REPORT
CONSULTATION
RETAINER
```

### OnboardingStepStatus
```typescript
NOT_STARTED
IN_PROGRESS
COMPLETED
SKIPPED
```

### ParticipationStatus
```typescript
PENDING
REGISTERED
CONFIRMED
SELECTED
COMPLETED
CANCELLED
NO_SHOW
```

### PassportStatus
```typescript
PENDING
VERIFIED
EXPIRED
REVOKED
```

### PlayerStatus
```typescript
ACTIVE
INJURED
SUSPENDED
RETIRED
PROSPECT
```

### PlayerType
```typescript
AGENCY
PUBLIC
```

### RecommendationType
```typescript
BUY_NOW
MONITOR
FOLLOW_UP
NOT_INTERESTED
NEEDS_MORE_DATA
```

### ReportStatus
```typescript
DRAFT
SUBMITTED
REVIEWED
APPROVED
REJECTED
```

### ScoutListingStatus
```typescript
DRAFT
ACTIVE
PAUSED
ARCHIVED
```

### SubscriptionStatus
```typescript
ACTIVE
CANCELLED
EXPIRED
TRIAL
PAST_DU
```

### SubscriptionTier
```typescript
FREE        // €0/month
BASIC       // €19.99/month
PRO         // €39.99/month
GOLD        // €49.99/month (AI features)
ENTERPRISE  // €99.99/month
```

### TaskPriority
```typescript
LOW
MEDIUM
HIGH
URGENT
```

### TaskStatus
```typescript
TODO
IN_PROGRESS
DONE
CANCELLED
```

### UserRole
```typescript
SUPER_ADMIN
ADMIN
AGENT
SCOUT
ANALYST
PLAYER
CLUB_CONTACT
PUBLIC
```

### VerificationStatus
```typescript
PENDING
VERIFIED
REJECTED
SUSPICIOUS
```

---

## DTOs INDEX

### ai
- GenerateSummaryDto
- MatchmakingRequestDto

### auto-scout
- GenerateReportDto
- BulkGenerateDto
- EnhanceReportDto
- CustomGenerateDto

### auth
- SignupDto
- LoginDto
- RefreshTokenDto

### camps
- CreateCampDto
- UpdateCampDto
- RegisterParticipantDto

### club-requests
- CreateClubRequestDto
- UpdateClubRequestDto

### clubs
- CreateClubDto
- UpdateClubDto

### coaching
- CreateCoachDto
- CreateBookingDto

### marketplace
- CreateScoutListingDto
- UpdateScoutListingDto
- CreateOfferDto
- SearchListingsDto
- CreateReviewDto
- CreateFavoriteDto
- CalculateMatchingDto

### market-value
- PlayerValuationDto
- ValuationTrendDto
- ComparePlayersRequestDto
- ComparePlayersResponseDto

### passport
- CreatePassportDto
- VerifyPassportDto

### performance-predictor
- PerformancePredictionDto
- PredictionRequestDto
- BatchPredictionRequestDto
- BatchPredictionResponseDto
- AccuracyMetricsDto
- FeatureImportanceDto

### players
- CreatePlayerDto
- UpdatePlayerDto
- FilterPlayersDto

### scouting-reports
- CreateScoutingReportDto
- UpdateScoutingReportDto
- QueryScoutingReportDto

### smart-scout
- PartialReportDto
- ReportContextDto
- SuggestionResponseDto
- AutocompleteRequestDto
- AutocompleteResponseDto

### subscriptions
- CreateSubscriptionDto
- CancelSubscriptionDto

### voice-to-report
- ProcessVoiceReportDto
- VoiceReportResponseDto
- LanguageInfo
- VoiceReportExample

---

**Last Updated**: 2025-11-16
**Total Modules**: 38
**Total Enums**: 30+
**Total DTOs**: 50+
**Backend Version**: 2.0.0
