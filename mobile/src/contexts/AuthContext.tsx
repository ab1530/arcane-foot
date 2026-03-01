import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { STORAGE_KEYS } from '../constants/config';
import type { User } from '../types';
import { DEFAULT_ROLE, USER_ROLES } from '../lib/roles';
import type { UserRole } from '../lib/roles';

interface AuthContextType {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  activeRole: UserRole | null;
  availableRoles: UserRole[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken?: string | null) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  setActiveRole: (role: UserRole) => Promise<void>;
}

interface SignupData {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  password: string;
  role?: string;
  accountType?: 'player' | 'agent' | 'club';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const syncRoleState = async (nextUser: User | null, preferredRole?: UserRole | null) => {
    if (!nextUser) {
      setAvailableRoles([]);
      setActiveRoleState(null);
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
      return;
    }

    const resolvedRoles = resolveAvailableRoles(nextUser);
    setAvailableRoles(resolvedRoles);

    let nextActiveRole: UserRole | null = null;

    if (resolvedRoles.length === 1) {
      nextActiveRole = resolvedRoles[0];
    } else if (preferredRole && resolvedRoles.includes(preferredRole)) {
      nextActiveRole = preferredRole;
    }

    setActiveRoleState(nextActiveRole);

    if (nextActiveRole) {
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, nextActiveRole);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
    }
  };

  useEffect(() => {
    loadStoredAuth();
    api.setAuthHandlers({
      onAuthInvalid: async () => {
        setToken(null);
        setUser(null);
        setRefreshToken(null);
        setActiveRoleState(null);
        setAvailableRoles([]);
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_ROLE);
        setIsLoading(false);
      },
      onTokenRefreshed: (newToken) => {
        setToken(newToken);
      },
    });
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedRefreshToken, storedUser, storedActiveRole] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE),
      ]);

      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const preferredRole = toUserRole(storedActiveRole);

      if (storedToken && parsedUser) {
        setToken(storedToken);
        setRefreshToken(storedRefreshToken);
        api.setAuthToken(storedToken);
        try {
          const current = await api.getCurrentUser();
          setUser(current);
          await syncRoleState(current, preferredRole);
          await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(current));
        } catch (err) {
          setUser(parsedUser);
          await syncRoleState(parsedUser, preferredRole);
        }
      } else if (storedRefreshToken && parsedUser) {
        const newAccessToken = await api.refreshAccessToken(storedRefreshToken);
        if (newAccessToken) {
          setToken(newAccessToken);
          setRefreshToken(storedRefreshToken);
          api.setAuthToken(newAccessToken);
          try {
            const current = await api.getCurrentUser();
            setUser(current);
            await syncRoleState(current, preferredRole);
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(current));
          } catch (err) {
            setUser(parsedUser);
            await syncRoleState(parsedUser, preferredRole);
          }
        } else {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN,
            STORAGE_KEYS.USER_DATA,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.ACTIVE_ROLE,
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newUser: User, accessToken: string, newRefreshToken?: string | null) => {
    try {
      const storagePairs: [string, string][] = [
        [STORAGE_KEYS.AUTH_TOKEN, accessToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(newUser)],
      ];
      if (newRefreshToken) {
        storagePairs.push([STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken]);
      }

      await AsyncStorage.multiSet(storagePairs);

      setToken(accessToken);
      setRefreshToken(newRefreshToken ?? null);
      api.setAuthToken(accessToken);
      const storedRole = toUserRole(await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE));
      // Refresh current user to ensure playerId and latest profile are loaded
      try {
        const current = await api.getCurrentUser();
        setUser(current);
        await syncRoleState(current, storedRole);
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(current));
      } catch {
        setUser(newUser);
        await syncRoleState(newUser, storedRole);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const payload = transformSignupPayload(data);
      const { accessToken, refreshToken: newRefreshToken, user: newUser } = await api.signup(payload);

      const storagePairs: [string, string][] = [
        [STORAGE_KEYS.AUTH_TOKEN, accessToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(newUser)],
      ];
      if (newRefreshToken) {
        storagePairs.push([STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken]);
      }

      await AsyncStorage.multiSet(storagePairs);

      setToken(accessToken);
      setRefreshToken(newRefreshToken ?? null);
      setUser(newUser);
      const storedRole = toUserRole(await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_ROLE));
      await syncRoleState(newUser, storedRole);
      api.setAuthToken(accessToken);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.ACTIVE_ROLE,
      ]);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setToken(null);
      setUser(null);
      setRefreshToken(null);
      setActiveRoleState(null);
      setAvailableRoles([]);
      api.setAuthToken(null);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUser(updatedUser);
      await syncRoleState(updatedUser, activeRole);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const setActiveRole = async (role: UserRole) => {
    const nextRoles = resolveAvailableRoles(user);
    if (!nextRoles.includes(role)) {
      return;
    }

    setActiveRoleState(role);
    setAvailableRoles(nextRoles);
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_ROLE, role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        activeRole,
        availableRoles,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
        setActiveRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

function transformSignupPayload(data: SignupData): Record<string, any> {
  const fullName = data.fullName?.trim();
  let firstName = data.firstName?.trim();
  let lastName = data.lastName?.trim();

  if (fullName) {
    const parts = fullName.split(' ').filter(Boolean);
    if (!firstName) {
      firstName = parts.shift() || '';
    }
    if (!lastName) {
      lastName = parts.length ? parts.join(' ') : '';
    }
  }

  firstName = firstName ?? '';
  lastName = lastName ?? '';

  const payload: Record<string, any> = {
    email: data.email,
    password: data.password,
    firstName,
    lastName,
  };

  if (data.phone) {
    payload.phone = data.phone;
  }

  const derivedRole = normalizeSignupRole(data.role) ?? mapAccountTypeToRole(data.accountType);
  if (derivedRole) {
    payload.role = derivedRole;
  } else {
    payload.role = DEFAULT_ROLE;
  }

  return payload;
}

function normalizeSignupRole(role?: string): UserRole | undefined {
  if (!role) {
    return undefined;
  }

  const normalizedRole = role.toUpperCase() as UserRole;
  if (normalizedRole === 'SUPER_ADMIN') {
    return 'ADMIN';
  }

  return USER_ROLES.includes(normalizedRole) ? normalizedRole : undefined;
}

function mapAccountTypeToRole(accountType?: 'player' | 'agent' | 'club'): (typeof USER_ROLES)[number] | undefined {
  switch (accountType) {
    case 'player':
      return 'PLAYER';
    case 'agent':
      return 'AGENT';
    case 'club':
      return 'CLUB_CONTACT';
    default:
      return undefined;
  }
}

function toUserRole(role?: string | null): UserRole | null {
  if (!role) {
    return null;
  }
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : null;
}

function resolveAvailableRoles(targetUser: User | null): UserRole[] {
  if (!targetUser) {
    return [];
  }

  const fromArray = Array.isArray(targetUser.roles)
    ? targetUser.roles.filter((role): role is UserRole => USER_ROLES.includes(role as UserRole))
    : [];

  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray));
  }

  const single = toUserRole(targetUser.role);
  return [single ?? DEFAULT_ROLE];
}
