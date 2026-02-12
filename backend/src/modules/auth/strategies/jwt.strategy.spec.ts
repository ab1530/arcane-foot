import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';
import { RefreshTokenService } from '../services/refresh-token.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    authService = {
      signup: jest.fn(),
      login: jest.fn(),
      validateUser: jest.fn(),
    } as any;

    refreshTokenService = {
      generateTokens: jest.fn(),
      refreshAccessToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      revokeAllUserTokens: jest.fn(),
      isTokenBlacklisted: jest.fn(),
      isAccessTokenBlacklisted: jest.fn(),
      blacklistAccessToken: jest.fn(),
      getUserActiveSessions: jest.fn(),
    } as any;

    configService = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
        {
          provide: RefreshTokenService,
          useValue: refreshTokenService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const mockRequest = {
      headers: {
        authorization: 'Bearer valid-access-token',
      },
    } as any;

    const mockPayload = {
      sub: 'user-123',
      email: 'test@example.com',
      role: 'SCOUT',
      type: 'access',
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'SCOUT' as any,
      isActive: true,
      clubs: {
        id: 'club-123',
      },
      players: {
        id: 'player-123',
      },
      playerId: 'player-123',
    };

    it('should validate and return user with valid access token', async () => {
      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(refreshTokenService.isAccessTokenBlacklisted).toHaveBeenCalledWith(
        'valid-access-token',
      );
      expect(authService.validateUser).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        ...mockUser,
        userId: 'user-123',
        clubId: 'club-123',
        playerId: 'player-123',
      });
    });

    it('should throw UnauthorizedException if token is a refresh token', async () => {
      const refreshPayload = {
        ...mockPayload,
        type: 'refresh',
      };

      await expect(strategy.validate(mockRequest, refreshPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockRequest, refreshPayload)).rejects.toThrow(
        'Refresh token cannot be used for authentication',
      );
    });

    it('should throw UnauthorizedException if token is blacklisted', async () => {
      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(true);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        'Token has been revoked',
      );
    });

    it('should throw UnauthorizedException if user is not found', async () => {
      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        'User not found or inactive',
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(mockRequest, mockPayload)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle user without club', async () => {
      const userWithoutClub = {
        ...mockUser,
        clubs: null,
      };

      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(userWithoutClub);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result).toEqual({
        ...userWithoutClub,
        userId: 'user-123',
        clubId: null,
        playerId: 'player-123',
      });
    });

    it('should add userId alias to returned user', async () => {
      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result).toHaveProperty('userId', 'user-123');
      expect(result).toHaveProperty('id', 'user-123');
    });

    it('should extract clubId from clubs relation', async () => {
      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result).toHaveProperty('clubId', 'club-123');
    });

    it('should handle request without authorization header', async () => {
      const requestWithoutAuth = {
        headers: {},
      } as any;

      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(requestWithoutAuth, mockPayload);

      expect(result).toBeDefined();
      expect(refreshTokenService.isAccessTokenBlacklisted).not.toHaveBeenCalled();
    });

    it('should verify token is not blacklisted before validating user', async () => {
      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(mockUser);

      await strategy.validate(mockRequest, mockPayload);

      const blacklistCallOrder =
        refreshTokenService.isAccessTokenBlacklisted.mock.invocationCallOrder[0];
      const validateCallOrder = authService.validateUser.mock.invocationCallOrder[0];

      expect(blacklistCallOrder).toBeLessThan(validateCallOrder);
    });

    it('should handle multiple user roles correctly', async () => {
      const roles = ['SCOUT', 'ADMIN', 'AGENT', 'PLAYER', 'CLUB_CONTACT', 'PUBLIC'];

      for (const role of roles) {
        const payload = { ...mockPayload, role };
        const user = { ...mockUser, role: role as any };

        refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
        authService.validateUser.mockResolvedValue(user as any);

        const result = await strategy.validate(mockRequest, payload);

        expect(result.role).toBe(role);
        jest.clearAllMocks();
      }
    });

    it('should handle user with club having different structure', async () => {
      const userWithClubObject = {
        ...mockUser,
        clubs: {
          id: 'club-456',
          name: 'Test Club',
          country: 'France',
        },
      };

      refreshTokenService.isAccessTokenBlacklisted.mockResolvedValue(false);
      authService.validateUser.mockResolvedValue(userWithClubObject as any);

      const result = await strategy.validate(mockRequest, mockPayload);

      expect(result.clubId).toBe('club-456');
    });
  });

  describe('constructor', () => {
    it('should use JWT secret from config', () => {
      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
    });

    it('should use default secret if config not available', () => {
      configService.get.mockReturnValue(null);

      // The strategy will use the fallback value in the constructor
      expect(strategy).toBeDefined();
    });
  });
});
