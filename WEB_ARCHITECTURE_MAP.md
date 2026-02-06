# WEB ARCHITECTURE MAP - ARCANE FOOTBALL

> Cartographie complète de l'architecture web Next.js (51 pages)
> Date: 2025-11-16
> Repo: `/Users/lakhdari/Desktop/AppFoot/web`

---

## 📋 TABLE OF CONTENTS

1. [Pages Next.js (Routes)](#pages-nextjs)
2. [Components Architecture](#components-architecture)
3. [Navigation & Routing](#navigation--routing)
4. [API Integration](#api-integration)
5. [Special Features](#special-features)
6. [Contexts & State Management](#contexts--state-management)
7. [Hooks](#hooks)
8. [Services](#services)
9. [Type Definitions](#type-definitions)

---

## 📄 PAGES NEXT.JS

### Public Pages (Non-authentifié)
```
/                           → Landing page (page.tsx)
/about                      → About page
/contact                    → Contact form
/services                   → Services overview
/pricing                    → Pricing plans / Membership tiers
/login                      → Login page
/signup                     → Signup page
/brand-preview              → Brand preview showcase
```

### Core App Pages (Authentifié)
```
/dashboard                  → Main dashboard (role-based)
/profile                    → User profile management
/settings                   → App settings
/favorites                  → Favorite players list
```

### Players & Scouting
```
/players                    → Players list/search
/players/[id]               → Player detail page
/players/compare            → Player comparison tool
/reports                    → Scouting reports list
/reports/[id]               → Report detail
/reports/voice              → Voice-to-report feature
/reports/templates          → Report templates
```

### AI Features (Arkane AI Suite)
```
/ai                         → AI Hub (main AI dashboard)
/ai/arkane-gpt              → ArkaneGPT chat interface
/ai/arkane-index            → Arcane Index (player scoring)
/ai/arkane-scout            → Arkane Scout AI
/auto-scout                 → Auto Scout report generation
/smart-scout                → Smart Scout (AI-assisted scouting)
```

### Advanced AI Tools
```
/market-value               → Market Value AI (ML predictor)
/performance-predictor      → Performance Predictor (ML)
/playstyle-dna              → PlayStyle DNA Analysis (ML)
```

### Marketplace & Matching
```
/marketplace                → Scout marketplace
/marketplace/scouts/[id]    → Scout profile detail
/market                     → Market overview
/arkane-match               → ArkaneMatch AI (scout matching)
```

### Calendar & Events
```
/calendar                   → Calendar view
/calendar/[id]              → Event detail
```

### Camps & Training
```
/camps                      → All camps list
/camps/[id]                 → Camp detail
/my-camps                   → User's camp registrations
```

### Coaching
```
/coaching                   → Coaching hub
/coaching/[id]              → Coach detail
/coaching/my-bookings       → User's coaching bookings
```

### Gamification
```
/achievements               → Achievements overview
/achievements/badges        → Badges showcase
/achievements/leaderboards  → Leaderboards
```

### Admin Pages (ADMIN role)
```
/admin                      → Admin dashboard
/admin/data-sync            → Data sync management
/admin/player-validation    → Player validation queue
```

### Passport
```
/passport/[token]           → Player passport (public QR link)
```

### Analytics
```
/analytics                  → Analytics dashboard (scout/admin)
```

### Clubs
```
/clubs/[id]                 → Club detail page
```

### Scout
```
/scout                      → Scout-specific dashboard
```

---

## 🧩 COMPONENTS ARCHITECTURE

### **1. Layout Components** (`/components/layout/`)
```typescript
Navbar.tsx                  → Main navigation bar (responsive, dropdowns)
MainLayout.tsx              → Main app layout wrapper
app-sidebar.tsx             → Sidebar navigation (desktop)
breadcrumb.tsx              → Breadcrumb navigation
DashboardHeader.tsx         → Dashboard page header
NotificationsPopover.tsx    → Notifications dropdown
```

### **2. UI Primitives** (`/components/ui/`)
**Base Components:**
```
button.tsx                  → Button component
card.tsx                    → Card container
modal.tsx                   → Modal dialog
loader.tsx                  → Loading spinner
skeleton.tsx                → Skeleton loader
hover-card.tsx              → Hover card component
glass-card.tsx              → Glassmorphic card
premium-card.tsx            → Premium tier card
link-button.tsx             → Link styled as button
```

**Animated Components:**
```
animated-counter.tsx        → Animated number counter
animated-badge.tsx          → Animated badge
animated-background.tsx     → Animated background effect
gradient-text.tsx           → Gradient text effect
card-3d.tsx                 → 3D card effect
infinite-marquee.tsx        → Infinite scrolling marquee
floating-particles.tsx      → Floating particle effect
page-transition.tsx         → Page transition animation
```

### **3. Primitives (Design System)** (`/components/primitives/`)
```
Badge/
  ├── Badge.tsx             → Badge component
  └── types.ts
Button/
  ├── ArcaneButton.tsx      → Arcane-styled button
  ├── IconButton.tsx        → Icon-only button
  └── types.ts
Card/
  ├── ArcaneCard.tsx        → Arcane-styled card
  ├── CardHeader.tsx        → Card header section
  ├── CardContent.tsx       → Card content section
  ├── CardFooter.tsx        → Card footer section
  └── types.ts
Input/
  ├── ArcaneInput.tsx       → Arcane-styled input
  └── types.ts
Typography/
  ├── Heading.tsx           → Heading component
  ├── Text.tsx              → Text component
  ├── GradientText.tsx      → Gradient text
  └── types.ts
```

### **4. Composite Components** (`/components/composite/`)
**Forms:**
```
Forms/
  ├── Form/
  │   ├── Form.tsx          → Form wrapper
  │   ├── FormField.tsx     → Form field
  │   └── FormActions.tsx   → Form actions (submit, cancel)
  ├── Radio/
  │   ├── Radio.tsx         → Radio button
  │   └── RadioGroup.tsx    → Radio group
  ├── Switch.tsx            → Toggle switch
  ├── Checkbox.tsx          → Checkbox
  └── FormShowcase.tsx      → Forms showcase/docs
```

**Navigation:**
```
Navigation/
  ├── Tabs.tsx              → Tab navigation
  ├── Breadcrumbs.tsx       → Breadcrumb trail
  ├── Sidebar.tsx           → Sidebar menu
  ├── BottomNav.tsx         → Bottom navigation (mobile)
  └── EXAMPLES.tsx          → Navigation examples
```

**Feedback:**
```
Feedback/
  ├── Modal.tsx             → Modal dialog
  ├── AlertDialog.tsx       → Alert/confirmation dialog
  ├── Popover.tsx           → Popover component
  ├── Tooltip.tsx           → Tooltip
  ├── Toast/
  │   ├── Toast.tsx         → Toast notification
  │   ├── ToastContainer.tsx→ Toast container
  │   ├── useToast.ts       → Toast hook
  │   └── types.ts
  └── SHOWCASE_EXAMPLE.tsx  → Feedback showcase
```

**Data Display:**
```
DataDisplay/
  ├── Table.tsx             → Data table
  ├── DataGrid.tsx          → Data grid
  ├── List.tsx              → List component
  └── SHOWCASE_EXAMPLE.tsx  → Data display examples
```

**Progress:**
```
Progress/
  ├── ProgressBar.tsx       → Linear progress bar
  ├── CircularProgress.tsx  → Circular progress
  ├── Spinner.tsx           → Loading spinner
  ├── Skeleton.tsx          → Skeleton loader
  └── SHOWCASE_EXAMPLE.tsx  → Progress examples
```

### **5. Feature Components**

#### **AI Features** (`/components/auto-scout/`, `/components/smart-scout/`)
**Auto Scout:**
```
GenerationForm.tsx          → Report generation form
GenerationProgress.tsx      → Generation progress indicator
GeneratedReportPreview.tsx  → Generated report preview
ReportHistoryList.tsx       → Report generation history
TemplateSelector.tsx        → Template selection
TemplateCard.tsx            → Template card
QualityScoreBadge.tsx       → Quality score indicator
ReportSectionCard.tsx       → Report section card
```

**Smart Scout:**
```
AutocompleteField.tsx       → AI autocomplete field
SuggestionsPanel.tsx        → AI suggestions panel
PlayerInsights.tsx          → Player insights
SimilarReportCard.tsx       → Similar reports
ReportModal.tsx             → Report modal
```

#### **ArkaneMatch** (`/components/arkane-match/`)
```
ChatMessage.tsx             → Chat message bubble
ChatInput.tsx               → Chat input field
TypingIndicator.tsx         → AI typing indicator
ScoutCardMini.tsx           → Scout card (compact)
SearchCriteriaBadges.tsx    → Search criteria display
SuggestionChips.tsx         → Suggestion chips
EmptyState.tsx              → Empty state UI
```

#### **Voice-to-Report** (`/components/voice-to-report/`)
```
VoiceRecorder.tsx           → Voice recorder component
RecordingControls.tsx       → Recording controls
WaveformVisualizer.tsx      → Audio waveform display
TranscriptionDisplay.tsx    → Transcription text display
ExtractedDataPreview.tsx    → Extracted data preview
```

#### **Marketplace** (`/components/marketplace/`)
**Scout:**
```
scout/
  ├── ScoutProfileCard.tsx  → Scout profile card
  ├── ScoutExpertiseBadge.tsx → Scout expertise badge
  ├── ScoutStats.tsx        → Scout statistics
  └── RatingDistribution.tsx → Rating distribution chart
```

**Reviews:**
```
reviews/
  ├── ReviewList.tsx        → Reviews list
  └── ReviewCard.tsx        → Individual review card
```

**Shared:**
```
shared/
  ├── Badge.tsx             → Marketplace badge
  ├── StarRating.tsx        → Star rating component
  └── ScoutCardSkeleton.tsx → Loading skeleton
```

#### **Market Value AI** (`/components/market-value/`)
```
PlayerValuationCard.tsx     → Player valuation overview
ValuationTrend.tsx          → Valuation trend chart
FactorBreakdown.tsx         → Valuation factors breakdown
ConfidenceIndicator.tsx     → ML confidence indicator
ComparablePlayers.tsx       → Comparable players list
PlayerComparison.tsx        → Player comparison view
```

#### **PlayStyle DNA** (`/components/playstyle-dna/`)
```
DNARadarChart.tsx           → DNA radar chart
PlayStyleCard.tsx           → PlayStyle card
StyleBadge.tsx              → Style badge
ComparisonRadar.tsx         → Comparison radar chart
StyleExplorerGrid.tsx       → Style explorer grid
StyleDetailModal.tsx        → Style detail modal
SimilarPlayers.tsx          → Similar players list
StyleRecommendations.tsx    → Style-based recommendations
```

#### **Performance Predictor** (`/components/performance-predictor/`)
```
PredictionCard.tsx          → Prediction card
AccuracyMetrics.tsx         → Model accuracy metrics
AccuracyTrendChart.tsx      → Accuracy trend chart
ConfidenceInterval.tsx      → Confidence interval display
KeyFactors.tsx              → Key performance factors
RecommendationsPanel.tsx    → AI recommendations
LineupVisualization.tsx     → Lineup visualization
RatingDistribution.tsx      → Rating distribution chart
```

#### **Gamification** (`/components/gamification/`)
```
AchievementCard.tsx         → Achievement card
BadgeDisplay.tsx            → Badge display
RarityBadge.tsx             → Rarity indicator
LeaderboardTable.tsx        → Leaderboard table
LevelBadge.tsx              → Level badge
DailyChallenge.tsx          → Daily challenge card
XPBar.tsx                   → XP progress bar
```

#### **Coaching** (`/components/coaching/`)
```
CoachCard.tsx               → Coach profile card
CoachingFilters.tsx         → Coaching search filters
BookingCalendar.tsx         → Booking calendar
SessionCard.tsx             → Coaching session card
RatingStars.tsx             → Star rating component
ReviewCard.tsx              → Review card
```

#### **Calendar** (`/components/calendar/`)
```
month-view.tsx              → Month calendar view
create-match-modal.tsx      → Create match modal
match-detail-modal.tsx      → Match detail modal
assign-scout-modal.tsx      → Assign scout modal
```

#### **Reports** (`/components/reports/`)
```
create-report-modal.tsx     → Create scouting report modal
```

#### **Dashboard** (`/components/dashboard/`)
```
StatCard.tsx                → Dashboard stat card
```

### **6. Charts** (`/components/charts/`)
```
LineChart.tsx               → Line chart (Recharts)
BarChart.tsx                → Bar chart
PieChart.tsx                → Pie chart
AreaChart.tsx               → Area chart
```

### **7. Stats** (`/components/stats/`)
```
StatCard.tsx                → Stat display card
ActivityCard.tsx            → Activity card
TaskCard.tsx                → Task card
```

### **8. Auth Components** (`/components/auth/`)
```
protected-route.tsx         → Protected route wrapper
RequireTier.tsx             → Subscription tier guard
```

### **9. Notifications** (`/components/notifications/`)
```
NotificationCenter.tsx      → Notification center (FCM)
```

### **10. Search** (`/components/search/`)
```
GlobalSearch.tsx            → Global search component
```

### **11. Other Components**
```
error-boundary.tsx          → Error boundary wrapper
UpgradeModal.tsx            → Subscription upgrade modal
breadcrumb.tsx              → Breadcrumb component
```

### **12. Providers** (`/components/providers/`)
```
client-providers.tsx        → Client-side providers wrapper
UpgradeModalProvider.tsx    → Upgrade modal provider
```

### **13. SEO & Accessibility**
```
seo/
  └── StructuredData.tsx    → Structured data (JSON-LD)
accessibility/
  └── SkipLinks.tsx         → Skip to content links
```

### **14. Examples** (`/components/examples/`)
```
UpgradeModalExamples.tsx    → Upgrade modal usage examples
```

---

## 🧭 NAVIGATION & ROUTING

### **Navigation Structure**

#### **Main Navbar** (`/components/layout/Navbar.tsx`)
**Desktop Navigation:**
- Dashboard
- Joueurs (Players)
- Favoris (Favorites) - with counter badge
- Camps (dropdown: Tous les camps, Mes inscriptions)
- Marché (Market)
- Rapports (Reports)
- Calendrier (Calendar)
- Arkane AI (dropdown: Hub IA, ArkaneIndex, ArkaneGPT)

**Right Section:**
- Global Search (md+)
- Notification Center (authenticated)
- Tier Badge (subscription level)
- Profile Dropdown (Profile, Logout)

**Mobile Navigation:**
- Hamburger menu
- Same items as desktop in vertical layout
- Auth buttons at bottom

#### **Sidebar** (`/components/layout/app-sidebar.tsx`)
```
Dashboard           → /dashboard
Reports             → /reports
Calendar            → /calendar
Analytics           → /analytics
Players             → /players
Market Value AI     → /market-value (ML badge)
PlayStyle DNA       → /playstyle-dna (ML badge)
Achievements        → /achievements
Notifications       → /notifications (not in navbar)
Settings            → /settings
Logout              → logout action
```

### **Route Protection**

**Public Routes:**
- `/`, `/about`, `/contact`, `/services`, `/pricing`
- `/login`, `/signup`
- `/brand-preview`
- `/passport/[token]` (public QR access)

**Authenticated Routes:**
- All routes under `/dashboard`, `/players`, `/reports`, `/ai`, etc.
- Protected by `AuthContext` and `useAuth()` hook

**Role-Based Routes:**
- `/admin/*` - ADMIN role only
- `/scout` - SCOUT role
- Player-specific features based on `accountType`

**Tier-Based Access:**
- Enforced via `RequireTier` component
- Subscription tiers: FREE, BASIC, PRO, ENTERPRISE
- Upgrade modal shown when accessing premium features

### **User Flows**

#### **Scout Flow:**
```
Login → Dashboard → Players → Player Detail → Create Report → Auto-Scout (optional)
                                                ↓
                                          Reports List → Report Detail → Submit/Review
```

#### **Club Flow:**
```
Login → Dashboard → Marketplace → ArkaneMatch → Scout Search → Scout Profile → Favorite
                                                                     ↓
                                                              Calendar → Schedule Match
```

#### **Player Flow:**
```
Login → Dashboard → Profile → Passport → Calendar (camps/events) → Camp Registration
```

#### **Admin Flow:**
```
Login → Admin Dashboard → Player Validation → Data Sync → Analytics
```

---

## 🔌 API INTEGRATION

### **API Client** (`/lib/api-client.ts`)

**Base Configuration:**
- API URL: `process.env.NEXT_PUBLIC_API_URL` (default: `http://localhost:5001`)
- Auth: Bearer token from `localStorage.getItem('arcane_auth_token')`
- Analytics tracking on all API calls
- Sentry error tracking
- Subscription error handling (403 → upgrade modal)

### **API Endpoints (grouped by feature)**

#### **Auth**
```typescript
login(email, password)                      → POST /api/auth/login
signup(data)                                → POST /api/auth/signup
logout()                                    → POST /api/auth/logout
getCurrentUser()                            → GET /api/auth/me
updateProfile(data)                         → PATCH /api/auth/profile
```

#### **Players**
```typescript
getPlayers(params?)                         → GET /api/players
getPlayer(id)                               → GET /api/players/:id
createPlayer(data)                          → POST /api/players
updatePlayer(id, data)                      → PATCH /api/players/:id
deletePlayer(id)                            → DELETE /api/players/:id
```

#### **Scouting Reports**
```typescript
getScoutingReports(params?)                 → GET /api/scouting-reports
getScoutingReport(id)                       → GET /api/scouting-reports/:id
createScoutingReport(data)                  → POST /api/scouting-reports
updateScoutingReport(id, data)              → PATCH /api/scouting-reports/:id
deleteScoutingReport(id)                    → DELETE /api/scouting-reports/:id
submitScoutingReport(id)                    → POST /api/scouting-reports/:id/submit
reviewScoutingReport(id, approved)          → POST /api/scouting-reports/:id/review
getPlayerReports(playerId)                  → GET /api/scouting-reports/player/:playerId
getScoutReports(scoutId)                    → GET /api/scouting-reports/scout/:scoutId
getMatchReports(matchId)                    → GET /api/scouting-reports/match/:matchId
```

#### **Matches**
```typescript
getMatches(params?)                         → GET /api/matches
getMatch(id)                                → GET /api/matches/:id
createMatch(data)                           → POST /api/matches
updateMatch(id, data)                       → PUT /api/matches/:id
deleteMatch(id)                             → DELETE /api/matches/:id
assignScoutToMatch(matchId, scoutId)        → PATCH /api/matches/:matchId/assign-scout
updateMatchScore(matchId, scores)           → PATCH /api/matches/:matchId/score
getUpcomingMatchesList(limit?)              → GET /api/matches/upcoming
getLiveMatches()                            → GET /api/matches/live
```

#### **Clubs**
```typescript
getClubs(params?)                           → GET /api/clubs
getClub(id)                                 → GET /api/clubs/:id
```

#### **Users/Scouts**
```typescript
getUsers(params?)                           → GET /api/users
```

#### **AI - Auto Scout**
```typescript
generateAutoScoutReport(data)               → POST /api/auto-scout/generate
bulkGenerateAutoScoutReports(data)          → POST /api/auto-scout/bulk-generate
enhanceAutoScoutReport(reportId)            → POST /api/auto-scout/enhance/:reportId
getAutoScoutTemplates()                     → GET /api/auto-scout/templates
previewAutoScoutReport(playerId, matchId?)  → GET /api/auto-scout/preview/:playerId
getAutoScoutAnalytics(startDate?, endDate?) → GET /api/auto-scout/analytics
getPlayerAutoScoutHistory(playerId)         → GET /api/auto-scout/player/:playerId/history
getAllAutoScoutHistory()                    → GET /api/auto-scout/history
getAutoScoutCostEstimate(reportType?)       → GET /api/auto-scout/cost-estimate
regenerateAutoScoutReport(reportId, temp?)  → POST /api/auto-scout/regenerate/:reportId
```

#### **AI - ArkaneIndex**
```typescript
generateAiSummary(prompt)                   → POST /api/ai/summary
getAiPlayerIndex(playerId)                  → GET /api/ai/index/:playerId
aiMatchmaking(data)                         → POST /api/ai/matchmaking
```

#### **AI - Market Value**
```typescript
getPlayerValuation(playerId)                → GET /api/market-value/player/:playerId
getValuationTrend(playerId)                 → GET /api/market-value/trend/:playerId
comparePlayers(playerIds)                   → POST /api/market-value/compare
checkMarketValueHealth()                    → GET /api/market-value/health
triggerModelRetrain()                       → POST /api/market-value/retrain
```

#### **AI - Performance Predictor**
```typescript
predictPerformance(playerId, matchId)       → POST /api/performance-predictor/predict/:playerId/:matchId
batchPredictPerformance(matchId)            → POST /api/performance-predictor/batch-predict/:matchId
getPerformancePredictorAccuracy(params?)    → GET /api/performance-predictor/accuracy
getFeatureImportance()                      → GET /api/performance-predictor/feature-importance
getPlayerPredictions(playerId)              → GET /api/performance-predictor/predictions/:playerId
getPerformanceInsights(playerId)            → GET /api/performance-predictor/insights/:playerId
retrainPerformanceModel()                   → POST /api/performance-predictor/retrain
```

#### **AI - SmartScout**
```typescript
getSmartScoutSuggestions(partialReport, context?) → POST /api/smart-scout/suggestions
getSmartScoutAutocomplete(field, value, ctx?)     → POST /api/smart-scout/autocomplete
getSmartScoutInsights(playerId)             → GET /api/smart-scout/insights/:playerId
indexSmartScoutReport(reportId)             → POST /api/smart-scout/index/:reportId
reindexAllSmartScoutReports()               → POST /api/smart-scout/reindex-all
```

#### **Marketplace**
```typescript
searchScoutListings(params?)                → GET /api/marketplace/listings
getScoutListing(id)                         → GET /api/marketplace/listings/:id
getListingReviews(listingId)                → GET /api/marketplace/reviews/listing/:listingId
addFavorite(scoutListingId, notes?, tags?)  → POST /api/marketplace/favorites
removeFavorite(favoriteId)                  → DELETE /api/marketplace/favorites/:favoriteId
getFavorites()                              → GET /api/marketplace/favorites
checkFavorite(scoutListingId)               → GET /api/marketplace/favorites/check/:scoutListingId
```

#### **ArkaneMatch**
```typescript
arkaneMatchChat(data)                       → POST /api/arkane-match/chat
getArkaneMatchConversation(conversationId)  → GET /api/arkane-match/conversations/:conversationId
clearArkaneMatchConversation(conversationId)→ DELETE /api/arkane-match/conversations/:conversationId
getArkaneMatchConversations()               → GET /api/arkane-match/conversations
```

#### **Voice-to-Report**
```typescript
processVoiceReport(formData)                → POST /api/voice-to-report/process
getVoiceReportLanguages()                   → GET /api/voice-to-report/languages
getVoiceReportExamples()                    → GET /api/voice-to-report/examples
```

#### **Camps**
```typescript
getCamps(params?)                           → GET /api/camps
getCamp(id)                                 → GET /api/camps/:id
registerForCamp(campId, data)               → POST /api/camps/:campId/register
getMyRegistrations()                        → GET /api/camps/my/registrations
cancelRegistration(participationId)         → DELETE /api/camps/registrations/:participationId
```

#### **Subscriptions**
```typescript
getMySubscription()                         → GET /api/subscriptions/me
createOrUpdateSubscription(tier, period, paymentMethodId?) → POST /api/subscriptions
cancelSubscription(reason?)                 → PUT /api/subscriptions/cancel
reactivateSubscription()                    → PUT /api/subscriptions/reactivate
changeTier(tier, billingPeriod)             → PUT /api/subscriptions/change-tier
```

#### **Notifications (FCM)**
```typescript
getNotifications(unreadOnly?)               → GET /api/notifications/me
getUserNotifications(userId, unreadOnly?)   → GET /api/notifications/user/:userId
markNotificationAsRead(notificationId)      → PATCH /api/notifications/:notificationId/read
markAllNotificationsAsRead()                → PATCH /api/notifications/user/:userId/read-all
registerDevice(data)                        → POST /api/notifications/register-device
unregisterDevice(data)                      → POST /api/notifications/unregister-device
sendNotification(data)                      → POST /api/notifications/send
sendNotificationToMultiple(data)            → POST /api/notifications/send-multiple
sendNotificationToTopic(data)               → POST /api/notifications/send-topic
subscribeToTopic(data)                      → POST /api/notifications/subscribe-topic
unsubscribeFromTopic(data)                  → POST /api/notifications/unsubscribe-topic
sendMatchReminder(matchId)                  → POST /api/notifications/match/:matchId/reminder
sendReportNotification(reportId)            → POST /api/notifications/report/:reportId/notify
```

#### **Gamification**
```typescript
getGamificationProfile()                    → GET /api/gamification/profile
getGamificationAchievements()               → GET /api/gamification/achievements
getGamificationBadges()                     → GET /api/gamification/badges
getGamificationLeaderboard(category)        → GET /api/gamification/leaderboard/:category
trackGamificationAction(action)             → POST /api/gamification/track-action/:action
```

#### **Events**
```typescript
getEvents(params?)                          → GET /api/events
getUpcomingEvents(limit?)                   → GET /api/events/upcoming
getMyEvents(params?)                        → GET /api/events/my-events
getEvent(id)                                → GET /api/events/:id
createEvent(data)                           → POST /api/events
updateEvent(id, data)                       → PATCH /api/events/:id
deleteEvent(id)                             → DELETE /api/events/:id
```

#### **Kanban**
```typescript
getBoards()                                 → GET /api/kanban/boards
getBoard(id)                                → GET /api/kanban/boards/:id
createBoard(data)                           → POST /api/kanban/boards
updateBoard(id, data)                       → PATCH /api/kanban/boards/:id
deleteBoard(id)                             → DELETE /api/kanban/boards/:id
createColumn(boardId, data)                 → POST /api/kanban/boards/:boardId/columns
updateColumn(id, data)                      → PATCH /api/kanban/columns/:id
deleteColumn(id)                            → DELETE /api/kanban/columns/:id
createCard(data)                            → POST /api/kanban/cards
getCard(id)                                 → GET /api/kanban/cards/:id
updateCard(id, data)                        → PATCH /api/kanban/cards/:id
moveCard(id, data)                          → POST /api/kanban/cards/:id/move
deleteCard(id)                              → DELETE /api/kanban/cards/:id
getCardActivities(id)                       → GET /api/kanban/cards/:id/activities
```

#### **Passport**
```typescript
createPassport(data)                        → POST /api/passport
getPassportByPlayer(playerId)               → GET /api/passport/player/:playerId
getPassportByToken(token)                   → GET /api/passport/token/:token
verifyPassport(playerId, data)              → PUT /api/passport/player/:playerId/verify
deletePassport(playerId)                    → DELETE /api/passport/player/:playerId
getPassportQRCode(token)                    → GET /api/passport/qr/:token
```

#### **Analytics**
```typescript
getPlayerAnalytics(playerId, period?)       → GET /api/analytics/player/:playerId
getAnalyticsOverview()                      → GET /api/analytics/overview
getAnalyticsPlayers()                       → GET /api/analytics/players
getAnalyticsClubs()                         → GET /api/analytics/clubs
getAnalyticsScoutingReports()               → GET /api/analytics/scouting-reports
getAnalyticsClubRequests()                  → GET /api/analytics/club-requests
getAnalyticsEvents()                        → GET /api/analytics/events
getAnalyticsActivityTrends(days?)           → GET /api/analytics/activity-trends
```

#### **Dashboard**
```typescript
getDashboardStats()                         → GET /api/dashboard/stats
getUpcomingMatches()                        → GET /api/dashboard/matches
```

#### **Contact**
```typescript
sendContactMessage(data)                    → POST /api/contact
```

### **API Services** (`/lib/api/`)

Specialized API services with business logic:

```
coaching.ts                 → Coaching API (sessions, bookings, reviews)
events.ts                   → Events API (calendar events)
gamification.ts             → Gamification API (achievements, badges, leaderboard)
market-value.ts             → Market Value AI API
performance-predictor.ts    → Performance Predictor API
playstyle-dna.ts            → PlayStyle DNA API
smart-scout.ts              → SmartScout API
```

---

## ✨ SPECIAL FEATURES

### **1. Notifications (FCM - Firebase Cloud Messaging)**

**Implementation Files:**
- `/lib/firebase.ts` - Firebase config
- `/hooks/useNotifications.ts` - Notifications hook
- `/services/notificationService.ts` - Notification service
- `/components/notifications/NotificationCenter.tsx` - UI component
- `/public/firebase-messaging-sw.js` - Service worker

**Features:**
- Push notifications (web + mobile)
- Device registration
- Topic subscriptions
- Match reminders
- Report notifications
- Unread count badge

**Integration:**
```typescript
const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
```

### **2. Calendar & Events**

**Implementation Files:**
- `/app/calendar/page.tsx` - Calendar page
- `/app/calendar/[id]/page.tsx` - Event detail
- `/hooks/useEvents.ts` - Events hook
- `/services/eventService.ts` - Event service
- `/components/calendar/*` - Calendar components

**Features:**
- Month view calendar
- Create/edit/delete events
- Match scheduling
- Scout assignment
- Event types: match, training, meeting, camp
- Location with coordinates

### **3. Passport (QR Player Profiles)**

**Implementation Files:**
- `/app/passport/[token]/page.tsx` - Public passport view
- `/hooks/usePassport.ts` - Passport hook
- `/services/passportService.ts` - Passport service

**Features:**
- QR code generation
- Public player profiles (shareable link)
- Token-based access
- Verification status
- Admin notes

### **4. Auto Scout (AI Report Generation)**

**Implementation Files:**
- `/app/auto-scout/page.tsx` - Auto Scout page
- `/components/auto-scout/*` - Auto Scout components

**Features:**
- AI-generated scouting reports
- Template selection
- Quality scoring
- Bulk generation
- Report enhancement
- Cost estimation
- Generation history
- Preview mode

### **5. ArkaneMatch (AI Scout Matching)**

**Implementation Files:**
- `/app/arkane-match/page.tsx` - ArkaneMatch page
- `/components/arkane-match/*` - Chat components

**Features:**
- Conversational AI for scout search
- Natural language criteria extraction
- Scout recommendations
- Conversation history
- Suggestion chips

### **6. Voice-to-Report**

**Implementation Files:**
- `/app/reports/voice/page.tsx` - Voice-to-report page
- `/components/voice-to-report/*` - Voice components
- `/hooks/useVoiceRecorder.ts` - Voice recorder hook

**Features:**
- Voice recording
- Audio transcription
- Data extraction from speech
- Waveform visualization
- Multi-language support

### **7. Market Value AI (ML)**

**Implementation Files:**
- `/app/market-value/page.tsx` - Market Value page
- `/components/market-value/*` - Market Value components

**Features:**
- ML-based player valuation
- Valuation trend analysis
- Factor breakdown
- Player comparison
- Confidence indicators
- Comparable players
- Model health check
- Manual retraining

### **8. Performance Predictor (ML)**

**Implementation Files:**
- `/app/performance-predictor/page.tsx` - Performance Predictor page
- `/components/performance-predictor/*` - Predictor components

**Features:**
- ML-based performance prediction
- Match-specific predictions
- Batch predictions
- Accuracy metrics
- Feature importance
- Confidence intervals
- Performance insights
- Model retraining

### **9. PlayStyle DNA**

**Implementation Files:**
- `/app/playstyle-dna/page.tsx` - PlayStyle DNA page
- `/components/playstyle-dna/*` - DNA components

**Features:**
- DNA radar charts
- PlayStyle profiling
- Style comparison
- Similar players
- Style explorer
- Recommendations
- Style badges

### **10. SmartScout (AI-Assisted Scouting)**

**Implementation Files:**
- `/app/smart-scout/page.tsx` - SmartScout page
- `/components/smart-scout/*` - SmartScout components

**Features:**
- AI suggestions during report writing
- Autocomplete fields
- Player insights
- Similar report recommendations
- Report indexing

### **11. Gamification**

**Implementation Files:**
- `/app/achievements/*` - Achievement pages
- `/components/gamification/*` - Gamification components
- `/hooks/useGamification.ts` - Gamification hook

**Features:**
- XP system with levels
- Achievements (locked/unlocked)
- Badges (common, rare, epic, legendary)
- Leaderboards (points, reports, streak)
- Daily challenges
- Streak tracking
- Action tracking

### **12. Coaching Hub**

**Implementation Files:**
- `/app/coaching/*` - Coaching pages
- `/components/coaching/*` - Coaching components
- `/hooks/useCoaching.ts` - Coaching hook

**Features:**
- Coach profiles
- Session booking
- Calendar integration
- Rating & reviews
- Filter by expertise, languages
- Session history

### **13. Marketplace**

**Implementation Files:**
- `/app/marketplace/*` - Marketplace pages
- `/components/marketplace/*` - Marketplace components

**Features:**
- Scout listings
- Advanced search filters
- Scout profiles with stats
- Reviews & ratings
- Favorites system
- Verified scouts

### **14. Camps**

**Implementation Files:**
- `/app/camps/*` - Camp pages

**Features:**
- Camp listings
- Camp registration
- Parental consent
- Medical waivers
- Registration management
- Public/private camps

### **15. Subscription System**

**Implementation Files:**
- `/hooks/useSubscription.ts` - Subscription hook
- `/hooks/useSubscriptionGuard.ts` - Subscription guard
- `/components/UpgradeModal.tsx` - Upgrade modal
- `/components/providers/UpgradeModalProvider.tsx` - Modal provider
- `/lib/api-interceptor.ts` - API interceptor

**Tiers:**
- FREE
- BASIC
- PRO
- ENTERPRISE

**Features:**
- Tier-based feature access
- Upgrade modal on 403 errors
- Subscription management
- Plan comparison
- Cancellation & reactivation
- Tier changes

---

## 🧠 CONTEXTS & STATE MANAGEMENT

### **1. AuthContext** (`/contexts/auth-context.tsx`)
```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email, password) => Promise<void>;
  signup: (data) => Promise<void>;
  logout: () => void;
  updateUser: (data) => void;
}
```

**Features:**
- Token-based authentication
- User session management
- Auto-validation on mount
- localStorage persistence
- Role mapping (PLAYER, AGENT, CLUB_CONTACT)

### **2. ComparisonContext** (`/contexts/comparison-context.tsx`)
```typescript
interface ComparisonContextType {
  comparisonPlayers: Player[];
  addToComparison: (player) => void;
  removeFromComparison: (playerId) => void;
  clearComparison: () => void;
}
```

### **3. FavoritesContext** (`/contexts/favorites-context.tsx`)
```typescript
interface FavoritesContextType {
  favoritePlayerIds: string[];
  favorites: any[];
  addFavorite: (playerId, notes?, tags?) => Promise<void>;
  removeFavorite: (favoriteId) => Promise<void>;
  isFavorite: (playerId) => boolean;
  refreshFavorites: () => Promise<void>;
}
```

### **4. LanguageContext** (`/contexts/language-context.tsx`)
```typescript
interface LanguageContextType {
  language: string;
  setLanguage: (lang) => void;
  t: (key) => string;
}
```

**Supported Languages:**
- fr (Français)
- en (English)
- es (Español)

---

## 🪝 HOOKS

### **Custom Hooks** (`/hooks/`)

```typescript
useSubscription.ts          → Subscription management
useSubscriptionGuard.ts     → Tier-based access control
useCoaching.ts              → Coaching sessions & bookings
useEvents.ts                → Calendar events
useGamification.ts          → Achievements & gamification
useNotifications.ts         → FCM notifications
usePassport.ts              → Player passport
useVoiceRecorder.ts         → Voice recording
useData.ts                  → Generic data fetching
```

**Example Usage:**
```typescript
const { subscription, getTierName, hasTierAccess } = useSubscription();
const { profile, achievements, badges, trackAction } = useGamification();
const { notifications, unreadCount, markAsRead } = useNotifications();
```

---

## 🛠️ SERVICES

### **Service Layer** (`/services/`)

```
eventService.ts             → Event CRUD operations
notificationService.ts      → Notification utilities
passportService.ts          → Passport utilities
validationService.ts        → Validation helpers
```

---

## 📐 TYPE DEFINITIONS

### **Type Files** (`/types/`)

```
arkane-match.ts             → ArkaneMatch types
auto-scout.ts               → AutoScout types
event.ts                    → Event types
market-value.ts             → Market Value types
marketplace.ts              → Marketplace types
passport.ts                 → Passport types
performance-predictor.ts    → Performance Predictor types
playstyle-dna.ts            → PlayStyle DNA types
smart-scout.ts              → SmartScout types
upgrade-modal.ts            → Upgrade modal types
voice-to-report.ts          → Voice-to-report types
```

---

## 📦 PROVIDERS & WRAPPERS

### **ClientProviders** (`/components/providers/client-providers.tsx`)

**Wraps all client-side providers:**
- AuthProvider
- FavoritesProvider
- ComparisonProvider
- LanguageProvider
- UpgradeModalProvider

**Used in:** `/app/layout.tsx`

---

## 🎨 DESIGN SYSTEM

### **Design Tokens** (`/lib/design-system/`)

```
tokens.ts                   → Design tokens (colors, spacing, etc.)
animations.ts               → Animation utilities
```

### **Accessibility** (`/lib/accessibility/`)

```
contrast-checker.ts         → Color contrast validation
hooks.tsx                   → Accessibility hooks (useA11y, useKeyboardNav)
index.ts                    → Accessibility utilities
```

---

## 🔍 ADDITIONAL LIBRARIES

### **Utilities** (`/lib/utils/`)

```
playstyle-colors.ts         → PlayStyle color mappings
rating-helpers.ts           → Rating calculation helpers
sample-dna-data.ts          → Sample DNA data for demos
```

### **Core Libraries** (`/lib/`)

```
analytics.ts                → Analytics tracking (Google Analytics, custom events)
api-client.ts               → Main API client (singleton)
api-interceptor.ts          → API error interceptor (subscription errors)
browser-compatibility.ts    → Browser compatibility checks
dynamic-imports.tsx         → Dynamic import utilities
error-handler.ts            → Global error handler
firebase.ts                 → Firebase configuration (FCM)
logger.ts                   → Logging utility
metadata.ts                 → SEO metadata generation
seo.ts                      → SEO utilities
utils.ts                    → Generic utilities (cn, formatters, etc.)
```

---

## 📊 SUMMARY STATS

### **Pages:**
- Total: **51 pages**
- Public: **7 pages**
- Authenticated: **40+ pages**
- Admin: **3 pages**

### **Components:**
- Total: **201 component files**
- UI Primitives: **30+**
- Feature Components: **100+**
- Composite Components: **40+**
- Charts: **4**

### **API Endpoints:**
- Total: **150+ endpoints**
- Auth: **5**
- Players: **5**
- Reports: **9**
- Matches: **8**
- AI (Auto Scout): **10**
- AI (Other): **20+**
- Marketplace: **6**
- Notifications (FCM): **11**
- Gamification: **5**
- Events: **7**
- Subscriptions: **5**
- Passport: **6**
- Analytics: **8**

### **Contexts:**
- **4 contexts**: Auth, Favorites, Comparison, Language

### **Hooks:**
- **10+ custom hooks**

### **Services:**
- **4 services**

### **Type Definitions:**
- **11 type files**

---

## 🚀 KEY TECHNOLOGIES

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Library:** Radix UI, Lucide Icons
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Forms:** React Hook Form
- **State Management:** React Context API
- **API Client:** Custom fetch wrapper
- **Auth:** JWT (Bearer tokens)
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Analytics:** Google Analytics + Sentry
- **SEO:** Next.js Metadata API, Structured Data (JSON-LD)
- **Accessibility:** WCAG 2.1 AA compliance

---

## 📝 NOTES

1. **Role-Based Dashboards:** Dashboard content adapts based on user role (PLAYER, AGENT, CLUB_CONTACT, ADMIN)
2. **Tier-Based Features:** Premium features (AI tools, ML models) require paid subscriptions
3. **Multi-Language Support:** French (primary), English, Spanish
4. **Responsive Design:** Mobile-first, fully responsive across all pages
5. **Dark Mode:** Dark theme by default (Arcane branding)
6. **Real-time Updates:** WebSocket support for live match updates (not yet implemented)
7. **Offline Support:** Service worker for PWA capabilities
8. **Analytics & Monitoring:** Full analytics tracking + Sentry error monitoring
9. **SEO Optimized:** Meta tags, Open Graph, Twitter Cards, Structured Data
10. **Accessibility:** Skip links, ARIA labels, keyboard navigation

---

## 🔗 RELATED DOCUMENTATION

- `ARCANE_DESIGN_SYSTEM.md` - Design system documentation
- `FCM_INTEGRATION_REPORT.md` - Firebase notifications integration
- `PASSPORT_INTEGRATION.md` - Passport feature documentation
- `EVENTS_CALENDAR_INTEGRATION.md` - Calendar integration
- `NOTIFICATION_QUICK_START.md` - Notifications quick start

---

**Generated:** 2025-11-16
**Version:** Web v1.0
**Total Files Analyzed:** 250+
