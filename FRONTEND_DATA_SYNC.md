# 🔄 FRONTEND DATA SYNC - Web Patches

## 🎯 Patches Critiques à Appliquer

### 1. Fix API Configuration

**File: `/web/src/lib/api-client.ts`**
```typescript
// BEFORE
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// AFTER
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
```

### 2. Players Page - Remove Mocks

**File: `/web/src/app/players/page.tsx`**
```typescript
// REMOVE THIS:
const mockPlayers = [
  { id: '1', name: 'Kylian Mbappé', ... },
  { id: '2', name: 'Erling Haaland', ... }
];

// ADD THIS:
'use client';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export default function PlayersPage() {
  const { data: players, isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await apiClient.get('/players');
      return response.data;
    },
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {players?.map((player) => (
        <PlayerCard
          key={player.id}
          name={`${player.firstName} ${player.lastName}`}
          position={player.position}
          club={player.club?.name || 'Free Agent'}
          nationality={player.nationality}
          value={player.marketValue}
        />
      ))}
    </div>
  );
}
```

### 3. Auto-Scout V2 - Dynamic Player

**File: `/web/src/app/ai/auto-scout-v2.tsx`**
```typescript
// REMOVE:
<p className="font-semibold text-lg">Kylian Mbappé</p>
<p className="text-sm">Forward • Paris Saint-Germain • #7</p>

// ADD:
const { data: players } = useQuery(['players']);
const selectedPlayer = players?.[0]; // Or use state for selection

<p className="font-semibold text-lg">
  {selectedPlayer?.firstName} {selectedPlayer?.lastName}
</p>
<p className="text-sm">
  {selectedPlayer?.position} • {selectedPlayer?.club?.name} • #{selectedPlayer?.jerseyNumber}
</p>
```

### 4. Coaching Page - Real Coaches

**File: `/web/src/app/coaching/page.tsx`**
```typescript
// REMOVE ALL MOCK DATA

// ADD:
import { useQuery } from '@tanstack/react-query';

export default function CoachingPage() {
  const { data: coaches } = useQuery({
    queryKey: ['coaches'],
    queryFn: () => apiClient.get('/coaches').then(res => res.data),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {coaches?.map((coach) => (
        <CoachCard
          key={coach.id}
          name={`${coach.firstName} ${coach.lastName}`}
          type={coach.coachingType}
          rate={coach.hourlyRate}
          specialties={coach.specialties}
          avatar={coach.avatar}
        />
      ))}
    </div>
  );
}
```

### 5. Reports Page - Real Reports

**File: `/web/src/app/reports/page.tsx`**
```typescript
const { data: reports } = useQuery({
  queryKey: ['scouting-reports'],
  queryFn: () => apiClient.get('/scouting-reports').then(res => res.data),
});

// Display real reports instead of mocks
```

### 6. Matches Calendar

**File: `/web/src/app/calendar/page.tsx`**
```typescript
const { data: matches } = useQuery({
  queryKey: ['matches'],
  queryFn: () => apiClient.get('/matches').then(res => res.data),
});

// Convert to calendar events
const events = matches?.map(match => ({
  id: match.id,
  title: `${match.homeClub.name} vs ${match.awayClub.name}`,
  start: match.scheduledAt,
  end: match.scheduledAt,
  extendedProps: {
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    status: match.status,
  }
}));
```

### 7. Marketplace - Real Scout Listings

**File: `/web/src/app/marketplace/page.tsx`**
```typescript
// Fetch real scout listings
const { data: scouts } = useQuery({
  queryKey: ['scout-listings'],
  queryFn: () => apiClient.get('/marketplace/scouts').then(res => res.data),
});
```

### 8. Dashboard Headers - Dynamic User

**File: `/web/src/components/layout/DashboardHeader.tsx`**
```typescript
// Use real user from auth context
const { user } = useAuth();

return (
  <div>
    <Avatar src={user?.avatar} />
    <span>{user?.firstName} {user?.lastName}</span>
    <Badge>{user?.role}</Badge>
  </div>
);
```

### 9. Create Environment File

**File: `/web/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### 10. Add Loading States

**Create: `/web/src/components/ui/data-loader.tsx`**
```typescript
export function DataLoader({
  isLoading,
  isEmpty,
  children,
  emptyMessage = "No data available"
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <EmptyState message={emptyMessage} />
    );
  }

  return children;
}
```

## 📋 Checklist d'Implémentation

### Phase 1 - Configuration (30 min)
- [ ] Update API_URL to port 5001
- [ ] Create .env.local with correct URLs
- [ ] Test API connection with curl

### Phase 2 - Pages Principales (2h)
- [ ] Fix Players page
- [ ] Fix Coaches page
- [ ] Fix Reports page
- [ ] Fix Matches calendar
- [ ] Fix Marketplace page

### Phase 3 - Composants (1h)
- [ ] Update DashboardHeader
- [ ] Fix PlayerCard component
- [ ] Fix CoachCard component
- [ ] Update all Avatar URLs

### Phase 4 - Features AI (1h)
- [ ] Fix Auto-Scout player selection
- [ ] Update ArkaneGPT responses
- [ ] Fix SmartScout suggestions
- [ ] Update Performance Predictor

### Phase 5 - Testing (30 min)
- [ ] Test all pages load
- [ ] Verify no console errors
- [ ] Check network requests succeed
- [ ] Validate data displays correctly

## 🚨 Points d'Attention

1. **Pagination**: L'API retourne max 20 items, implémenter pagination
2. **Auth Tokens**: Stocker dans localStorage/cookies, pas en dur
3. **Error Handling**: Ajouter try/catch sur tous les fetches
4. **Loading States**: Toujours afficher un loader pendant fetch
5. **Empty States**: Message approprié si pas de data

## 🎯 Résultat Attendu

✅ 0 mocks dans le code
✅ Toutes les pages utilisent vraie data
✅ Loading states partout
✅ Error handling robuste
✅ Pagination fonctionnelle
✅ Pas d'erreurs console
✅ Performance < 3s page load