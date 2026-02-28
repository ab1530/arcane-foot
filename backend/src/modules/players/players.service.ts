import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventStatus,
  EventType,
  MatchStatus,
  ProfileContentStatus,
  ReportStatus,
} from '@prisma/client';
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
import { ResolveObservedPlayerDto } from './dto/resolve-observed-player.dto';
import { DiscoveredTreeSquadType, GetDiscoveredTreeDto } from './dto/get-discovered-tree.dto';
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
  selectedMatchId?: string | null;
  selectedMatchAvailability?: 'PLAYING' | 'BENCH' | 'INJURED' | 'ABSENT';
  trackerSteps?: number | null;
  trackerDistanceM?: number | null;
  trackerSource?: string | null;
  selectedMatchTeamScore?: number | null;
  selectedMatchOpponentScore?: number | null;
  selectedMatchRating?: number | null;
  highlightsUploaded?: number | null;
  gpsSyncConfirmed?: boolean | null;
  dailyTimeline?: Array<PlayerSpaceDailyTimelineEntry> | null;
  linkedEventId?: string | null;
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
  selectedMatchId?: string | null;
  selectedMatchAvailability?: 'PLAYING' | 'BENCH' | 'INJURED' | 'ABSENT';
  trackerSteps?: number | null;
  trackerDistanceM?: number | null;
  trackerSource?: string | null;
  selectedMatchTeamScore?: number | null;
  selectedMatchOpponentScore?: number | null;
  selectedMatchRating?: number | null;
  highlightsUploaded?: number | null;
  gpsSyncConfirmed?: boolean | null;
  dailyTimeline?: Array<PlayerSpaceDailyTimelineEntry> | null;
  linkedEventId?: string | null;
};

type SelectedMatchAvailability = 'PLAYING' | 'BENCH' | 'INJURED' | 'ABSENT';
type DailyActivityType = 'NONE' | 'TRAINING' | 'MATCH' | 'BOTH' | 'PERSONAL' | 'REST';

type PlayerSpaceDailyTimelineEntry = {
  dayKey: string;
  activityType: DailyActivityType;
  linkedMatchId?: string | null;
  braceletSynced?: boolean | null;
  gpsDistanceM?: number | null;
  matchAvailability?: string | null;
  matchStats?: string | null;
  videoUploaded?: boolean | null;
  notes?: string | null;
};

type AgeCategory = 'SENIOR' | 'U19' | 'U17' | 'U16';
type SquadType = 'PRO' | 'RESERVE';

type DiscoveredPlayerNode = {
  playerId: string;
  fullName: string;
  ageCategory: AgeCategory;
  squadType: SquadType;
  country: string;
  competition: string;
  reportCount: number;
  lastReportAt: string | null;
  weightedOverallRating: number | null;
  latestOverallRating: number | null;
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

  private normalizePhone(value?: string | null): string | undefined {
    if (!value) return undefined;
    const normalized = value.replace(/[^\d+]/g, '').trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private normalizeDisplayLabel(value?: string | null, fallback = 'Unknown'): string {
    const normalized = this.toDisplayCase(value);
    return normalized && normalized.length > 0 ? normalized : fallback;
  }

  private inferAgeCategory(player: {
    birthYear?: number | null;
    dateOfBirth?: Date | null;
  }): AgeCategory {
    const nowYear = new Date().getUTCFullYear();
    const birthYear =
      player.birthYear ?? (player.dateOfBirth ? player.dateOfBirth.getUTCFullYear() : null);
    if (!birthYear || birthYear < 1900 || birthYear > nowYear) {
      return 'SENIOR';
    }

    const age = nowYear - birthYear;
    if (age <= 16) return 'U16';
    if (age <= 17) return 'U17';
    if (age <= 19) return 'U19';
    return 'SENIOR';
  }

  private inferSquadType(clubLabel?: string | null): SquadType {
    const normalized = this.normalizeText(clubLabel);
    if (!normalized) return 'PRO';

    const reserveSignals = [
      'reserve',
      'reserve team',
      'reserves',
      'team b',
      'b team',
      ' ii ',
      ' u23 ',
      ' u21 ',
      ' u20 ',
      ' u19 ',
      ' u18 ',
      ' u17 ',
      ' u16 ',
      'academy',
      'youth',
    ];

    const marker = ` ${normalized} `;
    return reserveSignals.some((signal) => marker.includes(signal)) ? 'RESERVE' : 'PRO';
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

  private toOptionalInt(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
    let parsed: number | null = null;

    if (typeof value === 'number' && Number.isFinite(value)) {
      parsed = Math.round(value);
    } else if (typeof value === 'string' && value.trim().length > 0) {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        parsed = Math.round(numeric);
      }
    }

    if (parsed === null) {
      return null;
    }

    if (parsed < min || parsed > max) {
      return null;
    }

    return parsed;
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

  private normalizeSelectedMatchAvailability(
    value: unknown,
    fallback: SelectedMatchAvailability = 'PLAYING',
  ): SelectedMatchAvailability {
    if (value === 'PLAYING' || value === 'BENCH' || value === 'INJURED' || value === 'ABSENT') {
      return value;
    }
    return fallback;
  }

  private normalizeDailyActivityType(value: unknown): DailyActivityType {
    const normalized = this.toSafeString(value, '').toUpperCase();
    if (
      normalized === 'NONE' ||
      normalized === 'TRAINING' ||
      normalized === 'MATCH' ||
      normalized === 'BOTH' ||
      normalized === 'PERSONAL' ||
      normalized === 'REST'
    ) {
      return normalized as DailyActivityType;
    }
    return 'NONE';
  }

  private normalizeDailyTimelineEntry(
    value: unknown,
    fallbackDayKey: string,
  ): PlayerSpaceDailyTimelineEntry | null {
    if (!value || typeof value !== 'object') {
      return null;
    }
    const record = value as Record<string, unknown>;
    const dayKey = this.toSafeString(record.dayKey, fallbackDayKey) || fallbackDayKey;
    return {
      dayKey,
      activityType: this.normalizeDailyActivityType(record.activityType),
      linkedMatchId: this.toSafeString(record.linkedMatchId, '') || null,
      braceletSynced: typeof record.braceletSynced === 'boolean' ? record.braceletSynced : null,
      gpsDistanceM: this.toOptionalInt(record.gpsDistanceM, 0, 200000) ?? null,
      matchAvailability: this.toSafeString(record.matchAvailability, '') || null,
      matchStats: this.toSafeString(record.matchStats, '') || null,
      videoUploaded: typeof record.videoUploaded === 'boolean' ? record.videoUploaded : null,
      notes: this.toSafeString(record.notes, '') || null,
    };
  }

  private normalizeDailyTimeline(
    value: unknown,
    weekStartDate: string,
  ): Array<PlayerSpaceDailyTimelineEntry> | null {
    if (!Array.isArray(value)) {
      return null;
    }

    const baseDate = this.parseDate(weekStartDate) ?? new Date();
    const normalized = value
      .slice(0, 7)
      .map((entry, index) => {
        const currentDate = new Date(baseDate);
        currentDate.setDate(baseDate.getDate() + index);
        const fallbackDayKey = this.toDateOnly(currentDate);
        return this.normalizeDailyTimelineEntry(entry, fallbackDayKey);
      })
      .filter((entry): entry is PlayerSpaceDailyTimelineEntry => entry !== null);

    if (normalized.length === 0) {
      return null;
    }

    const deduped = new Map<string, PlayerSpaceDailyTimelineEntry>();
    for (const entry of normalized) {
      deduped.set(entry.dayKey, entry);
    }

    return Array.from(deduped.values()).sort((left, right) =>
      left.dayKey.localeCompare(right.dayKey),
    );
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

    const selectedMatchId = this.toSafeString(value.selectedMatchId, '') || null;
    const weekStartDate = this.toSafeString(value.weekStartDate, this.startOfWeek(new Date()));
    return {
      weekStartDate,
      submittedAt: this.toSafeString(parsedSubmittedAt, new Date().toISOString()),
      updatedBy: this.toSafeString(value.updatedBy, 'player'),
      minutesPlayed: this.toSafeNumber(value.minutesPlayed),
      goals: this.toSafeNumber(value.goals),
      assists: this.toSafeNumber(value.assists),
      matchesPlayed: this.toSafeNumber(value.matchesPlayed),
      matchesNotPlayed: this.toSafeNumber(value.matchesNotPlayed),
      isInjured: this.toSafeBoolean(value.isInjured),
      healthStatus: this.normalizeHealthStatus(value.healthStatus),
      remarks:
        this.toSafeString(value.remarks, '').length > 0 ? this.toSafeString(value.remarks) : null,
      selectedMatchId,
      selectedMatchAvailability: selectedMatchId
        ? this.normalizeSelectedMatchAvailability(
            value.selectedMatchAvailability,
            this.toSafeBoolean(value.isInjured) ? 'INJURED' : 'PLAYING',
          )
        : undefined,
      trackerSteps:
        typeof value.trackerSteps === 'number' && Number.isFinite(value.trackerSteps)
          ? Math.max(0, Math.round(value.trackerSteps))
          : null,
      trackerDistanceM:
        typeof value.trackerDistanceM === 'number' && Number.isFinite(value.trackerDistanceM)
          ? Math.max(0, Math.round(value.trackerDistanceM))
          : null,
      trackerSource: this.toSafeString(value.trackerSource, '') || null,
      selectedMatchTeamScore: selectedMatchId
        ? this.toOptionalInt(value.selectedMatchTeamScore, 0, 30)
        : null,
      selectedMatchOpponentScore: selectedMatchId
        ? this.toOptionalInt(value.selectedMatchOpponentScore, 0, 30)
        : null,
      selectedMatchRating: selectedMatchId
        ? this.toOptionalInt(value.selectedMatchRating, 0, 10)
        : null,
      highlightsUploaded: this.toOptionalInt(value.highlightsUploaded, 0, 20),
      gpsSyncConfirmed: typeof value.gpsSyncConfirmed === 'boolean' ? value.gpsSyncConfirmed : null,
      dailyTimeline: this.normalizeDailyTimeline(value.dailyTimeline, weekStartDate),
      linkedEventId: this.toSafeString(value.linkedEventId, '') || null,
    };
  }

  private getPlayerSnapshot(
    player: any,
    weeklyUpdates: PlayerSpaceStoredWeeklyUpdate[],
  ): PlayerSpacePayload['snapshot'] {
    const stats = this.toJsonRecord(player?.statsJson);
    const latestWeekly = weeklyUpdates[0] ?? null;

    const snapshot = {
      matchesPlayed: this.toSafeNumber(stats.matchesPlayed ?? latestWeekly?.matchesPlayed, 0),
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
      injuryStatus:
        this.toSafeString(
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
    } else if (latestSession || latestWeekly?.trackerSource) {
      status = 'Connecté';
    } else if (player?.lastSyncAt) {
      status = 'Inactif';
    }

    return {
      status,
      lastDeviceSync: this.toDateTime(latestSession?.endedAt ?? player?.lastSyncAt),
      syncSource: this.toSafeString(
        latestWeekly?.trackerSource ??
          (latestWeekly?.healthStatus === 'INJURY' ? 'auto' : (latestSession?.source ?? null)),
      ),
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
        typeof entry?.playerMinutesPlayed === 'number' && Number.isFinite(entry.playerMinutesPlayed)
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
    if (!Array.isArray(matches)) {
      return [];
    }

    const playerClubId = this.toSafeString(player?.clubId);

    return matches.map((match) => {
      const isPlayerClubMatch =
        !!playerClubId && (match.homeClubId === playerClubId || match.awayClubId === playerClubId);
      const isHome = isPlayerClubMatch ? match.homeClubId === playerClubId : false;
      const opponentClub = isHome
        ? match.clubs_matches_awayClubIdToclubs
        : match.clubs_matches_homeClubIdToclubs;
      const homeClubName = this.toSafeString(
        match?.clubs_matches_homeClubIdToclubs?.name,
        this.toSafeString(match?.homeClub?.name, 'Club domicile'),
      );
      const awayClubName = this.toSafeString(
        match?.clubs_matches_awayClubIdToclubs?.name,
        this.toSafeString(match?.awayClub?.name, 'Club extérieur'),
      );

      return {
        id: match.id,
        scheduledAt: this.toDateTime(match.scheduledAt) || '',
        opponent: isPlayerClubMatch
          ? this.toSafeString(opponentClub?.name, '—')
          : `${homeClubName} vs ${awayClubName}`,
        opponentLogo: isPlayerClubMatch ? (opponentClub?.logo ?? null) : null,
        isHome,
        status: this.toSafeString(match.status, ''),
        competition: this.toSafeString(
          match?.competitions?.name ?? match?.competition?.name ?? null,
          '—',
        ),
      };
    });
  }

  private async getMatchesForPlayerSpace(player: any): Promise<any[]> {
    const include = {
      clubs_matches_homeClubIdToclubs: {
        select: { id: true, name: true, logo: true },
      },
      clubs_matches_awayClubIdToclubs: {
        select: { id: true, name: true, logo: true },
      },
      competitions: {
        select: { name: true },
      },
    } as const;

    const getUpcoming = (scope: Record<string, any> = {}) =>
      this.prisma.matches.findMany({
        where: {
          ...scope,
          scheduledAt: { gte: new Date() },
          status: {
            in: [MatchStatus.SCHEDULED, MatchStatus.LIVE],
          },
        },
        include,
        orderBy: { scheduledAt: 'asc' },
        take: 10,
      });

    const getRecent = (scope: Record<string, any> = {}) =>
      this.prisma.matches.findMany({
        where: {
          ...scope,
          status: {
            in: [MatchStatus.SCHEDULED, MatchStatus.LIVE, MatchStatus.COMPLETED],
          },
        },
        include,
        orderBy: { scheduledAt: 'desc' },
        take: 10,
      });

    const clubScope = player?.clubId
      ? { OR: [{ homeClubId: player.clubId }, { awayClubId: player.clubId }] }
      : null;

    // Priority order:
    // 1) Player club upcoming matches
    // 2) Global upcoming matches (if club has no fixtures in DB)
    // 3) Player club recent matches
    // 4) Global recent matches
    if (clubScope) {
      const clubUpcoming = await getUpcoming(clubScope);
      if (clubUpcoming.length > 0) {
        return clubUpcoming;
      }

      const globalUpcoming = await getUpcoming();
      if (globalUpcoming.length > 0) {
        return globalUpcoming;
      }

      const clubRecent = await getRecent(clubScope);
      if (clubRecent.length > 0) {
        return clubRecent;
      }
    } else {
      const globalUpcoming = await getUpcoming();
      if (globalUpcoming.length > 0) {
        return globalUpcoming;
      }
    }

    return getRecent();
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

    const selectedMatchId = this.toSafeString(dto.selectedMatchId, '') || null;
    const selectedMatchTeamScore = selectedMatchId
      ? this.toOptionalInt(dto.selectedMatchTeamScore, 0, 30)
      : null;
    const selectedMatchOpponentScore = selectedMatchId
      ? this.toOptionalInt(dto.selectedMatchOpponentScore, 0, 30)
      : null;
    const selectedMatchRating = selectedMatchId
      ? this.toOptionalInt(dto.selectedMatchRating, 0, 10)
      : null;
    const highlightsUploaded =
      this.toOptionalInt(dto.highlightsUploaded, 0, 20) ?? latestUpdate?.highlightsUploaded ?? null;
    const gpsSyncConfirmed =
      typeof dto.gpsSyncConfirmed === 'boolean'
        ? dto.gpsSyncConfirmed
        : typeof latestUpdate?.gpsSyncConfirmed === 'boolean'
          ? latestUpdate.gpsSyncConfirmed
          : this.toOptionalInt(dto.trackerSteps, 0, 500000) !== null ||
              this.toOptionalInt(dto.trackerDistanceM, 0, 2000000) !== null
            ? true
            : null;
    const dailyTimeline =
      this.normalizeDailyTimeline(dto.dailyTimeline, weekStartDate) ??
      latestUpdate?.dailyTimeline ??
      null;

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
      selectedMatchId,
      selectedMatchAvailability: selectedMatchId
        ? this.normalizeSelectedMatchAvailability(
            dto.selectedMatchAvailability,
            dto.isInjured ? 'INJURED' : 'PLAYING',
          )
        : undefined,
      trackerSteps:
        typeof dto.trackerSteps === 'number' && Number.isFinite(dto.trackerSteps)
          ? Math.max(0, Math.round(dto.trackerSteps))
          : null,
      trackerDistanceM:
        typeof dto.trackerDistanceM === 'number' && Number.isFinite(dto.trackerDistanceM)
          ? Math.max(0, Math.round(dto.trackerDistanceM))
          : null,
      trackerSource: this.toSafeString(dto.trackerSource, '') || null,
      selectedMatchTeamScore,
      selectedMatchOpponentScore,
      selectedMatchRating,
      highlightsUploaded,
      gpsSyncConfirmed,
      dailyTimeline,
      linkedEventId: latestUpdate?.linkedEventId ?? null,
    };
  }

  private getMatchAvailabilityLabel(value: SelectedMatchAvailability): string {
    switch (value) {
      case 'PLAYING':
        return 'Titulaire';
      case 'BENCH':
        return 'Banc';
      case 'INJURED':
        return 'Blessé';
      case 'ABSENT':
        return 'Absent';
      default:
        return 'Indéfini';
    }
  }

  private async resolveSelectableMatchForPlayer(player: any, matchId: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        clubs_matches_homeClubIdToclubs: {
          select: { id: true, name: true },
        },
        clubs_matches_awayClubIdToclubs: {
          select: { id: true, name: true },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    if (player?.clubId) {
      const belongsToPlayerClub =
        match.homeClubId === player.clubId || match.awayClubId === player.clubId;
      if (!belongsToPlayerClub) {
        const playerClubFixturesCount = await this.prisma.matches.count({
          where: {
            OR: [{ homeClubId: player.clubId }, { awayClubId: player.clubId }],
            status: {
              in: [MatchStatus.SCHEDULED, MatchStatus.LIVE, MatchStatus.COMPLETED],
            },
          },
        });

        if (playerClubFixturesCount > 0) {
          throw new BadRequestException(
            'Le match sélectionné ne correspond pas au club du joueur connecté',
          );
        }
      }
    }

    return match;
  }

  private async upsertPlayerAvailabilityEvent(params: {
    player: any;
    userId: string;
    weekStartDate: string;
    match: any;
    availability: SelectedMatchAvailability;
    remarks?: string | null;
    teamScore?: number | null;
    opponentScore?: number | null;
    matchRating?: number | null;
    highlightsUploaded?: number | null;
    existingEventId?: string | null;
    trackerSource?: string | null;
  }): Promise<string | null> {
    const {
      player,
      userId,
      weekStartDate,
      match,
      availability,
      remarks,
      teamScore,
      opponentScore,
      matchRating,
      highlightsUploaded,
      existingEventId,
      trackerSource,
    } = params;

    if (!player?.userId) {
      return null;
    }

    const playerName =
      `${this.toSafeString(
        player?.users?.firstName,
        this.toSafeString(player?.firstName),
      )} ${this.toSafeString(player?.users?.lastName, this.toSafeString(player?.lastName))}`.trim() ||
      'Joueur';
    const availabilityLabel = this.getMatchAvailabilityLabel(availability);
    const homeName = this.toSafeString(match?.clubs_matches_homeClubIdToclubs?.name, 'Club A');
    const awayName = this.toSafeString(match?.clubs_matches_awayClubIdToclubs?.name, 'Club B');
    const eventStatus =
      availability === 'INJURED' || availability === 'ABSENT'
        ? EventStatus.CANCELLED
        : EventStatus.CONFIRMED;
    const startDate = this.parseDate(match?.scheduledAt) ?? new Date();
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const venueLabel =
      this.toSafeString(match?.venueOld, '') ||
      this.toSafeString(match?.stadium, '') ||
      `${homeName} vs ${awayName}`;
    const descriptionParts = [
      `Semaine du ${weekStartDate}`,
      `Disponibilité déclarée: ${availabilityLabel}`,
      typeof teamScore === 'number' && typeof opponentScore === 'number'
        ? `Score déclaré: ${teamScore}-${opponentScore}`
        : null,
      typeof matchRating === 'number' ? `Note joueur: ${matchRating}/10` : null,
      typeof highlightsUploaded === 'number' ? `Highlights ajoutés: ${highlightsUploaded}` : null,
      trackerSource ? `Source tracker: ${trackerSource}` : null,
      remarks ? `Note joueur: ${remarks}` : null,
    ].filter(Boolean);
    const baseData = {
      title: `${playerName} - ${availabilityLabel}`,
      description: descriptionParts.join(' • '),
      type: EventType.MATCH,
      status: eventStatus,
      startDate,
      endDate,
      location: venueLabel,
      matchId: match.id,
      updatedAt: new Date(),
    };

    if (existingEventId) {
      const existing = await this.prisma.events.findUnique({
        where: { id: existingEventId },
        select: { id: true, createdById: true },
      });

      if (existing && existing.createdById === userId) {
        await this.prisma.events.update({
          where: { id: existingEventId },
          data: baseData,
        });
        return existingEventId;
      }
    }

    const created = await this.prisma.events.create({
      data: {
        id: randomUUID(),
        ...baseData,
        createdById: userId,
        event_assignments: {
          create: [
            {
              id: randomUUID(),
              userId: player.userId,
            },
          ],
        },
      },
      select: { id: true },
    });

    return created.id;
  }

  private async cancelPlayerAvailabilityEvent(eventId: string | null | undefined, userId: string) {
    if (!eventId) {
      return;
    }

    const existing = await this.prisma.events.findUnique({
      where: { id: eventId },
      select: { id: true, createdById: true, status: true },
    });

    if (!existing || existing.createdById !== userId || existing.status === EventStatus.CANCELLED) {
      return;
    }

    await this.prisma.events.update({
      where: { id: eventId },
      data: {
        status: EventStatus.CANCELLED,
        updatedAt: new Date(),
      },
    });
  }

  async getMyPlayerSpace(
    userId: string,
    playerIdHint?: string | null,
  ): Promise<PlayerSpacePayload> {
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
      this.getMatchesForPlayerSpace(player),
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

    const fullName =
      `${this.toSafeString(player?.users?.firstName, player.firstName)} ${this.toSafeString(
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
    const latestExisting =
      existingWeekly
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
    if (incoming.selectedMatchAvailability === 'INJURED') {
      incoming.isInjured = true;
      incoming.healthStatus = 'INJURY';
    }
    const previousForSameWeek =
      existingWeekly
        .filter((entry): entry is PlayerSpaceStoredWeeklyUpdate => entry !== null)
        .find((entry) => entry.weekStartDate === incoming.weekStartDate) ?? null;
    let linkedEventId = previousForSameWeek?.linkedEventId ?? incoming.linkedEventId ?? null;

    if (incoming.selectedMatchId) {
      const selectedMatch = await this.resolveSelectableMatchForPlayer(
        player,
        incoming.selectedMatchId,
      );
      linkedEventId = await this.upsertPlayerAvailabilityEvent({
        player,
        userId,
        weekStartDate: incoming.weekStartDate,
        match: selectedMatch,
        availability: incoming.selectedMatchAvailability ?? 'PLAYING',
        remarks: incoming.remarks,
        teamScore: incoming.selectedMatchTeamScore,
        opponentScore: incoming.selectedMatchOpponentScore,
        matchRating: incoming.selectedMatchRating,
        highlightsUploaded: incoming.highlightsUploaded,
        existingEventId: linkedEventId,
        trackerSource: incoming.trackerSource,
      });
    } else if (linkedEventId) {
      await this.cancelPlayerAvailabilityEvent(linkedEventId, userId);
      linkedEventId = null;
    }
    incoming.linkedEventId = linkedEventId;
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
          selectedMatchId: incoming.selectedMatchId,
          selectedMatchAvailability: incoming.selectedMatchAvailability,
          selectedMatchTeamScore: incoming.selectedMatchTeamScore,
          selectedMatchOpponentScore: incoming.selectedMatchOpponentScore,
          selectedMatchRating: incoming.selectedMatchRating,
          highlightsUploaded: incoming.highlightsUploaded,
          gpsSyncConfirmed: incoming.gpsSyncConfirmed,
          dailyTimeline: incoming.dailyTimeline,
          trackerSteps: incoming.trackerSteps,
          trackerDistanceM: incoming.trackerDistanceM,
          trackerSource: incoming.trackerSource,
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

  async getDiscoveredTree(scoutId: string, query: GetDiscoveredTreeDto) {
    const squadTypeFilter = query?.squadType ?? DiscoveredTreeSquadType.ALL;
    const reportStatuses = ['SUBMITTED', 'REVIEWED', 'APPROVED'] as const;

    const reports = await this.prisma.scouting_reports.findMany({
      where: {
        scoutId,
        status: {
          in: [...reportStatuses],
        },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        playerId: true,
        createdAt: true,
        overallRating: true,
        notesJson: true,
        observedClubName: true,
        matches: {
          select: {
            competitionOld: true,
            competitions: {
              select: {
                name: true,
                country: true,
              },
            },
            clubs_matches_homeClubIdToclubs: {
              select: {
                name: true,
                country: true,
              },
            },
            clubs_matches_awayClubIdToclubs: {
              select: {
                name: true,
                country: true,
              },
            },
          },
        },
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            birthYear: true,
            dateOfBirth: true,
            nationality: true,
            observedClubName: true,
            clubs: {
              select: {
                name: true,
              },
            },
            users: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    const treeAccumulator = new Map<
      string,
      {
        country: string;
        competitions: Map<
          string,
          {
            competition: string;
            ageCategories: Map<
              AgeCategory,
              {
                ageCategory: AgeCategory;
                players: Map<
                  string,
                  DiscoveredPlayerNode & {
                    weightedRatingSum: number;
                    weightedRatingCount: number;
                  }
                >;
              }
            >;
          }
        >;
      }
    >();

    for (const report of reports) {
      const player = report.players;
      if (!player) continue;

      const ageCategory = this.inferAgeCategory(player);
      const squadType = this.inferSquadType(
        report.observedClubName ?? player.observedClubName ?? player.clubs?.name,
      );
      if (squadTypeFilter !== DiscoveredTreeSquadType.ALL && squadType !== squadTypeFilter) {
        continue;
      }

      const notesAnalysis =
        report.notesJson &&
        typeof report.notesJson === 'object' &&
        !Array.isArray(report.notesJson) &&
        (report.notesJson as any).analysis &&
        typeof (report.notesJson as any).analysis === 'object'
          ? ((report.notesJson as any).analysis as Record<string, unknown>)
          : {};
      const weightedOverallRating =
        typeof notesAnalysis.weightedOverallRating === 'number'
          ? (notesAnalysis.weightedOverallRating as number)
          : typeof report.overallRating === 'number'
            ? report.overallRating
            : null;

      const country = this.normalizeDisplayLabel(
        report.matches?.competitions?.country ??
          report.matches?.clubs_matches_homeClubIdToclubs?.country ??
          report.matches?.clubs_matches_awayClubIdToclubs?.country ??
          player.nationality,
      );
      const competition = this.normalizeDisplayLabel(
        report.matches?.competitions?.name ?? report.matches?.competitionOld,
      );

      const playerFullName = this.normalizeDisplayLabel(
        `${player.firstName ?? player.users?.firstName ?? ''} ${player.lastName ?? player.users?.lastName ?? ''}`,
        `Player ${player.id.slice(0, 8)}`,
      );

      const countryNode = treeAccumulator.get(country) ?? {
        country,
        competitions: new Map(),
      };
      treeAccumulator.set(country, countryNode);

      const competitionNode = countryNode.competitions.get(competition) ?? {
        competition,
        ageCategories: new Map(),
      };
      countryNode.competitions.set(competition, competitionNode);

      const ageCategoryNode = competitionNode.ageCategories.get(ageCategory) ?? {
        ageCategory,
        players: new Map(),
      };
      competitionNode.ageCategories.set(ageCategory, ageCategoryNode);

      const existingPlayer = ageCategoryNode.players.get(player.id);
      if (existingPlayer) {
        existingPlayer.reportCount += 1;
        if (
          !existingPlayer.lastReportAt ||
          report.createdAt > new Date(existingPlayer.lastReportAt)
        ) {
          existingPlayer.lastReportAt = report.createdAt.toISOString();
        }
        if (weightedOverallRating !== null) {
          existingPlayer.weightedRatingSum += weightedOverallRating;
          existingPlayer.weightedRatingCount += 1;
          existingPlayer.weightedOverallRating =
            Math.round(
              (existingPlayer.weightedRatingSum / existingPlayer.weightedRatingCount) * 10,
            ) / 10;
        }
        existingPlayer.latestOverallRating =
          typeof report.overallRating === 'number'
            ? report.overallRating
            : existingPlayer.latestOverallRating;
      } else {
        ageCategoryNode.players.set(player.id, {
          playerId: player.id,
          fullName: playerFullName,
          ageCategory,
          squadType,
          country,
          competition,
          reportCount: 1,
          lastReportAt: report.createdAt.toISOString(),
          weightedOverallRating,
          latestOverallRating:
            typeof report.overallRating === 'number' ? report.overallRating : null,
          weightedRatingSum: weightedOverallRating ?? 0,
          weightedRatingCount: weightedOverallRating !== null ? 1 : 0,
        });
      }
    }

    const ageOrder: Record<AgeCategory, number> = {
      SENIOR: 0,
      U19: 1,
      U17: 2,
      U16: 3,
    };

    const data = Array.from(treeAccumulator.values())
      .map((countryNode) => {
        const competitions = Array.from(countryNode.competitions.values())
          .map((competitionNode) => {
            const ageCategories = Array.from(competitionNode.ageCategories.values())
              .map((ageNode) => {
                const players = Array.from(ageNode.players.values())
                  .map((item) => {
                    const { weightedRatingSum, weightedRatingCount, ...rest } = item;
                    return rest;
                  })
                  .sort((a, b) => {
                    const aScore = a.weightedOverallRating ?? -1;
                    const bScore = b.weightedOverallRating ?? -1;
                    if (bScore !== aScore) return bScore - aScore;
                    return a.fullName.localeCompare(b.fullName);
                  });

                return {
                  ageCategory: ageNode.ageCategory,
                  totalPlayers: players.length,
                  totalReports: players.reduce((acc, item) => acc + item.reportCount, 0),
                  players,
                };
              })
              .sort((a, b) => ageOrder[a.ageCategory] - ageOrder[b.ageCategory]);

            return {
              competition: competitionNode.competition,
              totalAgeCategories: ageCategories.length,
              totalPlayers: ageCategories.reduce((acc, item) => acc + item.totalPlayers, 0),
              totalReports: ageCategories.reduce((acc, item) => acc + item.totalReports, 0),
              ageCategories,
            };
          })
          .sort((a, b) => a.competition.localeCompare(b.competition));

        return {
          country: countryNode.country,
          totalCompetitions: competitions.length,
          totalPlayers: competitions.reduce((acc, item) => acc + item.totalPlayers, 0),
          totalReports: competitions.reduce((acc, item) => acc + item.totalReports, 0),
          competitions,
        };
      })
      .sort((a, b) => a.country.localeCompare(b.country));

    return {
      data,
      meta: {
        scoutId,
        squadType: squadTypeFilter,
        totalCountries: data.length,
        totalCompetitions: data.reduce((acc, country) => acc + country.totalCompetitions, 0),
        totalPlayers: data.reduce((acc, country) => acc + country.totalPlayers, 0),
        totalReports: data.reduce((acc, country) => acc + country.totalReports, 0),
      },
    };
  }

  async resolveObservedPlayer(dto: ResolveObservedPlayerDto, resolverId: string) {
    const observedEmail = dto.observedEmail?.trim().toLowerCase();
    const observedPhone = this.normalizePhone(dto.observedPhone);
    const observedFirstName = this.toDisplayCase(dto.observedFirstName);
    const observedLastName = this.toDisplayCase(dto.observedLastName);
    const observedClubName = this.toDisplayCase(dto.observedClubName);
    const observedNationality = this.toDisplayCase(dto.observedNationality) || 'Unknown';
    const observedBirthYear = dto.observedBirthYear;

    const hasIdentity =
      !!observedEmail || !!observedPhone || (!!observedFirstName && !!observedLastName);
    if (!hasIdentity) {
      throw new BadRequestException(
        'At least one identity source is required (email, phone, or observed full name)',
      );
    }

    if (observedEmail || observedPhone) {
      const exactCriteria = [];
      if (observedEmail) {
        exactCriteria.push({ email: observedEmail });
      }
      if (observedPhone) {
        exactCriteria.push({ phone: observedPhone });
      }

      const exactMatch = await this.prisma.players.findFirst({
        where: {
          users: {
            is: {
              OR: exactCriteria,
            },
          },
        },
        select: { id: true },
      });

      if (exactMatch) {
        return {
          playerId: exactMatch.id,
          resolutionMode: 'exact_match',
          confidence: 0.99,
        };
      }
    }

    if (observedFirstName && observedLastName && observedClubName) {
      const probableMatch = await this.prisma.players.findFirst({
        where: {
          AND: [
            {
              OR: [
                {
                  firstName: { equals: observedFirstName, mode: 'insensitive' },
                  lastName: { equals: observedLastName, mode: 'insensitive' },
                },
                {
                  users: {
                    is: {
                      firstName: { equals: observedFirstName, mode: 'insensitive' },
                      lastName: { equals: observedLastName, mode: 'insensitive' },
                    },
                  },
                },
              ],
            },
            {
              observedClubName: {
                equals: observedClubName,
                mode: 'insensitive',
              },
            },
            ...(observedBirthYear ? [{ birthYear: observedBirthYear }] : []),
          ],
        },
        select: { id: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (probableMatch) {
        return {
          playerId: probableMatch.id,
          resolutionMode: 'probable_match',
          confidence: observedBirthYear ? 0.86 : 0.78,
        };
      }
    }

    const createdPlayer = await this.prisma.players.create({
      data: {
        id: randomUUID(),
        userId: null,
        firstName: observedFirstName ?? null,
        lastName: observedLastName ?? null,
        birthYear: observedBirthYear ?? null,
        observedClubName: observedClubName ?? null,
        importSource: 'SCOUT_RESOLVE',
        position: dto.playerPosition || 'Unknown',
        preferredFoot: null,
        nationality: observedNationality,
        dateOfBirth: null,
        status: 'PROSPECT',
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    await this.cacheManager.invalidateByTag('players:list');

    await this.prisma.audit_logs
      .create({
        data: {
          id: randomUUID(),
          userId: resolverId,
          action: 'SCOUT_RESOLVE_OBSERVED_PLAYER',
          entityType: 'Player',
          entityId: createdPlayer.id,
          changes: {
            matchId: dto.matchId ?? null,
            observedFirstName: observedFirstName ?? null,
            observedLastName: observedLastName ?? null,
            observedEmail: observedEmail ?? null,
            observedPhone: observedPhone ?? null,
            observedClubName: observedClubName ?? null,
            observedBirthYear: observedBirthYear ?? null,
            resolutionMode: 'created_new',
          },
        },
      })
      .catch(() => undefined);

    return {
      playerId: createdPlayer.id,
      resolutionMode: 'created_new',
      confidence: 0.64,
    };
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
