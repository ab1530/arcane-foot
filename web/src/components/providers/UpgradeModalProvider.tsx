"use client";

import { useEffect } from 'react';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { initializeApiInterceptor } from '@/lib/api-interceptor';

/**
 * Global provider that:
 * 1. Initializes API interceptor
 * 2. Provides global upgrade modal
 * 3. Listens for subscription errors
 */
export function UpgradeModalProvider({ children }: { children: React.ReactNode }) {
  const { showUpgradeModal, blockedFeature, requiredTier, closeModal } = useSubscriptionGuard();

  // Initialize API interceptor once on mount
  useEffect(() => {
    initializeApiInterceptor();
  }, []);

  return (
    <>
      {children}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={closeModal}
        blockedFeature={blockedFeature}
        requiredTier={requiredTier}
      />
    </>
  );
}
