import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { PassportStatus, Prisma, ReportStatus } from '@prisma/client';
import * as QRCode from 'qrcode';
import { randomUUID } from 'crypto';

type PassportScoutingReport = {
  overallRating?: number | null;
  recommendation?: string | null;
  strengths?: string | null;
  weaknesses?: string | null;
  createdAt?: Date | string | null;
};

type ProfileView = {
  identity: {
    playerId: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string;
    position: string | null;
    nationality: string | null;
    club: { name: string; logo?: string | null } | null;
    avatarUrl: string | null;
  };
  market: {
    marketValue: number | null;
    contractUntil: string | null;
    externalMarketUrl: string | null;
  };
  physical: {
    age: number | null;
    height: number | null;
    weight: number | null;
    preferredFoot: string | null;
  };
  scouting: {
    averageRating: number | null;
    totalReports: number;
    lastReportAt: string | null;
    recommendation: string | null;
    strengthsTop: string[];
    weaknessesTop: string[];
  };
  stats: {
    snapshot: Record<string, string | number | boolean | null>;
    keyStats: Array<{ key: string; value: string | number | boolean | null }>;
  };
  mediaHighlights: Array<{
    id: string;
    type: string;
    url: string;
    thumbnailUrl: string | null;
    filename: string | null;
    duration: number | null;
    uploadedAt: string | null;
  }>;
  lastUpdatedAt: string;
};

@Injectable()
export class PassportService {
  constructor(private prisma: PrismaService) {}

  private getPlayerRelationsForPassport(): Prisma.playersInclude {
    return {
      users: true,
      clubs: true,
      scouting_reports: {
        where: { status: ReportStatus.APPROVED },
        take: 20,
        orderBy: { createdAt: 'desc' as const },
        select: {
          overallRating: true,
          recommendation: true,
          strengths: true,
          weaknesses: true,
          createdAt: true,
        },
      },
      media: {
        orderBy: { uploadedAt: 'desc' as const },
        select: {
          id: true,
          type: true,
          url: true,
          thumbnailUrl: true,
          filename: true,
          duration: true,
          uploadedAt: true,
        },
      },
    };
  }

  private normalizeString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const cleaned = value.trim();
    return cleaned.length > 0 ? cleaned : null;
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
      const asDate = new Date(value);
      return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
    }

    return null;
  }

  private computeAge(dateOfBirth: unknown): number | null {
    const dateValue = this.normalizeDateString(dateOfBirth);
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

  private extractListFromText(value: unknown): string[] {
    if (typeof value !== 'string') return [];

    return value
      .split(/[\n,;|•]+/)
      .map((part) => part.replace(/^[\-–—]\s*/, '').trim())
      .filter((part) => part.length >= 2)
      .slice(0, 10);
  }

  private aggregateTopKeywords(
    reports: PassportScoutingReport[],
    field: 'strengths' | 'weaknesses',
  ) {
    const counts = new Map<string, number>();

    reports.forEach((report) => {
      this.extractListFromText(report?.[field]).forEach((keyword) => {
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([keyword]) => keyword);
  }

  private getDominantRecommendation(reports: PassportScoutingReport[]): string | null {
    const counts = new Map<string, number>();

    reports.forEach((report) => {
      const recommendation = this.normalizeString(report?.recommendation);
      if (!recommendation) return;
      counts.set(recommendation, (counts.get(recommendation) ?? 0) + 1);
    });

    const dominant = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0];
    return dominant?.[0] ?? null;
  }

  private computeAverageRating(reports: PassportScoutingReport[]): number | null {
    const ratings = reports
      .map((report) => this.normalizeNumber(report?.overallRating))
      .filter((value): value is number => value != null);

    if (ratings.length === 0) {
      return null;
    }

    const average = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
    return Math.round(average * 10) / 10;
  }

  private normalizeStatsSnapshot(snapshot: unknown) {
    if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
      return {
        snapshot: {} as Record<string, string | number | boolean | null>,
        keyStats: [] as Array<{ key: string; value: string | number | boolean | null }>,
      };
    }

    const raw = snapshot as Record<string, unknown>;
    const normalized: Record<string, string | number | boolean | null> = {};

    Object.entries(raw).forEach(([key, value]) => {
      if (value == null) {
        normalized[key] = null;
        return;
      }

      if (typeof value === 'string' || typeof value === 'boolean') {
        normalized[key] = value;
        return;
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        normalized[key] = value;
      }
    });

    const preferredKeyOrder = [
      'goals',
      'assists',
      'minutes',
      'matches',
      'xg',
      'xa',
      'shots',
      'keyPasses',
      'successfulDribbles',
      'tackles',
      'interceptions',
    ];

    const keyStats: Array<{ key: string; value: string | number | boolean | null }> = [];
    preferredKeyOrder.forEach((key) => {
      if (key in normalized) {
        keyStats.push({ key, value: normalized[key] });
      }
    });

    if (keyStats.length === 0) {
      Object.entries(normalized)
        .slice(0, 8)
        .forEach(([key, value]) => {
          keyStats.push({ key, value });
        });
    }

    return { snapshot: normalized, keyStats };
  }

  private buildExternalMarketUrl(fullName: string): string | null {
    const trimmedName = fullName.trim();
    if (!trimmedName) return null;

    const query = encodeURIComponent(trimmedName);
    const template = process.env.PUBLIC_MARKET_LINK_TEMPLATE?.trim();

    if (template) {
      if (template.includes('{query}')) {
        return template.replace('{query}', query);
      }
      const separator = template.includes('?') ? '&' : '?';
      return `${template}${separator}query=${query}`;
    }

    return `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${query}`;
  }

  private normalizeMediaHighlights(media: any[]) {
    if (!Array.isArray(media) || media.length === 0) return [];

    return [...media]
      .sort((a, b) => {
        const aIsVideo = String(a?.type ?? '').toUpperCase() === 'VIDEO' ? 1 : 0;
        const bIsVideo = String(b?.type ?? '').toUpperCase() === 'VIDEO' ? 1 : 0;
        if (aIsVideo !== bIsVideo) return bIsVideo - aIsVideo;

        const aDate = this.normalizeDateString(a?.uploadedAt) ?? '';
        const bDate = this.normalizeDateString(b?.uploadedAt) ?? '';
        return bDate.localeCompare(aDate);
      })
      .slice(0, 3)
      .map((item) => ({
        id: String(item?.id ?? ''),
        type: String(item?.type ?? 'UNKNOWN'),
        url: String(item?.url ?? ''),
        thumbnailUrl: this.normalizeString(item?.thumbnailUrl),
        filename: this.normalizeString(item?.filename),
        duration: this.normalizeNumber(item?.duration),
        uploadedAt: this.normalizeDateString(item?.uploadedAt),
      }))
      .filter((item) => item.id && item.url);
  }

  private buildProfileView(passport: any, player: any): ProfileView {
    const passportData = (passport?.passportData ?? {}) as Record<string, any>;
    const scoutingReports = (player?.scouting_reports ?? []) as PassportScoutingReport[];

    const userFirstName = this.normalizeString(player?.users?.firstName);
    const userLastName = this.normalizeString(player?.users?.lastName);

    const firstName =
      userFirstName ??
      this.normalizeString(player?.firstName) ??
      this.normalizeString(passportData?.firstName);
    const lastName =
      userLastName ??
      this.normalizeString(player?.lastName) ??
      this.normalizeString(passportData?.lastName);

    const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Player';

    const averageRatingFromReports = this.computeAverageRating(scoutingReports);
    const stats = this.normalizeStatsSnapshot(
      passportData?.statsSnapshot ?? player?.statsJson ?? null,
    );

    const lastReportAt =
      scoutingReports.length > 0 ? this.normalizeDateString(scoutingReports[0]?.createdAt) : null;

    const marketValue =
      this.normalizeNumber(player?.marketValue) ?? this.normalizeNumber(passportData?.marketValue);

    const contractUntil =
      this.normalizeDateString(player?.contractUntil) ??
      this.normalizeDateString(passportData?.contractUntil);

    const age = this.computeAge(player?.dateOfBirth ?? passportData?.dateOfBirth);

    return {
      identity: {
        playerId: String(player?.id ?? passport?.playerId ?? ''),
        firstName,
        lastName,
        fullName,
        position:
          this.normalizeString(player?.position) ?? this.normalizeString(passportData?.position),
        nationality:
          this.normalizeString(player?.nationality) ??
          this.normalizeString(passportData?.nationality),
        club: player?.clubs
          ? {
              name: this.normalizeString(player.clubs?.name) ?? '—',
              logo: this.normalizeString(player.clubs?.logo),
            }
          : passportData?.club
            ? {
                name: this.normalizeString(passportData.club?.name) ?? '—',
                logo: this.normalizeString(passportData.club?.logo),
              }
            : null,
        avatarUrl:
          this.normalizeString(player?.photoUrl) ??
          this.normalizeString(player?.users?.avatar) ??
          this.normalizeString(passportData?.avatar),
      },
      market: {
        marketValue,
        contractUntil,
        externalMarketUrl: this.buildExternalMarketUrl(fullName),
      },
      physical: {
        age,
        height: this.normalizeNumber(player?.height) ?? this.normalizeNumber(passportData?.height),
        weight: this.normalizeNumber(player?.weight) ?? this.normalizeNumber(passportData?.weight),
        preferredFoot:
          this.normalizeString(player?.preferredFoot) ??
          this.normalizeString(passportData?.preferredFoot),
      },
      scouting: {
        averageRating:
          averageRatingFromReports ?? this.normalizeNumber(passportData?.averageRating),
        totalReports:
          scoutingReports.length > 0
            ? scoutingReports.length
            : Number(this.normalizeNumber(passportData?.totalReports) ?? 0),
        lastReportAt,
        recommendation:
          this.getDominantRecommendation(scoutingReports) ??
          this.normalizeString(passportData?.recommendation),
        strengthsTop: this.aggregateTopKeywords(scoutingReports, 'strengths'),
        weaknessesTop: this.aggregateTopKeywords(scoutingReports, 'weaknesses'),
      },
      stats,
      mediaHighlights: this.normalizeMediaHighlights(player?.media ?? []),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  async createPassport(playerId: string, verificationNotes?: string) {
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
        clubs: true,
        scouting_reports: {
          where: { status: ReportStatus.APPROVED },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    const existingPassport = await this.prisma.player_passports.findUnique({
      where: { playerId },
    });

    if (existingPassport) {
      throw new BadRequestException('Player already has a passport');
    }

    const passportData = this.buildPassportData(player);

    return this.prisma.player_passports.create({
      data: {
        id: randomUUID(),
        playerId,
        publicToken: randomUUID(),
        status: PassportStatus.PENDING,
        passportData,
        verificationNotes,
        updatedAt: new Date(),
      },
      include: {
        players: {
          include: {
            users: true,
            clubs: true,
          },
        },
      },
    });
  }

  async getPassport(playerId: string) {
    const passport = await this.prisma.player_passports.findUnique({
      where: { playerId },
      include: {
        players: {
          include: this.getPlayerRelationsForPassport(),
        },
      },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return {
      ...passport,
      profileView: this.buildProfileView(passport, passport.players),
    };
  }

  async getPassportByToken(token: string) {
    const passport = await this.prisma.player_passports.findUnique({
      where: { publicToken: token },
      include: {
        players: {
          include: this.getPlayerRelationsForPassport(),
        },
      },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return {
      ...passport,
      publicProfile: this.buildProfileView(passport, passport.players),
    };
  }

  async getPassportForUser(userId: string) {
    const player = await this.prisma.players.findFirst({
      where: { userId },
      include: {
        users: true,
        clubs: true,
        scouting_reports: {
          where: { status: ReportStatus.APPROVED },
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Player profile not found for user');
    }

    const existingPassport = await this.prisma.player_passports.findUnique({
      where: { playerId: player.id },
      include: {
        players: {
          include: this.getPlayerRelationsForPassport(),
        },
      },
    });

    if (existingPassport) {
      return {
        ...existingPassport,
        profileView: this.buildProfileView(existingPassport, existingPassport.players),
      };
    }

    const passportData = this.buildPassportData(player);

    const created = await this.prisma.player_passports.create({
      data: {
        id: randomUUID(),
        playerId: player.id,
        publicToken: randomUUID(),
        status: PassportStatus.PENDING,
        passportData,
        verificationNotes: 'Auto-generated passport',
        updatedAt: new Date(),
      },
      include: {
        players: {
          include: {
            users: true,
            clubs: true,
          },
        },
      },
    });

    return {
      ...created,
      profileView: this.buildProfileView(created, created.players),
    };
  }

  async verifyPassport(
    playerId: string,
    status: PassportStatus,
    verifiedById: string,
    verificationNotes?: string,
  ) {
    const passport = await this.prisma.player_passports.findUnique({
      where: { playerId },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return this.prisma.player_passports.update({
      where: { playerId },
      data: {
        status,
        verifiedAt: status === PassportStatus.VERIFIED ? new Date() : null,
        verifiedById,
        verificationNotes,
      },
      include: {
        players: {
          include: {
            users: true,
            clubs: true,
          },
        },
      },
    });
  }

  async generateQRCode(token: string): Promise<string> {
    const baseUrl =
      process.env.PUBLIC_WEB_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const passportUrl = `${baseUrl}/passport/${token}`;

    try {
      const qrCodeDataUrl = await QRCode.toDataURL(passportUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#080C1D',
          light: '#E4FF3B',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code', error);
      throw new BadRequestException('Failed to generate QR code');
    }
  }

  async deletePassport(playerId: string) {
    const passport = await this.prisma.player_passports.findUnique({
      where: { playerId },
    });

    if (!passport) {
      throw new NotFoundException('Passport not found');
    }

    return this.prisma.player_passports.delete({
      where: { playerId },
    });
  }

  private buildPassportData(player: any) {
    const avgRating =
      player.scouting_reports?.length > 0
        ? Math.round(
            player.scouting_reports.reduce((sum, r) => sum + (r.overallRating || 0), 0) /
              player.scouting_reports.length,
          )
        : null;

    return {
      firstName: player.users?.firstName,
      lastName: player.users?.lastName,
      position: player.position,
      nationality: player.nationality,
      dateOfBirth: player.dateOfBirth,
      height: player.height,
      weight: player.weight,
      preferredFoot: player.preferredFoot,
      club: player.clubs ? { name: player.clubs.name, logo: player.clubs.logo } : null,
      avatar: player.users?.avatar,
      averageRating: avgRating,
      totalReports: player.scouting_reports?.length ?? 0,
      statsSnapshot: player.statsJson,
    };
  }
}
