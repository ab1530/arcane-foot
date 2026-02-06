import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  beforeEach(() => {
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

    // Create controller instance directly without NestJS DI
    controller = new AuthController(authService, refreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678',
      role: 'SCOUT' as any,
    };

    const mockResponse = {
      user: {
        id: 'user-123',
        email: signupDto.email,
        firstName: signupDto.firstName,
        lastName: signupDto.lastName,
        role: 'SCOUT' as any,
        phone: signupDto.phone,
        avatar: null,
        createdAt: new Date(),
        playerId: 'player-123',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      accessTokenExpiresIn: 900,
      refreshTokenExpiresIn: 2592000,
      tokenType: 'Bearer',
    };

    it('should successfully register a new user', async () => {
      authService.signup.mockResolvedValue(mockResponse);

      const result = await controller.signup(signupDto);

      expect(authService.signup).toHaveBeenCalledWith(signupDto);
      expect(result).toEqual(mockResponse);
    });

    it('should handle signup errors', async () => {
      const error = new Error('Email already exists');
      authService.signup.mockRejectedValue(error);

      await expect(controller.signup(signupDto)).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    const mockResponse = {
      user: {
        id: 'user-123',
        email: loginDto.email,
        firstName: 'John',
        lastName: 'Doe',
        role: 'SCOUT' as any,
        phone: '+33612345678',
        avatar: null,
        playerId: 'player-123',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      accessTokenExpiresIn: 900,
      refreshTokenExpiresIn: 2592000,
      tokenType: 'Bearer',
    };

    it('should successfully login a user', async () => {
      authService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockResponse);
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      authService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(error);
    });
  });

  describe('getCsrfToken', () => {
    it('should return null token when CSRF is disabled', async () => {
      const mockRequest = {
        app: {
          get: jest.fn().mockReturnValue(null),
        },
      };

      const result = await controller.getCsrfToken(mockRequest as any);

      expect(result).toEqual({
        token: null,
        message: 'CSRF protection is disabled (development mode)',
      });
    });

    it('should generate CSRF token when enabled', async () => {
      const mockCsrfToken = 'csrf-token-123';
      const mockGenerateToken = jest.fn().mockReturnValue(mockCsrfToken);
      const mockRequest = {
        app: {
          get: jest.fn().mockReturnValue(mockGenerateToken),
        },
        res: {},
      };

      const result = await controller.getCsrfToken(mockRequest as any);

      expect(mockGenerateToken).toHaveBeenCalledWith(mockRequest, mockRequest.res);
      expect(result).toEqual({
        token: mockCsrfToken,
        message: 'Include this token in x-csrf-token header for mutations',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current authenticated user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'SCOUT',
      };

      const mockRequest = {
        user: mockUser,
      };

      const result = await controller.getCurrentUser(mockRequest as any);

      expect(result).toEqual(mockUser);
    });
  });

  describe('refresh', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    const mockResponse = {
      accessToken: 'new-access-token',
      accessTokenExpiresIn: 900,
    };

    it('should successfully refresh access token', async () => {
      refreshTokenService.refreshAccessToken.mockResolvedValue(mockResponse);

      const result = await controller.refresh(refreshTokenDto);

      expect(refreshTokenService.refreshAccessToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle refresh errors', async () => {
      const error = new Error('Invalid refresh token');
      refreshTokenService.refreshAccessToken.mockRejectedValue(error);

      await expect(controller.refresh(refreshTokenDto)).rejects.toThrow(error);
    });
  });

  describe('logout', () => {
    const refreshTokenDto: RefreshTokenDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should successfully logout user', async () => {
      const authHeader = 'Bearer access-token-123';
      refreshTokenService.revokeRefreshToken.mockResolvedValue(undefined);
      refreshTokenService.blacklistAccessToken.mockResolvedValue(undefined);

      const result = await controller.logout(refreshTokenDto, authHeader);

      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
      expect(refreshTokenService.blacklistAccessToken).toHaveBeenCalledWith('access-token-123');
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should logout without access token', async () => {
      refreshTokenService.revokeRefreshToken.mockResolvedValue(undefined);

      const result = await controller.logout(refreshTokenDto, undefined);

      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        refreshTokenDto.refreshToken,
      );
      expect(refreshTokenService.blacklistAccessToken).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should handle logout errors', async () => {
      const error = new Error('Logout failed');
      refreshTokenService.revokeRefreshToken.mockRejectedValue(error);

      await expect(controller.logout(refreshTokenDto, 'Bearer token')).rejects.toThrow(error);
    });
  });

  describe('logoutAll', () => {
    it('should successfully logout from all devices', async () => {
      const mockRequest = {
        user: {
          id: 'user-123',
        },
      };

      refreshTokenService.revokeAllUserTokens.mockResolvedValue(undefined);

      const result = await controller.logoutAll(mockRequest as any);

      expect(refreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ message: 'Logged out from all devices' });
    });

    it('should handle logoutAll errors', async () => {
      const mockRequest = {
        user: {
          id: 'user-123',
        },
      };

      const error = new Error('Logout all failed');
      refreshTokenService.revokeAllUserTokens.mockRejectedValue(error);

      await expect(controller.logoutAll(mockRequest as any)).rejects.toThrow(error);
    });
  });
});
