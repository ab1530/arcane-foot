/**
 * API Interceptor - Handles 403 subscription errors and triggers upgrade modal
 *
 * This interceptor:
 * - Detects 403 errors from premium AI endpoints
 * - Extracts subscription tier requirements from error responses
 * - Triggers the upgrade modal with context
 * - Tracks feature blocking events for analytics
 */

import { analytics } from './analytics';

export interface SubscriptionError {
  isSubscriptionError: boolean;
  requiredTier?: 'GOLD' | 'PRO' | 'ENTERPRISE';
  blockedFeature?: string;
  message?: string;
}

export type UpgradeModalTrigger = {
  show: boolean;
  blockedFeature: string;
  requiredTier: 'GOLD' | 'PRO' | 'ENTERPRISE';
  currentTier?: string;
  endpoint?: string;
};

// Global event emitter for upgrade modal
class UpgradeModalEmitter {
  private listeners: ((trigger: UpgradeModalTrigger) => void)[] = [];

  subscribe(callback: (trigger: UpgradeModalTrigger) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  emit(trigger: UpgradeModalTrigger) {
    this.listeners.forEach(listener => listener(trigger));
  }
}

export const upgradeModalEmitter = new UpgradeModalEmitter();

/**
 * Feature name mapping for better user experience
 */
const FEATURE_NAMES: Record<string, string> = {
  '/api/auto-scout': 'AutoScout - Génération automatique de rapports',
  '/api/smart-scout': 'SmartScout - Suggestions IA intelligentes',
  '/api/performance-predictor': 'Prédicteur de performance IA',
  '/api/market-value': 'Évaluation de valeur marché IA',
  '/api/playstyle-dna': 'Analyse ADN de style de jeu',
  '/api/arkane-match': 'ArkaneMatch - Recherche conversationnelle',
  '/api/voice-to-report': 'Voice-to-Report - Transcription vocale',
  '/api/ai': 'Fonctionnalités IA avancées',
};

/**
 * Detect if an error is a subscription-related 403 error
 */
export function isSubscriptionError(error: any, endpoint?: string): SubscriptionError {
  // Check if it's a 403 error
  if (!error || (error.status !== 403 && !error.message?.includes('403'))) {
    return { isSubscriptionError: false };
  }

  // Check if error message contains subscription/tier keywords
  const message = error.message || error.error || '';
  const lowerMessage = message.toLowerCase();

  const subscriptionKeywords = [
    'subscription',
    'tier',
    'upgrade',
    'premium',
    'plan',
    'gold',
    'pro',
    'enterprise',
    'requires',
    'abonnement',
    'nécessite',
  ];

  const isSubError = subscriptionKeywords.some(keyword =>
    lowerMessage.includes(keyword)
  );

  if (!isSubError) {
    return { isSubscriptionError: false };
  }

  // Extract required tier from message
  let requiredTier: 'GOLD' | 'PRO' | 'ENTERPRISE' | undefined;

  if (lowerMessage.includes('enterprise')) {
    requiredTier = 'ENTERPRISE';
  } else if (lowerMessage.includes('pro')) {
    requiredTier = 'PRO';
  } else if (lowerMessage.includes('gold')) {
    requiredTier = 'GOLD';
  }

  // Try to extract from error data if available
  if (error.data?.requiredTier) {
    requiredTier = error.data.requiredTier;
  }

  // Extract feature name from endpoint
  let blockedFeature = 'Cette fonctionnalité premium';
  if (endpoint) {
    const matchedFeature = Object.keys(FEATURE_NAMES).find(key =>
      endpoint.includes(key)
    );
    if (matchedFeature) {
      blockedFeature = FEATURE_NAMES[matchedFeature];
    }
  }

  return {
    isSubscriptionError: true,
    requiredTier,
    blockedFeature,
    message,
  };
}

/**
 * Handle subscription errors and trigger upgrade modal
 */
export function handleSubscriptionError(
  error: any,
  endpoint?: string,
  currentTier?: string
): boolean {
  const subError = isSubscriptionError(error, endpoint);

  if (!subError.isSubscriptionError) {
    return false;
  }

  const requiredTier = subError.requiredTier || 'GOLD';
  const blockedFeature = subError.blockedFeature || 'Cette fonctionnalité premium';

  // Track feature blocking event
  analytics.track({
    type: 'feature_usage',
    feature: 'subscription_block',
    action: 'blocked',
  });

  // Custom analytics event for subscription blocking
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('arcane:feature-blocked', {
      detail: {
        feature: blockedFeature,
        requiredTier,
        currentTier: currentTier || 'FREE',
        endpoint,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);
  }

  // Emit upgrade modal trigger
  upgradeModalEmitter.emit({
    show: true,
    blockedFeature,
    requiredTier,
    currentTier,
    endpoint,
  });

  return true;
}

/**
 * Intercept fetch requests to detect subscription errors
 */
export function createFetchInterceptor() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async function (...args) {
    const [url] = args;
    const endpoint = typeof url === 'string' ? url : url.toString();

    try {
      const response = await originalFetch(...args);

      // Clone response to read body without consuming it
      if (!response.ok && response.status === 403) {
        const clonedResponse = response.clone();

        try {
          const data = await clonedResponse.json();
          const error = {
            status: 403,
            message: data.message || data.error,
            data,
          };

          // Get current tier from localStorage
          let currentTier = 'FREE';
          try {
            const userStr = localStorage.getItem('arcane_user');
            if (userStr) {
              const user = JSON.parse(userStr);
              currentTier = user.subscription?.tier || 'FREE';
            }
          } catch {
            // Ignore parsing errors
          }

          handleSubscriptionError(error, endpoint, currentTier);
        } catch {
          // If response is not JSON, ignore
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Initialize API interceptor
 * Call this once in your app initialization
 */
export function initializeApiInterceptor() {
  if (typeof window === 'undefined') return;

  createFetchInterceptor();

  console.log('[API Interceptor] Initialized - watching for subscription errors');
}
