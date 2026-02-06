# 🔍 ARCANE — AUDIT COMPLET DE L'OBSERVABILITÉ & LOGGING

**Date**: 2025-11-18
**Plateforme**: Backend (NestJS) + Web (Next.js) + Mobile (React Native + Expo)
**Statut Global**: ⚠️ **PARTIAL — AMÉLIORATION CRITIQUE REQUISE**

---

## 📊 RÉSUMÉ EXÉCUTIF

L'analyse complète de l'infrastructure de logging d'Arcane révèle une situation **hétérogène** :

| Plateforme | Maturité Globale | Infrastructure | Adoption | Gaps Critiques |
|------------|------------------|----------------|----------|----------------|
| **Backend** | 51% | ✅ Bonne (Winston) | ⚠️ 68% | Auth, DB queries, Guards |
| **Web** | 35% | ✅ Excellente | ❌ 3% | Adoption très faible |
| **Mobile** | 30% | ⚠️ Partielle | ⚠️ 40% | Navigation, ErrorBoundary, Sentry |

### 🚨 Top 5 Problèmes Critiques

1. **Backend**: LoggingInterceptor implémenté mais **NON ACTIVÉ** (pas enregistré dans main.ts)
2. **Web**: Infrastructure complète (Logger, Analytics, ErrorHandler) mais **usage de console.* dans 90+ fichiers**
3. **Mobile**: **Aucun service de crash reporting** (Sentry/Bugsnag/Crashlytics)
4. **Backend**: **Aucun logging d'authentification** (login success/failure, account lockouts)
5. **Mobile**: **Aucun ErrorBoundary React** (les crashes component sont silencieux)

### ✅ Points Forts

- **Backend**: Infrastructure Winston complète avec rotation de fichiers, sanitization, méthodes spécialisées
- **Web**: Logger centralisé avec intégration Sentry, Analytics robuste, API Client interceptor
- **Mobile**: API interceptor fonctionnel avec tracking de durée et status
- **Global**: Aucune exposition de données sensibles trouvée (bonne sanitization)

---

## 🖥️ PARTIE 1 — BACKEND (NestJS)

### 1.1 Infrastructure Existante

#### ✅ **Logger Service** (`/backend/src/logger/logger.service.ts`)
- **Basé sur Winston** avec logging structuré
- **Niveaux**: error, warn, info, debug, verbose
- **Rotation**: error.log, combined.log, http.log, debug.log (10MB max, 5 fichiers)
- **Méthodes spécialisées**:
  - `logHttpRequest()` — Requêtes HTTP
  - `logDatabaseQuery()` — Queries DB
  - `logPerformance()` — Métriques perf
  - `logBusinessEvent()` — Événements métier
  - `logSecurity()` — Événements sécurité

#### ✅ **LoggingInterceptor** (`/backend/src/interceptors/logging.interceptor.ts`)
- Logs requêtes/réponses avec durée
- Sanitize les champs sensibles (password, token, secret, apiKey, accessToken)
- Alerte sur requêtes lentes (>1000ms)
- **PROBLÈME**: ❌ **NON ENREGISTRÉ GLOBALEMENT** (pas dans main.ts ou app.module.ts)

#### ⚠️ **Pattern d'Adoption**
- **28/41 services** utilisent NestJS Logger (`new Logger(ServiceName.name)`)
- **2 console.log** trouvés dans scouting-reports.service.ts (lignes 121-122)
- **Custom LoggerService** peu adopté

### 1.2 Analyse par Service

#### 🟢 **Services avec Excellent Logging**

**AutoScoutService** (`auto-scout.service.ts`) — Note: A+
```typescript
✅ Cache hits: "Returning cached report for player ${playerId}"
✅ AI generation: "Fetching AI index for player ${playerId} with metrics..."
✅ Errors: "AI generation failed: ${error.message}"
✅ Database saves: "Created scouting report for auto-scout..."
```

**DataSyncService** (`data-sync.service.ts`) — Note: A
```typescript
✅ Sync start/success
✅ Batch progress tracking
✅ Error avec stack trace
```

**GamificationService** (`gamification.service.ts`) — Note: A
```typescript
✅ Achievement unlocks
✅ Level ups
✅ Challenge completions
✅ Leaderboard updates
```

#### 🔴 **Services avec Gaps Critiques**

**AuthService** (`auth.service.ts`) — Note: F
```typescript
❌ PAS DE LOGGER INITIALISÉ
❌ Aucun log des tentatives de login (success/failure)
❌ Aucun log des changements de mot de passe
❌ Aucun log des lockouts (isActive = false)
❌ Aucun audit trail
```

**PlayersService** (`players.service.ts`) — Note: D
```typescript
❌ PAS DE LOGGER INITIALISÉ
❌ CRUD non loggé
❌ Cache hit/miss non tracké
❌ Search queries non loggées
```

**AiService** (`ai.service.ts`) — Note: C+
```typescript
✅ Fallback logs existants
❌ Aucun timing d'API externe
❌ Aucun tracking de tokens/coûts
❌ Aucun log de prompt/response (debug)
```

### 1.3 Guards & Authentification

#### ❌ **JwtAuthGuard** (`jwt-auth.guard.ts`)
```typescript
❌ Aucun log de validation JWT failed
❌ Aucun log de token expiré
❌ Aucun log de token invalide
❌ Aucun log d'accès route publique
```

#### ⚠️ **SubscriptionTierGuard** (`subscription-tier.guard.ts`)
```typescript
❌ Aucun log local de 403 (tier blocking)
⚠️ Logs via SentryInterceptor UNIQUEMENT (external)
❌ Tier mismatch non loggé localement
```

### 1.4 Prisma (Database)

#### ❌ **PrismaService** (`prisma.service.ts`)
```typescript
✅ Connection logged: "[DB] Database connected"
❌ Aucun query logging middleware
❌ Aucun slow query detection
❌ Aucun log d'erreur de query
❌ Aucun transaction logging
```

**Solution Recommandée**:
```typescript
async onModuleInit() {
  await this.$connect();
  this.logger.log('[DB] Database connected');

  // Middleware de logging
  this.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const duration = Date.now() - before;

    this.logger.debug(`[DB] ${params.model}.${params.action} (${duration}ms)`);

    if (duration > 1000) {
      this.logger.warn(`[DB] Slow query: ${params.model}.${params.action} (${duration}ms)`);
    }

    return result;
  });
}
```

### 1.5 Logs de Sécurité

#### 🚨 **GAPS CRITIQUES**

| Événement | Status | Priorité |
|-----------|--------|----------|
| Failed login attempts | ❌ Manquant | CRITIQUE |
| Successful logins | ❌ Manquant | CRITIQUE |
| Password resets | ❌ Manquant | HAUTE |
| Email verification | ❌ Manquant | HAUTE |
| Account lockouts | ❌ Manquant | CRITIQUE |
| 403 errors (local) | ❌ Manquant | HAUTE |
| Permission denials | ❌ Manquant | HAUTE |
| Role changes | ❌ Manquant | MOYENNE |
| PII access | ❌ Manquant | MOYENNE |

**Note**: 403 errors loggés via SentryInterceptor uniquement (pas de logs locaux).

### 1.6 Logs IA & Services Externes

#### ⚠️ **AutoScoutService** (OpenAI GPT-4)
```typescript
✅ Cached report logs
✅ AI generation errors
❌ OpenAI API timing
❌ Token usage tracking
❌ Cost calculation
❌ Prompt/response logging (debug)
❌ Rate limit warnings
```

### 1.7 Recommandations Backend (Priorité)

#### 🔴 **IMMÉDIAT** (Semaine 1)

1. **Activer LoggingInterceptor**
   ```typescript
   // main.ts
   const loggerService = app.get(LoggerService);
   app.useGlobalInterceptors(new LoggingInterceptor(loggerService));
   ```

2. **Ajouter Logging Authentification**
   ```typescript
   // auth.service.ts
   async login(dto: LoginDto) {
     const user = await this.prisma.users.findUnique({ where: { email: dto.email } });

     if (!user || !user.passwordHash) {
       this.logger.warn(`Failed login attempt for email: ${dto.email}`);
       throw new UnauthorizedException('Invalid credentials');
     }

     const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

     if (!isValidPassword) {
       this.logger.warn(`Invalid password for user: ${user.id} (${dto.email})`);
       throw new UnauthorizedException('Invalid credentials');
     }

     if (!user.isActive) {
       this.logger.warn(`Login attempt for disabled account: ${user.id} (${dto.email})`);
       throw new UnauthorizedException('Account is disabled');
     }

     this.logger.log(`Successful login for user: ${user.id} (${dto.email})`);

     return this.generateTokens(user);
   }
   ```

3. **Corriger console.error dans scouting-reports.service.ts**
   ```typescript
   // Ligne 121-122
   - console.error('❌ Gamification error:', err.message);
   - console.error('Stack:', err.stack);
   + this.logger.error(`Gamification error: ${err.message}`, err.stack, 'ScoutingReportsService');
   ```

4. **Ajouter Guard Logging**
   ```typescript
   // jwt-auth.guard.ts
   export class JwtAuthGuard extends AuthGuard('jwt') {
     private readonly logger = new Logger(JwtAuthGuard.name);

     handleRequest(err, user, info, context) {
       const request = context.switchToHttp().getRequest();

       if (err || !user) {
         this.logger.warn(`JWT validation failed for ${request.method} ${request.url}: ${info?.message || err?.message}`);
         throw err || new UnauthorizedException();
       }

       return user;
     }
   }
   ```

5. **Activer Prisma Query Logging**
   - Voir code section 1.4 ci-dessus

#### 🟡 **COURT TERME** (Semaine 2-3)

6. Ajouter AI service observability (timing, tokens, coûts)
7. Ajouter business event logging (players, subscriptions, marketplace)
8. Créer global exception filter avec structured logging
9. Ajouter performance logging aux endpoints lents
10. Implémenter correlation IDs pour request tracing

#### 🔵 **LONG TERME** (Mois 1-2)

11. Standardiser sur NestJS Logger avec Winston transport
12. Ajouter structured log aggregation (ELK stack, Datadog, CloudWatch)
13. Créer logging dashboards pour monitoring
14. Implémenter log-based alerting pour événements critiques
15. Ajouter security audit trail pour compliance

---

## 🌐 PARTIE 2 — WEB (Next.js)

### 2.1 Infrastructure Existante

#### ✅ **EXCELLENTE** Infrastructure Disponible

| Composant | Fichier | Statut | Fonctionnalités |
|-----------|---------|--------|-----------------|
| **Logger** | `/web/src/lib/logger.ts` | ✅ Complet | info, warn, error, debug + Sentry |
| **Analytics** | `/web/src/lib/analytics.ts` | ✅ Complet | Event tracking, performance, user ID |
| **ErrorHandler** | `/web/src/lib/error-handler.ts` | ✅ Complet | Unified error handling |
| **API Interceptor** | `/web/src/lib/api-interceptor.ts` | ✅ Complet | Subscription error detection |
| **ErrorBoundary** | `/web/src/components/error-boundary.tsx` | ✅ Complet | React error boundary + Sentry |

#### ❌ **PROBLÈME MAJEUR**: Adoption Très Faible

**Statistiques**:
- **150+ occurrences** de `console.*` dans 90+ fichiers
- **~4 fichiers** utilisent le logger centralisé
- **Taux d'adoption**: ~3% ❌

### 2.2 Patterns de Logging Actuels

#### ❌ **Pattern Dominant** (95% des fichiers)
```typescript
// Direct console usage
try {
  const data = await apiClient.getPlayers();
  // ❌ NO success logging
} catch (error) {
  console.error("Error fetching players:", error);  // ❌ No context, no Sentry
  toast.error("Failed to fetch players");
}
```

#### ✅ **Pattern Recommandé** (utilisé dans <5% des fichiers)
```typescript
import { logError, logInfo } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

try {
  const startTime = Date.now();
  const data = await apiClient.getPlayers();

  logInfo('Players fetched successfully', {
    count: data.length,
    duration: Date.now() - startTime
  });

  analytics.track({
    type: 'player_interaction',
    action: 'fetch',
    metadata: { count: data.length }
  });

} catch (error) {
  logError('Failed to fetch players', error as Error, {
    endpoint: '/api/players',
    component: 'PlayersPage'
  });

  toast.error("Failed to fetch players");
}
```

### 2.3 Analyse par Catégorie

#### ⚠️ **API Client Logging** — Statut: PARTIAL
**Fichier**: `/web/src/lib/api-client.ts`

```typescript
// Ligne 56-135: Bon logging intégré
✅ Analytics tracking: analytics.apiCall(endpoint, method, duration, status)
✅ Error handling: this.handleError(error, endpoint, method, status)
✅ Sentry integration
❌ Ligne 129: Utilise console.error au lieu de logError()
```

**Fix requis**:
```typescript
- console.error(`API request failed: ${method} ${endpoint}`, error);
+ logError(`API request failed: ${method} ${endpoint}`, error as Error, { endpoint, method });
```

#### ❌ **React Query Logging** — Statut: MINIMAL

**Fichiers concernés**: 10+ hooks (`useData.ts`, `useGamification.ts`, `useCoaching.ts`, etc.)

**Pattern actuel** (`/web/src/hooks/useEvents.ts`):
```typescript
export function useCreateEvent() {
  return useMutation({
    mutationFn: (data) => eventsApi.create(data),
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast.success('Event created successfully');
      // ❌ NO logging of successful creation
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create event');
      console.error('Create event error:', error);  // ❌ Direct console
    },
  });
}
```

**Manquant**:
- Success event tracking
- Mutation timing
- User action analytics
- Centralized error logging

#### ❌ **Navigation Logging** — Statut: NONE

**Occurrences**: 147 utilisations de `router` dans 35 fichiers

```typescript
// ❌ Aucun tracking
router.push('/dashboard');
router.replace('/login');
```

**Manquant**:
- Page view tracking
- Navigation source tracking
- User journey analytics
- Deep link tracking

#### ⚠️ **Authentication Flow** — Statut: PARTIAL

**Login Page** (`/web/src/app/login/page.tsx:44-59`):
```typescript
try {
  await login(formData.email, formData.password);
  toast.success(loginCopy.toast.successTitle);
  // ❌ NO success analytics event
  setTimeout(() => router.push("/dashboard"), 500);
  // ❌ NO navigation tracking
} catch (error) {
  console.error("Login error:", error);  // ❌ Direct console
  toast.error(loginCopy.toast.errorTitle);
}
```

#### ❌ **UI Interaction Logging** — Statut: NONE

**Dashboard** (`/web/src/app/dashboard/page.tsx:255`):
```typescript
const handleSearchSubmit = (value: string) => {
  console.log("Search submitted:", value);  // ❌ Direct console.log
  // ❌ NO analytics tracking
};
```

**Manquant**:
- Button click tracking
- Form submission tracking
- Search query tracking
- Feature usage tracking
- Modal open/close events

### 2.4 Fichiers Critiques à Corriger

#### 🔴 **Haute Priorité**

1. **`/web/src/lib/api-client.ts`** (ligne 129)
2. **`/web/src/contexts/auth-context.tsx`** (lignes 67, 74, 81)
3. **`/web/src/app/login/page.tsx`** (ligne 51)
4. **`/web/src/app/signup/page.tsx`**
5. **`/web/src/app/dashboard/page.tsx`** (lignes 189, 255)

#### 🟡 **Moyenne Priorité**

6. **`/web/src/hooks/useNotifications.ts`** (lignes 107, 147, 183, 213)
7. **`/web/src/hooks/useSubscription.ts`** (ligne 56)
8. **`/web/src/app/reports/page.tsx`** (lignes 113, 197, 213, 229, 245)
9. **Tous les hooks React Query** (10+ fichiers)
10. **Tous les services** (`/web/src/services/*.ts`) — 25+ console.error

### 2.5 Inconsistances Trouvées

**4 Approches d'Error Handling Différentes**:

1. **Console direct** (90+ fichiers): `console.error("Error:", error);`
2. **Logger utility** (4 fichiers): `logError("Error message", error, context);`
3. **Analytics only** (API Client): `analytics.error('api_error', error.message);`
4. **Sentry only** (ErrorBoundary): `Sentry.captureException(error);`

### 2.6 Recommandations Web (Priorité)

#### 🔴 **IMMÉDIAT** (Semaine 1)

1. **Ajouter ESLint Rule**
   ```json
   // eslint.config.mjs
   {
     "rules": {
       "no-console": ["error", { "allow": ["warn"] }]
     }
   }
   ```

2. **Créer Logger Wrapper avec Analytics**
   ```typescript
   // /web/src/lib/log.ts
   export const log = {
     info: (msg: string, ctx?: any) => {
       logInfo(msg, ctx);
       if (ctx?.track) analytics.track(ctx.track);
     },
     error: (msg: string, err?: Error, ctx?: any) => {
       logError(msg, err, ctx);
       analytics.error(ctx?.type || 'error', msg, ctx?.component);
     },
   };
   ```

3. **Corriger API Client** (ligne 129)
4. **Corriger Auth Context** (3 lignes)
5. **Corriger Login/Signup pages** (2 fichiers)

#### 🟡 **COURT TERME** (Semaine 2-3)

6. **Ajouter Navigation Tracking**
   ```typescript
   // Router middleware
   useEffect(() => {
     const handleRouteChange = (url: string) => {
       analytics.pageView(url);
       logInfo('Page navigation', { url, source: 'router' });
     };

     router.events.on('routeChangeComplete', handleRouteChange);
     return () => router.events.off('routeChangeComplete', handleRouteChange);
   }, []);
   ```

7. **Standardiser React Query Hooks**
   ```typescript
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         onError: (error) => logError('Query failed', error as Error),
       },
       mutations: {
         onError: (error) => logError('Mutation failed', error as Error),
         onSuccess: (data, variables, context) => {
           logInfo('Mutation succeeded', { context });
         },
       },
     },
   });
   ```

8. **Ajouter Dashboard Action Tracking**
9. **Corriger tous les Service files** (3 fichiers)
10. **Corriger tous les API library files** (2 fichiers)

#### 🔵 **LONG TERME** (Semaine 4+)

11. Search/replace automatique `console.error` → `logError` (115 fichiers)
12. Performance monitoring (render time, route transitions)
13. User journey tracking (funnels, session duration)
14. Component lifecycle logging
15. Form submission tracking

---

## 📱 PARTIE 3 — MOBILE (React Native + Expo)

### 3.1 Infrastructure Existante

#### ✅ **Logger 1** (`/mobile/src/utils/logger.ts`) — ACTIF
- **Utilisé par**: API client
- **Fonctionnalités**:
  - Structured logging (timestamps, levels)
  - API call tracking (durée, status)
  - Navigation events
  - User actions
  - Error serialization (Axios)
- **Limitations**:
  - Sentry integration = **PLACEHOLDER ONLY** (lignes 155-168)
  - Pas de persistent storage
  - `storeLog()` = no-op (lignes 175-179)

#### ⚠️ **Logger 2** (`/mobile/src/services/logger.service.ts`) — NON INTÉGRÉ
- **Statut**: Complet mais **PAS UTILISÉ**
- **Fonctionnalités**:
  - File-based logging (Expo FileSystem)
  - Log rotation (5MB max)
  - Export functionality
  - Platform metadata
  - Méthodes spécialisées: `logApiRequest`, `logNavigation`, `logPerformance`, `logUserAction`
- **Problème**: Pas importé nulle part

### 3.2 Global Error Handler

**Fichier**: `/mobile/index.ts` (lignes 1-13)

```typescript
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('\n=== DETAILED ERROR CAPTURE ===');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('==============================\n');
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}
```

**Statut**: ✅ Actif mais **console-only** (pas de service de tracking)

### 3.3 Analyse par Catégorie

#### ⚠️ **Console.* Usage** — Statut: SCATTERED (100+ locations)

**Exemples**:
- `/mobile/src/hooks/usePlayers.ts:21` — `console.error('Error fetching players:', err);`
- `/mobile/src/contexts/AuthContext.tsx:54,71,90,99,112` — Auth errors
- `/mobile/src/services/api/camps.ts` — 12 console.error
- `/mobile/src/services/api/coaching.ts` — 12 console.error
- `/mobile/src/screens/ai/AIScreen.tsx:51,82` — AI errors
- `/mobile/src/screens/auth/LoginScreen.tsx:68` — Login errors
- `/mobile/src/screens/players/PlayersScreen.tsx:39` — Player loading

#### ✅ **API Client Logging** — Statut: PARTIAL

**Fichier**: `/mobile/src/services/api.ts`

```typescript
// Lignes 21-73
✅ Request interceptor avec logging
✅ Response interceptor avec durée
✅ API call tracking: logApiCall(endpoint, method, duration, status)
✅ Error logging pour 401 errors
✅ Token expiration detection

❌ Pas de request payload logging
❌ Pas de response body size
❌ Pas de retry logging
❌ Pas de cache hit/miss
❌ Pas de network connectivity logs
```

#### ❌ **Navigation Logging** — Statut: MISSING

**Fichiers vérifiés**:
- `/mobile/src/navigation/RootNavigator.tsx` — ❌ Aucun logging
- `/mobile/src/navigation/MainTabNavigator.tsx` — ❌ Aucun logging

**Disponible mais inutilisé**:
- `logger.navigation(from, to)` existe dans `/mobile/src/utils/logger.ts:78`
- `logNavigation(screen, params)` existe dans `/mobile/src/services/logger.service.ts:226`

#### ⚠️ **React Query Logging** — Statut: PARTIAL

**Config** (`/mobile/App.tsx`):
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    },
  },
});
```

**Manquant**:
- ❌ Pas de global `onError` handler
- ❌ Pas de query logging
- ❌ Pas de mutation logging
- ❌ Pas de cache performance tracking

**Bons exemples trouvés**:
- `/mobile/src/hooks/useGamification.ts` — onError callbacks (lignes 99, 175, 268)
- `/mobile/src/hooks/useCoaching.ts` — onError callbacks (lignes 117, 189, 213)

#### ❌ **Error Boundary** — Statut: **ABSENT**

**Recherche**: Aucun composant `ErrorBoundary*.{ts,tsx}` trouvé

**Impact**: Les erreurs de composants React crashent l'app sans recovery

#### ⚠️ **Authentication Flow** — Statut: ERRORS ONLY

**Fichier**: `/mobile/src/contexts/AuthContext.tsx`

```typescript
✅ Ligne 54: Failed to load stored auth
✅ Ligne 71: Login failed
✅ Ligne 90: Signup failed
✅ Ligne 99: Logout failed
✅ Ligne 112: Failed to update user

❌ Aucun log de login/signup/logout SUCCESS
❌ Aucun log de token refresh
❌ Aucun session duration tracking
❌ Aucun auth state transition
```

#### ❌ **Screen Lifecycle** — Statut: MISSING

**Vérification de 15 screens sur 295 fichiers**:
- `DashboardScreen.tsx` — Pas de `useFocusEffect`
- `AIScreen.tsx` — Seulement `useEffect` pour data loading
- `PlayersScreen.tsx` — Seulement `useEffect` initial
- `LoginScreen.tsx` — Pas de lifecycle logging

**Manquant**:
- Screen mount/unmount
- Screen focus/blur
- Background/foreground transitions
- Memory warnings

#### ❌ **User Interactions** — Statut: NONE

**Exemples d'interactions non trackées**:
- Button presses
- Form submissions
- Search queries
- Filter applications
- Modal opens/closes
- Tab switches
- Pull-to-refresh actions

#### 🚨 **Expo Error Reporting** — Statut: **NON CONFIGURÉ**

```typescript
❌ Pas de Sentry SDK (@sentry/react-native)
❌ Pas de Bugsnag
❌ Pas d'EAS error reporting
❌ Pas de Firebase Crashlytics
⚠️ Placeholder comment dans /mobile/src/utils/logger.ts:155-168
```

### 3.4 Recommandations Mobile (Priorité)

#### 🔴 **IMMÉDIAT** (Jours 1-2)

1. **Intégrer Sentry pour Expo**
   ```bash
   npx expo install @sentry/react-native
   ```

   ```typescript
   // index.ts
   import * as Sentry from '@sentry/react-native';

   Sentry.init({
     dsn: 'YOUR_SENTRY_DSN',
     enableAutoSessionTracking: true,
     tracesSampleRate: 1.0,
     integrations: [
       new Sentry.ReactNativeTracing({
         routingInstrumentation,
       }),
     ],
   });
   ```

2. **Créer ErrorBoundary React**
   ```typescript
   // /mobile/src/components/ErrorBoundary.tsx
   import React, { Component } from 'react';
   import { View, Text, TouchableOpacity } from 'react-native';
   import { logger } from '../utils/logger';
   import * as Sentry from '@sentry/react-native';

   export class ErrorBoundary extends Component {
     state = { hasError: false, error: null };

     static getDerivedStateFromError(error) {
       return { hasError: true, error };
     }

     componentDidCatch(error, errorInfo) {
       logger.error('ErrorBoundary caught error', error, {
         componentStack: errorInfo.componentStack,
       });
       Sentry.captureException(error, {
         contexts: { react: { componentStack: errorInfo.componentStack } }
       });
     }

     render() {
       if (this.state.hasError) {
         return (
           <View style={styles.container}>
             <Text style={styles.title}>Something went wrong</Text>
             <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
               <Text>Try Again</Text>
             </TouchableOpacity>
           </View>
         );
       }
       return this.props.children;
     }
   }
   ```

3. **Wrapper App.tsx avec ErrorBoundary**
   ```typescript
   // App.tsx
   import { ErrorBoundary } from './src/components/ErrorBoundary';

   export default function App() {
     return (
       <ErrorBoundary>
         <QueryClientProvider client={queryClient}>
           {/* ... */}
         </QueryClientProvider>
       </ErrorBoundary>
     );
   }
   ```

#### 🟡 **COURT TERME** (Jours 3-5)

4. **Activer Logger Service avec File Storage**
   ```typescript
   // Remplacer tous les console.error() avec:
   import { loggerService } from '../services/logger.service';

   loggerService.error('Error message', error, { context: 'ScreenName' });
   ```

5. **Ajouter Navigation Logging**
   ```typescript
   // RootNavigator.tsx
   import { useNavigationContainerRef } from '@react-navigation/native';
   import { logger } from '../utils/logger';

   const RootNavigator = () => {
     const navigationRef = useNavigationContainerRef();
     const routeNameRef = useRef<string>();

     return (
       <NavigationContainer
         ref={navigationRef}
         onReady={() => {
           routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
         }}
         onStateChange={async () => {
           const previousRouteName = routeNameRef.current;
           const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

           if (previousRouteName !== currentRouteName) {
             logger.navigation(previousRouteName || 'unknown', currentRouteName || 'unknown');
           }

           routeNameRef.current = currentRouteName;
         }}
       >
         {/* ... */}
       </NavigationContainer>
     );
   };
   ```

6. **Ajouter React Query Global Error Handler**
   ```typescript
   // App.tsx
   const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         retry: 2,
         onError: (error) => {
           logger.error('Query failed', error as Error);
         },
       },
       mutations: {
         onError: (error) => {
           logger.error('Mutation failed', error as Error);
         },
         onSuccess: (data, variables, context) => {
           logger.info('Mutation succeeded', { context });
         },
       },
     },
   });
   ```

7. **Ajouter Screen Lifecycle Logging**
   ```typescript
   import { useFocusEffect } from '@react-navigation/native';

   useFocusEffect(
     useCallback(() => {
       logger.info(`Screen focused: ${screenName}`);
       return () => logger.info(`Screen blurred: ${screenName}`);
     }, [])
   );
   ```

#### 🔵 **LONG TERME** (Jours 5-10)

8. **Performance Monitoring avec Sentry**
   ```typescript
   const transaction = Sentry.startTransaction({
     name: 'DashboardScreen',
     op: 'render',
   });

   // ... screen render

   transaction.finish();
   ```

9. **Network State Monitoring**
   ```bash
   npx expo install @react-native-community/netinfo
   ```

   ```typescript
   import NetInfo from '@react-native-community/netinfo';

   NetInfo.addEventListener(state => {
     logger.info('Network state changed', {
       type: state.type,
       isConnected: state.isConnected,
     });
   });
   ```

10. **In-App Log Viewer Screen** (optionnel)
    ```typescript
    // /mobile/src/screens/LogConsoleScreen.tsx
    import { loggerService } from '../services/logger.service';

    export function LogConsoleScreen() {
      const [logs, setLogs] = useState([]);

      const loadLogs = async () => {
        const allLogs = await loggerService.getLogs();
        setLogs(allLogs);
      };

      return (
        <View>
          <FlatList
            data={logs}
            renderItem={({ item }) => (
              <Text style={getStyleForLevel(item.level)}>
                {item.timestamp} - {item.message}
              </Text>
            )}
          />
        </View>
      );
    }
    ```

---

## 🎯 PARTIE 4 — PLAN D'IMPLÉMENTATION GLOBAL

### Phase 1 — Fondations (Semaine 1) 🔴

**Objectif**: Corriger les gaps critiques de sécurité et stabilité

#### Backend
- [ ] Activer LoggingInterceptor dans main.ts
- [ ] Ajouter logging authentification (AuthService)
- [ ] Corriger console.error dans scouting-reports.service.ts
- [ ] Ajouter guard logging (JwtAuthGuard, SubscriptionTierGuard)
- [ ] Activer Prisma query logging middleware

#### Web
- [ ] Ajouter ESLint rule no-console
- [ ] Créer logger wrapper avec analytics
- [ ] Corriger API client (ligne 129)
- [ ] Corriger auth context (3 lignes)
- [ ] Corriger login/signup pages (2 fichiers)

#### Mobile
- [ ] Installer et configurer Sentry
- [ ] Créer ErrorBoundary React
- [ ] Wrapper App.tsx avec ErrorBoundary
- [ ] Intégrer logger.service.ts (remplacer console.*)
- [ ] Ajouter navigation logging

**Fichiers à modifier**: ~20 fichiers
**Effort estimé**: 3-5 jours (1 développeur)

---

### Phase 2 — Observabilité (Semaine 2-3) 🟡

**Objectif**: Standardiser les patterns et ajouter observabilité métier

#### Backend
- [ ] Ajouter AI service observability (timing, tokens, coûts)
- [ ] Ajouter business event logging (players, subscriptions)
- [ ] Créer global exception filter
- [ ] Ajouter correlation IDs

#### Web
- [ ] Ajouter navigation tracking middleware
- [ ] Standardiser React Query hooks (10 fichiers)
- [ ] Ajouter dashboard action tracking
- [ ] Corriger tous les service files (3 fichiers)
- [ ] Corriger tous les API library files (2 fichiers)

#### Mobile
- [ ] Ajouter React Query global error handler
- [ ] Ajouter screen lifecycle logging (15 screens prioritaires)
- [ ] Ajouter user action tracking (button clicks, forms)
- [ ] Ajouter network state monitoring

**Fichiers à modifier**: ~40 fichiers
**Effort estimé**: 5-7 jours (1 développeur)

---

### Phase 3 — Logging Engine Complet (Semaine 3-4) 🔵

**Objectif**: Créer le système d'observabilité complet avec agents

#### A. Expo Log Bridge (Mobile)

**Fichier**: `/mobile/src/logging/expoLogBridge.ts`

```typescript
import { logger } from '../utils/logger';
import { loggerService } from '../services/logger.service';
import * as Sentry from '@sentry/react-native';

// Override console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

const formatLog = (level: string, args: any[]) => {
  const timestamp = new Date().toISOString();
  const message = args.map(arg =>
    typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
  ).join(' ');

  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

console.log = (...args) => {
  const formatted = formatLog('info', args);
  originalConsole.log(formatted); // ➜ Expo CLI
  loggerService.info(args[0], args.slice(1)); // ➜ File
};

console.error = (...args) => {
  const formatted = formatLog('error', args);
  originalConsole.error(formatted); // ➜ Expo CLI
  loggerService.error(args[0], args[1], args.slice(2)); // ➜ File
  if (args[1] instanceof Error) {
    Sentry.captureException(args[1]); // ➜ Sentry
  }
};

console.warn = (...args) => {
  const formatted = formatLog('warn', args);
  originalConsole.warn(formatted);
  loggerService.warn(args[0], args.slice(1));
};
```

#### B. Log Dashboard (Local HTML)

**Fichier**: `/logs/dashboard.html`

```html
<!DOCTYPE html>
<html>
<head>
  <title>Arcane Logging Dashboard</title>
  <style>
    body { font-family: 'Monaco', monospace; background: #1e1e1e; color: #d4d4d4; }
    .error { color: #f48771; }
    .warn { color: #dcdcaa; }
    .info { color: #4ec9b0; }
    .debug { color: #9cdcfe; }
    .log-entry { padding: 8px; border-bottom: 1px solid #333; }
    .timestamp { color: #858585; }
    .filter { padding: 10px; background: #252526; }
  </style>
</head>
<body>
  <div class="filter">
    <button onclick="filterLogs('all')">All</button>
    <button onclick="filterLogs('error')">Errors</button>
    <button onclick="filterLogs('api')">API</button>
    <button onclick="filterLogs('navigation')">Navigation</button>
  </div>
  <div id="logs"></div>
  <script>
    // Load logs from backend/YYYY-MM-DD.log, web/*, mobile/*
    // Display in real-time with filters
  </script>
</body>
</html>
```

#### C. Log Agent Automatique

**Fichier**: `/tools/log-agent/index.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: any;
}

class LogAgent {
  private logs: LogEntry[] = [];

  async readAllLogs() {
    // Read from backend/logs, web/logs, mobile logs
    const backendLogs = this.readBackendLogs();
    const webLogs = this.readWebLogs();
    const mobileLogs = this.readMobileLogs();

    this.logs = [...backendLogs, ...webLogs, ...mobileLogs];
  }

  analyzeErrors() {
    const errors = this.logs.filter(log => log.level === 'error');

    // Detect patterns
    const errorsByType = this.groupBy(errors, 'message');
    const recurringErrors = Object.entries(errorsByType)
      .filter(([_, errors]) => errors.length > 5)
      .map(([message, errors]) => ({
        message,
        count: errors.length,
        firstOccurrence: errors[0].timestamp,
        lastOccurrence: errors[errors.length - 1].timestamp,
      }));

    return recurringErrors;
  }

  analyzeBrokenFlows() {
    // Detect incomplete flows (e.g., login started but no success/error)
    const loginAttempts = this.logs.filter(log =>
      log.message.includes('login') || log.message.includes('Login')
    );

    // Group by user session
    // Detect abandoned flows
  }

  analyzeLatency() {
    const apiLogs = this.logs.filter(log =>
      log.context?.duration !== undefined
    );

    const slowAPIs = apiLogs
      .filter(log => log.context.duration > 2000)
      .map(log => ({
        endpoint: log.context.endpoint,
        duration: log.context.duration,
        timestamp: log.timestamp,
      }));

    return slowAPIs;
  }

  generateReport() {
    const report = {
      errors: this.analyzeErrors(),
      brokenFlows: this.analyzeBrokenFlows(),
      latency: this.analyzeLatency(),
    };

    fs.writeFileSync(
      'LOG_AGENT_REPORT.md',
      this.formatReport(report)
    );
  }

  generatePatches() {
    // Auto-generate patch files for fixes
  }
}

const agent = new LogAgent();
await agent.readAllLogs();
agent.generateReport();
agent.generatePatches();
```

**Fichiers à créer**: ~10 fichiers
**Effort estimé**: 5-7 jours (1 développeur)

---

### Phase 4 — Monitoring & Alerting (Semaine 5+) 🟣

**Objectif**: Production-ready monitoring avec alerting

#### Backend
- [ ] Structured log aggregation (ELK, Datadog, CloudWatch)
- [ ] Log-based alerting (critical errors, high latency)
- [ ] Security audit trail (compliance)
- [ ] Performance dashboards

#### Web
- [ ] Search/replace automatique console.* (115 fichiers)
- [ ] Component render time tracking
- [ ] User journey funnels
- [ ] Conversion tracking

#### Mobile
- [ ] Log upload service (background)
- [ ] Log batching (5 min / 100 entries)
- [ ] Log compression
- [ ] Advanced Sentry configuration (breadcrumbs, user context)

**Fichiers à modifier**: ~130 fichiers
**Effort estimé**: 10-15 jours (1 développeur)

---

## 📋 PARTIE 5 — CHECKLIST DE VALIDATION

### Backend ✅

- [ ] LoggingInterceptor activé dans main.ts
- [ ] AuthService avec login/logout logging
- [ ] Guards avec logging (JWT, Tier)
- [ ] Prisma query logging middleware actif
- [ ] Aucun console.* dans le code
- [ ] AI service avec timing/token tracking
- [ ] Business events loggés (achievements, subscriptions)
- [ ] Global exception filter avec structured logging
- [ ] Correlation IDs implémentés
- [ ] Security audit trail complet

### Web ✅

- [ ] ESLint rule no-console activée
- [ ] Logger wrapper créé et documenté
- [ ] API client sans console.*
- [ ] Auth context avec logging complet
- [ ] Navigation tracking middleware
- [ ] React Query avec global error handler
- [ ] Dashboard actions trackées
- [ ] Service files avec logger centralisé
- [ ] ErrorBoundary avec analytics
- [ ] User interaction tracking (clicks, forms)

### Mobile ✅

- [ ] Sentry SDK configuré
- [ ] ErrorBoundary React créé et wrapper App
- [ ] Logger service intégré (pas console.*)
- [ ] Navigation logging actif
- [ ] React Query global error handler
- [ ] Screen lifecycle logging (15+ screens)
- [ ] Auth flow success/error logging
- [ ] Network state monitoring
- [ ] Performance monitoring (Sentry)
- [ ] In-app log viewer (optionnel)

### Cross-Platform ✅

- [ ] Log dashboard HTML créé
- [ ] Log agent automatique fonctionnel
- [ ] Agent report génération OK
- [ ] Aucune exposition de données sensibles
- [ ] Log rotation configurée partout
- [ ] Documentation logging complète
- [ ] Exemples de logging dans docs
- [ ] Tests de logging (samples)

---

## 📊 PARTIE 6 — MÉTRIQUES & KPIs

### Objectifs de Couverture

| Métrique | Actuel | Cible Phase 1 | Cible Phase 4 |
|----------|--------|---------------|---------------|
| **Backend Logger Adoption** | 68% | 90% | 100% |
| **Web Logger Adoption** | 3% | 50% | 95% |
| **Mobile Logger Adoption** | 40% | 80% | 100% |
| **Critical Flows Logged** | 30% | 90% | 100% |
| **Error Coverage** | 60% | 95% | 100% |
| **Security Events Logged** | 10% | 80% | 100% |
| **API Calls Logged** | 85% | 95% | 100% |
| **Navigation Logged** | 0% | 100% | 100% |

### Métriques de Production

- **Mean Time to Detection (MTTD)**: < 5 minutes
- **Mean Time to Resolution (MTTR)**: < 2 heures
- **Error Rate Alert Threshold**: > 5% sur 15 min
- **Latency Alert Threshold**: p95 > 2000ms
- **Log Volume**: ~10-50 MB/jour par plateforme

---

## 🎓 PARTIE 7 — EXEMPLES & TEMPLATES

### Template 1: Backend Service Logging

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ExampleService {
  private readonly logger = new Logger(ExampleService.name);

  async fetchData(userId: string) {
    const startTime = Date.now();

    try {
      this.logger.log(`Fetching data for user ${userId}`);

      const data = await this.prisma.data.findMany({
        where: { userId },
      });

      const duration = Date.now() - startTime;
      this.logger.log(`Fetched ${data.length} records in ${duration}ms for user ${userId}`);

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Failed to fetch data for user ${userId} after ${duration}ms: ${error.message}`,
        error.stack,
        'ExampleService.fetchData'
      );
      throw error;
    }
  }
}
```

### Template 2: Web Component Logging

```typescript
import { useState, useEffect } from 'react';
import { logError, logInfo } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

export function ExampleComponent() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const startTime = Date.now();

      try {
        const result = await apiClient.getData();

        logInfo('Data fetched successfully', {
          count: result.length,
          duration: Date.now() - startTime,
          component: 'ExampleComponent',
        });

        analytics.track({
          type: 'data_interaction',
          action: 'fetch',
          metadata: { count: result.length },
        });

        setData(result);
      } catch (error) {
        logError('Failed to fetch data', error as Error, {
          component: 'ExampleComponent',
          duration: Date.now() - startTime,
        });

        toast.error('Failed to load data');
      }
    };

    fetchData();
  }, []);

  const handleButtonClick = (action: string) => {
    analytics.buttonClick(action, 'ExampleComponent');
    logInfo('User action', { action, component: 'ExampleComponent' });
  };

  return <div>{/* ... */}</div>;
}
```

### Template 3: Mobile Screen Logging

```typescript
import React, { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { logger } from '../utils/logger';

export function ExampleScreen() {
  useFocusEffect(
    useCallback(() => {
      logger.info('Screen focused: ExampleScreen');

      return () => {
        logger.info('Screen blurred: ExampleScreen');
      };
    }, [])
  );

  const handleButtonPress = async (action: string) => {
    const startTime = Date.now();

    logger.userAction(action, 'ExampleScreen', { timestamp: startTime });

    try {
      const result = await api.performAction(action);

      logger.info('Action completed', {
        action,
        screen: 'ExampleScreen',
        duration: Date.now() - startTime,
        success: true,
      });
    } catch (error) {
      logger.error('Action failed', error as Error, {
        action,
        screen: 'ExampleScreen',
        duration: Date.now() - startTime,
      });
    }
  };

  return <View>{/* ... */}</View>;
}
```

---

## 🚀 PARTIE 8 — PROCHAINES ÉTAPES

### STOP — Validation Requise ✋

**Avant de commencer l'implémentation**:

1. ✅ Revue de l'audit complet
2. ✅ Validation des priorités
3. ✅ Validation du plan Phase 1
4. ✅ Validation des templates
5. ✅ Allocation des ressources

### Questions pour le Product Owner

1. **Priorité Sentry**: Quel service préférez-vous ? (Sentry, Bugsnag, EAS, Crashlytics)
2. **Log Storage**: Hébergement cloud ou local pour l'agrégation ? (ELK, Datadog, CloudWatch)
3. **Budget Monitoring**: Budget alloué aux services tiers ?
4. **Timeline**: Phase 1 à démarrer immédiatement ou planning différé ?
5. **Ressources**: 1 développeur dédié ou équipe complète ?

---

## 📈 ANNEXE — STATISTIQUES DÉTAILLÉES

### Fichiers Analysés

- **Backend**: 72 fichiers (41 services, 31 controllers)
- **Web**: 115+ fichiers (pages, components, hooks, services)
- **Mobile**: 295 fichiers (25+ analysés en détail)

### Occurrences Trouvées

- **Backend console.***: 2 (très bon)
- **Web console.***: 150+ (critique)
- **Mobile console.***: 100+ (élevé)
- **Total logger calls (Backend)**: 214
- **Total try/catch (Web)**: 162

### Effort d'Implémentation Estimé

| Phase | Backend | Web | Mobile | Total |
|-------|---------|-----|--------|-------|
| Phase 1 | 2 jours | 2 jours | 2 jours | **6 jours** |
| Phase 2 | 3 jours | 3 jours | 3 jours | **9 jours** |
| Phase 3 | 3 jours | 5 jours | 3 jours | **11 jours** |
| Phase 4 | 5 jours | 7 jours | 3 jours | **15 jours** |
| **TOTAL** | **13 jours** | **17 jours** | **11 jours** | **41 jours** |

**Note**: 1 développeur full-time, séquentiel. En parallèle (3 devs): ~15 jours.

---

## ✅ FIN DE L'AUDIT — EN ATTENTE DE VALIDATION

**Rapport généré**: 2025-11-18
**Prochaine étape**: Validation du plan avant Phase 1
**Contact**: Attente des instructions pour démarrage Phase 1

---

**Document Version**: 1.0
**Status**: ✋ **AWAITING APPROVAL**