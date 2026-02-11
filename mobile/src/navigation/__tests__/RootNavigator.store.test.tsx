import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../AppNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockMainTabs = () => <Text testID="main-tabs-root">Main tabs</Text>;

  return { __esModule: true, default: MockMainTabs };
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

describe('RootNavigator with mocked auth hook', () => {
  const mockUseAuth = useAuth as jest.Mock;
  let authState = { isAuthenticated: false, isLoading: false };

  beforeEach(() => {
    authState = { isAuthenticated: false, isLoading: false };
    mockUseAuth.mockImplementation(() => ({ ...authState }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('affiche l’écran de connexion lorsque l’utilisateur n’est pas authentifié', async () => {
    const { getByText } = render(
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    );

    await waitFor(() => expect(getByText('Connexion')).toBeTruthy());
  });

  it('bascule automatiquement vers les tabs lorsque isAuthenticated passe à true', async () => {
    const { getByText, queryByText, rerender, getByTestId } = render(
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    );

    await waitFor(() => expect(getByText('Connexion')).toBeTruthy());

    authState.isAuthenticated = true;
    rerender(
      <SafeAreaProvider>
        <RootNavigator />
      </SafeAreaProvider>
    );

    await waitFor(() => expect(queryByText('Connexion')).toBeNull());
    await waitFor(() => expect(getByTestId('main-tabs-root')).toBeTruthy());
  });
});
