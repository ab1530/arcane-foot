import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useAuthStore } from '../../../store/authStore';

jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('LoginScreen', () => {
  const mockUseAuthStore = useAuthStore as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('désactive le bouton de connexion quand les champs sont vides', () => {
    mockUseAuthStore.mockReturnValue({
      login: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(<LoginScreen navigation={mockNavigation as any} route={undefined as any} />);
    const submitButton = getByTestId('login-submit-button');

    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
  });

  it('active le bouton et déclenche login avec email nettoyé', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    const clearError = jest.fn();

    mockUseAuthStore.mockReturnValue({
      login,
      isLoading: false,
      error: null,
      clearError,
    });

    const { getByPlaceholderText, getByTestId } = render(
      <LoginScreen navigation={mockNavigation as any} route={undefined as any} />
    );

    fireEvent.changeText(getByPlaceholderText('john.doe@club.com'), '  user@club.com  ');
    fireEvent.changeText(getByPlaceholderText('••••••••'), 'password');

    const submitButton = getByTestId('login-submit-button');
    expect(submitButton.props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(submitButton);

    expect(login).toHaveBeenCalledWith('user@club.com', 'password');
  });

  it('affiche un loader quand la requête est en cours', () => {
    mockUseAuthStore.mockReturnValue({
      login: jest.fn(),
      isLoading: true,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(<LoginScreen navigation={mockNavigation as any} route={undefined as any} />);
    const submitButton = getByTestId('login-submit-button');

    expect(submitButton.props.accessibilityState?.disabled).toBe(true);
    expect(getByTestId('login-loading-indicator')).toBeTruthy();
  });
});
