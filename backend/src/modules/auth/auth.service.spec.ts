import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prisma: DeepMockProxy<PrismaClient>;
  let jwtService: jest.Mocked<JwtService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    jwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
      decode: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: RefreshTokenService,
          useValue: refreshTokenService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678',
      role: 'SCOUT' as any,
    };

    const mockUser = {
      id: 'user-123',
      email: signupDto.email,
      firstName: signupDto.firstName,
      lastName: signupDto.lastName,
      role: 'SCOUT',
      phone: signupDto.phone,
      avatar: null,
      createdAt: new Date(),
    };

    it('should successfully create a new user', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 2592000,
      };

      prisma.users.findUnique.mockResolvedValue(null);
      prisma.users.create.mockResolvedValue(mockUser as any);
      refreshTokenService.generateTokens.mockResolvedValue(mockTokens);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.signup(signupDto);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(prisma.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: signupDto.email,
          passwordHash: 'hashed-password',
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          phone: signupDto.phone,
          role: signupDto.role,
        }),
        select: expect.any(Object),
      });
      expect(refreshTokenService.generateTokens).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
      );
      expect(result).toEqual({
        user: mockUser,
        ...mockTokens,
        tokenType: 'Bearer',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      await expect(service.signup(signupDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
      expect(prisma.users.create).not.toHaveBeenCalled();
    });

    it('should use default role PUBLIC if not provided', async () => {
      const dtoWithoutRole = { ...signupDto };
      delete dtoWithoutRole.role;

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 2592000,
      };

      prisma.users.findUnique.mockResolvedValue(null);
      prisma.users.create.mockResolvedValue({
        ...mockUser,
        role: 'PUBLIC',
      } as any);
      refreshTokenService.generateTokens.mockResolvedValue(mockTokens);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.signup(dtoWithoutRole);

      expect(prisma.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'PUBLIC',
        }),
        select: expect.any(Object),
      });
    });

    it('should hash password with bcrypt salt rounds 10', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 2592000,
      };

      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.users.create.mockResolvedValue(mockUser as any);
      refreshTokenService.generateTokens.mockResolvedValue(mockTokens);

      await service.signup(signupDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
    });

    it('should create user without optional phone field', async () => {
      const dtoWithoutPhone = { ...signupDto };
      delete dtoWithoutPhone.phone;

      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 2592000,
      };

      prisma.users.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      prisma.users.create.mockResolvedValue({ ...mockUser, phone: null } as any);
      refreshTokenService.generateTokens.mockResolvedValue(mockTokens);

      const result = await service.signup(dtoWithoutPhone);

      expect(result.user).toBeDefined();
      expect(prisma.users.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    const mockUser = {
      id: 'user-123',
      email: loginDto.email,
      passwordHash: 'hashed-password',
      firstName: 'John',
      lastName: 'Doe',
      role: 'SCOUT',
      phone: '+33612345678',
      avatar: null,
      isActive: true,
    };

    it('should successfully login a user', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 2592000,
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      prisma.users.update.mockResolvedValue(mockUser as any);
      refreshTokenService.generateTokens.mockResolvedValue(mockTokens);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.passwordHash);
      expect(prisma.users.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(refreshTokenService.generateTokens).toHaveBeenCalledWith(
        mockUser.id,
        mockUser.email,
        mockUser.role,
      );
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          role: mockUser.role,
          phone: mockUser.phone,
          avatar: mockUser.avatar,
        },
        ...mockTokens,
        tokenType: 'Bearer',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(prisma.users.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      prisma.users.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Account is disabled'),
      );
      expect(prisma.users.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user has no password', async () => {
      prisma.users.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      } as any);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should update lastLoginAt timestamp on successful login', async () => {
      const beforeLogin = new Date();
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 2592000,
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.users.update.mockResolvedValue(mockUser as any);
      refreshTokenService.generateTokens.mockResolvedValue(mockTokens);

      await service.login(loginDto);

      const updateCall = (prisma.users.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.lastLoginAt).toBeInstanceOf(Date);
      expect(updateCall.data.lastLoginAt.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime());
    });

    it('should return user without passwordHash in response', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 2592000,
      };

      prisma.users.findUnique.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prisma.users.update.mockResolvedValue(mockUser as any);
      refreshTokenService.generateTokens.mockResolvedValue(mockTokens);

      const result = await service.login(loginDto);

      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
    });
  });

  describe('validateUser', () => {
    const userId = 'user-123';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'SCOUT',
      isActive: true,
    };

    it('should return user if valid and active', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.validateUser(userId);

      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          clubs: {
            select: {
              id: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      prisma.users.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      prisma.users.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      } as any);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });

    it('should only return specified fields', async () => {
      prisma.users.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.validateUser(userId);

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        role: mockUser.role,
        isActive: mockUser.isActive,
      });
    });
  });
});
