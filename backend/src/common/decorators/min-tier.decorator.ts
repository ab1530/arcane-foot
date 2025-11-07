import { SetMetadata } from '@nestjs/common';
import { SubscriptionTier } from '@prisma/client';
import { MIN_TIER_KEY } from '../guards/subscription-tier.guard';

/**
 * Decorator to specify the minimum subscription tier required to access a route
 * @param tier - The minimum subscription tier required
 * @example
 * ```typescript
 * @MinTier(SubscriptionTier.GOLD)
 * @Get('premium-feature')
 * async getPremiumFeature() {
 *   // Only users with GOLD tier or higher can access this
 * }
 * ```
 */
export const MinTier = (tier: SubscriptionTier) => SetMetadata(MIN_TIER_KEY, tier);
