"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useSubscription, SubscriptionTier } from "@/hooks/useSubscription";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Lock, Crown, Loader2 } from "lucide-react";

interface RequireTierProps {
  children: ReactNode;
  minTier: SubscriptionTier;
  fallback?: ReactNode;
  redirectTo?: string;
  showUpgrade?: boolean;
}

export function RequireTier({
  children,
  minTier,
  fallback,
  redirectTo,
  showUpgrade = true,
}: RequireTierProps) {
  const router = useRouter();
  const { subscription, loading, hasMinimumTier, getTierName, getUpgradeUrl } = useSubscription();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 text-arcane-accent animate-spin" />
      </div>
    );
  }

  const hasAccess = hasMinimumTier(minTier);

  if (!hasAccess) {
    if (redirectTo) {
      router.push(redirectTo);
      return null;
    }

    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgrade) {
      return (
        <GlassCard className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-arcane-accent/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-arcane-accent" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Fonctionnalité Premium</h3>
            <p className="text-arcane-grey mb-6">
              Cette fonctionnalité nécessite un abonnement{" "}
              <span className="text-arcane-accent font-bold">{getTierName(minTier)}</span> ou
              supérieur.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => router.push(getUpgradeUrl())}
                className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
              >
                <Crown className="h-4 w-4 mr-2" />
                Voir les offres
              </Button>
              <Button variant="outline" onClick={() => router.back()}>
                Retour
              </Button>
            </div>
            {subscription && (
              <p className="text-xs text-arcane-grey mt-4">
                Votre plan actuel: {getTierName(subscription.tier)}
              </p>
            )}
          </div>
        </GlassCard>
      );
    }

    return null;
  }

  return <>{children}</>;
}

interface TierGateProps {
  children: ReactNode;
  minTier: SubscriptionTier;
  fallback?: ReactNode;
}

export function TierGate({ children, minTier, fallback }: TierGateProps) {
  const { hasMinimumTier, loading } = useSubscription();

  if (loading) {
    return null;
  }

  if (!hasMinimumTier(minTier)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}
