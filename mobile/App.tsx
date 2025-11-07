import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import RootNavigator from './src/navigation/RootNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { FavoritesProvider } from './src/contexts/FavoritesContext';
import { ComparisonProvider } from './src/contexts/ComparisonContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { ScoutingProvider } from './src/contexts/ScoutingContext';

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
    <ThemeProvider>
      <AuthProvider>
        <FavoritesProvider>
          <ComparisonProvider>
            <ScoutingProvider>
              <AppContent />
            </ScoutingProvider>
          </ComparisonProvider>
        </FavoritesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
