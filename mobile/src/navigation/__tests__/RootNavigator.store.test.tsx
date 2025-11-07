import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../MainTabNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');

  const MockMainTabs = () => <Text testID="main-tabs-root">Main tabs</Text>;

  return { __esModule: true, default: MockMainTabs };
});

describe('RootNavigator with real auth store', () => {
  const initialState = useAuthStore.getState();

  beforeEach(() => {
    act(() => {
      useAuthStore.setState(
        {
          ...initialState,
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        },
        true
      );
    });
  });

  afterEach(() => {
    act(() => {
      useAuthStore.setState(initialState, true);
    });
  });

  it('affiche l’écran de connexion lorsque le store est non authentifié', async () => {
    const { getByText } = render(<RootNavigator />);

    await waitFor(() => expect(getByText('Connexion')).toBeTruthy());
  });

  it('bascule automatiquement vers les tabs lorsque le store devient authentifié', async () => {
    const { getByText, queryByText } = render(<RootNavigator />);

    await waitFor(() => expect(getByText('Connexion')).toBeTruthy());

    act(() => {
      useAuthStore.setState({
        ...initialState,
        user: { id: 'user-1', firstName: 'Test', lastName: 'User' } as unknown as User,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    });

    await waitFor(() => expect(queryByText('Connexion')).toBeNull());
    await waitFor(() => expect(queryByText('Main tabs')).not.toBeNull());
  });
});
