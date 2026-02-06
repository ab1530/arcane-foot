# Coaching Hub - Navigation Integration Guide

**Quick setup guide for integrating Coaching Hub screens into the app navigation.**

---

## Step 1: Update Navigation Types

Add to `/Users/lakhdari/Desktop/AppFoot/mobile/src/types/navigation.ts`:

```typescript
import type { CoachFilters } from './coaching';

export type AppStackParamList = {
  // ... existing screens

  // Coaching Hub Screens
  CoachingHub: undefined;
  CoachProfile: { coachId: string };
  MyBookings: { tab?: 'upcoming' | 'past' | 'cancelled' };
  BookSession: { coachId: string; sessionType?: string };
  FilterModal: { currentFilters?: CoachFilters };
  ReviewModal: { sessionId: string; coachId: string };
};
```

---

## Step 2: Update AppNavigator

In `/Users/lakhdari/Desktop/AppFoot/mobile/src/navigation/AppNavigator.tsx`:

### Import the screens:

```typescript
import CoachingHubScreen from '../screens/coaching/CoachingHubScreen';
import CoachProfileScreen from '../screens/coaching/CoachProfileScreen';
import MyBookingsScreen from '../screens/coaching/MyBookingsScreen';
import BookSessionScreen from '../screens/coaching/BookSessionScreen';
import FilterModal from '../screens/coaching/FilterModal';
import ReviewModal from '../screens/coaching/ReviewModal';
```

### Add to Stack Navigator:

```typescript
<Stack.Navigator>
  {/* ... existing screens ... */}

  {/* Coaching Hub Screens */}
  <Stack.Screen
    name="CoachingHub"
    component={CoachingHubScreen}
    options={{ headerShown: false }}
  />
  <Stack.Screen
    name="CoachProfile"
    component={CoachProfileScreen}
    options={{ headerShown: false }}
  />
  <Stack.Screen
    name="MyBookings"
    component={MyBookingsScreen}
    options={{ headerShown: false }}
  />
  <Stack.Screen
    name="BookSession"
    component={BookSessionScreen}
    options={{ headerShown: false }}
  />
  <Stack.Screen
    name="FilterModal"
    component={FilterModal}
    options={{
      presentation: 'modal',
      headerShown: false,
    }}
  />
  <Stack.Screen
    name="ReviewModal"
    component={ReviewModal}
    options={{
      presentation: 'modal',
      headerShown: false,
    }}
  />
</Stack.Navigator>
```

---

## Step 3: Add to Tab Navigator (Optional)

If you want to add Coaching as a main tab in `/Users/lakhdari/Desktop/AppFoot/mobile/src/navigation/MainTabNavigator.tsx`:

```typescript
import { Users } from 'lucide-react-native';
import CoachingHubScreen from '../screens/coaching/CoachingHubScreen';

// In Tab Navigator:
<Tab.Screen
  name="Coaching"
  component={CoachingHubScreen}
  options={{
    tabBarLabel: 'Coaching',
    tabBarIcon: ({ color, size }) => (
      <Users size={size} color={color} />
    ),
  }}
/>
```

---

## Step 4: Test Navigation

### Test from any screen:

```typescript
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<AppStackParamList>;

const MyComponent = () => {
  const navigation = useNavigation<NavigationProp>();

  const navigateToCoaching = () => {
    navigation.navigate('CoachingHub');
  };

  const navigateToCoachProfile = (coachId: string) => {
    navigation.navigate('CoachProfile', { coachId });
  };

  return (
    <Button onPress={navigateToCoaching} title="Find a Coach" />
  );
};
```

---

## Step 5: Add Quick Access Links

### From Dashboard:

```typescript
// In DashboardScreen.tsx
<TouchableOpacity onPress={() => navigation.navigate('CoachingHub')}>
  <Text>Find a Coach</Text>
</TouchableOpacity>
```

### From Profile Menu:

```typescript
// In ProfileScreen.tsx
<TouchableOpacity onPress={() => navigation.navigate('MyBookings')}>
  <Text>My Coaching Sessions</Text>
</TouchableOpacity>
```

---

## Common Navigation Patterns

### Navigate to Coaching Hub
```typescript
navigation.navigate('CoachingHub');
```

### Navigate to Coach Profile
```typescript
navigation.navigate('CoachProfile', { coachId: 'coach-123' });
```

### Navigate to My Bookings (specific tab)
```typescript
navigation.navigate('MyBookings', { tab: 'upcoming' });
```

### Navigate to Book Session
```typescript
navigation.navigate('BookSession', { coachId: 'coach-123' });
```

### Open Filter Modal
```typescript
navigation.navigate('FilterModal', { currentFilters });
```

### Open Review Modal
```typescript
navigation.navigate('ReviewModal', {
  sessionId: 'session-123',
  coachId: 'coach-456'
});
```

---

## Navigation Flow Examples

### Booking Flow:
1. CoachingHub (search/browse)
2. → CoachProfile (view details)
3. → BookSession (multi-step booking)
4. → MyBookings (view confirmation)

### Review Flow:
1. MyBookings (Past tab)
2. → ReviewModal (submit review)
3. → Back to MyBookings

### Rebook Flow:
1. MyBookings (Past tab)
2. → CoachProfile (via Rebook button)
3. → BookSession
4. → MyBookings

---

## Deep Linking Support (Optional)

If you want to support deep links:

```typescript
// In linking configuration
const linking = {
  prefixes: ['appfoot://', 'https://appfoot.com'],
  config: {
    screens: {
      CoachingHub: 'coaching',
      CoachProfile: 'coaching/:coachId',
      MyBookings: 'bookings',
      BookSession: 'coaching/:coachId/book',
    },
  },
};
```

---

## That's it! 🎉

Your Coaching Hub feature is now integrated into the navigation system.

Run the app:
```bash
cd /Users/lakhdari/Desktop/AppFoot/mobile
npm start
```

Navigate to `CoachingHub` from any screen to test the feature!
