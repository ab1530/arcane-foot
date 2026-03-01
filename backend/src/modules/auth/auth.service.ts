import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { RefreshTokenService } from './services/refresh-token.service';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ALL_ROLES, DEFAULT_ROLE, type Role } from '../../common/roles/role.constants';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async signup(dto: SignupDto) {
    // Check if user exists
    const existing = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const signupRole = this.resolveSignupRole(dto.role);

    const user = await this.prisma.users.create({
      data: {
        id: randomUUID(),
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: signupRole,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
    });

    const player = await this.prisma.players.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Generate access and refresh tokens
    const tokens = await this.refreshTokenService.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        ...user,
        playerId: player?.id ?? null,
      },
      ...tokens,
      tokenType: 'Bearer',
    };
  }

  private resolveSignupRole(role?: Role | null) {
    if (!role) {
      return DEFAULT_ROLE;
    }

    const normalizedRole = (role === 'SUPER_ADMIN' ? 'ADMIN' : role) as Role;
    return ALL_ROLES.includes(normalizedRole) ? normalizedRole : DEFAULT_ROLE;
  }

  async login(dto: LoginDto) {
    // Find user
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Update last login
    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const player = await this.prisma.players.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Generate access and refresh tokens
    const tokens = await this.refreshTokenService.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        playerId: player?.id ?? null,
      },
      ...tokens,
      tokenType: 'Bearer',
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.users.findUnique({
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
        players: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      ...user,
      playerId: user.players?.id ?? null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.users.update({
      where: { id: userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
