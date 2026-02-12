# SmartScout AI - Quick Start Guide

## Installation

### Step 1: Install Required Package
```bash
cd /Users/lakhdari/Desktop/AppFoot/mobile
npm install @react-native-picker/picker
```

Or use the automated script:
```bash
./install-smartscout.sh
```

### Step 2: Install iOS Pods (iOS only)
```bash
cd ios && pod install && cd ..
```

### Step 3: Start the App
```bash
npm start
```

---

## Navigation

### From AI Screen to SmartScout

```
Main App
  └─ AI Screen
       └─ Tap "SmartScout AI" card
            └─ SmartScout Screen (3 tabs)
```

### Tab Structure

```
SmartScout Screen
  ├─ [Suggestions] Tab      ← Find similar reports
  ├─ [Autocomplete] Tab     ← Smart text completion
  └─ [Insights] Tab         ← Player AI analysis
```

---

## Tab Overview

### 1️⃣ SUGGESTIONS TAB

**Purpose**: Find similar scouting reports

**UI Elements**:
```
┌─────────────────────────────────────┐
│ Report Criteria                     │
│                                     │
│ Position: [Picker: GK, RB, CB...]  │
│                                     │
│ Technical Rating: [Slider: 0-100]  │
│ Tactical Rating:  [Slider: 0-100]  │
│ Physical Rating:  [Slider: 0-100]  │
│ Mental Rating:    [Slider: 0-100]  │
│                                     │
│ [🔍 Find Similar Reports]          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Similar Reports (3)                 │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ 92%  John Doe        [CB]     │  │
│ │      Scout: Mike Smith        │  │
│ │      Date: 2024-11-01         │  │
│ │      ✓ Strong in the air...   │  │
│ └───────────────────────────────┘  │
│                                     │
│ ┌───────────────────────────────┐  │
│ │ 85%  Jane Smith      [CB]     │  │
│ │      ...                      │  │
│ └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Flow**:
1. Select position from picker
2. Adjust rating sliders (haptic feedback)
3. Tap "Find Similar Reports"
4. View results ranked by similarity
5. Tap any report to view details

---

### 2️⃣ AUTOCOMPLETE TAB

**Purpose**: Get AI suggestions while writing

**UI Elements**:
```
┌─────────────────────────────────────┐
│ Select Field                        │
│ [Picker: Strengths ▼]              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Context (Optional)                  │
│ Position: [Picker: ST ▼]           │
│ League: [Premier League____]        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Enter Text                          │
│ [Good ball control________]         │
│                                     │
│ Type at least 3 characters...      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ Suggestions          [✨ AI Powered]│
│                                     │
│ • Good ball control and dribbling  │
│   [AI] [85%] →                     │
│                                     │
│ • Good ball control in tight areas │
│   [AI] [78%] →                     │
│                                     │
│ • Good ball control under pressure │
│   [72%] →                          │
└─────────────────────────────────────┘
```

**Flow**:
1. Select field (Strengths/Weaknesses/Summary/Notes)
2. Optionally set context (Position, League)
3. Type at least 3 characters
4. Wait 500ms (debounce)
5. Suggestions appear
6. Tap to insert

---

### 3️⃣ INSIGHTS TAB

**Purpose**: Comprehensive player AI analysis

**UI Elements**:
```
┌─────────────────────────────────────┐
│ Select Player                       │
│ [Picker: John Doe (ST) ▼]         │
│                                     │
│ [✨ Generate AI Insights]          │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👤 John Doe                         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ✨ AI Summary                       │
│                                     │
│ Talented striker with excellent    │
│ positioning and finishing. Shows   │
│ consistency in front of goal...    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📊 Performance Trends               │
│                                     │
│ ↑ Improving                         │
│   • Finishing                       │
│   • Positioning                     │
│                                     │
│ ↓ Declining                         │
│   • Work rate                       │
│                                     │
│ → Stable                            │
│   • Passing                         │
│   • Dribbling                       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 👥 Scout Consensus                  │
│                                     │
│     ┌─────┐                        │
│     │ 87% │  12 Total Reports      │
│     └─────┘                        │
│   Agreement                        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📈 Average Ratings                  │
│                                     │
│ Technical  ████████░░ 82           │
│ Tactical   ██████░░░░ 65           │
│ Physical   ███████░░░ 71           │
│ Mental     ████████░░ 78           │
└─────────────────────────────────────┘

[Share Insights ↗]
```

**Flow**:
1. Select player from picker
2. Tap "Generate AI Insights"
3. View comprehensive analysis
4. Pull down to refresh
5. Tap share to export

---

## Features Summary

### Mobile-Specific Features

| Feature | Tab | Description |
|---------|-----|-------------|
| Haptic Feedback | Suggestions | Sliders vibrate on change |
| Debouncing | Autocomplete | 500ms delay prevents spam |
| Pull to Refresh | Insights | Swipe down to reload |
| Native Share | Insights | Share via system sheet |
| Loading States | All | Spinners + empty states |
| Error Handling | All | Toast notifications |

### Color-Coded Elements

| Element | Color | Meaning |
|---------|-------|---------|
| Similarity 80%+ | Green | High match |
| Similarity 60-79% | Yellow | Medium match |
| Similarity <60% | Gray | Low match |
| Rating 66-100 | Green | Good |
| Rating 33-65 | Yellow | Average |
| Rating 0-32 | Red | Needs work |
| AI Badge | Yellow | AI-powered |

---

## Keyboard Shortcuts (Dev)

When running in development mode:

- `R` - Reload
- `D` - Open dev menu
- `I` - Toggle inspector
- `M` - Toggle menu

---

## Troubleshooting

### Picker Not Showing

**Problem**: Dropdown doesn't appear or crashes

**Solution**:
```bash
npm install @react-native-picker/picker
cd ios && pod install && cd ..
```

### Haptic Feedback Not Working

**Problem**: No vibration on slider

**Solution**: Only works on physical devices, not simulators

### Autocomplete Too Slow

**Problem**: Suggestions take too long

**Solution**: Check backend API performance, debounce is working

### No Insights Generated

**Problem**: Insights button does nothing

**Solution**:
- Check player has at least one report
- Check network connection
- Check backend API logs

---

## Testing Checklist

### Before Submitting

- [ ] All 3 tabs switch smoothly
- [ ] Sliders move without lag
- [ ] Autocomplete debounces correctly
- [ ] Insights display all sections
- [ ] Share functionality works
- [ ] Error states show appropriately
- [ ] Loading indicators appear
- [ ] Empty states are helpful
- [ ] Back navigation works
- [ ] Colors match brand guidelines

---

## API Endpoints Required

The mobile app needs these backend endpoints:

1. `POST /smart-scout/suggestions`
2. `POST /smart-scout/autocomplete`
3. `GET /smart-scout/insights/:playerId`

All must be accessible at the API_URL defined in mobile config.

---

## File Locations

### Components
- `/mobile/src/components/smart-scout/`

### Screens
- `/mobile/src/screens/ai/SmartScoutScreen.tsx`
- `/mobile/src/screens/ai/smart-scout/`

### API
- `/mobile/src/services/api/smart-scout.ts`

### Types
- `/mobile/src/types/smart-scout.ts`

### Navigation
- `/mobile/src/navigation/AppNavigator.tsx`
- `/mobile/src/types/navigation.ts`

---

## Success Criteria

✅ Installation complete (Picker installed)
✅ Navigation working (AI → SmartScout)
✅ 3 tabs functional
✅ Sliders move smoothly
✅ Autocomplete debounces
✅ Insights generate
✅ Share works
✅ Error handling robust
✅ Loading states clear
✅ Design matches brand

---

## Support

For full documentation: `SMARTSCOUT_AI_IMPLEMENTATION.md`

For backend API: `/backend/src/modules/smart-scout/README.md`

For issues: Check console logs and backend logs
