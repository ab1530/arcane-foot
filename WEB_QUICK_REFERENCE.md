# WEB QUICK REFERENCE GUIDE

> Guide de référence rapide pour naviguer dans l'architecture web Arcane
> Complément aux documents WEB_ARCHITECTURE_MAP.md et WEB_FLOWS_AND_DIAGRAMS.md

---

## 🚀 QUICK START

### **Lancer le projet:**
```bash
cd /Users/lakhdari/Desktop/AppFoot/web
npm install
npm run dev
```

**URL locale:** `http://localhost:3000`
**Backend API:** `http://localhost:5001`

---

## 📂 DIRECTORY STRUCTURE

```
/web
├── /src
│   ├── /app                    # Next.js App Router pages
│   │   ├── /dashboard          # Dashboard pages
│   │   ├── /players            # Player pages
│   │   ├── /ai                 # AI features
│   │   ├── /marketplace        # Marketplace
│   │   ├── /admin              # Admin pages
│   │   └── layout.tsx          # Root layout
│   │
│   ├── /components             # React components (201 files)
│   │   ├── /ui                 # Base UI components
│   │   ├── /primitives         # Design system primitives
│   │   ├── /composite          # Composite components
│   │   ├── /auto-scout         # AutoScout components
│   │   ├── /marketplace        # Marketplace components
│   │   ├── /gamification       # Gamification components
│   │   ├── /coaching           # Coaching components
│   │   └── ...                 # 33+ feature folders
│   │
│   ├── /contexts               # React contexts (4 files)
│   │   ├── auth-context.tsx    # Authentication
│   │   ├── favorites-context.tsx # Favorites
│   │   ├── comparison-context.tsx # Player comparison
│   │   └── language-context.tsx # i18n
│   │
│   ├── /hooks                  # Custom hooks (10+ files)
│   │   ├── useSubscription.ts
│   │   ├── useGamification.ts
│   │   ├── useNotifications.ts
│   │   └── ...
│   │
│   ├── /lib                    # Utilities & services
│   │   ├── api-client.ts       # Main API client
│   │   ├── /api                # API services (8 files)
│   │   ├── firebase.ts         # Firebase config
│   │   ├── analytics.ts        # Analytics
│   │   └── ...
│   │
│   ├── /services               # Service layer (4 files)
│   │   ├── eventService.ts
│   │   ├── notificationService.ts
│   │   └── ...
│   │
│   ├── /types                  # TypeScript types (11 files)
│   │   ├── marketplace.ts
│   │   ├── auto-scout.ts
│   │   └── ...
│   │
│   └── /styles                 # Global styles
│       └── globals.css
│
├── /public                     # Static assets
│   ├── firebase-messaging-sw.js # FCM service worker
│   └── ...
│
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

---

## 🔑 KEY FILES TO KNOW

### **Essential Files:**
```
/src/app/layout.tsx             # Root layout with providers
/src/components/providers/client-providers.tsx # All providers
/src/contexts/auth-context.tsx  # Authentication logic
/src/lib/api-client.ts          # API client (150+ endpoints)
/src/components/layout/Navbar.tsx # Main navigation
```

### **Environment Variables (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_VAPID_KEY=...
```

---

## 🧭 NAVIGATION MAP

### **Public Routes (No Auth):**
```
/                    Landing page
/about               About
/contact             Contact
/services            Services
/pricing             Pricing plans
/login               Login
/signup              Signup
/passport/[token]    Public player passport
```

### **Core App Routes (Authenticated):**
```
/dashboard           Main dashboard (role-based)
/profile             User profile
/settings            Settings
/players             Players list
/players/[id]        Player detail
/reports             Reports list
/reports/[id]        Report detail
/calendar            Calendar
/favorites           Favorite players
```

### **AI Features:**
```
/ai                  AI Hub
/ai/arkane-gpt       ArkaneGPT chat
/ai/arkane-index     Arcane Index scoring
/ai/arkane-scout     Arkane Scout
/auto-scout          Auto Scout generation
/smart-scout         Smart Scout (AI-assisted)
/market-value        Market Value AI (ML)
/performance-predictor Performance Predictor (ML)
/playstyle-dna       PlayStyle DNA (ML)
```

### **Marketplace:**
```
/marketplace         Scout marketplace
/marketplace/scouts/[id] Scout profile
/arkane-match        ArkaneMatch AI matching
```

### **Other Features:**
```
/camps               Camps list
/camps/[id]          Camp detail
/coaching            Coaching hub
/coaching/[id]       Coach detail
/achievements        Achievements & gamification
```

### **Admin:**
```
/admin               Admin dashboard
/admin/data-sync     Data sync
/admin/player-validation Player validation queue
/analytics           Analytics dashboard
```

---

## 🔌 API QUICK REFERENCE

### **Authentication:**
```typescript
await apiClient.login(email, password)
await apiClient.signup(data)
await apiClient.getCurrentUser()
await apiClient.logout()
```

### **Players:**
```typescript
await apiClient.getPlayers({ search: "Messi", page: 1 })
await apiClient.getPlayer(playerId)
await apiClient.createPlayer(data)
```

### **Reports:**
```typescript
await apiClient.getScoutingReports({ status: "SUBMITTED" })
await apiClient.createScoutingReport(data)
await apiClient.submitScoutingReport(reportId)
```

### **AI Features:**
```typescript
// Auto Scout
await apiClient.generateAutoScoutReport({ playerId, matchId })
await apiClient.getAutoScoutTemplates()

// Market Value
await apiClient.getPlayerValuation(playerId)
await apiClient.getValuationTrend(playerId)

// Performance Predictor
await apiClient.predictPerformance(playerId, matchId)
await apiClient.getPerformanceInsights(playerId)

// SmartScout
await apiClient.getSmartScoutSuggestions(partialReport, context)
await apiClient.getSmartScoutAutocomplete(field, value, context)
```

### **Marketplace:**
```typescript
await apiClient.searchScoutListings({ leagues: ["Premier League"] })
await apiClient.getScoutListing(listingId)
await apiClient.addFavorite(scoutListingId, notes, tags)
```

### **Notifications:**
```typescript
await apiClient.getNotifications()
await apiClient.markNotificationAsRead(notificationId)
await apiClient.registerDevice({ fcmToken })
```

### **Gamification:**
```typescript
await apiClient.getGamificationProfile()
await apiClient.getGamificationAchievements()
await apiClient.trackGamificationAction(action)
```

---

## 🧩 COMPONENT USAGE EXAMPLES

### **Using Primitives:**
```tsx
import { ArcaneButton } from '@/components/primitives/Button';
import { ArcaneCard } from '@/components/primitives/Card';
import { Heading, Text } from '@/components/primitives/Typography';

<ArcaneCard variant="glass" glow>
  <Heading level={2} gradient>Title</Heading>
  <Text variant="body">Content</Text>
  <ArcaneButton variant="primary" size="md">Action</ArcaneButton>
</ArcaneCard>
```

### **Using Contexts:**
```tsx
import { useAuth } from '@/contexts/auth-context';
import { useFavorites } from '@/contexts/favorites-context';

const { user, isAuthenticated, logout } = useAuth();
const { favoritePlayerIds, addFavorite, removeFavorite } = useFavorites();
```

### **Using Hooks:**
```tsx
import { useSubscription } from '@/hooks/useSubscription';
import { useGamification } from '@/hooks/useGamification';

const { subscription, hasTierAccess } = useSubscription();
const { profile, achievements, trackAction } = useGamification();

// Check tier access
if (!hasTierAccess('PRO')) {
  // Show upgrade modal
}
```

### **Using Modal/Toast:**
```tsx
import { useToast } from '@/components/composite/Feedback/Toast';

const { showToast } = useToast();

showToast({
  type: 'success',
  message: 'Report created successfully!',
  duration: 3000
});
```

---

## 🎨 DESIGN SYSTEM

### **Colors (Tailwind Classes):**
```css
bg-arcane-dark          /* Main background: #0A0E27 */
bg-arcane-darkBorder    /* Borders: #1a1f3a */
bg-arcane-accent        /* Gold accent: #FFD700 */
text-arcane-grey        /* Text grey: #8B92AB */
```

### **Typography:**
```tsx
<Heading level={1}>H1 Heading</Heading>
<Heading level={2} gradient>H2 with Gradient</Heading>
<Text variant="body">Body text</Text>
<Text variant="caption">Caption text</Text>
<GradientText>Gradient text</GradientText>
```

### **Buttons:**
```tsx
<ArcaneButton variant="primary">Primary</ArcaneButton>
<ArcaneButton variant="secondary">Secondary</ArcaneButton>
<ArcaneButton variant="outline">Outline</ArcaneButton>
<ArcaneButton variant="ghost">Ghost</ArcaneButton>
<IconButton icon={<Plus />} />
```

### **Cards:**
```tsx
<ArcaneCard variant="glass" glow hover>
  <CardHeader>Header</CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</ArcaneCard>
```

---

## 🔐 AUTHENTICATION FLOW

### **Login:**
```typescript
const { login } = useAuth();
await login(email, password);
// → Redirects to /dashboard
```

### **Signup:**
```typescript
const { signup } = useAuth();
await signup({ 
  fullName, 
  email, 
  password, 
  accountType: 'player' // 'player' | 'agent' | 'club'
});
// → Redirects to /dashboard
```

### **Logout:**
```typescript
const { logout } = useAuth();
logout();
// → Clears localStorage, redirects to /
```

### **Protected Routes:**
```tsx
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

const { isAuthenticated, isLoading } = useAuth();

if (!isLoading && !isAuthenticated) {
  router.push('/login');
}
```

---

## 📊 SUBSCRIPTION TIERS

| Feature                    | FREE | BASIC | PRO  | ENTERPRISE |
|----------------------------|------|-------|------|------------|
| Player Search              | ✅   | ✅    | ✅   | ✅         |
| Basic Reports              | ✅   | ✅    | ✅   | ✅         |
| Advanced Filters           | ❌   | ✅    | ✅   | ✅         |
| Auto Scout                 | ❌   | ❌    | ✅   | ✅         |
| Market Value AI            | ❌   | ❌    | ✅   | ✅         |
| Performance Predictor      | ❌   | ❌    | ✅   | ✅         |
| PlayStyle DNA              | ❌   | ❌    | ✅   | ✅         |
| SmartScout                 | ❌   | ❌    | ✅   | ✅         |
| Marketplace                | ❌   | ✅    | ✅   | ✅         |
| ArkaneMatch                | ❌   | ❌    | ✅   | ✅         |
| Coaching                   | ❌   | ✅    | ✅   | ✅         |
| API Access                 | ❌   | ❌    | ❌   | ✅         |

### **Checking Access:**
```typescript
const { hasTierAccess } = useSubscription();

if (hasTierAccess('PRO')) {
  // User can access PRO features
}
```

---

## 🧪 TESTING

### **Run Tests:**
```bash
npm test                 # Run all tests
npm test -- --watch      # Watch mode
npm test -- --coverage   # Coverage report
```

### **E2E Tests:**
```bash
npm run test:e2e         # Run Playwright tests
```

---

## 🚨 TROUBLESHOOTING

### **API Connection Issues:**
1. Check backend is running: `http://localhost:5001/health`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors

### **Authentication Issues:**
1. Clear localStorage: `localStorage.clear()`
2. Check token expiration
3. Verify backend `/api/auth/me` endpoint

### **Build Issues:**
```bash
rm -rf .next node_modules
npm install
npm run build
```

### **Firebase/Notifications Not Working:**
1. Check Firebase config in `.env.local`
2. Verify service worker: `http://localhost:3000/firebase-messaging-sw.js`
3. Check browser permissions for notifications

---

## 📚 RELATED DOCUMENTATION

### **Main Docs:**
- `WEB_ARCHITECTURE_MAP.md` - Complete architecture map
- `WEB_FLOWS_AND_DIAGRAMS.md` - User flows & diagrams

### **Feature-Specific:**
- `FCM_INTEGRATION_REPORT.md` - Notifications setup
- `PASSPORT_INTEGRATION.md` - Passport feature
- `EVENTS_CALENDAR_INTEGRATION.md` - Calendar integration
- `ARCANE_DESIGN_SYSTEM.md` - Design system guide

### **Backend:**
- `BACKEND_API_ENDPOINTS.json` - API endpoint reference
- `MOBILE_API_SYNC.md` - Mobile/Web sync status

---

## 🔧 COMMON TASKS

### **Adding a New Page:**
```bash
# Create page file
touch src/app/new-page/page.tsx

# Add to navigation (if needed)
# Edit: src/components/layout/Navbar.tsx
```

### **Adding a New Component:**
```bash
# Create component
mkdir src/components/my-feature
touch src/components/my-feature/MyComponent.tsx
```

### **Adding a New API Endpoint:**
```typescript
// Edit: src/lib/api-client.ts
async myNewEndpoint(data: any) {
  return this.request<ResponseType>('/api/my-endpoint', {
    method: 'POST',
    body: data,
  });
}
```

### **Adding a New Context:**
```typescript
// Create: src/contexts/my-context.tsx
import { createContext, useContext } from 'react';

interface MyContextType {
  // ...
}

const MyContext = createContext<MyContextType | undefined>(undefined);

export function MyProvider({ children }) {
  // ...
  return <MyContext.Provider value={value}>{children}</MyContext.Provider>;
}

export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContext must be used within MyProvider');
  return context;
}

// Add to: src/components/providers/client-providers.tsx
```

---

## 💡 TIPS & BEST PRACTICES

1. **Use TypeScript:** All files should be `.tsx` or `.ts`
2. **Follow naming conventions:**
   - Components: PascalCase (`MyComponent.tsx`)
   - Hooks: camelCase with `use` prefix (`useMyHook.ts`)
   - Utilities: camelCase (`myUtility.ts`)
3. **Use Arcane Design System components** instead of raw HTML
4. **Always handle loading & error states** in API calls
5. **Use `apiClient` singleton** for all API calls
6. **Protect routes** with `useAuth()` hook
7. **Check subscription tier** before showing premium features
8. **Add analytics tracking** for important user actions
9. **Optimize images** with Next.js `<Image>` component
10. **Use Tailwind classes** for styling

---

## 🎯 PROJECT GOALS

1. **Modern UI/UX:** Arcane dark theme, smooth animations, glassmorphism
2. **AI-Powered:** Multiple AI features (AutoScout, SmartScout, ArkaneMatch, ML models)
3. **Role-Based:** Different experiences for players, scouts, clubs, admins
4. **Subscription Model:** Tiered access to features
5. **Real-Time:** Notifications, live match updates
6. **Mobile-First:** Responsive design across all devices
7. **Accessibility:** WCAG 2.1 AA compliance
8. **Performance:** Fast page loads, optimized bundles
9. **SEO:** Meta tags, Open Graph, structured data
10. **Analytics:** Track user behavior, errors, API performance

---

## 🔗 USEFUL LINKS

- **Next.js Docs:** https://nextjs.org/docs
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Radix UI:** https://www.radix-ui.com/
- **Framer Motion:** https://www.framer.com/motion/
- **Recharts:** https://recharts.org/
- **Firebase Docs:** https://firebase.google.com/docs
- **Sentry Docs:** https://docs.sentry.io/

---

**Last Updated:** 2025-11-16
**Version:** 1.0
