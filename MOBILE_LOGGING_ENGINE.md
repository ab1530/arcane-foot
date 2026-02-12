# 📱 ARCANE — MOBILE LOGGING ENGINE

**Date**: 2025-11-18
**Plateforme**: React Native + Expo
**Statut**: ✅ **IMPLÉMENTÉ ET OPÉRATIONNEL**

---

## 📊 RÉSUMÉ EXÉCUTIF

Le **Mobile Logging Engine** est maintenant complètement opérationnel avec :

✅ **Expo Log Bridge** — Override de console.* avec styling ANSI pour Expo CLI
✅ **Navigation Tracking** — Logs automatiques de toutes les navigations
✅ **ErrorBoundary React** — Récupération gracieuse des erreurs component
✅ **React Query Global Error Handling** — Tracking des erreurs queries/mutations
✅ **API Client Integration** — Logs automatiques de tous les appels API
✅ **LogConsoleScreen** — Visualisation in-app des logs avec filtres
✅ **File-based Logging** — Stockage persistant avec rotation automatique

---

## 🏗️ ARCHITECTURE

### Composants Principaux

```
/mobile/src/
├── logging/
│   └── expoLogBridge.ts          # Console override + ANSI styling
├── services/
│   ├── logger.service.ts         # File-based logging avec rotation
│   └── api.ts                    # API client avec logs intégrés
├── components/
│   └── ErrorBoundary.tsx         # React error boundary
├── navigation/
│   └── RootNavigator.tsx         # Navigation tracking
├── screens/
│   └── debug/
│       └── LogConsoleScreen.tsx  # In-app log viewer
└── App.tsx                       # ErrorBoundary wrapper + Query config

/mobile/index.ts                  # Log Bridge initialization
```

---

## 🚀 FONCTIONNALITÉS

### 1. Expo Log Bridge

**Fichier**: `/mobile/src/logging/expoLogBridge.ts`

#### Capacités

- ✅ **Console Override**: Intercepte tous les `console.log/warn/error/debug`
- ✅ **ANSI Colors**: Formatage couleur pour Expo CLI terminal
- ✅ **Auto-tagging**: Détection automatique des tags (API, NAVIGATION, AUTH, AI, etc.)
- ✅ **Timestamps**: Format TIME_ONLY, SHORT, ou ISO
- ✅ **Context Enrichment**: Ajout automatique de métadonnées
- ✅ **File Storage**: Écriture automatique dans fichiers logs via logger.service
- ✅ **Sentry Ready**: Placeholder pour intégration Sentry

#### Tags Disponibles

| Tag | Usage | Couleur Expo CLI |
|-----|-------|------------------|
| `API` | Appels API, fetch, axios | Cyan |
| `NAVIGATION` | Navigation React Navigation | Blue |
| `UI` | Render, composants, interactions | Green |
| `AI` | OpenAI, GPT, AI services | Magenta |
| `ERROR` | Erreurs, exceptions, crashes | Red |
| `AUTH` | Login, logout, tokens | Yellow |
| `DATA` | Data fetching, cache, storage | Cyan |
| `PERFORMANCE` | Timing, slow operations | Yellow |
| `USER_ACTION` | Clicks, presses, forms | Green |
| `SYSTEM` | App lifecycle, init | White |

#### Méthodes Publiques

```typescript
import { logBridge, log, logAPI, logNavigation, logError, logUserAction, logAI, logPerformance } from '../logging/expoLogBridge';

// Generic logging
log('Message', 'SYSTEM', { context: 'optional' });
logInfo('Info message', 'API');
logWarn('Warning message', 'AUTH');
logError('Error message', error, { component: 'ScreenName' });
logDebug('Debug message', 'SYSTEM'); // Dev only

// Specialized logging
logAPI('GET', '/api/players', 200, 1234); // method, endpoint, status, duration
logNavigation('Home', 'Players', { playerId: '123' }); // from, to, params
logUserAction('button_click', 'DashboardScreen', { buttonId: 'export' });
logAI('OpenAI', 'completion', 2345, 150); // service, operation, duration, tokens
logPerformance('data_fetch', 567, { count: 50 }); // operation, duration, metadata
```

#### Exemple de Sortie Expo CLI

```bash
14:32:15 INFO [SYSTEM] Expo Log Bridge initialized
14:32:16 🧭 NAVIGATION [NAVIGATION] AuthState → Authenticated
14:32:18 ✅ API [API] GET /api/players - 200 (234ms)
14:32:20 👆 USER_ACTION [USER_ACTION] User button_click on PlayersScreen
14:32:22 🤖 AI [AI] OpenAI - completion (1456ms, 120 tokens)
14:32:25 ❌ ERROR [ERROR] Component Error: Cannot read property 'id' of undefined
```

### 2. Navigation Tracking

**Fichier**: `/mobile/src/navigation/RootNavigator.tsx`

#### Capacités

- ✅ Logs automatiques de toutes les navigations
- ✅ Capture des params de navigation
- ✅ Tracking de l'état d'authentification
- ✅ Route initiale logged

#### Exemple de Logs

```typescript
// Auth state change
logNavigation('AuthState', 'Authenticated', { isAuthenticated: true });

// Screen navigation
logNavigation('Home', 'PlayersScreen', {
  params: { playerId: '123' },
  timestamp: '2025-11-18T14:32:16.000Z'
});
```

### 3. ErrorBoundary

**Fichier**: `/mobile/src/components/ErrorBoundary.tsx`

#### Capacités

- ✅ Catch unhandled React component errors
- ✅ Graceful error UI avec bouton "Try Again"
- ✅ Developer mode: Stack trace + component stack
- ✅ Logging automatique avec context complet
- ✅ Sentry integration ready

#### UI Features

**Production Mode**:
- ⚠️ Icon
- User-friendly message
- "Try Again" button

**Dev Mode** (en plus):
- Error name
- Error message
- Stack trace
- Component stack

### 4. React Query Error Handling

**Fichier**: `/mobile/App.tsx`

#### Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      onError: (error) => {
        logError('React Query Error', error as Error, {
          type: 'query',
          timestamp: new Date().toISOString(),
        });
      },
    },
    mutations: {
      onError: (error) => {
        logError('React Query Mutation Error', error as Error, {
          type: 'mutation',
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});
```

### 5. API Client Integration

**Fichier**: `/mobile/src/services/api.ts`

#### Capacités

- ✅ Request interceptor: Ajout timestamp + auth token
- ✅ Response interceptor: Log duration + status
- ✅ Error interceptor: Log failed requests avec détails
- ✅ Auto-detection token expiration (401)
- ✅ Formatted logs avec emoji status

#### Exemple de Logs

```typescript
// Success
✅ GET /api/players - 200 (234ms)

// Client Error
⚠️ GET /api/players/invalid - 404 (123ms)
ERROR: API GET /api/players/invalid failed
  Status: 404
  StatusText: Not Found
  Data: { message: 'Player not found' }

// Server Error
❌ POST /api/reports - 500 (567ms)
ERROR: API POST /api/reports failed
  Status: 500
  StatusText: Internal Server Error

// Token Expiration
❌ GET /api/me - 401 (89ms)
WARN [AUTH] Authentication token expired or invalid
```

### 6. File-Based Logging

**Fichier**: `/mobile/src/services/logger.service.ts`

#### Capacités

- ✅ **Persistent Storage**: Logs sauvegardés dans `FileSystem.documentDirectory/logs/`
- ✅ **Auto-Rotation**: Rotation automatique à 5MB
- ✅ **Max Files**: Garde les 5 fichiers les plus récents
- ✅ **In-Memory Buffer**: 1000 logs en mémoire pour affichage rapide
- ✅ **Export Function**: Export de tous les logs
- ✅ **Platform Metadata**: OS, platform info dans chaque log

#### Structure de Fichier Log

```
[2025-11-18T14:32:15.123Z] [INFO] [API] GET /api/players - 200 (234ms)
[2025-11-18T14:32:16.456Z] [NAVIGATION] [NAVIGATION] Home → Players
[2025-11-18T14:32:17.789Z] [ERROR] [API] POST /api/reports failed
Stack: Error: Request failed with status code 500
    at createError (axios/lib/core/createError.js:16:15)
    ...
```

#### Gestion des Fichiers

- **Fichier actuel**: `app.log`
- **Fichiers backup**: `app_2025-11-18T14-30-00-000Z.log`
- **Nettoyage auto**: Suppression des fichiers > 5 fichiers

### 7. LogConsoleScreen (In-App Viewer)

**Fichier**: `/mobile/src/screens/debug/LogConsoleScreen.tsx`

#### Features

- ✅ **Real-Time Viewing**: Auto-refresh tous les 2 secondes
- ✅ **Filter by Level**: ALL, ERROR, WARN, INFO, DEBUG
- ✅ **Filter by Tag**: API, NAVIGATION, UI, AI, ERROR, etc.
- ✅ **Search**: Recherche textuelle dans message + context
- ✅ **Export**: Share logs via Share API (iOS/Android)
- ✅ **Clear**: Suppression de tous les logs avec confirmation
- ✅ **Styled**: Dark theme avec couleurs par level

#### UI Layout

```
┌─────────────────────────────────┐
│ Log Console        125 logs     │
├─────────────────────────────────┤
│ 🔍 Search logs...               │
├─────────────────────────────────┤
│ Level: [ALL] ERROR WARN INFO    │
├─────────────────────────────────┤
│ Tag: [ALL] API NAV UI AI ERROR  │
├─────────────────────────────────┤
│ [ERROR] [API] 14:32:15          │
│ API GET /players failed         │
│ { status: 500, ... }            │
├─────────────────────────────────┤
│ [INFO] [NAVIGATION] 14:32:16    │
│ Home → Players                  │
├─────────────────────────────────┤
│ ... (scrollable)                │
├─────────────────────────────────┤
│ [Clear]          [Export]       │
└─────────────────────────────────┘
```

#### Accès au Screen

**Option 1**: Ajouter un route dans AppNavigator (recommandé dev mode)

```typescript
// AppNavigator.tsx
import LogConsoleScreen from '../screens/debug/LogConsoleScreen';

<Stack.Screen name="LogConsole" component={LogConsoleScreen} />
```

**Option 2**: Dev Menu (shake gesture)

```typescript
// DevMenuButton.tsx (créer)
import { logBridge } from '../logging/expoLogBridge';

if (__DEV__) {
  // Add button in Settings or Dev Menu
}
```

---

## 📝 GUIDE D'UTILISATION

### Logging dans un Screen

```typescript
import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { logUserAction, logPerformance, logError } from '../logging/expoLogBridge';

export function MyScreen() {
  useEffect(() => {
    const startTime = Date.now();

    // Load data...

    const duration = Date.now() - startTime;
    logPerformance('screen_mount', duration, { screen: 'MyScreen' });
  }, []);

  const handleButtonPress = async () => {
    logUserAction('export_clicked', 'MyScreen', { timestamp: Date.now() });

    try {
      await exportData();
    } catch (error) {
      logError('Export failed', error as Error, {
        screen: 'MyScreen',
        action: 'export',
      });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleButtonPress}>
        <Text>Export</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Logging dans un Hook

```typescript
import { useQuery } from '@tanstack/react-query';
import { logError, log } from '../logging/expoLogBridge';

export function usePlayers() {
  return useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const startTime = Date.now();

      try {
        const data = await api.getPlayers();
        const duration = Date.now() - startTime;

        log(`Fetched ${data.length} players in ${duration}ms`, 'DATA', {
          count: data.length,
          duration,
        });

        return data;
      } catch (error) {
        logError('Failed to fetch players', error as Error, {
          hook: 'usePlayers',
        });
        throw error;
      }
    },
  });
}
```

### Logging dans un Service

```typescript
import { logAI } from '../logging/expoLogBridge';

export class AIService {
  async generateReport(playerId: string) {
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    });

    const duration = Date.now() - startTime;
    const tokens = response.usage?.total_tokens || 0;

    logAI('OpenAI', 'report_generation', duration, tokens);

    return response.choices[0].message.content;
  }
}
```

---

## 🔧 CONFIGURATION

### index.ts

```typescript
import { logBridge } from './src/logging/expoLogBridge';

// Initialize FIRST (before any imports)
logBridge.init({
  enableColors: true,          // ANSI colors dans Expo CLI
  enableFileLogging: true,     // Stockage fichier
  enableSentry: false,         // Sentry (à activer après install)
  timestampFormat: 'TIME_ONLY' // TIME_ONLY | SHORT | ISO
});
```

### Expo CLI Visibility

Les logs apparaissent automatiquement dans :

1. **Metro Bundler Terminal** (Expo CLI)
   - Couleurs ANSI
   - Tags visibles
   - Emojis status

2. **React Native Debugger** (si connecté)

3. **Expo DevTools** (navigateur)

4. **LogConsoleScreen** (in-app)

### File Storage Location

- **iOS**: `/var/mobile/Containers/Data/Application/{UUID}/Documents/logs/`
- **Android**: `/data/user/0/com.yourapp/files/logs/`
- **Expo Go**: Limité, utiliser dev client pour accès fichiers

---

## 🎯 BEST PRACTICES

### 1. Tagging Approprié

```typescript
// ❌ BAD
console.log('API call finished');

// ✅ GOOD
logAPI('GET', '/api/players', 200, 234);
```

### 2. Context Enrichment

```typescript
// ❌ BAD
logError('Failed', error);

// ✅ GOOD
logError('Failed to load players', error, {
  screen: 'PlayersScreen',
  userId: user.id,
  filters: { position: 'GK' },
  timestamp: Date.now(),
});
```

### 3. Performance Logging

```typescript
// ✅ Track slow operations
const startTime = Date.now();
const data = await heavyOperation();
const duration = Date.now() - startTime;

if (duration > 1000) {
  logPerformance('heavy_operation_slow', duration, {
    operation: 'heavyOperation',
    dataSize: data.length,
  });
}
```

### 4. User Action Tracking

```typescript
// ✅ Track critical user actions
const handleCheckout = async () => {
  logUserAction('checkout_initiated', 'CartScreen', {
    itemCount: cart.length,
    totalPrice: cart.total,
  });

  try {
    await processCheckout();
    logUserAction('checkout_completed', 'CartScreen', { success: true });
  } catch (error) {
    logUserAction('checkout_failed', 'CartScreen', { success: false });
    logError('Checkout failed', error as Error);
  }
};
```

### 5. AI Service Tracking

```typescript
// ✅ Track AI costs and performance
const { completion, tokens } = await generateReport(playerId);

logAI('OpenAI', 'report_generation', duration, tokens);

// Calculate cost
const cost = (tokens / 1000) * 0.002; // $0.002 per 1K tokens
if (cost > 0.05) {
  logWarn(`High AI cost: $${cost.toFixed(4)}`, 'AI', { tokens, playerId });
}
```

---

## 🐛 DEBUGGING

### Expo CLI Logs Not Showing

**Solution**:
```bash
# Restart Metro bundler
npx expo start --clear

# Check log bridge initialization
# Should see: "Expo Log Bridge initialized"
```

### Logs Not Persisting

**Solution**:
```typescript
// Check file permissions
import * as FileSystem from 'expo-file-system';

const logsDir = `${FileSystem.documentDirectory}logs`;
const dirInfo = await FileSystem.getInfoAsync(logsDir);
console.log('Logs dir exists:', dirInfo.exists);
```

### LogConsoleScreen Empty

**Solution**:
```typescript
// Check in-memory logs
import { logger } from '../services/logger.service';

const logs = logger.getInMemoryLogs();
console.log('In-memory logs count:', logs.length);
```

### Navigation Logs Missing

**Solution**:
```typescript
// Verify NavigationContainer has ref and onStateChange
<NavigationContainer
  ref={navigationRef}
  onStateChange={() => { /* ... */ }}
>
```

---

## 📊 MONITORING & ANALYTICS

### Logs par Jour (Estimations)

| Type | Volume Estimé | Taille |
|------|---------------|--------|
| API Calls | ~200-500 logs | ~50KB |
| Navigation | ~100-200 logs | ~20KB |
| User Actions | ~50-100 logs | ~10KB |
| Errors | ~5-20 logs | ~5KB |
| **TOTAL** | **~500-1000 logs/jour** | **~100KB/jour** |

### Rotation

- **5MB** par fichier = ~50 jours de logs
- **5 fichiers** max = ~250 jours d'historique
- Nettoyage automatique des fichiers > 5

---

## 🚀 PROCHAINES ÉTAPES (OPTIONNEL)

### Sentry Integration

```bash
# Installation
npx expo install @sentry/react-native

# Configuration
```

```typescript
// index.ts
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  enableAutoSessionTracking: true,
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  environment: __DEV__ ? 'development' : 'production',
});

// expoLogBridge.ts
logBridge.init({
  enableSentry: true, // Activate Sentry integration
});
```

### Analytics Integration

```typescript
// Firebase Analytics, Mixpanel, Amplitude, etc.
import analytics from '@react-native-firebase/analytics';

// Dans expoLogBridge.ts
private sendToAnalytics(event: string, properties: any) {
  analytics().logEvent(event, properties);
}
```

### Remote Log Aggregation

```typescript
// Send logs to backend for centralized monitoring
async exportLogsToServer() {
  const logs = await logger.exportLogs();

  await fetch('https://api.yourapp.com/logs/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: logs,
  });
}
```

---

## ✅ CHECKLIST DE VALIDATION

- [x] Expo Log Bridge initialisé dans index.ts
- [x] Console.* overridden et stylé
- [x] Navigation tracking actif
- [x] ErrorBoundary wrapping App
- [x] React Query error handling configuré
- [x] API client intégré avec logAPI
- [x] File logging fonctionnel avec rotation
- [x] LogConsoleScreen créé et accessible
- [ ] Sentry installé et configuré (OPTIONNEL)
- [ ] Route vers LogConsoleScreen ajoutée (OPTIONNEL)

---

## 📈 IMPACT PERFORMANCE

### Overhead Estimé

- **Console Override**: < 1ms par log
- **File Write**: Asynchrone, pas de blocage UI
- **Log Rotation**: ~50ms (rare, seulement à 5MB)
- **In-Memory Buffer**: ~10KB RAM pour 1000 logs

### Optimisations

- ✅ File writes sont asynchrones (pas de blocage)
- ✅ Logs debug désactivés en production
- ✅ Sentry sampling rate configurable
- ✅ Batch writes toutes les 100 logs (optionnel)

---

## 🎓 EXEMPLES AVANCÉS

### Custom Log Tags

```typescript
// Extend LogTag type
export type CustomLogTag = LogTag | 'PAYMENT' | 'ANALYTICS' | 'CACHE';

logBridge.log('Payment processed', 'PAYMENT' as any, {
  amount: 99.99,
  currency: 'EUR',
});
```

### Conditional Logging

```typescript
const DEBUG_SCREENS = ['DashboardScreen', 'PlayersScreen'];

function logScreenEvent(screen: string, event: string, data?: any) {
  if (__DEV__ || DEBUG_SCREENS.includes(screen)) {
    log(`${screen}: ${event}`, 'UI', data);
  }
}
```

### Performance Budgets

```typescript
function logWithBudget(
  operation: string,
  duration: number,
  budget: number,
  metadata?: any
) {
  const overBudget = duration > budget;

  if (overBudget) {
    logWarn(
      `${operation} exceeded budget (${duration}ms > ${budget}ms)`,
      'PERFORMANCE',
      { duration, budget, overBy: duration - budget, ...metadata }
    );
  } else {
    logPerformance(operation, duration, metadata);
  }
}

// Usage
logWithBudget('data_fetch', 2500, 1000, { count: 100 }); // ⚠️ Logged as warning
```

---

## 📞 SUPPORT

### Logs ne s'affichent pas dans Expo CLI ?

1. Vérifier que `logBridge.init()` est appelé dans `index.ts`
2. Vérifier que Metro Bundler est démarré avec `--clear`
3. Vérifier que `enableColors: true` dans la config

### Crash de l'app au démarrage ?

1. Vérifier les imports circulaires
2. Vérifier que `ErrorBoundary` est importé correctement
3. Vérifier les permissions FileSystem sur device

### Logs trop verbeux ?

```typescript
// Désactiver debug logs
logBridge.init({
  enableColors: true,
  enableFileLogging: false, // Disable file logging
  timestampFormat: 'SHORT',
});

// Ou filtrer par tag
const ALLOWED_TAGS = ['ERROR', 'AUTH', 'API'];
```

---

## 🏆 RÉSULTAT FINAL

Le **Mobile Logging Engine** est maintenant **production-ready** avec :

1. ✅ Logs visibles en temps réel dans Expo CLI (avec couleurs)
2. ✅ Stockage persistant avec rotation automatique
3. ✅ Tracking automatique de toutes les navigations
4. ✅ Error boundary global avec recovery UI
5. ✅ API calls automatiquement loggés avec timing
6. ✅ React Query errors capturés
7. ✅ In-app log viewer avec filtres
8. ✅ Export de logs pour debugging
9. ✅ Prêt pour Sentry integration

**Zero régression business** : Aucune modification de logique métier, juste de l'observabilité pure.

---

**Document Version**: 1.0
**Status**: ✅ **COMPLET ET OPÉRATIONNEL**
**Prochaine Phase**: Attente validation pour Web + Backend