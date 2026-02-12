# ArkaneMatch Visual Guide

## Screen Flow

```
┌─────────────────────────────────────┐
│         AI Screen                   │
│  ┌───────────────────────────────┐  │
│  │  🤖 ArkaneMatch AI            │  │
│  │  Find scouts using            │  │
│  │  conversational AI      →     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                  │
                  │ Tap
                  ▼
┌─────────────────────────────────────┐
│    ArkaneMatch Chat Screen          │
│  ┌───────────────────────────────┐  │
│  │  ← ArkaneMatch AI         ↻   │  │ Header
│  │     Scout Search Assistant    │  │
│  ├───────────────────────────────┤  │
│  │  Try asking:                  │  │ Suggestions
│  │  [Find Premier League scouts] │  │ (initial only)
│  │  [Show top-rated scouts]      │  │
│  ├───────────────────────────────┤  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Hello! I'm ArkaneMatch  │  │  │ AI Message
│  │  │ AI. What kind of scout  │  │  │ (left, dark)
│  │  │ are you looking for?    │  │  │
│  │  │ 09:30                   │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │         ┌─────────────────┐   │  │ User Message
│  │         │ Find Premier    │   │  │ (right, yellow)
│  │         │ League scouts   │   │  │
│  │         │ 09:31           │   │  │
│  │         └─────────────────┘   │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ I found 2 scouts...     │  │  │ AI Response
│  │  │                         │  │  │ with scouts
│  │  │ ┌─────────────────────┐ │  │  │
│  │  │ │ 👤 John Smith   4.8⭐│ │  │  │ Scout Card
│  │  │ │ Premier League Scout│ │  │  │
│  │  │ │ [Premier] [CB] [LB] │ │  │  │
│  │  │ │ EUR120/hr      →    │ │  │  │
│  │  │ └─────────────────────┘ │  │  │
│  │  │                         │  │  │
│  │  │ ┌─────────────────────┐ │  │  │ Scout Card
│  │  │ │ 👤 Sarah Jones  4.6⭐│ │  │  │
│  │  │ │ English Scout       │ │  │  │
│  │  │ │ [Premier] [ST]      │ │  │  │
│  │  │ │ EUR100/hr      →    │ │  │  │
│  │  │ └─────────────────────┘ │  │  │
│  │  │                         │  │  │
│  │  │ What's your budget?     │  │  │ Suggestions
│  │  │ [Any language prefs?]   │  │  │
│  │  │ 09:32                   │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │ Typing
│  │  │ ArkaneMatch AI is       │  │  │ Indicator
│  │  │ thinking ...            │  │  │ (animated)
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  ├───────────────────────────────┤  │
│  │ [Ask me to find scouts...  ]🚀│  │ Input
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Component Breakdown

### ChatMessage Component

**User Message (Right-aligned)**
```
┌─────────────────────────────────────┐
│                  ┌────────────────┐ │
│                  │ Your message   │ │
│                  │ here           │ │
│                  │ 09:30          │ │
│                  └────────────────┘ │
│   [Accent Yellow #E4FF3B background]│
└─────────────────────────────────────┘
```

**AI Message (Left-aligned)**
```
┌─────────────────────────────────────┐
│ ┌──────────────────────────────┐   │
│ │ AI response here             │   │
│ │                              │   │
│ │ [Scout Card 1]               │   │
│ │ [Scout Card 2]               │   │
│ │                              │   │
│ │ [Suggestion chips]           │   │
│ │ 09:31                        │   │
│ └──────────────────────────────┘   │
│   [Dark glass with subtle border]  │
└─────────────────────────────────────┘
```

### ScoutMiniCard Component

```
┌──────────────────────────────────────────┐
│  ┌────┐                                  │
│  │ 👤 │  John Smith          4.8 ⭐      │
│  │ JS │  Premier League Scout            │
│  └────┘  [Premier] [LaLiga] [CB] [LB]   │
│    ✓     EUR120/hr                    →  │
└──────────────────────────────────────────┘
     │
     └─ Verified badge (green checkmark)
```

**Breakdown**:
- Avatar (48x48) or initials
- Verification badge (if verified)
- Name + Rating (stars)
- Headline
- Expertise tags (leagues/positions)
- Hourly rate
- Arrow indicator (→)

### MessageInput Component

```
┌──────────────────────────────────────────┐
│ ┌──────────────────────────────────┐ ┌──┐│
│ │ Ask me to find scouts...         │ │🚀││
│ │ (auto-resizing 44-120px)         │ └──┘│
│ └──────────────────────────────────┘     │
│   [Dark input]            [Send button]  │
└──────────────────────────────────────────┘
```

**States**:
- Disabled: Opacity 0.4
- Loading: Spinner in button
- Active: Full color

### SuggestionChips Component

```
┌──────────────────────────────────────────┐
│ Try asking:                              │
│                                          │
│ ┌────────────┐ ┌────────────┐ ┌────────┐│
│ │Find scouts │ │Top rated   │ │Under...││
│ └────────────┘ └────────────┘ └────────┘│
│     [Horizontal scrollable chips]        │
└──────────────────────────────────────────┘
```

### TypingIndicator Component

```
┌──────────────────────────────────────────┐
│ ┌────────────────────────────────────┐   │
│ │ ArkaneMatch AI is thinking  • • •  │   │
│ └────────────────────────────────────┘   │
│      [Animated pulsing dots]             │
└──────────────────────────────────────────┘
```

## Color Palette

### User Messages
```
Background: #E4FF3B (Arcane Yellow)
Text: #080C1D (Dark)
Timestamp: rgba(8, 12, 29, 0.7)
```

### AI Messages
```
Background: rgba(255, 255, 255, 0.08) (Glass)
Border: rgba(255, 255, 255, 0.1)
Text: #FFFFFF
Timestamp: rgba(255, 255, 255, 0.5)
```

### Scout Cards
```
Background: #1A1F35 (Tertiary)
Border: rgba(255, 255, 255, 0.1)
Verified Badge: #22C55E (Success Green)
Tags (Primary): #E4FF3B (Yellow)
Tags (Secondary): rgba(255, 255, 255, 0.08)
Rating Star: #E4FF3B
```

### Input
```
Background: #1A1F35 (Tertiary)
Border: rgba(255, 255, 255, 0.1)
Send Button: #E4FF3B
Send Button Text: #080C1D
```

## Typography Scale

```
Header Title: 16px Bold
Header Subtitle: 12px Regular
Message Text: 14px Regular
Scout Name: 14px SemiBold
Scout Headline: 12px Regular
Tags: 10px Medium
Timestamp: 10px Regular
Suggestion Label: 13px Medium
Suggestion Chip: 13px Medium
```

## Spacing System

```
Message Bubble Padding: 12px
Message Gap: 12px
Scout Card Padding: 12px
Input Padding: 16px
Chip Gap: 8px
Tag Gap: 4px
Avatar Size: 48x48
Send Button Size: 44x44
```

## State Diagram

```
┌─────────────────────────────────────────┐
│         Initial State                   │
│  - Welcome message                      │
│  - Suggestion chips visible             │
│  - Empty input                          │
└──────────────┬──────────────────────────┘
               │
               │ User types/taps suggestion
               ▼
┌─────────────────────────────────────────┐
│         Sending State                   │
│  - User message added                   │
│  - Input cleared                        │
│  - Loading indicator shown              │
│  - Typing indicator shown               │
│  - Input disabled                       │
└──────────────┬──────────────────────────┘
               │
               │ API response received
               ▼
┌─────────────────────────────────────────┐
│         Conversation State              │
│  - AI message added                     │
│  - Scout cards rendered                 │
│  - Suggestions shown                    │
│  - Input enabled                        │
│  - Auto-scroll to bottom                │
└──────────────┬──────────────────────────┘
               │
               │ User refines/continues
               ▼
          [Loop back to Sending State]
```

## Interaction Flow

### 1. First Message
```
User action:     Tap suggestion / Type message
                 ↓
UI update:       Add user message bubble
                 ↓
API call:        POST /arkane-match/chat
                 ↓
Loading state:   Show typing indicator
                 ↓
Response:        Add AI message + scouts
                 ↓
Final state:     Show suggestions
```

### 2. Follow-up Message
```
User action:     Type message (with context)
                 ↓
UI update:       Add user message bubble
                 ↓
API call:        POST /arkane-match/chat
                 (with conversationId)
                 ↓
Loading state:   Show typing indicator
                 ↓
Response:        Add AI message + scouts
                 ↓
Final state:     Updated suggestions
```

### 3. Clear Conversation
```
User action:     Tap reset button (↻)
                 ↓
Confirmation:    Alert dialog
                 ↓
User confirms:   "Clear"
                 ↓
API call:        DELETE /conversations/:id
                 ↓
State reset:     Empty messages array
                 ↓
Final state:     Welcome message + suggestions
```

## Animation Timeline

### Typing Indicator
```
Dot 1: ████░░░░████░░░░ (0ms delay)
Dot 2: ░░████░░░░████░░ (150ms delay)
Dot 3: ░░░░████░░░░████ (300ms delay)

Duration: 600ms total
Loop: Infinite
```

### Message Appearance
```
0ms:   Opacity 0, TranslateY +10
100ms: Opacity 0.5, TranslateY +5
200ms: Opacity 1, TranslateY 0
```

### Auto-scroll
```
Message added → Wait 100ms → Scroll to end (animated)
```

## Mobile Gestures

### Long Press Message (Future)
```
┌────────────────────────────────┐
│ Message bubble                 │
│ ┌────────────────────────────┐ │
│ │ Copy                       │ │
│ │ Share                      │ │
│ │ Delete                     │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### Pull to Refresh (Future)
```
      ↓ Pull down
┌────────────────────────────────┐
│        ⟳ Loading...            │
├────────────────────────────────┤
│  [Messages reload]             │
└────────────────────────────────┘
```

### Swipe Scout Card (Future)
```
      ← Swipe left
┌────────────────────────────────┐
│ Scout Card          [Bookmark] │
│                     [Share]    │
│                     [Contact]  │
└────────────────────────────────┘
```

## Responsive Behavior

### Keyboard Open
```
Before:
┌────────────────┐
│ Messages       │
│                │
│                │
│                │
│ Input          │
└────────────────┘

After:
┌────────────────┐
│ Messages       │
│ (auto-scroll)  │
├────────────────┤
│ Input          │
├────────────────┤
│ Keyboard       │
└────────────────┘
```

### Long Messages
```
┌────────────────────────────────┐
│ This is a very long message    │
│ that wraps to multiple lines   │
│ and maintains proper spacing   │
│ and readability throughout     │
│ 09:30                          │
└────────────────────────────────┘
Max width: 85% of screen
```

### Many Scouts
```
┌────────────────────────────────┐
│ AI message here...             │
│                                │
│ [Scout Card 1]                 │
│ [Scout Card 2]                 │
│ [Scout Card 3]                 │
│ [Scout Card 4]                 │
│ [Scout Card 5]                 │
│                                │
│ ... and 5 more scouts available│
└────────────────────────────────┘
Shows: Top 5 scouts
Indicates: Total count if > 5
```

## Error States

### Network Error
```
┌────────────────────────────────┐
│ I'm sorry, I'm having trouble  │
│ processing your request right  │
│ now. Please check your         │
│ connection and try again.      │
│ 09:30                          │
└────────────────────────────────┘
```

### No Results
```
┌────────────────────────────────┐
│ I couldn't find any scouts     │
│ matching your criteria.        │
│                                │
│ Try:                           │
│ • Broader search criteria      │
│ • Different leagues/positions  │
│ • Higher budget range          │
│ 09:30                          │
└────────────────────────────────┘
```

### Rate Limited
```
┌────────────────────────────────┐
│ You've reached the maximum     │
│ number of queries. Please wait │
│ a moment before trying again.  │
│ 09:30                          │
└────────────────────────────────┘
```

## Quick Reference

### Navigate to ArkaneMatch
```typescript
navigation.navigate('ArkaneMatch');
```

### Send Message Programmatically
```typescript
handleSendMessage("Find Premier League scouts");
```

### Access Conversation State
```typescript
const { messages, conversationId, isLoading } = state;
```

### Clear Conversation
```typescript
handleClearConversation();
```

## File Locations

```
Components:
/mobile/src/components/arkane-match/
  ├─ ChatMessage.tsx
  ├─ ScoutMiniCard.tsx
  ├─ MessageInput.tsx
  ├─ SuggestionChips.tsx
  └─ TypingIndicator.tsx

Screen:
/mobile/src/screens/ai/
  └─ ArkaneMatchScreen.tsx

Types:
/mobile/src/types/
  └─ arkane-match.ts

API:
/mobile/src/services/
  └─ api.ts (updated)

Navigation:
/mobile/src/navigation/
  └─ AppNavigator.tsx (updated)
```

This visual guide provides a complete reference for understanding the ArkaneMatch UI implementation at a glance.
