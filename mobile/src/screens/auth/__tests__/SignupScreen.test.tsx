import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';
import SignupScreen from '../SignupScreen';
import { useAuth } from '../../../contexts/AuthContext';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../contexts/LocalizationContext', () => {
  const { fr } = require('../../../i18n/locales/fr');
  const { createTranslator } = require('@shared/i18n');
  return {
    useLocalization: () => ({
      language: 'fr',
      t: createTranslator(fr),
      dictionary: fr,
      setLanguage: jest.fn(),
    }),
  };
});

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('SignupScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('désactive le bouton tant que les données sont incomplètes', () => {
    mockUseAuth.mockReturnValue({
      signup: jest.fn(),
    });

    const { getByTestId } = render(<SignupScreen navigation={mockNavigation as any} route={undefined as any} />);
    expect(getByTestId('signup-submit-button').props.accessibilityState?.disabled).toBe(true);
  });

  it('soumet les données avec trimming et validation', async () => {
    const signup = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      signup,
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

    await act(async () => {
      fireEvent.press(submitButton);
    });
    expect(signup).toHaveBeenCalledWith({
      email: 'email@arcane.gg',
      password: 'azerty',
      firstName: 'Abdallah',
      lastName: 'Lakhdari',
    });
  });

  it('affiche un loader quand inscription en cours', () => {
    mockUseAuth.mockReturnValue({
      signup: () => new Promise(() => {}),
    });

    const { getByPlaceholderText, getAllByPlaceholderText, getByTestId } = render(
      <SignupScreen navigation={mockNavigation as any} route={undefined as any} />
    );

    fireEvent.changeText(getByPlaceholderText('Abdou'), 'Test');
    fireEvent.changeText(getByPlaceholderText('Lakhdari'), 'User');
    fireEvent.changeText(getByPlaceholderText('club@arcane.gg'), 'user@arcane.gg');
    const [passwordInput, confirmInput] = getAllByPlaceholderText('••••••••');
    fireEvent.changeText(passwordInput, 'azerty');
    fireEvent.changeText(confirmInput, 'azerty');

    act(() => {
      fireEvent.press(getByTestId('signup-submit-button'));
    });

    expect(getByTestId('signup-loading-indicator')).toBeTruthy();
  });
});
