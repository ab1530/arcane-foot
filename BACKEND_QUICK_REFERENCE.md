# BACKEND QUICK REFERENCE - ARCANE

**Quick access guide to backend architecture**
**Generated**: 2025-11-16

---

## MODULE CATEGORIES AT A GLANCE

### Core Platform (8 modules)
```
auth           - Authentication & JWT
users          - User management
subscriptions  - Subscription tiers & billing
prisma         - Database service
cache          - Redis/memory caching
health         - Health checks
supabase       - File storage
firebase       - Push notifications
```

### Player & Club Management (6 modules)
```
players        - Player profiles & CRUD
clubs          - Club profiles & CRUD
matches        - Match database
events         - Calendar & event management
player-validation - Agency player verification
passport       - Digital player passports
```

### Scouting Features (4 modules)
```
scouting-reports - Manual scouting reports
kanban          - Scout pipeline/CRM
search          - Global search
club-requests   - Club-player interactions
```

### AI-Powered Features (10 modules)
```
ai              - AI intelligence hub (ArkaneIndex, etc.)
auto-scout      - AI report generation (GPT-4)
voice-to-report - Voice transcription (Whisper)
smart-scout     - Autocomplete & suggestions
market-value    - AI market valuation
performance-predictor - ML performance prediction
playstyle-dna   - Player style analysis
arkane-match    - AI match chat (coming soon)
analytics       - AI-enhanced analytics
marketplace     - AI matching (scout-club)
```

### Services & Marketplace (4 modules)
```
marketplace     - Scout hiring platform
coaching        - Coaching services
camps           - Training camps & events
payments        - Stripe integration
```

### Engagement & Social (3 modules)
```
gamification    - XP, levels, achievements
notifications   - In-app notifications
onboarding      - User onboarding flow
```

### System & Admin (3 modules)
```
data-sync       - External API sync
media           - File upload & storage
websocket       - Real-time communication
```

---

## SUBSCRIPTION TIERS - FEATURE MATRIX

```
┌─────────────────────────────────────────────────────────────────────────┐
│ TIER COMPARISON                                                         │
├──────────────┬──────────┬──────────┬──────────┬──────────┬─────────────┤
│ FEATURE      │ FREE     │ BASIC    │ PRO      │ GOLD     │ ENTERPRISE  │
├──────────────┼──────────┼──────────┼──────────┼──────────┼─────────────┤
│ Price/Month  │ €0       │ €19.99   │ €39.99   │ €49.99   │ €99.99      │
│ Reports/Mo   │ 3        │ 20       │ Unlimited│ Unlimited│ Unlimited   │
│ AI Features  │ ❌       │ ❌       │ ❌       │ ✅       │ ✅          │
│ AutoScout    │ ❌       │ ❌       │ ❌       │ ✅       │ ✅          │
│ Voice2Report │ ❌       │ ❌       │ ❌       │ ✅       │ ✅          │
│ SmartScout   │ ❌       │ ❌       │ ❌       │ ✅       │ ✅          │
│ Market Value │ ❌       │ ❌       │ ❌       │ ✅       │ ✅          │
│ Performance  │ ❌       │ ❌       │ ❌       │ ✅       │ ✅          │
│   Predictor  │          │          │          │          │             │
│ Analytics    │ ❌       │ ❌       │ ✅       │ ✅       │ ✅          │
│ Marketplace  │ ❌       │ ❌       │ ✅       │ ✅       │ ✅          │
│ Coaching     │ ❌       │ ❌       │ ✅       │ ✅       │ ✅          │
│ Camps        │ View     │ Register │ Full     │ Full     │ Full        │
│ Kanban CRM   │ ❌       │ ❌       │ ✅       │ ✅       │ ✅          │
│ Priority     │ ❌       │ ❌       │ ❌       │ ❌       │ ✅          │
│   Support    │          │          │          │          │             │
│ API Access   │ ❌       │ ❌       │ ❌       │ ❌       │ ✅          │
└──────────────┴──────────┴──────────┴──────────┴──────────┴─────────────┘
```

---

## ROLE PERMISSIONS MATRIX

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ROLE-BASED ACCESS CONTROL                                              │
├──────────────┬──────┬────────┬───────┬─────────┬───────┬──────┬────────┤
│ ACTION       │PUBLIC│ PLAYER │ SCOUT │ ANALYST │ AGENT │ CLUB │ ADMIN  │
├──────────────┼──────┼────────┼───────┼─────────┼───────┼──────┼────────┤
│ View Players │ ✅   │ ✅     │ ✅    │ ✅      │ ✅    │ ✅   │ ✅     │
│ Create       │ ❌   │ ❌     │ ✅    │ ❌      │ ✅    │ ❌   │ ✅     │
│   Players    │      │        │       │         │       │      │        │
│ Edit Players │ ❌   │ Own    │ ✅    │ ❌      │ Own   │ ❌   │ ✅     │
│ Delete       │ ❌   │ ❌     │ ❌    │ ❌      │ ❌    │ ❌   │ ✅     │
│   Players    │      │        │       │         │       │      │        │
│ Create       │ ❌   │ ❌     │ ✅    │ ✅      │ ✅    │ ❌   │ ✅     │
│   Reports    │      │        │       │         │       │      │        │
│ Review       │ ❌   │ ❌     │ ❌    │ ❌      │ ❌    │ ❌   │ ✅     │
│   Reports    │      │        │       │         │       │      │        │
│ AutoScout    │ 💰   │ 💰     │ 💰    │ 💰      │ 💰    │ 💰   │ ✅     │
│ Marketplace  │ ❌   │ ❌     │ ✅    │ ❌      │ ✅    │ ✅   │ ✅     │
│   (Scout)    │      │        │       │         │       │      │        │
│ Marketplace  │ ❌   │ ❌     │ ❌    │ ❌      │ ❌    │ ✅   │ ✅     │
│   (Club)     │      │        │       │         │       │      │        │
│ Data Sync    │ ❌   │ ❌     │ ❌    │ ❌      │ ❌    │ ❌   │ ✅     │
│ Analytics    │ ❌   │ ❌     │ ❌    │ ✅      │ ❌    │ ❌   │ ✅     │
│ Player       │ ❌   │ ❌     │ ❌    │ ❌      │ ✅    │ ❌   │ ✅     │
│   Validation │      │        │       │         │       │      │        │
└──────────────┴──────┴────────┴───────┴─────────┴───────┴──────┴────────┘

💰 = Requires GOLD subscription tier
```

---

## AI FEATURES OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AI FEATURE COMPARISON                                                   │
├────────────────────┬────────────┬──────────┬──────────┬────────────────┤
│ FEATURE            │ MODEL      │ RATE     │ COST/REQ │ TIER REQUIRED  │
├────────────────────┼────────────┼──────────┼──────────┼────────────────┤
│ AutoScout          │ GPT-4      │ 10/hour  │ $0.024   │ GOLD           │
│   (Generate)       │ Turbo      │          │ -$0.032  │                │
│ Voice-to-Report    │ Whisper    │ 10/min   │ $0.01    │ GOLD           │
│                    │ + GPT-4    │          │ -$0.02   │                │
│ SmartScout         │ Embeddings │ 20/hour  │ $0.001   │ GOLD           │
│   (Autocomplete)   │ + GPT-4    │          │ -$0.005  │                │
│ SmartScout         │ GPT-4      │ 10/hour  │ $0.01    │ GOLD           │
│   (Insights)       │            │          │ -$0.03   │                │
│ Market Value       │ GPT-4 or   │ 20/hour  │ $0.005   │ GOLD           │
│                    │ Custom ML  │          │ -$0.01   │                │
│ Performance        │ Custom ML  │ 50/hour  │ Free     │ GOLD           │
│   Predictor        │ (scikit)   │          │ (local)  │                │
│ AI Analysis        │ GPT-4      │ 10/min   │ $0.02    │ GOLD           │
│                    │            │          │ -$0.05   │                │
│ PlayStyle DNA      │ GPT-4 or   │ 20/hour  │ $0.01    │ GOLD           │
│                    │ Rule-based │          │ -$0.02   │                │
│ Suspicious         │ GPT-4      │ 10/hour  │ $0.01    │ GOLD           │
│   Detection        │            │          │ -$0.02   │                │
│ Marketplace        │ Custom     │ -        │ Free     │ PRO            │
│   Matching         │ Algorithm  │          │ (local)  │                │
└────────────────────┴────────────┴──────────┴──────────┴────────────────┘
```

---

## API ENDPOINT CATEGORIES

### Total Endpoints: ~200+

#### Authentication & User (15 endpoints)
```
POST   /api/auth/signup
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/logout
GET    /api/subscriptions/pricing
GET    /api/subscriptions/me
POST   /api/subscriptions
PUT    /api/subscriptions/cancel
GET    /api/onboarding/status
...
```

#### Players & Scouting (30+ endpoints)
```
GET    /api/players
GET    /api/players/:id
POST   /api/players
GET    /api/players/:id/stats
GET    /api/players/:id/reports
GET    /api/scouting-reports
POST   /api/scouting-reports
GET    /api/scouting-reports/:id/pdf
POST   /api/scouting-reports/:id/submit
POST   /api/scouting-reports/:id/review
GET    /api/clubs
GET    /api/matches
...
```

#### AI Features (50+ endpoints)
```
POST   /api/ai/summary
GET    /api/ai/index/:playerId
GET    /api/ai/player-analysis/:playerId
POST   /api/auto-scout/generate
POST   /api/auto-scout/bulk-generate
GET    /api/auto-scout/templates
GET    /api/auto-scout/analytics
POST   /api/voice-to-report/process
GET    /api/voice-to-report/languages
POST   /api/smart-scout/suggestions
POST   /api/smart-scout/autocomplete
GET    /api/smart-scout/insights/:playerId
GET    /api/market-value/player/:playerId
POST   /api/market-value/compare
POST   /api/performance-predictor/predict/:playerId/:matchId
...
```

#### Marketplace & Services (40+ endpoints)
```
GET    /api/marketplace/listings
POST   /api/marketplace/listings
POST   /api/marketplace/offers
GET    /api/marketplace/offers/sent
GET    /api/marketplace/offers/received
POST   /api/marketplace/reviews
GET    /api/coaching/coaches
POST   /api/coaching/bookings
GET    /api/camps
POST   /api/camps/:id/register
...
```

#### Gamification & Engagement (15+ endpoints)
```
GET    /api/gamification/profile
GET    /api/gamification/achievements
GET    /api/gamification/leaderboard/:category
GET    /api/gamification/daily-challenge
POST   /api/gamification/daily-challenge/claim
GET    /api/notifications
POST   /api/notifications/mark-read/:id
...
```

#### Analytics & Admin (20+ endpoints)
```
GET    /api/analytics/overview
GET    /api/analytics/players
GET    /api/analytics/rbac-metrics
POST   /api/data-sync/sync-players
POST   /api/data-sync/sync-clubs
GET    /api/player-validation/pending
POST   /api/player-validation/:playerId/verify
...
```

---

## DATABASE ENTITIES OVERVIEW

### Total Tables: 40+

#### Core (9 tables)
```
users                 - User accounts
players               - Player profiles
clubs                 - Club profiles
matches               - Match database
competitions          - Competitions/leagues
venues                - Stadiums/venues
scouting_reports      - Manual reports
subscriptions         - User subscriptions
user_stats            - Gamification stats
```

#### AI & Advanced (8 tables)
```
auto_generated_reports     - AI-generated reports
report_embeddings          - Vector embeddings for similarity
player_valuations          - Market value estimates
performance_predictions    - ML performance predictions
prediction_accuracy_log    - ML accuracy tracking
```

#### Marketplace (4 tables)
```
scout_listings        - Scout profiles for hire
marketplace_offers    - Club offers to scouts
marketplace_reviews   - Reviews & ratings
scout_favorites       - Club favorites
```

#### Gamification (5 tables)
```
achievements          - Achievement definitions
user_achievements     - User progress
leaderboards          - Leaderboard entries
daily_challenges      - Daily challenges
user_daily_challenges - User progress
```

#### Events & Camps (6 tables)
```
events                - Calendar events
event_assignments     - Event assignments
camps                 - Training camps
camp_participations   - Camp registrations
coaches               - Coach profiles
coaching_bookings     - Coaching sessions
```

#### System (8 tables)
```
notifications         - In-app notifications
media                 - File uploads
audit_logs            - Audit trail
rbac_events           - RBAC tracking
upgrade_modals        - Modal tracking
subscription_conversions - Conversion tracking
onboarding_steps      - Onboarding progress
user_onboarding       - Onboarding status
```

---

## COMMON WORKFLOWS

### 1. User Registration & Subscription
```
┌────────────────────────────────────────────────────┐
│ 1. POST /api/auth/signup                           │
│    → Create user account                           │
│                                                     │
│ 2. POST /api/auth/login                            │
│    → Get JWT tokens                                │
│                                                     │
│ 3. GET /api/subscriptions/pricing                  │
│    → View available plans                          │
│                                                     │
│ 4. POST /api/subscriptions                         │
│    → Subscribe to plan                             │
│                                                     │
│ 5. POST /api/payments/create-checkout-session      │
│    → Stripe checkout                               │
│                                                     │
│ 6. Webhook /api/payments/webhook                   │
│    → Activate subscription                         │
└────────────────────────────────────────────────────┘
```

### 2. AI Report Generation
```
┌────────────────────────────────────────────────────┐
│ 1. GET /api/players?search=Messi                   │
│    → Find player                                   │
│                                                     │
│ 2. GET /api/auto-scout/cost-estimate               │
│    → Check cost (optional)                         │
│                                                     │
│ 3. POST /api/auto-scout/generate                   │
│    → Generate AI report (GPT-4)                    │
│    ← Returns: report + quality score               │
│                                                     │
│ 4. GET /api/auto-scout/player/:id/history          │
│    → View all AI reports for player                │
└────────────────────────────────────────────────────┘
```

### 3. Voice-to-Report
```
┌────────────────────────────────────────────────────┐
│ 1. GET /api/voice-to-report/examples               │
│    → View example templates                        │
│                                                     │
│ 2. Record audio (mobile/web)                       │
│    → User speaks scouting report                   │
│                                                     │
│ 3. POST /api/voice-to-report/process               │
│    → Upload audio file (max 25MB)                  │
│    → Whisper transcribes                           │
│    → GPT-4 extracts structured data                │
│    ← Returns: structured report + confidence       │
│                                                     │
│ 4. POST /api/scouting-reports                      │
│    → Save extracted report                         │
└────────────────────────────────────────────────────┘
```

### 4. Marketplace (Scout Hiring)
```
┌────────────────────────────────────────────────────┐
│ SCOUT SIDE:                                        │
│ 1. POST /api/marketplace/listings                  │
│    → Create scout profile                          │
│                                                     │
│ 2. PATCH /api/marketplace/listings/activate        │
│    → Make profile visible                          │
│                                                     │
│ 3. GET /api/marketplace/offers/received            │
│    → Check offers from clubs                       │
│                                                     │
│ 4. PATCH /api/marketplace/offers/:id/accept        │
│    → Accept offer                                  │
│────────────────────────────────────────────────────│
│ CLUB SIDE:                                         │
│ 1. GET /api/marketplace/listings?location=Paris    │
│    → Search for scouts                             │
│                                                     │
│ 2. POST /api/marketplace/listings/match            │
│    → Get AI matching scores                        │
│                                                     │
│ 3. POST /api/marketplace/offers                    │
│    → Send offer to scout                           │
│                                                     │
│ 4. GET /api/marketplace/offers/sent                │
│    → Track offer status                            │
│                                                     │
│ 5. POST /api/marketplace/reviews                   │
│    → Leave review after completion                 │
└────────────────────────────────────────────────────┘
```

### 5. Gamification Flow
```
┌────────────────────────────────────────────────────┐
│ 1. GET /api/gamification/profile                   │
│    → Get user level, XP, achievements              │
│                                                     │
│ 2. POST /api/gamification/track-action/GOAL_SCORED │
│    → Track user action                             │
│    → System awards XP                              │
│    → Check for achievement unlock                  │
│    → Update level if needed                        │
│                                                     │
│ 3. GET /api/gamification/daily-challenge           │
│    → View today's challenge                        │
│                                                     │
│ 4. POST /api/gamification/daily-challenge/claim    │
│    → Claim reward                                  │
│                                                     │
│ 5. GET /api/gamification/leaderboard/WEEKLY_OVERALL│
│    → View leaderboard                              │
└────────────────────────────────────────────────────┘
```

---

## RATE LIMITING SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│ ENDPOINT CATEGORY          │ LIMIT          │ WINDOW        │
├────────────────────────────┼────────────────┼───────────────┤
│ General API                │ 100 requests   │ 1 minute      │
│ Auth - Signup              │ 3 requests     │ 1 minute      │
│ Auth - Login               │ 5 requests     │ 1 minute      │
│ AI - Summary/Analysis      │ 10 requests    │ 1 minute      │
│ AutoScout - Generate       │ 10 reports     │ 1 hour        │
│ AutoScout - Bulk           │ 3 operations   │ 1 hour        │
│ AutoScout - Enhance        │ 15 reports     │ 1 hour        │
│ AutoScout - Preview        │ 20 previews    │ 1 hour        │
│ AutoScout - Custom         │ 5 reports      │ 1 hour        │
│ Voice-to-Report - Process  │ 10 requests    │ 1 minute      │
│ Voice-to-Report - Test     │ 5 requests     │ 1 minute      │
│ SmartScout - Suggestions   │ 20 requests    │ 1 hour        │
│ Market Value               │ 20 requests    │ 1 hour        │
│ Performance Predictor      │ 50 requests    │ 1 hour        │
└────────────────────────────┴────────────────┴───────────────┘
```

---

## GUARDS & DECORATORS QUICK REF

### Guards (Apply to routes)
```typescript
@UseGuards(JwtAuthGuard)              // Requires valid JWT
@UseGuards(RolesGuard)                // Requires specific role
@UseGuards(SubscriptionTierGuard)     // Requires min tier
@UseGuards(OwnershipGuard)            // Requires ownership
@UseGuards(AuthThrottlerGuard)        // Auth rate limiting
@UseGuards(AiThrottlerGuard)          // AI rate limiting
@UseGuards(OptionalJwtAuthGuard)      // JWT optional
```

### Decorators (Metadata)
```typescript
@Public()                             // No auth required
@Roles('SCOUT', 'ADMIN')              // Required roles
@MinTier(SubscriptionTier.GOLD)       // Min subscription tier
@CheckOwnership()                     // Validate ownership
@Throttle({ limit: 10, ttl: 60000 }) // Custom rate limit
@ApiBearerAuth()                      // Swagger: requires auth
```

### Common Combinations
```typescript
// Public endpoint (no auth)
@Get()
@Public()
async getPublicData() {}

// Authenticated endpoint (any user)
@Get()
@UseGuards(JwtAuthGuard)
async getPrivateData() {}

// Role-based endpoint
@Post()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SCOUT', 'ADMIN')
async createReport() {}

// Subscription-gated endpoint
@Get()
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
@MinTier(SubscriptionTier.GOLD)
async getAIFeature() {}

// Full protection (auth + role + tier + throttle)
@Post()
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionTierGuard)
@Roles('SCOUT', 'ADMIN')
@MinTier(SubscriptionTier.GOLD)
@Throttle({ limit: 10, ttl: 3600000 })
async generateAIReport() {}
```

---

## KEY ENVIRONMENT VARIABLES

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/arcane

# JWT
JWT_SECRET=your-super-secret-key-change-this
JWT_REFRESH_SECRET=your-refresh-secret-key-change-this
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI (AI Features)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Stripe (Payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_GOLD=price_...
STRIPE_PRICE_ID_ENTERPRISE=price_...

# Supabase (File Storage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbGciOi...
SUPABASE_BUCKET=arcane-media

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=arcane-app
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Sentry (Error Tracking)
SENTRY_DSN=https://xxx@sentry.io/xxx

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=100

# Environment
NODE_ENV=production
PORT=3000
```

---

## TESTING QUICK COMMANDS

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run e2e tests
npm run test:e2e

# Run tests with coverage
npm run test:cov

# Test specific module
npm test -- players.service

# Watch mode
npm run test:watch
```

---

## DATABASE QUICK COMMANDS

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Create migration
npx prisma migrate dev --name add-new-feature

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database with demo data
npm run seed

# Open Prisma Studio (GUI)
npx prisma studio

# Format schema
npx prisma format
```

---

## COMMON TROUBLESHOOTING

### 403 Forbidden Errors
```
Cause: User lacks required subscription tier or role
Solution: Check user subscription and roles
Logs: GET /api/analytics/rbac-metrics
```

### 429 Too Many Requests
```
Cause: Rate limit exceeded
Solution: Wait for rate limit window to reset
AI endpoints: Check /api/auto-scout/analytics for usage
```

### AI Features Not Working
```
Cause: Missing OPENAI_API_KEY
Solution: Set environment variable
Check: GET /api/market-value/health
```

### Database Connection Issues
```
Cause: Invalid DATABASE_URL or database down
Solution: Check DATABASE_URL format
Test: GET /api/health/database
```

### Stripe Webhook Failures
```
Cause: Invalid STRIPE_WEBHOOK_SECRET
Solution: Get webhook secret from Stripe dashboard
Test: POST /api/payments/webhook (with test event)
```

---

## USEFUL CURL COMMANDS

```bash
# Health check
curl http://localhost:3000/health

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Get players (public)
curl http://localhost:3000/api/players

# Get player details (authenticated)
curl http://localhost:3000/api/players/clxxx \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Generate AI report (GOLD tier required)
curl -X POST http://localhost:3000/api/auto-scout/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"playerId":"clxxx","matchId":"clyyy","reportType":"MATCH_PERFORMANCE"}'

# Get AI report history
curl http://localhost:3000/api/auto-scout/history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get subscription pricing
curl http://localhost:3000/api/subscriptions/pricing

# Get my subscription
curl http://localhost:3000/api/subscriptions/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get gamification profile
curl http://localhost:3000/api/gamification/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get analytics (ADMIN only)
curl http://localhost:3000/api/analytics/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## KEY CONTACTS & LINKS

- **API Documentation**: `http://localhost:3000/api`
- **Database GUI**: `npx prisma studio`
- **Sentry**: `https://sentry.io/organizations/arcane/projects/backend/`
- **Stripe Dashboard**: `https://dashboard.stripe.com`
- **Supabase Dashboard**: `https://app.supabase.com`
- **Firebase Console**: `https://console.firebase.google.com`

---

**Last Updated**: 2025-11-16
**Version**: 2.0.0
**Maintainer**: Arcane Platform Team
