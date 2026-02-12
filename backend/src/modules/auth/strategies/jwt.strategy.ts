import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private refreshTokenService: RefreshTokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'arcane-secret-key-change-in-production',
      passReqToCallback: true, // Pass request to validate function
    });
  }

  async validate(req: Request, payload: any) {
    // Validate that it's an access token (not refresh token)
    if (payload.type === 'refresh') {
      throw new UnauthorizedException('Refresh token cannot be used for authentication');
    }

    // Extract token from header
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

    // Check if token is blacklisted
    if (token) {
      const isBlacklisted = await this.refreshTokenService.isAccessTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    // Validate user exists and is active
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user with userId, clubId, and playerId for backward compatibility
    return {
      ...user,
      userId: user.id, // Add userId alias for controllers that use req.user.userId
      clubId: user.clubs?.id || null, // Extract clubId from clubs relation
      playerId: (user as any).playerId || null,
    };
  }
}
