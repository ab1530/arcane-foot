import { NextRequest, NextResponse } from "next/server";

export type SubscriptionTier = "FREE" | "BASIC" | "GOLD" | "PRO" | "ENTERPRISE";

const TIER_HIERARCHY: Record<SubscriptionTier, number> = {
  FREE: 0,
  BASIC: 1,
  GOLD: 2,
  PRO: 3,
  ENTERPRISE: 4,
};

interface TierProtectedRoute {
  path: string;
  minTier: SubscriptionTier;
}

// Define routes that require specific tiers
export const tierProtectedRoutes: TierProtectedRoute[] = [
  // Example protected routes - adjust as needed
  { path: "/dashboard/analytics", minTier: "BASIC" },
  { path: "/camps/premium", minTier: "GOLD" },
  { path: "/reports/export", minTier: "GOLD" },
  { path: "/api-access", minTier: "PRO" },
];

export function hasMinimumTier(
  userTier: SubscriptionTier | null | undefined,
  requiredTier: SubscriptionTier
): boolean {
  if (!userTier) {
    userTier = "FREE";
  }
  return TIER_HIERARCHY[userTier] >= TIER_HIERARCHY[requiredTier];
}

export function checkTierAccess(
  request: NextRequest,
  userTier?: SubscriptionTier
): NextResponse | null {
  const pathname = request.nextUrl.pathname;

  // Find if this route requires a minimum tier
  const protectedRoute = tierProtectedRoutes.find((route) => pathname.startsWith(route.path));

  if (!protectedRoute) {
    // Route is not tier-protected
    return null;
  }

  // Check if user has required tier
  if (!hasMinimumTier(userTier, protectedRoute.minTier)) {
    // Redirect to pricing page with return URL
    const url = request.nextUrl.clone();
    url.pathname = "/pricing";
    url.searchParams.set("upgrade", protectedRoute.minTier);
    url.searchParams.set("return", pathname);
    return NextResponse.redirect(url);
  }

  return null;
}

export default checkTierAccess;
