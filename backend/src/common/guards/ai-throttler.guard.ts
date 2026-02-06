import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * AI Rate Limiter Guard
 * Limits AI endpoint calls to prevent excessive OpenAI API costs
 * - AI endpoints: 10 requests per minute per user
 */
@Injectable()
export class AiThrottlerGuard extends ThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Public endpoints bypass throttling
    }

    return super.canActivate(context);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track by user ID if authenticated, otherwise by IP
    return req.user?.id || req.ips.length ? req.ips[0] : req.ip;
  }
}
