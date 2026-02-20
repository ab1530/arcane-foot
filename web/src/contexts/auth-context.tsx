"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";
import { buildApiUrl, resolveApiBase } from "@/lib/api-base";
import {
  DEFAULT_ROLE,
  type UserRole,
  USER_ROLES,
} from "@/lib/roles";

type AccountType = "player" | "agent" | "club";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountType: AccountType;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSessionStale: boolean;
  authError: string | null;
  lastValidatedAt: Date | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
  refreshSession: (maxRetries?: number) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

interface SignupData {
  fullName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  password: string;
  accountType: AccountType;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionStale, setIsSessionStale] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lastValidatedAt, setLastValidatedAt] = useState<Date | null>(null);

  // Check for stored auth token on mount
  const validateSession = useCallback(
    async (maxRetries = 1) => {
      const token = localStorage.getItem("arcane_auth_token");
      const storedUser = localStorage.getItem("arcane_user");
      const cachedUser = safeParseUser(storedUser);

      // Hydrate quickly from cache while backend validates
      if (token && cachedUser) {
        setUser(cachedUser);
      }

      if (!token) {
        setUser(null);
        setIsSessionStale(false);
        setAuthError(null);
        setLastValidatedAt(null);
        return;
      }

      const API_URL = getApiBaseUrl();
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(buildApiUrl("/auth/me", API_URL), {
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const userData = await response.json();
            const validatedUser = transformBackendUser(userData);
            setUser(validatedUser);
            localStorage.setItem("arcane_user", JSON.stringify(validatedUser));
            setIsSessionStale(false);
            setAuthError(null);
            setLastValidatedAt(new Date());
            return;
          }

          if (response.status === 401 || response.status === 403) {
            console.log("Token validation failed, logging out");
            clearAuthStorage();
            setUser(null);
            setIsSessionStale(false);
            setAuthError("Session expirée, veuillez vous reconnecter.");
            setLastValidatedAt(null);
            return;
          }

          lastError = new Error(`Validation failed with status ${response.status}`);
        } catch (error) {
          lastError = error as Error;
        }

        // Retry on next iteration if available
        if (attempt < maxRetries) {
          await delay((attempt + 1) * 500);
        }
      }

      // If we reach here, validation could not confirm the session
      if (lastError) {
        console.warn("Auth validation failed, keeping cached session", lastError);
        setAuthError(lastError.message);
      }
      setIsSessionStale(!!cachedUser);
      setUser(cachedUser);
    },
    []
  );

  useEffect(() => {
    const run = async () => {
      setIsLoading(true);
      try {
        await validateSession(2);
      } finally {
        setIsLoading(false);
      }
    };
    run();
  }, [validateSession]);

  useEffect(() => {
    if (user) {
      logger.setContext({
        userId: user.id,
        email: user.email,
        role: user.role,
        accountType: user.accountType,
      });
    } else {
      logger.clearContext(["userId", "email", "accountType"]);
    }
  }, [user]);

  const login = async (email: string, password: string) => {
    const API_URL = getApiBaseUrl();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPassword = password.trim();

    let response: Response;
    try {
      response = await fetch(buildApiUrl("/auth/login", API_URL), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: normalizedEmail, password: normalizedPassword }),
      });
    } catch (error) {
      logger.error("Login request failed before reaching backend", error as Error, {
        scope: "AUTH",
        endpoint: "/api/auth/login",
      });
      throw new Error("NETWORK_ERROR");
    }

    if (!response.ok) {
      let backendMessage = "Login failed";
      try {
        const error = await response.json();
        backendMessage = error?.message || backendMessage;
      } catch {
        // Ignore non-JSON response and keep fallback message.
      }

      if (response.status === 401) {
        throw new Error("INVALID_CREDENTIALS");
      }

      if (response.status === 404) {
        throw new Error("API_ROUTE_NOT_FOUND");
      }

      throw new Error(`LOGIN_HTTP_${response.status}:${backendMessage}`);
    }

    const data = await response.json();

    const token = data.accessToken || data.token;
    const user = transformBackendUser(data.user);

    persistSession(token, user);
    setUser(user);
    setIsSessionStale(false);
    setAuthError(null);
    setLastValidatedAt(new Date());
  };

  const signup = async (data: SignupData) => {
    const API_URL = getApiBaseUrl();

    const response = await fetch(buildApiUrl("/auth/signup", API_URL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transformSignupPayload(data)),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Signup failed");
    }

    const result = await response.json();

    const token = result.accessToken || result.token;
    const user = transformBackendUser(result.user);

    persistSession(token, user);
    setUser(user);
    setIsSessionStale(false);
    setAuthError(null);
    setLastValidatedAt(new Date());
  };

  const logout = () => {
    // Clear only auth-related storage to avoid nuking unrelated preferences
    clearAuthStorage();
    setUser(null);
    setIsSessionStale(false);
    setAuthError(null);
    setLastValidatedAt(null);

    // Force complete page reload with cache clear
    window.location.href = "/";
  };

  const updateUser = (data: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem("arcane_user", JSON.stringify(updatedUser));
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isSessionStale,
    authError,
    lastValidatedAt,
    login,
    signup,
    logout,
    refreshSession: validateSession,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

function mapRoleToAccountType(role?: string): AccountType {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case "SUPER_ADMIN":
    case "ADMIN":
    case "CLUB_CONTACT":
      return "club";
    case "AGENT":
      return "agent";
    default:
      return "player";
  }
}

function mapAccountTypeToRole(accountType: AccountType): UserRole {
  switch (accountType) {
    case "player":
      return "PLAYER";
    case "agent":
      return "AGENT";
    case "club":
      return "CLUB_CONTACT";
    default:
      return DEFAULT_ROLE;
  }
}

function normalizeRole(role?: string | null): UserRole {
  const normalized = String(role ?? "").trim().toUpperCase();
  return USER_ROLES.includes(normalized as UserRole)
    ? (normalized as UserRole)
    : DEFAULT_ROLE;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.length ? parts.join(" ") : "";
  return { firstName, lastName };
}

function transformBackendUser(user: any): User {
  const role = normalizeRole(user?.role);

  return {
    id: user.id,
    email: user.email,
    role,
    fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    accountType: mapRoleToAccountType(role),
    avatar: user.avatar,
  };
}

function transformSignupPayload(data: SignupData) {
  const { firstName, lastName } = splitFullName(data.fullName);

  return {
    email: data.email,
    password: data.password,
    phone: data.phone,
    dateOfBirth: data.dateOfBirth,
    firstName,
    lastName,
    role: mapAccountTypeToRole(data.accountType),
  };
}

function persistSession(token: string, user: User) {
  localStorage.setItem("arcane_auth_token", token.trim());
  localStorage.setItem("arcane_user", JSON.stringify(user));
}

function clearAuthStorage() {
  localStorage.removeItem("arcane_auth_token");
  localStorage.removeItem("arcane_user");
}

function safeParseUser(userStr: string | null): User | null {
  if (!userStr) return null;
  try {
    const parsed = JSON.parse(userStr);
    return normalizeStoredUser(parsed);
  } catch (error) {
    console.warn("Failed to parse cached user", error);
    return null;
  }
}

function normalizeStoredUser(value: unknown): User | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as Record<string, any>;
  const role = normalizeRole(raw.role as string | undefined);
  const fullName =
    typeof raw.fullName === "string" && raw.fullName.trim().length > 0
      ? raw.fullName.trim()
      : `${raw.firstName ?? ""} ${raw.lastName ?? ""}`.trim() || "Utilisateur";

  if (!raw.id || !raw.email) {
    return null;
  }

  return {
    id: String(raw.id),
    email: String(raw.email).trim().toLowerCase(),
    role,
    fullName,
    accountType: mapRoleToAccountType(role),
    avatar: typeof raw.avatar === "string" ? raw.avatar : undefined,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiBaseUrl() {
  return resolveApiBase(process.env.NEXT_PUBLIC_API_URL);
}
