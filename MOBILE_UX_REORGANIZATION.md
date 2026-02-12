# ARCANE Football - Mobile UX/UI Reorganization Plan

## Executive Summary

This document presents a comprehensive mobile-first UX/UI reorganization for the ARCANE Football mobile application. The redesign focuses on role-specific navigation, thumb-friendly interactions, reduced cognitive load, and optimized workflows for on-the-go usage.

**Current State Analysis:**
- Existing mobile app with 20+ screens
- Generic bottom tab navigation (5 tabs: Home, Players, Analytics, Market, Profile)
- No role-specific customization
- Limited mobile-specific features (no FAB, minimal gestures, no offline mode)
- Complex navigation hierarchy

**Proposed Improvements:**
- Role-specific bottom tab navigation (8 user roles)
- Floating Action Buttons (FAB) for critical actions
- Gesture-based interactions (swipe, pull-to-refresh, long-press)
- Thumb-zone optimization
- Offline-first capabilities
- Push notification strategy per role
- Quick actions and shortcuts

---

## Table of Contents

1. [Mobile UX Principles](#mobile-ux-principles)
2. [User Roles Analysis](#user-roles-analysis)
3. [Role-Specific Navigation](#role-specific-navigation)
4. [Home Screen Designs](#home-screen-designs)
5. [Mobile-Optimized User Journeys](#mobile-optimized-user-journeys)
6. [Gesture Interactions](#gesture-interactions)
7. [Quick Actions & FAB](#quick-actions--fab)
8. [Offline Capabilities](#offline-capabilities)
9. [Push Notification Strategy](#push-notification-strategy)
10. [Implementation Roadmap](#implementation-roadmap)

---

## 1. Mobile UX Principles

### Core Principles

#### 1.1 Thumb-Friendly Design
- **Primary action zone**: Bottom 1/3 of screen (easy thumb reach)
- **Secondary zone**: Middle 1/3 (stretch required)
- **Viewing zone**: Top 1/3 (hard to reach - display only)

#### 1.2 Reduced Cognitive Load
- **Maximum 5 items per screen section**
- **Maximum 5 tabs in bottom navigation**
- **Clear visual hierarchy**
- **One primary action per screen**

#### 1.3 Gesture-First Interactions
- **Swipe**: Navigate between screens, dismiss modals
- **Pull-to-refresh**: Update data
- **Long-press**: Contextual actions
- **Pinch-to-zoom**: Images, stats
- **Double-tap**: Quick actions (like, favorite)

#### 1.4 Performance Optimization
- **Offline-first architecture**
- **Progressive loading**
- **Image optimization**
- **Skeleton screens**
- **Haptic feedback**

---

## 2. User Roles Analysis

Based on the Prisma schema, ARCANE Football has **8 distinct user roles**:

```typescript
enum UserRole {
  SUPER_ADMIN    // Platform administration
  ADMIN          // Organization management
  AGENT          // Player agent/representative
  SCOUT          // Talent scout
  ANALYST        // Performance analyst
  PLAYER         // Football player
  CLUB_CONTACT   // Club representative
  PUBLIC         // General user/visitor
}
```

### Role Prioritization Matrix

| Role | Frequency | Complexity | Mobile Priority | Key Actions |
|------|-----------|------------|----------------|-------------|
| **SCOUT** | High | High | 🔴 Critical | Reports, Players, Matches |
| **PLAYER** | High | Medium | 🔴 Critical | Profile, Stats, Opportunities |
| **AGENT** | High | High | 🟠 High | Players, Clubs, Deals |
| **CLUB_CONTACT** | Medium | High | 🟠 High | Players, Scouts, Offers |
| **ANALYST** | Medium | High | 🟡 Medium | Analytics, Reports, Stats |
| **PUBLIC** | High | Low | 🟡 Medium | Browse, Discover, Register |
| **ADMIN** | Low | High | 🟢 Low | Management, Settings |
| **SUPER_ADMIN** | Low | Very High | 🟢 Low | Platform admin (desktop) |

---

## 3. Role-Specific Navigation

### 3.1 SCOUT Role

**Primary Use Case**: On-the-go scouting at matches, quick report creation, player evaluation

#### Bottom Tab Navigation (5 tabs)
```
┌──────────────────────────────────────────────────────────┐
│  [🏠 Home]  [⚽ Players]  [➕ FAB]  [📝 Reports]  [👤 Profile] │
└──────────────────────────────────────────────────────────┘
```

**Tab Breakdown:**
1. **Home** (🏠)
   - Today's assignments
   - Upcoming matches
   - Quick stats
   - Recent activity

2. **Players** (⚽)
   - Search & filter
   - Favorites
   - Recently viewed
   - Quick compare

3. **FAB** (➕) - Floating Action Button
   - **Primary**: Create quick report
   - **Secondary**: Voice note, Camera, Add player to favorites

4. **Reports** (📝)
   - Draft reports
   - Submitted reports
   - Templates
   - Voice-to-report

5. **Profile** (👤)
   - Scout stats
   - Settings
   - Marketplace profile
   - Notifications

**Top Navigation Bar:**
- **Left**: Logo/Back button (contextual)
- **Center**: Screen title
- **Right**: Search 🔍 | Notifications 🔔 | More ⋮

---

### 3.2 PLAYER Role

**Primary Use Case**: Check stats, view opportunities, manage profile, communicate with agents

#### Bottom Tab Navigation (5 tabs)
```
┌──────────────────────────────────────────────────────────┐
│  [🏠 Home]  [📊 Stats]  [🎯 Opportunities]  [💬 Messages]  [👤 Profile] │
└──────────────────────────────────────────────────────────┘
```

**Tab Breakdown:**
1. **Home** (🏠)
   - Performance summary
   - Recent reports
   - Upcoming matches
   - Quick actions

2. **Stats** (📊)
   - Performance predictor
   - PlayStyle DNA
   - Market value
   - Career timeline

3. **Opportunities** (🎯)
   - Club offers
   - Camp invitations
   - Showcase events
   - Agent requests

4. **Messages** (💬)
   - Chats with agents
   - Club contacts
   - Scout messages
   - System notifications

5. **Profile** (👤)
   - Digital passport
   - Edit profile
   - Media gallery
   - Settings

**FAB Action**: Share passport (QR code)

---

### 3.3 CLUB_CONTACT Role

**Primary Use Case**: Manage players, review offers, scout marketplace, team analytics

#### Bottom Tab Navigation (5 tabs)
```
┌──────────────────────────────────────────────────────────┐
│  [🏠 Overview]  [⚽ Squad]  [🔍 Scout]  [💼 Offers]  [👤 Profile] │
└──────────────────────────────────────────────────────────┘
```

**Tab Breakdown:**
1. **Overview** (🏠)
   - Club dashboard
   - Team stats
   - Upcoming matches
   - Pending tasks

2. **Squad** (⚽)
   - Current players
   - Performance tracking
   - Injury status
   - Contract management

3. **Scout** (🔍)
   - Marketplace scouts
   - Target players
   - Kanban board (mobile)
   - Saved searches

4. **Offers** (💼)
   - Active offers
   - Negotiations
   - Completed deals
   - Drafts

5. **Profile** (👤)
   - Club info
   - Subscription
   - Settings
   - Team management

**FAB Action**: New offer to scout/player

---

### 3.4 AGENT Role

**Primary Use Case**: Manage player roster, track opportunities, negotiate deals

#### Bottom Tab Navigation (5 tabs)
```
┌──────────────────────────────────────────────────────────┐
│  [🏠 Home]  [⚽ Roster]  [🎯 Deals]  [📈 Market]  [👤 Profile] │
└──────────────────────────────────────────────────────────┘
```

**Tab Breakdown:**
1. **Home** (🏠)
   - Dashboard
   - Active negotiations
   - Alerts & deadlines
   - Quick actions

2. **Roster** (⚽)
   - My players
   - Performance tracking
   - Market value trends
   - Player passports

3. **Deals** (🎯)
   - Active deals
   - Club requests
   - Offers received
   - Contract status

4. **Market** (📈)
   - Player search
   - Club search
   - Market trends
   - Saved searches

5. **Profile** (👤)
   - Agency info
   - Settings
   - Subscription
   - Analytics

**FAB Action**: Quick player report / Share player profile

---

### 3.5 ANALYST Role

**Primary Use Case**: Deep dive analytics, report generation, data visualization

#### Bottom Tab Navigation (5 tabs)
```
┌──────────────────────────────────────────────────────────┐
│  [🏠 Home]  [📊 Analytics]  [🤖 AI Tools]  [📝 Reports]  [👤 Profile] │
└──────────────────────────────────────────────────────────┘
```

**Tab Breakdown:**
1. **Home** (🏠)
   - Analytics dashboard
   - Recent insights
   - Pending analyses
   - Quick stats

2. **Analytics** (📊)
   - Player analytics
   - Match analytics
   - Comparison tools
   - Custom charts

3. **AI Tools** (🤖)
   - Performance Predictor
   - PlayStyle DNA
   - Market Value AI
   - SmartScout
   - ArkaneMatch

4. **Reports** (📝)
   - Generated reports
   - Templates
   - Export options
   - History

5. **Profile** (👤)
   - Settings
   - Subscription
   - Saved analyses
   - Preferences

**FAB Action**: Generate new analysis

---

### 3.6 PUBLIC Role

**Primary Use Case**: Browse players, discover camps, explore features, register

#### Bottom Tab Navigation (5 tabs)
```
┌──────────────────────────────────────────────────────────┐
│  [🏠 Discover]  [⚽ Players]  [🏕️ Camps]  [ℹ️ About]  [👤 Account] │
└──────────────────────────────────────────────────────────┘
```

**Tab Breakdown:**
1. **Discover** (🏠)
   - Featured content
   - Success stories
   - Latest updates
   - Getting started

2. **Players** (⚽)
   - Browse players (limited)
   - Top talents
   - Search
   - Filters

3. **Camps** (🏕️)
   - Upcoming camps
   - Register for camps
   - Camp details
   - Calendar

4. **About** (ℹ️)
   - About ARCANE
   - Services
   - Pricing
   - Contact

5. **Account** (👤)
   - Login/Signup
   - Settings (if logged in)
   - Help
   - Language

**FAB Action**: Quick registration / Upgrade prompt

---

### 3.7 ADMIN Role

**Primary Use Case**: Moderate content, manage users, system settings

#### Bottom Tab Navigation (5 tabs)
```
┌──────────────────────────────────────────────────────────┐
│  [🏠 Dashboard]  [👥 Users]  [📋 Content]  [⚙️ System]  [👤 Profile] │
└──────────────────────────────────────────────────────────┘
```

**Tab Breakdown:**
1. **Dashboard** (🏠)
   - Platform stats
   - Recent activity
   - Alerts
   - Quick actions

2. **Users** (👥)
   - User management
   - Roles & permissions
   - Subscriptions
   - Approvals

3. **Content** (📋)
   - Players (validation)
   - Reports (moderation)
   - Camps (approval)
   - Media review

4. **System** (⚙️)
   - Settings
   - Logs
   - Analytics
   - Integrations

5. **Profile** (👤)
   - Admin settings
   - Activity log
   - Preferences
   - Logout

**FAB Action**: Quick approve/reject

---

### 3.8 COACH (Bonus Role - from schema)

**Primary Use Case**: Manage bookings, view schedule, player list

#### Bottom Tab Navigation (5 tabs)
```
┌──────────────────────────────────────────────────────────┐
│  [🏠 Home]  [📅 Schedule]  [⚽ Players]  [💬 Bookings]  [👤 Profile] │
└──────────────────────────────────────────────────────────┘
```

**Tab Breakdown:**
1. **Home** (🏠)
   - Today's sessions
   - Upcoming bookings
   - Quick stats
   - Availability toggle

2. **Schedule** (📅)
   - Calendar view
   - Session details
   - Availability manager
   - Time blocking

3. **Players** (⚽)
   - Client list
   - Performance notes
   - Session history
   - Progress tracking

4. **Bookings** (💬)
   - Pending requests
   - Confirmed sessions
   - Payment status
   - Messages

5. **Profile** (👤)
   - Coach profile
   - Rates & services
   - Settings
   - Reviews

**FAB Action**: Mark availability / Quick session note

---

## 4. Home Screen Designs

### 4.1 SCOUT Home Screen (Wireframe Description)

```
┌─────────────────────────────────────────────┐
│ ← ARCANE    Scout Dashboard    🔍 🔔 ⋮    │ ← Top bar (viewing zone)
├─────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ 👋 Bonjour, Jean                     │   │
│  │ 3 assignments today • 12 new reports │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  📍 Today's Assignments                     │ ← Secondary zone
│  ┌───────────────────────────────────┐     │
│  │ 🏟️ PSG vs Monaco                   │     │
│  │ 📅 Today 20:00 • Parc des Princes  │     │
│  │ 🎯 3 target players                │     │
│  │ [View Details →]                   │     │
│  └───────────────────────────────────┘     │
│                                              │
│  🔥 Quick Actions                           │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐      │
│  │ 📝    │ │ 🎤    │ │ 📷    │ │ ⭐    │      │
│  │Report│ │Voice │ │Photo │ │Favs │      │ ← Primary zone
│  └──────┘ └──────┘ └──────┘ └──────┘      │   (thumb-friendly)
│                                              │
│  📊 This Week                               │
│  • 8 reports submitted                      │
│  • 12 players scouted                       │
│  • 5 matches attended                       │
│                                              │
│  🆕 Recent Activity                         │
│  ┌───────────────────────────────────┐     │
│  │ ⚽ Report approved: M. Mbappé      │     │
│  │ 🔔 New match assignment: Lyon     │     │
│  │ 💬 Message from Club Paris FC     │     │
│  └───────────────────────────────────┘     │
│                                              │
└─────────────────────────────────────────────┘
        [🏠] [⚽] [➕] [📝] [👤]                 ← Bottom tabs
              ↑ FAB highlighted
```

**Key Features:**
- **Personalized greeting** with quick stats
- **Today's assignments** as priority content
- **Quick actions** in thumb zone (4 max)
- **Weekly summary** with animated counters
- **Recent activity** feed
- **FAB** prominently positioned for report creation

**Gestures:**
- Swipe down → Pull to refresh
- Swipe left/right on assignments → Next/previous
- Long-press on player card → Quick actions menu
- Tap FAB → Quick report modal

---

### 4.2 PLAYER Home Screen (Wireframe Description)

```
┌─────────────────────────────────────────────┐
│ ← ARCANE    My Performance   🔍 🔔 ⋮       │
├─────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ 📸 [Avatar]  Marcus Johnson         │   │
│  │ ⚡ Striker • 23 years               │   │
│  │ 📊 Market Value: €2.5M ↗️ +15%      │   │
│  │ [View Full Passport →]              │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  🎯 Performance Overview                    │
│  ┌────────┬────────┬────────┬────────┐    │
│  │ 92/100 │ 88/100 │ 85/100 │ 90/100 │    │
│  │Technical│Physical│Mental  │Overall │    │
│  └────────┴────────┴────────┴────────┘    │
│                                              │
│  🔔 New Opportunities (3)                   │
│  ┌───────────────────────────────────┐     │
│  │ 🏆 FC Barcelona - Interest         │     │
│  │ 📅 Camp invitation: Elite Academy  │     │
│  │ 🤝 Agent request: John Smith       │     │
│  └───────────────────────────────────┘     │
│                                              │
│  📈 Recent Reports (5 new)                  │
│  ┌───────────────────────────────────┐     │
│  │ ⭐ 9.2/10 - PSG Scout              │     │
│  │ ⭐ 8.8/10 - Bayern Munich          │     │
│  │ [View All Reports →]               │     │
│  └───────────────────────────────────┘     │
│                                              │
│  🎥 Latest Highlights                       │
│  [Video Thumbnail] [Video Thumbnail]        │
│                                              │
└─────────────────────────────────────────────┘
      [🏠] [📊] [🎯] [💬] [👤]                 ← Bottom tabs
```

**Key Features:**
- **Profile summary** with key metrics
- **Performance at-a-glance** with visual scores
- **Opportunities feed** (most important for players)
- **Reports summary** with ratings
- **Media showcase**

**Gestures:**
- Swipe down → Refresh all data
- Swipe left on opportunity → Dismiss
- Swipe right on opportunity → Quick accept
- Double-tap on report → Open details
- Long-press on avatar → Share passport

---

### 4.3 CLUB_CONTACT Home Screen (Wireframe Description)

```
┌─────────────────────────────────────────────┐
│ ← Paris FC    Club Overview    🔍 🔔 ⋮     │
├─────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ 🏆 Paris FC                          │   │
│  │ 👥 28 players • 📊 League 2          │   │
│  │ [Manage Club →]                      │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  🚨 Pending Actions (5)                     │
│  ┌───────────────────────────────────┐     │
│  │ 💼 3 scout offers pending          │     │
│  │ ⚽ 2 player requests to review      │     │
│  │ 📝 Transfer window closes in 5d    │     │
│  └───────────────────────────────────┘     │
│                                              │
│  ⚽ Squad Status                             │
│  ┌────────┬────────┬────────┬────────┐    │
│  │   28   │   3    │   2    │   91%  │    │
│  │ Players│Injured │Pending │ Avg    │    │
│  └────────┴────────┴────────┴────────┘    │
│                                              │
│  🎯 Transfer Targets (Kanban)               │
│  [Prospect] → [Contacted] → [Negotiating]   │
│  5 players    3 players     2 players       │
│  [Open Kanban Board →]                      │
│                                              │
│  📊 Recent Activity                         │
│  • New scout offer from Jean Martin         │
│  • Player profile updated: M. Dupont        │
│  • Match report received: PSG vs Monaco     │
│                                              │
│  🔍 Recommended Scouts (3)                  │
│  [Scout Card] [Scout Card] [Scout Card]     │
│                                              │
└─────────────────────────────────────────────┘
      [🏠] [⚽] [🔍] [💼] [👤]                 ← Bottom tabs
```

**Key Features:**
- **Club identity** at top
- **Pending actions** prominently displayed
- **Squad metrics** for quick overview
- **Transfer pipeline** summary (Kanban teaser)
- **Scout marketplace** integration
- **Activity timeline**

**Gestures:**
- Swipe on Kanban preview → Navigate columns
- Pull to refresh → Update all stats
- Long-press on player → Quick actions
- Swipe left on activity → Archive

---

### 4.4 PUBLIC Home Screen (Wireframe Description)

```
┌─────────────────────────────────────────────┐
│ ARCANE    Discover Football   🌐 ⋮         │
├─────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  🎯 EMPOWERING FOOTBALL              │   │
│  │  Through performance, precision      │   │
│  │  and bold ambition                   │   │
│  │                                       │   │
│  │  [🚀 Get Started] [📖 Learn More]    │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ⭐ Features                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ 🤖 AI     │ │ 📊 Stats  │ │ 🏕️ Camps │   │
│  │ Analysis  │ │ Tracking  │ │ Events   │   │
│  └──────────┘ └──────────┘ └──────────┘   │
│                                              │
│  🌟 Success Stories                         │
│  ┌───────────────────────────────────┐     │
│  │ From prospect to professional:     │     │
│  │ "ARCANE helped me get scouted      │     │
│  │  by FC Barcelona!" - Marcus J.     │     │
│  │ [Read More →]                      │     │
│  └───────────────────────────────────┘     │
│                                              │
│  🏕️ Upcoming Camps (5 spots left!)         │
│  ┌───────────────────────────────────┐     │
│  │ Elite Academy Summer Camp 2025     │     │
│  │ 📅 Jul 1-15 • 🌍 Paris, France     │     │
│  │ 💶 €499 • Ages 16-21               │     │
│  │ [Register Now →]                   │     │
│  └───────────────────────────────────┘     │
│                                              │
│  💎 Premium Features                        │
│  Unlock AI-powered insights, unlimited      │
│  reports, and exclusive content             │
│  [View Plans →]                             │
│                                              │
└─────────────────────────────────────────────┘
      [🏠] [⚽] [🏕️] [ℹ️] [👤]                ← Bottom tabs
```

**Key Features:**
- **Hero section** with brand message
- **Value propositions** (3 max)
- **Social proof** (testimonials)
- **Camp promotions** (time-sensitive)
- **Upgrade prompts** (non-intrusive)

**Gestures:**
- Swipe on features → Carousel
- Pull to refresh → Latest content
- Tap "Get Started" → Smart onboarding

---

## 5. Mobile-Optimized User Journeys

### 5.1 SCOUT: Quick Match Report Creation

**Traditional Flow (6 steps):**
1. Open app → Home
2. Navigate to Reports tab
3. Tap "Create Report" button
4. Select player (search)
5. Select match (search)
6. Fill form (10+ fields)
7. Submit

**Optimized Mobile Flow (3 steps):**

```
Step 1: TAP FAB (from anywhere)
┌─────────────────────────────────────────────┐
│ Quick Report                           ✕    │
├─────────────────────────────────────────────┤
│ 📍 You're at: Parc des Princes              │
│ 🏟️ Match: PSG vs Monaco (LIVE)             │
│                                              │
│ Select Player:                               │
│ ┌───────────────────────────────────┐       │
│ │ 🔍 Search or scan...              │       │
│ └───────────────────────────────────┘       │
│                                              │
│ Quick Players (nearby):                      │
│ [⚽ M. Mbappé #7] [⚽ K. Benzema #9]         │
│                                              │
│ [📷 Scan Jersey] [🎤 Voice Report]          │
└─────────────────────────────────────────────┘

Step 2: TAP VOICE REPORT
┌─────────────────────────────────────────────┐
│ Voice Report - Mbappé                   ✕   │
├─────────────────────────────────────────────┤
│                                              │
│      ┌─────────────────────┐                │
│      │                      │                │
│      │    🎤  Recording     │                │
│      │                      │                │
│      │      00:42          │                │
│      │                      │                │
│      └─────────────────────┘                │
│                                              │
│  💬 "Mbappé showing excellent pace          │
│      in the first half, completed           │
│      3 successful dribbles..."              │
│                                              │
│  [⏸️ Pause] [🗑️ Delete] [✓ Done]           │
└─────────────────────────────────────────────┘

Step 3: AUTO-GENERATED REPORT
┌─────────────────────────────────────────────┐
│ Report Preview                          ✕   │
├─────────────────────────────────────────────┤
│ ⚽ Kylian Mbappé                             │
│ 🏟️ PSG vs Monaco • Today 20:00             │
│                                              │
│ 📊 AI-Generated Ratings:                    │
│ ┌────────┬────────┬────────┬────────┐      │
│ │ 92/100 │ 88/100 │ 85/100 │ 90/100 │      │
│ │Technical│Physical│Mental  │Tactical │      │
│ └────────┴────────┴────────┴────────┘      │
│                                              │
│ 📝 Summary (from voice):                    │
│ "Excellent pace and dribbling skills..."    │
│                                              │
│ ✏️ [Edit Details] 💾 [Save Draft]           │
│ 📤 [Submit Now]   ⭐ [Add to Favorites]     │
└─────────────────────────────────────────────┘
```

**Time Saved**: 80% (from ~5 minutes to ~1 minute)

**Mobile Optimizations:**
- **Context-aware**: Detects location (stadium) and ongoing match
- **Voice-first**: Natural input, hands-free
- **AI-powered**: Auto-generates ratings and summary
- **One-handed**: All actions in thumb zone
- **Offline capable**: Syncs when connection restored

---

### 5.2 PLAYER: View and Share Digital Passport

**Optimized Flow (2 steps):**

```
Step 1: LONG-PRESS on Profile Avatar (from any screen)
┌─────────────────────────────────────────────┐
│ Quick Actions                           ✕   │
├─────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────────────────────┐      │
│  │ 📲 Share Passport (QR)            │      │
│  ├──────────────────────────────────┤      │
│  │ 📄 View Full Passport             │      │
│  ├──────────────────────────────────┤      │
│  │ ✏️ Edit Profile                   │      │
│  ├──────────────────────────────────┤      │
│  │ 📊 View Stats                     │      │
│  └──────────────────────────────────┘      │
│                                              │
└─────────────────────────────────────────────┘

Step 2: TAP "Share Passport"
┌─────────────────────────────────────────────┐
│ Digital Passport                        ✕   │
├─────────────────────────────────────────────┤
│                                              │
│      ┌───────────────────────┐              │
│      │                        │              │
│      │    ░░░░░░░░░░░░░      │              │
│      │    ░░ QR CODE ░░      │              │
│      │    ░░░░░░░░░░░░░      │              │
│      │                        │              │
│      │  Marcus Johnson        │              │
│      │  Striker • 23 years    │              │
│      └───────────────────────┘              │
│                                              │
│  📱 Share via:                               │
│  [WhatsApp] [Email] [SMS] [Copy Link]       │
│                                              │
│  💾 Save QR Code to Photos                  │
│  📄 Download PDF Passport                   │
│                                              │
└─────────────────────────────────────────────┘
```

**Mobile Optimizations:**
- **Quick access**: Long-press gesture from anywhere
- **QR code**: Instant sharing at matches, events
- **Multi-channel**: WhatsApp, email, SMS for different contexts
- **Offline available**: QR code cached locally
- **One-tap actions**: All sharing options in one screen

---

### 5.3 CLUB_CONTACT: Send Offer to Scout

**Optimized Flow (3 steps):**

```
Step 1: SWIPE RIGHT on Scout Card (in Marketplace)
┌─────────────────────────────────────────────┐
│ Scout Marketplace              🔍 🔔 ⋮      │
├─────────────────────────────────────────────┤
│                                              │
│  ┌───────────────────────────────────┐     │
│  │ 👤 Jean Martin ⭐ 4.8 (124 reviews) │ ← Swipe right
│  │ 🎯 Expertise: Forwards, U21         │     │
│  │ 📍 Paris, France                    │     │
│  │ 💶 €150/match                       │     │
│  │                                      │     │
│  │ [Send Offer →]                      │     │
│  └───────────────────────────────────┘     │
│                                              │
└─────────────────────────────────────────────┘

Step 2: QUICK OFFER MODAL (Pre-filled with AI suggestions)
┌─────────────────────────────────────────────┐
│ Send Offer to Jean Martin              ✕   │
├─────────────────────────────────────────────┤
│                                              │
│ Offer Type:                                  │
│ • [✓] Match Assignment                      │
│ • [ ] Player Report                          │
│ • [ ] Retainer                               │
│                                              │
│ 🏟️ Match: PSG vs Lyon                       │
│ 📅 Date: Tomorrow, 20:00                    │
│ 💶 Budget: €150 (standard rate)             │
│                                              │
│ 🎯 Target Players: (suggested)              │
│ [⚽ K. Benzema] [⚽ M. Mbappé]               │
│                                              │
│ 📝 Message (optional):                      │
│ ┌───────────────────────────────────┐       │
│ │ "Looking for detailed report..."   │       │
│ └───────────────────────────────────┘       │
│                                              │
│ [📤 Send Offer] [💾 Save Draft]             │
└─────────────────────────────────────────────┘

Step 3: CONFIRMATION (with undo option)
┌─────────────────────────────────────────────┐
│                                              │
│   ✅ Offer sent to Jean Martin!             │
│                                              │
│   [Undo] [View Offer] [Send Another]        │
│                                              │
└─────────────────────────────────────────────┘
```

**Mobile Optimizations:**
- **Swipe gesture**: Natural interaction for quick actions
- **AI pre-fill**: Upcoming matches, standard rates, suggested players
- **Smart defaults**: Based on scout expertise and club needs
- **Undo option**: Safety net for accidental sends
- **Progress saved**: Draft auto-saved if interrupted

---

## 6. Gesture Interactions

### 6.1 Global Gestures (All Roles)

| Gesture | Action | Context |
|---------|--------|---------|
| **Pull-to-refresh** | Refresh data | Any scrollable screen |
| **Swipe left** (list item) | Delete / Archive | Reports, notifications, messages |
| **Swipe right** (list item) | Mark as favorite / Quick action | Players, scouts, matches |
| **Long-press** (card) | Show context menu | Player cards, reports, matches |
| **Double-tap** (card) | Quick view / Favorite toggle | Images, player cards |
| **Pinch-to-zoom** | Zoom in/out | Images, stats charts |
| **Swipe down** (from top) | Show notifications | Any screen |
| **Swipe up** (from bottom) | Show quick actions | Home screen |
| **Shake device** | Report bug / Feedback | Any screen (optional) |

### 6.2 Role-Specific Gestures

#### SCOUT
```
• Swipe right on match card → Quick report
• Long-press on player → Add to watchlist
• Swipe down on camera → Quick photo capture
• Double-tap FAB → Voice note
• Swipe left on report → Delete draft
```

#### PLAYER
```
• Long-press avatar → Share passport QR
• Swipe right on opportunity → Accept
• Swipe left on opportunity → Decline
• Double-tap stats → Detailed view
• Pinch stats cards → Compare periods
```

#### CLUB_CONTACT
```
• Swipe right on scout → Send offer
• Swipe left on offer → Decline
• Long-press player card → Transfer actions
• Drag player card → Move in Kanban
• Double-tap squad → Player details
```

### 6.3 Haptic Feedback Map

| Action | Haptic Type | Intensity |
|--------|-------------|-----------|
| **Tab switch** | Selection | Light |
| **FAB tap** | Impact | Medium |
| **Swipe action** | Selection | Light |
| **Long-press** | Impact | Heavy |
| **Success action** | Notification | Success |
| **Error** | Notification | Error |
| **Delete/Archive** | Impact | Heavy |
| **Favorite toggle** | Selection | Medium |
| **Submit report** | Notification | Success |
| **Undo** | Impact | Light |

---

## 7. Quick Actions & FAB

### 7.1 FAB Design Principles

**Positioning:**
- **Default**: Bottom-right, 16dp from edges
- **One-handed mode**: Bottom-center (optional)
- **Z-index**: Above all content, below modals
- **Size**: 56dp × 56dp (Material Design standard)

**Behavior:**
- **Scroll**: Hides when scrolling down, shows when scrolling up
- **Animation**: Scale + rotate on tap
- **Speed dial**: Expands to show 2-4 secondary actions
- **Haptic feedback**: Medium impact on tap

### 7.2 Role-Specific FAB Actions

#### SCOUT FAB (Speed Dial)
```
        [📷 Photo]
            ↑
    [🎤 Voice] ← [➕ FAB] → [⭐ Favorite]
            ↓
    [📝 Quick Report]
```

**Primary**: Quick Report (tap)
**Secondary**: Voice, Photo, Favorite (long-press to reveal)

#### PLAYER FAB
```
        [📤 Share]
            ↑
            [➕ FAB]
            ↓
    [📋 Copy Passport Link]
```

**Primary**: Share Passport QR
**Secondary**: Copy link, Download PDF

#### CLUB_CONTACT FAB
```
        [👤 Add Player]
            ↑
    [💼 New Offer] ← [➕ FAB]
            ↓
        [🔍 Find Scout]
```

**Primary**: New Offer
**Secondary**: Add Player, Find Scout

#### AGENT FAB
```
        [📊 Report]
            ↑
    [📤 Share] ← [➕ FAB]
            ↓
    [📞 Contact Club]
```

**Primary**: Share Player Profile
**Secondary**: Generate Report, Contact Club

### 7.3 Context-Aware FAB

**Location-Based:**
- At stadium → "Quick Match Report"
- At camp → "Register Player"
- In marketplace → "New Offer"

**Time-Based:**
- During match → "Live Report"
- Match day → "Pre-match notes"
- Transfer window → "Send Offer"

**Data-Based:**
- Viewing player → "Add to Favorites"
- Viewing report → "Export PDF"
- Empty state → "Add First Item"

---

## 8. Offline Capabilities

### 8.1 Offline-First Architecture

**Strategy**: Store critical data locally, sync in background

```
┌─────────────────────────────────────────────┐
│ App Layer                                    │
├─────────────────────────────────────────────┤
│ React Native / Expo                          │
│                                              │
│ ┌──────────────┐      ┌──────────────┐     │
│ │ UI Components │ ←─→ │ State Mgmt   │     │
│ └──────────────┘      └──────────────┘     │
│                              ↓               │
│                      ┌──────────────┐       │
│                      │ Sync Engine  │       │
│                      └──────────────┘       │
│                         ↙        ↘          │
│              ┌──────────┐    ┌──────────┐  │
│              │Local DB   │    │ API Client│  │
│              │(SQLite)   │    │ (REST)    │  │
│              └──────────┘    └──────────┘  │
└─────────────────────────────────────────────┘
```

### 8.2 Offline Features by Role

#### SCOUT (High Priority)
**Offline Available:**
- ✅ Create reports (saved locally)
- ✅ Voice recordings
- ✅ Photo capture
- ✅ View cached players (last 100)
- ✅ View cached matches (next 30 days)
- ✅ Favorites list
- ✅ Personal notes

**Sync When Online:**
- Reports (with media)
- Player favorites
- Notes and annotations

**Storage Requirements:**
- Reports: ~1-2 MB each (with photos)
- Voice notes: ~5-10 MB per match
- Player data: ~500 KB per 100 players
- **Total**: ~50-100 MB for typical scout

#### PLAYER (Medium Priority)
**Offline Available:**
- ✅ View passport
- ✅ View stats (cached)
- ✅ View reports (last 30)
- ✅ Photo gallery
- ✅ Performance charts

**Sync When Online:**
- New opportunities
- Messages
- Updated stats

**Storage Requirements:**
- Passport: ~500 KB
- Stats & charts: ~1 MB
- Media: ~20-50 MB
- **Total**: ~25-55 MB

#### CLUB_CONTACT (Medium Priority)
**Offline Available:**
- ✅ View squad list
- ✅ View pending offers
- ✅ View cached scouts
- ✅ Draft offers (saved locally)
- ✅ Kanban board (read-only)

**Sync When Online:**
- Send offers
- Update Kanban positions
- New player requests

**Storage Requirements:**
- Squad data: ~2-3 MB
- Scout profiles: ~5-10 MB
- Offers: ~500 KB
- **Total**: ~10-15 MB

#### PUBLIC (Low Priority)
**Offline Available:**
- ✅ Browse cached players (featured)
- ✅ View camp details (saved)
- ✅ Saved searches

**Sync When Online:**
- Latest content
- New camps
- Registration

**Storage Requirements:**
- Cached content: ~5-10 MB
- **Total**: ~5-10 MB

### 8.3 Sync Strategy

**Conflict Resolution:**
```javascript
// Timestamp-based resolution
if (localData.updatedAt > serverData.updatedAt) {
  // Local is newer → Upload
  await uploadToServer(localData);
} else if (localData.updatedAt < serverData.updatedAt) {
  // Server is newer → Download
  await saveToLocal(serverData);
} else {
  // Same timestamp → Merge
  await mergeData(localData, serverData);
}
```

**Sync Priority Queue:**
1. **Critical** (immediate): Report submissions, offers
2. **High** (within 5 min): Favorites, notes, drafts
3. **Medium** (within 30 min): Media uploads, stats updates
4. **Low** (when idle): Full data refresh, cache cleanup

**Background Sync:**
- iOS: Background fetch (every 15-30 min)
- Android: WorkManager (periodic + constraints)
- Both: Expo TaskManager for background tasks

### 8.4 Offline UI Indicators

**Global Offline Banner:**
```
┌─────────────────────────────────────────────┐
│ 📡 You're offline. Changes will sync later. │
│                                          [✕] │
└─────────────────────────────────────────────┘
```

**Item-Level Indicators:**
- **Pending upload**: 🔄 icon + yellow border
- **Failed sync**: ⚠️ icon + red border
- **Successfully synced**: ✅ icon (brief animation)
- **Offline mode**: ⬇️ icon (downloaded for offline)

**Action Feedback:**
```
Tap "Submit Report" while offline:

┌─────────────────────────────────────────────┐
│ Report Saved Locally                         │
│                                              │
│ 📡 Your report will be submitted when        │
│ you're back online.                          │
│                                              │
│ [OK] [View Queue]                            │
└─────────────────────────────────────────────┘
```

---

## 9. Push Notification Strategy

### 9.1 Notification Architecture

**Tech Stack:**
- **Service**: Firebase Cloud Messaging (FCM)
- **Backend**: NestJS Notifications Module
- **Client**: Expo Notifications
- **Scheduling**: Cron jobs + Event triggers

### 9.2 Notification Categories by Role

#### SCOUT Notifications

| Type | Priority | Trigger | Example |
|------|----------|---------|---------|
| **Match Assignment** | 🔴 Critical | New assignment | "New match: PSG vs Lyon tomorrow at 20:00" |
| **Report Approved** | 🟠 High | Status change | "Your report on M. Mbappé was approved!" |
| **Report Rejected** | 🟠 High | Status change | "Report needs revision. View feedback." |
| **Match Reminder** | 🟡 Medium | 2 hours before | "Match starts in 2 hours at Parc des Princes" |
| **Player Update** | 🟡 Medium | Favorite player | "M. Mbappé stats updated - view changes" |
| **Deadline Warning** | 🔴 Critical | 24 hours before | "Report deadline tomorrow for Lyon match" |
| **New Offer** | 🟠 High | Marketplace | "Club Paris FC sent you an offer" |

**Notification Settings:**
```
Scout Notifications:
├─ Match Assignments     [🔔 ON]  [Instant]
├─ Report Status         [🔔 ON]  [Instant]
├─ Match Reminders       [🔔 ON]  [2 hours before]
├─ Player Updates        [🔕 OFF] [Daily digest]
├─ Deadline Warnings     [🔔 ON]  [1 day before]
├─ Marketplace Offers    [🔔 ON]  [Instant]
└─ Weekly Summary        [🔔 ON]  [Monday 9:00]
```

#### PLAYER Notifications

| Type | Priority | Trigger | Example |
|------|----------|---------|---------|
| **New Report** | 🟠 High | Scout submits | "New scouting report from PSG Scout" |
| **Club Interest** | 🔴 Critical | Club request | "FC Barcelona expressed interest in you!" |
| **Camp Invitation** | 🟠 High | Camp invite | "You're invited to Elite Academy Summer Camp" |
| **Agent Request** | 🟡 Medium | New agent | "John Smith wants to represent you" |
| **Performance Alert** | 🟡 Medium | AI analysis | "Your market value increased by 15%!" |
| **Message** | 🟠 High | New message | "New message from your agent" |
| **Upcoming Match** | 🟡 Medium | 1 day before | "Match tomorrow: PSG vs Monaco" |

**Notification Settings:**
```
Player Notifications:
├─ Scouting Reports      [🔔 ON]  [Instant]
├─ Club Interest         [🔔 ON]  [Instant]
├─ Camp Invitations      [🔔 ON]  [Instant]
├─ Agent Requests        [🔔 ON]  [Instant]
├─ Performance Alerts    [🔔 ON]  [Daily digest]
├─ Messages              [🔔 ON]  [Instant]
├─ Match Reminders       [🔕 OFF] [1 day before]
└─ Weekly Summary        [🔔 ON]  [Sunday 18:00]
```

#### CLUB_CONTACT Notifications

| Type | Priority | Trigger | Example |
|------|----------|---------|---------|
| **Offer Response** | 🟠 High | Scout responds | "Jean Martin accepted your offer" |
| **New Player Request** | 🟠 High | Player applies | "Marcus Johnson wants to join your club" |
| **Report Submitted** | 🟡 Medium | Scout submits | "Match report received for PSG vs Lyon" |
| **Transfer Window** | 🔴 Critical | 7 days before | "Transfer window closes in 7 days" |
| **Squad Update** | 🟡 Medium | Player status | "M. Dupont injury status changed" |
| **Marketplace Match** | 🟡 Medium | AI suggestion | "New scout matches your requirements" |

**Notification Settings:**
```
Club Notifications:
├─ Offer Responses       [🔔 ON]  [Instant]
├─ Player Requests       [🔔 ON]  [Instant]
├─ Scout Reports         [🔔 ON]  [Daily digest]
├─ Transfer Deadlines    [🔔 ON]  [Instant]
├─ Squad Updates         [🔕 OFF] [Daily digest]
├─ Marketplace Matches   [🔕 OFF] [Weekly]
└─ Monthly Report        [🔔 ON]  [1st of month]
```

#### AGENT Notifications

| Type | Priority | Trigger | Example |
|------|----------|---------|---------|
| **Player Update** | 🟠 High | Roster player | "M. Johnson received club offer" |
| **Deal Status** | 🔴 Critical | Negotiation | "Contract offer updated by FC Barcelona" |
| **Market Alert** | 🟡 Medium | Price change | "Market value alert: M. Johnson +€500K" |
| **Deadline** | 🔴 Critical | Contract | "Contract expires in 30 days" |
| **New Opportunity** | 🟠 High | Club interest | "3 clubs interested in your player" |

**Notification Settings:**
```
Agent Notifications:
├─ Player Updates        [🔔 ON]  [Instant]
├─ Deal Status           [🔔 ON]  [Instant]
├─ Market Alerts         [🔔 ON]  [Daily digest]
├─ Contract Deadlines    [🔔 ON]  [7 days before]
├─ New Opportunities     [🔔 ON]  [Instant]
└─ Performance Reports   [🔔 ON]  [Weekly]
```

### 9.3 Smart Notification Features

#### Intelligent Timing
```javascript
// Don't send during sleep hours (22:00 - 08:00)
// Unless Critical priority
if (priority === 'CRITICAL' || !isSleepTime()) {
  sendNotification();
} else {
  scheduleForMorning();
}
```

#### Notification Grouping
```
Instead of:
• New report from Scout A
• New report from Scout B
• New report from Scout C

Show:
• 3 new scouting reports
  [View All]
```

#### Action Buttons
```
┌─────────────────────────────────────────────┐
│ 🏟️ Match Tomorrow                            │
│ PSG vs Lyon • 20:00 • Parc des Princes      │
│                                              │
│ [View Details] [Add to Calendar] [Dismiss]  │
└─────────────────────────────────────────────┘
```

#### Rich Notifications (iOS/Android)
- **Images**: Player photos, club logos
- **Progress**: "Report 75% complete"
- **Media**: Audio clips, video thumbnails
- **Maps**: Stadium location preview

### 9.4 Quiet Hours & Do Not Disturb

**User Settings:**
```
Quiet Hours:
├─ Enabled               [✓]
├─ Start Time            [22:00]
├─ End Time              [08:00]
├─ Allow Critical        [✓]
├─ Weekends Only         [✗]
└─ Custom Schedule       [Edit]

Do Not Disturb During:
├─ Meetings              [✓] (Calendar integration)
├─ Match Time (Players)  [✓]
├─ Focus Mode            [✓] (iOS Focus/Android DND)
```

### 9.5 Notification Analytics

**Track & Optimize:**
- Open rate by type
- Action click rate
- Dismiss rate
- Opt-out rate
- Best time to send

**A/B Testing:**
- Message wording
- Emoji usage
- Action button text
- Send timing

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Goals:**
- Implement role detection system
- Create base navigation components
- Setup offline database (SQLite)

**Tasks:**
```
✓ Create RoleBasedNavigator component
✓ Implement bottom tab configurations per role
✓ Setup AsyncStorage for role persistence
✓ Create SQLite schema for offline data
✓ Implement basic sync engine
✓ Add role switching for testing
```

**Deliverables:**
- Role-based navigation working
- Offline storage ready
- User can switch between role views

---

### Phase 2: Scout Optimization (Weeks 3-4)

**Goals:**
- Implement SCOUT-specific features
- Voice-to-report
- Quick report creation
- Offline reporting

**Tasks:**
```
✓ Create Scout home screen
✓ Implement FAB with speed dial
✓ Build voice recording module
✓ Integrate speech-to-text (Expo Speech)
✓ Create quick report flow
✓ Offline report storage
✓ Match assignment notifications
✓ Camera integration for match photos
```

**Deliverables:**
- Scout can create reports in <1 min
- Voice reports working offline
- Match assignments with reminders

---

### Phase 3: Player & Agent (Weeks 5-6)

**Goals:**
- Player profile & passport
- Agent dashboard
- Opportunities system

**Tasks:**
```
✓ Build Player home screen
✓ Digital passport with QR code
✓ Share passport functionality
✓ Performance charts (offline)
✓ Opportunities feed
✓ Agent roster management
✓ Deal tracking system
✓ Market value alerts
```

**Deliverables:**
- Players can share passport instantly
- Agents track all roster players
- Opportunity notifications working

---

### Phase 4: Club & Marketplace (Weeks 7-8)

**Goals:**
- Club management interface
- Scout marketplace integration
- Mobile Kanban

**Tasks:**
```
✓ Build Club home screen
✓ Squad management
✓ Mobile Kanban board (drag & drop)
✓ Scout marketplace with filters
✓ Swipe-to-send-offer gesture
✓ Offer management system
✓ Player request flow
✓ Transfer deadline alerts
```

**Deliverables:**
- Clubs can manage squad on mobile
- Send offers with 3 taps
- Kanban works smoothly on mobile

---

### Phase 5: Gestures & Polish (Weeks 9-10)

**Goals:**
- Implement all gesture interactions
- Haptic feedback
- Animations
- Performance optimization

**Tasks:**
```
✓ Swipe gestures (left/right/up/down)
✓ Long-press menus
✓ Pull-to-refresh everywhere
✓ Pinch-to-zoom for images/charts
✓ Haptic feedback integration
✓ Loading skeletons
✓ Transition animations
✓ Micro-interactions
✓ Performance profiling
✓ Memory optimization
```

**Deliverables:**
- Buttery smooth 60fps
- Consistent haptic feedback
- Delightful animations
- <100ms response time

---

### Phase 6: Offline & Sync (Weeks 11-12)

**Goals:**
- Complete offline functionality
- Background sync
- Conflict resolution

**Tasks:**
```
✓ Implement sync queue
✓ Background sync (iOS/Android)
✓ Conflict resolution logic
✓ Offline indicators UI
✓ Cache management
✓ Data compression
✓ Partial sync (delta updates)
✓ Network quality detection
✓ Manual sync trigger
✓ Sync settings per role
```

**Deliverables:**
- App works 100% offline (core features)
- Syncs intelligently in background
- Users can manage sync preferences

---

### Phase 7: Notifications (Weeks 13-14)

**Goals:**
- Push notifications for all roles
- Smart scheduling
- Rich notifications

**Tasks:**
```
✓ Setup Firebase Cloud Messaging
✓ Implement notification backend (NestJS)
✓ Create notification settings UI
✓ Smart scheduling logic
✓ Rich notification templates
✓ Action buttons
✓ Grouping & bundling
✓ Deep linking
✓ Notification analytics
✓ Quiet hours implementation
```

**Deliverables:**
- All role-specific notifications working
- Users can customize preferences
- Analytics dashboard for notifications

---

### Phase 8: Testing & Refinement (Weeks 15-16)

**Goals:**
- User testing
- Bug fixes
- Performance tuning
- Documentation

**Tasks:**
```
✓ Beta testing with real users (5 per role)
✓ A/B testing navigation variations
✓ Usability testing (thumb reach, one-handed)
✓ Performance testing (low-end devices)
✓ Accessibility audit
✓ Bug fixing
✓ Documentation (user guides)
✓ Video tutorials
✓ Onboarding flow refinement
✓ Final polish
```

**Deliverables:**
- Bug-free experience
- Tested with 25+ users
- Complete documentation
- Ready for production

---

## Appendix A: Mobile UX Best Practices

### A.1 Touch Target Sizes

**Minimum Sizes:**
- Primary buttons: 48×48 dp
- Secondary buttons: 44×44 dp
- List items: 48 dp height
- FAB: 56×56 dp
- Text links: 44×44 dp tap area

**Spacing:**
- Between tappable elements: 8 dp minimum
- Around FAB: 16 dp clear space
- Bottom tabs: 16 dp padding

### A.2 Typography for Mobile

**Font Sizes:**
- Display: 32-40 sp (headlines)
- Title: 20-24 sp (page titles)
- Body: 16 sp (readable without zoom)
- Caption: 12-14 sp (metadata)
- Button: 14-16 sp (actions)

**Line Height:**
- Body text: 1.5× font size
- Headlines: 1.2× font size

**Max Line Length:**
- Optimal: 50-75 characters
- Maximum: 85 characters

### A.3 Color & Contrast

**Minimum Contrast Ratios:**
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- Interactive elements: 3:1
- Critical icons: 4.5:1

**Dark Mode:**
- Always provide dark mode
- OLED-friendly pure black (#000000)
- Reduce brightness of whites to #E0E0E0

### A.4 Loading States

**Progressive Loading:**
1. Skeleton screens (0-1s)
2. Partial content (1-3s)
3. Full content (3s+)

**Perceived Performance:**
- Show layout immediately
- Load critical content first
- Defer images/videos
- Cache aggressively

### A.5 Error Handling

**User-Friendly Errors:**
```
❌ Bad: "Error 500: Internal Server Error"
✅ Good: "Oops! We couldn't load your reports.
         [Try Again] [Go Back]"
```

**Error Recovery:**
- Always provide action buttons
- Explain what went wrong (simple language)
- Suggest next steps
- Allow retry without losing data

---

## Appendix B: Technical Implementation Details

### B.1 Role-Based Navigator Component

```typescript
// src/navigation/RoleBasedNavigator.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

// Import role-specific navigators
import ScoutNavigator from './ScoutNavigator';
import PlayerNavigator from './PlayerNavigator';
import ClubContactNavigator from './ClubContactNavigator';
import AgentNavigator from './AgentNavigator';
import AnalystNavigator from './AnalystNavigator';
import PublicNavigator from './PublicNavigator';
import AdminNavigator from './AdminNavigator';

export function RoleBasedNavigator() {
  const { user } = useAuth();

  // Get user role (with fallback to PUBLIC)
  const userRole = user?.role || UserRole.PUBLIC;

  // Render appropriate navigator based on role
  switch (userRole) {
    case UserRole.SCOUT:
      return <ScoutNavigator />;
    case UserRole.PLAYER:
      return <PlayerNavigator />;
    case UserRole.CLUB_CONTACT:
      return <ClubContactNavigator />;
    case UserRole.AGENT:
      return <AgentNavigator />;
    case UserRole.ANALYST:
      return <AnalystNavigator />;
    case UserRole.ADMIN:
    case UserRole.SUPER_ADMIN:
      return <AdminNavigator />;
    case UserRole.PUBLIC:
    default:
      return <PublicNavigator />;
  }
}
```

### B.2 FAB Component with Speed Dial

```typescript
// src/components/FAB/FloatingActionButton.tsx
import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface FABAction {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}

interface FABProps {
  primaryAction: () => void;
  secondaryActions?: FABAction[];
  icon?: string;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  primaryAction,
  secondaryActions = [],
  icon = 'add',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const toggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsExpanded(!isExpanded);

    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePrimaryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    if (secondaryActions.length > 0) {
      toggleExpand();
    } else {
      primaryAction();
    }
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <View style={styles.container}>
      {/* Secondary actions (speed dial) */}
      {isExpanded && secondaryActions.map((action, index) => (
        <Animated.View
          key={index}
          style={[
            styles.secondaryAction,
            {
              transform: [{
                translateY: -60 * (secondaryActions.length - index),
              }],
            },
          ]}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              action.onPress();
              toggleExpand();
            }}
            style={[
              styles.secondaryButton,
              { backgroundColor: action.color || '#6366f1' },
            ]}
          >
            <Ionicons name={action.icon} size={20} color="#fff" />
          </Pressable>
        </Animated.View>
      ))}

      {/* Primary FAB */}
      <Pressable
        onPress={handlePrimaryPress}
        style={styles.fab}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name={icon} size={28} color="#fff" />
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 88, // Above bottom tabs
    right: 16,
    alignItems: 'center',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e4ff3b', // ARCANE accent
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryAction: {
    position: 'absolute',
    bottom: 0,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
```

### B.3 Offline Sync Manager

```typescript
// src/services/OfflineSyncManager.ts
import SQLite from 'react-native-sqlite-storage';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SyncQueueItem {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  data: any;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: number;
  retries: number;
}

class OfflineSyncManager {
  private db: SQLite.DatabaseConnection;
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing: boolean = false;

  async initialize() {
    // Open SQLite database
    this.db = await SQLite.openDatabase({
      name: 'arcane_offline.db',
      location: 'default',
    });

    // Create sync queue table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        type TEXT,
        entity TEXT,
        data TEXT,
        priority TEXT,
        timestamp INTEGER,
        retries INTEGER
      )
    `);

    // Listen to network changes
    NetInfo.addEventListener(state => {
      if (state.isConnected && !this.isSyncing) {
        this.syncAll();
      }
    });

    // Load pending queue
    await this.loadQueue();
  }

  async addToQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>) {
    const queueItem: SyncQueueItem = {
      ...item,
      id: generateUUID(),
      timestamp: Date.now(),
      retries: 0,
    };

    this.syncQueue.push(queueItem);

    // Save to SQLite
    await this.db.executeSql(
      'INSERT INTO sync_queue VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        queueItem.id,
        queueItem.type,
        queueItem.entity,
        JSON.stringify(queueItem.data),
        queueItem.priority,
        queueItem.timestamp,
        queueItem.retries,
      ]
    );

    // Try to sync immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && !this.isSyncing) {
      this.syncAll();
    }
  }

  async syncAll() {
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      // Sort by priority and timestamp
      const sortedQueue = this.syncQueue.sort((a, b) => {
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return a.timestamp - b.timestamp;
      });

      for (const item of sortedQueue) {
        try {
          await this.syncItem(item);
          await this.removeFromQueue(item.id);
        } catch (error) {
          console.error('Sync failed for item:', item.id, error);

          // Increment retries
          item.retries++;

          // Give up after 5 retries
          if (item.retries >= 5) {
            console.error('Max retries reached, removing from queue:', item.id);
            await this.removeFromQueue(item.id);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncItem(item: SyncQueueItem) {
    // Call appropriate API endpoint based on entity and type
    const endpoint = `/api/${item.entity}`;

    switch (item.type) {
      case 'CREATE':
        await api.post(endpoint, item.data);
        break;
      case 'UPDATE':
        await api.put(`${endpoint}/${item.data.id}`, item.data);
        break;
      case 'DELETE':
        await api.delete(`${endpoint}/${item.data.id}`);
        break;
    }
  }

  private async removeFromQueue(id: string) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
    await this.db.executeSql('DELETE FROM sync_queue WHERE id = ?', [id]);
  }

  private async loadQueue() {
    const [results] = await this.db.executeSql('SELECT * FROM sync_queue');

    this.syncQueue = results.rows.map(row => ({
      ...row,
      data: JSON.parse(row.data),
    }));
  }

  getQueueCount(): number {
    return this.syncQueue.length;
  }

  getQueueItems(): SyncQueueItem[] {
    return this.syncQueue;
  }
}

export const offlineSyncManager = new OfflineSyncManager();
```

---

## Conclusion

This Mobile UX/UI Reorganization Plan provides a comprehensive roadmap for transforming the ARCANE Football mobile app into a role-specific, mobile-first platform optimized for on-the-go usage.

**Key Takeaways:**

1. **Role-Specific Design**: Each of the 8 user roles gets a tailored navigation and feature set
2. **Mobile-First Interactions**: FAB, gestures, and thumb-zone optimization reduce friction
3. **Offline Capabilities**: Core features work without internet, syncing in the background
4. **Smart Notifications**: Role-specific push notifications with intelligent timing
5. **Performance**: 60fps animations, <100ms response times, optimized workflows

**Expected Impact:**

- **80% reduction** in time to create a match report (scouts)
- **90% reduction** in time to share player passport (players)
- **70% reduction** in time to send scout offers (clubs)
- **100% offline** capability for core features
- **50% increase** in user engagement (mobile-specific features)

**Next Steps:**

1. Review this document with stakeholders
2. Prioritize roles for implementation (SCOUT → PLAYER → CLUB_CONTACT → Others)
3. Begin Phase 1 development (Foundation)
4. Conduct user testing at each phase
5. Iterate based on feedback

---

**Document Version**: 1.0
**Last Updated**: 2025-11-07
**Author**: Claude (Anthropic)
**Status**: Ready for Review
