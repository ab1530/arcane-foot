# Arcane Dashboard Components - Visual Showcase

## 🎨 Component Library

This document provides visual descriptions and usage examples for all dashboard components.

---

## 1. StatCard Component

### Visual Description
```
┌─────────────────────────────┐
│ 📄 TOTAL REPORTS           │  ← Icon + Title (gray)
│                             │
│ 42                          │  ← Large Value (colored)
│                             │
│ ↗ +12%  vs last week        │  ← Trend indicator
│                             │
│ ═══════════════════════════ │  ← Bottom bar (colored)
└─────────────────────────────┘
```

### Variants

**1. Success Trend (Green)**
```tsx
<StatCard
  title="Matches Attended"
  value={28}
  icon="football"
  trend={{ direction: 'up', value: '+5', label: 'this week' }}
  color={tokens.colors.semantic.success}
/>
```
Visual: Green bottom bar, green trend arrow pointing up

**2. Warning Trend (Orange)**
```tsx
<StatCard
  title="Pending Reports"
  value={12}
  icon="document-text"
  trend={{ direction: 'neutral', value: '0', label: 'no change' }}
  color={tokens.colors.semantic.warning}
/>
```
Visual: Orange bottom bar, neutral dash indicator

**3. Error Trend (Red)**
```tsx
<StatCard
  title="Completion Rate"
  value="78%"
  icon="analytics"
  trend={{ direction: 'down', value: '-5%', label: 'vs last month' }}
  color={tokens.colors.semantic.error}
/>
```
Visual: Red bottom bar, red trend arrow pointing down

### Color Combinations

| Purpose | Color | Use Case |
|---------|-------|----------|
| Primary | Yellow (#E4FF3B) | Main stats, total counts |
| Success | Green (#10B981) | Positive metrics, completions |
| Info | Blue (#3B82F6) | Players, scouting data |
| Warning | Orange (#F59E0B) | Pending items, alerts |
| Error | Red (#EF4444) | Declined metrics, issues |
| Gamification | Gold (#F59E0B) | XP, achievements |

---

## 2. QuickActionCard Component

### Visual Description

**Primary Variant (Yellow)**
```
┌──────────────┐
│   ┌────┐     │  ← Icon in dark circle
│   │ ➕ │     │
│   └────┘     │
│              │
│  New Report  │  ← Label (black text)
│              │
└──────────────┘
     (glows yellow)
```

**Secondary Variant (Charcoal)**
```
┌──────────────┐
│   ┌────┐     │  ← Icon in yellow circle
│   │ 🔍 │     │
│   └────┘     │
│              │
│ Find Coach   │  ← Label (white text)
│              │
└──────────────┘
     (charcoal background)
```

### Layout Examples

**Horizontal Row**
```tsx
<ScrollView horizontal showsHorizontalScrollIndicator={false}>
  <QuickActionCard icon="add-circle" label="New Report" variant="primary" />
  <QuickActionCard icon="search" label="Find Coach" variant="secondary" />
  <QuickActionCard icon="analytics" label="Analytics" variant="secondary" />
  <QuickActionCard icon="sparkles" label="AI Studio" variant="secondary" />
</ScrollView>
```

Visual Layout:
```
[🟡 New Report] [⚫ Find Coach] [⚫ Analytics] [⚫ AI Studio] →
```

**Grid Layout**
```tsx
<View style={styles.grid}>
  <QuickActionCard icon="document" label="Reports" variant="primary" />
  <QuickActionCard icon="people" label="Players" variant="secondary" />
  <QuickActionCard icon="calendar" label="Calendar" variant="secondary" />
  <QuickActionCard icon="trophy" label="Badges" variant="secondary" />
</View>
```

Visual Layout:
```
┌────────────────────┬────────────────────┐
│ 🟡 Reports         │ ⚫ Players         │
├────────────────────┼────────────────────┤
│ ⚫ Calendar        │ ⚫ Badges          │
└────────────────────┴────────────────────┘
```

---

## 3. ActivityItem Component

### Visual Description
```
┌────────────────────────────────────────┐
│ ┌──┐                                   │
│ │📄│ Report Created                    │  ← Icon + Title
│ └──┘ New scouting report for player... │  ← Description
│      2 hours ago                   →   │  ← Timestamp + Chevron
│                                        │
│ ──────────────────────────────────────│  ← Separator
└────────────────────────────────────────┘
```

### Color-Coded Activities

**Yellow (Primary Actions)**
```tsx
<ActivityItem
  icon="document-text"
  iconColor={tokens.colors.yellow.DEFAULT}
  title="Report Created"
  description="New scouting report submitted"
  timestamp="2 hours ago"
/>
```
Visual: Yellow icon background

**Blue (Scouting)**
```tsx
<ActivityItem
  icon="people"
  iconColor={tokens.colors.feature.scouting}
  title="Player Scouted"
  description="Added player to database"
  timestamp="5 hours ago"
/>
```
Visual: Blue icon background

**Green (Success)**
```tsx
<ActivityItem
  icon="checkmark-circle"
  iconColor={tokens.colors.semantic.success}
  title="Report Approved"
  description="Your report was approved by coach"
  timestamp="1 day ago"
/>
```
Visual: Green icon background

**Purple (AI)**
```tsx
<ActivityItem
  icon="sparkles"
  iconColor={tokens.colors.feature.ai}
  title="AI Analysis Complete"
  description="Player comparison ready"
  timestamp="3 days ago"
/>
```
Visual: Purple icon background

**Gold (Achievements)**
```tsx
<ActivityItem
  icon="trophy"
  iconColor={tokens.colors.feature.gamification}
  title="Achievement Unlocked"
  description="Earned 'Expert Scout' badge"
  timestamp="1 week ago"
/>
```
Visual: Gold icon background

### List Layout
```
Activity Feed
═══════════════════════════════════════

📄 Report Created              →
   New scouting report for player...
   2 hours ago
───────────────────────────────────────

👥 Player Scouted             →
   Added new player profile...
   5 hours ago
───────────────────────────────────────

⚽ Match Attended              →
   Scouting session completed...
   1 day ago
───────────────────────────────────────

🏆 Achievement Unlocked        →
   Earned "Expert Scout" badge
   2 days ago
───────────────────────────────────────

📊 Stats Updated               →
   Performance metrics updated
   3 days ago
```

---

## 4. BottomNav Component

### Visual Description

**Solid Variant**
```
┌────────────────────────────────────────┐
│ ═══════════════════════════════════════│ ← Yellow indicator
│                                        │
│ 🏠    🔍    ✨    📊    👤           │ ← Icons
│ Home Search AI    Stats Profile       │ ← Labels
│                                        │
└────────────────────────────────────────┘
```

**Floating Variant**
```

    ┌──────────────────────────────┐
    │ ═════════════════════════════│ ← Yellow indicator
    │                              │
    │ 🏠   🔍   ✨   📊   👤      │ ← Icons
    │ Home Search AI Stats Profile │ ← Labels
    │                              │
    └──────────────────────────────┘
    (floating above content, glassmorphism)
```

### States

**Active Tab (Home)**
```
🏠      🔍      ✨      📊      👤
Home    Search  AI      Stats   Profile
━━━━
(yellow indicator)
```

**Active Tab (AI Studio)**
```
🏠      🔍      ✨      📊      👤
Home    Search  AI      Stats   Profile
                ━━━━
                (yellow indicator)
```

### With Badges
```
🏠      🔍      ✨      📊      👤
Home    Search  AI      Stats   Profile
        (3)            (5)
```
Visual: Red circular badges with numbers

---

## 5. Dashboard Sections

### Hero Section
```
┌────────────────────────────────────────┐
│ Welcome back,                      (U) │ ← Greeting + Avatar
│ John                                   │
│                                        │
│ 🛡️  Level 5              250 / 1000 XP│ ← Level + XP
│ ████████████░░░░░░░░░░░░░░░░           │ ← Progress bar
│                                        │
└────────────────────────────────────────┘
```

### Stat Cards Grid
```
┌──────────────┬──────────────┐
│ TOTAL REPORTS│ PLAYERS      │
│              │ SCOUTED      │
│ 42           │ 156          │
│ ↗ +12%       │ ↗ +8         │
│ ══════════   │ ══════════   │
└──────────────┴──────────────┘
┌──────────────┬──────────────┐
│ MATCHES      │ TOTAL XP     │
│ ATTENDED     │              │
│ 28           │ 4,250        │
│ ↗ +5         │ ↗ +250       │
│ ══════════   │ ══════════   │
└──────────────┴──────────────┘
```

### Quick Actions
```
Quick Actions
─────────────────────────────────

[🟡 New Report] [⚫ Find Coach] [⚫ Analytics] [⚫ AI] →
```

### AI Insights Card
```
┌────────────────────────────────────────┐
│ AI Insights                         →  │
├────────────────────────────────────────┤
│ ✨  Top Talent Recommendations         │
│     Powered by Arcane AI               │
│                                        │
│ │ │  │  │                              │ ← Mini chart
│ ││ ││ │ │││ ││                         │
│ ││ ││ ││ ││ ││                         │
│                                        │
│ AI has identified 5 promising players  │
│ based on your scouting criteria        │
│                                        │
│ [═══════ Get AI Insights ═══════]     │
└────────────────────────────────────────┘
```

### Today's Challenge
```
┌────────────────────────────────────────┐
│ Today's Challenge            🌟 +500 XP│
├────────────────────────────────────────┤
│ 🏆  Complete 3 Scouting Reports        │
│     Submit three comprehensive reports │
│                                        │
│ Progress                       1 / 3   │
│ ████████░░░░░░░░░░░░░░░░░░░░░░          │
│                                        │
│ [══════ Complete Challenge ══════]    │
└────────────────────────────────────────┘
```

### Recent Activity
```
┌────────────────────────────────────────┐
│ Recent Activity             View All → │
├────────────────────────────────────────┤
│ 📄 Report Created                   →  │
│    New scouting report...              │
│    2 hours ago                         │
├────────────────────────────────────────┤
│ 👥 Player Scouted                  →   │
│    Added player profile...             │
│    5 hours ago                         │
├────────────────────────────────────────┤
│ ⚽ Match Attended                   →   │
│    Scouting session...                 │
│    1 day ago                           │
└────────────────────────────────────────┘
```

### Upcoming Matches
```
┌────────────────────────────────────────┐
│ Upcoming Matches            View All → │
├────────────────────────────────────────┤
│ [F] vs [R]  FC Barcelona vs Real Madrid│
│             📅 Tomorrow  🕐 20:00    → │
├────────────────────────────────────────┤
│ [M] vs [L]  Man United vs Liverpool    │
│             📅 Saturday  🕐 15:00    → │
├────────────────────────────────────────┤
│ [B] vs [D]  Bayern vs Dortmund         │
│             📅 Sunday    🕐 18:30    → │
└────────────────────────────────────────┘
```

---

## 🎨 Color System Visual Reference

### Dark Foundation
```
┌─────────┬─────────┬─────────┬─────────┐
│ Black   │Anthracite│Charcoal │ Slate   │
│ #0A0A0A │ #1B1B1F │ #27272A │ #3F3F46 │
└─────────┴─────────┴─────────┴─────────┘
Background  Secondary  Cards    Borders
```

### Brand Accent
```
┌─────────┬─────────┬─────────┬─────────┐
│ Yellow  │  Glow   │ Bright  │  Dark   │
│ #E4FF3B │#E4FF3B40│ #F0FF6B │ #C8E611 │
└─────────┴─────────┴─────────┴─────────┘
Primary    Shadow    Hover     Active
```

### Feature Colors
```
┌─────────┬─────────┬─────────┬─────────┐
│   AI    │ Scouting│Analytics│Gamific. │
│ #8B5CF6 │ #3B82F6 │ #06B6D4 │ #F59E0B │
│ Purple  │  Blue   │  Cyan   │  Gold   │
└─────────┴─────────┴─────────┴─────────┘
```

### Semantic Colors
```
┌─────────┬─────────┬─────────┬─────────┐
│ Success │  Error  │ Warning │  Info   │
│ #10B981 │ #EF4444 │ #F59E0B │ #3B82F6 │
│  Green  │   Red   │ Orange  │  Blue   │
└─────────┴─────────┴─────────┴─────────┘
```

### Text Colors
```
┌─────────┬─────────┬─────────┬─────────┬─────────┐
│ Gray 50 │ Gray 100│ Gray 200│ Gray 400│ Gray 500│
│ #FAFAFA │ #F4F4F5 │ #E4E4E7 │ #A1A1AA │ #71717A │
│  White  │Headings │ Primary │Secondary│Disabled │
└─────────┴─────────┴─────────┴─────────┴─────────┘
```

---

## 🎬 Animation Showcase

### 1. Scale Animation (Buttons)
```
Normal State:    scale(1)
Press In:        scale(0.95)  ⬇️
Press Out:       scale(1)     ⬆️
Duration:        150ms
Easing:          Spring
```

### 2. Slide Animation (Cards)
```
Initial:         translateX(100)  [off screen]
Final:           translateX(0)    [on screen]
Duration:        250ms
Easing:          ease-out
```

### 3. Indicator Animation (Bottom Nav)
```
Tab 1 Active:    translateX(0%)
Tab 2 Active:    translateX(20%)
Tab 3 Active:    translateX(40%)
Tab 4 Active:    translateX(60%)
Tab 5 Active:    translateX(80%)
Duration:        250ms
Easing:          Spring
```

### 4. Progress Bar Animation
```
Initial:         width: 0%
Final:           width: 75%
Duration:        500ms
Easing:          ease-in-out
```

---

## 📱 Responsive Behavior

### Phone (Portrait)
```
┌──────────┐
│  Hero    │
│  Stats   │  ← 2x2 grid
│  Stats   │
│  Quick   │  ← Horizontal scroll
│  AI Card │
│Challenge │
│Activity  │
│Matches   │
└──────────┘
```

### Tablet (Landscape)
```
┌─────────────────────────────┐
│ Hero       │  Stats  Stats  │
│            │  Stats  Stats  │
├────────────┼────────────────┤
│ Quick Actions (all visible) │
├─────────────────────────────┤
│ AI Card    │  Challenge     │
├─────────────────────────────┤
│ Activity   │  Matches       │
└─────────────────────────────┘
```

---

## 🎯 Best Practices

### 1. Icon Selection
- Use filled icons for active states
- Use outline icons for inactive states
- Keep icon semantics consistent

### 2. Color Usage
- Use yellow for primary actions and CTAs
- Use feature colors for context-specific elements
- Use semantic colors for status indicators
- Maintain 4.5:1 contrast ratio for text

### 3. Spacing
- Use 8pt grid system consistently
- Maintain consistent padding (16px standard)
- Keep section gaps uniform (24px)

### 4. Typography
- Use heading hierarchy correctly
- Keep line lengths readable (45-75 chars)
- Maintain consistent line heights

### 5. Interactions
- Add haptic feedback to all touch interactions
- Animate state changes smoothly
- Provide visual feedback for all actions
- Keep loading states visible

---

**Visual Reference Complete** ✅
**Last Updated**: 2025-11-11
