import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import {
  ProfileContentStatus,
  RecommendationType,
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { CacheManagerService } from '../../common/interceptors/cache.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { isCategoryARole } from '../../common/roles/role.constants';
import {
  BulkUpsertPlayerProfileDto,
  CreateAchievementEntryDto,
  CreateCareerEntryDto,
  CreateNationalTeamEntryDto,
  CreateNewsEntryDto,
  CreatePerformanceRowDto,
  CreateRumourEntryDto,
  CreateTransferEventDto,
  UpdateAchievementEntryDto,
  UpdateCareerEntryDto,
  UpdateNationalTeamEntryDto,
  UpdateNewsEntryDto,
  UpdatePerformanceRowDto,
  UpdatePlayerProfileMetaDto,
  UpdateRumourEntryDto,
  UpdateTransferEventDto,
} from './dto';

type ProfileSectionKey =
  | 'performance-rows'
  | 'transfers'
  | 'career'
  | 'achievements'
  | 'national-team'
  | 'news'
  | 'rumours';

type ProfileSectionModel =
  | 'player_profile_performance_rows'
  | 'player_transfer_events'
  | 'player_career_entries'
  | 'player_achievements_entries'
  | 'player_national_team_entries'
  | 'player_news_entries'
  | 'player_rumour_entries';

const SECTION_MODEL_MAP: Record<ProfileSectionKey, ProfileSectionModel> = {
  'performance-rows': 'player_profile_performance_rows',
  transfers: 'player_transfer_events',
  career: 'player_career_entries',
  achievements: 'player_achievements_entries',
  'national-team': 'player_national_team_entries',
  news: 'player_news_entries',
  rumours: 'player_rumour_entries',
};

@Injectable()
export class PlayerProfileService {
  private readonly logger = new Logger(PlayerProfileService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheManager: CacheManagerService,
    private readonly configService: ConfigService,
  ) {}

  private isAdmin(role?: string): boolean {
    return role ? isCategoryARole(role as UserRole) : false;
  }

  private assertIncludeUnpublishedPermission(role?: string, includeUnpublished?: boolean) {
    if (includeUnpublished && !this.isAdmin(role)) {
      throw new ForbiddenException('includeUnpublished is only allowed for admin roles');
    }
  }

  private cacheTag(playerId: string): string {
    return `player-profile:${playerId}`;
  }

  private cacheKey(playerId: string, includeUnpublished: boolean): string {
    return `player-profile:view:${playerId}:${includeUnpublished ? 'all' : 'published'}`;
  }

  private toDate(value?: string | Date | null): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
  }

  private computeAge(value?: Date | string | null): number | null {
    if (!value) return null;
    const dob = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dob.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  private splitInsights(raw?: string | null): string[] {
    if (!raw) return [];
    return raw
      .split(/[,;\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private topItems(values: Array<string | null | undefined>, limit = 5): string[] {
    const counts = new Map<string, number>();
    for (const value of values) {
      const normalized = value?.trim();
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  private dominantRecommendation(
    recommendations: Array<RecommendationType | null | undefined>,
  ): RecommendationType | null {
    const counts = new Map<RecommendationType, number>();
    for (const recommendation of recommendations) {
      if (!recommendation) continue;
      counts.set(recommendation, (counts.get(recommendation) ?? 0) + 1);
    }

    if (counts.size === 0) return null;

    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  private contentFilter(includeUnpublished: boolean): { contentStatus?: ProfileContentStatus } {
    if (includeUnpublished) {
      return {};
    }

    return { contentStatus: ProfileContentStatus.PUBLISHED };
  }

  private async ensurePlayerExists(playerId: string) {
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: {
          select: {
            id: true,
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
            country: true,
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException(`Player ${playerId} not found`);
    }

    return player;
  }

  private buildScoutingSummary(reports: any[]) {
    if (!reports.length) {
      return {
        averageRating: null,
        totalReports: 0,
        recommendation: null,
        strengthsTop: [],
        weaknessesTop: [],
        lastReportAt: null,
        ratingBreakdown: {
          technical: null,
          tactical: null,
          physical: null,
          mental: null,
        },
      };
    }

    const avg = (values: Array<number | null | undefined>): number | null => {
      const filtered = values.filter((value): value is number => typeof value === 'number');
      if (!filtered.length) return null;
      return Number((filtered.reduce((sum, value) => sum + value, 0) / filtered.length).toFixed(2));
    };

    const strengths = reports.flatMap((report) => this.splitInsights(report.strengths));
    const weaknesses = reports.flatMap((report) => this.splitInsights(report.weaknesses));

    return {
      averageRating: avg(reports.map((report) => report.overallRating)),
      totalReports: reports.length,
      recommendation: this.dominantRecommendation(reports.map((report) => report.recommendation)),
      strengthsTop: this.topItems(strengths, 5),
      weaknessesTop: this.topItems(weaknesses, 5),
      lastReportAt: reports[0]?.createdAt ?? null,
      ratingBreakdown: {
        technical: avg(reports.map((report) => report.technicalRating)),
        tactical: avg(reports.map((report) => report.tacticalRating)),
        physical: avg(reports.map((report) => report.physicalRating)),
        mental: avg(reports.map((report) => report.mentalRating)),
      },
    };
  }

  private buildHardwareSummary(sessions: any[]) {
    if (!sessions.length) {
      return {
        totalSessions: 0,
        totalDistanceKm: null,
        sprintDistanceKm: null,
        maxSpeedKmh: null,
        averageLoad: null,
        lastSyncedAt: null,
        deviceCount: 0,
        recentSessions: [],
      };
    }

    const sum = (values: Array<number | null | undefined>) =>
      values.reduce((acc, value) => acc + (typeof value === 'number' ? value : 0), 0);

    const avg = (values: Array<number | null | undefined>) => {
      const normalized = values.filter((value): value is number => typeof value === 'number');
      if (!normalized.length) return null;
      return Number((normalized.reduce((acc, value) => acc + value, 0) / normalized.length).toFixed(2));
    };

    const totalDistanceKm = sum(sessions.map((session) => session.movementDistanceM)) / 1000;
    const sprintDistanceKm = sum(sessions.map((session) => session.sprintDistanceM)) / 1000;
    const maxSpeed = Math.max(...sessions.map((session) => session.maxSpeedKmh ?? 0));
    const deviceCount = new Set(sessions.map((session) => session.deviceId).filter(Boolean)).size;

    const loadScores = sessions.map((session) => {
      const normalizedMetrics = session.normalizedMetrics as Record<string, unknown> | null;
      const value = normalizedMetrics?.loadScore;
      return typeof value === 'number' ? value : null;
    });

    return {
      totalSessions: sessions.length,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      sprintDistanceKm: Number(sprintDistanceKm.toFixed(2)),
      maxSpeedKmh: maxSpeed > 0 ? Number(maxSpeed.toFixed(2)) : null,
      averageLoad: avg(loadScores),
      lastSyncedAt: sessions[0]?.startedAt ?? null,
      deviceCount,
      recentSessions: sessions.slice(0, 8).map((session) => ({
        id: session.id,
        source: session.source,
        type: session.type,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        movementDistanceM: session.movementDistanceM,
        sprintDistanceM: session.sprintDistanceM,
        maxSpeedKmh: session.maxSpeedKmh,
      })),
    };
  }

  private buildMarketSnapshot(player: any, meta: any, latestValuation: any, highestValuation: any) {
    const currentValue =
      player.marketValue ?? latestValuation?.estimatedValue ?? highestValuation?.estimatedValue ?? null;

    const highestCandidates = [
      typeof player.marketValue === 'number' ? player.marketValue : null,
      typeof highestValuation?.estimatedValue === 'number' ? highestValuation.estimatedValue : null,
    ].filter((value): value is number => value != null);

    const highestValue = highestCandidates.length ? Math.max(...highestCandidates) : null;

    return {
      currentValue,
      highestValue,
      contractUntil: player.contractUntil,
      preferredFoot: player.preferredFoot,
      externalMarketUrl: meta?.externalMarketUrl ?? null,
      latestValuationAt: latestValuation?.createdAt ?? null,
      valuationModelVersion: latestValuation?.modelVersion ?? null,
    };
  }

  private toSourceMeta(item: any) {
    return {
      sourceName: item.sourceName,
      sourceUrl: item.sourceUrl,
      sourceDate: item.sourceDate,
      status: item.contentStatus,
      verifiedAt: item.verifiedAt,
      publishedAt: item.publishedAt,
    };
  }

  private normalizeStatsFallback(statsJson: any): Record<string, number> {
    if (!statsJson || typeof statsJson !== 'object') {
      return {};
    }

    const entries: Array<[string, unknown]> = [
      ['goals', statsJson.goals],
      ['assists', statsJson.assists],
      ['minutes', statsJson.minutes ?? statsJson.minutesPlayed],
      ['matches', statsJson.matches ?? statsJson.matchesPlayed],
      ['xg', statsJson.xg],
      ['xa', statsJson.xa],
      ['shots', statsJson.shots],
      ['keyPasses', statsJson.keyPasses],
      ['successfulDribbles', statsJson.successfulDribbles],
      ['tackles', statsJson.tackles],
      ['interceptions', statsJson.interceptions],
    ];

    const output: Record<string, number> = {};
    for (const [key, value] of entries) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        output[key] = value;
      }
    }

    return output;
  }

  private async buildPlayerProfileView(playerId: string, includeUnpublished: boolean) {
    const contentWhere = this.contentFilter(includeUnpublished);
    const player = await this.ensurePlayerExists(playerId);

    const [
      meta,
      performanceRows,
      transfers,
      career,
      achievements,
      nationalTeam,
      news,
      rumours,
      latestValuation,
      highestValuation,
      scoutingReports,
      hardwareSessions,
    ] = await Promise.all([
      this.prisma.player_profile_meta.findUnique({ where: { playerId } }),
      this.prisma.player_profile_performance_rows.findMany({
        where: { playerId, ...contentWhere },
        orderBy: [{ season: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.player_transfer_events.findMany({
        where: { playerId, ...contentWhere },
        orderBy: [{ transferDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.player_career_entries.findMany({
        where: { playerId, ...contentWhere },
        orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
      }),
      this.prisma.player_achievements_entries.findMany({
        where: { playerId, ...contentWhere },
        orderBy: [{ season: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.player_national_team_entries.findMany({
        where: { playerId, ...contentWhere },
        orderBy: [{ fromDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.player_news_entries.findMany({
        where: { playerId, ...contentWhere },
        orderBy: [{ publishedAtSource: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.player_rumour_entries.findMany({
        where: { playerId, ...contentWhere },
        orderBy: [{ sourceDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.player_valuations.findFirst({ where: { playerId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.player_valuations.findFirst({ where: { playerId }, orderBy: { estimatedValue: 'desc' } }),
      this.prisma.scouting_reports.findMany({
        where: { playerId, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        select: {
          overallRating: true,
          technicalRating: true,
          tacticalRating: true,
          physicalRating: true,
          mentalRating: true,
          recommendation: true,
          strengths: true,
          weaknesses: true,
          createdAt: true,
        },
      }),
      this.prisma.hardwareSession.findMany({
        where: { playerId },
        orderBy: { startedAt: 'desc' },
        take: 30,
      }),
    ]);

    const firstName = player.users?.firstName ?? player.firstName ?? null;
    const lastName = player.users?.lastName ?? player.lastName ?? null;
    const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Unknown Player';

    const market = this.buildMarketSnapshot(player, meta, latestValuation, highestValuation);
    const scouting = this.buildScoutingSummary(scoutingReports);
    const hardware = this.buildHardwareSummary(hardwareSessions);
    const statsFallback = this.normalizeStatsFallback(player.statsJson);

    const mappedPerformance = performanceRows.map((item) => ({
      id: item.id,
      season: item.season,
      competitionName: item.competitionName,
      competitionLogoUrl: item.competitionLogoUrl,
      possibleGames: item.possibleGames,
      appearances: item.appearances,
      goals: item.goals,
      assists: item.assists,
      yellowCards: item.yellowCards,
      secondYellowCards: item.secondYellowCards,
      redCards: item.redCards,
      startingXIPercent: item.startingXIPercent,
      minutesPercent: item.minutesPercent,
      goalParticipationPercent: item.goalParticipationPercent,
      sourceMeta: this.toSourceMeta(item),
      updatedAt: item.updatedAt,
    }));

    const mappedTransfers = transfers.map((item) => ({
      id: item.id,
      season: item.season,
      transferDate: item.transferDate,
      fromClubName: item.fromClubName,
      toClubName: item.toClubName,
      marketValueAtTime: item.marketValueAtTime,
      feeAmount: item.feeAmount,
      feeCurrency: item.feeCurrency,
      transferType: item.transferType,
      notes: item.notes,
      sourceMeta: this.toSourceMeta(item),
      updatedAt: item.updatedAt,
    }));

    const mappedCareer = career.map((item) => ({
      id: item.id,
      startDate: item.startDate,
      endDate: item.endDate,
      clubName: item.clubName,
      teamLevel: item.teamLevel,
      isLoan: item.isLoan,
      sourceMeta: this.toSourceMeta(item),
      updatedAt: item.updatedAt,
    }));

    const mappedAchievements = achievements.map((item) => ({
      id: item.id,
      title: item.title,
      competition: item.competition,
      season: item.season,
      count: item.count,
      description: item.description,
      sourceMeta: this.toSourceMeta(item),
      updatedAt: item.updatedAt,
    }));

    const mappedNationalTeam = nationalTeam.map((item) => ({
      id: item.id,
      country: item.country,
      teamLevel: item.teamLevel,
      caps: item.caps,
      goals: item.goals,
      fromDate: item.fromDate,
      toDate: item.toDate,
      isCurrent: item.isCurrent,
      sourceMeta: this.toSourceMeta(item),
      updatedAt: item.updatedAt,
    }));

    const mappedNews = news.map((item) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      publishedAtSource: item.publishedAtSource,
      sourceMeta: this.toSourceMeta(item),
      updatedAt: item.updatedAt,
    }));

    const mappedRumours = rumours.map((item) => ({
      id: item.id,
      headline: item.headline,
      summary: item.summary,
      destinationClub: item.destinationClub,
      probabilityPercent: item.probabilityPercent,
      sourceMeta: this.toSourceMeta(item),
      updatedAt: item.updatedAt,
    }));

    const updatedCandidates = [
      player.updatedAt,
      meta?.updatedAt,
      mappedPerformance[0]?.updatedAt,
      mappedTransfers[0]?.updatedAt,
      mappedCareer[0]?.updatedAt,
      mappedAchievements[0]?.updatedAt,
      mappedNationalTeam[0]?.updatedAt,
      mappedNews[0]?.updatedAt,
      mappedRumours[0]?.updatedAt,
    ].filter((value): value is Date => value instanceof Date);

    return {
      playerId,
      identity: {
        firstName,
        lastName,
        fullName,
        age: this.computeAge(player.dateOfBirth),
        nationality: player.nationality,
        club: player.clubs
          ? {
              id: player.clubs.id,
              name: player.clubs.name,
              logo: player.clubs.logo,
              country: player.clubs.country,
            }
          : null,
        positions: {
          main: meta?.mainPosition ?? player.position,
          other: Array.isArray(meta?.otherPositions)
            ? meta.otherPositions.filter((value: unknown): value is string => typeof value === 'string')
            : [],
        },
        physical: {
          height: player.height,
          weight: player.weight,
          preferredFoot: player.preferredFoot,
        },
        profile: {
          avatar: player.photoUrl ?? player.users?.avatar ?? null,
          pronunciation: meta?.pronunciation ?? null,
          agentName: meta?.agentName ?? null,
          outfitter: meta?.outfitter ?? null,
          socialLinks: meta?.socialLinks ?? null,
        },
      },
      market,
      performance: {
        competitionRows: mappedPerformance,
        statsFallback,
      },
      scouting,
      hardware,
      transfers: mappedTransfers,
      career: mappedCareer,
      achievements: mappedAchievements,
      nationalTeam: mappedNationalTeam,
      news: mappedNews,
      rumours: mappedRumours,
      emptyStateFlags: {
        performance: mappedPerformance.length === 0 && Object.keys(statsFallback).length === 0,
        transfers: mappedTransfers.length === 0,
        career: mappedCareer.length === 0,
        achievements: mappedAchievements.length === 0,
        nationalTeam: mappedNationalTeam.length === 0,
        news: mappedNews.length === 0,
        rumours: mappedRumours.length === 0,
        scouting: scouting.totalReports === 0,
        hardware: hardware.totalSessions === 0,
      },
      lastUpdatedAt: updatedCandidates.length
        ? new Date(Math.max(...updatedCandidates.map((value) => value.getTime())))
        : player.updatedAt,
    };
  }

  async getPlayerProfileView(playerId: string, role?: string, includeUnpublished = false) {
    this.assertIncludeUnpublishedPermission(role, includeUnpublished);
    const resolvedIncludeUnpublished = includeUnpublished && this.isAdmin(role);
    const key = this.cacheKey(playerId, resolvedIncludeUnpublished);
    const cached = (await this.cacheManager.batchGet<any>([key])).get(key);

    if (cached) {
      return cached;
    }

    const view = await this.buildPlayerProfileView(playerId, resolvedIncludeUnpublished);
    await this.cacheManager.cacheWithTags(key, view, [this.cacheTag(playerId)], 120);
    return view;
  }

  async getAuditTrail(playerId: string) {
    await this.ensurePlayerExists(playerId);

    const [performanceRows, transfers, career, achievements, nationalTeam, news, rumours] =
      await Promise.all([
        this.prisma.player_profile_performance_rows.findMany({
          where: { playerId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            contentStatus: true,
            sourceName: true,
            sourceUrl: true,
            sourceDate: true,
            verifiedAt: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            updatedById: true,
            verifiedById: true,
          },
        }),
        this.prisma.player_transfer_events.findMany({
          where: { playerId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            contentStatus: true,
            sourceName: true,
            sourceUrl: true,
            sourceDate: true,
            verifiedAt: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            updatedById: true,
            verifiedById: true,
          },
        }),
        this.prisma.player_career_entries.findMany({
          where: { playerId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            contentStatus: true,
            sourceName: true,
            sourceUrl: true,
            sourceDate: true,
            verifiedAt: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            updatedById: true,
            verifiedById: true,
          },
        }),
        this.prisma.player_achievements_entries.findMany({
          where: { playerId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            contentStatus: true,
            sourceName: true,
            sourceUrl: true,
            sourceDate: true,
            verifiedAt: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            updatedById: true,
            verifiedById: true,
          },
        }),
        this.prisma.player_national_team_entries.findMany({
          where: { playerId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            contentStatus: true,
            sourceName: true,
            sourceUrl: true,
            sourceDate: true,
            verifiedAt: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            updatedById: true,
            verifiedById: true,
          },
        }),
        this.prisma.player_news_entries.findMany({
          where: { playerId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            contentStatus: true,
            sourceName: true,
            sourceUrl: true,
            verifiedAt: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            updatedById: true,
            verifiedById: true,
          },
        }),
        this.prisma.player_rumour_entries.findMany({
          where: { playerId },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            contentStatus: true,
            sourceName: true,
            sourceUrl: true,
            sourceDate: true,
            verifiedAt: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            createdById: true,
            updatedById: true,
            verifiedById: true,
          },
        }),
      ]);

    return {
      playerId,
      sections: {
        performanceRows,
        transfers,
        career,
        achievements,
        nationalTeam,
        news,
        rumours,
      },
    };
  }

  private normalizeSectionPayload(section: ProfileSectionKey, payload: Record<string, any>) {
    const normalized = { ...payload };

    switch (section) {
      case 'performance-rows': {
        normalized.sourceDate = this.toDate(payload.sourceDate);
        break;
      }
      case 'transfers': {
        normalized.transferDate = this.toDate(payload.transferDate);
        normalized.sourceDate = this.toDate(payload.sourceDate);
        break;
      }
      case 'career': {
        normalized.startDate = this.toDate(payload.startDate);
        normalized.endDate = this.toDate(payload.endDate);
        normalized.sourceDate = this.toDate(payload.sourceDate);
        break;
      }
      case 'achievements': {
        normalized.sourceDate = this.toDate(payload.sourceDate);
        break;
      }
      case 'national-team': {
        normalized.fromDate = this.toDate(payload.fromDate);
        normalized.toDate = this.toDate(payload.toDate);
        normalized.sourceDate = this.toDate(payload.sourceDate);
        break;
      }
      case 'news': {
        normalized.publishedAtSource = this.toDate(payload.publishedAtSource);
        break;
      }
      case 'rumours': {
        normalized.sourceDate = this.toDate(payload.sourceDate);
        break;
      }
      default:
        break;
    }

    return normalized;
  }

  private async invalidateProfileCache(playerId: string) {
    await this.cacheManager.invalidateByTag(this.cacheTag(playerId));
  }

  async upsertMeta(playerId: string, dto: UpdatePlayerProfileMetaDto, actorId: string) {
    await this.ensurePlayerExists(playerId);

    const payload: Record<string, any> = {
      mainPosition: dto.mainPosition,
      otherPositions: dto.otherPositions,
      agentName: dto.agentName,
      pronunciation: dto.pronunciation,
      outfitter: dto.outfitter,
      socialLinks: dto.socialLinks,
      externalMarketUrl: dto.externalMarketUrl,
      lastUpdatedAt: new Date(),
    };

    const result = await this.prisma.player_profile_meta.upsert({
      where: { playerId },
      create: {
        id: randomUUID(),
        playerId,
        ...payload,
      },
      update: payload,
    });

    await this.invalidateProfileCache(playerId);

    this.logger.log(`Player profile meta upserted by ${actorId} for player ${playerId}`);
    return result;
  }

  private getSectionModel(section: ProfileSectionKey): ProfileSectionModel {
    return SECTION_MODEL_MAP[section];
  }

  private validateSection(section: string): ProfileSectionKey {
    if (!(section in SECTION_MODEL_MAP)) {
      throw new BadRequestException(`Unsupported section: ${section}`);
    }

    return section as ProfileSectionKey;
  }

  private async ensureSectionRecord(
    section: ProfileSectionKey,
    playerId: string,
    itemId: string,
    select?: Record<string, boolean>,
  ) {
    const model = this.getSectionModel(section);
    const entry = await (this.prisma as any)[model].findFirst({
      where: { id: itemId, playerId },
      select,
    });

    if (!entry) {
      throw new NotFoundException(`Section item ${itemId} not found for player ${playerId}`);
    }

    return entry;
  }

  async createPerformanceRow(playerId: string, dto: CreatePerformanceRowDto, actorId: string) {
    return this.createSectionItem('performance-rows', playerId, dto, actorId);
  }

  async updatePerformanceRow(
    playerId: string,
    itemId: string,
    dto: UpdatePerformanceRowDto,
    actorId: string,
  ) {
    return this.updateSectionItem('performance-rows', playerId, itemId, dto, actorId);
  }

  async deletePerformanceRow(playerId: string, itemId: string) {
    return this.deleteSectionItem('performance-rows', playerId, itemId);
  }

  async createTransfer(playerId: string, dto: CreateTransferEventDto, actorId: string) {
    return this.createSectionItem('transfers', playerId, dto, actorId);
  }

  async updateTransfer(playerId: string, itemId: string, dto: UpdateTransferEventDto, actorId: string) {
    return this.updateSectionItem('transfers', playerId, itemId, dto, actorId);
  }

  async deleteTransfer(playerId: string, itemId: string) {
    return this.deleteSectionItem('transfers', playerId, itemId);
  }

  async createCareerEntry(playerId: string, dto: CreateCareerEntryDto, actorId: string) {
    return this.createSectionItem('career', playerId, dto, actorId);
  }

  async updateCareerEntry(playerId: string, itemId: string, dto: UpdateCareerEntryDto, actorId: string) {
    return this.updateSectionItem('career', playerId, itemId, dto, actorId);
  }

  async deleteCareerEntry(playerId: string, itemId: string) {
    return this.deleteSectionItem('career', playerId, itemId);
  }

  async createAchievement(playerId: string, dto: CreateAchievementEntryDto, actorId: string) {
    return this.createSectionItem('achievements', playerId, dto, actorId);
  }

  async updateAchievement(
    playerId: string,
    itemId: string,
    dto: UpdateAchievementEntryDto,
    actorId: string,
  ) {
    return this.updateSectionItem('achievements', playerId, itemId, dto, actorId);
  }

  async deleteAchievement(playerId: string, itemId: string) {
    return this.deleteSectionItem('achievements', playerId, itemId);
  }

  async createNationalTeamEntry(playerId: string, dto: CreateNationalTeamEntryDto, actorId: string) {
    return this.createSectionItem('national-team', playerId, dto, actorId);
  }

  async updateNationalTeamEntry(
    playerId: string,
    itemId: string,
    dto: UpdateNationalTeamEntryDto,
    actorId: string,
  ) {
    return this.updateSectionItem('national-team', playerId, itemId, dto, actorId);
  }

  async deleteNationalTeamEntry(playerId: string, itemId: string) {
    return this.deleteSectionItem('national-team', playerId, itemId);
  }

  async createNewsEntry(playerId: string, dto: CreateNewsEntryDto, actorId: string) {
    return this.createSectionItem('news', playerId, dto, actorId);
  }

  async updateNewsEntry(playerId: string, itemId: string, dto: UpdateNewsEntryDto, actorId: string) {
    return this.updateSectionItem('news', playerId, itemId, dto, actorId);
  }

  async deleteNewsEntry(playerId: string, itemId: string) {
    return this.deleteSectionItem('news', playerId, itemId);
  }

  async createRumourEntry(playerId: string, dto: CreateRumourEntryDto, actorId: string) {
    return this.createSectionItem('rumours', playerId, dto, actorId);
  }

  async updateRumourEntry(
    playerId: string,
    itemId: string,
    dto: UpdateRumourEntryDto,
    actorId: string,
  ) {
    return this.updateSectionItem('rumours', playerId, itemId, dto, actorId);
  }

  async deleteRumourEntry(playerId: string, itemId: string) {
    return this.deleteSectionItem('rumours', playerId, itemId);
  }

  private async createSectionItem(
    section: ProfileSectionKey,
    playerId: string,
    payload: Record<string, any>,
    actorId: string,
    skipInvalidate = false,
  ) {
    await this.ensurePlayerExists(playerId);

    const model = this.getSectionModel(section);
    const normalized = this.normalizeSectionPayload(section, payload);

    const data = await (this.prisma as any)[model].create({
      data: {
        id: randomUUID(),
        playerId,
        ...normalized,
        contentStatus: ProfileContentStatus.DRAFT,
        createdById: actorId,
        updatedById: actorId,
      },
    });

    if (!skipInvalidate) {
      await this.invalidateProfileCache(playerId);
    }

    return data;
  }

  private async updateSectionItem(
    section: ProfileSectionKey,
    playerId: string,
    itemId: string,
    payload: Record<string, any>,
    actorId: string,
    skipInvalidate = false,
  ) {
    const model = this.getSectionModel(section);
    await this.ensureSectionRecord(section, playerId, itemId, { id: true, contentStatus: true });

    const normalized = this.normalizeSectionPayload(section, payload);
    const data = await (this.prisma as any)[model].update({
      where: { id: itemId },
      data: {
        ...normalized,
        updatedById: actorId,
      },
    });

    if (!skipInvalidate) {
      await this.invalidateProfileCache(playerId);
    }

    return data;
  }

  private async deleteSectionItem(section: ProfileSectionKey, playerId: string, itemId: string) {
    const model = this.getSectionModel(section);
    await this.ensureSectionRecord(section, playerId, itemId, { id: true });
    await (this.prisma as any)[model].delete({ where: { id: itemId } });
    await this.invalidateProfileCache(playerId);

    return { success: true, id: itemId };
  }

  private canTransitionStatus(current: ProfileContentStatus, next: ProfileContentStatus): boolean {
    if (current === next) {
      return true;
    }

    if (current === ProfileContentStatus.DRAFT && next === ProfileContentStatus.VERIFIED) {
      return true;
    }

    if (current === ProfileContentStatus.VERIFIED) {
      return next === ProfileContentStatus.PUBLISHED || next === ProfileContentStatus.DRAFT;
    }

    if (current === ProfileContentStatus.PUBLISHED && next === ProfileContentStatus.ARCHIVED) {
      return true;
    }

    return false;
  }

  async updateSectionStatus(
    sectionInput: string,
    playerId: string,
    itemId: string,
    status: ProfileContentStatus,
    actorId: string,
  ) {
    const section = this.validateSection(sectionInput);
    const model = this.getSectionModel(section);
    const existing = await this.ensureSectionRecord(section, playerId, itemId, {
      id: true,
      contentStatus: true,
      verifiedAt: true,
      publishedAt: true,
    });

    if (!this.canTransitionStatus(existing.contentStatus, status)) {
      throw new BadRequestException(
        `Invalid status transition from ${existing.contentStatus} to ${status}`,
      );
    }

    const data: Record<string, any> = {
      contentStatus: status,
      updatedById: actorId,
    };

    if (status === ProfileContentStatus.VERIFIED) {
      data.verifiedAt = new Date();
      data.verifiedById = actorId;
    }

    if (status === ProfileContentStatus.DRAFT) {
      data.verifiedAt = null;
      data.verifiedById = null;
      data.publishedAt = null;
    }

    if (status === ProfileContentStatus.PUBLISHED) {
      data.publishedAt = new Date();
      if (!existing.verifiedAt) {
        data.verifiedAt = new Date();
        data.verifiedById = actorId;
      }
    }

    const updated = await (this.prisma as any)[model].update({
      where: { id: itemId },
      data,
    });

    await this.invalidateProfileCache(playerId);

    return updated;
  }

  async bulkUpsert(
    dto: BulkUpsertPlayerProfileDto,
    actorId: string,
    role?: string,
    internalSyncKey?: string,
  ) {
    if (!this.isAdmin(role)) {
      throw new ForbiddenException('Bulk upsert is admin only');
    }

    const expectedSyncKey = this.configService.get<string>('INTERNAL_PROFILE_SYNC_KEY');
    if (!expectedSyncKey) {
      throw new BadRequestException('INTERNAL_PROFILE_SYNC_KEY is not configured');
    }

    if (!internalSyncKey || internalSyncKey !== expectedSyncKey) {
      throw new ForbiddenException('Invalid internal sync key');
    }

    const result = {
      total: dto.players.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ playerId: string; message: string }>,
    };

    for (const entry of dto.players) {
      try {
        await this.ensurePlayerExists(entry.playerId);

        if (entry.meta) {
          await this.upsertMeta(entry.playerId, entry.meta, actorId);
        }

        const bulkCreate = async <T extends Record<string, any>>(
          section: ProfileSectionKey,
          items?: T[],
        ) => {
          if (!items?.length) return;
          for (const item of items) {
            await this.createSectionItem(section, entry.playerId, item, actorId, true);
          }
        };

        await bulkCreate('performance-rows', entry.performanceRows);
        await bulkCreate('transfers', entry.transfers);
        await bulkCreate('career', entry.career);
        await bulkCreate('achievements', entry.achievements);
        await bulkCreate('national-team', entry.nationalTeam);
        await bulkCreate('news', entry.news);
        await bulkCreate('rumours', entry.rumours);

        await this.invalidateProfileCache(entry.playerId);
        result.success += 1;
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          playerId: entry.playerId,
          message: (error as Error)?.message ?? 'Unknown bulk upsert error',
        });
      }
    }

    return result;
  }
}
