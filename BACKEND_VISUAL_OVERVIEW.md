# BACKEND VISUAL OVERVIEW - ARCANE

**Architecture diagrams and visual reference**
**Generated**: 2025-11-16

---

## SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ARCANE BACKEND ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  Web App (Next.js)  │  Mobile App (React Native)  │  External APIs      │
└──────────┬──────────┴────────────┬─────────────────┴──────────┬─────────┘
           │                       │                             │
           │ HTTPS/REST            │ HTTPS/REST                  │ HTTPS
           │ WebSocket             │ WebSocket                   │
           ▼                       ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                        NestJS Application                                │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐                    │
│  │   Guards    │  │  Throttler   │  │    CORS     │                    │
│  │  - JWT      │  │ - Rate Limit │  │ - Origins   │                    │
│  │  - RBAC     │  │ - AI Limits  │  │ - Methods   │                    │
│  │  - Tier     │  │              │  │             │                    │
│  └─────────────┘  └──────────────┘  └─────────────┘                    │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │             Swagger/OpenAPI Documentation                │           │
│  │            http://localhost:3000/api                     │           │
│  └─────────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────────────┘
           │                       │                             │
           ▼                       ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MODULE LAYER (38 Modules)                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐     │
│  │   Core Modules   │  │  Scouting Modules│  │   AI Modules     │     │
│  │  - auth          │  │  - scouting-     │  │  - ai            │     │
│  │  - users         │  │    reports       │  │  - auto-scout    │     │
│  │  - subscriptions │  │  - kanban        │  │  - voice-to-     │     │
│  │  - health        │  │  - search        │  │    report        │     │
│  │  - prisma        │  │  - club-requests │  │  - smart-scout   │     │
│  └──────────────────┘  └──────────────────┘  │  - market-value  │     │
│                                               │  - performance-  │     │
│  ┌──────────────────┐  ┌──────────────────┐  │    predictor     │     │
│  │  Player/Club     │  │   Marketplace    │  │  - playstyle-dna │     │
│  │  - players       │  │  - marketplace   │  │  - arkane-match  │     │
│  │  - clubs         │  │  - coaching      │  └──────────────────┘     │
│  │  - matches       │  │  - camps         │                           │
│  │  - events        │  │  - payments      │  ┌──────────────────┐     │
│  │  - passport      │  └──────────────────┘  │  Engagement      │     │
│  │  - player-       │                        │  - gamification  │     │
│  │    validation    │  ┌──────────────────┐  │  - notifications │     │
│  └──────────────────┘  │   System/Admin   │  │  - onboarding    │     │
│                        │  - analytics     │  └──────────────────┘     │
│                        │  - data-sync     │                           │
│                        │  - media         │                           │
│                        │  - websocket     │                           │
│                        └──────────────────┘                           │
└─────────────────────────────────────────────────────────────────────────┘
           │                       │                             │
           ▼                       ▼                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA/SERVICE LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │ PostgreSQL  │  │   OpenAI    │  │   Stripe    │  │  Supabase   │   │
│  │  + Prisma   │  │  - GPT-4    │  │  - Payments │  │  - Storage  │   │
│  │  - Users    │  │  - Whisper  │  │  - Webhooks │  │  - Media    │   │
│  │  - Players  │  │  - Embeddings│ │             │  │             │   │
│  │  - Reports  │  └─────────────┘  └─────────────┘  └─────────────┘   │
│  │  - 40 Tables│                                                       │
│  └─────────────┘  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│                   │  Firebase   │  │   Sentry    │  │    Redis    │   │
│                   │  - FCM      │  │  - Errors   │  │  - Cache    │   │
│                   │  - Push     │  │  - Monitoring│ │  - Sessions │   │
│                   └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## MODULE DEPENDENCY GRAPH

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       MODULE DEPENDENCIES                                │
└─────────────────────────────────────────────────────────────────────────┘

                           ┌──────────────┐
                           │  AppModule   │
                           └──────┬───────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
   ┌─────────┐             ┌─────────────┐          ┌──────────────┐
   │ Prisma  │◀────────────│    Auth     │◀─────────│ Subscriptions│
   │ Module  │             │   Module    │          │    Module    │
   └────┬────┘             └──────┬──────┘          └──────┬───────┘
        │                         │                        │
        │ Used by all modules     │                        │
        │ for database access     │                        │
        │                         │                        │
        ▼                         ▼                        ▼
   ┌─────────────────────────────────────────────────────────────┐
   │              Business Logic Modules                         │
   │                                                              │
   │  ┌──────────┐  ┌───────────┐  ┌──────────────┐            │
   │  │ Players  │  │   Clubs   │  │   Matches    │            │
   │  └────┬─────┘  └─────┬─────┘  └──────┬───────┘            │
   │       │              │                │                     │
   │       │ ┌────────────▼────────────────▼──────────┐         │
   │       │ │      Scouting Reports                  │         │
   │       │ └────────────┬────────────────────────────┘         │
   │       │              │                                      │
   │       │              ▼                                      │
   │       │    ┌──────────────────┐                            │
   │       │    │   SmartScout     │◀── report_embeddings       │
   │       │    │  (AI Suggestions)│                            │
   │       │    └──────────────────┘                            │
   │       │                                                     │
   │       └─────────────┐                                      │
   │                     ▼                                      │
   │           ┌──────────────────┐                            │
   │           │   AutoScout      │                            │
   │           │  (AI Reports)    │                            │
   │           └──────────────────┘                            │
   │                     │                                      │
   │                     ▼                                      │
   │           ┌──────────────────┐                            │
   │           │   AI Module      │                            │
   │           │  (AI Analysis)   │                            │
   │           └──────────────────┘                            │
   │                                                            │
   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
   │  │ Market Value │  │ Performance  │  │ Voice-to-    │   │
   │  │              │  │  Predictor   │  │   Report     │   │
   │  └──────────────┘  └──────────────┘  └──────────────┘   │
   │                                                            │
   └────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
   ┌────────────────────────────────────────────────────────────┐
   │              External Services                             │
   │                                                             │
   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
   │  │  OpenAI  │  │  Stripe  │  │ Supabase │  │ Firebase │  │
   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
   └────────────────────────────────────────────────────────────┘
```

---

## RBAC FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REQUEST AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────┘

   Client Request
        │
        ├─ Authorization: Bearer <JWT>
        │
        ▼
   ┌─────────────┐
   │   Guards    │
   └──────┬──────┘
          │
          ├──► JwtAuthGuard
          │     ├─ Validate JWT signature
          │     ├─ Check expiration
          │     ├─ Check blacklist (Redis)
          │     └─ Extract user info
          │            │
          │            ├─ user.id
          │            ├─ user.email
          │            ├─ user.role (UserRole enum)
          │            └─ Attach to request
          │
          ├──► RolesGuard
          │     ├─ Check @Roles() decorator
          │     ├─ Compare user.role with required roles
          │     └─ Allow/Deny
          │
          ├──► SubscriptionTierGuard
          │     ├─ Check @MinTier() decorator
          │     ├─ Query subscriptions table
          │     ├─ Get user's current tier
          │     ├─ Compare with required tier
          │     │     ├─ FREE (0) < BASIC (1) < PRO (2) < GOLD (3) < ENTERPRISE (4)
          │     │     └─ If current >= required → Allow
          │     └─ If blocked:
          │           ├─ Log rbac_events (403)
          │           ├─ Track upgrade_modals
          │           └─ Return 403 Forbidden
          │
          └──► ThrottlerGuard
                ├─ Check rate limits
                ├─ Increment counter (Redis)
                └─ Allow/Deny (429 if exceeded)
                      │
                      ▼
                ┌─────────────┐
                │  Controller │
                │   Method    │
                └─────────────┘
```

---

## AI FEATURES DATA FLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   AI REPORT GENERATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

   POST /api/auto-scout/generate
        │
        ├─ Body: { playerId, matchId, reportType }
        │
        ▼
   ┌─────────────────────┐
   │ AutoScoutController │
   └──────────┬──────────┘
              │
              ▼
   ┌─────────────────────┐
   │ AutoScoutService    │
   └──────────┬──────────┘
              │
              ├──► 1. Fetch Player Data
              │     ├─ Query players table
              │     ├─ Get stats, position, age, etc.
              │     └─ player_data
              │
              ├──► 2. Fetch Match Data (if matchId)
              │     ├─ Query matches table
              │     ├─ Get opponent, date, competition
              │     └─ match_data
              │
              ├──► 3. Fetch Historical Reports
              │     ├─ Query scouting_reports table
              │     ├─ Get previous ratings, notes
              │     └─ historical_data
              │
              ├──► 4. Build AI Prompt
              │     ├─ Select template (MATCH_PERFORMANCE, etc.)
              │     ├─ Inject player_data, match_data, historical_data
              │     ├─ Add context (position-specific analysis)
              │     └─ prompt_string
              │
              ├──► 5. Call OpenAI API
              │     ├─ Model: gpt-4-turbo-preview
              │     ├─ Temperature: 0.7 (configurable)
              │     ├─ Max tokens: 4000
              │     └─ response
              │          ├─ tokensUsed
              │          ├─ generationTime
              │          └─ cost ($0.024-$0.032)
              │
              ├──► 6. Parse & Validate Response
              │     ├─ Extract ratings (technical, physical, etc.)
              │     ├─ Extract strengths/weaknesses
              │     ├─ Extract summary
              │     ├─ Validate fields (ensure all present)
              │     └─ structured_report
              │
              ├──► 7. Calculate Quality Score
              │     ├─ Completeness: All fields filled? (30%)
              │     ├─ Data availability: Rich context? (30%)
              │     ├─ Confidence: Coherent analysis? (20%)
              │     ├─ Token efficiency: Not too verbose? (20%)
              │     └─ quality_score (0-100)
              │          └─ grade: A (90+), B (80-89), C (70-79), D (60-69), F (<60)
              │
              ├──► 8. Save to Database
              │     ├─ Insert into auto_generated_reports
              │     │    ├─ playerId, matchId, scoutId
              │     │    ├─ reportData (JSON)
              │     │    ├─ qualityScore, qualityBreakdown
              │     │    ├─ template, model
              │     │    ├─ tokensUsed, generationTime, cost
              │     │    └─ createdAt
              │     └─ report_id
              │
              └──► 9. Return Response
                    └─ { report, qualityScore, costWarning }
```

---

## VOICE-TO-REPORT FLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   VOICE-TO-REPORT PROCESSING FLOW                        │
└─────────────────────────────────────────────────────────────────────────┘

   POST /api/voice-to-report/process
        │
        ├─ Form-data:
        │   ├─ audio: <file> (max 25MB)
        │   ├─ language: "en" | "es" | "fr" | etc.
        │   ├─ matchId: (optional)
        │   ├─ playerId: (optional)
        │   └─ keepAudio: true/false
        │
        ▼
   ┌────────────────────────┐
   │ VoiceToReportController│
   └──────────┬─────────────┘
              │
              ▼
   ┌────────────────────────┐
   │ VoiceToReportService   │
   └──────────┬─────────────┘
              │
              ├──► 1. Upload to Temporary Storage
              │     ├─ Supabase bucket: temp-audio
              │     ├─ Filename: {userId}-{timestamp}.mp3
              │     └─ temp_url
              │
              ├──► 2. Transcribe Audio (OpenAI Whisper)
              │     ├─ API: https://api.openai.com/v1/audio/transcriptions
              │     ├─ Model: whisper-1
              │     ├─ Language: user-specified
              │     ├─ Cost: ~$0.006 per minute
              │     └─ transcription_text
              │
              ├──► 3. Extract Structured Data (GPT-4)
              │     ├─ Prompt: "Extract scouting report from transcription..."
              │     ├─ Model: gpt-4-turbo-preview
              │     ├─ Input: transcription_text
              │     └─ extracted_data
              │          ├─ playerName
              │          ├─ jerseyNumber
              │          ├─ position
              │          ├─ overallRating
              │          ├─ technicalRating
              │          ├─ physicalRating
              │          ├─ mentalRating
              │          ├─ tacticalRating
              │          ├─ strengths
              │          ├─ weaknesses
              │          ├─ summary
              │          ├─ recommendation
              │          └─ tags
              │
              ├──► 4. Validate Data
              │     ├─ Check missing critical fields
              │     ├─ Validate ratings (0-100)
              │     ├─ Validate enums (position, recommendation)
              │     └─ validation_result
              │          ├─ isValid: true/false
              │          └─ warnings: []
              │
              ├──► 5. Calculate Confidence
              │     ├─ Field completeness (40%)
              │     ├─ Rating consistency (30%)
              │     ├─ Text quality (20%)
              │     ├─ Transcription confidence (10%)
              │     └─ confidence_score (0-100%)
              │
              ├──► 6. Generate Suggestions
              │     ├─ If missing fields: suggest recording again
              │     ├─ If low confidence: suggest manual review
              │     ├─ If incomplete: suggest specific additions
              │     └─ suggestions: []
              │
              ├──► 7. Cleanup
              │     ├─ If keepAudio == false:
              │     │    └─ Delete from Supabase
              │     └─ If keepAudio == true:
              │          ├─ Move to permanent storage
              │          └─ Link to media table
              │
              └──► 8. Return Response
                    └─ {
                         transcription,
                         extractedData,
                         confidence,
                         suggestions,
                         warnings,
                         processingTime
                       }
```

---

## GAMIFICATION SYSTEM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GAMIFICATION ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────┘

   User Action (e.g., Create Report)
        │
        ▼
   ┌─────────────────────┐
   │ GamificationService │
   └──────────┬──────────┘
              │
              ├──► 1. Track Action
              │     ├─ POST /gamification/track-action/REPORT_CREATED
              │     └─ Update user_stats
              │          ├─ reportsCreated++
              │          └─ totalPoints += 10
              │
              ├──► 2. Award XP
              │     ├─ Calculate XP: action_points + bonus
              │     ├─ Update user_stats.currentLevelPoints
              │     └─ Check level up
              │          ├─ If currentLevelPoints >= nextLevelPoints:
              │          │    ├─ currentLevel++
              │          │    ├─ currentLevelPoints = overflow
              │          │    ├─ nextLevelPoints = calculateNext(level)
              │          │    └─ Trigger level_up_notification
              │          └─ Else: Continue
              │
              ├──► 3. Check Achievements
              │     ├─ Query achievements WHERE category = related
              │     ├─ For each achievement:
              │     │    ├─ Check condition (JSON)
              │     │    │    ├─ Type: COUNT (e.g., 10 reports)
              │     │    │    ├─ Type: STREAK (e.g., 7 day login)
              │     │    │    ├─ Type: MILESTONE (e.g., reach level 10)
              │     │    │    └─ Type: SOCIAL (e.g., share 5 times)
              │     │    └─ If condition met:
              │     │         ├─ Update user_achievements
              │     │         │    ├─ isCompleted = true
              │     │         │    ├─ unlockedAt = now()
              │     │         │    └─ progress = 100%
              │     │         ├─ Award points (achievements.points)
              │     │         ├─ Award badge (if rewardBadge exists)
              │     │         └─ Trigger unlock_notification
              │     └─ achievements_unlocked: []
              │
              ├──► 4. Award Badges
              │     ├─ If achievement has rewardBadge:
              │     │    ├─ Update user_stats.badgesCount++
              │     │    └─ badgeType: BRONZE | SILVER | GOLD | PLATINUM | DIAMOND
              │     └─ badges_earned: []
              │
              ├──► 5. Update Leaderboard
              │     ├─ Calculate rank in category
              │     ├─ Insert/Update leaderboards
              │     │    ├─ category: WEEKLY_OVERALL | MONTHLY_SCOUT | etc.
              │     │    ├─ score: totalPoints or category-specific
              │     │    ├─ rank: position
              │     │    └─ previousRank: for trending
              │     └─ leaderboard_position
              │
              ├──► 6. Check Daily Challenge
              │     ├─ Query daily_challenges WHERE date = today
              │     ├─ Get user_daily_challenges
              │     ├─ If action matches challenge:
              │     │    ├─ Update progress++
              │     │    └─ If progress >= targetValue:
              │     │         ├─ isCompleted = true
              │     │         ├─ completedAt = now()
              │     │         └─ Trigger challenge_complete_notification
              │     └─ challenge_progress
              │
              └──► 7. Update Streaks
                    ├─ Check lastLoginDate
                    ├─ If today - lastLoginDate == 1 day:
                    │    └─ loginStreak++
                    ├─ Else if today - lastLoginDate > 1 day:
                    │    └─ loginStreak = 1
                    ├─ lastLoginDate = today
                    └─ streak_updated


   User Views Profile
        │
        ▼
   GET /api/gamification/profile
        │
        └──► Response:
             {
               level: 12,
               currentPoints: 1250,
               pointsToNextLevel: 250,
               totalAchievements: 8,
               totalBadges: 3,
               rank: 45,
               streak: 7,
               recentAchievements: [...],
               pinnedBadges: [...]
             }
```

---

## MARKETPLACE FLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   SCOUT MARKETPLACE FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ SCOUT SIDE                                                             │
└────────────────────────────────────────────────────────────────────────┘

   1. Create Listing
      │
      POST /api/marketplace/listings
      │
      ├─ Body: {
      │    headline: "Professional Scout - La Liga Expert",
      │    bio: "10 years experience...",
      │    expertise: { leagues: ["La Liga", "Premier League"], positions: ["ST", "CAM"] },
      │    languages: ["en", "es"],
      │    hourlyRate: 50,
      │    matchRate: 200,
      │    reportRate: 100,
      │    availability: { monday: ["09:00-17:00"], ... }
      │  }
      │
      └──► Insert into scout_listings (status: DRAFT)

   2. Activate Listing
      │
      PATCH /api/marketplace/listings/activate
      │
      └──► Update scout_listings (status: ACTIVE)

   3. Receive Offers
      │
      GET /api/marketplace/offers/received
      │
      └──► Query marketplace_offers WHERE scoutListingId = myListing
           └──► Returns: [{ clubName, offerType, budget, status, ... }]

   4. Accept Offer
      │
      PATCH /api/marketplace/offers/:id/accept
      │
      └──► Update marketplace_offers (status: ACCEPTED, acceptedAt)
           └──► Notify club

   5. Complete Work & Get Review
      │
      PATCH /api/marketplace/offers/:id/complete
      │
      └──► Update marketplace_offers (status: COMPLETED, completedAt)
           └──► Club can now leave review


┌────────────────────────────────────────────────────────────────────────┐
│ CLUB SIDE                                                              │
└────────────────────────────────────────────────────────────────────────┘

   1. Search Scouts
      │
      GET /api/marketplace/listings?leagues=La Liga&maxBudget=100
      │
      └──► Query scout_listings WHERE status = ACTIVE
           └──► Returns: [{ id, headline, bio, hourlyRate, ... }]

   2. Get AI Matching Scores
      │
      POST /api/marketplace/listings/match
      │
      ├─ Body: {
      │    requirements: {
      │      leagues: ["La Liga"],
      │      positions: ["ST"],
      │      maxBudget: 100,
      │      languages: ["es"]
      │    }
      │  }
      │
      └──► For each listing:
           ├─ Calculate compatibility score (0-100)
           │    ├─ League match: 30%
           │    ├─ Position match: 25%
           │    ├─ Budget fit: 20%
           │    ├─ Language match: 15%
           │    └─ Availability: 10%
           └──► Returns: [{ listingId, matchingScore, reasons: [...] }]
                                         ▲
                                         │ Sorted by score

   3. Send Offer
      │
      POST /api/marketplace/offers
      │
      ├─ Body: {
      │    scoutListingId: "clxxx",
      │    offerType: "MATCH_ASSIGNMENT",
      │    title: "Scout Real Madrid vs Barcelona",
      │    description: "Need detailed report on striker...",
      │    budget: 200,
      │    startDate: "2025-11-20",
      │    requirements: { players: ["Player X"], focus: ["Attacking"] }
      │  }
      │
      └──► Insert into marketplace_offers (status: PENDING, sentAt)
           └──► Notify scout

   4. Track Offers
      │
      GET /api/marketplace/offers/sent
      │
      └──► Query marketplace_offers WHERE clubId = myClub
           └──► Returns: [{ scoutName, status, respondedAt, ... }]

   5. Leave Review
      │
      POST /api/marketplace/reviews
      │
      ├─ Body: {
      │    offerId: "clxxx",
      │    rating: 5,
      │    comment: "Excellent report, very detailed...",
      │    tags: ["Professional", "Punctual", "Detailed"]
      │  }
      │
      └──► Insert into marketplace_reviews
           └──► Update scout_listings.stats (average rating, review count)
```

---

## SUBSCRIPTION UPGRADE FLOW

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION UPGRADE FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

   User tries to access GOLD feature (e.g., AutoScout)
        │
        ├─ Current tier: FREE
        │
        ▼
   ┌────────────────────────┐
   │ SubscriptionTierGuard  │
   └──────────┬─────────────┘
              │
              ├──► Query subscriptions table
              │     └──► tier: FREE, status: ACTIVE
              │
              ├──► Compare: FREE (0) < GOLD (3)
              │     └──► Access denied
              │
              ├──► Log RBAC Event
              │     ├─ Insert into rbac_events
              │     │    ├─ eventType: FEATURE_BLOCKED
              │     │    ├─ feature: "AutoScout"
              │     │    ├─ currentTier: "FREE"
              │     │    ├─ requiredTier: "GOLD"
              │     │    ├─ endpoint: "/api/auto-scout/generate"
              │     │    └─ timestamp: now()
              │     └─ Event logged
              │
              ├──► Track Upgrade Modal
              │     ├─ Insert into upgrade_modals
              │     │    ├─ feature: "AutoScout"
              │     │    ├─ trigger: "403_error"
              │     │    └─ shownAt: now()
              │     └─ Modal tracked
              │
              └──► Return 403 Forbidden
                    └──► {
                          error: "Forbidden",
                          message: "This feature requires at least GOLD subscription tier",
                          currentTier: "FREE",
                          requiredTier: "GOLD",
                          upgradeUrl: "/pricing"
                        }

   Frontend shows upgrade modal
        │
        ├─ User clicks "Upgrade Now"
        │
        ▼
   ┌────────────────────────┐
   │ Update upgrade_modals  │
   │  ctaClickedAt = now()  │
   └──────────┬─────────────┘
              │
              ├─ Redirect to /pricing
              │
              ▼
   GET /api/subscriptions/pricing
        │
        └──► Returns pricing plans
             [
               { tier: "BASIC", priceMonthly: 19.99, features: [...] },
               { tier: "PRO", priceMonthly: 39.99, features: [...] },
               { tier: "GOLD", priceMonthly: 49.99, features: [...], isPopular: true },
               { tier: "ENTERPRISE", priceMonthly: 99.99, features: [...] }
             ]

   User selects GOLD plan
        │
        ▼
   POST /api/payments/create-checkout-session
        │
        ├─ Body: { tier: "GOLD", billingCycle: "monthly" }
        │
        └──► Create Stripe checkout session
             ├─ priceId: STRIPE_PRICE_ID_GOLD
             ├─ successUrl: /dashboard?payment=success
             ├─ cancelUrl: /pricing?payment=cancelled
             └──► Returns: { checkoutUrl }

   Redirect to Stripe Checkout
        │
        ├─ User completes payment
        │
        ▼
   Stripe Webhook
        │
        POST /api/payments/webhook
        │
        ├─ Event: checkout.session.completed
        │
        └──► Update subscriptions
             ├─ tier: GOLD
             ├─ status: ACTIVE
             ├─ stripeCustomerId
             ├─ stripeSubscriptionId
             ├─ startDate: now()
             └─ endDate: now() + 30 days

   Log Conversion
        │
        INSERT INTO subscription_conversions
        │
        ├─ userId
        ├─ fromTier: "FREE"
        ├─ toTier: "GOLD"
        ├─ source: "403_error" or "upgrade_modal"
        ├─ feature: "AutoScout"
        ├─ revenue: 49.99
        └─ convertedAt: now()

   User can now access AutoScout
        │
        POST /api/auto-scout/generate
        │
        └──► SubscriptionTierGuard
             ├─ tier: GOLD (3) >= GOLD (3) ✅
             └──► Access granted
```

---

## DATABASE SCHEMA RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────────────────────┐
│                   KEY DATABASE RELATIONSHIPS                             │
└─────────────────────────────────────────────────────────────────────────┘

users (1) ──────────────────── (1) players
  │                                  │
  │                                  ├── (n) scouting_reports
  │                                  ├── (n) auto_generated_reports
  │                                  ├── (n) player_valuations
  │                                  ├── (n) performance_predictions
  │                                  ├── (1) player_passports
  │                                  └── (n) camp_participations
  │
  ├── (1) subscriptions
  ├── (1) user_stats
  ├── (1) user_onboarding
  ├── (n) user_achievements
  ├── (n) scouting_reports (as scout)
  ├── (n) notifications
  ├── (n) events (as creator)
  └── (n) event_assignments

clubs (1) ────────────────────── (n) players
  │
  ├── (n) matches (as homeClub)
  ├── (n) matches (as awayClub)
  ├── (n) camps
  ├── (n) club_requests
  ├── (n) marketplace_offers (as sender)
  ├── (n) marketplace_reviews (as reviewer)
  └── (n) scout_favorites

matches (1) ──────────────────── (n) scouting_reports
  │
  ├── (n) auto_generated_reports
  ├── (n) performance_predictions
  ├── (n) match_assignments
  └── (n) events

scouting_reports (1) ─────────── (1) report_embeddings
  │                                    (for AI similarity search)
  ├── (n) scouting_notes
  └── (n) media

achievements (1) ────────────────(n) user_achievements

daily_challenges (1) ────────────(n) user_daily_challenges

scout_listings (1) ──────────────(n) marketplace_offers
  │
  ├── (n) marketplace_reviews
  └── (n) scout_favorites

coaches (1) ─────────────────────(n) coaching_bookings

camps (1) ───────────────────────(n) camp_participations

kanban_boards (1) ───────────────(n) kanban_columns (1) ─── (n) kanban_cards
                                                                    │
                                                                    └── (n) kanban_card_activities
```

---

**Last Updated**: 2025-11-16
**Backend Version**: 2.0.0
**Total Diagrams**: 10
