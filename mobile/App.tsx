import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { ComparisonProvider } from './src/contexts/ComparisonContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LocalizationProvider } from './src/contexts/LocalizationContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { logError } from './src/logging/expoLogBridge';

// Create a client with error logging
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
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

// Wrapper component to use theme context for StatusBar
function AppContent() {
  const { colors } = useTheme();

  return (
    <>
      <RootNavigator />
      <StatusBar style={colors.statusBar} backgroundColor={colors.darkBg} />
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LocalizationProvider>
            <ThemeProvider>
              <AuthProvider>
                <FavoritesProvider>
                  <ComparisonProvider>
                    <AppContent />
                  </ComparisonProvider>
                </FavoritesProvider>
              </AuthProvider>
            </ThemeProvider>
          </LocalizationProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
