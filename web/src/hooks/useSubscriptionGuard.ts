import { useState, useEffect, useCallback } from 'react';
import { useSubscription, SubscriptionTier } from './useSubscription';
import { upgradeModalEmitter, UpgradeModalTrigger } from '@/lib/api-interceptor';
import { analytics } from '@/lib/analytics';

export interface UseSubscriptionGuardReturn {
  showUpgradeModal: boolean;
  setShowUpgradeModal: (show: boolean) => void;
  blockedFeature: string;
  requiredTier: 'GOLD' | 'PRO' | 'ENTERPRISE';
  checkAccess: (minTier: SubscriptionTier) => boolean;
  requireAccess: (minTier: SubscriptionTier, featureName?: string) => boolean;
  closeModal: () => void;
}

/**
 * Hook to guard features behind subscription tiers
 *
 * Usage:
 * ```tsx
 * const { checkAccess, showUpgradeModal, blockedFeature, requiredTier, closeModal } = useSubscriptionGuard();
 *
 * if (!checkAccess('GOLD')) {
 *   // Show disabled state or upgrade button
 * }
 *
 * <UpgradeModal
 *   isOpen={showUpgradeModal}
 *   onClose={closeModal}
 *   blockedFeature={blockedFeature}
 *   requiredTier={requiredTier}
 * />
 * ```
 */
export function useSubscriptionGuard(): UseSubscriptionGuardReturn {
  const { subscription, hasMinimumTier } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState('Cette fonctionnalité');
  const [requiredTier, setRequiredTier] = useState<'GOLD' | 'PRO' | 'ENTERPRISE'>('GOLD');

  // Listen for upgrade modal triggers from API interceptor
  useEffect(() => {
    const unsubscribe = upgradeModalEmitter.subscribe((trigger: UpgradeModalTrigger) => {
      if (trigger.show) {
        setBlockedFeature(trigger.blockedFeature);
        setRequiredTier(trigger.requiredTier);
        setShowUpgradeModal(true);
      }
    });

    return unsubscribe;
  }, []);

  /**
   * Check if user has access to a feature requiring a minimum tier
   */
  const checkAccess = useCallback(
    (minTier: SubscriptionTier): boolean => {
      return hasMinimumTier(minTier);
    },
    [hasMinimumTier]
  );

  /**
   * Require access to a feature - shows upgrade modal if insufficient
   * Returns true if user has access, false otherwise
   */
  const requireAccess = useCallback(
    (minTier: SubscriptionTier, featureName?: string): boolean => {
      const hasAccess = hasMinimumTier(minTier);

      if (!hasAccess) {
        const feature = featureName || `Fonctionnalité ${minTier}`;

        // Track blocking event
        analytics.track({
          type: 'feature_usage',
          feature: 'subscription_guard',
          action: 'blocked',
        });

        // Custom analytics event
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('arcane:feature-blocked', {
            detail: {
              feature,
              requiredTier: minTier,
              currentTier: subscription?.tier || 'FREE',
              timestamp: new Date().toISOString(),
            },
          });
          window.dispatchEvent(event);
        }

        // Show upgrade modal
        setBlockedFeature(feature);

        // Ensure minTier is one of the valid values
        const validTier = (['GOLD', 'PRO', 'ENTERPRISE'] as const).includes(minTier as any)
          ? (minTier as 'GOLD' | 'PRO' | 'ENTERPRISE')
          : 'GOLD';

        setRequiredTier(validTier);
        setShowUpgradeModal(true);
      }

      return hasAccess;
    },
    [hasMinimumTier, subscription]
  );

  /**
   * Close the upgrade modal
   */
  const closeModal = useCallback(() => {
    setShowUpgradeModal(false);
  }, []);

  return {
    showUpgradeModal,
    setShowUpgradeModal,
    blockedFeature,
    requiredTier,
    checkAccess,
    requireAccess,
    closeModal,
  };
}

export default useSubscriptionGuard;
