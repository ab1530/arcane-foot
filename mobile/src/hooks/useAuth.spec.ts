import { renderHook, waitFor, act } from '@testing-library/react-native';
import React, { ReactNode } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { STORAGE_KEYS } from '../constants/config';

// Mock dependencies
jest.mock('@react-native-async-storage/async-storage');
jest.mock('../services/api', () => ({
  api: {
    setAuthToken: jest.fn(),
    setAuthHandlers: jest.fn(),
    signup: jest.fn(),
    getCurrentUser: jest.fn().mockRejectedValue(new Error('No current user mock')),
    refreshAccessToken: jest.fn(),
  },
}));

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockApi = api as jest.Mocked<typeof api>;

// Helper to render hook with AuthProvider
const wrapper = ({ children }: { children: ReactNode }) =>
  React.createElement(AuthProvider, null, children);

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.multiSet.mockResolvedValue(undefined);
    mockAsyncStorage.multiRemove.mockResolvedValue(undefined);
    if (mockAsyncStorage.removeItem) {
      mockAsyncStorage.removeItem.mockResolvedValue(undefined);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockUser = {
    id: 'user1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'PLAYER',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockToken = 'mock-token-12345';

  describe('Initialization', () => {
    it('should initialize with no user', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should load stored authentication on mount', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA)
          return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockApi.setAuthToken).toHaveBeenCalledWith(mockToken);
    });

    it('should handle corrupted stored data', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA) return Promise.resolve('invalid-json');
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Login', () => {
    it('should login successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.login(mockUser, mockToken);
      });

      expect(mockAsyncStorage.multiSet).toHaveBeenCalledWith([
        [STORAGE_KEYS.AUTH_TOKEN, mockToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(mockUser)],
      ]);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockApi.setAuthToken).toHaveBeenCalledWith(mockToken);
    });

    it('should handle login errors', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const error = new Error('Storage error');
      mockAsyncStorage.multiSet.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login(mockUser, mockToken);
        })
      ).rejects.toThrow('Storage error');

      expect(console.error).toHaveBeenCalledWith('Login failed:', error);
    });
  });

  describe('Signup', () => {
    it('should signup successfully', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);

      const signupData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const signupResponse = {
        user: mockUser,
        accessToken: mockToken,
        tokenType: 'Bearer',
      };

      mockApi.signup.mockResolvedValue(signupResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signup(signupData);
      });

      expect(mockApi.signup).toHaveBeenCalledWith({
        email: signupData.email,
        password: signupData.password,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        role: 'PUBLIC',
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.token).toBe(mockToken);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should signup with fullName', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);

      const signupData = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'Jane Marie Smith',
      };

      const signupResponse = {
        user: mockUser,
        accessToken: mockToken,
        tokenType: 'Bearer',
      };

      mockApi.signup.mockResolvedValue(signupResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signup(signupData);
      });

      expect(mockApi.signup).toHaveBeenCalledWith({
        email: signupData.email,
        password: signupData.password,
        firstName: 'Jane',
        lastName: 'Marie Smith',
        role: 'PUBLIC',
      });
    });

    it('should signup with accountType mapping', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);

      const signupData = {
        email: 'player@example.com',
        password: 'password123',
        fullName: 'John Player',
        accountType: 'player' as const,
      };

      const signupResponse = {
        user: mockUser,
        accessToken: mockToken,
        tokenType: 'Bearer',
      };

      mockApi.signup.mockResolvedValue(signupResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signup(signupData);
      });

      expect(mockApi.signup).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'PLAYER',
        })
      );
    });

    it('should keep explicit role in payload', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      mockAsyncStorage.multiSet.mockResolvedValue(undefined);

      const signupData = {
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'John Admin',
        role: 'ADMIN',
      };

      const signupResponse = {
        user: mockUser,
        accessToken: mockToken,
        tokenType: 'Bearer',
      };

      mockApi.signup.mockResolvedValue(signupResponse);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.signup(signupData);
      });

      expect(mockApi.signup).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'ADMIN',
        })
      );
    });

    it('should handle signup errors', async () => {
      mockAsyncStorage.getItem.mockResolvedValue(null);
      const error = new Error('Signup failed');
      mockApi.signup.mockRejectedValue(error);

      const signupData = {
        email: 'newuser@example.com',
        password: 'password123',
        fullName: 'Jane Smith',
      };

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.signup(signupData);
        })
      ).rejects.toThrow('Signup failed');

      expect(console.error).toHaveBeenCalledWith('Signup failed:', error);
    });
  });

  describe('Logout', () => {
    it('should logout successfully', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA)
          return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });
      mockAsyncStorage.multiRemove.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAsyncStorage.multiRemove).toHaveBeenCalledWith([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.ACTIVE_ROLE,
      ]);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockApi.setAuthToken).toHaveBeenCalledWith(null);
    });

    it('should handle logout errors', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA)
          return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const error = new Error('Storage error');
      mockAsyncStorage.multiRemove.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(console.error).toHaveBeenCalledWith('Logout failed:', error);
      // Even on error, state should be cleared
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });
  });

  describe('Update User', () => {
    it('should update user successfully', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA)
          return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
      };

      await act(async () => {
        await result.current.updateUser(updatedUser);
      });

      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.USER_DATA,
        JSON.stringify(updatedUser)
      );
      expect(result.current.user).toEqual(updatedUser);
    });

    it('should handle update user errors', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA)
          return Promise.resolve(JSON.stringify(mockUser));
        return Promise.resolve(null);
      });

      const error = new Error('Storage error');
      mockAsyncStorage.setItem.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const updatedUser = {
        ...mockUser,
        firstName: 'Jane',
      };

      await act(async () => {
        await result.current.updateUser(updatedUser);
      });

      expect(console.error).toHaveBeenCalledWith('Failed to update user:', error);
    });
  });

  describe('Active Role', () => {
    it('should auto-select single role', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA) {
          return Promise.resolve(JSON.stringify({ ...mockUser, role: 'PLAYER' }));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableRoles).toEqual(['PLAYER']);
      expect(result.current.activeRole).toBe('PLAYER');
    });

    it('should keep activeRole null for multi-role user without selection', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA) {
          return Promise.resolve(
            JSON.stringify({
              ...mockUser,
              role: 'PLAYER',
              roles: ['PLAYER', 'SCOUT'],
            })
          );
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableRoles).toEqual(['PLAYER', 'SCOUT']);
      expect(result.current.activeRole).toBeNull();
    });

    it('should persist selected active role', async () => {
      mockAsyncStorage.getItem.mockImplementation((key) => {
        if (key === STORAGE_KEYS.AUTH_TOKEN) return Promise.resolve(mockToken);
        if (key === STORAGE_KEYS.USER_DATA) {
          return Promise.resolve(
            JSON.stringify({
              ...mockUser,
              role: 'PLAYER',
              roles: ['PLAYER', 'SCOUT'],
            })
          );
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setActiveRole('SCOUT');
      });

      expect(result.current.activeRole).toBe('SCOUT');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.ACTIVE_ROLE, 'SCOUT');
    });
  });

  describe('Error Handling', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress error output for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      console.error = originalError;
    });
  });
});
