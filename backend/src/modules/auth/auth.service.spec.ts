import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);

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
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await service.signup(signupDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: signupDto.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(signupDto.password, 10);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: signupDto.email,
          passwordHash: 'hashed-password',
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          phone: signupDto.phone,
          role: signupDto.role,
        },
        select: expect.any(Object),
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
      expect(result).toEqual({
        user: mockUser,
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.signup(signupDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should use default role PUBLIC if not provided', async () => {
      const dtoWithoutRole = { ...signupDto };
      delete dtoWithoutRole.role;

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        role: 'PUBLIC',
      });
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      await service.signup(dtoWithoutRole);

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'PUBLIC',
        }),
        select: expect.any(Object),
      });
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
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      });
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
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Account is disabled'),
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user has no password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        passwordHash: null,
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
      expect(bcrypt.compare).not.toHaveBeenCalled();
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
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser(userId);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.validateUser(userId);

      expect(result).toBeNull();
    });
  });
});
