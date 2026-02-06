# 📱 MOBILE DATA SYNC - React Native Patches

## 🎯 Patches Critiques Mobile

### 1. Fix API Configuration

**File: `/mobile/src/services/api.ts`**
```typescript
// BEFORE
const API_URL = 'http://localhost:3000/api';

// AFTER
const API_URL = Platform.select({
  ios: 'http://localhost:5001/api',
  android: 'http://10.0.2.2:5001/api', // Android emulator
  default: 'http://localhost:5001/api',
});
```

### 2. Auth Service Update

**File: `/mobile/src/contexts/AuthContext.tsx`**
```typescript
// ADD Token Management
import AsyncStorage from '@react-native-async-storage/async-storage';

const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user } = response.data;

    // Store tokens
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);

    // Set auth header
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

    setUser(user);
    return user;
  } catch (error) {
    throw error;
  }
};
```

### 3. Players Screen - Real Data

**File: `/mobile/src/screens/players/PlayersScreenNew.tsx`**
```typescript
// REMOVE ALL MOCK DATA

import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export default function PlayersScreen() {
  const { data: players, isLoading, refetch } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await api.get('/players');
      return response.data;
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={players}
        refreshing={isLoading}
        onRefresh={refetch}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PlayerCard
            name={`${item.firstName} ${item.lastName}`}
            position={item.position}
            club={item.club?.name}
            rating={item.statsJson?.overall || 0}
            nationality={item.nationality}
            onPress={() => navigation.navigate('PlayerDetail', { id: item.id })}
          />
        )}
        ListEmptyComponent={
          <EmptyState message="No players found" />
        }
      />
    </SafeAreaView>
  );
}
```

### 4. Matches Screen - Real Matches

**File: `/mobile/src/screens/matches/MatchesScreen.tsx`**
```typescript
// REMOVE MOCK MATCHES

const { data: matches } = useQuery({
  queryKey: ['matches'],
  queryFn: () => api.get('/matches').then(res => res.data),
});

// Group by date
const groupedMatches = matches?.reduce((acc, match) => {
  const date = new Date(match.scheduledAt).toDateString();
  if (!acc[date]) acc[date] = [];
  acc[date].push(match);
  return acc;
}, {});
```

### 5. Coaching Hub - Real Coaches

**File: `/mobile/src/screens/coaching/CoachingHubScreen.tsx`**
```typescript
const { data: coaches } = useQuery({
  queryKey: ['coaches'],
  queryFn: () => api.get('/coaches').then(res => res.data),
});

const { data: mySessions } = useQuery({
  queryKey: ['my-coaching-sessions'],
  queryFn: () => api.get('/coaching/my-sessions').then(res => res.data),
});

// Display real coaches and sessions
```

### 6. Achievements Screen

**File: `/mobile/src/screens/gamification/AchievementsScreen.tsx`**
```typescript
const { data: achievements } = useQuery({
  queryKey: ['achievements'],
  queryFn: () => api.get('/gamification/achievements').then(res => res.data),
});

const { data: userAchievements } = useQuery({
  queryKey: ['my-achievements'],
  queryFn: () => api.get('/gamification/my-achievements').then(res => res.data),
});
```

### 7. Dashboard Data

**File: `/mobile/src/screens/dashboard/DashboardScreen.tsx`**
```typescript
// Fetch role-specific dashboard data
const { user } = useAuth();

const { data: dashboardData } = useQuery({
  queryKey: ['dashboard', user?.role],
  queryFn: async () => {
    switch (user?.role) {
      case 'SCOUT':
        return api.get('/dashboard/scout').then(res => res.data);
      case 'PLAYER':
        return api.get('/dashboard/player').then(res => res.data);
      case 'AGENT':
        return api.get('/dashboard/agent').then(res => res.data);
      default:
        return api.get('/dashboard').then(res => res.data);
    }
  },
});
```

### 8. Add Refresh Control

**File: `/mobile/src/components/ui/RefreshableScrollView.tsx`**
```typescript
export const RefreshableScrollView = ({ onRefresh, children, ...props }) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#0ea5e9"
          colors={['#0ea5e9']}
        />
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
};
```

### 9. Fix Navigation with Real IDs

**File: `/mobile/src/navigation/linking.ts`**
```typescript
const linking = {
  config: {
    screens: {
      PlayerDetail: {
        path: 'player/:id',
        parse: {
          id: (id: string) => id, // Use real UUID from DB
        },
      },
      CoachDetail: 'coach/:id',
      MatchDetail: 'match/:id',
      ReportDetail: 'report/:id',
    },
  },
};
```

### 10. Add Error Boundaries

**File: `/mobile/src/components/ErrorBoundary.tsx`**
```typescript
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text>Something went wrong</Text>
          <Button title="Retry" onPress={() => this.setState({ hasError: false })} />
        </View>
      );
    }

    return this.props.children;
  }
}
```

## 🛠️ Services à Créer

### 1. Player Service
```typescript
// /mobile/src/services/playerService.ts
export const playerService = {
  getAll: (params = {}) => api.get('/players', { params }),
  getById: (id: string) => api.get(`/players/${id}`),
  getStats: (id: string) => api.get(`/players/${id}/stats`),
  getReports: (id: string) => api.get(`/players/${id}/reports`),
};
```

### 2. Match Service
```typescript
export const matchService = {
  getUpcoming: () => api.get('/matches/upcoming'),
  getLive: () => api.get('/matches/live'),
  getById: (id: string) => api.get(`/matches/${id}`),
  getByClub: (clubId: string) => api.get(`/clubs/${clubId}/matches`),
};
```

## 📋 Checklist Mobile

### Phase 1 - Configuration (30 min)
- [ ] Update API_URL to 5001
- [ ] Configure Platform-specific URLs
- [ ] Setup AsyncStorage for tokens
- [ ] Test API connection

### Phase 2 - Core Screens (2h)
- [ ] Fix Players screen
- [ ] Fix Matches screen
- [ ] Fix Dashboard
- [ ] Fix Coaching Hub
- [ ] Fix Profile screen

### Phase 3 - Features (1h)
- [ ] Fix Achievements
- [ ] Fix Marketplace
- [ ] Fix AI screens
- [ ] Fix Notifications

### Phase 4 - Navigation (30 min)
- [ ] Update all navigation params
- [ ] Fix deep linking
- [ ] Test all routes

### Phase 5 - Testing (30 min)
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Check offline mode
- [ ] Verify token refresh

## 🚨 Points Critiques Mobile

1. **Network**: Gérer offline/online states
2. **Tokens**: Refresh automatique avant expiration
3. **Images**: Utiliser FastImage pour cache
4. **Lists**: Implémenter FlatList avec onEndReached
5. **Storage**: Persister data critique avec AsyncStorage

## 📱 Optimisations Performance

```typescript
// Use React.memo for list items
export const PlayerCard = React.memo(({ player, onPress }) => {
  // Component code
}, (prevProps, nextProps) => {
  return prevProps.player.id === nextProps.player.id;
});

// Implement pagination
const PAGE_SIZE = 20;
const [page, setPage] = useState(1);

const loadMore = () => {
  if (!isLoading && hasMore) {
    setPage(page + 1);
  }
};

// Use FlashList instead of FlatList
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={players}
  renderItem={renderPlayer}
  estimatedItemSize={80}
/>
```

## 🎯 Résultat Attendu Mobile

✅ 0 mock data
✅ Toutes les screens avec vraie data
✅ Pull-to-refresh partout
✅ Gestion offline
✅ Tokens persistés
✅ Navigation fluide
✅ < 2s temps de chargement