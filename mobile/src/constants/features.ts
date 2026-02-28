const envFlag = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value == null) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return defaultValue;
};

export const FEATURE_FLAGS = {
  aiHubTab: true,
  marketplaceTab: true,
  coachingTab: true,
  passportTab: true,
  profileTab: true,
  playerDashboardV2: true,
  playerBraceletCard: true,
  scoutNewFlow: envFlag(process.env.EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED, true),
  scoutProfileScreen: envFlag(process.env.EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED, true),
  missionRequestHub: envFlag(process.env.EXPO_PUBLIC_MISSION_REQUEST_HUB_ENABLED, true),
  transferMarketHub: envFlag(process.env.EXPO_PUBLIC_TRANSFER_MARKET_HUB_ENABLED, true),
  transferMarketSharedVisibility: envFlag(
    process.env.EXPO_PUBLIC_TRANSFER_MARKET_SHARED_VISIBILITY_ENABLED,
    true,
  ),
  transferMarketShortlistExport: envFlag(
    process.env.EXPO_PUBLIC_TRANSFER_MARKET_SHORTLIST_EXPORT_ENABLED,
    true,
  ),
  shortcuts: {
    players: true,
    analytics: true,
    matches: true,
    missionRequests: true,
    reports: true,
    voiceToReport: true,
    marketplace: true,
  },
} as const;

export const FEATURE_PRESETS = {
  demo: {
    ...FEATURE_FLAGS,
  },
  staging: {
    ...FEATURE_FLAGS,
    coachingTab: true,
    playerDashboardV2: true,
    playerBraceletCard: true,
    shortcuts: {
      ...FEATURE_FLAGS.shortcuts,
    },
  },
  production: {
    ...FEATURE_FLAGS,
    aiHubTab: true,
    marketplaceTab: true,
    coachingTab: true,
    passportTab: true,
    profileTab: true,
    playerDashboardV2: true,
    playerBraceletCard: true,
  },
} as const;

export type FeaturePreset = keyof typeof FEATURE_PRESETS;
export type FeatureFlagKey =
  | keyof typeof FEATURE_FLAGS
  | `shortcuts.${keyof typeof FEATURE_FLAGS.shortcuts}`;

const DEFAULT_PRESET: FeaturePreset = 'demo';

const normalizePreset = (value?: string | null): FeaturePreset | null => {
  if (!value) return null;
  const lowerValue = value.toLowerCase();
  if (lowerValue in FEATURE_PRESETS) {
    return lowerValue as FeaturePreset;
  }
  return null;
};

const envPreset = normalizePreset(process.env.EXPO_PUBLIC_FEATURE_PRESET);

let activePreset: FeaturePreset = envPreset ?? DEFAULT_PRESET;

export const setFeaturePreset = (preset: FeaturePreset) => {
  activePreset = preset;
};

export const getActivePreset = (): FeaturePreset => activePreset;

const getActiveFlags = () => FEATURE_PRESETS[activePreset] || FEATURE_FLAGS;

export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  const flags = getActiveFlags();
  if (flag.startsWith('shortcuts.')) {
    const key = flag.replace('shortcuts.', '') as keyof typeof FEATURE_FLAGS.shortcuts;
    return !!flags.shortcuts[key];
  }
  return !!flags[flag as keyof typeof FEATURE_FLAGS];
};
