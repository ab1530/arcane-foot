import { SubscriptionTier } from '@prisma/client';

/**
 * ARCANE FOOTBALL - SUBSCRIPTION PRICING CONFIGURATION
 *
 * Updated pricing model based on audit recommendations (Nov 2025)
 * Previous pricing was 40-60% undervalued
 * New pricing delivers +150% MRR increase
 *
 * Market comparison:
 * - Wyscout: €3,000-20,000/year
 * - InStat: €10,000+/year
 * - Transfermarkt Pro: €5,000/year
 * - Arcane: €600-1,788/year (still 10x cheaper for 80% of features)
 */

export interface PricingPlan {
  tier: SubscriptionTier;
  name: string;
  description: string;
  priceMonthly: number; // in EUR
  priceYearly: number; // in EUR (with discount)
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripePriceIdMonthly?: string; // To be set after creating in Stripe
  stripePriceIdYearly?: string; // To be set after creating in Stripe
  stripeProductId?: string; // To be set after creating in Stripe
  isPopular?: boolean;
  cta: string;
}

export const SUBSCRIPTION_PRICING: Record<SubscriptionTier, PricingPlan> = {
  [SubscriptionTier.FREE]: {
    tier: SubscriptionTier.FREE,
    name: 'Free',
    description: 'Pour découvrir la plateforme',
    priceMonthly: 0,
    priceYearly: 0,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Accès en lecture seule aux joueurs publics',
      'Consultation des camps et showcases',
      'Profil joueur basique',
      'Recherche limitée (10/jour)',
      'Support communautaire',
    ],
    cta: 'Commencer gratuitement',
  },

  [SubscriptionTier.BASIC]: {
    tier: SubscriptionTier.BASIC,
    name: 'Basic',
    description: 'Pour les scouts indépendants',
    priceMonthly: 19.99, // Previously €9.99 (+100%)
    priceYearly: 199.99, // -17% discount
    currency: 'EUR',
    interval: 'month',
    features: [
      'Tout du plan Free',
      'Création de 10 rapports/mois',
      'Kanban personnel (1 board)',
      'Recherche avancée (illimitée)',
      'Notifications par email',
      'Export PDF de rapports',
      'Accès au calendrier partagé',
      'Support email (48h)',
    ],
    cta: 'Passer à Basic',
  },

  [SubscriptionTier.GOLD]: {
    tier: SubscriptionTier.GOLD,
    name: 'Gold',
    description: 'Pour les scouts professionnels',
    priceMonthly: 49.99, // Previously €29.99 (+67%)
    priceYearly: 499.99, // -17% discount
    currency: 'EUR',
    interval: 'month',
    isPopular: true,
    features: [
      'Tout du plan Basic',
      'Rapports illimités',
      'Kanban illimité (boards illimités)',
      'Intelligence Artificielle ArkaneGPT',
      'ArkaneIndex (score IA des joueurs)',
      'Analyse vidéo basique',
      'Matchmaking IA clubs-joueurs',
      'Statistiques avancées',
      'Collaboration équipe (jusqu\'à 3 membres)',
      'Accès prioritaire aux camps',
      'Support prioritaire (24h)',
      'API access (10,000 calls/mois)',
    ],
    stripePriceIdMonthly: 'price_GOLD_MONTHLY_49_99', // Replace with real Stripe Price ID
    stripePriceIdYearly: 'price_GOLD_YEARLY_499_99', // Replace with real Stripe Price ID
    cta: 'Passer à Gold',
  },

  [SubscriptionTier.PRO]: {
    tier: SubscriptionTier.PRO,
    name: 'Pro',
    description: 'Pour les agences et clubs',
    priceMonthly: 149, // Previously €99.99 (+49%)
    priceYearly: 1488, // -17% discount (€124/mois)
    currency: 'EUR',
    interval: 'month',
    features: [
      'Tout du plan Gold',
      'Équipe illimitée (membres illimités)',
      'Analyse vidéo avancée avec IA',
      'Détection automatique de talents',
      'Rapports prédictifs (potentiel)',
      'Tableau de bord analytics avancé',
      'Webhooks et intégrations custom',
      'White-label (optionnel +€500/mois)',
      'Formation et onboarding personnalisé',
      'Account manager dédié',
      'Support prioritaire (4h)',
      'API access (100,000 calls/mois)',
      'SLA 99.9% uptime garanti',
    ],
    stripePriceIdMonthly: 'price_PRO_MONTHLY_149', // Replace with real Stripe Price ID
    stripePriceIdYearly: 'price_PRO_YEARLY_1488', // Replace with real Stripe Price ID
    cta: 'Passer à Pro',
  },

  [SubscriptionTier.ENTERPRISE]: {
    tier: SubscriptionTier.ENTERPRISE,
    name: 'Enterprise',
    description: 'Solution sur-mesure pour grandes organisations',
    priceMonthly: 999, // Starting price (custom pricing)
    priceYearly: 9999, // Starting price (custom pricing)
    currency: 'EUR',
    interval: 'month',
    features: [
      'Tout du plan Pro',
      'Infrastructure dédiée (option)',
      'SSO & SAML integration',
      'Conformité RGPD + audit annuel',
      'Formation sur site',
      'API access illimitée',
      'Custom features development',
      'Multi-tenancy (filiales)',
      'Data ownership & export complet',
      'Support 24/7 avec SLA 99.95%',
      'Account manager + Customer success',
      'Reporting exécutif mensuel',
      'Contrat annuel négociable',
    ],
    cta: 'Contactez-nous',
  },
};

/**
 * Get pricing for a specific tier
 */
export function getPricingForTier(tier: SubscriptionTier): PricingPlan {
  return SUBSCRIPTION_PRICING[tier];
}

/**
 * Get all pricing plans
 */
export function getAllPricingPlans(): PricingPlan[] {
  return Object.values(SUBSCRIPTION_PRICING);
}

/**
 * Get pricing plans for public display (excluding internal details)
 */
export function getPublicPricingPlans(): Omit<PricingPlan, 'stripePriceIdMonthly' | 'stripePriceIdYearly' | 'stripeProductId'>[] {
  return Object.values(SUBSCRIPTION_PRICING).map(({ stripePriceIdMonthly, stripePriceIdYearly, stripeProductId, ...plan }) => plan);
}

/**
 * Calculate projected MRR increase from new pricing
 * Based on audit: +150% MRR increase
 */
export function calculateMRRIncrease(currentUsers: {
  [key in SubscriptionTier]?: number;
}): {
  currentMRR: number;
  newMRR: number;
  increase: number;
  increasePercentage: number;
} {
  const OLD_PRICING = {
    [SubscriptionTier.FREE]: 0,
    [SubscriptionTier.BASIC]: 9.99,
    [SubscriptionTier.GOLD]: 29.99,
    [SubscriptionTier.PRO]: 99.99,
    [SubscriptionTier.ENTERPRISE]: 299.99,
  };

  let currentMRR = 0;
  let newMRR = 0;

  for (const [tier, count] of Object.entries(currentUsers)) {
    const tierEnum = tier as SubscriptionTier;
    currentMRR += OLD_PRICING[tierEnum] * (count || 0);
    newMRR += SUBSCRIPTION_PRICING[tierEnum].priceMonthly * (count || 0);
  }

  const increase = newMRR - currentMRR;
  const increasePercentage = currentMRR > 0 ? (increase / currentMRR) * 100 : 0;

  return {
    currentMRR,
    newMRR,
    increase,
    increasePercentage,
  };
}
