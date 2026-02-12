export const FEATURE_FLAGS = {
  aiHubTab: true,
  marketplaceTab: true,
  coachingTab: true,
  passportTab: true,
  profileTab: true,
  playerDashboardV2: true,
  playerBraceletCard: true,
  shortcuts: {
    players: true,
    analytics: true,
    matches: true,
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
