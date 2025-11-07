import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import SignupScreen from '../SignupScreen';
import { useAuthStore } from '../../../store/authStore';

jest.mock('../../../store/authStore', () => ({
  useAuthStore: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('SignupScreen', () => {
  const mockUseAuthStore = useAuthStore as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('désactive le bouton tant que les données sont incomplètes', () => {
    mockUseAuthStore.mockReturnValue({
      signup: jest.fn(),
      isLoading: false,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(<SignupScreen navigation={mockNavigation as any} route={undefined as any} />);
    expect(getByTestId('signup-submit-button').props.accessibilityState?.disabled).toBe(true);
  });

  it('soumet les données avec trimming et validation', () => {
    const signup = jest.fn().mockResolvedValue(undefined);
    const clearError = jest.fn();

    mockUseAuthStore.mockReturnValue({
      signup,
      isLoading: false,
      error: null,
      clearError,
    });

    const { getByPlaceholderText, getAllByPlaceholderText, getByTestId } = render(
      <SignupScreen navigation={mockNavigation as any} route={undefined as any} />
    );

    fireEvent.changeText(getByPlaceholderText('Abdou'), '  Abdallah ');
    fireEvent.changeText(getByPlaceholderText('Lakhdari'), ' Lakhdari ');
    fireEvent.changeText(getByPlaceholderText('club@arcane.gg'), 'email@arcane.gg ');
    const [passwordInput, confirmInput] = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(passwordInput, 'azerty');
    fireEvent.changeText(confirmInput, 'azerty');

    const submitButton = getByTestId('signup-submit-button');
    expect(submitButton.props.accessibilityState?.disabled).toBe(false);

    fireEvent.press(submitButton);
    expect(signup).toHaveBeenCalledWith({
      email: 'email@arcane.gg',
      password: 'azerty',
      firstName: 'Abdallah',
      lastName: 'Lakhdari',
    });
  });

  it('affiche un loader quand inscription en cours', () => {
    mockUseAuthStore.mockReturnValue({
      signup: jest.fn(),
      isLoading: true,
      error: null,
      clearError: jest.fn(),
    });

    const { getByTestId } = render(<SignupScreen navigation={mockNavigation as any} route={undefined as any} />);
    expect(getByTestId('signup-submit-button').props.accessibilityState?.disabled).toBe(true);
    expect(getByTestId('signup-loading-indicator')).toBeTruthy();
  });
});
