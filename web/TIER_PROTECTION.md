# Subscription Tier Protection Guide

This guide explains how to protect features and routes based on subscription tiers in the ARCANE Football platform.

## Subscription Tiers

The platform has 5 subscription tiers in hierarchical order:

1. **FREE** - Basic features
2. **BASIC** - Entry-level premium
3. **GOLD** - Full premium experience
4. **PRO** - Professional tools
5. **ENTERPRISE** - Custom solutions

## Backend Protection

### Using the `@MinTier()` Decorator

Protect controller routes by adding the `@MinTier()` decorator:

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { SubscriptionTierGuard } from '@/common/guards/subscription-tier.guard';
import { MinTier } from '@/common/decorators/min-tier.decorator';
import { SubscriptionTier } from '@prisma/client';

@Controller('premium-features')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
export class PremiumFeaturesController {

  @Get('basic-feature')
  @MinTier(SubscriptionTier.BASIC)
  async getBasicFeature() {
    // Only BASIC tier and above can access
    return { message: 'Basic feature' };
  }

  @Get('gold-feature')
  @MinTier(SubscriptionTier.GOLD)
  async getGoldFeature() {
    // Only GOLD tier and above can access
    return { message: 'Gold feature' };
  }

  @Get('pro-feature')
  @MinTier(SubscriptionTier.PRO)
  async getProFeature() {
    // Only PRO tier and above can access
    return { message: 'Pro feature' };
  }
}
```

**Important**: Always use both guards:
- `JwtAuthGuard` - Ensures user is authenticated
- `SubscriptionTierGuard` - Checks subscription tier

### Manual Tier Checking

In services, you can manually check tier access:

```typescript
import { SubscriptionsService } from '@/modules/subscriptions/subscriptions.service';
import { SubscriptionTier } from '@prisma/client';

@Injectable()
export class MyService {
  constructor(private subscriptionsService: SubscriptionsService) {}

  async doSomething(userId: string) {
    const hasAccess = await this.subscriptionsService.hasMinimumTier(
      userId,
      SubscriptionTier.GOLD
    );

    if (!hasAccess) {
      throw new ForbiddenException('Requires GOLD tier or higher');
    }

    // Proceed with premium feature
  }
}
```

## Frontend Protection

### 1. Using the `useSubscription` Hook

```typescript
import { useSubscription } from '@/hooks/useSubscription';

export default function MyComponent() {
  const { subscription, hasMinimumTier, requireTier } = useSubscription();

  // Check if user has minimum tier
  const canAccessFeature = hasMinimumTier('GOLD');

  // Require tier with automatic error toast
  const handlePremiumAction = () => {
    if (!requireTier('GOLD', 'Cette action nécessite un abonnement Gold')) {
      return;
    }
    // Proceed with action
  };

  return (
    <div>
      <p>Current tier: {subscription?.tier}</p>
      {canAccessFeature && (
        <button onClick={handlePremiumAction}>Premium Action</button>
      )}
    </div>
  );
}
```

### 2. Using the `<RequireTier>` Component

Wrap components to show upgrade prompt if tier requirement not met:

```typescript
import { RequireTier } from '@/components/auth/RequireTier';

export default function PremiumPage() {
  return (
    <RequireTier minTier="GOLD">
      <div>
        <h1>Premium Content</h1>
        <p>This is only visible to GOLD+ subscribers</p>
      </div>
    </RequireTier>
  );
}
```

**Options:**
- `minTier` (required): Minimum tier required
- `fallback`: Custom component to show if access denied
- `redirectTo`: Redirect to specific URL if access denied
- `showUpgrade`: Show upgrade prompt (default: true)

### 3. Using the `<TierGate>` Component

Conditionally render content without showing upgrade prompt:

```typescript
import { TierGate } from '@/components/auth/RequireTier';

export default function MyPage() {
  return (
    <div>
      <h1>My Page</h1>

      {/* Show to everyone */}
      <p>Basic content visible to all users</p>

      {/* Only show to BASIC+ */}
      <TierGate minTier="BASIC">
        <div className="premium-section">
          Basic+ exclusive content
        </div>
      </TierGate>

      {/* Only show to GOLD+ */}
      <TierGate minTier="GOLD">
        <div className="gold-section">
          Gold+ exclusive content
        </div>
      </TierGate>

      {/* With fallback */}
      <TierGate
        minTier="PRO"
        fallback={<p>Upgrade to Pro to see advanced analytics</p>}
      >
        <AdvancedAnalytics />
      </TierGate>
    </div>
  );
}
```

### 4. Route-Level Middleware Protection

Configure protected routes in `/src/middleware/tierCheck.ts`:

```typescript
export const tierProtectedRoutes: TierProtectedRoute[] = [
  { path: "/dashboard/analytics", minTier: "BASIC" },
  { path: "/camps/premium", minTier: "GOLD" },
  { path: "/reports/export", minTier: "GOLD" },
  { path: "/api-access", minTier: "PRO" },
  { path: "/admin", minTier: "ENTERPRISE" },
];
```

Users without sufficient tier will be redirected to `/pricing` with upgrade prompt.

## Common Patterns

### Feature Flags by Tier

```typescript
const TIER_FEATURES = {
  FREE: {
    maxReports: 1,
    maxVideos: 0,
    exportPDF: false,
  },
  BASIC: {
    maxReports: 5,
    maxVideos: 5,
    exportPDF: false,
  },
  GOLD: {
    maxReports: -1, // unlimited
    maxVideos: 50,
    exportPDF: true,
  },
  PRO: {
    maxReports: -1,
    maxVideos: -1,
    exportPDF: true,
  },
};

function getFeatureLimit(subscription, feature) {
  const tier = subscription?.tier || 'FREE';
  return TIER_FEATURES[tier][feature];
}
```

### Button with Tier Lock

```typescript
import { useSubscription } from '@/hooks/useSubscription';
import { Lock } from 'lucide-react';

export function PremiumButton() {
  const { hasMinimumTier, requireTier } = useSubscription();
  const canAccess = hasMinimumTier('GOLD');

  return (
    <button
      onClick={() => {
        if (requireTier('GOLD')) {
          // Do premium action
        }
      }}
      className={canAccess ? 'btn-primary' : 'btn-locked'}
    >
      {!canAccess && <Lock className="w-4 h-4 mr-2" />}
      Premium Feature
    </button>
  );
}
```

### Showing Tier Badge

```typescript
export function TierBadge() {
  const { subscription, getTierName } = useSubscription();

  if (!subscription) return null;

  return (
    <div className={`tier-badge tier-${subscription.tier.toLowerCase()}`}>
      {getTierName(subscription.tier)}
    </div>
  );
}
```

## Testing Tier Protection

1. **Test each tier level**: Ensure features are properly gated
2. **Test expired subscriptions**: Verify users revert to FREE tier
3. **Test upgrades/downgrades**: Check immediate access changes
4. **Test error messages**: Ensure clear communication to users

## Best Practices

1. **Always protect on backend**: Frontend protection is UX, backend is security
2. **Clear messaging**: Tell users what tier they need and why
3. **Easy upgrade path**: Always provide link to pricing page
4. **Graceful degradation**: Free tier should still be functional
5. **Test boundary cases**: Expired, cancelled, past-due subscriptions

## Example: Complete Protected Feature

```typescript
// Backend: Controller
@Controller('analytics')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
export class AnalyticsController {
  @Get('advanced')
  @MinTier(SubscriptionTier.GOLD)
  async getAdvancedAnalytics(@Req() req) {
    // Only GOLD+ can access
    return this.analyticsService.getAdvanced(req.user.id);
  }
}

// Frontend: Component
import { RequireTier } from '@/components/auth/RequireTier';

export default function AdvancedAnalyticsPage() {
  return (
    <RequireTier minTier="GOLD">
      <div>
        <h1>Advanced Analytics</h1>
        <AdvancedCharts />
      </div>
    </RequireTier>
  );
}
```

## Questions?

For more information, see:
- Backend: `/backend/src/common/guards/subscription-tier.guard.ts`
- Frontend Hook: `/src/hooks/useSubscription.ts`
- Frontend Components: `/src/components/auth/RequireTier.tsx`
- Middleware: `/src/middleware/tierCheck.ts`
