# Intégration du Logger dans l'Application Mobile

## Installation des Dépendances

```bash
cd mobile
npm install expo-file-system
# ou
npx expo install expo-file-system
```

## Import du Logger

Le logger est un singleton, il suffit de l'importer :

```typescript
import { logger } from './src/services/logger.service';
```

## Utilisation dans les Composants React

### Exemple 1: Composant Screen

```typescript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { logger } from '../services/logger.service';

export const HomeScreen = () => {
  useEffect(() => {
    logger.logNavigation('HomeScreen');
    logger.info('Home screen mounted', 'HomeScreen');

    return () => {
      logger.debug('Home screen unmounted', 'HomeScreen');
    };
  }, []);

  return (
    <View>
      <Text>Home Screen</Text>
    </View>
  );
};
```

### Exemple 2: Gestion des Actions Utilisateur

```typescript
import React from 'react';
import { Button } from 'react-native';
import { logger } from '../services/logger.service';

export const ActionButton = () => {
  const handlePress = () => {
    logger.logUserAction('button-press', {
      buttonId: 'submit-form',
      screenName: 'ProfileScreen',
    });

    // Logique du bouton
    submitForm();
  };

  return <Button title="Submit" onPress={handlePress} />;
};
```

### Exemple 3: Gestion d'Erreurs

```typescript
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { logger } from '../services/logger.service';

export const DataComponent = () => {
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      logger.info('Fetching data', 'DataComponent');
      const data = await api.getData();
      logger.info('Data fetched successfully', 'DataComponent', {
        itemCount: data.length,
      });
    } catch (err) {
      logger.error('Failed to fetch data', 'DataComponent', {
        errorMessage: err.message,
      }, err as Error);
      setError(err as Error);
    }
  };

  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  return <Button title="Fetch Data" onPress={fetchData} />;
};
```

## Utilisation dans les Services API

### Exemple 1: Service API avec Fetch

```typescript
import { logger } from '../services/logger.service';

class ApiService {
  private baseURL = 'https://api.example.com';

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    try {
      logger.debug(`API Request: GET ${url}`, 'ApiService');

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        logger.logApiError('GET', url, {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      logger.logApiRequest('GET', url, response.status, duration);

      if (duration > 2000) {
        logger.warn('Slow API request detected', 'ApiService', {
          url,
          duration,
        });
      }

      return data;
    } catch (error) {
      logger.logApiError('GET', url, error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = Date.now();

    try {
      logger.debug(`API Request: POST ${url}`, 'ApiService');

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const duration = Date.now() - startTime;

      if (!response.ok) {
        logger.logApiError('POST', url, {
          status: response.status,
          statusText: response.statusText,
        });
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      logger.logApiRequest('POST', url, response.status, duration);

      return result;
    } catch (error) {
      logger.logApiError('POST', url, error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
```

### Exemple 2: Service API avec Axios

```typescript
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { logger } from '../services/logger.service';

const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    logger.debug(
      `API Request: ${config.method?.toUpperCase()} ${config.url}`,
      'ApiService',
    );
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => {
    logger.error('API Request failed', 'ApiService', {}, error);
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const duration = Date.now() - (response.config.metadata?.startTime || 0);

    logger.logApiRequest(
      response.config.method?.toUpperCase() || 'GET',
      response.config.url || '',
      response.status,
      duration,
    );

    if (duration > 2000) {
      logger.warn('Slow API response', 'ApiService', {
        url: response.config.url,
        duration,
      });
    }

    return response;
  },
  (error: AxiosError) => {
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);

    logger.logApiError(
      error.config?.method?.toUpperCase() || 'UNKNOWN',
      error.config?.url || '',
      {
        status: error.response?.status,
        message: error.message,
        duration,
      },
    );

    return Promise.reject(error);
  },
);

export default api;
```

## Utilisation dans React Navigation

### Navigation Tracking

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { logger } from './src/services/logger.service';

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string>();

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRouteName = navigationRef.getCurrentRoute()?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          logger.logNavigation(currentRouteName, {
            previousScreen: previousRouteName,
          });
        }

        routeNameRef.current = currentRouteName;
      }}
    >
      {/* Navigation screens */}
    </NavigationContainer>
  );
}
```

## Utilisation dans Redux/Context

### Redux Middleware

```typescript
import { Middleware } from 'redux';
import { logger } from '../services/logger.service';

export const loggingMiddleware: Middleware = (store) => (next) => (action) => {
  logger.debug('Redux Action', 'Redux', {
    type: action.type,
    payload: action.payload,
  });

  const startTime = Date.now();
  const result = next(action);
  const duration = Date.now() - startTime;

  if (duration > 100) {
    logger.warn('Slow Redux action', 'Redux', {
      action: action.type,
      duration,
    });
  }

  return result;
};
```

## Performance Monitoring

### Composant avec Performance Tracking

```typescript
import React, { useEffect } from 'react';
import { logger } from '../services/logger.service';

export const HeavyComponent = () => {
  useEffect(() => {
    const startTime = Date.now();

    // Opération lourde
    performHeavyOperation();

    const duration = Date.now() - startTime;
    logger.logPerformance('heavy-operation', duration, {
      component: 'HeavyComponent',
    });

    if (duration > 1000) {
      logger.warn('Slow component render', 'HeavyComponent', { duration });
    }
  }, []);

  return <View>{/* ... */}</View>;
};
```

### Image Loading Performance

```typescript
import { Image } from 'react-native';
import { logger } from '../services/logger.service';

export const OptimizedImage = ({ uri }: { uri: string }) => {
  const [loadTime, setLoadTime] = useState(0);

  const handleLoadStart = () => {
    setLoadTime(Date.now());
  };

  const handleLoadEnd = () => {
    const duration = Date.now() - loadTime;
    logger.logPerformance('image-load', duration, { uri });

    if (duration > 1000) {
      logger.warn('Slow image load', 'OptimizedImage', { uri, duration });
    }
  };

  return (
    <Image
      source={{ uri }}
      onLoadStart={handleLoadStart}
      onLoadEnd={handleLoadEnd}
    />
  );
};
```

## Error Boundary avec Logging

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text } from 'react-native';
import { logger } from '../services/logger.service';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.fatal('React Error Boundary caught error', 'ErrorBoundary', {
      componentStack: errorInfo.componentStack,
    }, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View>
          <Text>Something went wrong</Text>
          <Text>{this.state.error?.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}
```

## Écran de Debug pour les Logs

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button } from 'react-native';
import { logger, LogLevel } from '../services/logger.service';
import * as Sharing from 'expo-sharing';

export const LogsDebugScreen = () => {
  const [logs, setLogs] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const content = await logger.getLogFileContent();
    setLogs(content);
  };

  const exportLogs = async () => {
    try {
      const filePath = await logger.exportLogs();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath);
        logger.info('Logs exported successfully', 'LogsDebugScreen');
      }
    } catch (error) {
      logger.error('Failed to export logs', 'LogsDebugScreen', {}, error as Error);
    }
  };

  const clearLogs = async () => {
    await logger.clearLogs();
    setLogs('');
    logger.info('Logs cleared', 'LogsDebugScreen');
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Application Logs
      </Text>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
        <Button title="Refresh" onPress={loadLogs} />
        <Button title="Export" onPress={exportLogs} />
        <Button title="Clear" onPress={clearLogs} color="red" />
      </View>

      <ScrollView style={{ flex: 1, backgroundColor: '#000', padding: 10 }}>
        <Text style={{ color: '#0f0', fontFamily: 'monospace', fontSize: 10 }}>
          {logs || 'No logs available'}
        </Text>
      </ScrollView>
    </View>
  );
};
```

## Configuration du Niveau de Log

```typescript
// src/config/logger.config.ts
import { LogLevel } from '../services/logger.service';

export const getLogLevel = (): LogLevel => {
  if (__DEV__) {
    return LogLevel.DEBUG;
  }

  // En production, on peut utiliser une variable d'environnement
  const envLogLevel = process.env.EXPO_PUBLIC_LOG_LEVEL as LogLevel;
  return envLogLevel || LogLevel.INFO;
};
```

## Bonnes Pratiques

### 1. Logger aux Endroits Importants

```typescript
// ✅ BON
- Navigation entre écrans
- Appels API
- Actions utilisateur critiques
- Erreurs et exceptions
- Performance des opérations lourdes

// ❌ À ÉVITER
- Chaque render de composant
- Chaque setState
- Logs trop verbeux en production
```

### 2. Contexte Significatif

```typescript
// ✅ BON
logger.info('User logged in', 'AuthService', { userId: user.id });

// ❌ MAUVAIS
logger.info('Success', 'App');
```

### 3. Gestion des Données Sensibles

```typescript
// ❌ MAUVAIS
logger.debug('Login', 'Auth', { email, password });

// ✅ BON
logger.debug('Login attempt', 'Auth', { email });
```

### 4. Niveaux de Log Appropriés

```typescript
logger.debug('Detailed info for debugging');  // Développement uniquement
logger.info('Normal operation');              // Événements importants
logger.warn('Unexpected but handled');        // Situations anormales
logger.error('Error occurred', context, data, error);  // Erreurs
logger.fatal('Critical error', context, data, error);  // Erreurs critiques
```

## Tests

```typescript
import { logger } from '../services/logger.service';

// Mock le logger dans les tests
jest.mock('../services/logger.service', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    logApiRequest: jest.fn(),
    logNavigation: jest.fn(),
    logUserAction: jest.fn(),
  },
}));

describe('MyComponent', () => {
  it('should log navigation on mount', () => {
    render(<MyComponent />);

    expect(logger.logNavigation).toHaveBeenCalledWith('MyComponent');
  });
});
```

## Dépannage

### Les logs ne s'écrivent pas

1. Vérifier que `expo-file-system` est installé
2. Vérifier les permissions de l'app
3. Regarder la console pour les erreurs

### Trop de logs en production

1. Ajuster le niveau de log avec `getLogLevel()`
2. Désactiver les logs debug en production

### Export des logs ne fonctionne pas

1. Installer `expo-sharing` : `npx expo install expo-sharing`
2. Vérifier les permissions de partage

## Commandes Utiles

```bash
# Installer les dépendances
npx expo install expo-file-system expo-sharing

# Tester en développement
npx expo start

# Build avec logs de production
EXPO_PUBLIC_LOG_LEVEL=info npx expo build
```

## Prochaines Étapes

1. Intégrer le logger dans tous les composants critiques
2. Ajouter un écran de debug dans les settings
3. Configurer l'export automatique des logs en cas de crash
4. Intégrer avec un service de crash reporting (Sentry)

---

Le logger est maintenant prêt à être utilisé ! N'oublie pas de logger les événements importants pour faciliter le debugging.
