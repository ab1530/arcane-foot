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
    const raw =
      process.env.PUBLIC_WEB_URL ||
      process.env.FRONTEND_URL ||
      'http://localhost:3000';

    // Keep it predictable for concatenation
    const cleaned = raw.trim().replace(/\/+$/, '');
    if (!process.env.PUBLIC_WEB_URL) {
      this.logger.warn(
        `[PUBLIC_WEB_URL] missing, using fallback for share links: ${cleaned}`,
      );
    }
    return cleaned;
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
      const message =
        e?.response?.message || e?.message || e?.toString?.() || '';
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
  }) {
    const { createdById, title, clubName } = params;
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
        avatarUrl:
          passportData?.avatar ??
          user?.avatar ??
          player?.photoUrl ??
          null,
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
          items: items as any,
        },
        select: {
          id: true,
          token: true,
          createdById: true,
          title: true,
          clubName: true,
          items: true,
          revokedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })
      .catch((e) => this.handleMissingTable(e));

    const baseUrl = this.getPublicWebUrl();
    const shareUrl = `${baseUrl}/shortlist/${token}`;
    return { token, shareUrl, shareSet };
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
