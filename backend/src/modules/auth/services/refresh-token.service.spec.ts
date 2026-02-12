import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenService } from './refresh-token.service';
import { RedisService } from '../../cache/redis.service';
import { UnauthorizedException } from '@nestjs/common';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let redisService: RedisService;
  let jwtService: JwtService;

  const mockRedisService = {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
    exists: jest.fn().mockResolvedValue(false),
    keys: jest.fn().mockResolvedValue([]),
    smembers: jest.fn().mockResolvedValue([]),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn().mockReturnValue({
      sub: 'user-123',
      email: 'test@example.com',
      role: 'PUBLIC',
      type: 'refresh',
      jti: 'token-id-123',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RefreshTokenService>(RefreshTokenService);
    redisService = module.get<RedisService>(RedisService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const role = 'PUBLIC';

      const result = await service.generateTokens(userId, email, role);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('accessTokenExpiresIn');
      expect(result).toHaveProperty('refreshTokenExpiresIn');
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(redisService.set).toHaveBeenCalled();
    });

    it('should store refresh token in Redis with correct TTL', async () => {
      const userId = 'user-123';
      const email = 'test@example.com';
      const role = 'PUBLIC';

      await service.generateTokens(userId, email, role);

      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('refresh_token:'),
        expect.objectContaining({
          userId,
          email,
          role,
        }),
        30 * 24 * 60 * 60, // 30 days
      );
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh access token with valid refresh token', async () => {
      const refreshToken = 'valid-refresh-token';
      mockRedisService.get.mockResolvedValueOnce({
        userId: 'user-123',
        email: 'test@example.com',
        role: 'PUBLIC',
      });

      const result = await service.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('accessTokenExpiresIn');
      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken);
      expect(redisService.get).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if token is blacklisted', async () => {
      const refreshToken = 'blacklisted-token';
      mockRedisService.exists.mockResolvedValueOnce(true);

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token not found in Redis', async () => {
      const refreshToken = 'valid-token';
      mockRedisService.get.mockResolvedValueOnce(null);

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token type is not refresh', async () => {
      const refreshToken = 'access-token';
      mockJwtService.verify.mockReturnValueOnce({
        sub: 'user-123',
        type: 'access', // Wrong type
      });

      await expect(service.refreshAccessToken(refreshToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke refresh token successfully', async () => {
      const refreshToken = 'valid-token';

      await service.revokeRefreshToken(refreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(refreshToken);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('token_blacklist:'),
        true,
        expect.any(Number),
      );
      expect(redisService.del).toHaveBeenCalled();
    });

    it('should not throw error if token is invalid', async () => {
      const refreshToken = 'invalid-token';
      mockJwtService.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await expect(service.revokeRefreshToken(refreshToken)).resolves.not.toThrow();
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true if token is blacklisted', async () => {
      mockRedisService.exists.mockResolvedValueOnce(true);

      const result = await service.isTokenBlacklisted('blacklisted-token');

      expect(result).toBe(true);
      expect(redisService.exists).toHaveBeenCalledWith(expect.stringContaining('token_blacklist:'));
    });

    it('should return false if token is not blacklisted', async () => {
      mockRedisService.exists.mockResolvedValueOnce(false);

      const result = await service.isTokenBlacklisted('valid-token');

      expect(result).toBe(false);
    });
  });

  describe('blacklistAccessToken', () => {
    it('should blacklist access token with correct TTL', async () => {
      const accessToken = 'access-token';

      await service.blacklistAccessToken(accessToken);

      expect(jwtService.verify).toHaveBeenCalledWith(accessToken);
      expect(redisService.set).toHaveBeenCalledWith(
        expect.stringContaining('token_blacklist:'),
        true,
        expect.any(Number),
      );
    });
  });

  describe('revokeAllUserTokens', () => {
    it('should revoke all tokens for a user', async () => {
      const userId = 'user-123';
      mockRedisService.keys.mockResolvedValueOnce([
        'refresh_token:token-1',
        'refresh_token:token-2',
      ]);
      mockRedisService.get
        .mockResolvedValueOnce({ userId: 'user-123' })
        .mockResolvedValueOnce({ userId: 'user-456' });

      await service.revokeAllUserTokens(userId);

      expect(redisService.del).toHaveBeenCalledTimes(1); // Only user-123's token
    });
  });
});
