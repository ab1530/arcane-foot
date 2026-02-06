# Arcane Dashboard - Quick Reference Guide

## 🚀 Quick Start

### Import Components
```tsx
// Dashboard Components
import { StatCard, QuickActionCard, ActivityItem } from '@/screens/dashboard/components';

// Navigation Components
import { BottomNav } from '@/navigation/components';

// Design System
import { tokens } from '@/design/tokens';
import { typography } from '@/design/typography';
```

---

## 📦 Component Examples

### 1. StatCard

**Basic Usage:**
```tsx
<StatCard
  title="Total Reports"
  value={42}
  icon="document-text"
  color={tokens.colors.yellow.DEFAULT}
/>
```

**With Trend:**
```tsx
<StatCard
  title="Players Scouted"
  value={156}
  icon="people"
  trend={{
    direction: 'up',
    value: '+12%',
    label: 'vs last week',
  }}
  color={tokens.colors.feature.scouting}
  onPress={() => navigation.navigate('Players')}
/>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | ✅ | - | Card title |
| `value` | string \| number | ✅ | - | Main stat value |
| `icon` | Ionicons name | ❌ | - | Icon to display |
| `trend` | TrendObject | ❌ | - | Trend indicator |
| `color` | string | ❌ | yellow | Accent color |
| `onPress` | function | ❌ | - | Tap handler |
| `testID` | string | ❌ | - | Test identifier |

**TrendObject:**
```tsx
{
  direction: 'up' | 'down' | 'neutral',
  value: string | number,
  label?: string,
}
```

---

### 2. QuickActionCard

**Primary Action (Yellow):**
```tsx
<QuickActionCard
  icon="add-circle"
  label="New Report"
  onPress={() => handleCreateReport()}
  variant="primary"
/>
```

**Secondary Action (Charcoal):**
```tsx
<QuickActionCard
  icon="search"
  label="Find Coach"
  onPress={() => navigation.navigate('Search')}
  variant="secondary"
/>
```

**Disabled State:**
```tsx
<QuickActionCard
  icon="lock-closed"
  label="Premium Feature"
  onPress={() => {}}
  disabled={true}
/>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | Ionicons name | ✅ | - | Icon to display |
| `label` | string | ✅ | - | Button label |
| `onPress` | function | ✅ | - | Tap handler |
| `variant` | 'primary' \| 'secondary' | ❌ | 'secondary' | Color variant |
| `disabled` | boolean | ❌ | false | Disabled state |
| `testID` | string | ❌ | - | Test identifier |

---

### 3. ActivityItem

**Basic Activity:**
```tsx
<ActivityItem
  icon="document-text"
  iconColor={tokens.colors.yellow.DEFAULT}
  title="Report Created"
  timestamp="2 hours ago"
/>
```

**With Description:**
```tsx
<ActivityItem
  icon="people"
  iconColor={tokens.colors.feature.scouting}
  title="Player Scouted"
  description="Added new player profile to database"
  timestamp="5 hours ago"
  showSeparator={true}
/>
```

**Clickable Activity:**
```tsx
<ActivityItem
  icon="trophy"
  iconColor={tokens.colors.feature.gamification}
  title="Achievement Unlocked"
  description="Earned 'Expert Scout' badge"
  timestamp="1 day ago"
  onPress={() => navigation.navigate('Achievements')}
/>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `icon` | Ionicons name | ✅ | - | Icon to display |
| `iconColor` | string | ❌ | yellow | Icon color |
| `title` | string | ✅ | - | Activity title |
| `description` | string | ❌ | - | Activity description |
| `timestamp` | string | ✅ | - | Time display |
| `onPress` | function | ❌ | - | Tap handler |
| `showSeparator` | boolean | ❌ | true | Show bottom line |
| `testID` | string | ❌ | - | Test identifier |

---

### 4. BottomNav

**Basic Usage:**
```tsx
<BottomNav
  activeRoute="home"
  onTabPress={(route) => navigation.navigate(route)}
/>
```

**Floating Variant:**
```tsx
<BottomNav
  activeRoute={currentRoute}
  onTabPress={handleTabPress}
  variant="floating"
  showLabels={true}
/>
```

**Custom Tabs:**
```tsx
<BottomNav
  activeRoute="home"
  onTabPress={handleTabPress}
  tabs={[
    {
      route: 'home',
      label: 'Home',
      icon: 'home',
      iconOutline: 'home-outline',
      badge: 3, // Notification count
    },
    // ... more tabs
  ]}
/>
```

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `activeRoute` | TabRoute | ✅ | - | Current active tab |
| `onTabPress` | (route: TabRoute) => void | ✅ | - | Tab press handler |
| `variant` | 'solid' \| 'floating' | ❌ | 'solid' | Visual variant |
| `showLabels` | boolean | ❌ | true | Show tab labels |
| `tabs` | TabItem[] | ❌ | DEFAULT_TABS | Custom tabs |

**TabRoute:**
```tsx
type TabRoute = 'home' | 'search' | 'ai-studio' | 'stats' | 'profile';
```

**TabItem:**
```tsx
{
  route: TabRoute,
  label: string,
  icon: string,
  iconOutline: string,
  badge?: number,
}
```

---

## 🎨 Color Palette Quick Reference

```tsx
// Primary Colors
tokens.colors.arcane.black        // #0A0A0A - Deep black background
tokens.colors.arcane.charcoal     // #27272A - Card backgrounds
tokens.colors.arcane.anthracite   // #1B1B1F - Secondary surfaces
tokens.colors.arcane.slate        // #3F3F46 - Borders

// Brand Color
tokens.colors.yellow.DEFAULT      // #E4FF3B - Primary accent
tokens.colors.yellow.glow         // #E4FF3B40 - Glow effects
tokens.colors.yellow.bright       // #F0FF6B - Hover state

// Feature Colors
tokens.colors.feature.ai          // #8B5CF6 - Purple
tokens.colors.feature.scouting    // #3B82F6 - Blue
tokens.colors.feature.analytics   // #06B6D4 - Cyan
tokens.colors.feature.gamification // #F59E0B - Gold

// Semantic Colors
tokens.colors.semantic.success    // #10B981 - Green
tokens.colors.semantic.error      // #EF4444 - Red
tokens.colors.semantic.warning    // #F59E0B - Orange
tokens.colors.semantic.info       // #3B82F6 - Blue

// Text Colors
tokens.colors.gray[50]            // #FAFAFA - Pure white
tokens.colors.gray[100]           // #F4F4F5 - Headings
tokens.colors.gray[200]           // #E4E4E7 - Primary text
tokens.colors.gray[400]           // #A1A1AA - Secondary text
tokens.colors.gray[500]           // #71717A - Disabled text
```

---

## 📏 Spacing Scale

```tsx
tokens.spacing[1]   // 4px
tokens.spacing[2]   // 8px
tokens.spacing[3]   // 12px
tokens.spacing[4]   // 16px - Standard padding
tokens.spacing[5]   // 20px
tokens.spacing[6]   // 24px - Section margins
tokens.spacing[8]   // 32px - Large gaps
tokens.spacing[10]  // 40px
tokens.spacing[12]  // 48px
tokens.spacing[16]  // 64px
tokens.spacing[20]  // 80px - Bottom padding
```

---

## 🔤 Typography Presets

```tsx
// Headings
typography.heading1     // 48px, bold, tight
typography.heading2     // 30px, semibold, snug
typography.heading3     // 24px, semibold, snug
typography.heading4     // 20px, semibold, normal
typography.heading5     // 18px, medium, normal

// Body Text
typography.bodyLarge    // 18px, regular, relaxed
typography.bodyBase     // 16px, regular, relaxed
typography.bodySmall    // 14px, regular, normal

// UI Elements
typography.buttonText   // 16px, semibold, normal
typography.caption      // 12px, regular, normal
typography.label        // 14px, medium, normal

// Data
typography.statValue    // 24px, bold, tight
typography.statLabel    // 12px, medium, uppercase
```

---

## 🎭 Common Patterns

### 1. Section Header
```tsx
<View style={styles.sectionHeader}>
  <Text style={styles.sectionTitle}>Section Title</Text>
  <TouchableOpacity onPress={handleViewAll}>
    <Text style={styles.viewAllLink}>View All</Text>
  </TouchableOpacity>
</View>
```

### 2. Card Container
```tsx
<View style={styles.card}>
  {/* Card content */}
</View>

const styles = StyleSheet.create({
  card: {
    backgroundColor: tokens.colors.arcane.charcoal,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate + '60',
    ...tokens.shadows.md,
  },
});
```

### 3. Horizontal Scroll
```tsx
<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}
>
  {items.map(item => (
    <Component key={item.id} {...item} />
  ))}
</ScrollView>

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: tokens.spacing[4],
    gap: tokens.spacing[3],
  },
});
```

### 4. Grid Layout (2 columns)
```tsx
<View style={styles.grid}>
  {items.map(item => (
    <View key={item.id} style={styles.gridItem}>
      <Component {...item} />
    </View>
  ))}
</View>

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -tokens.spacing[2],
  },
  gridItem: {
    width: '50%',
    padding: tokens.spacing[2],
  },
});
```

### 5. Progress Bar
```tsx
<View style={styles.progressBar}>
  <View style={[styles.progressFill, { width: `${progress}%` }]} />
</View>

const styles = StyleSheet.create({
  progressBar: {
    height: 8,
    backgroundColor: tokens.colors.arcane.anthracite,
    borderRadius: tokens.radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderRadius: tokens.radius.full,
    ...tokens.shadows.glowYellow,
  },
});
```

---

## 🎬 Animation Examples

### 1. Scale Animation
```tsx
const [scaleAnim] = useState(new Animated.Value(1));

const handlePressIn = () => {
  Animated.spring(scaleAnim, {
    toValue: 0.95,
    useNativeDriver: true,
    ...tokens.easing.spring,
  }).start();
};

<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  {/* Content */}
</Animated.View>
```

### 2. Slide Animation
```tsx
const [slideAnim] = useState(new Animated.Value(0));

useEffect(() => {
  Animated.timing(slideAnim, {
    toValue: 1,
    duration: tokens.duration.normal,
    useNativeDriver: true,
  }).start();
}, []);

const translateX = slideAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [100, 0],
});

<Animated.View style={{ transform: [{ translateX }] }}>
  {/* Content */}
</Animated.View>
```

### 3. Haptic Feedback
```tsx
import * as Haptics from 'expo-haptics';

// Light tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

// Medium tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Heavy tap
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

// Success notification
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
```

---

## 🧪 Testing

### Test IDs
```tsx
// Always add testID for automated testing
<StatCard
  testID="stat-total-reports"
  // ... other props
/>

// Access in tests
const element = getByTestId('stat-total-reports');
```

### Accessibility
```tsx
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Create new report"
  accessibilityHint="Opens the report creation screen"
  accessibilityState={{ disabled: false }}
>
  {/* Content */}
</TouchableOpacity>
```

---

## 📱 Responsive Design

### Safe Area
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

<SafeAreaView style={styles.container} edges={['top']}>
  {/* Content */}
</SafeAreaView>
```

### Dimensions
```tsx
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Use for responsive calculations
const cardWidth = (width - tokens.spacing[4] * 3) / 2;
```

---

## 🐛 Common Issues

### 1. Icons Not Showing
```tsx
// Make sure to use correct Ionicons names
import { Ionicons } from '@expo/vector-icons';

// ✅ Correct
<Ionicons name="home" size={24} color="white" />

// ❌ Wrong
<Ionicons name="home-icon" size={24} color="white" />
```

### 2. Colors Not Applying
```tsx
// ✅ Use tokens
color={tokens.colors.yellow.DEFAULT}

// ❌ Don't hardcode
color="#E4FF3B"
```

### 3. Spacing Inconsistent
```tsx
// ✅ Use spacing scale
marginBottom: tokens.spacing[4]

// ❌ Don't use arbitrary values
marginBottom: 15
```

---

## 📚 Additional Resources

- **Design Tokens**: `/mobile/src/design/tokens.ts`
- **Typography**: `/mobile/src/design/typography.ts`
- **Icons**: `/mobile/src/constants/icons.ts`
- **Full Documentation**: `/mobile/DASHBOARD_REDESIGN_SUMMARY.md`

---

**Last Updated**: 2025-11-11
**Version**: 2.0.0
