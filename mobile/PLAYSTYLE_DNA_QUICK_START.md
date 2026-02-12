# PlayStyle DNA - Quick Start Guide

## 1. Prerequisites

### Backend Service
Ensure Python FastAPI service is running:
```bash
cd ai-service
python main.py
# Should start on http://localhost:8002
```

### Dependencies
Already installed in package.json:
- ✅ victory-native (^41.20.1)
- ✅ react-native-svg (^15.14.0)
- ✅ expo-linear-gradient
- ✅ expo-haptics

---

## 2. Navigation Setup

Add these screens to your navigation stack:

```typescript
// In your main navigator (e.g., AppNavigator.tsx)
import PlayStyleDNAScreen from './src/screens/ai/PlayStyleDNAScreen';
import StyleExplorerScreen from './src/screens/ai/StyleExplorerScreen';
import PlayStyleComparisonScreen from './src/screens/ai/PlayStyleComparisonScreen';

// Add to Stack.Navigator
<Stack.Screen
  name="PlayStyleDNA"
  component={PlayStyleDNAScreen}
  options={{
    headerTitle: 'PlayStyle DNA',
    headerShown: false, // Screen has custom header
  }}
/>

<Stack.Screen
  name="StyleExplorer"
  component={StyleExplorerScreen}
  options={{
    headerTitle: 'Style Explorer',
    headerShown: false,
  }}
/>

<Stack.Screen
  name="PlayStyleComparison"
  component={PlayStyleComparisonScreen}
  options={{
    headerTitle: 'Compare Styles',
    headerShown: false,
  }}
/>
```

---

## 3. Using the Screens

### Navigate to PlayStyleDNA (Main Screen)
```typescript
// From any screen
navigation.navigate('PlayStyleDNA', {
  playerId: 'player-id-123'
});
```

### Navigate to Style Explorer
```typescript
// Browse all styles
navigation.navigate('StyleExplorer');

// Or open specific style
navigation.navigate('StyleExplorer', {
  selectedStyle: 'Clinical Finisher'
});
```

### Navigate to Comparison
```typescript
// Compare multiple players
navigation.navigate('PlayStyleComparison', {
  playerIds: ['player-1', 'player-2', 'player-3']
});
```

---

## 4. Using Components Standalone

### Display DNA Radar Chart
```typescript
import { DNARadarChart } from '@/components/playstyle-dna';
import { getStyleColor } from '@/utils/playStyleColors';

<DNARadarChart
  dnaProfile={{
    technical: 8.5,
    tactical: 7.2,
    physical: 6.8,
    mental: 9.0,
    pace: 7.5,
    strength: 6.2,
    creativity: 8.8,
    workRate: 7.9,
  }}
  styleColor={getStyleColor('Playmaker')}
  size={250}
  animated
  showLabels
/>
```

### Show Style Badge
```typescript
import { StyleBadge } from '@/components/playstyle-dna';

<StyleBadge
  style="Clinical Finisher"
  size="medium"
  variant="filled"
  showIcon
/>
```

### Display Style Card
```typescript
import { StyleCard } from '@/components/playstyle-dna';

<StyleCard
  primaryStyle="Box-to-Box Engine"
  secondaryStyle="Pressing Machine"
  confidence={0.87}
  cluster={3}
  realWorldExamples={['N. Kanté', 'Goretzka', 'Barella']}
  onPress={() => console.log('Tapped')}
/>
```

### Show Similar Player
```typescript
import { SimilarPlayerCard } from '@/components/playstyle-dna';

<SimilarPlayerCard
  player={{
    id: 'player-456',
    name: 'John Doe',
    position: 'CM',
    style: 'Box-to-Box Engine',
    similarity: 0.89,
    nationality: 'England',
    club: 'Manchester United',
    photo: 'https://...',
  }}
  onPress={() => navigation.navigate('PlayStyleDNA', { playerId: 'player-456' })}
/>
```

### Display Recommendation
```typescript
import { RecommendationCard } from '@/components/playstyle-dna';

<RecommendationCard
  recommendation="Focus on improving short passing accuracy in tight spaces"
  type="technical"
  priority="high"
  details="Practice one-touch passing drills with 2-3 teammates in a 10x10 meter box. Focus on receiving the ball on the back foot and playing it quickly with proper weight."
/>
```

---

## 5. API Usage

### Classify a Player
```typescript
import { playStyleDnaApi } from '@/services/api/playstyle-dna';

try {
  const classification = await playStyleDnaApi.classify('player-id-123', {
    includeRecommendations: true,
    includeSimilarPlayers: true,
    maxSimilarPlayers: 5,
  });

  console.log('Primary Style:', classification.primaryStyle);
  console.log('Confidence:', classification.styleConfidence);
  console.log('DNA Profile:', classification.dnaProfile);
} catch (error) {
  console.error('Classification failed:', error);
}
```

### Compare Players
```typescript
try {
  const comparison = await playStyleDnaApi.compare(
    ['player-1', 'player-2', 'player-3'],
    'detailed'
  );

  console.log('Team Balance:', comparison.teamBalance);
  console.log('Compatibility:', comparison.compatibility);
  console.log('Insights:', comparison.insights);
} catch (error) {
  console.error('Comparison failed:', error);
}
```

### Get All Styles
```typescript
try {
  const styles = await playStyleDnaApi.getStyles();

  styles.forEach(style => {
    console.log(`${style.name}: ${style.description}`);
  });
} catch (error) {
  console.error('Failed to fetch styles:', error);
}
```

### Find Similar Players
```typescript
try {
  const similarPlayers = await playStyleDnaApi.getSimilar(
    'player-id-123',
    10, // limit
    0.7 // threshold
  );

  similarPlayers.forEach(player => {
    console.log(`${player.name} - ${player.similarity * 100}% match`);
  });
} catch (error) {
  console.error('Failed to find similar players:', error);
}
```

---

## 6. Color Utilities

### Get Style Color
```typescript
import { getStyleColor } from '@/utils/playStyleColors';

const color = getStyleColor('Clinical Finisher'); // Returns '#10B981'
```

### Get Style with Opacity
```typescript
import { getStyleColorWithOpacity } from '@/utils/playStyleColors';

const transparentColor = getStyleColorWithOpacity('Playmaker', 0.3);
// Returns 'rgba(168, 85, 247, 0.3)'
```

### Get Style Gradient
```typescript
import { getStyleGradient } from '@/utils/playStyleColors';

const [start, end] = getStyleGradient('Speed Demon');
// Returns ['#F97316', '#EA580C']
```

### Get Confidence Color
```typescript
import { getConfidenceColor, getConfidenceLevel } from '@/utils/playStyleColors';

const color = getConfidenceColor(0.89); // Returns '#3B82F6' (Good)
const level = getConfidenceLevel(0.89); // Returns 'Good'
```

---

## 7. TypeScript Types

### Import Types
```typescript
import type {
  PlayStyleName,
  PlayStyleClassification,
  DNAProfile,
  SimilarPlayer,
  StyleComparison,
  PlayStyleInfo,
} from '@/types/playstyle-dna';
```

### Example Usage
```typescript
const dnaProfile: DNAProfile = {
  technical: 8.5,
  tactical: 7.2,
  physical: 6.8,
  mental: 9.0,
  pace: 7.5,
  strength: 6.2,
  creativity: 8.8,
  workRate: 7.9,
};

const styleName: PlayStyleName = 'Clinical Finisher';
```

---

## 8. Testing Endpoints

### Health Check
```typescript
import { playStyleDnaApi } from '@/services/api/playstyle-dna';

try {
  const health = await playStyleDnaApi.healthCheck();
  console.log('Service Status:', health.status);
  console.log('Version:', health.version);
} catch (error) {
  console.error('AI service is down:', error);
}
```

### Test Classification
```bash
# Using curl
curl -X POST http://localhost:8002/classify \
  -H "Content-Type: application/json" \
  -d '{"playerId": "test-player-id"}'
```

---

## 9. Common Patterns

### Full Flow Example
```typescript
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { playStyleDnaApi } from '@/services/api/playstyle-dna';
import { DNARadarChart, StyleCard } from '@/components/playstyle-dna';
import { getStyleColor } from '@/utils/playStyleColors';
import type { PlayStyleClassification } from '@/types/playstyle-dna';

export function PlayerAnalysis({ playerId }: { playerId: string }) {
  const [classification, setClassification] = useState<PlayStyleClassification | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClassify = async () => {
    setLoading(true);
    try {
      const result = await playStyleDnaApi.classify(playerId);
      setClassification(result);
    } catch (error) {
      console.error('Classification failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Button title="Classify" onPress={handleClassify} disabled={loading} />

      {classification && (
        <>
          <DNARadarChart
            dnaProfile={classification.dnaProfile}
            styleColor={getStyleColor(classification.primaryStyle)}
            size={250}
            animated
          />

          <StyleCard
            primaryStyle={classification.primaryStyle}
            secondaryStyle={classification.secondaryStyle}
            confidence={classification.styleConfidence}
            cluster={classification.cluster}
            realWorldExamples={classification.realWorldExamples}
          />
        </>
      )}
    </View>
  );
}
```

---

## 10. Troubleshooting

### Issue: "Classification Failed"
**Solution:**
1. Check Python service is running: `curl http://localhost:8002/health`
2. Verify API_URL in `/mobile/src/constants/config.ts`
3. Check player ID exists in database

### Issue: Charts Not Rendering
**Solution:**
1. Verify victory-native is installed: `npm list victory-native`
2. Clear cache: `expo start -c`
3. Check console for SVG errors

### Issue: Colors Not Displaying
**Solution:**
1. Verify style name matches `PlayStyleName` type exactly
2. Check `getStyleColor()` is imported from correct path
3. Ensure style name is spelled correctly (case-sensitive)

### Issue: Navigation Errors
**Solution:**
1. Verify all 3 screens are added to Stack.Navigator
2. Check screen names match exactly
3. Ensure navigation params are correct type

---

## 11. Performance Tips

### Optimize Charts
```typescript
// Memoize chart data
const chartData = useMemo(() => ({
  dnaProfile: classification.dnaProfile,
  styleColor: getStyleColor(classification.primaryStyle),
}), [classification]);

<DNARadarChart {...chartData} />
```

### Lazy Load Similar Players
```typescript
const renderSimilarPlayer = useCallback(({ item }) => (
  <SimilarPlayerCard player={item} onPress={handlePlayerPress} />
), [handlePlayerPress]);

<FlatList
  data={similarPlayers}
  renderItem={renderSimilarPlayer}
  keyExtractor={(item) => item.id}
  initialNumToRender={3}
  maxToRenderPerBatch={5}
/>
```

---

## 12. Adding to Your App

### Example: Add to Player Profile Screen
```typescript
// In PlayerProfileScreen.tsx
import { TouchableOpacity, Text } from 'react-native';

<TouchableOpacity
  style={styles.dnaButton}
  onPress={() => navigation.navigate('PlayStyleDNA', { playerId: player.id })}
>
  <Text>View PlayStyle DNA</Text>
</TouchableOpacity>
```

### Example: Add to AI Features Menu
```typescript
// In AIScreen.tsx
const features = [
  {
    title: 'PlayStyle DNA',
    description: 'AI-powered playing style classification',
    icon: 'analytics',
    onPress: () => navigation.navigate('PlayStyleDNA'),
  },
  {
    title: 'Style Explorer',
    description: 'Browse 12 unique playing styles',
    icon: 'grid',
    onPress: () => navigation.navigate('StyleExplorer'),
  },
  // ... other features
];
```

---

## Summary

You now have:
- ✅ 3 fully functional screens
- ✅ 5 reusable components
- ✅ Complete API client
- ✅ Type-safe TypeScript definitions
- ✅ Comprehensive color utilities
- ✅ Victory Native radar charts

**Next Steps:**
1. Start Python AI service
2. Add navigation routes
3. Test classification flow
4. Integrate into your app

**Need Help?**
- Check `PLAYSTYLE_DNA_IMPLEMENTATION.md` for detailed documentation
- Review component props in TypeScript files
- Test endpoints with curl or Postman

Happy coding! ⚽🚀
