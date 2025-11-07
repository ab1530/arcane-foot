import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../cache/redis.service';
import * as crypto from 'crypto';

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);
  private readonly REFRESH_TOKEN_PREFIX = 'refresh_token:';
  private readonly BLACKLIST_PREFIX = 'token_blacklist:';
  private readonly REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days in seconds
  private readonly ACCESS_TOKEN_TTL = 15 * 60; // 15 minutes in seconds

  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(userId: string, email: string, role: string) {
    // Generate access token (short-lived)
    const accessToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        type: 'access',
      },
      {
        expiresIn: '15m', // 15 minutes
      },
    );

    // Generate refresh token (long-lived)
    const refreshTokenId = crypto.randomBytes(32).toString('hex');
    const refreshToken = this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        type: 'refresh',
        jti: refreshTokenId, // JWT ID for tracking
      },
      {
        expiresIn: '30d', // 30 days
      },
    );

    // Store refresh token in Redis with metadata
    const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${refreshTokenId}`;
    await this.redisService.set(
      refreshKey,
      {
        userId,
        email,
        role,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      },
      this.REFRESH_TOKEN_TTL,
    );

    this.logger.log(`Generated tokens for user ${userId}`);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresIn: this.ACCESS_TOKEN_TTL,
      refreshTokenExpiresIn: this.REFRESH_TOKEN_TTL,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken);

      // Validate token type
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(refreshToken);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Check if refresh token exists in Redis
      const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${payload.jti}`;
      const tokenData = await this.redisService.get(refreshKey);

      if (!tokenData) {
        throw new UnauthorizedException('Refresh token not found or expired');
      }

      // Update last used timestamp
      const updatedTokenData = {
        userId: tokenData['userId'],
        email: tokenData['email'],
        role: tokenData['role'],
        createdAt: tokenData['createdAt'],
        lastUsed: new Date().toISOString(),
      };
      await this.redisService.set(
        refreshKey,
        updatedTokenData,
        this.REFRESH_TOKEN_TTL,
      );

      // Generate new access token
      const accessToken = this.jwtService.sign(
        {
          sub: payload.sub,
          email: payload.email,
          role: payload.role,
          type: 'access',
        },
        {
          expiresIn: '15m',
        },
      );

      this.logger.log(`Refreshed access token for user ${payload.sub}`);

      return {
        accessToken,
        accessTokenExpiresIn: this.ACCESS_TOKEN_TTL,
      };
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Revoke refresh token (logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      // Add token to blacklist
      const blacklistKey = `${this.BLACKLIST_PREFIX}${refreshToken}`;
      const ttl = Math.max(payload.exp - Math.floor(Date.now() / 1000), 0);
      await this.redisService.set(blacklistKey, true, ttl);

      // Delete from active tokens
      const refreshKey = `${this.REFRESH_TOKEN_PREFIX}${payload.jti}`;
      await this.redisService.del(refreshKey);

      this.logger.log(`Revoked refresh token for user ${payload.sub}`);
    } catch (error) {
      this.logger.error(`Revoke token error: ${error.message}`);
      // Don't throw error - allow logout even if token is invalid
    }
  }

  /**
   * Revoke all tokens for a user (logout all devices)
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Find all refresh tokens for user
      const pattern = `${this.REFRESH_TOKEN_PREFIX}*`;
      const keys = await this.redisService.smembers(pattern);

      let revokedCount = 0;
      for (const key of keys) {
        const tokenData = await this.redisService.get(key);
        if (tokenData && tokenData['userId'] === userId) {
          await this.redisService.del(key);
          revokedCount++;
        }
      }

      this.logger.log(`Revoked ${revokedCount} tokens for user ${userId}`);
    } catch (error) {
      this.logger.error(`Revoke all tokens error: ${error.message}`);
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklistKey = `${this.BLACKLIST_PREFIX}${token}`;
    return await this.redisService.exists(blacklistKey);
  }

  /**
   * Check if access token is blacklisted
   */
  async isAccessTokenBlacklisted(accessToken: string): Promise<boolean> {
    const blacklistKey = `${this.BLACKLIST_PREFIX}${accessToken}`;
    return await this.redisService.exists(blacklistKey);
  }

  /**
   * Blacklist access token (for immediate logout)
   */
  async blacklistAccessToken(accessToken: string): Promise<void> {
    try {
      const payload = this.jwtService.verify(accessToken);
      const blacklistKey = `${this.BLACKLIST_PREFIX}${accessToken}`;
      const ttl = Math.max(payload.exp - Math.floor(Date.now() / 1000), 0);
      await this.redisService.set(blacklistKey, true, ttl);

      this.logger.log(`Blacklisted access token for user ${payload.sub}`);
    } catch (error) {
      this.logger.error(`Blacklist access token error: ${error.message}`);
    }
  }

  /**
   * Get active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<any[]> {
    try {
      const pattern = `${this.REFRESH_TOKEN_PREFIX}*`;
      const keys = await this.redisService.smembers(pattern);

      const sessions = [];
      for (const key of keys) {
        const tokenData = await this.redisService.get(key);
        if (tokenData && tokenData['userId'] === userId) {
          sessions.push({
            createdAt: tokenData['createdAt'],
            lastUsed: tokenData['lastUsed'],
          });
        }
      }

      return sessions;
    } catch (error) {
      this.logger.error(`Get user sessions error: ${error.message}`);
      return [];
    }
  }
}
