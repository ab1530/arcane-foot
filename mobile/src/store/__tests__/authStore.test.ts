import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { useAuthStore } from '../authStore';
import { STORAGE_KEYS } from '../../constants/config';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

describe('useAuthStore', () => {
  const mockApi = api as unknown as {
    login: jest.Mock;
    signup: jest.Mock;
    logout: jest.Mock;
    setAuthToken: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
    });
    (AsyncStorage.multiSet as jest.Mock).mockClear();
    (AsyncStorage.multiRemove as jest.Mock).mockClear();
    (AsyncStorage.multiGet as jest.Mock).mockClear();
  });

  it('stocke le token et l’utilisateur après un login réussi', async () => {
    const user = { id: '1', firstName: 'John', lastName: 'Doe' };
    mockApi.login.mockResolvedValue({
      accessToken: 'token-123',
      user,
    });

    await useAuthStore.getState().login('john@arcane.gg', 'password');

    expect(mockApi.login).toHaveBeenCalledWith({
      email: 'john@arcane.gg',
      password: 'password',
    });
    expect(AsyncStorage.multiSet).toHaveBeenCalledWith([
      [STORAGE_KEYS.AUTH_TOKEN, 'token-123'],
      [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
    ]);
    expect(mockApi.setAuthToken).toHaveBeenCalledWith('token-123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.token).toBe('token-123');
  });

  it('enregistre une erreur lisible si le login échoue', async () => {
    mockApi.login.mockRejectedValue({
      response: { data: { message: 'Invalid credentials' } },
    });

    await expect(useAuthStore.getState().login('bad@arcane.gg', 'wrong')).rejects.toBeDefined();

    const state = useAuthStore.getState();
    expect(state.error).toBe('Invalid credentials');
    expect(state.isAuthenticated).toBe(false);
  });

  it('charge les informations stockées si présentes', async () => {
    (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
      [STORAGE_KEYS.AUTH_TOKEN, 'cached-token'],
      [STORAGE_KEYS.USER_DATA, JSON.stringify({ id: '2', firstName: 'Ada', lastName: 'Scout' })],
    ]);

    await useAuthStore.getState().loadStoredAuth();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.firstName).toBe('Ada');
    expect(mockApi.setAuthToken).toHaveBeenCalledWith('cached-token');
  });

  it('réinitialise le store lors du logout', async () => {
    useAuthStore.setState({
      user: { id: '3', firstName: 'Alex', lastName: 'Agent' } as any,
      token: 'token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    await useAuthStore.getState().logout();

    expect(mockApi.logout).toHaveBeenCalled();
    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
    expect(mockApi.setAuthToken).toHaveBeenCalledWith(null);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
