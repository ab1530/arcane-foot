# 🚀 Coaching Hub - Quick Start Guide

**5-Minute Setup Guide**

---

## ⚡ Quick Install

```bash
cd /Users/lakhdari/Desktop/AppFoot/mobile

# Install new dependency
npm install use-debounce

# Start the app
npm start
```

---

## 📝 Step 1: Add to Navigation (2 minutes)

### A. Update Types
File: `/src/types/navigation.ts`

```typescript
export type AppStackParamList = {
  // ... existing ...
  CoachingHub: undefined;
  CoachProfile: { coachId: string };
  MyBookings: { tab?: 'upcoming' | 'past' | 'cancelled' };
  BookSession: { coachId: string; sessionType?: string };
  FilterModal: { currentFilters?: any };
  ReviewModal: { sessionId: string; coachId: string };
};
```

### B. Import Screens
File: `/src/navigation/AppNavigator.tsx`

```typescript
import {
  CoachingHubScreen,
  CoachProfileScreen,
  MyBookingsScreen,
  BookSessionScreen,
  FilterModal,
  ReviewModal,
} from '../screens/coaching';
```

### C. Add to Navigator
```typescript
<Stack.Navigator>
  {/* ... existing screens ... */}

  <Stack.Screen name="CoachingHub" component={CoachingHubScreen} options={{ headerShown: false }} />
  <Stack.Screen name="CoachProfile" component={CoachProfileScreen} options={{ headerShown: false }} />
  <Stack.Screen name="MyBookings" component={MyBookingsScreen} options={{ headerShown: false }} />
  <Stack.Screen name="BookSession" component={BookSessionScreen} options={{ headerShown: false }} />
  <Stack.Screen name="FilterModal" component={FilterModal} options={{ presentation: 'modal', headerShown: false }} />
  <Stack.Screen name="ReviewModal" component={ReviewModal} options={{ presentation: 'modal', headerShown: false }} />
</Stack.Navigator>
```

---

## 🧪 Step 2: Test the Feature (3 minutes)

### Navigate from any screen:

```typescript
import { useNavigation } from '@react-navigation/native';

const MyComponent = () => {
  const navigation = useNavigation();

  return (
    <Button
      title="Find a Coach"
      onPress={() => navigation.navigate('CoachingHub')}
    />
  );
};
```

### Test these flows:

1. **Browse Coaches**:
   - Navigate to CoachingHub
   - Search for coaches
   - Tap a coach card

2. **View Profile**:
   - View coach details
   - Tap "Book Session"

3. **Manage Bookings**:
   - Navigate to MyBookings
   - Switch tabs
   - Cancel/Review/Rebook sessions

---

## 📚 Files Created

```
src/
├── types/
│   └── coaching.ts                    ✅ 340 lines
├── services/api/
│   └── coaching.ts                    ✅ 210 lines
├── hooks/
│   └── useCoaching.ts                 ✅ 270 lines
└── screens/coaching/
    ├── components/
    │   ├── CoachCard.tsx              ✅ 275 lines
    │   ├── SessionCard.tsx            ✅ 360 lines
    │   ├── RatingStars.tsx            ✅ 120 lines
    │   ├── ExpertiseBadge.tsx         ✅ 110 lines
    │   ├── ReviewCard.tsx             ✅ 165 lines
    │   ├── TimeSlotButton.tsx         ✅ 85 lines
    │   ├── AvailabilityCalendar.tsx   ✅ 250 lines
    │   └── index.ts                   ✅ 25 lines
    ├── CoachingHubScreen.tsx          ✅ 460 lines
    ├── CoachProfileScreen.tsx         ✅ 580 lines
    ├── MyBookingsScreen.tsx           ✅ 290 lines
    ├── BookSessionScreen.tsx          ✅ 85 lines (placeholder)
    ├── FilterModal.tsx                ✅ 80 lines (placeholder)
    ├── ReviewModal.tsx                ✅ 80 lines (placeholder)
    └── index.ts                       ✅ 15 lines

Total: 19 files, 3,182 lines
```

---

## ✅ What Works Now

✅ Coach discovery with search
✅ Featured coaches showcase
✅ Detailed coach profiles
✅ My bookings management
✅ Session cancellation
✅ Review display
✅ Haptic feedback
✅ Pull-to-refresh
✅ Loading/empty states

---

## ⏳ What's Pending

📝 Multi-step booking flow (BookSessionScreen)
📝 Advanced filtering UI (FilterModal)
📝 Review submission form (ReviewModal)

---

## 🎯 Usage Examples

### Navigate to Coaching Hub
```typescript
navigation.navigate('CoachingHub');
```

### View Coach Profile
```typescript
navigation.navigate('CoachProfile', { coachId: 'coach-123' });
```

### View My Bookings
```typescript
navigation.navigate('MyBookings', { tab: 'upcoming' });
```

### Use Hooks
```typescript
import { useCoaches, useBookSession } from '@/hooks/useCoaching';

// Fetch coaches
const { data, isLoading } = useCoaches({ minRating: 4.5 });

// Book session
const bookMutation = useBookSession();
bookMutation.mutate({
  coachId: 'coach-123',
  dateTime: '2025-11-15T10:00:00Z',
  duration: 60,
  type: 'Technical Skills',
});
```

---

## 📖 Full Documentation

- **COACHING_HUB_SUMMARY.md** - Complete overview
- **COACHING_HUB_IMPLEMENTATION.md** - Technical details
- **COACHING_NAVIGATION_SETUP.md** - Navigation guide

---

## 🐛 Troubleshooting

### Error: "use-debounce not found"
```bash
npm install use-debounce
```

### Error: "Navigation types not defined"
Add `CoachingHub` and other screens to `AppStackParamList` in `/src/types/navigation.ts`

### Error: "Cannot navigate to CoachingHub"
Add screens to `AppNavigator.tsx` (see Step 1 above)

---

## 🎉 That's it!

You're ready to use the Coaching Hub feature.

Run the app and navigate to `CoachingHub`:
```bash
npm start
```

**Enjoy! 🚀**
