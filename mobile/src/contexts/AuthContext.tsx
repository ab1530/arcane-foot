import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';
import { STORAGE_KEYS } from '../constants/config';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.setAuthToken(storedToken);
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newUser: User, accessToken: string) => {
    try {
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, accessToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(newUser)],
      ]);

      setToken(accessToken);
      setUser(newUser);
      api.setAuthToken(accessToken);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (data: SignupData) => {
    try {
      const payload = transformSignupPayload(data);
      const { accessToken, user: newUser } = await api.signup(payload);

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, accessToken],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(newUser)],
      ]);

      setToken(accessToken);
      setUser(newUser);
      api.setAuthToken(accessToken);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
      setToken(null);
      setUser(null);
      api.setAuthToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUser,
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

  const derivedRole = data.role ?? mapAccountTypeToRole(data.accountType);
  if (derivedRole) {
    payload.role = derivedRole;
  }

  return payload;
}

function mapAccountTypeToRole(accountType?: 'player' | 'agent' | 'club') {
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
