import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchStatus, ProfileContentStatus, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../../common/interceptors/cache.interceptor';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { FilterPlayersDto, PlayerSortField, SortOrder } from './dto/filter-players.dto';
import {
  ScoutQuickImportDto,
  ScoutQuickImportResult,
  ScoutQuickImportRow,
} from './dto/scout-quick-import.dto';
import { SubmitPlayerWeeklyUpdateDto } from './dto/submit-player-weekly-update.dto';
import { randomUUID } from 'crypto';

type ParsedScoutLine = {
  line: number;
  raw: string;
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  observedClubName?: string;
  position?: string;
  preferredFoot?: string;
};

const RIGHT_FOOT_KEYWORDS = ['droitier', 'droite', 'right', 'right-footed'];
const LEFT_FOOT_KEYWORDS = ['gaucher', 'gauche', 'left', 'left-footed'];
const BOTH_FOOT_KEYWORDS = ['ambi', 'ambidextre', 'both', 'two-footed'];

const POSITION_KEYWORDS: Array<{ value: string; keywords: string[] }> = [
  { value: 'Goalkeeper', keywords: ['gardien', 'goalkeeper', 'keeper', 'gk'] },
  { value: 'Defender', keywords: ['defenseur', 'défenseur', 'defender', 'dc', 'latéral'] },
  { value: 'Midfielder', keywords: ['milieu', 'midfielder', 'midfield', 'mdf'] },
  { value: 'Winger', keywords: ['ailier', 'winger', 'ail', 'lw', 'rw'] },
  { value: 'Forward', keywords: ['attaquant', 'avant-centre', 'striker', 'forward', 'cf'] },
];

type PlayerSpaceWeeklyUpdate = {
  weekStartDate: string;
  submittedAt: string;
  updatedBy: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  matchesPlayed: number;
  matchesNotPlayed: number;
  isInjured: boolean;
  healthStatus: 'NORMAL' | 'FATIGUE' | 'INJURY';
  remarks?: string | null;
};

type PlayerSpacePayload = {
  playerId: string;
  player: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    fullName: string;
    position: string;
    nationality: string;
    clubId?: string | null;
    clubName?: string | null;
    photoUrl?: string | null;
  };
  snapshot: {
    matchesPlayed: number;
    matchesNotPlayed: number;
    goals: number;
    assists: number;
    minutesPlayed: number;
    isInjured: boolean;
    injuryStatus: string | null;
  };
  performanceTrend: Array<{
    period: string;
    rating: number | null;
    minutes: number | null;
  }>;
  upcomingCalendar: Array<{
    id: string;
    scheduledAt: string;
    opponent: string;
    opponentLogo: string | null;
    isHome: boolean;
    status: string | null;
    competition: string | null;
  }>;
  health: {
    status: string;
    lastDeviceSync: string | null;
    syncSource: string | null;
  };
  weekly: {
    latest: PlayerSpaceWeeklyUpdate | null;
    totalUpdates: number;
  };
  news: Array<{
    id: string;
    headline: string;
    summary: string | null;
    sourceName: string;
    publishedAt: string | null;
  }>;
  generatedAt: string;
};

type PlayerSpaceStoredWeeklyUpdate = {
  weekStartDate: string;
  submittedAt: string;
  updatedBy: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  matchesPlayed: number;
  matchesNotPlayed: number;
  isInjured: boolean;
  healthStatus: 'NORMAL' | 'FATIGUE' | 'INJURY';
  remarks?: string | null;
};

@Injectable()
export class PlayersService {
  constructor(
    private prisma: PrismaService,
    private cacheManager: CacheManagerService,
  ) {}

  private normalizeText(value?: string | null): string {
    if (!value) return '';
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private toDisplayCase(value?: string | null): string | undefined {
    if (!value) return undefined;
    const collapsed = value.replace(/\s+/g, ' ').trim();
    if (!collapsed) return undefined;
    return collapsed
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private buildIdentityKey(
    firstName?: string | null,
    lastName?: string | null,
    birthYear?: number | null,
    observedClubName?: string | null,
  ): string {
    return [
      this.normalizeText(firstName),
      this.normalizeText(lastName),
      birthYear ?? '',
      this.normalizeText(observedClubName),
    ].join('|');
  }

  private detectPreferredFoot(raw: string): string | undefined {
    const normalized = this.normalizeText(raw);

    if (BOTH_FOOT_KEYWORDS.some((keyword) => normalized.includes(this.normalizeText(keyword)))) {
      return 'Both';
    }

    if (RIGHT_FOOT_KEYWORDS.some((keyword) => normalized.includes(this.normalizeText(keyword)))) {
      return 'Right';
    }

    if (LEFT_FOOT_KEYWORDS.some((keyword) => normalized.includes(this.normalizeText(keyword)))) {
      return 'Left';
    }

    return undefined;
  }

  private detectPosition(raw: string): string | undefined {
    const normalized = this.normalizeText(raw);
    const match = POSITION_KEYWORDS.find(({ keywords }) =>
      keywords.some((keyword) => normalized.includes(this.normalizeText(keyword))),
    );
    return match?.value;
  }

  private cleanupSegment(raw: string): string {
    let cleaned = raw.replace(/\b(19|20)\d{2}\b/g, ' ');
    for (const keyword of [...RIGHT_FOOT_KEYWORDS, ...LEFT_FOOT_KEYWORDS, ...BOTH_FOOT_KEYWORDS]) {
      const pattern = new RegExp(`\\b${this.normalizeText(keyword)}\\b`, 'gi');
      cleaned = this.normalizeText(cleaned).replace(pattern, ' ');
    }
    for (const { keywords } of POSITION_KEYWORDS) {
      for (const keyword of keywords) {
        const pattern = new RegExp(`\\b${this.normalizeText(keyword)}\\b`, 'gi');
        cleaned = this.normalizeText(cleaned).replace(pattern, ' ');
      }
    }

    return cleaned.replace(/\s+/g, ' ').trim();
  }

  private extractNameAndClub(firstSegment: string): {
    nameCandidate: string;
    clubFromFirstSegment?: string;
  } {
    const raw = firstSegment.replace(/\s+/g, ' ').trim();
    const yearMatch = raw.match(/\b(19|20)\d{2}\b/);
    let candidate = raw;
    let tailAfterYear = '';
    if (yearMatch?.index !== undefined) {
      candidate = raw.slice(0, yearMatch.index).trim();
      tailAfterYear = raw.slice(yearMatch.index + yearMatch[0].length).trim();
    }

    const cleanedCandidate = this.cleanupSegment(candidate);
    const tokens = cleanedCandidate.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return {
        nameCandidate: '',
        clubFromFirstSegment: this.cleanupSegment(tailAfterYear) || undefined,
      };
    }

    if (tokens.length === 1) {
      return {
        nameCandidate: tokens[0],
        clubFromFirstSegment: this.cleanupSegment(tailAfterYear) || undefined,
      };
    }

    if (tokens.length === 2) {
      return {
        nameCandidate: `${tokens[0]} ${tokens[1]}`.trim(),
        clubFromFirstSegment: this.cleanupSegment(tailAfterYear) || undefined,
      };
    }

    const thirdToken = tokens[2];
    const shouldSplitAsClub =
      tokens.length === 3 ||
      /^[a-z]/.test(thirdToken) ||
      ['fc', 'ac', 'sc', 'as', 'us', 'st'].includes(this.normalizeText(thirdToken));

    if (shouldSplitAsClub) {
      return {
        nameCandidate: `${tokens[0]} ${tokens[1]}`.trim(),
        clubFromFirstSegment: [tokens.slice(2).join(' '), this.cleanupSegment(tailAfterYear)]
          .filter(Boolean)
          .join(' ')
          .trim(),
      };
    }

    return {
      nameCandidate: tokens.join(' '),
      clubFromFirstSegment: this.cleanupSegment(tailAfterYear) || undefined,
    };
  }

  private parseScoutLine(rawLine: string, lineNumber: number): ParsedScoutLine {
    const normalizedRaw = rawLine.replace(/\s+/g, ' ').trim();
    const segments = normalizedRaw
      .split(/[,–-]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    const fallbackSegments = segments.length > 0 ? segments : [normalizedRaw];
    const firstSegment = fallbackSegments[0] || '';
    const { nameCandidate, clubFromFirstSegment } = this.extractNameAndClub(firstSegment);

    const yearMatch = normalizedRaw.match(/\b(19|20)\d{2}\b/);
    const birthYear = yearMatch ? Number.parseInt(yearMatch[0], 10) : undefined;

    const preferredFoot = this.detectPreferredFoot(normalizedRaw);
    const position = this.detectPosition(normalizedRaw);

    let observedClubName = clubFromFirstSegment;
    if (!observedClubName) {
      for (let i = 1; i < fallbackSegments.length; i += 1) {
        const candidate = this.cleanupSegment(fallbackSegments[i]);
        if (!candidate) continue;
        if (this.detectPreferredFoot(candidate) || this.detectPosition(candidate)) continue;
        observedClubName = candidate;
        break;
      }
    }

    const nameTokens = nameCandidate.split(/\s+/).filter(Boolean);
    const firstName = nameTokens[0];
    const lastName = nameTokens.length > 1 ? nameTokens.slice(1).join(' ') : undefined;

    return {
      line: lineNumber,
      raw: rawLine,
      firstName: this.toDisplayCase(firstName),
      lastName: this.toDisplayCase(lastName),
      birthYear,
      observedClubName: this.toDisplayCase(observedClubName),
      position,
      preferredFoot,
    };
  }

  private toFrontendPlayer(player: any) {
    const syntheticUser = player?.users
      ? player.users
      : {
          id: null,
          email: null,
          firstName: player?.firstName ?? '',
          lastName: player?.lastName ?? '',
          avatar: null,
        };

    return {
      ...player,
      user: syntheticUser,
      club: player?.clubs ?? null,
    };
  }

  private toJsonRecord(value: unknown): Record<string, unknown> {
    if (value === null || value === undefined) {
      return {};
    }

    if (Array.isArray(value)) {
      return {};
    }

    return typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private toJsonArray(value: unknown): any[] {
    return Array.isArray(value) ? value : [];
  }

  private toDateOnly(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private parseDate(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private toDateTime(value: unknown): string | null {
    const parsed = this.parseDate(value);
    return parsed ? parsed.toISOString() : null;
  }

  private toSafeString(value: unknown, fallback = ''): string {
    if (typeof value !== 'string') {
      return fallback;
    }
    return value.trim();
  }

  private toSafeNumber(value: unknown, fallback = 0): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.round(value);
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.round(parsed) : fallback;
    }

    return fallback;
  }

  private toSafeBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }

    return fallback;
  }

  private normalizeHealthStatus(
    value: unknown,
    fallback: PlayerSpaceStoredWeeklyUpdate['healthStatus'] = 'NORMAL',
  ): PlayerSpaceStoredWeeklyUpdate['healthStatus'] {
    if (value === 'INJURY' || value === 'FATIGUE' || value === 'NORMAL') {
      return value;
    }

    return fallback;
  }

  private startOfWeek(date: Date): string {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    const day = value.getDay();
    const distanceToMonday = (day + 6) % 7;
    value.setDate(value.getDate() - distanceToMonday);
    return this.toDateOnly(value);
  }

  private normalizeWeeklyUpdate(value: any): PlayerSpaceStoredWeeklyUpdate | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const parsedSubmittedAt = this.toDateTime(value.submittedAt);

    return {
      weekStartDate: this.toSafeString(value.weekStartDate, this.startOfWeek(new Date())),
      submittedAt: this.toSafeString(parsedSubmittedAt, new Date().toISOString()),
      updatedBy: this.toSafeString(value.updatedBy, 'player'),
      minutesPlayed: this.toSafeNumber(value.minutesPlayed),
      goals: this.toSafeNumber(value.goals),
      assists: this.toSafeNumber(value.assists),
      matchesPlayed: this.toSafeNumber(value.matchesPlayed),
      matchesNotPlayed: this.toSafeNumber(value.matchesNotPlayed),
      isInjured: this.toSafeBoolean(value.isInjured),
      healthStatus: this.normalizeHealthStatus(value.healthStatus),
      remarks: this.toSafeString(value.remarks, '').length > 0 ? this.toSafeString(value.remarks) : null,
    };
  }

  private getPlayerSnapshot(
    player: any,
    weeklyUpdates: PlayerSpaceStoredWeeklyUpdate[],
  ): PlayerSpacePayload['snapshot'] {
    const stats = this.toJsonRecord(player?.statsJson);
    const latestWeekly = weeklyUpdates[0] ?? null;

    const snapshot = {
      matchesPlayed: this.toSafeNumber(
        stats.matchesPlayed ?? latestWeekly?.matchesPlayed,
        0,
      ),
      matchesNotPlayed: this.toSafeNumber(
        stats.matchesNotPlayed ?? latestWeekly?.matchesNotPlayed,
        0,
      ),
      goals: this.toSafeNumber(stats.goals ?? latestWeekly?.goals, 0),
      assists: this.toSafeNumber(stats.assists ?? latestWeekly?.assists, 0),
      minutesPlayed: this.toSafeNumber(stats.minutesPlayed ?? latestWeekly?.minutesPlayed, 0),
      isInjured:
        player?.status === 'INJURED' ||
        this.toSafeBoolean(stats.isInjured, latestWeekly?.isInjured ?? false),
      injuryStatus: this.toSafeString(
        stats.injuryStatus || latestWeekly?.healthStatus || null,
        player?.status === 'INJURED' ? 'INJURY' : '',
      ) || null,
    };

    return snapshot;
  }

  private getPlayerSpaceHealth(
    player: any,
    weeklyUpdates: PlayerSpaceStoredWeeklyUpdate[],
    latestSession: any,
  ): PlayerSpacePayload['health'] {
    const latestWeekly = weeklyUpdates[0] ?? null;
    const snapshot = this.getPlayerSnapshot(player, weeklyUpdates);
    let status = 'En attente de sync';

    if (snapshot.isInjured) {
      status = 'Blessé';
    } else if (latestSession) {
      status = 'Connecté';
    } else if (player?.lastSyncAt) {
      status = 'Inactif';
    }

    return {
      status,
      lastDeviceSync: this.toDateTime(latestSession?.endedAt ?? player?.lastSyncAt),
      syncSource:
        latestWeekly?.healthStatus === 'INJURY'
          ? 'auto'
          : this.toSafeString(latestSession?.source ?? null),
    };
  }

  private mapPerformanceTrend(entries: any[]): PlayerSpacePayload['performanceTrend'] {
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    });

    const mapped = entries.map((entry) => {
      const matchDate = this.parseDate(entry?.matches?.scheduledAt ?? entry.createdAt);
      const period = matchDate ? formatter.format(matchDate) : 'N/A';
      const rating =
        typeof entry?.overallRating === 'number' && Number.isFinite(entry.overallRating)
          ? entry.overallRating
          : null;
      const minutes =
        typeof entry?.playerMinutesPlayed === 'number' &&
        Number.isFinite(entry.playerMinutesPlayed)
          ? entry.playerMinutesPlayed
          : null;
      return {
        period,
        rating,
        minutes,
      };
    });

    return mapped.reverse();
  }

  private getPlayerSpaceCalendar(
    player: any,
    matches: any[],
  ): PlayerSpacePayload['upcomingCalendar'] {
    if (!Array.isArray(matches) || !player?.clubId) {
      return [];
    }

    return matches.map((match) => {
      const isHome = match.homeClubId === player.clubId;
      const opponentClub = isHome ? match.clubs_matches_awayClubIdToclubs : match.clubs_matches_homeClubIdToclubs;
      return {
        id: match.id,
        scheduledAt: this.toDateTime(match.scheduledAt) || '',
        opponent: this.toSafeString(opponentClub?.name, '—'),
        opponentLogo: opponentClub?.logo ?? null,
        isHome,
        status: this.toSafeString(match.status, ''),
        competition: this.toSafeString(
          match?.competitions?.name ?? match?.competition?.name ?? null,
          '—',
        ),
      };
    });
  }

  private mapNewsItems(items: any[]): PlayerSpacePayload['news'] {
    return (items || []).map((item) => ({
      id: item?.id,
      headline: this.toSafeString(item?.headline, ''),
      summary: item?.summary ? this.toSafeString(item.summary) : null,
      sourceName: this.toSafeString(item?.sourceName, 'Arcane'),
      publishedAt: this.toDateTime(item?.publishedAtSource) || this.toDateTime(item?.createdAt),
    }));
  }

  private async resolvePlayerForSpace(userId: string, playerIdHint?: string | null) {
    if (playerIdHint) {
      const playerById = await this.prisma.players.findUnique({
        where: { id: playerIdHint },
        include: {
          clubs: {
            select: {
              id: true,
              name: true,
              logo: true,
            },
          },
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!playerById) {
        throw new NotFoundException(`Player with ID ${playerIdHint} not found`);
      }

      if (playerById.userId && playerById.userId !== userId) {
        throw new ForbiddenException("You are not authorized to access this player's space");
      }

      return playerById;
    }

    const player = await this.prisma.players.findUnique({
      where: { userId },
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
        users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found for this account');
    }

    return player;
  }

  private normalizeIncomingWeeklyUpdate(
    dto: SubmitPlayerWeeklyUpdateDto,
    playerId: string,
    latestUpdate: PlayerSpaceStoredWeeklyUpdate | null,
  ): PlayerSpaceStoredWeeklyUpdate {
    const fallback = this.startOfWeek(new Date());
    const weekStartDate = this.parseDate(dto.weekStartDate)
      ? this.startOfWeek(this.parseDate(dto.weekStartDate)!)
      : fallback;
    const now = new Date().toISOString();

    return {
      weekStartDate,
      submittedAt: now,
      updatedBy: playerId,
      minutesPlayed: dto.minutesPlayed,
      goals: dto.goals,
      assists: dto.assists,
      matchesPlayed: dto.matchesPlayed,
      matchesNotPlayed: dto.matchesNotPlayed,
      isInjured: dto.isInjured,
      healthStatus: this.normalizeHealthStatus(dto.healthStatus ?? latestUpdate?.healthStatus),
      remarks: this.toSafeString(dto.remarks, '').length > 0 ? dto.remarks : null,
    };
  }

  async getMyPlayerSpace(userId: string, playerIdHint?: string | null): Promise<PlayerSpacePayload> {
    const player = await this.resolvePlayerForSpace(userId, playerIdHint);
    const rawStats = this.toJsonRecord(player.statsJson);
    const weeklyUpdates = this.toJsonArray(rawStats.weeklyUpdates)
      .map((entry) => this.normalizeWeeklyUpdate(entry))
      .filter((entry): entry is PlayerSpaceStoredWeeklyUpdate => entry !== null)
      .sort((left, right) => {
        const rightDate = this.toDateTime(right.submittedAt);
        const leftDate = this.toDateTime(left.submittedAt);
        if (!rightDate && !leftDate) return 0;
        if (!rightDate) return 1;
        if (!leftDate) return -1;
        return rightDate > leftDate ? 1 : rightDate < leftDate ? -1 : 0;
      });

    const [recentReports, upcomingMatches, latestSession, newsItems] = await Promise.all([
      this.prisma.scouting_reports.findMany({
        where: { playerId: player.id, status: ReportStatus.APPROVED },
        include: {
          matches: {
            select: {
              scheduledAt: true,
              competitions: {
                select: { name: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      player.clubId
        ? this.prisma.matches.findMany({
            where: {
              OR: [{ homeClubId: player.clubId }, { awayClubId: player.clubId }],
              scheduledAt: { gte: new Date() },
              status: {
                in: [MatchStatus.SCHEDULED, MatchStatus.LIVE],
              },
            },
            include: {
              clubs_matches_homeClubIdToclubs: {
                select: { id: true, name: true, logo: true },
              },
              clubs_matches_awayClubIdToclubs: {
                select: { id: true, name: true, logo: true },
              },
              competitions: {
                select: { name: true },
              },
            },
            orderBy: { scheduledAt: 'asc' },
            take: 10,
          })
        : Promise.resolve([]),
      this.prisma.hardwareSession.findFirst({
        where: { playerId: player.id },
        orderBy: { endedAt: 'desc' },
        select: { endedAt: true, source: true },
      }),
      this.prisma.player_news_entries.findMany({
        where: {
          playerId: player.id,
          contentStatus: ProfileContentStatus.PUBLISHED,
        },
        orderBy: { publishedAtSource: 'desc' },
        take: 6,
        select: {
          id: true,
          headline: true,
          summary: true,
          publishedAtSource: true,
          sourceName: true,
          sourceUrl: true,
        },
      }),
    ]);

    const weekly = {
      latest: weeklyUpdates[0] ?? null,
      totalUpdates: weeklyUpdates.length,
    };

    const fullName = `${this.toSafeString(player?.users?.firstName, player.firstName)} ${this.toSafeString(
      player?.users?.lastName,
      player.lastName,
    )}`.trim();

    return {
      playerId: player.id,
      player: {
        id: player.id,
        firstName: this.toSafeString(player?.users?.firstName, player.firstName),
        lastName: this.toSafeString(player?.users?.lastName, player.lastName),
        fullName: fullName || 'Joueur',
        position: this.toSafeString(player.position),
        nationality: this.toSafeString(player.nationality),
        clubId: player.clubId ?? null,
        clubName: this.toSafeString(player.clubs?.name) || null,
        photoUrl: this.toSafeString(player.photoUrl) || null,
      },
      snapshot: this.getPlayerSnapshot(player, weeklyUpdates),
      performanceTrend: this.mapPerformanceTrend(recentReports),
      upcomingCalendar: this.getPlayerSpaceCalendar(player, upcomingMatches),
      health: this.getPlayerSpaceHealth(player, weeklyUpdates, latestSession),
      weekly,
      news: this.mapNewsItems(newsItems),
      generatedAt: new Date().toISOString(),
    };
  }

  async submitMyPlayerWeeklyUpdate(
    userId: string,
    playerIdHint: string | undefined,
    dto: SubmitPlayerWeeklyUpdateDto,
  ) {
    const player = await this.resolvePlayerForSpace(userId, playerIdHint);
    const rawStats = this.toJsonRecord(player.statsJson);
    const existingWeekly = this.toJsonArray(rawStats.weeklyUpdates).map((entry) =>
      this.normalizeWeeklyUpdate(entry),
    );
    const latestExisting = existingWeekly
      .filter((entry): entry is PlayerSpaceStoredWeeklyUpdate => entry !== null)
      .sort((left, right) => {
        const rightDate = this.toDateTime(right.submittedAt);
        const leftDate = this.toDateTime(left.submittedAt);
        if (!rightDate && !leftDate) return 0;
        if (!rightDate) return 1;
        if (!leftDate) return -1;
        return rightDate < leftDate ? -1 : rightDate > leftDate ? 1 : 0;
      })[0] ?? null;
    const incoming = this.normalizeIncomingWeeklyUpdate(dto, player.id, latestExisting);
    const updatesMap = new Map<string, PlayerSpaceStoredWeeklyUpdate>();

    for (const item of existingWeekly) {
      if (item && item.weekStartDate) {
        updatesMap.set(item.weekStartDate, item);
      }
    }
    updatesMap.set(incoming.weekStartDate, incoming);

    const nextWeeklyUpdates = Array.from(updatesMap.values())
      .sort((left, right) => {
        if (left.weekStartDate < right.weekStartDate) return 1;
        if (left.weekStartDate > right.weekStartDate) return -1;
        return 0;
      })
      .slice(0, 26);

    await this.prisma.players.update({
      where: { id: player.id },
      data: {
        updatedAt: new Date(),
        statsJson: {
          ...rawStats,
          matchesPlayed: incoming.matchesPlayed,
          matchesNotPlayed: incoming.matchesNotPlayed,
          goals: incoming.goals,
          assists: incoming.assists,
          minutesPlayed: incoming.minutesPlayed,
          isInjured: incoming.isInjured,
          injuryStatus: incoming.healthStatus,
          weeklyUpdates: nextWeeklyUpdates,
          lastWeeklyUpdateAt: incoming.submittedAt,
        },
      },
    });

    return this.getMyPlayerSpace(userId, player.id);
  }


  /**
   * Create a new player
   * Invalidates cache on creation
   */
  async create(createPlayerDto: CreatePlayerDto) {
    const data: any = { ...createPlayerDto };
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.contractUntil) {
      data.contractUntil = new Date(data.contractUntil);
    }

    const player = await this.prisma.players.create({
      data: {
        id: randomUUID(),
        ...data,
        updatedAt: new Date(),
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    // Invalidate players list cache
    await this.cacheManager.invalidateByTag('players:list');

    return this.toFrontendPlayer(player);
  }

  /**
   * Find all players with advanced filters and pagination
   */
  async findAll(filters: FilterPlayersDto) {
    const {
      position,
      status,
      nationality,
      clubId,
      search,
      minAge,
      maxAge,
      minHeight,
      maxHeight,
      minWeight,
      maxWeight,
      minMarketValue,
      maxMarketValue,
      preferredFoot,
      availableForTransfer,
      sortBy = PlayerSortField.CREATED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 1000,
    } = filters;

    const where: any = {};

    // Filtre de position - mapper les catégories génériques aux positions spécifiques
    if (position) {
      const positionMap: Record<string, string[]> = {
        GOALKEEPER: ['Goalkeeper'],
        DEFENDER: ['Center Back', 'Left Back', 'Right Back'],
        MIDFIELDER: ['Central Midfielder', 'Defensive Midfielder', 'Attacking Midfielder'],
        FORWARD: ['Striker', 'Left Winger', 'Right Winger'],
      };

      if (positionMap[position]) {
        // Si c'est une catégorie générique, chercher toutes les positions correspondantes
        where.position = { in: positionMap[position] };
      } else {
        // Sinon, chercher la position exacte
        where.position = position;
      }
    }
    if (status) where.status = status;
    if (nationality) where.nationality = nationality;
    if (clubId) where.clubId = clubId;
    if (preferredFoot) where.preferredFoot = preferredFoot;
    if (availableForTransfer !== undefined) where.availableForTransfer = availableForTransfer;

    // Filtres par plages numériques
    if (minHeight !== undefined || maxHeight !== undefined) {
      where.height = {};
      if (minHeight !== undefined) where.height.gte = minHeight;
      if (maxHeight !== undefined) where.height.lte = maxHeight;
    }

    if (minWeight !== undefined || maxWeight !== undefined) {
      where.weight = {};
      if (minWeight !== undefined) where.weight.gte = minWeight;
      if (maxWeight !== undefined) where.weight.lte = maxWeight;
    }

    if (minMarketValue !== undefined || maxMarketValue !== undefined) {
      where.marketValue = {};
      if (minMarketValue !== undefined) where.marketValue.gte = minMarketValue;
      if (maxMarketValue !== undefined) where.marketValue.lte = maxMarketValue;
    }

    // Filtre par âge (calculé à partir de la date de naissance)
    if (minAge !== undefined || maxAge !== undefined) {
      where.dateOfBirth = {};
      const today = new Date();

      if (maxAge !== undefined) {
        const minDate = new Date(today.getFullYear() - maxAge, today.getMonth(), today.getDate());
        where.dateOfBirth.gte = minDate;
      }

      if (minAge !== undefined) {
        const maxDate = new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
        where.dateOfBirth.lte = maxDate;
      }
    }

    // Recherche par nom
    if (search) {
      where.OR = [
        {
          users: {
            is: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Configuration du tri
    let orderBy: any = {};

    switch (sortBy) {
      case PlayerSortField.NAME:
        orderBy = { users: { firstName: sortOrder } };
        break;
      case PlayerSortField.AGE:
        orderBy = { dateOfBirth: sortOrder === SortOrder.ASC ? 'desc' : 'asc' }; // Inversé car plus ancien = plus âgé
        break;
      case PlayerSortField.HEIGHT:
        orderBy = { height: sortOrder };
        break;
      case PlayerSortField.MARKET_VALUE:
        orderBy = { marketValue: sortOrder };
        break;
      case PlayerSortField.RATING:
        orderBy = { overallRating: sortOrder };
        break;
      case PlayerSortField.CREATED_AT:
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }

    const skip = (page - 1) * limit;

    const players = await this.prisma.players.findMany({
      where,
      skip,
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        clubs: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logo: true,
            country: true,
          },
        },
        _count: {
          select: {
            scouting_reports: true,
            media: true,
          },
        },
      },
      orderBy,
    });

    const transformedPlayers = players.map((player) => this.toFrontendPlayer(player));

    // Return array directly for consistency with tests and API standards
    // If pagination metadata is needed, clients can use response headers or separate endpoint
    return transformedPlayers;
  }

  /**
   * Find one player by ID
   * CACHED: 300s TTL (5 minutes) - Heavy query with multiple relations
   */
  async findOne(id: string) {
    const cacheKey = `players:detail:${id}`;

    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const player = await this.prisma.players.findUnique({
          where: { id },
          include: {
            users: true,
            clubs: true,
            scouting_reports: {
              take: 10,
              orderBy: { createdAt: 'desc' },
              include: {
                matches: {
                  include: {
                    clubs_matches_homeClubIdToclubs: {
                      select: {
                        id: true,
                        name: true,
                        logo: true,
                      },
                    },
                    clubs_matches_awayClubIdToclubs: {
                      select: {
                        id: true,
                        name: true,
                        logo: true,
                      },
                    },
                  },
                },
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            media: {
              orderBy: { uploadedAt: 'desc' },
              take: 20,
            },
            club_requests: {
              orderBy: { createdAt: 'desc' },
              include: {
                clubs: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
            _count: {
              select: {
                scouting_reports: true,
                media: true,
                club_requests: true,
              },
            },
          },
        });

        if (!player) {
          throw new NotFoundException(`Player with ID ${id} not found`);
        }

        return this.toFrontendPlayer(player);
      },
      300, // Cache for 5 minutes
    );
  }

  async quickImportFromScoutText(
    dto: ScoutQuickImportDto,
    importerId: string,
  ): Promise<ScoutQuickImportResult> {
    const rawText = dto.rawText?.trim();
    if (!rawText) {
      throw new BadRequestException('rawText is required');
    }

    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new BadRequestException('No player lines found in rawText');
    }

    const defaultNationality = (dto.defaultNationality || 'FR').toUpperCase();
    const dryRun = dto.dryRun === true;

    const existingPlayers = await this.prisma.players.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthYear: true,
        observedClubName: true,
        nationality: true,
        users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const existingByKey = new Map<string, any>();
    for (const player of existingPlayers) {
      const key = this.buildIdentityKey(
        player.firstName ?? player.users?.firstName,
        player.lastName ?? player.users?.lastName,
        player.birthYear,
        player.observedClubName,
      );
      if (key && !existingByKey.has(key)) {
        existingByKey.set(key, player);
      }
    }

    const rows: ScoutQuickImportRow[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (let index = 0; index < lines.length; index += 1) {
      const raw = lines[index];
      const lineNumber = index + 1;
      try {
        const parsed = this.parseScoutLine(raw, lineNumber);
        if (!parsed.firstName) {
          failed += 1;
          rows.push({
            line: lineNumber,
            raw,
            action: 'FAILED',
            reason: 'Unable to detect player name on this line',
          });
          continue;
        }

        const key = this.buildIdentityKey(
          parsed.firstName,
          parsed.lastName,
          parsed.birthYear,
          parsed.observedClubName,
        );
        const existing = existingByKey.get(key);

        if (dryRun) {
          if (existing) {
            updated += 1;
            rows.push({
              line: lineNumber,
              raw,
              action: 'UPDATED',
              playerId: existing.id,
            });
          } else {
            created += 1;
            rows.push({
              line: lineNumber,
              raw,
              action: 'CREATED',
            });
          }
          continue;
        }

        if (existing) {
          const updatedPlayer = await this.prisma.players.update({
            where: { id: existing.id },
            data: {
              firstName: parsed.firstName ?? undefined,
              lastName: parsed.lastName ?? undefined,
              birthYear: parsed.birthYear ?? undefined,
              observedClubName: parsed.observedClubName ?? undefined,
              position: parsed.position ?? undefined,
              preferredFoot: parsed.preferredFoot ?? undefined,
              importSource: 'SCOUT_CHAT',
              nationality: existing.nationality || defaultNationality,
              updatedAt: new Date(),
            },
            select: { id: true },
          });

          updated += 1;
          rows.push({
            line: lineNumber,
            raw,
            action: 'UPDATED',
            playerId: updatedPlayer.id,
          });
        } else {
          const createdPlayer = await this.prisma.players.create({
            data: {
              id: randomUUID(),
              userId: null,
              firstName: parsed.firstName ?? null,
              lastName: parsed.lastName ?? null,
              birthYear: parsed.birthYear ?? null,
              observedClubName: parsed.observedClubName ?? null,
              importSource: 'SCOUT_CHAT',
              position: parsed.position ?? 'Unknown',
              preferredFoot: parsed.preferredFoot ?? null,
              nationality: defaultNationality,
              dateOfBirth: null,
              status: 'PROSPECT',
              isPublic: true,
              updatedAt: new Date(),
            },
            select: { id: true },
          });

          existingByKey.set(key, {
            id: createdPlayer.id,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            birthYear: parsed.birthYear,
            observedClubName: parsed.observedClubName,
            nationality: defaultNationality,
            users: null,
          });

          created += 1;
          rows.push({
            line: lineNumber,
            raw,
            action: 'CREATED',
            playerId: createdPlayer.id,
          });
        }
      } catch (error) {
        failed += 1;
        rows.push({
          line: lineNumber,
          raw,
          action: 'FAILED',
          reason: (error as Error)?.message || 'Unexpected import error',
        });
      }
    }

    if (!dryRun) {
      await this.cacheManager.invalidateByTag('players:list');
      await this.prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          userId: importerId,
          action: 'SCOUT_QUICK_IMPORT_PLAYERS',
          entityType: 'Player',
          entityId: null,
          changes: {
            created,
            updated,
            failed,
            total: lines.length,
          },
        },
      });
    }

    return { created, updated, failed, rows };
  }

  async recordView(playerId: string, viewerId: string, source?: string) {
    const exists = await this.prisma.players.findUnique({
      where: { id: playerId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Player not found');
    }

    const viewedAt = new Date();
    const view = await this.prisma.player_views.upsert({
      where: {
        viewerId_playerId: {
          viewerId,
          playerId,
        },
      },
      create: {
        id: randomUUID(),
        viewerId,
        playerId,
        source,
        viewedAt,
      },
      update: {
        viewedAt,
        source: source ?? undefined,
      },
    });

    return { viewedAt: view.viewedAt };
  }

  async getRecentViews(viewerId: string, limit = 12) {
    const views = await this.prisma.player_views.findMany({
      where: { viewerId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: {
        players: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            clubs: {
              select: {
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    return views.map((view) => {
      const player = view.players;
      const fullName =
        `${player?.users?.firstName ?? player?.firstName ?? ''} ${player?.users?.lastName ?? player?.lastName ?? ''}`.trim();
      return {
        id: view.playerId,
        playerId: view.playerId,
        fullName: fullName || 'Unknown Player',
        position: player?.position ?? null,
        clubName: player?.clubs?.name ?? null,
        photoUrl: player?.photoUrl ?? player?.users?.avatar ?? null,
        lastViewedAt: view.viewedAt,
      };
    });
  }

  /**
   * Update a player
   * Invalidates cache on update
   */
  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    const player = await this.prisma.players.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    const data: any = { ...updatePlayerDto };
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.contractUntil) {
      data.contractUntil = new Date(data.contractUntil);
    }

    const updated = await this.prisma.players.update({
      where: { id },
      data,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });

    // Invalidate both detail and list caches
    await this.cacheManager.invalidateByTags([`players:detail:${id}`, 'players:list']);

    return this.toFrontendPlayer(updated);
  }

  /**
   * Delete a player
   * Invalidates cache on deletion
   */
  async remove(id: string) {
    const player = await this.prisma.players.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    const deleted = await this.prisma.players.delete({ where: { id } });

    // Invalidate both detail and list caches
    await this.cacheManager.invalidateByTags([`players:detail:${id}`, 'players:list']);

    return deleted;
  }

  /**
   * Get player statistics
   */
  async getStats(id: string) {
    const player = await this.prisma.players.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    const [reportsCount, averageRating, recentReports] = await Promise.all([
      this.prisma.scouting_reports.count({
        where: { playerId: id, status: 'APPROVED' },
      }),
      this.prisma.scouting_reports.aggregate({
        where: { playerId: id, status: 'APPROVED', overallRating: { not: null } },
        _avg: { overallRating: true },
      }),
      this.prisma.scouting_reports.findMany({
        where: { playerId: id, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          overallRating: true,
          createdAt: true,
          matches: {
            select: {
              competitionId: true,
              scheduledAt: true,
              clubs_matches_homeClubIdToclubs: { select: { name: true } },
              clubs_matches_awayClubIdToclubs: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return {
      playerId: id,
      stats: player.statsJson,
      reportsCount,
      averageRating: averageRating._avg.overallRating,
      recentReports,
    };
  }

  /**
   * Get player scouting reports
   */
  async getReports(id: string) {
    const player = await this.prisma.players.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return this.prisma.scouting_reports.findMany({
      where: { playerId: id },
      include: {
        matches: {
          include: {
            clubs_matches_homeClubIdToclubs: true,
            clubs_matches_awayClubIdToclubs: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
