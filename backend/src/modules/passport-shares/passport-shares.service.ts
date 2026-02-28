import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PassportService } from '../../passport/passport.service';
import { randomUUID } from 'crypto';
import type { PassportShareItem } from './types';

@Injectable()
export class PassportSharesService {
  private readonly logger = new Logger(PassportSharesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passportService: PassportService,
  ) {}

  private handleMissingTable(e: unknown): never {
    const anyErr = e as any;
    const code = anyErr?.code;
    const message = String(anyErr?.message ?? '');

    // Prisma: P2021 => "The table ... does not exist in the current database."
    if (code === 'P2021' || message.includes('does not exist in the current database')) {
      throw new ServiceUnavailableException(
        'Database schema out of date: missing table "passport_share_sets". Apply migration SQL: backend/prisma/migrations/20260207201000_passport_share_sets/migration.sql',
      );
    }

    throw anyErr;
  }

  private getPublicWebUrl(): string {
    const raw = process.env.PUBLIC_WEB_URL || process.env.FRONTEND_URL || 'http://localhost:3000';

    // Keep it predictable for concatenation
    const cleaned = raw.trim().replace(/\/+$/, '');
    if (!process.env.PUBLIC_WEB_URL) {
      this.logger.warn(`[PUBLIC_WEB_URL] missing, using fallback for share links: ${cleaned}`);
    }
    return cleaned;
  }

  private buildShareUrl(token: string, baseUrl?: string): string {
    const base = baseUrl ?? this.getPublicWebUrl();
    return `${base}/shortlist/${token}`;
  }

  private normalizeNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private normalizeDateString(value: unknown): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return null;
  }

  private computeAge(value: unknown): number | null {
    const dateValue = this.normalizeDateString(value);
    if (!dateValue) return null;

    const birthDate = new Date(dateValue);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  private async ensurePassport(playerId: string) {
    const existing = await this.prisma.player_passports.findUnique({
      where: { playerId },
      include: { players: { include: { users: true, clubs: true } } },
    });
    if (existing) return existing;

    try {
      return await this.passportService.createPassport(playerId);
    } catch (e: any) {
      const message = e?.response?.message || e?.message || e?.toString?.() || '';
      if (String(message).includes('Player already has a passport')) {
        const refetched = await this.prisma.player_passports.findUnique({
          where: { playerId },
          include: { players: { include: { users: true, clubs: true } } },
        });
        if (refetched) return refetched;
      }
      throw e;
    }
  }

  async createShareSet(params: {
    createdById: string;
    playerIds: string[];
    title?: string;
    clubName?: string;
    sourceFeature?: 'CLUB_NEEDS' | 'TRANSFER_MARKET_REQUEST';
    sourceRequestId?: string;
    sourceRequestLineNumber?: number;
  }) {
    const {
      createdById,
      title,
      clubName,
      sourceFeature,
      sourceRequestId,
      sourceRequestLineNumber,
    } = params;
    const uniquePlayerIds = Array.from(new Set(params.playerIds ?? []));

    if (uniquePlayerIds.length < 1) {
      throw new BadRequestException('playerIds must not be empty');
    }
    if (uniquePlayerIds.length > 20) {
      throw new BadRequestException('playerIds must contain at most 20 items');
    }

    const passports = [];
    for (const playerId of uniquePlayerIds) {
      passports.push(await this.ensurePassport(playerId));
    }

    const items: PassportShareItem[] = passports.map((p) => {
      const player = (p as any).players;
      const user = player?.users;
      const club = player?.clubs;
      const passportData = (p as any).passportData ?? {};

      return {
        playerId: player?.id ?? (p as any).playerId,
        publicToken: (p as any).publicToken,
        firstName: user?.firstName ?? player?.firstName ?? passportData?.firstName ?? null,
        lastName: user?.lastName ?? player?.lastName ?? passportData?.lastName ?? null,
        position: player?.position ?? passportData?.position ?? null,
        nationality: player?.nationality ?? passportData?.nationality ?? null,
        clubName: club?.name ?? passportData?.club?.name ?? null,
        avatarUrl: passportData?.avatar ?? user?.avatar ?? player?.photoUrl ?? null,
        age: this.computeAge(player?.dateOfBirth ?? passportData?.dateOfBirth),
        marketValue: this.normalizeNumber(player?.marketValue ?? passportData?.marketValue),
        contractUntil: this.normalizeDateString(
          player?.contractUntil ?? passportData?.contractUntil,
        ),
        preferredFoot: player?.preferredFoot ?? passportData?.preferredFoot ?? null,
        averageRating: this.normalizeNumber(passportData?.averageRating),
      };
    });

    const token = randomUUID();
    const shareSet = await this.prisma.passport_share_sets
      .create({
        data: {
          id: randomUUID(),
          token,
          createdById,
          title,
          clubName,
          sourceFeature,
          sourceRequestId,
          sourceRequestLineNumber,
          items: items as any,
        },
        select: {
          id: true,
          token: true,
          createdById: true,
          title: true,
          clubName: true,
          sourceFeature: true,
          sourceRequestId: true,
          sourceRequestLineNumber: true,
          items: true,
          revokedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch((e) => this.handleMissingTable(e));

    const shareUrl = this.buildShareUrl(token);
    return { token, shareUrl, shareSet };
  }

  async listShareSets(params?: {
    sourceRequestId?: string;
    sourceRequestLineNumber?: number;
    includeRevoked?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, params?.page ?? 1);
    const limit = Math.min(100, Math.max(1, params?.limit ?? 20));
    const includeRevoked = params?.includeRevoked === true;
    const skip = (page - 1) * limit;
    const where: any = {};

    if (params?.sourceRequestId) {
      where.sourceRequestId = params.sourceRequestId;
    }
    if (params?.sourceRequestLineNumber != null) {
      where.sourceRequestLineNumber = params.sourceRequestLineNumber;
    }
    if (!includeRevoked) {
      where.revokedAt = null;
    }

    const [items, total] = await Promise.all([
      this.prisma.passport_share_sets
        .findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            token: true,
            createdById: true,
            title: true,
            clubName: true,
            sourceFeature: true,
            sourceRequestId: true,
            sourceRequestLineNumber: true,
            items: true,
            revokedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        })
        .catch((e) => this.handleMissingTable(e)),
      this.prisma.passport_share_sets.count({ where }).catch((e) => this.handleMissingTable(e)),
    ]);

    const baseUrl = this.getPublicWebUrl();
    const data = items.map((item: any) => ({
      ...item,
      shareUrl: this.buildShareUrl(item.token, baseUrl),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getShareSetByToken(token: string) {
    const shareSet = await this.prisma.passport_share_sets
      .findUnique({
        where: { token },
        select: {
          token: true,
          title: true,
          clubName: true,
          items: true,
          revokedAt: true,
          createdAt: true,
        },
      })
      .catch((e) => this.handleMissingTable(e));

    if (!shareSet || shareSet.revokedAt) {
      throw new NotFoundException('Shortlist not found');
    }
    return shareSet;
  }

  async revoke(token: string) {
    const existing = await this.prisma.passport_share_sets
      .findUnique({
        where: { token },
        select: { token: true },
      })
      .catch((e) => this.handleMissingTable(e));
    if (!existing) {
      throw new NotFoundException('Shortlist not found');
    }

    return this.prisma.passport_share_sets
      .update({
        where: { token },
        data: { revokedAt: new Date() },
        select: {
          token: true,
          revokedAt: true,
          updatedAt: true,
        },
      })
      .catch((e) => this.handleMissingTable(e));
  }
}
