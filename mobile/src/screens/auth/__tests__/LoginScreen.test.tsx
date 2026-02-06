import React from 'react';
import { act, render, fireEvent } from '@testing-library/react-native';
import LoginScreen from '../LoginScreen';
import { useAuth } from '../../../contexts/AuthContext';
import { translations } from '../../../i18n';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../contexts/LocalizationContext', () => {
  const { translations } = require('../../../i18n');
  return {
    useLocalization: () => ({
      dictionary: translations.fr,
      t: (key: string) => key,
    }),
  };
});

const mockSetAuthToken = jest.fn();
const mockApiLogin = jest.fn();

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    login: (...args: any[]) => mockApiLogin(...args),
    setAuthToken: (...args: any[]) => mockSetAuthToken(...args),
  },
}));

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

describe('LoginScreen', () => {
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('laisse le bouton actif tant que aucune requête n’est lancée', () => {
    mockUseAuth.mockReturnValue({
      login: jest.fn(),
    });

    const { getByTestId } = render(<LoginScreen navigation={mockNavigation as any} route={undefined as any} />);
    const submitButton = getByTestId('login-submit-button');

    expect(submitButton.props.accessibilityState?.disabled).toBe(false);
  });

  it('active le bouton et déclenche login avec email nettoyé', async () => {
    const login = jest.fn().mockResolvedValue(undefined);

    mockUseAuth.mockReturnValue({
      login,
    });

    mockApiLogin.mockResolvedValue({
      accessToken: 'token',
      refreshToken: 'refresh-token',
      user: { id: '1', firstName: 'Test', lastName: 'User' },
    });

    const { getByPlaceholderText, getByTestId } = render(
      <LoginScreen navigation={mockNavigation as any} route={undefined as any} />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), '  user@club.com  ');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'password');

    const submitButton = getByTestId('login-submit-button');
    expect(submitButton.props.accessibilityState?.disabled).toBe(false);

    await act(async () => {
      fireEvent.press(submitButton);
    });

    expect(mockApiLogin).toHaveBeenCalledWith({
      email: 'user@club.com',
      password: 'password',
    });
    expect(login).toHaveBeenCalledWith(
      { id: '1', firstName: 'Test', lastName: 'User' },
      'token',
      'refresh-token'
    );
  });

  it('affiche un loader quand la requête est en cours', async () => {
    const login = jest.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({ login });

    let resolvePromise: () => void = () => {};
    mockApiLogin.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePromise = () =>
            resolve({
              accessToken: 'token',
              user: { id: '1', firstName: 'Test', lastName: 'User' },
            });
        })
    );

    const { getByPlaceholderText, getByTestId } = render(
      <LoginScreen navigation={mockNavigation as any} route={undefined as any} />
    );

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@club.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'password');

    await act(async () => {
      fireEvent.press(getByTestId('login-submit-button'));
    });

    expect(getByTestId('login-loading-indicator')).toBeTruthy();

    await act(async () => resolvePromise());
  });
});
