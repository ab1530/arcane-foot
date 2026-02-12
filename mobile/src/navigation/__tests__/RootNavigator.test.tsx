import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../AppNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockAppNavigator() {
    return <Text testID="main-tab-navigator">Main app</Text>;
  };
});

jest.mock('../../screens/home/HomeScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { HomeScreen: () => <Text>Accueil</Text> };
});

jest.mock('../../screens/auth/LoginScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockLoginScreen() {
    return <Text>Connexion</Text>;
  };
});

jest.mock('../../screens/auth/SignupScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockSignupScreen() {
    return <Text>Créer un compte</Text>;
  };
});

jest.mock('../../screens/auth/RoleSelectorScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockRoleSelectorScreen() {
    return <Text>Choix du rôle</Text>;
  };
});

jest.mock('../../hooks/useNotifications', () => ({
  __esModule: true,
  default: () => ({
    isRegistered: false,
    permissionStatus: 'granted',
    registerForNotifications: jest.fn().mockResolvedValue(undefined),
    unregister: jest.fn().mockResolvedValue(undefined),
    subscribeToTopic: jest.fn().mockResolvedValue(undefined),
    unsubscribeFromTopic: jest.fn().mockResolvedValue(undefined),
  }),
}));

describe('RootNavigator', () => {
  const mockUseAuth = useAuth as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('affiche un indicateur de chargement lorsque l’état auth est en cours', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    const { getByTestId } = render(
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    );
    expect(getByTestId('auth-loading-indicator')).toBeTruthy();
  });

  it('rend la pile auth quand l’utilisateur n’est pas connecté', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    const { getByText } = render(
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    );
    await waitFor(() => {
      expect(getByText('Connexion')).toBeTruthy();
    });
  });

  it('rend la navigation principale quand l’utilisateur est authentifié', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    const { getByTestId, queryByText } = render(
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    );

    await waitFor(() => {
      expect(getByTestId('main-tab-navigator')).toBeTruthy();
      expect(queryByText('Connexion')).toBeNull();
    });
  });

  it('affiche le sélecteur de rôle si plusieurs rôles sont disponibles', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      activeRole: null,
      user: { id: 'u-1', roles: ['PLAYER', 'SCOUT'] },
    });

    const { getByText } = render(
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    );

    await waitFor(() => {
      expect(getByText('Choix du rôle')).toBeTruthy();
    });
  });
});
