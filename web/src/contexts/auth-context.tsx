"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type AccountType = "player" | "agent" | "club";

interface User {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => void;
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

  // Check for stored auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("arcane_auth_token");
        const storedUser = localStorage.getItem("arcane_user");

        if (token && storedUser) {
          // TODO: Validate token with backend
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("arcane_auth_token");
        localStorage.removeItem("arcane_user");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();

    const token = data.accessToken || data.token;
    const user = transformBackendUser(data.user);

    persistSession(token, user);
    setUser(user);
  };

  const signup = async (data: SignupData) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const response = await fetch(`${API_URL}/api/auth/signup`, {
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
  };

  const logout = () => {
    localStorage.removeItem("arcane_auth_token");
    localStorage.removeItem("arcane_user");
    setUser(null);
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
    login,
    signup,
    logout,
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
  switch (role) {
    case "PLAYER":
      return "player";
    case "AGENT":
      return "agent";
    case "CLUB_CONTACT":
      return "club";
    default:
      return "player";
  }
}

function mapAccountTypeToRole(accountType: AccountType): string {
  switch (accountType) {
    case "player":
      return "PLAYER";
    case "agent":
      return "AGENT";
    case "club":
      return "CLUB_CONTACT";
    default:
      return "PUBLIC";
  }
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts.shift() || "";
  const lastName = parts.length ? parts.join(" ") : "";
  return { firstName, lastName };
}

function transformBackendUser(user: any): User {
  return {
    id: user.id,
    email: user.email,
    fullName: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    accountType: mapRoleToAccountType(user.role),
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
  localStorage.setItem("arcane_auth_token", token);
  localStorage.setItem("arcane_user", JSON.stringify(user));
}
