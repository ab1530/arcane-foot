import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Auth Rate Limiter Guard
 * Limits login/signup attempts to prevent brute force attacks
 * - Login: 5 attempts per minute per IP
 * - Signup: 3 attempts per minute per IP
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Track by IP address
    return req.ips.length ? req.ips[0] : req.ip;
  }
}
