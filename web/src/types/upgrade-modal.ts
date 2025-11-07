/**
 * TypeScript types for Upgrade Modal System
 */

export type SubscriptionTier = 'FREE' | 'BASIC' | 'GOLD' | 'PRO' | 'ENTERPRISE';
export type PremiumTier = 'GOLD' | 'PRO' | 'ENTERPRISE';

export interface UpgradeModalTrigger {
  show: boolean;
  blockedFeature: string;
  requiredTier: PremiumTier;
  currentTier?: string;
  endpoint?: string;
}

export interface SubscriptionError {
  isSubscriptionError: boolean;
  requiredTier?: PremiumTier;
  blockedFeature?: string;
  message?: string;
}

export interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedFeature: string;
  requiredTier: PremiumTier;
}

export interface TierFeature {
  name: string;
  description?: string;
  included: boolean;
}

export interface TierConfig {
  tier: SubscriptionTier;
  name: string;
  displayName: string;
  price: {
    monthly: number;
    yearly: number;
  };
  color: string;
  icon: any;
  description: string;
  features: TierFeature[];
  highlighted?: boolean;
  popular?: boolean;
}

export interface FeatureBlockEvent {
  feature: string;
  requiredTier: PremiumTier;
  currentTier: string;
  endpoint?: string;
  timestamp: string;
}

export interface UpgradeModalAnalytics {
  modalShown: {
    feature: string;
    requiredTier: PremiumTier;
    timestamp: string;
  };
  modalDismissed: {
    feature: string;
    requiredTier: PremiumTier;
    timeShown: number;
    timestamp: string;
  };
  ctaClicked: {
    feature: string;
    targetTier: SubscriptionTier;
    requiredTier: PremiumTier;
    timestamp: string;
  };
}

/**
 * Feature name mapping for better UX
 */
export const PREMIUM_FEATURES: Record<string, { name: string; tier: PremiumTier }> = {
  auto_scout: {
    name: 'AutoScout - Génération automatique de rapports IA',
    tier: 'GOLD',
  },
  smart_scout: {
    name: 'SmartScout - Suggestions IA intelligentes',
    tier: 'GOLD',
  },
  performance_predictor: {
    name: 'Prédicteur de performance IA',
    tier: 'GOLD',
  },
  market_value: {
    name: 'Évaluation de valeur marché IA',
    tier: 'GOLD',
  },
  playstyle_dna: {
    name: 'Analyse ADN de style de jeu',
    tier: 'GOLD',
  },
  arkane_match: {
    name: 'ArkaneMatch - Recherche conversationnelle',
    tier: 'GOLD',
  },
  voice_to_report: {
    name: 'Voice-to-Report - Transcription vocale',
    tier: 'GOLD',
  },
  bulk_reports: {
    name: 'Génération de rapports en masse',
    tier: 'PRO',
  },
  api_access: {
    name: 'Accès API',
    tier: 'PRO',
  },
  white_label: {
    name: 'Marque blanche',
    tier: 'PRO',
  },
  custom_integration: {
    name: 'Intégration personnalisée',
    tier: 'ENTERPRISE',
  },
  dedicated_support: {
    name: 'Support dédié',
    tier: 'ENTERPRISE',
  },
};

/**
 * Tier hierarchy for comparison
 */
export const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  GOLD: 2,
  PRO: 3,
  ENTERPRISE: 4,
};

/**
 * Check if a tier meets minimum requirement
 */
export function meetsMinimumTier(
  currentTier: SubscriptionTier,
  requiredTier: SubscriptionTier
): boolean {
  return TIER_HIERARCHY[currentTier] >= TIER_HIERARCHY[requiredTier];
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    FREE: 'Gratuit',
    BASIC: 'Basic',
    GOLD: 'Gold',
    PRO: 'Pro',
    ENTERPRISE: 'Enterprise',
  };
  return names[tier] || tier;
}

/**
 * Get tier color class
 */
export function getTierColor(tier: SubscriptionTier): string {
  const colors: Record<SubscriptionTier, string> = {
    FREE: 'text-arcane-grey',
    BASIC: 'text-blue-400',
    GOLD: 'text-arcane-accent',
    PRO: 'text-purple-400',
    ENTERPRISE: 'text-green-400',
  };
  return colors[tier] || 'text-arcane-grey';
}
