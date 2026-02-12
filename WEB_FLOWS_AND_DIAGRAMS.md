# WEB FLOWS & ARCHITECTURE DIAGRAMS

> Diagrammes et flows détaillés de l'architecture web Arcane
> Complément du WEB_ARCHITECTURE_MAP.md

---

## 📊 COMPONENT HIERARCHY

```
/app/layout.tsx (Root)
├── ClientProviders
│   ├── AuthProvider
│   ├── FavoritesProvider
│   ├── ComparisonProvider
│   ├── LanguageProvider
│   └── UpgradeModalProvider
├── Navbar (persistent across pages)
│   ├── GlobalSearch
│   ├── NotificationCenter
│   └── ProfileDropdown
└── {children} (page content)
    ├── Dashboard pages (with AppSidebar on lg+)
    ├── Feature pages
    └── Public pages
```

---

## 🔄 USER AUTHENTICATION FLOW

```
Landing Page (/)
    │
    ├─[NOT AUTHENTICATED]─┐
    │                      │
    ├─> /login             ├─> /signup
    │      │               │      │
    │      └─> API POST /api/auth/login    └─> API POST /api/auth/signup
    │             │                                │
    │             └─> localStorage.setItem('arcane_auth_token')
    │                  localStorage.setItem('arcane_user')
    │                         │
    │                         v
    └─[AUTHENTICATED]─────> /dashboard
                              │
                              ├─> Role-based content
                              │   ├─> SCOUT: Reports, Players, Matches
                              │   ├─> CLUB: Marketplace, ArkaneMatch, Calendar
                              │   ├─> PLAYER: Profile, Passport, Camps
                              │   └─> ADMIN: Admin Dashboard, Analytics
                              │
                              └─> Subscription tier check
                                  ├─> FREE: Basic features
                                  ├─> BASIC: + Advanced search
                                  ├─> PRO: + AI features
                                  └─> ENTERPRISE: All features
```

---

## 📝 SCOUTING REPORT CREATION FLOW

```
Player Detail (/players/[id])
    │
    ├─> "Create Report" button
    │      │
    │      v
    ├─> Create Report Modal
    │      │
    │      ├─[Manual]─> /reports (create new)
    │      │              │
    │      │              ├─> Fill form manually
    │      │              ├─> API POST /api/scouting-reports
    │      │              └─> Navigate to /reports/[id]
    │      │
    │      ├─[Auto Scout]─> /auto-scout
    │      │                  │
    │      │                  ├─> Select template
    │      │                  ├─> Configure generation options
    │      │                  ├─> API POST /api/auto-scout/generate
    │      │                  ├─> Show generation progress
    │      │                  ├─> Preview generated report
    │      │                  └─> Option to save or regenerate
    │      │
    │      ├─[Voice]─────> /reports/voice
    │      │                  │
    │      │                  ├─> Record voice description
    │      │                  ├─> API POST /api/voice-to-report/process
    │      │                  ├─> Show transcription
    │      │                  ├─> Display extracted data
    │      │                  └─> Create report from data
    │      │
    │      └─[Smart Scout]─> /smart-scout
    │                         │
    │                         ├─> Start typing in fields
    │                         ├─> API POST /api/smart-scout/autocomplete
    │                         ├─> Show AI suggestions
    │                         ├─> API GET /api/smart-scout/insights/:playerId
    │                         └─> Complete with AI assistance
    │
    └─> Report submitted
           │
           ├─> API POST /api/scouting-reports/:id/submit
           ├─> Status: DRAFT → SUBMITTED
           └─> Notification sent to reviewers
```

---

## 🤖 AI FEATURES INTERACTION MAP

```
AI Hub (/ai)
    │
    ├─> ArkaneGPT (/ai/arkane-gpt)
    │      │
    │      ├─> Chat interface
    │      ├─> API POST /api/ai/summary
    │      └─> Conversational AI responses
    │
    ├─> ArkaneIndex (/ai/arkane-index)
    │      │
    │      ├─> Select player
    │      ├─> API GET /api/ai/index/:playerId
    │      └─> Display AI scoring
    │
    ├─> AutoScout (/auto-scout)
    │      │
    │      ├─> Generate report
    │      ├─> API POST /api/auto-scout/generate
    │      ├─> Enhance existing report
    │      └─> API POST /api/auto-scout/enhance/:reportId
    │
    ├─> Market Value AI (/market-value)
    │      │
    │      ├─> Select player
    │      ├─> API GET /api/market-value/player/:playerId
    │      ├─> Show valuation + trend
    │      ├─> Compare players
    │      └─> API POST /api/market-value/compare
    │
    ├─> Performance Predictor (/performance-predictor)
    │      │
    │      ├─> Select player + match
    │      ├─> API POST /api/performance-predictor/predict/:playerId/:matchId
    │      ├─> Show prediction
    │      ├─> Display confidence
    │      └─> Show key factors
    │
    ├─> PlayStyle DNA (/playstyle-dna)
    │      │
    │      ├─> Select player
    │      ├─> API GET /api/playstyle-dna/:playerId (via custom service)
    │      ├─> Display DNA radar
    │      ├─> Show similar players
    │      └─> Style recommendations
    │
    └─> SmartScout (/smart-scout)
           │
           ├─> Real-time suggestions during report creation
           ├─> API POST /api/smart-scout/suggestions
           └─> API POST /api/smart-scout/autocomplete
```

---

## 🛒 MARKETPLACE & MATCHING FLOW

```
Marketplace (/marketplace)
    │
    ├─> Browse scout listings
    │      │
    │      ├─> API GET /api/marketplace/listings
    │      ├─> Apply filters (leagues, positions, budget, etc.)
    │      └─> View results
    │
    ├─> Scout Profile (/marketplace/scouts/[id])
    │      │
    │      ├─> API GET /api/marketplace/listings/:id
    │      ├─> View profile, stats, expertise
    │      ├─> API GET /api/marketplace/reviews/listing/:listingId
    │      ├─> Read reviews
    │      └─> Add to favorites
    │             ├─> API POST /api/marketplace/favorites
    │             └─> Navigate to /favorites
    │
    └─> ArkaneMatch (/arkane-match)
           │
           ├─> "I need a scout for Premier League striker, budget €500/report"
           ├─> API POST /api/arkane-match/chat
           │      │
           │      └─> AI extracts criteria:
           │          - leagues: ["Premier League"]
           │          - positions: ["Striker"]
           │          - maxBudget: 500
           │          - verifiedOnly: true (inferred)
           │
           ├─> Display matched scouts
           ├─> Refine search with follow-up questions
           ├─> Save conversation
           │      └─> API GET /api/arkane-match/conversations/:id
           │
           └─> Click scout → /marketplace/scouts/[id]
```

---

## 📅 CALENDAR & EVENT MANAGEMENT FLOW

```
Calendar (/calendar)
    │
    ├─> Month view with events
    │      │
    │      ├─> API GET /api/events
    │      └─> Display matches, training, camps
    │
    ├─> Create Event
    │      │
    │      ├─> "Create Match" modal
    │      ├─> Fill form (home/away clubs, date, venue)
    │      ├─> API POST /api/matches
    │      ├─> Auto-create event
    │      └─> API POST /api/events
    │
    ├─> Assign Scout to Match
    │      │
    │      ├─> Select match
    │      ├─> "Assign Scout" modal
    │      ├─> API PATCH /api/matches/:matchId/assign-scout
    │      └─> Send notification
    │             └─> API POST /api/notifications/match/:matchId/reminder
    │
    ├─> Event Detail (/calendar/[id])
    │      │
    │      ├─> API GET /api/events/:id
    │      ├─> Show event details
    │      ├─> Edit event
    │      │      └─> API PATCH /api/events/:id
    │      └─> Delete event
    │             └─> API DELETE /api/events/:id
    │
    └─> Upcoming Events (widget on dashboard)
           │
           └─> API GET /api/events/upcoming?limit=5
```

---

## 🎮 GAMIFICATION FLOW

```
User performs action (e.g., create report, validate player)
    │
    ├─> API POST /api/gamification/track-action/:action
    │      │
    │      └─> Backend calculates:
    │          ├─> Points earned
    │          ├─> Check for level up
    │          ├─> Check for new achievements
    │          └─> Update streak
    │
    ├─> Response includes:
    │      ├─> pointsEarned: 50
    │      ├─> newAchievements: ["first_report"]
    │      └─> levelUp: true (if applicable)
    │
    ├─> Show toast notification
    │      "🎉 +50 XP! Achievement unlocked: First Report"
    │
    └─> Update UI
           ├─> Navbar XP bar animates
           ├─> Achievement modal (if new)
           └─> Update profile stats
```

**Gamification Pages:**
```
/achievements
    ├─> Overview stats (level, XP, badges)
    ├─> API GET /api/gamification/profile
    └─> Tabs:
        ├─> Achievements (/achievements)
        │      └─> API GET /api/gamification/achievements
        ├─> Badges (/achievements/badges)
        │      └─> API GET /api/gamification/badges
        └─> Leaderboards (/achievements/leaderboards)
               └─> API GET /api/gamification/leaderboard/:category
```

---

## 📱 NOTIFICATION FLOW (FCM)

```
User logs in
    │
    ├─> Request FCM permission
    │      │
    │      └─> navigator.serviceWorker.register('/firebase-messaging-sw.js')
    │
    ├─> Get FCM token
    │      │
    │      └─> firebase.messaging().getToken()
    │
    ├─> Register device with backend
    │      │
    │      └─> API POST /api/notifications/register-device
    │             { fcmToken: "...", userId: "..." }
    │
    └─> Listen for messages
           │
           ├─> onMessage (foreground)
           │      └─> Display in-app notification
           │
           └─> onBackgroundMessage (background)
                  └─> Show system notification
```

**Sending Notifications:**
```
Backend event (e.g., report submitted)
    │
    ├─> API POST /api/notifications/send
    │      {
    │        userId: "...",
    │        title: "New Report Submitted",
    │        body: "John Doe submitted a report for Player X",
    │        type: "REPORT_SUBMITTED",
    │        data: { reportId: "..." }
    │      }
    │
    ├─> Firebase sends push notification
    │
    └─> User clicks notification
           │
           └─> Navigate to /reports/[reportId]
```

---

## 🎫 PASSPORT (QR) FLOW

```
Player Profile (/players/[playerId])
    │
    ├─> "Generate Passport" button
    │      │
    │      └─> API POST /api/passport
    │             { playerId: "..." }
    │
    ├─> Backend generates:
    │      ├─> Unique token (UUID)
    │      ├─> QR code (base64 image)
    │      └─> Public URL: /passport/[token]
    │
    ├─> Show QR code modal
    │      ├─> Display QR code
    │      ├─> Copy link button
    │      └─> Download QR code
    │
    └─> Anyone scans QR code
           │
           ├─> Opens /passport/[token]
           │      │
           │      └─> API GET /api/passport/token/:token
           │
           └─> Display public player profile
                  ├─> Basic info
                  ├─> Stats
                  ├─> PlayStyle DNA
                  └─> Verification status
```

---

## 💳 SUBSCRIPTION & UPGRADE FLOW

```
User accesses premium feature (e.g., /auto-scout)
    │
    ├─> Check subscription tier
    │      │
    │      ├─> API GET /api/subscriptions/me
    │      │
    │      └─> If tier insufficient:
    │             │
    │             ├─> Show "Upgrade Modal"
    │             │      ├─> Display current tier
    │             │      ├─> Show feature requirements
    │             │      └─> Compare plans
    │             │
    │             └─> User clicks "Upgrade"
    │                    │
    │                    └─> Navigate to /pricing
    │
    └─[PREMIUM TIER]─> Access granted
           │
           ├─> Use feature normally
           └─> API calls work without 403
```

**Subscription Management:**
```
/pricing
    │
    ├─> Display plans
    │      ├─> FREE (current)
    │      ├─> BASIC (€9/month)
    │      ├─> PRO (€29/month) ← recommended
    │      └─> ENTERPRISE (€99/month)
    │
    ├─> User selects PRO
    │      │
    │      └─> API POST /api/subscriptions
    │             { tier: "PRO", billingPeriod: "MONTHLY" }
    │
    ├─> Redirect to Stripe checkout (future)
    │
    └─> Subscription activated
           │
           ├─> API GET /api/subscriptions/me
           ├─> Update localStorage user data
           └─> Show success message
```

---

## 🔍 SEARCH & FILTER FLOW

```
Global Search (Navbar)
    │
    ├─> User types "Messi"
    │      │
    │      └─> API GET /api/players?search=Messi&limit=5
    │
    ├─> Dropdown shows results
    │      ├─> Players (top 5)
    │      ├─> Clubs
    │      └─> Reports
    │
    └─> User clicks result
           └─> Navigate to detail page

Players Page (/players)
    │
    ├─> Advanced filters
    │      ├─> Position
    │      ├─> Age range
    │      ├─> Nationality
    │      ├─> Current club
    │      └─> Rating range
    │
    ├─> Apply filters
    │      │
    │      └─> API GET /api/players?position=ST&minAge=20&maxAge=25
    │
    └─> Display filtered results
           ├─> Pagination
           └─> Sort options
```

---

## 📊 ANALYTICS DASHBOARD (ADMIN)

```
/admin
    │
    ├─> Overview widgets
    │      │
    │      └─> API GET /api/analytics/overview
    │             {
    │               totalUsers: 1250,
    │               totalPlayers: 3400,
    │               totalReports: 890,
    │               newUsersLast7Days: 45
    │             }
    │
    ├─> Activity trends
    │      │
    │      └─> API GET /api/analytics/activity-trends?days=30
    │
    ├─> Scouting reports stats
    │      │
    │      └─> API GET /api/analytics/scouting-reports
    │             ├─> By status (draft, submitted, approved)
    │             ├─> Rating distribution
    │             └─> Most active scouts
    │
    └─> Player validation queue (/admin/player-validation)
           │
           ├─> API GET /api/players?status=PENDING_VALIDATION
           ├─> Review player data
           └─> Approve/reject
                  └─> API PATCH /api/players/:id
                         { validationStatus: "APPROVED" }
```

---

## 🎯 DATA SYNC (ADMIN)

```
/admin/data-sync
    │
    ├─> Manual sync triggers
    │      ├─> Sync players from external API
    │      ├─> Update match results
    │      └─> Refresh club data
    │
    ├─> API POST /api/data-sync/trigger
    │      { source: "external_api", type: "players" }
    │
    └─> Show sync status
           ├─> Last sync: 2h ago
           ├─> Items synced: 234
           └─> Errors: 0
```

---

## 🗺️ PAGE FLOW DIAGRAM (Simplified)

```
┌──────────────┐
│   Landing    │
│      /       │
└───────┬──────┘
        │
   ┌────┴────┐
   │         │
┌──▼──┐  ┌───▼───┐
│Login│  │Signup │
└──┬──┘  └───┬───┘
   │         │
   └────┬────┘
        │
   ┌────▼────────┐
   │  Dashboard  │
   └─────┬───────┘
         │
    ┌────┼────────────────┬──────────────┬─────────────┐
    │    │                │              │             │
┌───▼─┐ ┌▼──────┐  ┌──────▼────┐  ┌─────▼──┐  ┌───────▼────┐
│Play │ │Reports│  │Marketplace│  │AI Hub  │  │Calendar    │
│ers  │ └───┬───┘  └─────┬─────┘  └────┬───┘  └────┬───────┘
└──┬──┘     │            │             │           │
   │    ┌───┼────────────┼─────────────┼───────────┤
   │    │   │            │             │           │
┌──▼────▼───▼──┐  ┌──────▼──────┐  ┌───▼────┐  ┌──▼──────┐
│Player Detail │  │Scout Profile│  │AutoSc  │  │Event    │
│             │  │            │  │out     │  │Detail   │
└──────┬──────┘  └─────────────┘  └────────┘  └─────────┘
       │
   ┌───┴────┐
   │        │
┌──▼──┐  ┌──▼──────┐
│Pass │  │Compare  │
│port │  │Players  │
└─────┘  └─────────┘
```

---

## 🔐 ROLE-BASED ACCESS MATRIX

| Page/Feature          | PUBLIC | PLAYER | AGENT | CLUB | SCOUT | ADMIN |
|-----------------------|--------|--------|-------|------|-------|-------|
| Landing (/)           | ✅     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Login/Signup          | ✅     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Dashboard             | ❌     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Players List          | ❌     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Player Detail         | ❌     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Create Report         | ❌     | ❌     | ❌    | ❌   | ✅    | ✅    |
| Marketplace           | ❌     | ❌     | ❌    | ✅   | ❌    | ✅    |
| ArkaneMatch           | ❌     | ❌     | ❌    | ✅   | ❌    | ✅    |
| Auto Scout            | ❌     | ❌     | ❌    | ❌   | ✅*   | ✅    |
| Market Value AI       | ❌     | ❌     | ✅*   | ✅*  | ✅*   | ✅    |
| Performance Predictor | ❌     | ❌     | ✅*   | ✅*  | ✅*   | ✅    |
| PlayStyle DNA         | ❌     | ✅*    | ✅*   | ✅*  | ✅*   | ✅    |
| Passport (view)       | ✅     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Passport (create)     | ❌     | ✅     | ✅    | ❌   | ✅    | ✅    |
| Calendar              | ❌     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Camps                 | ✅     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Camp Registration     | ❌     | ✅     | ❌    | ❌   | ❌    | ✅    |
| Coaching              | ❌     | ✅*    | ✅*   | ✅*  | ✅*   | ✅    |
| Achievements          | ❌     | ✅     | ✅    | ✅   | ✅    | ✅    |
| Admin Dashboard       | ❌     | ❌     | ❌    | ❌   | ❌    | ✅    |
| Analytics             | ❌     | ❌     | ❌    | ❌   | ✅    | ✅    |

**Legend:**
- ✅ = Full access
- ✅* = Access with subscription tier requirement
- ❌ = No access

---

## 📦 DATA MODELS (Simplified)

```typescript
User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: PLAYER | AGENT | CLUB_CONTACT | SCOUT | ADMIN
  subscription?: Subscription
  stats?: UserStats
  badges?: Badge[]
  achievements?: Achievement[]
}

Player {
  id: string
  fullName: string
  dateOfBirth: Date
  nationality: string
  position: string
  currentClub?: Club
  stats?: PlayerStats
  passport?: Passport
  playstyleDna?: PlaystyleDNA
}

ScoutingReport {
  id: string
  playerId: string
  scoutId: string
  matchId?: string
  status: DRAFT | SUBMITTED | APPROVED | REJECTED
  overallRating: number
  ratings: {
    technical: number
    physical: number
    mental: number
    tactical: number
  }
  summary: string
  strengths: string
  weaknesses: string
  recommendation: SIGN | MONITOR | PASS
}

Match {
  id: string
  homeClubId: string
  awayClubId: string
  scheduledAt: Date
  status: SCHEDULED | LIVE | COMPLETED | CANCELLED
  scoutId?: string
  scores?: { home: number, away: number }
}

Subscription {
  id: string
  userId: string
  tier: FREE | BASIC | PRO | ENTERPRISE
  status: ACTIVE | CANCELLED | EXPIRED
  billingPeriod: MONTHLY | YEARLY
}

Passport {
  id: string
  playerId: string
  token: string (UUID)
  qrCodeUrl: string
  verified: boolean
  publicUrl: string (/passport/[token])
}
```

---

## 🌐 API CALL PATTERNS

### **Standard GET Request:**
```typescript
const players = await apiClient.getPlayers({ 
  page: 1, 
  limit: 20, 
  search: "Messi" 
});
// → GET /api/players?page=1&limit=20&search=Messi
```

### **Authenticated POST Request:**
```typescript
const report = await apiClient.createScoutingReport({
  matchId: "match-123",
  playerId: "player-456",
  overallRating: 8.5,
  summary: "Excellent performance..."
});
// → POST /api/scouting-reports
// Headers: { Authorization: "Bearer <token>" }
```

### **Error Handling:**
```typescript
try {
  await apiClient.generateAutoScoutReport({ playerId: "player-123" });
} catch (error) {
  if (error.status === 403) {
    // Subscription tier insufficient
    // → UpgradeModal automatically shown via api-interceptor
  } else if (error.status === 401) {
    // Unauthorized → redirect to /login
  }
}
```

---

## 🎨 THEMING & STYLING

### **Color Palette (Tailwind Config):**
```javascript
arcane: {
  dark: '#0A0E27',           // Main background
  darkBorder: '#1a1f3a',     // Borders
  accent: '#FFD700',         // Gold accent
  grey: '#8B92AB',           // Text grey
}
```

### **Component Styling Pattern:**
```tsx
// Arcane Design System pattern
<ArcaneCard variant="glass" glow>
  <CardHeader>
    <Heading level={2} gradient>Player Stats</Heading>
  </CardHeader>
  <CardContent>
    <Text variant="body">Content here</Text>
  </CardContent>
</ArcaneCard>
```

---

## 🚀 PERFORMANCE OPTIMIZATIONS

1. **Dynamic Imports:**
   ```typescript
   const AutoScoutPage = dynamic(() => import('./auto-scout/page'));
   ```

2. **Image Optimization:**
   ```tsx
   <Image src={player.avatar} alt="Player" width={100} height={100} />
   ```

3. **API Response Caching:**
   - React Query / SWR (future implementation)
   - localStorage caching for static data

4. **Code Splitting:**
   - Route-based splitting (Next.js automatic)
   - Component-based splitting (dynamic imports)

5. **Analytics Batching:**
   - Events batched every 10s
   - Sent to backend in bulk

---

**END OF FLOWS & DIAGRAMS**
