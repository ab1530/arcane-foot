import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * AI Rate Limiter Guard
 * Limits AI endpoint calls to prevent excessive OpenAI API costs
 * - AI endpoints: 10 requests per minute per user
 */
@Injectable()
export class AiThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track by user ID if authenticated, otherwise by IP
    return req.user?.id || req.ips.length ? req.ips[0] : req.ip;
  }
}
