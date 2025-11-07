import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

export type SubscriptionTier = "FREE" | "BASIC" | "GOLD" | "PRO" | "ENTERPRISE";
export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";

export interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingPeriod?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  GOLD: 2,
  PRO: 3,
  ENTERPRISE: 4,
};

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getMySubscription();
      setSubscription(data);
    } catch (err: any) {
      // Silently handle auth errors (401) for non-logged users
      // Only log non-auth errors
      if (!err.message?.includes('Unauthorized') && !err.message?.includes('401')) {
        console.error("Error fetching subscription:", err);
      }
      setError(err.message || "Failed to fetch subscription");
      // User might not have a subscription or not be logged in
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  const hasMinimumTier = (minTier: SubscriptionTier): boolean => {
    if (!subscription) return minTier === "FREE";
    if (subscription.status !== "ACTIVE" && subscription.status !== "TRIAL") {
      return minTier === "FREE";
    }
    return TIER_HIERARCHY[subscription.tier] >= TIER_HIERARCHY[minTier];
  };

  const requireTier = (minTier: SubscriptionTier, errorMessage?: string): boolean => {
    const hasAccess = hasMinimumTier(minTier);
    if (!hasAccess) {
      toast.error(
        errorMessage || `Cette fonctionnalité nécessite un abonnement ${minTier} ou supérieur`
      );
    }
    return hasAccess;
  };

  const getTierName = (tier: SubscriptionTier): string => {
    const names: Record<SubscriptionTier, string> = {
      FREE: "Gratuit",
      BASIC: "Basic",
      GOLD: "Gold",
      PRO: "Pro",
      ENTERPRISE: "Enterprise",
    };
    return names[tier] || tier;
  };

  const canUpgrade = (): boolean => {
    if (!subscription) return true;
    return subscription.tier !== "ENTERPRISE";
  };

  const getUpgradeUrl = (): string => {
    return "/pricing";
  };

  return {
    subscription,
    loading,
    error,
    hasMinimumTier,
    requireTier,
    getTierName,
    canUpgrade,
    getUpgradeUrl,
    refetch: fetchSubscription,
  };
}

export default useSubscription;
