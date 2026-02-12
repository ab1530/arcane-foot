# BACKEND ARCHITECTURE MAP - ARCANE PLATFORM

**Generated**: 2025-11-16
**Repository**: /Users/lakhdari/Desktop/AppFoot/backend
**Framework**: NestJS + Prisma + PostgreSQL
**API Documentation**: Swagger/OpenAPI

---

## TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Database Schema (Prisma)](#database-schema-prisma)
3. [Modules Inventory](#modules-inventory)
4. [Roles & Permissions (RBAC)](#roles--permissions-rbac)
5. [Subscription Tiers](#subscription-tiers)
6. [AI Features](#ai-features)
7. [API Endpoints Summary](#api-endpoints-summary)
8. [Guards & Decorators](#guards--decorators)
9. [Module Deep Dive](#module-deep-dive)

---

## SYSTEM OVERVIEW

### Tech Stack
- **Backend Framework**: NestJS (Node.js/TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Rate Limiting**: Throttler (configurable per endpoint)
- **File Storage**: Supabase
- **Payment Processing**: Stripe
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **AI Services**: OpenAI (GPT-4, Whisper, Embeddings)
- **Error Tracking**: Sentry
- **API Documentation**: Swagger/OpenAPI

### Architecture Principles
- **Modular Architecture**: 38 distinct feature modules
- **RBAC System**: 8 user roles with granular permissions
- **Subscription-Based Access**: 5 tiers (FREE, BASIC, PRO, ENTERPRISE, GOLD)
- **Rate Limiting**: Aggressive throttling on AI endpoints (cost control)
- **Microservices Ready**: Each module can be extracted independently

### Environment Variables Required
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
SUPABASE_URL=...
SUPABASE_KEY=...
FIREBASE_PROJECT_ID=...
SENTRY_DSN=...
```

---

## DATABASE SCHEMA (PRISMA)

### Core Entities

#### **users** (Authentication & Profile)
- **ID**: String (CUID)
- **Fields**: email, passwordHash, firstName, lastName, phone, avatar, role, emailVerified, isActive
- **OAuth**: googleId, appleId
- **Timestamps**: createdAt, updatedAt, lastLoginAt
- **Relations**: 1-to-1 with players, clubs, subscriptions, user_onboarding, user_stats

#### **players** (Player Profiles)
- **ID**: String (CUID)
- **Core**: userId (unique), clubId, position, preferredFoot, jerseyNumber, height, weight, dateOfBirth, nationality
- **Status**: PlayerStatus (ACTIVE, INJURED, SUSPENDED, RETIRED, PROSPECT)
- **Type**: PlayerType (AGENCY, PUBLIC)
- **Verification**: verificationStatus, verifiedAt, verifiedById
- **External Sync**: externalId, externalSource, lastSyncAt
- **Relations**: scouting_reports, auto_generated_reports, player_valuations, performance_predictions, camp_participations

#### **clubs** (Football Clubs)
- **ID**: String (CUID)
- **Core**: name, shortName, logo, country, city, stadium, founded, website
- **Contact**: contactUserId (unique FK to users)
- **External Sync**: externalId, externalSource, lastSyncAt
- **Relations**: players, matches (home/away), camps, club_requests, marketplace_offers

#### **matches** (Match Database)
- **ID**: String (CUID)
- **Teams**: homeClubId, awayClubId
- **Schedule**: scheduledAt, matchDate, matchTime, timezone
- **Competition**: competitionId, season, round
- **Status**: MatchStatus (SCHEDULED, LIVE, COMPLETED, CANCELLED, POSTPONED)
- **Score**: homeScore, awayScore
- **Venue**: venueId, attendance, referee
- **Relations**: scouting_reports, match_assignments, events, auto_generated_reports, performance_predictions

#### **scouting_reports** (Manual Scouting Reports)
- **ID**: String (CUID)
- **Core**: matchId, playerId, scoutId
- **Status**: ReportStatus (DRAFT, SUBMITTED, REVIEWED, APPROVED, REJECTED)
- **Ratings**: overallRating, technicalRating, physicalRating, mentalRating, tacticalRating
- **Content**: summary, strengths, weaknesses, notesJson
- **Recommendation**: RecommendationType (BUY_NOW, MONITOR, FOLLOW_UP, NOT_INTERESTED, NEEDS_MORE_DATA)
- **Advanced**: similarPlayerIds, tags, playerPosition, playerMinutesPlayed
- **Relations**: scouting_notes, media, report_embeddings (for AI similarity)

#### **auto_generated_reports** (AI-Generated Reports)
- **ID**: String (UUID)
- **Core**: playerId, matchId, scoutId
- **Content**: reportData (JSON)
- **Quality**: qualityScore (Float), qualityBreakdown (JSON)
- **AI Metadata**: template, model, tokensUsed, generationTime, cost
- **Timestamp**: createdAt

#### **subscriptions** (Subscription Management)
- **ID**: String (CUID)
- **Core**: userId (unique), tier, status
- **Stripe**: stripeCustomerId, stripeSubscriptionId, stripePriceId
- **Dates**: startDate, endDate, trialEndsAt, cancelAt
- **Tier**: SubscriptionTier (FREE, BASIC, PRO, ENTERPRISE, GOLD)
- **Status**: SubscriptionStatus (ACTIVE, CANCELLED, EXPIRED, TRIAL, PAST_DUE)

#### **user_stats** (Gamification Stats)
- **ID**: String (CUID)
- **Core**: userId (unique), totalPoints, currentLevel, currentLevelPoints, nextLevelPoints
- **Counters**: achievementsCount, badgesCount, reportsCreated, reportsSubmitted, playersValidated, goalsScored, matchesPlayed
- **Engagement**: loginStreak, lastLoginDate

#### **achievements** & **user_achievements** (Gamification)
- **achievements**: code, name, description, icon, category, rarity, points, rewardBadge, condition (JSON)
- **user_achievements**: userId, achievementId, progress, maxProgress, isCompleted, unlockedAt

#### **player_passports** (Digital Player Passport)
- **ID**: String (CUID)
- **Core**: playerId (unique), status, publicToken (unique)
- **Verification**: verifiedAt, verifiedById, verificationNotes
- **Data**: passportData (JSON), expiresAt

### Advanced Entities

#### **marketplace_** tables (Scout Marketplace)
- **scout_listings**: Scout profiles for hire
- **marketplace_offers**: Club offers to scouts
- **marketplace_reviews**: Club reviews of scouts
- **scout_favorites**: Clubs can favorite scouts

#### **camps** & **camp_participations** (Training Camps)
- **camps**: Training camps, detection events, showcases
- **camp_participations**: Player registrations, evaluations, payments

#### **coaching_** tables (Coaching Services)
- **coaches**: Coach profiles with specialties
- **coaching_bookings**: Coaching session bookings

#### **kanban_** tables (CRM/Pipeline)
- **kanban_boards**: Pipeline boards
- **kanban_columns**: Pipeline stages
- **kanban_cards**: Players in pipeline

#### **performance_predictions** (ML Predictions)
- **Core**: playerId, matchId, predictedRating, confidenceScore
- **Confidence Interval**: confidenceLow, confidenceHigh
- **Insights**: ratingDistribution (JSON), keyFactors (JSON), recommendations (Array)
- **Accuracy**: actualRating, predictionError
- **Model**: modelVersion

#### **player_valuations** (Market Value AI)
- **Core**: playerId, estimatedValue
- **Confidence**: confidenceLow, confidenceHigh, confidenceScore
- **Factors**: factors (JSON) - breakdown of value drivers
- **Model**: modelVersion

#### **report_embeddings** (Vector Search for Reports)
- **ID**: String (CUID)
- **Core**: reportId (unique), embedding (Float[]), model
- **Purpose**: Used for similarity search and SmartScout features

---

## MODULES INVENTORY

Total Modules: **38 active modules**

### 1. ai (AI Intelligence Hub)
- **Path**: `/src/modules/ai`
- **Controller**: ✅ ai.controller.ts
- **Service**: ✅ ai.service.ts
- **Features**:
  - AI Summary Generation
  - Player Performance Analysis
  - Talent Prediction
  - Club Matchmaking
  - Suspicious Profile Detection
  - Player Index (ArkaneIndex)

### 2. analytics (Platform Analytics)
- **Path**: `/src/modules/analytics`
- **Controller**: ✅ analytics.controller.ts
- **Service**: ✅ analytics.service.ts
- **Features**:
  - Platform Overview Stats
  - Players Analytics
  - Clubs Analytics
  - Scouting Reports Analytics
  - Activity Trends
  - RBAC Monitoring (403 errors, conversions)

### 3. arkane-match (AI Match Chat - Coming Soon)
- **Path**: `/src/modules/arkane-match`
- **Controller**: ✅ arkane-match.controller.ts
- **Service**: ✅ arkane-match.service.ts
- **Features**: AI-powered chat about matches and players

### 4. auth (Authentication)
- **Path**: `/src/modules/auth`
- **Controller**: ✅ auth.controller.ts
- **Service**: ✅ auth.service.ts
- **Features**:
  - Signup/Login
  - JWT + Refresh Tokens
  - OAuth (Google, Apple)
  - CSRF Protection
  - Token Blacklisting
  - Logout All Devices

### 5. auto-scout (AI Report Generation)
- **Path**: `/src/modules/auto-scout`
- **Controller**: ✅ auto-scout.controller.ts
- **Service**: ✅ auto-scout.service.ts
- **Features**:
  - AI-Generated Scouting Reports (GPT-4)
  - Bulk Report Generation
  - Report Enhancement
  - Custom Templates
  - Quality Scoring
  - Cost Estimation
  - Report History

### 6. cache (Redis/Memory Cache)
- **Path**: `/src/modules/cache`
- **Service**: ✅ cache.service.ts
- **Features**: Caching layer for performance

### 7. camps (Training Camps & Events)
- **Path**: `/src/modules/camps`
- **Controller**: ✅ camps.controller.ts
- **Service**: ✅ camps.service.ts
- **Features**:
  - Camp Management (CRUD)
  - Camp Registration
  - Payment Processing
  - Participant Evaluation
  - Showcase Selection

### 8. club-requests (Club-Player Interactions)
- **Path**: `/src/modules/club-requests`
- **Controller**: ✅ club-requests.controller.ts
- **Service**: ✅ club-requests.service.ts
- **Features**:
  - Clubs request player info
  - Trial requests
  - Offer management
  - Request status tracking

### 9. clubs (Club Management)
- **Path**: `/src/modules/clubs`
- **Controller**: ✅ clubs.controller.ts
- **Service**: ✅ clubs.service.ts
- **Features**:
  - Club CRUD
  - Club Search & Filters
  - Club Statistics

### 10. coaching (Coaching Services)
- **Path**: `/src/modules/coaching`
- **Controller**: ✅ coaching.controller.ts
- **Service**: ✅ coaching.service.ts
- **Features**:
  - Coach Profiles
  - Booking System
  - Payment Integration
  - Session Management
  - Reviews & Ratings

### 11. data-sync (External Data Integration)
- **Path**: `/src/modules/data-sync`
- **Controller**: ✅ data-sync.controller.ts
- **Service**: ✅ data-sync.service.ts
- **Features**:
  - Sync players from external APIs
  - Sync clubs from external APIs
  - Sync matches
  - Deduplication

### 12. events (Calendar & Events)
- **Path**: `/src/modules/events`
- **Controller**: ✅ events.controller.ts
- **Service**: ✅ events.service.ts
- **Features**:
  - Event Creation (Matches, Training, Meetings)
  - Event Assignments
  - Calendar Management

### 13. firebase (Push Notifications)
- **Path**: `/src/modules/firebase`
- **Service**: ✅ firebase.service.ts
- **Features**:
  - FCM Token Management
  - Push Notifications
  - Device Management

### 14. gamification (XP, Levels, Achievements)
- **Path**: `/src/modules/gamification`
- **Controller**: ✅ gamification.controller.ts
- **Service**: ✅ gamification.service.ts
- **Features**:
  - User Levels & XP
  - Achievements System
  - Badges
  - Leaderboards (Weekly, Monthly, All-Time)
  - Daily Challenges
  - Stat Tracking

### 15. health (Health Checks)
- **Path**: `/src/modules/health`
- **Controller**: ✅ health.controller.ts
- **Service**: ✅ health.service.ts
- **Features**:
  - Database Health
  - External Services Health
  - System Status

### 16. kanban (Scout Pipeline/CRM)
- **Path**: `/src/modules/kanban`
- **Controller**: ✅ kanban.controller.ts
- **Service**: ✅ kanban.service.ts
- **Features**:
  - Kanban Boards
  - Player Cards
  - Pipeline Stages
  - Activity Tracking

### 17. market-value (AI Market Valuation)
- **Path**: `/src/modules/market-value`
- **Controller**: ✅ market-value.controller.ts
- **Service**: ✅ market-value.service.ts
- **Features**:
  - AI-Powered Player Valuation
  - Valuation Trends
  - Player Comparisons
  - Model Retraining

### 18. marketplace (Scout-Club Marketplace)
- **Path**: `/src/modules/marketplace`
- **Controller**: ✅ marketplace.controller.ts
- **Service**: ✅ marketplace.service.ts
- **Features**:
  - Scout Listings
  - Club Offers
  - Matching Algorithm
  - Reviews & Ratings
  - Favorites System

### 19. matches (Match Management)
- **Path**: `/src/modules/matches`
- **Controller**: ✅ matches.controller.ts
- **Service**: ✅ matches.service.ts
- **Features**:
  - Match CRUD
  - Scout Assignments
  - Match Statistics
  - Live Score Updates

### 20. media (File Upload & Storage)
- **Path**: `/src/modules/media`
- **Controller**: ✅ media.controller.ts
- **Service**: ✅ media.service.ts
- **Features**:
  - Image/Video Upload
  - Supabase Integration
  - Media Library

### 21. notifications (In-App Notifications)
- **Path**: `/src/modules/notifications`
- **Controller**: ✅ notifications.controller.ts
- **Service**: ✅ notifications.service.ts
- **Features**:
  - Create Notifications
  - Mark as Read
  - Notification History
  - FCM Integration

### 22. onboarding (User Onboarding Flow)
- **Path**: `/src/modules/onboarding`
- **Controller**: ✅ onboarding.controller.ts
- **Service**: ✅ onboarding.service.ts
- **Features**:
  - Step-by-Step Onboarding
  - Progress Tracking
  - Skip/Complete Steps

### 23. payments (Stripe Integration)
- **Path**: `/src/modules/payments`
- **Controller**: ✅ payments.controller.ts
- **Service**: ✅ payments.service.ts
- **Features**:
  - Stripe Checkout Sessions
  - Webhook Handling
  - Payment History

### 24. performance-predictor (ML Performance Prediction)
- **Path**: `/src/modules/performance-predictor`
- **Controller**: ✅ performance-predictor.controller.ts
- **Service**: ✅ performance-predictor.service.ts
- **Features**:
  - Predict Player Performance (ML)
  - Batch Predictions
  - Accuracy Metrics
  - Feature Importance
  - Model Retraining

### 25. player-validation (Agency Player Verification)
- **Path**: `/src/modules/player-validation`
- **Controller**: ✅ player-validation.controller.ts
- **Service**: ✅ player-validation.service.ts
- **Features**:
  - Validate Player Profiles
  - Convert to Verified Status
  - Reject Suspicious Players

### 26. players (Player Management)
- **Path**: `/src/modules/players`
- **Controller**: ✅ players.controller.ts
- **Service**: ✅ players.service.ts
- **Features**:
  - Player CRUD
  - Advanced Filters (age, height, position, value, etc.)
  - Player Statistics
  - Player Reports History

### 27. playstyle-dna (Player DNA/Style Analysis)
- **Path**: `/src/modules/playstyle-dna`
- **Controller**: ✅ playstyle-dna.controller.ts
- **Service**: ✅ playstyle-dna.service.ts
- **Features**:
  - Generate PlayStyle DNA
  - Radar Chart Data
  - Style Comparisons

### 28. prisma (Database Service)
- **Path**: `/src/modules/prisma`
- **Service**: ✅ prisma.service.ts
- **Features**: Global Prisma Client instance

### 29. scouting-reports (Manual Scouting Reports)
- **Path**: `/src/modules/scouting-reports`
- **Controller**: ✅ scouting-reports.controller.ts
- **Service**: ✅ scouting-reports.service.ts
- **Features**:
  - Create/Edit Reports
  - Submit for Review
  - Approve/Reject Reports
  - PDF Export
  - Query Filters (player, scout, match, status)

### 30. search (Global Search)
- **Path**: `/src/modules/search`
- **Controller**: ✅ search.controller.ts
- **Service**: ✅ search.service.ts
- **Features**:
  - Search Players, Clubs, Matches
  - Autocomplete
  - Advanced Filters

### 31. smart-scout (AI Autocomplete & Suggestions)
- **Path**: `/src/modules/smart-scout`
- **Controller**: ✅ smart-scout.controller.ts
- **Service**: ✅ smart-scout.service.ts
- **Features**:
  - Smart Report Autocomplete
  - Suggestion Engine
  - Report Insights (AI-powered)
  - Vector Similarity Search
  - Report Indexing/Reindexing

### 32. stripe (Stripe Service Wrapper)
- **Path**: `/src/modules/stripe`
- **Service**: ✅ stripe.service.ts
- **Features**: Stripe API wrapper

### 33. subscriptions (Subscription Management)
- **Path**: `/src/modules/subscriptions`
- **Controller**: ✅ subscriptions.controller.ts
- **Service**: ✅ subscriptions.service.ts
- **Features**:
  - Get Pricing Plans
  - Manage User Subscription
  - Cancel/Reactivate
  - Tier Changes (Upgrade/Downgrade)
  - Tier Verification (RBAC)

### 34. supabase (File Storage)
- **Path**: `/src/modules/supabase`
- **Service**: ✅ supabase.service.ts
- **Features**: Supabase client wrapper

### 35. users (User Management)
- **Path**: `/src/modules/users`
- **Service**: ✅ users.service.ts
- **Features**: User CRUD operations

### 36. voice-to-report (Voice Transcription)
- **Path**: `/src/modules/voice-to-report`
- **Controller**: ✅ voice-to-report.controller.ts
- **Service**: ✅ voice-to-report.service.ts
- **Features**:
  - Audio Upload (max 25MB)
  - Whisper Transcription
  - NLU Data Extraction
  - Multilingual Support (EN, ES, FR, DE, IT, PT)
  - Quality Scoring
  - Test Transcription (no audio)

### 37. websocket (Real-Time Communication)
- **Path**: `/src/modules/websocket`
- **Gateway**: ✅ websocket.gateway.ts
- **Features**: WebSocket events for real-time updates

### 38. passport (Player Digital Passport)
- **Path**: `/src/passport`
- **Controller**: ✅ passport.controller.ts
- **Service**: ✅ passport.service.ts
- **Features**:
  - Create Player Passport
  - Verify Passport (Admin only)
  - Public Token Access
  - QR Code Generation

---

## ROLES & PERMISSIONS (RBAC)

### User Roles Hierarchy

```typescript
enum UserRole {
  SUPER_ADMIN    // Full system access
  ADMIN          // Platform management
  AGENT          // Player agent with premium features
  SCOUT          // Professional scout
  ANALYST        // Data analyst
  PLAYER         // Player profile
  CLUB_CONTACT   // Club representative
  PUBLIC         // Basic user
}
```

### Role Permissions Matrix

| Feature | PUBLIC | PLAYER | SCOUT | ANALYST | AGENT | CLUB_CONTACT | ADMIN | SUPER_ADMIN |
|---------|--------|--------|-------|---------|-------|--------------|-------|-------------|
| View Players | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create Players | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Edit Players | ❌ | Own | ✅ | ❌ | Own | ❌ | ✅ | ✅ |
| Delete Players | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Create Reports | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Review Reports | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| AI Features (GOLD) | 💰 | 💰 | 💰 | 💰 | 💰 | 💰 | ✅ | ✅ |
| AutoScout | 💰 | 💰 | 💰 | 💰 | 💰 | 💰 | ✅ | ✅ |
| Marketplace (Scout) | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| Marketplace (Club) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Data Sync | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Analytics | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Player Validation | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |

💰 = Requires subscription tier (usually GOLD)

---

## SUBSCRIPTION TIERS

### Tier Hierarchy

```typescript
enum SubscriptionTier {
  FREE        // €0/month - Basic access
  BASIC       // €19.99/month - Enhanced features
  PRO         // €39.99/month - Professional tools
  ENTERPRISE  // €99.99/month - Full platform
  GOLD        // €49.99/month - AI-powered features
}
```

### Pricing (Updated Nov 2025)

| Tier | Monthly | Yearly | Features |
|------|---------|--------|----------|
| **FREE** | €0 | €0 | View players, basic search, 3 reports/month |
| **BASIC** | €19.99 | €199 (17% off) | Advanced filters, 20 reports/month, player stats |
| **PRO** | €39.99 | €399 (17% off) | Unlimited reports, analytics, camps, coaching |
| **GOLD** | €49.99 | €499 (17% off) | **AI features**, AutoScout, SmartScout, Voice-to-Report, Market Value |
| **ENTERPRISE** | €99.99 | €999 (17% off) | Everything + priority support, custom integrations |

**Note**: Prices increased by +150% (Nov 2025) but still 10x cheaper than Wyscout (€3K-20K/year)

### Features by Tier

#### FREE
- View player database
- Basic search & filters
- Create 3 scouting reports per month
- View public camps

#### BASIC
- Advanced player filters (age, height, weight, value)
- 20 scouting reports per month
- Player statistics
- Camp registration
- Email notifications

#### PRO
- Unlimited scouting reports
- Analytics dashboard
- Kanban pipeline/CRM
- Club requests
- Event management
- Coaching bookings
- Marketplace access

#### GOLD (AI Features)
- **AutoScout**: AI-generated scouting reports (GPT-4)
- **SmartScout**: Autocomplete & suggestions
- **Voice-to-Report**: Audio transcription to reports
- **AI Player Analysis**: Performance, talent prediction
- **Market Value AI**: Player valuation
- **Performance Predictor**: ML-based match predictions
- **ArkaneIndex**: AI performance index
- **Suspicious Profile Detection**
- All PRO features

#### ENTERPRISE
- Everything in GOLD
- Priority support
- Custom integrations
- Dedicated account manager
- API access
- White-label options

---

## AI FEATURES

### AI Services Overview

Total AI-powered modules: **10**

#### 1. ai (AI Intelligence Hub)
- **Endpoints**: 7
- **Base Route**: `/api/ai`
- **Tier Required**: GOLD
- **Cost**: ~$0.02-0.05 per request
- **Features**:
  - `POST /summary` - AI summary generation
  - `GET /index/:playerId` - ArkaneIndex calculation
  - `POST /matchmaking` - AI club-player matching
  - `GET /player-analysis/:playerId` - Performance analysis
  - `GET /talent-prediction/:playerId` - Talent potential
  - `GET /match-recommendation/:playerId` - Club recommendations
  - `GET /suspicious-detection/:playerId` - Fraud detection

#### 2. auto-scout (AI Report Generation)
- **Endpoints**: 10
- **Base Route**: `/api/auto-scout`
- **Tier Required**: GOLD
- **Rate Limit**: 10 reports/hour (cost control)
- **Model**: GPT-4 Turbo
- **Cost**: ~$0.024-0.032 per report
- **Features**:
  - `POST /generate` - Generate AI report
  - `POST /bulk-generate` - Generate multiple reports (Admin only)
  - `POST /enhance/:reportId` - Enhance existing report
  - `GET /templates` - Available templates
  - `POST /custom` - Custom template generation
  - `GET /preview/:playerId` - Preview without saving
  - `GET /analytics` - Usage & cost analytics
  - `GET /player/:playerId/history` - Report history
  - `GET /cost-estimate` - Estimate cost before generation

**Report Types**:
- MATCH_PERFORMANCE (~3000 tokens, $0.024)
- SEASON_OVERVIEW (~3500 tokens, $0.028)
- TRANSFER_TARGET (~4000 tokens, $0.032)
- YOUTH_PROSPECT (~3200 tokens, $0.026)
- QUICK_SCAN (~2000 tokens, $0.016)

**Quality Scoring**:
- Reports are graded (A-F) based on:
  - Completeness
  - Data availability
  - Confidence score
  - Token usage efficiency

#### 3. voice-to-report (Whisper Transcription)
- **Endpoints**: 4
- **Base Route**: `/api/voice-to-report`
- **Tier Required**: GOLD
- **Rate Limit**: 10 requests/minute
- **Model**: OpenAI Whisper
- **Max File Size**: 25MB
- **Languages**: EN, ES, FR, DE, IT, PT
- **Features**:
  - `POST /process` - Upload audio, get structured report
  - `GET /languages` - Supported languages
  - `GET /examples` - Voice report templates
  - `POST /test-transcription` - Test NLU extraction

**Flow**:
1. Upload audio file (mp3, wav, webm, m4a, ogg)
2. Whisper transcribes to text
3. GPT-4 extracts structured data
4. Validation & confidence scoring
5. Return structured scouting report

#### 4. smart-scout (Autocomplete & Suggestions)
- **Endpoints**: 4
- **Base Route**: `/api/smart-scout`
- **Tier Required**: GOLD
- **Model**: text-embedding-3-small + GPT-4
- **Features**:
  - `POST /suggestions` - Get report suggestions based on partial data
  - `POST /autocomplete` - Smart autocomplete for fields
  - `GET /insights/:playerId` - AI insights from historical reports
  - `POST /index/:reportId` - Index report for vector search (Admin)
  - `POST /reindex-all` - Reindex all reports (Admin)

**Vector Embeddings**:
- Reports are embedded using OpenAI's embedding model
- Stored in `report_embeddings` table
- Used for similarity search and autocomplete

#### 5. market-value (AI Valuation)
- **Endpoints**: 5
- **Base Route**: `/api/market-value`
- **Tier Required**: GOLD
- **Model**: Custom ML (TBD) or GPT-4
- **Features**:
  - `GET /player/:playerId` - Player market value
  - `GET /trend/:playerId` - Valuation trend
  - `POST /compare` - Compare multiple players
  - `POST /retrain` - Retrain ML model
  - `GET /health` - AI service health

**Valuation Factors**:
- Age
- Position
- Performance stats
- Market trends
- Contract status
- Injuries

#### 6. performance-predictor (ML Predictions)
- **Endpoints**: 6
- **Base Route**: `/api/performance-predictor`
- **Tier Required**: GOLD
- **Model**: Custom ML (scikit-learn or similar)
- **Features**:
  - `POST /predict/:playerId/:matchId` - Predict performance
  - `POST /batch-predict/:matchId` - Predict all players in match
  - `GET /accuracy` - Historical accuracy metrics
  - `GET /feature-importance` - Model insights
  - `POST /retrain` - Retrain ML model

**Prediction Output**:
- Predicted rating (0-100)
- Confidence interval (low, high)
- Confidence score
- Rating distribution (JSON)
- Key influencing factors
- Recommendations

#### 7. playstyle-dna (Player Style Analysis)
- **Endpoints**: 3
- **Base Route**: `/api/playstyle-dna`
- **Tier Required**: GOLD (likely)
- **Features**:
  - Generate PlayStyle DNA
  - Radar chart data
  - Style comparisons

#### 8. arkane-match (AI Match Chat)
- **Endpoints**: TBD
- **Base Route**: `/api/arkane-match`
- **Tier Required**: GOLD
- **Status**: Coming Soon
- **Features**: AI-powered chat about matches and players

#### 9. analytics (AI-Enhanced Analytics)
- **Endpoints**: 9
- **Base Route**: `/api/analytics`
- **Features**:
  - RBAC monitoring (403 errors, conversions)
  - Activity trends
  - Recommendation engine (based on metrics)

#### 10. marketplace (AI Matching)
- **Endpoints**: 1 (AI-related)
- **Base Route**: `/api/marketplace`
- **Features**:
  - `POST /listings/match` - AI matching score for scouts

### AI Cost Control

**Throttling Strategy**:
- AI endpoints: 10 requests/hour (standard)
- AutoScout bulk: 3 operations/hour
- Voice-to-Report: 10 requests/minute
- General AI: 10 requests/minute

**Cost Tracking**:
- Each AI-generated report stores: `tokensUsed`, `generationTime`, `cost`
- Analytics endpoint: `/auto-scout/analytics` shows total costs
- Admin can monitor via `/analytics/rbac-metrics`

**Estimated Monthly Costs** (100 users, GOLD tier):
- AutoScout: ~$100-200/month
- Voice-to-Report: ~$50/month
- SmartScout: ~$30/month
- AI Analysis: ~$20/month
- **Total**: ~$200-300/month

---

## API ENDPOINTS SUMMARY

### Authentication & User Management

#### `/api/auth` (Public)
- `POST /signup` - Create account (rate limit: 3/min)
- `POST /login` - Authenticate (rate limit: 5/min)
- `GET /csrf-token` - Get CSRF token
- `GET /me` - Get current user [Auth]
- `POST /refresh` - Refresh access token
- `POST /logout` - Logout [Auth]
- `POST /logout-all` - Logout all devices [Auth]

#### `/api/subscriptions` (Mixed)
- `GET /pricing` - Get pricing plans [Public]
- `GET /me` - Get my subscription [Auth]
- `POST /` - Create/update subscription [Auth]
- `PUT /cancel` - Cancel subscription [Auth]
- `PUT /reactivate` - Reactivate subscription [Auth]
- `PUT /change-tier` - Change tier [Auth]

#### `/api/onboarding` [Auth]
- `GET /status` - Get onboarding status
- `POST /start` - Start onboarding
- `POST /step/:stepKey` - Complete step
- `POST /skip/:stepKey` - Skip step
- `POST /complete` - Complete onboarding

### Players & Scouting

#### `/api/players` (Mixed)
- `GET /` - List players with filters [Public]
- `GET /:id` - Get player details [Public]
- `POST /` - Create player [Auth: SCOUT, ADMIN]
- `PUT /:id` - Update player [Auth: SCOUT, ADMIN]
- `DELETE /:id` - Delete player [Auth: ADMIN]
- `GET /:id/stats` - Player statistics [Public]
- `GET /:id/reports` - Player reports [Public]

#### `/api/scouting-reports` [Mixed]
- `GET /` - List reports with filters [Public]
- `GET /:id` - Get report [Public]
- `POST /` - Create report [Auth]
- `PATCH /:id` - Update report [Auth]
- `DELETE /:id` - Delete report [Auth]
- `POST /:id/submit` - Submit for review [Auth]
- `POST /:id/review` - Review report [Auth: ADMIN]
- `GET /:id/pdf` - Download PDF [Public]
- `GET /player/:playerId` - Player reports [Public]
- `GET /scout/:scoutId` - Scout reports [Public]
- `GET /match/:matchId` - Match reports [Public]

#### `/api/clubs` (Mixed)
- `GET /` - List clubs [Public]
- `GET /:id` - Get club details [Public]
- `POST /` - Create club [Auth: ADMIN]
- `PUT /:id` - Update club [Auth: ADMIN]
- `DELETE /:id` - Delete club [Auth: ADMIN]

#### `/api/matches` [Auth]
- `GET /` - List matches
- `GET /:id` - Get match details
- `POST /` - Create match [ADMIN]
- `PUT /:id` - Update match [ADMIN]
- `DELETE /:id` - Delete match [ADMIN]

### AI Features (All GOLD Tier)

#### `/api/ai` [Auth, GOLD]
- `GET /usage-stats` - Usage statistics [Public]
- `POST /summary` - Generate AI summary
- `GET /index/:playerId` - Player AI index
- `POST /matchmaking` - AI matchmaking
- `GET /player-analysis/:playerId` - Performance analysis
- `GET /talent-prediction/:playerId` - Talent prediction
- `GET /match-recommendation/:playerId` - Club recommendations
- `GET /suspicious-detection/:playerId` - Fraud detection

#### `/api/auto-scout` [Auth, SCOUT/ADMIN, GOLD]
- `POST /generate` - Generate report (10/hour)
- `POST /bulk-generate` - Bulk generate [ADMIN] (3/hour)
- `POST /enhance/:reportId` - Enhance report (15/hour)
- `GET /templates` - Report templates
- `POST /custom` - Custom template [ADMIN] (5/hour)
- `GET /preview/:playerId` - Preview report (20/hour)
- `GET /analytics` - Usage analytics
- `GET /player/:playerId/history` - Report history
- `GET /history` - My report history
- `GET /cost-estimate` - Estimate cost
- `POST /regenerate/:reportId` - Regenerate report (10/hour)

#### `/api/voice-to-report` [Auth, GOLD]
- `POST /process` - Process voice recording (10/min, 25MB max)
- `GET /languages` - Supported languages [Public]
- `GET /examples` - Voice templates [Public]
- `POST /test-transcription` - Test extraction (5/min)

#### `/api/smart-scout` [Auth, SCOUT/ANALYST/ADMIN, GOLD]
- `POST /suggestions` - Get suggestions
- `POST /autocomplete` - Autocomplete field
- `GET /insights/:playerId` - Player insights
- `POST /index/:reportId` - Index report [ADMIN]
- `POST /reindex-all` - Reindex all [ADMIN]

#### `/api/market-value` [Auth, GOLD]
- `GET /player/:playerId` - Player valuation
- `GET /trend/:playerId` - Valuation trend
- `POST /compare` - Compare players
- `POST /retrain` - Retrain model
- `GET /health` - Service health [Public]

#### `/api/performance-predictor` [Auth, GOLD]
- `POST /predict/:playerId/:matchId` - Predict performance
- `POST /batch-predict/:matchId` - Batch predict
- `GET /accuracy` - Accuracy metrics
- `GET /feature-importance` - Model insights
- `POST /retrain` - Retrain model
- `GET /predictions/:playerId` - Historical predictions
- `GET /insights/:playerId` - Performance insights

#### `/api/playstyle-dna` [Auth, GOLD?]
- Generate PlayStyle DNA
- Radar chart data
- Style comparisons

### Marketplace & Services

#### `/api/marketplace` [Auth]
- `POST /listings` - Create scout listing [SCOUT]
- `GET /listings/my` - My listing [SCOUT]
- `PATCH /listings` - Update listing [SCOUT]
- `PATCH /listings/activate` - Activate listing [SCOUT]
- `PATCH /listings/pause` - Pause listing [SCOUT]
- `DELETE /listings` - Delete listing [SCOUT]
- `GET /listings` - Search listings [Public]
- `GET /listings/:id` - Get listing [Public]
- `POST /listings/match` - AI matching [CLUB]
- `POST /offers` - Send offer [CLUB]
- `GET /offers/sent` - Sent offers [CLUB]
- `GET /offers/received` - Received offers [SCOUT]
- `PATCH /offers/:id/accept` - Accept offer [SCOUT]
- `PATCH /offers/:id/reject` - Reject offer [SCOUT]
- `PATCH /offers/:id/complete` - Complete offer [SCOUT]
- `PATCH /offers/:id/cancel` - Cancel offer
- `POST /reviews` - Create review [CLUB]
- `GET /reviews/listing/:listingId` - Listing reviews
- `POST /favorites` - Add favorite [CLUB]
- `GET /favorites/my` - My favorites [CLUB]
- `DELETE /favorites/:id` - Remove favorite [CLUB]
- `PATCH /favorites/:id` - Update favorite [CLUB]

#### `/api/coaching` [Auth]
- `GET /coaches` - List coaches
- `GET /coaches/:id` - Coach details
- `POST /bookings` - Book session
- `GET /bookings/my` - My bookings
- `PATCH /bookings/:id/confirm` - Confirm booking [COACH]
- `PATCH /bookings/:id/cancel` - Cancel booking
- `PATCH /bookings/:id/complete` - Complete booking [COACH]
- `POST /bookings/:id/review` - Leave review

#### `/api/camps` [Auth]
- `GET /` - List camps [Public]
- `GET /:id` - Camp details [Public]
- `POST /` - Create camp [ADMIN]
- `PATCH /:id` - Update camp [ADMIN]
- `DELETE /:id` - Delete camp [ADMIN]
- `POST /:id/register` - Register participant
- `GET /my-registrations` - My registrations
- `PATCH /participations/:id/evaluate` - Evaluate participant [ADMIN]

### Gamification & Engagement

#### `/api/gamification` [Auth]
- `GET /profile` - Gamification profile
- `GET /achievements` - User achievements
- `GET /badges` - User badges
- `GET /leaderboard/:category` - Leaderboard
- `GET /daily-challenge` - Daily challenge
- `POST /daily-challenge/claim` - Claim reward
- `POST /achievement/:id/share` - Share achievement
- `POST /badge/:id/pin` - Pin badge
- `GET /stats` - User stats
- `POST /track-action/:action` - Track action

### Analytics & Monitoring

#### `/api/analytics` [Auth]
- `GET /overview` - Platform overview
- `GET /players` - Players analytics
- `GET /clubs` - Clubs analytics
- `GET /scouting-reports` - Reports analytics
- `GET /club-requests` - Requests analytics
- `GET /events` - Events analytics
- `GET /activity-trends` - Activity trends
- `GET /rbac-metrics` - RBAC monitoring
- `GET /rbac-metrics/403-rate` - 403 error rate
- `GET /rbac-metrics/conversion-rate` - Conversion rate

### Player Tools

#### `/api/passport` [Mixed]
- `POST /` - Create passport [Auth: ADMIN, AGENT, SCOUT]
- `GET /player/:playerId` - Get passport by player [Auth]
- `GET /token/:token` - Get passport by token [Public]
- `GET /qr/:token` - Get QR code [Public]
- `PUT /player/:playerId/verify` - Verify passport [Auth: ADMIN]
- `DELETE /player/:playerId` - Delete passport [Auth: ADMIN]

#### `/api/player-validation` [Auth: AGENT, ADMIN]
- `GET /pending` - Pending validations
- `POST /:playerId/verify` - Verify player
- `POST /:playerId/reject` - Reject player
- `POST /:playerId/convert` - Convert to agency

### System & Admin

#### `/api/health` [Public]
- `GET /` - Health check
- `GET /database` - Database health
- `GET /external` - External services health

#### `/api/data-sync` [Auth: ADMIN]
- `POST /sync-players` - Sync players from external API
- `POST /sync-clubs` - Sync clubs
- `POST /sync-matches` - Sync matches
- `GET /sync-status` - Sync status

#### `/api/notifications` [Auth]
- `GET /` - List notifications
- `POST /mark-read/:id` - Mark as read
- `POST /mark-all-read` - Mark all as read
- `DELETE /:id` - Delete notification

#### `/api/events` [Auth]
- `GET /` - List events
- `GET /:id` - Event details
- `POST /` - Create event
- `PATCH /:id` - Update event
- `DELETE /:id` - Delete event
- `POST /:id/assign` - Assign user

#### `/api/kanban` [Auth: SCOUT, ADMIN]
- `GET /boards` - List boards
- `POST /boards` - Create board
- `GET /boards/:id` - Board details
- `POST /boards/:id/columns` - Add column
- `POST /boards/:id/cards` - Add card
- `PATCH /cards/:id` - Update card
- `DELETE /cards/:id` - Delete card

#### `/api/club-requests` [Auth]
- `GET /` - List requests
- `POST /` - Create request [CLUB]
- `GET /:id` - Request details
- `PATCH /:id/respond` - Respond to request
- `DELETE /:id` - Delete request

#### `/api/media` [Auth]
- `POST /upload` - Upload file
- `GET /` - List media
- `GET /:id` - Media details
- `DELETE /:id` - Delete media

#### `/api/payments` [Auth]
- `POST /create-checkout-session` - Create Stripe session
- `POST /webhook` - Stripe webhook [Public]
- `GET /history` - Payment history

#### `/api/search` [Mixed]
- `GET /` - Global search [Public]
- `GET /autocomplete` - Autocomplete [Public]

---

## GUARDS & DECORATORS

### Guards (Security Layers)

1. **JwtAuthGuard** (`/common/guards/jwt-auth.guard.ts`)
   - Validates JWT token
   - Attaches user to request
   - Used on all protected routes

2. **RolesGuard** (`/common/guards/roles.guard.ts`)
   - Checks user role against required roles
   - Works with `@Roles()` decorator

3. **SubscriptionTierGuard** (`/common/guards/subscription-tier.guard.ts`)
   - Checks subscription tier
   - Works with `@MinTier()` decorator
   - Bypasses for public routes (`@Public()`)
   - Returns 403 if insufficient tier

4. **AuthThrottlerGuard** (`/common/guards/auth-throttler.guard.ts`)
   - Custom throttler for auth endpoints
   - Stricter limits on login/signup

5. **AiThrottlerGuard** (`/common/guards/ai-throttler.guard.ts`)
   - Specialized throttler for AI endpoints
   - Cost control for OpenAI API

6. **OptionalJwtAuthGuard** (`/common/guards/optional-jwt-auth.guard.ts`)
   - JWT is optional (doesn't fail if missing)
   - Used for endpoints that work with/without auth

7. **OwnershipGuard** (`/common/guards/ownership.guard.ts`)
   - Checks if user owns the resource
   - Works with `@CheckOwnership()` decorator

### Decorators (Metadata)

1. **@Public()** (`/common/decorators/public.decorator.ts`)
   - Marks route as public (no auth required)
   - Bypasses JwtAuthGuard and SubscriptionTierGuard

2. **@Roles(...roles)** (`/common/decorators/roles.decorator.ts`)
   - Specifies required roles
   - Example: `@Roles('SCOUT', 'ADMIN')`

3. **@MinTier(tier)** (`/common/decorators/min-tier.decorator.ts`)
   - Specifies minimum subscription tier
   - Example: `@MinTier(SubscriptionTier.GOLD)`

4. **@CheckOwnership()** (`/common/decorators/check-ownership.decorator.ts`)
   - Validates resource ownership
   - Used with OwnershipGuard

### Guard Stacking Example

```typescript
@Controller('auto-scout')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionTierGuard)
@ApiBearerAuth()
export class AutoScoutController {

  @Post('generate')
  @Roles('SCOUT', 'ADMIN', 'SUPER_ADMIN')
  @MinTier(SubscriptionTier.GOLD)
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  async generateReport(@Body() dto: GenerateReportDto) {
    // Only accessible to:
    // 1. Authenticated users (JwtAuthGuard)
    // 2. With SCOUT, ADMIN, or SUPER_ADMIN role (RolesGuard)
    // 3. With GOLD subscription or higher (SubscriptionTierGuard)
    // 4. Max 10 requests per hour (Throttle)
  }
}
```

---

## MODULE DEEP DIVE

### Critical Modules Detail

#### 1. auto-scout (AI Report Generation)

**File Structure**:
```
auto-scout/
├── auto-scout.controller.ts
├── auto-scout.service.ts
├── auto-scout.module.ts
├── stats-aggregator.service.ts
└── dto/
    ├── generate-report.dto.ts
    ├── bulk-generate.dto.ts
    ├── enhance-report.dto.ts
    ├── custom-generate.dto.ts
    └── index.ts
```

**Key DTOs**:
- **GenerateReportDto**: `playerId`, `matchId`, `reportType`, `customContext`, `temperature`, `includeComparisons`
- **BulkGenerateDto**: `playerIds[]`, `matchId`
- **EnhanceReportDto**: Minimal (reportId in URL)
- **CustomGenerateDto**: `playerId`, `template`, `customPrompt`

**Report Quality Scoring**:
```typescript
interface QualityScore {
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    completeness: number;
    dataAvailability: number;
    confidence: number;
    tokenEfficiency: number;
  };
}
```

**Templates Available**:
- MATCH_PERFORMANCE
- SEASON_OVERVIEW
- TRANSFER_TARGET
- YOUTH_PROSPECT
- QUICK_SCAN

#### 2. subscriptions (Tier Management)

**File Structure**:
```
subscriptions/
├── subscriptions.controller.ts
├── subscriptions.service.ts
├── subscriptions.module.ts
├── subscription-pricing.config.ts
└── dto/
    ├── create-subscription.dto.ts
    └── cancel-subscription.dto.ts
```

**Key Service Methods**:
```typescript
class SubscriptionsService {
  // Check if user has minimum tier
  async hasMinimumTier(userId: string, requiredTier: SubscriptionTier): Promise<boolean>

  // Get user subscription
  async getMySubscription(userId: string)

  // Create/update subscription
  async createOrUpdateSubscription(userId: string, dto: CreateSubscriptionDto)

  // Cancel subscription
  async cancelSubscription(userId: string, dto: CancelSubscriptionDto)

  // Change tier (upgrade/downgrade)
  async changeTier(userId: string, dto: CreateSubscriptionDto)
}
```

**Tier Hierarchy Logic**:
```typescript
const tierHierarchy = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  GOLD: 3,
  ENTERPRISE: 4,
};

function hasMinimumTier(currentTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
}
```

#### 3. analytics (Monitoring & Metrics)

**RBAC Monitoring**:
- Tracks 403 errors (feature blocking)
- Monitors upgrade modal interactions
- Tracks subscription conversions
- Calculates conversion rates
- Revenue attribution by feature/source

**Key Metrics**:
```typescript
interface RbacMetrics {
  period: string;
  dateRange: { start: Date; end: Date };
  total_403_errors: number;
  '403_rate': number; // percentage
  most_blocked_features: Array<{ feature: string; count: number }>;
  conversions: {
    total: number;
    conversion_rate: number;
    revenue_generated: number;
    by_tier: Record<string, number>;
    by_source: Array<{ source: string; count: number; revenue: number }>;
  };
  upgrade_modal: {
    shown: number;
    dismissed: number;
    cta_clicked: number;
    ctr: number;
    dismiss_rate: number;
  };
  recommendations: string[];
}
```

**Analytics Tables**:
- `rbac_events` - Tracks all RBAC events (403s, modal shows, etc.)
- `upgrade_modals` - Modal interaction tracking
- `subscription_conversions` - Conversion tracking with revenue

#### 4. gamification (XP System)

**Gamification Components**:
1. **Levels & XP**: Users gain XP, level up
2. **Achievements**: Unlock achievements with conditions
3. **Badges**: Earn badges (Bronze, Silver, Gold, Platinum, Diamond)
4. **Leaderboards**: Weekly, Monthly, All-Time
5. **Daily Challenges**: Reset every day, earn rewards
6. **Streaks**: Login streak tracking

**Achievement Categories**:
```typescript
enum AchievementCategory {
  PLAYER_MILESTONE,    // Player-related achievements
  SCOUT_EXPERTISE,     // Scout-related achievements
  CLUB_ACHIEVEMENT,    // Club-related achievements
  SOCIAL_ENGAGEMENT,   // Social/sharing achievements
  PERFORMANCE,         // Performance-based achievements
}
```

**Achievement Rarities**:
```typescript
enum AchievementRarity {
  COMMON,      // 10 points
  RARE,        // 25 points
  EPIC,        // 50 points
  LEGENDARY,   // 100 points
  MYTHIC,      // 250 points
}
```

**Tracked Stats**:
- `totalPoints`, `currentLevel`, `currentLevelPoints`, `nextLevelPoints`
- `achievementsCount`, `badgesCount`
- `reportsCreated`, `reportsSubmitted`
- `playersValidated`, `goalsScored`, `matchesPlayed`
- `loginStreak`, `lastLoginDate`

#### 5. marketplace (Scout Hiring)

**Marketplace Flow**:
1. Scout creates listing (profile, rates, expertise)
2. Clubs search for scouts with filters
3. AI matching algorithm scores compatibility
4. Club sends offer to scout
5. Scout accepts/rejects offer
6. Work completed, club leaves review

**Scout Listing Fields**:
- `headline`, `bio`, `expertise` (JSON)
- `languages[]`, `availability` (JSON)
- `hourlyRate`, `matchRate`, `reportRate`, `currency`
- `portfolio` (JSON), `stats` (JSON)
- `status`, `isVerified`

**Offer Types**:
```typescript
enum OfferType {
  MATCH_ASSIGNMENT,  // Scout a specific match
  PLAYER_REPORT,     // Report on specific player
  CONSULTATION,      // Advisory/consulting
  RETAINER,          // Long-term contract
}
```

**Offer Statuses**:
```typescript
enum OfferStatus {
  PENDING,
  VIEWED,
  ACCEPTED,
  REJECTED,
  IN_PROGRESS,
  COMPLETED,
  CANCELLED,
}
```

#### 6. voice-to-report (Voice Transcription)

**Processing Pipeline**:
1. **Upload**: Audio file (max 25MB)
2. **Storage**: Temporary storage in Supabase
3. **Transcription**: OpenAI Whisper API
4. **NLU Extraction**: GPT-4 extracts structured data
5. **Validation**: Validates extracted fields
6. **Confidence Scoring**: Calculates confidence (0-100%)
7. **Suggestions**: Generates improvement suggestions
8. **Cleanup**: Deletes audio (unless `keepAudio=true`)

**Supported Languages**:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)

**Extracted Fields**:
```typescript
interface ExtractedReportData {
  playerName?: string;
  jerseyNumber?: number;
  position?: string;
  overallRating?: number;
  technicalRating?: number;
  physicalRating?: number;
  mentalRating?: number;
  tacticalRating?: number;
  strengths?: string;
  weaknesses?: string;
  summary?: string;
  recommendation?: RecommendationType;
  tags?: string[];
}
```

**Quality Warnings**:
- Missing critical fields
- Low confidence scores
- Ambiguous data
- Incomplete ratings

---

## DEPLOYMENT & INFRASTRUCTURE

### Environment Setup

**Required Services**:
1. PostgreSQL database
2. OpenAI API (for AI features)
3. Stripe (for payments)
4. Supabase (for file storage)
5. Firebase (for push notifications)
6. Sentry (for error tracking)

### Database Migrations

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database (demo data)
npm run seed
```

### Starting the Backend

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### API Documentation

- **Swagger UI**: `http://localhost:3000/api`
- **OpenAPI JSON**: `http://localhost:3000/api-json`

### Health Check

```bash
curl http://localhost:3000/health
```

---

## SECURITY CONSIDERATIONS

### Rate Limiting

- Auth endpoints: 3-5 requests/minute
- AI endpoints: 10 requests/hour (cost control)
- General API: 100 requests/minute

### Authentication

- JWT with RS256 signing
- Refresh tokens with rotation
- Token blacklisting on logout
- Session management

### Data Protection

- Password hashing with bcrypt (10 rounds)
- CSRF protection (production)
- CORS configuration
- SQL injection protection (Prisma)
- XSS protection (NestJS built-in)

### RBAC Enforcement

- Role-based access control on all protected routes
- Subscription tier gating for premium features
- 403 error tracking for security monitoring
- Audit logs for sensitive operations

---

## PERFORMANCE OPTIMIZATIONS

### Caching

- Redis cache for frequently accessed data
- In-memory cache fallback
- Cache invalidation on updates

### Database

- Proper indexing on frequently queried fields
- Connection pooling
- Query optimization with Prisma

### API

- Pagination on list endpoints
- Rate limiting to prevent abuse
- Compression (gzip)

---

## MONITORING & LOGGING

### Error Tracking

- Sentry integration for error reporting
- Stack traces sent to Sentry
- Performance monitoring

### Analytics

- RBAC metrics dashboard
- Conversion tracking
- Feature usage analytics
- Cost monitoring (AI features)

### Audit Logs

- `audit_logs` table tracks all sensitive operations
- User actions logged with IP and user agent

---

## FUTURE ENHANCEMENTS

### Planned Features

1. **ArkaneMatch Chat** - AI chat about matches (in progress)
2. **Advanced ML Models** - Custom ML for valuations and predictions
3. **Video Analysis** - AI-powered video scouting
4. **Mobile API Parity** - Ensure mobile has all features
5. **Real-Time Notifications** - WebSocket enhancements
6. **Custom Reports** - User-defined report templates
7. **API Access** - Public API for ENTERPRISE tier
8. **White-Label** - Custom branding for ENTERPRISE

### Technical Debt

1. Extract `ExternalApisModule` (currently disabled due to schema issues)
2. Improve test coverage (currently ~40%)
3. Add E2E tests for critical flows
4. Optimize database queries (some N+1 issues)
5. Add more comprehensive API documentation

---

## CONCLUSION

Arcane's backend is a sophisticated, AI-powered scouting platform with:

- **38 modules** covering every aspect of football scouting
- **8 user roles** with granular RBAC
- **5 subscription tiers** with feature gating
- **10 AI-powered features** (GPT-4, Whisper, ML)
- **200+ API endpoints** fully documented
- **Production-ready** with monitoring, analytics, and security

The architecture is modular, scalable, and designed for future growth. Each module can be extracted into a microservice if needed. The platform is 10x cheaper than competitors while offering cutting-edge AI features.

**Last Updated**: 2025-11-16
**Backend Version**: 2.0.0 (Nov 2025 Pricing Update)
**Database**: PostgreSQL + Prisma
**AI Provider**: OpenAI (GPT-4, Whisper)
**Status**: Production-Ready ✅
