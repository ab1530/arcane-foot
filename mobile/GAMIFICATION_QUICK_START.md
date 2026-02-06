# Gamification Center - Quick Start Guide

**5-Minute Integration Guide**

---

## 🚀 Quick Integration

### Step 1: Add to Navigation (2 minutes)

```typescript
// In your navigation file (e.g., App.tsx or AppNavigator.tsx)
import {
  GamificationHubScreen,
  AchievementsScreen,
  LeaderboardsScreen,
  BadgesScreen,
  DailyChallengeModal,
  AchievementDetailsModal,
} from './src/screens/gamification';

// Add to your Stack Navigator
<Stack.Screen name="GamificationHub" component={GamificationHubScreen} />
<Stack.Screen name="Achievements" component={AchievementsScreen} />
<Stack.Screen name="Leaderboards" component={LeaderboardsScreen} />
<Stack.Screen name="Badges" component={BadgesScreen} />
<Stack.Screen name="DailyChallengeModal" component={DailyChallengeModal} />
<Stack.Screen name="AchievementDetailsModal" component={AchievementDetailsModal} />
```

### Step 2: Setup React Query (1 minute)

Already integrated! The hooks use your existing React Query setup.

### Step 3: Add Navigation Link (1 minute)

```typescript
// In your dashboard or main menu
import { Trophy } from 'lucide-react-native';

<TouchableOpacity
  onPress={() => navigation.navigate('GamificationHub')}
  style={styles.menuItem}
>
  <Trophy size={24} color={tokens.colors.yellow.DEFAULT} />
  <Text style={styles.menuText}>Gamification</Text>
</TouchableOpacity>
```

### Step 4: Test (1 minute)

```bash
npm start
# Navigate to Gamification Hub
# Verify all features work
```

---

## 📱 Component Usage Examples

### Standalone Components

```typescript
import {
  LevelBadge,
  XPBar,
  AchievementCard,
  BadgeDisplay,
  DailyChallengeCard,
} from './src/screens/gamification/components';

// Level Badge
<LevelBadge level={12} title="Scout Elite" size="large" />

// XP Bar
<XPBar currentXP={5000} nextLevelXP={10000} level={12} />

// Achievement Card
<AchievementCard
  achievement={achievement}
  onPress={() => console.log('Pressed')}
/>

// Badge Display
<BadgeDisplay badge={badge} size="medium" showName={true} />

// Daily Challenge Card
<DailyChallengeCard
  challenge={challenge}
  onPress={() => console.log('Pressed')}
/>
```

---

## 🔌 API Hooks Usage

```typescript
import {
  useAchievements,
  useLeaderboard,
  useBadges,
  useUserXP,
  useDailyChallenge,
  useGamificationHub, // All-in-one
} from './src/hooks/useGamification';

// Get all data at once
const { achievements, xp, badges, challenge, stats, isLoading } =
  useGamificationHub();

// Or individually
const { data: achievements } = useAchievements();
const { data: leaderboard } = useLeaderboard('total-xp');
const { data: badges } = useBadges();
const { data: xp } = useUserXP();
const { data: challenge } = useDailyChallenge();
```

---

## 🎨 Customization

### Colors
Edit `mobile/src/design/tokens.ts`:
```typescript
colors: {
  feature: {
    gamification: '#F59E0B', // Change gold color
  },
}
```

### Animations
Adjust animation durations in components:
```typescript
// In XPBar.tsx
progress.value = withSpring(progressPercent, {
  damping: 15,      // Lower = more bouncy
  stiffness: 100,   // Higher = faster
});
```

### Rarity Colors
Edit `RARITY_COLORS` constant in any component:
```typescript
const RARITY_COLORS = {
  common: '#71717A',
  rare: '#3B82F6',
  epic: '#8B5CF6',
  legendary: '#F59E0B',
};
```

---

## 🐛 Common Issues

### Issue: "Module not found"
**Fix:** Check import paths
```typescript
// Use absolute imports
import { useGamification } from '@/hooks/useGamification';
```

### Issue: Animations not working
**Fix:** Ensure Reanimated is installed
```bash
npx expo install react-native-reanimated
```

### Issue: Haptics not working
**Fix:** Test on physical device (not web)
```typescript
import * as Haptics from 'expo-haptics';
```

---

## ✅ Features Checklist

- [x] Level system with XP progression
- [x] Achievements with categories
- [x] Leaderboards with podium
- [x] Badge collection with pinning
- [x] Daily challenges with timer
- [x] Confetti animations
- [x] Haptic feedback
- [x] Pull-to-refresh
- [x] Search and filtering
- [x] Share functionality
- [x] Real-time updates
- [x] Responsive design

---

## 📚 Next Steps

1. **Customize colors** to match your brand
2. **Add navigation links** in your menu
3. **Test all screens** on device
4. **Configure backend** endpoints
5. **Deploy** to production

---

## 🎉 You're Done!

The Gamification Center is now integrated and ready to use!

For detailed documentation, see `GAMIFICATION_CENTER_DOCUMENTATION.md`

---

**Need help?** Check the troubleshooting section in the full documentation.
