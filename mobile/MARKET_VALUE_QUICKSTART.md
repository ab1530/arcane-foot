# MarketValue AI - Quick Start Guide

## Navigation Paths

### From AI Screen
```
AI Screen → Market Value AI → MarketValueScreen
```

### From Any Screen
```typescript
navigation.navigate('MarketValue', { playerId: 'optional-id' });
navigation.navigate('MarketValueDetail', { playerId: 'player-id' });
```

## Component Usage

### ValuationCard
```typescript
import { ValuationCard } from '../components/market-value';

<ValuationCard
  value={23.5}
  interval={[18.5, 28.5]}
  confidence={0.82}
  loading={false}
/>
```

### ConfidenceIndicator
```typescript
import { ConfidenceIndicator } from '../components/market-value';

<ConfidenceIndicator
  confidence={0.82}
  size={120}
  strokeWidth={12}
/>
```

### FactorBar
```typescript
import { FactorBar } from '../components/market-value';

<FactorBar
  name="age_normalized"
  value={8.5}
  maxValue={10}
  index={0}
/>
```

### ComparablePlayerCard
```typescript
import { ComparablePlayerCard } from '../components/market-value';

<ComparablePlayerCard
  player={{
    name: "John Doe",
    age: 23,
    position: "FWD",
    market_value: 25.0,
    similarity_score: 0.85
  }}
  onPress={() => console.log('Player tapped')}
/>
```

### TrendChart
```typescript
import { TrendChart } from '../components/market-value';

<TrendChart
  dataPoints={[
    { timestamp: new Date(), value: 23.5, confidence: 0.82, modelVersion: 'v1' }
  ]}
  trend="up"
  changePercentage={15.2}
  height={220}
/>
```

## API Usage

### Get Valuation
```typescript
import { marketValueApi } from '../services/api/market-value';

const valuation = await marketValueApi.getValuation('player-123');
// Returns: PlayerValuation object
```

### Get Trend
```typescript
const trend = await marketValueApi.getTrend('player-123');
// Returns: ValuationTrend object
```

### Compare Players
```typescript
const comparison = await marketValueApi.compare([
  'player-1',
  'player-2',
  'player-3'
]);
// Returns: ComparePlayersResponse object
```

## Screen Flow

```
┌─────────────────────┐
│   MarketValue       │
│   (Main Screen)     │
│                     │
│ - Search Player     │
│ - View Valuation    │
│ - Basic Factors     │
│ - Top 3 Comparable  │
└──────────┬──────────┘
           │
           │ Tap "View Historical Trend"
           ▼
┌─────────────────────┐
│ MarketValueDetail   │
│ (Detail Screen)     │
│                     │
│ - Player Info       │
│ - Trend Chart       │
│ - All Factors       │
│ - All Comparable    │
│ - Share Button      │
└─────────────────────┘
```

## Key Features

### Animations
- **Count-up**: 2000ms smooth counting animation
- **Circular Progress**: 1500ms stroke animation
- **Factor Bars**: 800ms with 100ms stagger per bar
- **Spring Effects**: Gentle spring for scale

### Interactions
- **Pull to Refresh**: On main screen
- **Haptic Feedback**: On success/error
- **Share**: Native share sheet
- **Tap Handlers**: All interactive elements

### Error States
- Network errors → Retry button
- 404 → "Player not found"
- 503 → "AI service unavailable"
- Empty states → Instructions

## Chart Colors

### Trend Colors
- **Up**: Green (#22C55E)
- **Down**: Red (#EF4444)
- **Stable**: Gray (#6B7280)

### Confidence Colors
- **High (≥80%)**: Green
- **Medium (60-79%)**: Yellow
- **Low (<60%)**: Red

### Factor Bar Colors
- **≥80%**: Green gradient
- **60-79%**: Arcane yellow gradient
- **40-59%**: Orange gradient
- **<40%**: Red gradient

## File Locations

```
mobile/
├── src/
│   ├── components/
│   │   └── market-value/
│   │       ├── index.ts
│   │       ├── ValuationCard.tsx
│   │       ├── ConfidenceIndicator.tsx
│   │       ├── FactorBar.tsx
│   │       ├── ComparablePlayerCard.tsx
│   │       └── TrendChart.tsx
│   ├── screens/
│   │   └── ai/
│   │       ├── MarketValueScreen.tsx
│   │       └── MarketValueDetailScreen.tsx
│   ├── services/
│   │   └── api/
│   │       └── market-value.ts
│   ├── types/
│   │   ├── market-value.ts
│   │   └── navigation.ts (updated)
│   └── navigation/
│       └── AppNavigator.tsx (updated)
```

## Dependencies

All required packages already installed:
- ✅ react-native-reanimated (animations)
- ✅ react-native-svg (circular progress)
- ✅ victory-native (charts)
- ✅ expo-haptics (haptic feedback)
- ✅ expo-linear-gradient (gradients)

## Testing Checklist

- [ ] Navigate to Market Value screen
- [ ] Enter player ID and get valuation
- [ ] Verify count-up animation
- [ ] Check confidence indicator
- [ ] Scroll through factors
- [ ] Tap comparable player cards
- [ ] Navigate to detail screen
- [ ] View trend chart
- [ ] Share valuation
- [ ] Pull to refresh
- [ ] Test error states
- [ ] Test loading states

## Common Issues

### Chart Not Rendering
- Check if victory-native is properly installed
- Verify screen dimensions are available
- Ensure data has valid structure

### Animation Stuttering
- Check if running on physical device (not simulator)
- Verify Reanimated is properly configured
- Reduce animation complexity if needed

### API Errors
- Verify backend is running
- Check network connectivity
- Validate player ID format
- Review API endpoint configuration

## Quick Commands

### Navigate from anywhere:
```typescript
navigation.navigate('MarketValue', {});
```

### With player ID:
```typescript
navigation.navigate('MarketValue', { playerId: 'abc-123' });
```

### Direct to detail:
```typescript
navigation.navigate('MarketValueDetail', { playerId: 'abc-123' });
```

## Support

For issues or questions:
1. Check MARKET_VALUE_AI_IMPLEMENTATION.md for full details
2. Review backend API documentation
3. Test with mock data first
4. Verify all dependencies installed

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: 2025-11-06
