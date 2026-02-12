import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionTier } from '@prisma/client';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

export const MIN_TIER_KEY = 'minTier';

@Injectable()
export class SubscriptionTierGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Public endpoints bypass tier check
    }

    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier>(MIN_TIER_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredTier) {
      return true; // No tier requirement, allow access
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasAccess = await this.subscriptionsService.hasMinimumTier(user.id, requiredTier);

    if (!hasAccess) {
      throw new ForbiddenException(
        `This feature requires at least ${requiredTier} subscription tier`,
      );
    }

    return true;
  }
}
