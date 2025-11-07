import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { useAuthStore } from '../../store/authStore';

jest.mock('../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

jest.mock('../MainTabNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockMainTabNavigator() {
    return <Text testID="main-tab-navigator">Main app</Text>;
  };
});

describe('RootNavigator', () => {
  const mockUseAuthStore = useAuthStore as jest.Mock;

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('affiche un indicateur de chargement lorsque l’état auth est en cours', () => {
    const loadStoredAuth = jest.fn();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      loadStoredAuth,
    });

    const { getByTestId } = render(<RootNavigator />);
    expect(getByTestId('auth-loading-indicator')).toBeTruthy();
    expect(loadStoredAuth).toHaveBeenCalledTimes(1);
  });

  it('rend la pile auth quand l’utilisateur n’est pas connecté', async () => {
    const loadStoredAuth = jest.fn();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      loadStoredAuth,
    });

    const { getByText } = render(<RootNavigator />);
    await waitFor(() => {
      expect(getByText('Connexion')).toBeTruthy();
    });
    expect(loadStoredAuth).toHaveBeenCalledTimes(1);
  });

  it('rend la navigation principale quand l’utilisateur est authentifié', async () => {
    const loadStoredAuth = jest.fn();
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      loadStoredAuth,
    });

    const { getByTestId, queryByText } = render(<RootNavigator />);

    await waitFor(() => {
      expect(getByTestId('main-tab-navigator')).toBeTruthy();
      expect(queryByText('Connexion')).toBeNull();
    });
    expect(loadStoredAuth).toHaveBeenCalledTimes(1);
  });
});
