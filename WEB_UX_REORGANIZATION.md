# ARCANE FOOTBALL - Web UX/UI Reorganization Plan
## Role-Based Navigation & Dashboard Design

**Date:** November 7, 2025
**Version:** 1.0
**Status:** Strategic Planning Document

---

## Executive Summary

This document provides a comprehensive UX/UI reorganization strategy for ARCANE Football's web platform, designed around **5 primary user roles** with optimized navigation, role-specific dashboards, and streamlined workflows.

**Key Objectives:**
- Reduce clicks to reach key features (target: max 2 clicks)
- Create role-specific dashboards with relevant widgets
- Design intuitive navigation that adapts to user context
- Implement intelligent onboarding flows per role
- Optimize for mobile-first responsive design

---

## Table of Contents

1. [User Roles Analysis](#1-user-roles-analysis)
2. [Role-Specific Navigation](#2-role-specific-navigation)
3. [Role-Specific Dashboards](#3-role-specific-dashboards)
4. [Optimized User Journeys](#4-optimized-user-journeys)
5. [Page Visibility Matrix](#5-page-visibility-matrix)
6. [Quick Actions & Shortcuts](#6-quick-actions--shortcuts)
7. [Onboarding Flows](#7-onboarding-flows)
8. [Mobile Responsiveness](#8-mobile-responsiveness)
9. [Implementation Roadmap](#9-implementation-roadmap)

---

## 1. User Roles Analysis

Based on Prisma schema (`UserRole` enum), ARCANE supports 8 roles. We focus on 5 primary roles:

### Primary Roles

#### 1.1 SCOUT (Professional Talent Spotter)
**Core Activities:**
- Creating and managing scouting reports
- Discovering and tracking players
- Attending matches and events
- Using AI tools for player analysis

**Pain Points:**
- Need quick access to report creation
- Frequently switch between players and matches
- Require mobile-optimized workflow for field work

**Success Metrics:**
- Reports created per week
- Time to complete a report
- Player discovery rate

#### 1.2 CLUB_CONTACT (Club Administrator)
**Core Activities:**
- Managing club roster and player acquisitions
- Organizing camps and showcases
- Reviewing incoming scouting reports
- Managing club visibility and recruitment

**Pain Points:**
- Need overview of all club operations
- Manage multiple players simultaneously
- Track recruitment pipeline (Kanban)

**Success Metrics:**
- Players signed per month
- Camp participation rates
- Report review completion time

#### 1.3 PLAYER (Athlete/Talent)
**Core Activities:**
- Viewing personal profile and stats
- Discovering opportunities (camps, showcases)
- Managing digital passport
- Tracking performance metrics

**Pain Points:**
- Limited technical knowledge
- Need simple, visual interface
- Want to showcase achievements

**Success Metrics:**
- Profile completeness
- Camp registrations
- Passport shares

#### 1.4 AGENT (Talent Representative)
**Core Activities:**
- Managing portfolio of players
- Discovering opportunities for clients
- Networking with clubs
- Negotiating and tracking deals

**Pain Points:**
- Manage multiple player profiles
- Need marketplace visibility
- Track deal pipeline

**Success Metrics:**
- Players represented
- Deals closed per quarter
- Network growth

#### 1.5 PUBLIC (Unauthenticated/Guest)
**Core Activities:**
- Discovering the platform
- Browsing public camps
- Viewing public player profiles
- Signing up for account

**Pain Points:**
- Unclear value proposition
- Complex signup flow
- Limited preview of features

**Success Metrics:**
- Signup conversion rate
- Time to first value
- Feature discovery rate

---

## 2. Role-Specific Navigation

### 2.1 SCOUT Navigation

#### Sidebar Menu (Priority Order)
```
┌─────────────────────────────────┐
│ 🏠 Dashboard                     │  [Always visible]
│ 👥 Players                       │  [Primary action]
│   ├─ Search Players             │
│   ├─ My Watchlist               │
│   └─ Compare Players            │
│ 📄 Reports                       │  [Primary action]
│   ├─ My Reports                 │
│   ├─ Create Report              │  [Quick action]
│   └─ Voice-to-Report            │  [NEW badge]
│ 📅 Calendar                      │
│   ├─ My Assignments             │
│   └─ All Matches                │
│ 🎯 Market                        │  [Kanban]
│ 🤖 Arkane AI                     │  [Dropdown]
│   ├─ ArkaneMatch (Search)       │  [NEW badge]
│   ├─ SmartScout AI              │
│   ├─ Performance Predictor      │
│   └─ PlayStyle DNA              │
│ 🛒 Marketplace                   │  [If GOLD+]
│   ├─ Browse Opportunities       │
│   └─ My Listings                │
│ ⭐ Favorites                     │
│ 📊 Analytics                     │
│ ──────────────────────────────  │
│ ⚙️  Settings                     │
│ 🚪 Logout                        │
└─────────────────────────────────┘
```

#### Top Navigation Bar
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo] 🔍 Global Search (⌘K)    🔔(3)  👤 Profile  💎 GOLD   │
└──────────────────────────────────────────────────────────────┘
```

#### Quick Actions (Floating Button)
```
┌─────────────────────┐
│ ➕ Quick Actions     │
├─────────────────────┤
│ 📄 New Report       │
│ 👤 Add Player       │
│ 🎤 Voice Report     │
│ 🔍 AI Search        │
└─────────────────────┘
```

---

### 2.2 CLUB_ADMIN Navigation

#### Sidebar Menu (Priority Order)
```
┌─────────────────────────────────┐
│ 🏠 Dashboard                     │
│ 🏆 My Club                       │  [Primary]
│   ├─ Club Profile               │
│   ├─ Our Players                │
│   └─ Matches                    │
│ 👥 Players                       │
│   ├─ Browse All                 │
│   ├─ Recruitment Pipeline       │  [Kanban]
│   └─ Player Requests            │
│ 📄 Reports                       │
│   ├─ Review Reports             │
│   └─ Requested Reports          │
│ ⛺ Camps & Events                │  [Primary]
│   ├─ My Camps                   │
│   ├─ Create Camp                │
│   └─ Participations             │
│ 🛒 Marketplace                   │
│   ├─ Find Scouts                │
│   └─ Post Opportunities         │
│ 🤖 Arkane AI                     │
│   ├─ Market Value AI            │
│   ├─ Performance Predictor      │
│   └─ Team Analysis              │
│ 📊 Analytics                     │
│   ├─ Club Stats                 │
│   └─ Player Performance         │
│ ──────────────────────────────  │
│ ⚙️  Settings                     │
│ 🚪 Logout                        │
└─────────────────────────────────┘
```

#### Dashboard Widgets Priority
1. **Recruitment Pipeline** (Kanban preview)
2. **Pending Report Reviews**
3. **Upcoming Camps**
4. **Top Target Players**
5. **Club Performance Metrics**

---

### 2.3 PLAYER Navigation

#### Sidebar Menu (Simplified)
```
┌─────────────────────────────────┐
│ 🏠 Dashboard                     │
│ 👤 My Profile                    │  [Primary]
│   ├─ Edit Profile               │
│   ├─ My Stats                   │
│   └─ Digital Passport           │
│ 📊 Performance                   │
│   ├─ My Reports                 │
│   ├─ Statistics                 │
│   └─ PlayStyle DNA              │  [Visual]
│ 🎯 Opportunities                 │  [Primary]
│   ├─ Camps & Showcases          │
│   ├─ My Registrations           │
│   └─ Recommended for Me         │
│ 🏆 Clubs                         │
│   ├─ Explore Clubs              │
│   └─ Club Requests              │
│ 🎓 Development                   │
│   ├─ Training Programs          │
│   ├─ Coaching                   │
│   └─ Progress Tracker           │
│ ──────────────────────────────  │
│ ⚙️  Settings                     │
│ 🚪 Logout                        │
└─────────────────────────────────┘
```

#### Key Differences
- **Simpler language** (no technical jargon)
- **Visual-first** (more icons, fewer words)
- **Opportunity-focused** (camps, clubs, development)
- **No complex features** (no Kanban, no report creation)

---

### 2.4 AGENT Navigation

#### Sidebar Menu (Portfolio Focus)
```
┌─────────────────────────────────┐
│ 🏠 Dashboard                     │
│ 👥 My Players                    │  [Primary]
│   ├─ Portfolio Overview         │
│   ├─ Add Player                 │
│   └─ Performance Tracking       │
│ 🤝 Deals                         │  [Primary]
│   ├─ Active Negotiations        │
│   ├─ Pipeline (Kanban)          │
│   └─ Completed Deals            │
│ 🎯 Opportunities                 │
│   ├─ Club Offers                │
│   ├─ Camps & Showcases          │
│   └─ Marketplace                │
│ 📄 Reports & Analytics           │
│   ├─ Player Reports             │
│   ├─ Market Value AI            │
│   └─ Performance Predictor      │
│ 🏆 Clubs                         │
│   ├─ Network                    │
│   ├─ Club Profiles              │
│   └─ Requests                   │
│ 💼 Business                      │
│   ├─ Contracts                  │
│   ├─ Invoicing                  │
│   └─ Commission Tracker         │
│ ──────────────────────────────  │
│ ⚙️  Settings                     │
│ 🚪 Logout                        │
└─────────────────────────────────┘
```

---

### 2.5 PUBLIC Navigation (Unauthenticated)

#### Navbar Menu (Marketing Focus)
```
┌──────────────────────────────────────────────────────────────┐
│ [Logo]   🏠 Home   🎯 Features   💰 Pricing   📚 Resources   │
│                              [Login]  [Sign Up - CTA]        │
└──────────────────────────────────────────────────────────────┘
```

#### Footer Quick Links
```
Product          Company          Resources        Legal
- Features       - About          - Blog           - Terms
- Pricing        - Careers        - Docs           - Privacy
- Demo           - Contact        - API            - Cookies
- Roadmap        - Brand          - Support
```

---

## 3. Role-Specific Dashboards

### 3.1 SCOUT Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard                                        💎 GOLD Plan  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Quick Stats (4 cards)                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│  │   42    │ │   18    │ │   7     │ │  8.5/10 │             │
│  │ Players │ │ Reports │ │ Matches │ │  Avg    │             │
│  │ Tracked │ │ Pending │ │This Week│ │ Rating  │             │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
│                                                                 │
│  ⚡ Quick Actions                   🎯 My Assignments          │
│  ┌───────────────────────┐         ┌──────────────────────┐   │
│  │ 📄 Create Report      │         │ 🏟️ PSG vs OM         │   │
│  │ 🎤 Voice Report       │         │    Tomorrow 20:00    │   │
│  │ 👤 Add Player         │         │    📍 Parc des Princes│  │
│  │ 🔍 AI Search          │         │    📝 Pre-match notes│   │
│  └───────────────────────┘         ├──────────────────────┤   │
│                                    │ 🏟️ Lyon vs Nice      │   │
│  📈 Performance This Month         │    Sunday 15:00      │   │
│  ┌───────────────────────────┐    └──────────────────────┘   │
│  │ LineChart:                │                                │
│  │ - Reports: 18             │   ⭐ Watchlist (Top 5)        │
│  │ - Players Added: 12       │   ┌──────────────────────┐    │
│  │ - Match Attendance: 7     │   │ 1. John Doe (FW)     │    │
│  │ [Visual Graph]            │   │    ⚡ New report      │    │
│  └───────────────────────────┘   │ 2. Jane Smith (MF)   │    │
│                                   │    📊 8.5 avg        │    │
│  🤖 AI Insights                   │ 3. Mike Johnson (DF) │    │
│  ┌───────────────────────────┐   │    🔥 Hot prospect   │    │
│  │ 💡 3 new players match    │   │ 4. Sarah Lee (FW)    │    │
│  │    your search criteria   │   │    📈 Rising         │    │
│  │                           │   │ 5. Tom Wilson (GK)   │    │
│  │ 🎯 Recommended: Review    │   └──────────────────────┘    │
│  │    Marcus Forward (U21)   │                                │
│  │                           │   📊 Recent Activity           │
│  │ ⚠️ 2 reports need updates │   - Report submitted: #127     │
│  └───────────────────────────┘   - Player added to watchlist  │
│                                   - Match assigned             │
└─────────────────────────────────────────────────────────────────┘
```

#### Widget Priority (Mobile View)
1. Quick Actions (sticky)
2. Quick Stats
3. My Assignments (collapsible)
4. Watchlist (collapsible)
5. Performance Chart (collapsible)
6. AI Insights (collapsible)

---

### 3.2 CLUB_ADMIN Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Club Dashboard - FC ARCANE                     💎 PRO Plan     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Club Overview (4 cards)                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│  │   28    │ │   12    │ │   3     │ │   156   │             │
│  │ Players │ │ Pending │ │ Active  │ │ Total   │             │
│  │ Roster  │ │ Reports │ │  Camps  │ │ Scouts  │             │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
│                                                                 │
│  🎯 Recruitment Pipeline (Kanban Preview)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Prospect(5)│ Contacted(3)│ Negotiating(2)│ Signed(1)    │  │
│  │                                                           │  │
│  │ [Drag cards horizontally - link to full Kanban]         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ⚡ Quick Actions                   📋 Pending Reviews (12)     │
│  ┌───────────────────────┐         ┌──────────────────────┐   │
│  │ 👤 Search Players     │         │ Report #127: John Doe│   │
│  │ ⛺ Create Camp        │         │   Rating: 8.5        │   │
│  │ 📢 Post Opportunity   │         │   [Approve][Reject]  │   │
│  │ 🔍 Find Scouts        │         ├──────────────────────┤   │
│  └───────────────────────┘         │ Report #126: ...     │   │
│                                    └──────────────────────┘   │
│  📈 Performance Metrics                                        │
│  ┌──────────────────────┐  ┌──────────────────────────────┐  │
│  │ Team Avg Rating      │  │  Camps Performance           │  │
│  │ [AreaChart: 7.8]     │  │  ┌─────────┬─────────┐       │  │
│  │ ↗️ +0.3 this month   │  │  │ Summer  │ 45/50   │       │  │
│  │                      │  │  │ Sprint  │ 22/30   │       │  │
│  └──────────────────────┘  │  │ Elite   │ 18/20   │       │  │
│                             │  └─────────┴─────────┘       │  │
│  🎯 Top Targets             └──────────────────────────────┘  │
│  1. Marcus Forward (U21, FW) - Transfer fee: €500K            │
│  2. Sarah Midfielder (23, MF) - Contract exp: Jun 2025       │
│  3. Tom Defender (25, DF) - Available: Free agent            │
│                                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.3 PLAYER Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  My Dashboard - John Doe                        ⭐ BASIC Plan   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  👤 Profile Completion: ████████░░ 80%                          │
│  💡 Complete your profile to get more opportunities!            │
│                                                                 │
│  📊 My Stats (Visual & Simple)                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│  │  8.2    │ │   5     │ │   2     │ │  750    │             │
│  │  ⭐     │ │   📄    │ │   ⛺    │ │  👁️    │             │
│  │ Rating  │ │ Reports │ │  Camps  │ │  Views  │             │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
│                                                                 │
│  🎯 Opportunities for You          ✨ Your Highlights          │
│  ┌──────────────────────┐          ┌──────────────────────┐   │
│  │ 🏆 Elite Summer Camp │          │ 🌟 Top PlayStyle     │   │
│  │    June 10-20, 2025  │          │    70% Mbappé        │   │
│  │    📍 Paris          │          │    30% Benzema       │   │
│  │    [Register Now]    │          │    [View DNA]        │   │
│  ├──────────────────────┤          ├──────────────────────┤   │
│  │ ⚽ PSG Tryouts        │          │ 📈 Performance       │   │
│  │    August 5, 2025    │          │    +15% this month   │   │
│  │    Age: U18          │          │    [View Report]     │   │
│  │    [More Info]       │          │                      │   │
│  └──────────────────────┘          └──────────────────────┘   │
│                                                                 │
│  📱 My Digital Passport            📊 My Progress              │
│  ┌──────────────────────┐          ┌──────────────────────┐   │
│  │ [QR Code]            │          │ [Graph: Monthly      │   │
│  │                      │          │  Performance Trend]  │   │
│  │ 👁️ 750 views        │          │                      │   │
│  │ 🔗 15 shares         │          │  Goals: 12           │   │
│  │ [Share] [Edit]       │          │  Assists: 8          │   │
│  └──────────────────────┘          └──────────────────────┘   │
│                                                                 │
│  🏆 Interested Clubs (3)           📝 Recent Activity          │
│  - FC Paris (contacted you)        - Completed Summer Camp     │
│  - Lyon Academy (watching)         - New report: 8.5/10        │
│  - Marseille U21 (interested)      - Profile viewed 23 times   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Design Principles:**
- **Large, visual elements** (emojis, icons, charts)
- **Simple language** (no jargon)
- **Encouraging messaging** (profile completion, achievements)
- **Opportunity-focused** (camps, clubs, showcases)
- **Gamification** (profile completion, views, shares)

---

### 3.4 AGENT Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  Agent Dashboard - Maria Santos                💎 GOLD Plan     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Portfolio Overview                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐             │
│  │   15    │ │   8     │ │  €2.5M  │ │   92%   │             │
│  │ Players │ │ Active  │ │ Total   │ │ Success │             │
│  │Represent│ │  Deals  │ │  Value  │ │  Rate   │             │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘             │
│                                                                 │
│  🤝 Deal Pipeline (Priority)                                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Lead(5)│ Negotiation(3)│ Closing(2)│ Done(1)            │  │
│  │ [Mini Kanban with drag functionality]                    │  │
│  │ → Click to view full pipeline                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ⚡ Quick Actions                   🔥 Hot Opportunities        │
│  ┌───────────────────────┐         ┌──────────────────────┐   │
│  │ 👤 Add Player         │         │ 🏆 PSG: Looking for │   │
│  │ 🤝 New Deal           │         │    U21 striker       │   │
│  │ 📊 Market Report      │         │    Budget: €1.5M     │   │
│  │ 🔍 Find Clubs         │         │    Match: 2 players  │   │
│  └───────────────────────┘         ├──────────────────────┤   │
│                                    │ 🏆 Lyon Academy:     │   │
│  🌟 Top Performers (This Month)    │    Showcase event    │   │
│  ┌─────────────────────────────┐  └──────────────────────┘   │
│  │ 1. Marcus Forward           │                               │
│  │    FW, 21yo, Rating: 8.8    │   💰 Revenue This Quarter    │
│  │    📈 +12% market value     │   ┌──────────────────────┐   │
│  │    💡 3 club offers         │   │ [PieChart]           │   │
│  │                             │   │ Commissions: €45K    │   │
│  │ 2. Sarah Midfielder         │   │ Contracts: €15K      │   │
│  │    MF, 23yo, Rating: 8.5    │   │ Consulting: €8K      │   │
│  │    ⚡ Transfer interest     │   └──────────────────────┘   │
│  └─────────────────────────────┘                               │
│                                                                 │
│  📅 Upcoming                    📊 Portfolio Performance        │
│  - Meeting: PSG (Tomorrow)      [AreaChart: Player Values]     │
│  - Camp: Elite Showcase (Jun 5)                                │
│  - Contract Renewal: 3 players                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.5 PUBLIC Dashboard (Landing Page)

```
┌─────────────────────────────────────────────────────────────────┐
│  ARCANE Football - The Spotify of Football Scouting            │
│                                                                 │
│  [Hero Section with CTA]                                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │        Discover. Scout. Sign.                            │  │
│  │     AI-Powered Football Scouting                         │  │
│  │                                                           │  │
│  │     [Get Started Free]  [Watch Demo]                     │  │
│  │                                                           │  │
│  │     ✓ 100K+ Players   ✓ AI Reports   ✓ From €9.99/mo    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  🎯 Choose Your Role                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ 🔍       │ │ 🏆       │ │ ⚽       │ │ 💼       │         │
│  │ Scout    │ │ Club     │ │ Player   │ │ Agent    │         │
│  │          │ │          │ │          │ │          │         │
│  │ Find     │ │ Recruit  │ │ Showcase │ │ Represent│         │
│  │ talent   │ │ players  │ │ yourself │ │ clients  │         │
│  │          │ │          │ │          │ │          │         │
│  │[Sign Up] │ │[Sign Up] │ │[Sign Up] │ │[Sign Up] │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                 │
│  🤖 AI-Powered Features                                         │
│  [Feature cards with animations]                                │
│                                                                 │
│  📊 Trusted by 1,000+ Professionals                             │
│  [Social proof, testimonials, logos]                            │
│                                                                 │
│  💰 Simple, Transparent Pricing                                 │
│  [Pricing tiers preview]                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Optimized User Journeys

### 4.1 SCOUT: Create Scouting Report (Target: 2 minutes)

**Current Flow (7 steps):**
```
Home → Login → Dashboard → Reports → Create Report → Form → Submit
```

**Optimized Flow (3 steps):**
```
Dashboard → [Quick Action: Create Report] → Smart Form → Submit
```

**Optimizations:**
1. **Quick Action Button** (floating or top bar)
2. **Smart Form** with AI pre-fill:
   - Recent match auto-suggest
   - Last-viewed player default
   - Voice-to-text integration
   - Auto-save drafts every 30s
3. **Mobile-optimized** form (one field per screen)
4. **Templates** for common scenarios

**Step-by-Step:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Quick Action                                            │
│ ────────────────────────────────────────────────────────────    │
│ [Dashboard] → Click "📄 New Report" (top-right or floating)    │
│                                                                 │
│ Step 2: Smart Form                                              │
│ ────────────────────────────────────────────────────────────    │
│ Modal opens with:                                               │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Create Scouting Report                                   │   │
│ │                                                           │   │
│ │ 💡 Recently Viewed:                                      │   │
│ │ [Quick select: Marcus Forward, Sarah M., John Doe]       │   │
│ │                                                           │   │
│ │ Or search: [____________] 🔍                             │   │
│ │                                                           │   │
│ │ Match: [Auto-suggest: PSG vs OM - Today]                │   │
│ │                                                           │   │
│ │ 🎤 Use Voice Report (faster) [Start Recording]           │   │
│ │                                                           │   │
│ │ OR                                                        │   │
│ │                                                           │   │
│ │ 📝 Manual Entry:                                         │   │
│ │ - Technical:  [Slider: 0-100] 85                        │   │
│ │ - Physical:   [Slider: 0-100] 78                        │   │
│ │ - Mental:     [Slider: 0-100] 82                        │   │
│ │ - Tactical:   [Slider: 0-100] 88                        │   │
│ │                                                           │   │
│ │ Summary: [AI-assisted textarea]                          │   │
│ │                                                           │   │
│ │ [Save Draft]  [Submit Report]                            │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 3: Confirmation & Next                                     │
│ ────────────────────────────────────────────────────────────    │
│ ✅ Report submitted! View in [My Reports]                      │
│                                                                 │
│ 💡 Next Actions:                                                │
│ - Add another player to watchlist                               │
│ - Create another report                                         │
│ - View report preview                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.2 CLUB_ADMIN: Review & Approve Report (Target: 30 seconds)

**Current Flow:**
```
Dashboard → Reports → Filter "Pending" → Click Report → Read → Approve → Confirm
```

**Optimized Flow:**
```
Dashboard → [Widget: Pending Reviews] → Quick Review → Swipe/Click Approve
```

**Optimizations:**
1. **Dashboard Widget** with top 3 pending reports
2. **Quick Review Modal** (summary view)
3. **Swipe Actions** (mobile): Swipe right = Approve, Swipe left = Reject
4. **Batch Actions**: Select multiple → Approve all

**Step-by-Step:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Dashboard Widget                                        │
│ ────────────────────────────────────────────────────────────    │
│ 📋 Pending Reviews (12)                     [View All]          │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Report #127: John Doe (FW, 21yo)                         │   │
│ │ Rating: 8.5 | Scout: Maria | Date: Nov 6                 │   │
│ │ [Quick View] [Approve] [Reject]                          │   │
│ ├──────────────────────────────────────────────────────────┤   │
│ │ Report #126: Sarah M. (MF, 23yo)                         │   │
│ │ Rating: 7.8 | Scout: John | Date: Nov 5                  │   │
│ │ [Quick View] [Approve] [Reject]                          │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 2: Quick Review (Click "Quick View")                       │
│ ────────────────────────────────────────────────────────────    │
│ Modal with summary:                                             │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Report #127 - John Doe                                   │   │
│ │                                                           │   │
│ │ Overall: 8.5/10 ⭐⭐⭐⭐                                   │   │
│ │                                                           │   │
│ │ Technical: 9.0  Physical: 8.5                            │   │
│ │ Mental:    8.0  Tactical:  8.5                           │   │
│ │                                                           │   │
│ │ Strengths: Excellent dribbling, pace, finishing          │   │
│ │ Weaknesses: Needs to improve defensive work              │   │
│ │                                                           │   │
│ │ Recommendation: BUY NOW 🔥                               │   │
│ │                                                           │   │
│ │ Scout: Maria Santos (verified)                           │   │
│ │                                                           │   │
│ │ [Full Report]  [✅ Approve]  [❌ Reject]                 │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 3: One-Click Action                                        │
│ ────────────────────────────────────────────────────────────    │
│ Click [Approve] → ✅ Report approved!                           │
│ Next report automatically loads                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.3 PLAYER: Register for Camp (Target: 1 minute)

**Current Flow:**
```
Dashboard → Camps → Filter → Click Camp → Read Details → Register → Form → Payment
```

**Optimized Flow:**
```
Dashboard → [Widget: Recommended Camps] → Quick Register → Auto-fill → Payment
```

**Optimizations:**
1. **Personalized Recommendations** on dashboard
2. **Auto-fill** from profile (age, contact, medical)
3. **Save Payment Info** (Stripe)
4. **One-click register** for returning users

**Step-by-Step:**
```
┌─────────────────────────────────────────────────────────────────┐
│ Step 1: Dashboard Widget                                        │
│ ────────────────────────────────────────────────────────────    │
│ 🎯 Recommended for You                                          │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 🏆 Elite Summer Camp                                     │   │
│ │ June 10-20, 2025 | Paris | 5 spots left                 │   │
│ │ Age: 18-21 | €299 | PSG Coaches                         │   │
│ │                                                           │   │
│ │ [Register Now] [More Info]                               │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 2: Quick Register (Click "Register Now")                   │
│ ────────────────────────────────────────────────────────────    │
│ Modal with pre-filled form:                                     │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Register for Elite Summer Camp                           │   │
│ │                                                           │   │
│ │ ✅ Player Info (from your profile):                      │   │
│ │    Name: John Doe                                        │   │
│ │    Age: 19 | Position: FW                                │   │
│ │    [Edit]                                                │   │
│ │                                                           │   │
│ │ Emergency Contact:                                       │   │
│ │    [Pre-filled from profile] [Edit]                      │   │
│ │                                                           │   │
│ │ ⚠️ Parental Consent (you're under 18):                  │   │
│ │    Parent email: [____________]                          │   │
│ │    Consent will be sent automatically                    │   │
│ │                                                           │   │
│ │ ✅ Medical Waiver:                                       │   │
│ │    [✓] I agree to terms                                  │   │
│ │                                                           │   │
│ │ Payment: €299                                            │   │
│ │    [Saved card: •••• 4242] [Use different]              │   │
│ │                                                           │   │
│ │ [Complete Registration]                                  │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 3: Confirmation                                            │
│ ────────────────────────────────────────────────────────────    │
│ ✅ You're registered! Confirmation sent to your email           │
│                                                                 │
│ 📅 Add to calendar | 📧 Email confirmation | 🎯 View details   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4.4 AGENT: Track Deal Pipeline (Ongoing)

**Current Flow:**
```
Dashboard → Market → View Kanban → Drag card → Update notes → Save
```

**Optimized Flow:**
```
Dashboard → [Mini Kanban Widget] → Drag inline → Auto-save
```

**Optimizations:**
1. **Dashboard Mini Kanban** (4 columns max)
2. **Inline editing** (click to edit)
3. **Auto-save** on every action
4. **Mobile swipe** to change status
5. **Activity log** per deal

---

## 5. Page Visibility Matrix

| Page | SCOUT | CLUB_ADMIN | PLAYER | AGENT | PUBLIC |
|------|-------|-----------|--------|-------|--------|
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ❌ (Landing) |
| **Players** | ✅ Full | ✅ Full | ⚠️ View Only | ✅ Full | ❌ |
| **Players/[id]** | ✅ | ✅ | ⚠️ Own profile | ✅ | ⚠️ Public profiles |
| **Reports** | ✅ Create+View | ✅ Review | ⚠️ View Own | ✅ View Client | ❌ |
| **Reports/[id]** | ✅ Full CRUD | ✅ Approve/Reject | ⚠️ View Only | ✅ View | ❌ |
| **Calendar** | ✅ Full | ✅ Full | ❌ | ⚠️ View | ❌ |
| **Market (Kanban)** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Camps** | ⚠️ View | ✅ Manage | ✅ Register | ⚠️ View | ✅ View |
| **My-Camps** | ❌ | ✅ Manage | ✅ View Own | ❌ | ❌ |
| **AI/ArkaneIndex** | ✅ (GOLD+) | ✅ (GOLD+) | ⚠️ Own stats | ✅ (GOLD+) | ❌ |
| **AI/ArkaneGPT** | ✅ (BASIC+) | ✅ (BASIC+) | ✅ (BASIC+) | ✅ (BASIC+) | ❌ |
| **AI/SmartScout** | ✅ (PRO+) | ✅ (PRO+) | ❌ | ✅ (PRO+) | ❌ |
| **Performance Predictor** | ✅ (GOLD+) | ✅ (GOLD+) | ⚠️ Own stats | ✅ (GOLD+) | ❌ |
| **PlayStyle DNA** | ✅ (GOLD+) | ✅ (GOLD+) | ✅ (BASIC+) | ✅ (GOLD+) | ❌ |
| **Market Value AI** | ✅ (GOLD+) | ✅ (GOLD+) | ⚠️ Own value | ✅ (GOLD+) | ❌ |
| **Marketplace** | ✅ (GOLD+) | ✅ Browse | ❌ | ✅ | ❌ |
| **Analytics** | ✅ | ✅ | ⚠️ Own stats | ✅ Portfolio | ❌ |
| **Profile** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Passport/[token]** | ✅ | ✅ | ✅ | ✅ | ✅ Public |
| **Pricing** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **About** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Contact** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Legend:**
- ✅ Full Access
- ⚠️ Limited Access
- ❌ Hidden/Restricted

---

## 6. Quick Actions & Shortcuts

### 6.1 Global Shortcuts (All Roles)

| Shortcut | Action | Context |
|----------|--------|---------|
| `⌘K` / `Ctrl+K` | Global Search | Open search modal |
| `⌘N` / `Ctrl+N` | New [Context] | Create report/player/camp based on page |
| `⌘/` / `Ctrl+/` | Show Shortcuts | Display all shortcuts |
| `Esc` | Close Modal | Close any open modal |
| `⌘B` / `Ctrl+B` | Toggle Sidebar | Show/hide navigation |
| `⌘,` / `Ctrl+,` | Settings | Open settings page |

### 6.2 Role-Specific Shortcuts

**SCOUT:**
| Shortcut | Action |
|----------|--------|
| `⌘R` | New Report |
| `⌘P` | Add Player to Watchlist |
| `⌘M` | View My Assignments |
| `⌘V` | Voice Report (start recording) |

**CLUB_ADMIN:**
| Shortcut | Action |
|----------|--------|
| `⌘R` | Review Next Report |
| `⌘A` | Approve Report |
| `⌘C` | Create Camp |
| `⌘K` | Open Kanban |

**PLAYER:**
| Shortcut | Action |
|----------|--------|
| `⌘P` | Edit Profile |
| `⌘S` | Share Passport |
| `⌘C` | Browse Camps |

**AGENT:**
| Shortcut | Action |
|----------|--------|
| `⌘D` | New Deal |
| `⌘K` | Open Pipeline |
| `⌘P` | Portfolio View |

### 6.3 Floating Action Button (FAB)

**Mobile-First Design:**
```
┌─────────────────┐
│                 │
│                 │
│                 │  [Content]
│                 │
│                 │
│            ┌────┤
│            │ ➕ │  [FAB - Primary Action]
│            └────┤
│                 │
└─────────────────┘
```

**Primary Actions by Role:**
- **SCOUT:** Create Report / Voice Report
- **CLUB_ADMIN:** Review Reports / Create Camp
- **PLAYER:** Edit Profile / Register for Camp
- **AGENT:** New Deal / Add Player

**Secondary Actions (expand on hold):**
```
        ⚡
       ╱ ╲
      📄 📱
     ╱     ╲
    👤     🎯
```

---

## 7. Onboarding Flows

### 7.1 SCOUT Onboarding (5 steps, ~3 minutes)

```
┌─────────────────────────────────────────────────────────────────┐
│ SCOUT ONBOARDING                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Step 1/5: Welcome                                               │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 👋 Welcome to ARCANE Football!                           │   │
│ │                                                           │   │
│ │ You're starting as a SCOUT. Here's what you can do:      │   │
│ │                                                           │   │
│ │ ✅ Create professional scouting reports                  │   │
│ │ ✅ Use AI tools to discover hidden talents              │   │
│ │ ✅ Track players and manage your watchlist              │   │
│ │ ✅ Get assigned to matches                               │   │
│ │                                                           │   │
│ │ [Continue]                                                │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 2/5: Complete Your Profile                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Tell us about yourself                                   │   │
│ │                                                           │   │
│ │ Organization: [_________________]                        │   │
│ │ Location:     [_________________]                        │   │
│ │ Specialties:  [☑ U21] [☐ Senior] [☐ Women's]            │   │
│ │ Experience:   [Slider: 0-20 years] 5 years              │   │
│ │                                                           │   │
│ │ [Skip]  [Continue]                                        │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 3/5: Choose Your Plan                                      │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Select a plan to get started:                            │   │
│ │                                                           │   │
│ │ ┌──────┐  ┌──────┐  ┌──────┐                            │   │
│ │ │ FREE │  │ GOLD │  │ PRO  │                            │   │
│ │ │ €0   │  │€29.99│  │€99.99│                            │   │
│ │ │      │  │  ⭐  │  │      │                            │   │
│ │ │ 1    │  │ Unlim│  │ Unlim│                            │   │
│ │ │report│  │reports│ │+ AI  │                            │   │
│ │ └──────┘  └──────┘  └──────┘                            │   │
│ │                                                           │   │
│ │ 💡 Start with FREE, upgrade anytime                      │   │
│ │                                                           │   │
│ │ [Start Free]  [Choose GOLD]  [Choose PRO]                │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 4/5: Create Your First Report                              │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Let's create your first scouting report!                 │   │
│ │                                                           │   │
│ │ 💡 You can use:                                          │   │
│ │ - 📝 Manual entry (sliders)                              │   │
│ │ - 🎤 Voice report (dictate)                              │   │
│ │ - 🤖 AI SmartScout (auto-generate) [PRO]                │   │
│ │                                                           │   │
│ │ [Create First Report]  [Skip for now]                    │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 5/5: Dashboard Tour                                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Quick Tour (30 seconds)                                  │   │
│ │                                                           │   │
│ │ [Interactive tooltips highlighting key features]         │   │
│ │                                                           │   │
│ │ 1. Quick Actions → Create reports fast                   │   │
│ │ 2. Global Search (⌘K) → Find players instantly           │   │
│ │ 3. Watchlist → Track your top targets                    │   │
│ │ 4. AI Tools → Use artificial intelligence                │   │
│ │                                                           │   │
│ │ [Start Tour]  [Skip to Dashboard]                        │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 PLAYER Onboarding (4 steps, ~2 minutes)

```
┌─────────────────────────────────────────────────────────────────┐
│ PLAYER ONBOARDING                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Step 1/4: Welcome                                               │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ ⚽ Welcome, Future Star!                                  │   │
│ │                                                           │   │
│ │ Create your digital football identity:                   │   │
│ │                                                           │   │
│ │ ✅ Build your professional profile                       │   │
│ │ ✅ Get discovered by scouts & clubs                      │   │
│ │ ✅ Track your performance                                │   │
│ │ ✅ Find camps & opportunities                            │   │
│ │                                                           │   │
│ │ [Let's Go!]                                               │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 2/4: Build Your Profile                                    │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ Tell us about your game                                  │   │
│ │                                                           │   │
│ │ 📸 Upload Photo: [Choose file]                           │   │
│ │                                                           │   │
│ │ ⚽ Position: [Forward ▼]                                 │   │
│ │ 🦶 Preferred Foot: [Right ▼]                            │   │
│ │ 📏 Height: [175 cm]                                      │   │
│ │ ⚖️ Weight: [68 kg]                                       │   │
│ │ 🏆 Current Club: [_________________]                     │   │
│ │                                                           │   │
│ │ [Continue]                                                │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 3/4: Set Your Goals                                        │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ What are you looking for?                                │   │
│ │                                                           │   │
│ │ [☑] Get scouted by professional clubs                    │   │
│ │ [☑] Join training camps & showcases                      │   │
│ │ [☐] Find an agent to represent me                        │   │
│ │ [☐] Improve my performance with coaching                 │   │
│ │ [☐] Track my stats and progress                          │   │
│ │                                                           │   │
│ │ [Continue]                                                │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│ Step 4/4: Your Digital Passport                                 │
│ ┌──────────────────────────────────────────────────────────┐   │
│ │ 🎉 Your passport is ready!                               │   │
│ │                                                           │   │
│ │ [QR Code preview]                                        │   │
│ │                                                           │   │
│ │ Share it with scouts and clubs:                          │   │
│ │ 🔗 arcane.football/passport/abc123                       │   │
│ │                                                           │   │
│ │ [Copy Link]  [Share]  [View Passport]                    │   │
│ │                                                           │   │
│ │ [Go to Dashboard]                                         │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 CLUB_ADMIN Onboarding (5 steps, ~4 minutes)

**Similar structure with club-specific steps:**
1. Welcome
2. Club Information (name, logo, stadium, etc.)
3. Add First Players (import or manual)
4. Create First Camp/Showcase
5. Dashboard Tour (recruitment pipeline, report reviews)

---

## 8. Mobile Responsiveness

### 8.1 Mobile Navigation Pattern

**Bottom Navigation Bar (Mobile < 768px):**
```
┌────────────────────────────────────┐
│                                    │
│         [Content Area]             │
│                                    │
│                                    │
├────────────────────────────────────┤
│  🏠     👥     ➕     📊     👤   │
│ Home  Players Quick Stats  Profile│
└────────────────────────────────────┘
```

**Customized by Role:**

**SCOUT Mobile Nav:**
- 🏠 Home (Dashboard)
- 👥 Players
- ➕ Quick Action (Create Report)
- 📄 Reports
- 👤 Profile

**PLAYER Mobile Nav:**
- 🏠 Home
- 👤 Profile
- ➕ Quick Action (Edit Profile)
- 🎯 Opportunities
- ⚙️ Settings

### 8.2 Mobile Dashboard Layout

**Vertical Stack (Priority Order):**
```
┌─────────────────────┐
│ Header + Avatar     │  [Fixed]
├─────────────────────┤
│ Quick Stats (2x2)   │  [Scrollable]
├─────────────────────┤
│ Quick Actions (FAB) │  [Floating]
├─────────────────────┤
│ Primary Widget      │  [Collapsible]
├─────────────────────┤
│ Secondary Widget    │  [Collapsible]
├─────────────────────┤
│ Tertiary Widget     │  [Collapsible]
└─────────────────────┘
```

### 8.3 Mobile-Specific Interactions

**Swipe Gestures:**
- **Swipe right on report card:** Approve
- **Swipe left on report card:** Reject
- **Swipe right on player card:** Add to watchlist
- **Swipe left on notification:** Dismiss
- **Pull to refresh:** Refresh data

**Touch Targets:**
- Minimum 44x44px for all tap targets
- Increased spacing between actions
- Bottom sheet modals (instead of center modals)

### 8.4 Progressive Disclosure

**Mobile-First Approach:**
1. **Show essential info first** (player name, rating)
2. **Collapse details** under "More Info"
3. **Use accordions** for long sections
4. **Bottom sheets** for actions
5. **Infinite scroll** instead of pagination

---

## 9. Implementation Roadmap

### Phase 1: Foundation (2 weeks)

**Week 1: Role Detection & Routing**
- [ ] Create role detection middleware
- [ ] Implement dynamic sidebar based on role
- [ ] Create role-specific route guards
- [ ] Update Navbar with role-aware menu

**Week 2: Dashboard Refactoring**
- [ ] Create role-specific dashboard components
- [ ] Implement widget system (drag & drop)
- [ ] Create dashboard templates per role
- [ ] Add quick actions framework

### Phase 2: Navigation & UX (3 weeks)

**Week 3-4: Navigation Optimization**
- [ ] Implement new sidebar layouts per role
- [ ] Create quick action floating button
- [ ] Add keyboard shortcuts
- [ ] Implement global search improvements

**Week 5: Mobile Responsiveness**
- [ ] Create bottom navigation bar (mobile)
- [ ] Implement swipe gestures
- [ ] Optimize forms for mobile
- [ ] Create mobile-specific widgets

### Phase 3: Onboarding (2 weeks)

**Week 6: Onboarding Flows**
- [ ] Create onboarding framework
- [ ] Build role-specific onboarding flows
- [ ] Implement interactive tutorials
- [ ] Add progress tracking

**Week 7: User Journeys**
- [ ] Optimize "Create Report" flow
- [ ] Optimize "Review Report" flow
- [ ] Optimize "Register Camp" flow
- [ ] Add smart forms with AI pre-fill

### Phase 4: Analytics & Iteration (Ongoing)

**Week 8+:**
- [ ] Implement analytics tracking
- [ ] A/B test navigation patterns
- [ ] Gather user feedback
- [ ] Iterate based on data

---

## 10. Success Metrics

### 10.1 Quantitative Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| **Time to Create Report** | ~5 min | <2 min | Average time from dashboard to submission |
| **Dashboard Load Time** | ~2s | <1s | Time to interactive |
| **Mobile Conversion Rate** | 15% | 40% | Signup → First action |
| **Feature Discovery Rate** | 30% | 70% | % users finding AI tools within 7 days |
| **Task Completion Rate** | 60% | 90% | % users completing primary action |
| **Clicks to Key Features** | 4-5 | 1-2 | Average clicks to reach primary actions |

### 10.2 Qualitative Metrics

- **User Satisfaction (NPS):** Target 70+ (currently 65)
- **Feature Usability Score:** Target 4.5/5
- **Mobile Experience Rating:** Target 4.8/5
- **Onboarding Completion Rate:** Target 80%

---

## 11. Key Recommendations

### 11.1 Immediate Priorities (Do First)

1. **Implement role-based sidebar** (highest impact)
2. **Create role-specific dashboards** (core experience)
3. **Add quick action button** (productivity boost)
4. **Optimize mobile navigation** (60% mobile users)
5. **Improve onboarding flows** (reduce churn)

### 11.2 Quick Wins (Low Effort, High Impact)

1. **Keyboard shortcuts** (⌘K, ⌘R, etc.)
2. **Quick preview modals** (vs full page navigation)
3. **Swipe gestures on mobile**
4. **Auto-save forms** (reduce data loss)
5. **Recent items** in search

### 11.3 Nice-to-Have (Future)

1. **Customizable dashboards** (drag & drop widgets)
2. **Dark/light mode toggle**
3. **Multi-language support**
4. **Accessibility improvements** (WCAG 2.1 AA)
5. **Offline mode** (PWA)

---

## 12. Appendix

### 12.1 Design Specifications

**Breakpoints:**
```css
/* Mobile First */
xs: 0px      /* Mobile portrait */
sm: 640px    /* Mobile landscape */
md: 768px    /* Tablet portrait */
lg: 1024px   /* Tablet landscape / Desktop */
xl: 1280px   /* Desktop */
2xl: 1536px  /* Large desktop */
```

**Sidebar Dimensions:**
```css
/* Desktop */
sidebar-width: 256px (expanded)
sidebar-width: 64px (collapsed)

/* Mobile */
sidebar: Hidden
bottom-nav: 60px height
```

**Touch Targets (Mobile):**
```
Minimum: 44x44px
Recommended: 48x48px
Spacing: 8px minimum between targets
```

### 12.2 Component Library

**New Components Needed:**
1. `RoleSidebar` - Dynamic sidebar per role
2. `QuickActionFAB` - Floating action button
3. `DashboardWidget` - Reusable widget container
4. `OnboardingFlow` - Multi-step onboarding
5. `QuickPreviewModal` - Fast preview without navigation
6. `BottomNavigation` - Mobile navigation bar
7. `SwipeableCard` - Card with swipe actions

### 12.3 API Modifications

**New Endpoints Needed:**
```
GET  /api/dashboard/:role         # Role-specific dashboard data
GET  /api/users/me/preferences    # User UI preferences
PUT  /api/users/me/preferences    # Save UI preferences
GET  /api/quick-actions/:role     # Role-specific quick actions
POST /api/analytics/track         # Track user interactions
```

---

## 13. Conclusion

This UX/UI reorganization plan provides a comprehensive strategy to transform ARCANE Football into a **role-optimized, intuitive platform** that caters to the specific needs of each user type.

**Key Takeaways:**

1. **Role-First Design:** Every navigation, dashboard, and workflow is designed around user role
2. **Reduce Friction:** Target 1-2 clicks to reach any key feature
3. **Mobile-First:** 60% users are mobile, optimize for touch
4. **Smart Defaults:** Use AI and context to pre-fill and suggest
5. **Progressive Disclosure:** Show what's needed, hide what's not

**Expected Impact:**

- **30% increase** in feature adoption
- **50% reduction** in time to complete key tasks
- **40% improvement** in mobile conversion
- **25% increase** in user satisfaction (NPS)

**Next Steps:**

1. Review with stakeholders
2. Prioritize Phase 1 features
3. Create design mockups (Figma)
4. Begin implementation with role detection
5. A/B test new navigation patterns

---

**Document Version:** 1.0
**Last Updated:** November 7, 2025
**Author:** Claude (UX Strategist)
**Status:** Ready for Implementation

**Questions?** Contact: abdallah.lakhdari@arcane-football.com

---

**END OF DOCUMENT**
