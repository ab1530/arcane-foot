/**
 * ARCANE DESIGN SYSTEM 2.0 - THEME CONTEXT
 * React Context provider for theme management
 *
 * @version 2.0.0
 * @date 2025-11-11
 * @status Production Ready
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { theme as arcaneTheme, tokens } from '../design/theme';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  // Backgrounds
  darkBg: string;
  dark: string;
  surface: string;
  elevated: string;

  // Glass effects
  glass: string;
  glassBorder: string;
  glassLight: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;

  // Brand colors
  accent: string;
  accentLight: string;
  secondary: string;
  secondaryLight: string;

  // Semantic colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // UI Elements
  border: string;
  shadow: string;
  overlay: string;
  highlight: string;

  // Charts and data
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;

  // Status bar
  statusBar: 'light' | 'dark';
}

// Light theme colors
export const lightTheme: ThemeColors = {
  // Backgrounds
  darkBg: '#FFFFFF',
  dark: '#F8F9FA',
  surface: '#FFFFFF',
  elevated: '#F3F4F6',

  // Glass effects
  glass: 'rgba(255, 255, 255, 0.15)',
  glassBorder: 'rgba(0, 0, 0, 0.1)',
  glassLight: 'rgba(255, 255, 255, 0.25)',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Brand colors (keeping the Arcane yellow)
  accent: '#E4FF3B',
  accentLight: 'rgba(228, 255, 59, 0.3)',
  secondary: '#00FFB3',
  secondaryLight: 'rgba(0, 255, 179, 0.3)',

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // UI Elements
  border: '#E5E7EB',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(255, 255, 255, 0.9)',
  highlight: 'rgba(228, 255, 59, 0.15)',

  // Charts and data
  chartPrimary: '#3B82F6',
  chartSecondary: '#10B981',
  chartTertiary: '#F59E0B',

  // Status bar
  statusBar: 'dark',
};

// Dark theme colors (Arcane 2.0 - Primary theme)
export const darkTheme: ThemeColors = {
  // Backgrounds - Using Arcane 2.0 foundation
  darkBg: tokens.colors.arcane.black,              // #0B1022
  dark: tokens.colors.arcane.anthracite,           // #10162F
  surface: tokens.colors.arcane.charcoal,          // #141B34
  elevated: tokens.colors.arcane.charcoal,         // #141B34

  // Glass effects - Arcane 2.0
  glass: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassLight: 'rgba(255, 255, 255, 0.05)',

  // Text - Arcane 2.0 hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textTertiary: 'rgba(255, 255, 255, 0.4)',
  textInverse: tokens.colors.arcane.black,

  // Brand colors - Arcane 2.0
  accent: tokens.colors.yellow.DEFAULT,            // #E4FF3B
  accentLight: 'rgba(228, 255, 59, 0.2)',
  secondary: '#58E6FF',
  secondaryLight: 'rgba(88, 230, 255, 0.2)',

  // Semantic colors - Arcane 2.0
  success: tokens.colors.semantic.success,         // #10B981
  warning: tokens.colors.semantic.warning,         // #F59E0B
  error: tokens.colors.semantic.error,             // #EF4444
  info: tokens.colors.semantic.info,               // #3B82F6

  // UI Elements - Arcane 2.0
  border: 'rgba(255, 255, 255, 0.12)',
  shadow: 'rgba(0, 0, 0, 0.6)',
  overlay: 'rgba(11, 16, 34, 0.85)',
  highlight: 'rgba(228, 255, 59, 0.15)',

  // Charts and data - Arcane 2.0
  chartPrimary: tokens.colors.yellow.DEFAULT,      // #E4FF3B
  chartSecondary: '#58E6FF',
  chartTertiary: tokens.colors.semantic.info,      // #3B82F6

  // Status bar
  statusBar: 'light',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  // Arcane Design System 2.0 access
  arcane: typeof arcaneTheme;
  tokens: typeof tokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = '@arcane_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeMode(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  // Save theme preference
  const updateThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      setThemeMode(mode);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // Determine if dark mode is active
  const isDark = themeMode === 'dark' ||
    (themeMode === 'system' && systemColorScheme === 'dark');

  // Get current theme colors
  const colors = isDark ? darkTheme : lightTheme;

  // Toggle between light and dark (ignoring system)
  const toggleTheme = () => {
    if (themeMode === 'system') {
      updateThemeMode(isDark ? 'light' : 'dark');
    } else {
      updateThemeMode(themeMode === 'dark' ? 'light' : 'dark');
    }
  };

  // Don't render until theme is loaded to prevent flash
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        colors,
        isDark,
        setThemeMode: updateThemeMode,
        toggleTheme,
        // Provide full Arcane Design System 2.0 access
        arcane: arcaneTheme,
        tokens,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

// Helper hook for theme-aware styles
export const useThemeStyles = <T extends {}>(
  stylesFn: (colors: ThemeColors, isDark: boolean) => T
): T => {
  const { colors, isDark } = useTheme();
  return stylesFn(colors, isDark);
};
