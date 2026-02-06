// API Configuration
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? 'http://192.168.1.64:5002/api' : 'https://arcane-foot-staging.up.railway.app/api');

export const API_TIMEOUT = 30000; // 30 seconds

// App Configuration
export const APP_NAME = 'Arcane Football';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@arcane/auth_token',
  REFRESH_TOKEN: '@arcane/refresh_token',
  USER_DATA: '@arcane/user_data',
  ACTIVE_ROLE: '@arcane/active_role',
  MVP_FOLLOWED_PLAYERS: '@arcane/mvp_followed_players',
  MVP_SCOUT_NOTES: '@arcane/mvp_scout_notes',
  RECENT_PLAYERS: '@arcane/recent_players',
  THEME: '@arcane/theme',
} as const;

// Colors - Arcane Brand Identity
export const COLORS = {
  // Arcane Brand Colors
  arcane: {
    dark: '#080C1D',        // Primary Dark - Main background
    darkAlt: '#0F1425',     // Dark Alternative - Secondary background
    darkBorder: '#1B2133',  // Dark Border - Subtle borders
    accent: '#E4FF3B',      // Fluorescent Yellow - Primary accent
    accentHover: '#c8e634', // Accent Hover - Darker yellow
    grey: '#9FA1A9',        // Neutral Grey - Secondary text
    white: '#FFFFFF',       // White - Primary text
  },
  // Functional Colors (mapped to Arcane theme)
  primary: '#E4FF3B',       // Arcane accent
  secondary: '#1B2133',     // Dark border
  success: '#10B981',       // Keep green for success
  danger: '#FF3B3B',        // Adjusted red
  warning: '#F59E0B',       // Keep orange for warning
  info: '#E4FF3B',          // Use Arcane accent
  light: '#1B2133',         // Dark theme - use dark border
  dark: '#080C1D',          // Arcane dark
  white: '#FFFFFF',
  black: '#000000',
  // Grey scale adapted for dark theme
  gray: {
    50: '#1B2133',
    100: '#1F2537',
    200: '#252B3F',
    300: '#2D3447',
    400: '#4B5563',
    500: '#6B7280',
    600: '#9FA1A9',
    700: '#B8BAC0',
    800: '#D1D3D8',
    900: '#E5E6E9',
  },
} as const;

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Font Sizes
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;
