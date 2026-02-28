import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Prisma, ReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateScoutingReportDto } from './dto/create-scouting-report.dto';
import { UpdateScoutingReportDto } from './dto/update-scouting-report.dto';
import { QueryScoutingReportDto } from './dto/query-scouting-report.dto';
import { BulkSubmitScoutingReportsDto } from './dto/bulk-submit-scouting-reports.dto';

type ViewerLike = {
  id?: string;
  sub?: string;
  userId?: string;
  role?: string;
} | null;

type ResolutionMode = 'exact_match' | 'probable_match' | 'created_new';

@Injectable()
export class ScoutingReportsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  private toViewerContext(viewer?: ViewerLike) {
    const userId = viewer?.id ?? viewer?.sub ?? viewer?.userId ?? null;
    const role = String(viewer?.role ?? '').toUpperCase();
    return { userId, role };
  }

  private isCategoryA(role: string) {
    return role === 'SUPER_ADMIN' || role === 'ADMIN';
  }

  private isSchemaDriftError(error: unknown, table?: string) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
      return false;
    }
    if (error.code !== 'P2022') {
      return false;
    }
    if (!table) {
      return true;
    }
    const missingColumn = String((error.meta as Record<string, unknown> | undefined)?.column ?? '');
    return missingColumn.toLowerCase().includes(table.toLowerCase());
  }

  private legacyReportSelect() {
    return {
      id: true,
      matchId: true,
      playerId: true,
      scoutId: true,
      status: true,
      overallRating: true,
      summary: true,
      strengths: true,
      weaknesses: true,
      notesJson: true,
      createdAt: true,
      updatedAt: true,
      submittedAt: true,
      reviewedAt: true,
      recommendation: true,
      recommendationNotes: true,
      tags: true,
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      players: {
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
            },
          },
        },
      },
      matches: {
        include: {
          clubs_matches_homeClubIdToclubs: true,
          clubs_matches_awayClubIdToclubs: true,
        },
      },
      scouting_notes: {
        orderBy: {
          minute: 'asc' as const,
        },
      },
      media: true,
    };
  }

  private reportInclude() {
    return {
      users: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
      players: {
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
            },
          },
        },
      },
      matches: {
        include: {
          clubs_matches_homeClubIdToclubs: true,
          clubs_matches_awayClubIdToclubs: true,
          match_assignments: {
            select: {
              id: true,
              scoutId: true,
              status: true,
              reportSubmitted: true,
              missionType: true,
              assignedById: true,
            },
          },
        },
      },
      scouting_notes: {
        orderBy: {
          minute: 'asc' as const,
        },
      },
      media: true,
    };
  }

  private extractMission(report: any) {
    const assignments = Array.isArray(report?.matches?.match_assignments)
      ? report.matches.match_assignments
      : [];

    const exactScoutAssignment =
      assignments.find((assignment: any) => assignment?.scoutId === report?.scoutId) ?? null;
    const assignment = exactScoutAssignment ?? assignments[0] ?? null;
    if (!assignment) {
      return null;
    }

    return {
      assignmentId: assignment.id,
      missionType: assignment.missionType,
      assignedById: assignment.assignedById,
      status: assignment.status,
      reportSubmitted: assignment.reportSubmitted,
      scoutId: assignment.scoutId,
    };
  }

  private canViewerAccessReport(report: any, viewer?: ViewerLike) {
    if (!viewer) {
      return true;
    }

    const { userId, role } = this.toViewerContext(viewer);
    if (!userId || !role) {
      return false;
    }

    if (this.isCategoryA(role)) {
      return true;
    }

    if (role === 'SCOUT') {
      return report.scoutId === userId;
    }

    if (role !== 'AGENT') {
      return false;
    }

    const mission = this.extractMission(report);
    if (!mission) {
      return false;
    }

    if (mission.missionType === 'VOLUNTARY') {
      return true;
    }

    return mission.missionType === 'PRIORITY' && mission.assignedById === userId;
  }

  private applyVisibilityPreFilter(where: any, viewer?: ViewerLike) {
    if (!viewer) {
      return where;
    }

    const { userId, role } = this.toViewerContext(viewer);
    if (!userId || !role) {
      return { ...where, id: '__no_access__' };
    }

    if (this.isCategoryA(role)) {
      return where;
    }

    if (role === 'SCOUT') {
      return { ...where, scoutId: userId };
    }

    if (role === 'AGENT') {
      return {
        ...where,
        OR: [
          ...(Array.isArray(where.OR) ? where.OR : []),
          {
            matches: {
              match_assignments: {
                some: {
                  missionType: 'VOLUNTARY',
                },
              },
            },
          },
          {
            matches: {
              match_assignments: {
                some: {
                  missionType: 'PRIORITY',
                  assignedById: userId,
                },
              },
            },
          },
        ],
      };
    }

    return { ...where, id: '__no_access__' };
  }

  private applyLegacyVisibilityPreFilter(where: any, viewer?: ViewerLike) {
    if (!viewer) {
      return where;
    }

    const { userId, role } = this.toViewerContext(viewer);
    if (!userId || !role) {
      return { ...where, id: '__no_access__' };
    }

    if (this.isCategoryA(role)) {
      return where;
    }

    if (role === 'SCOUT') {
      return { ...where, scoutId: userId };
    }

    return { ...where, id: '__no_access__' };
  }

  private async findAllLegacy(query: QueryScoutingReportDto, viewer?: ViewerLike) {
    const { page = 1, limit = 1000 } = query;
    const skip = (page - 1) * limit;
    const baseWhere = this.buildWhereFromQuery(query);
    const where = this.applyLegacyVisibilityPreFilter(baseWhere, viewer);

    const [reports, total] = await Promise.all([
      this.prisma.scouting_reports.findMany({
        where,
        skip,
        take: limit,
        select: this.legacyReportSelect(),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.scouting_reports.count({ where }),
    ]);

    return {
      data: reports.map((report) => this.transformReport(report)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        legacy: true,
      },
    };
  }

  private async findOneLegacy(id: string, viewer?: ViewerLike) {
    const report = await this.prisma.scouting_reports.findUnique({
      where: { id },
      select: this.legacyReportSelect(),
    });

    if (!report) {
      throw new NotFoundException(`Rapport avec l'ID ${id} introuvable`);
    }

    if (viewer && !this.canViewerAccessReport(report, viewer)) {
      throw new ForbiddenException("Vous n'avez pas accès à ce rapport");
    }

    return this.transformReport(report);
  }

  private transformReport(report: any) {
    return {
      ...report,
      analysis: (report?.notesJson as any)?.analysis ?? null,
      mission: this.extractMission(report),
      player: {
        ...report.players,
        user: report.players?.users,
        club: report.players?.clubs,
      },
      scout: report.users,
      match: {
        ...report.matches,
        homeClub: report.matches?.clubs_matches_homeClubIdToclubs,
        awayClub: report.matches?.clubs_matches_awayClubIdToclubs,
      },
      players: undefined,
      users: undefined,
      matches: undefined,
    };
  }

  private buildWhereFromQuery(query: QueryScoutingReportDto) {
    const { playerId, scoutId, matchId, status, recommendation } = query;
    const where: any = {};
    if (playerId) where.playerId = playerId;
    if (scoutId) where.scoutId = scoutId;
    if (matchId) where.matchId = matchId;
    if (status) where.status = status;
    if (recommendation) where.recommendation = recommendation;
    return where;
  }

  private isFilled(value?: string | null) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private normalizePhone(value?: string | null) {
    if (!value) {
      return undefined;
    }
    const normalized = value.replace(/[^\d+]/g, '').trim();
    return normalized.length > 0 ? normalized : undefined;
  }

  private computeIdentityCompletenessScore(input: any) {
    const filledCount = [
      input.observedFirstName,
      input.observedLastName,
      input.observedNationality,
      input.observedPhone,
      input.observedEmail,
    ].filter((value) => this.isFilled(value)).length;
    return Math.round((filledCount / 5) * 100);
  }

  private async resolvePlayerFromObservedIdentity(createDto: CreateScoutingReportDto) {
    if (createDto.playerId) {
      return {
        playerId: createDto.playerId,
        resolutionMode: null as ResolutionMode | null,
      };
    }

    const observedEmail = createDto.observedEmail?.trim().toLowerCase();
    const observedPhone = this.normalizePhone(createDto.observedPhone);
    const observedFirstName = createDto.observedFirstName?.trim();
    const observedLastName = createDto.observedLastName?.trim();
    const observedClubName = createDto.observedClubName?.trim();

    const hasEnoughIdentity =
      this.isFilled(observedEmail) ||
      this.isFilled(observedPhone) ||
      (this.isFilled(observedFirstName) && this.isFilled(observedLastName));

    if (!hasEnoughIdentity) {
      throw new BadRequestException(
        'playerId is required when observed identity (email/phone/full name) is missing',
      );
    }

    if (this.isFilled(observedEmail) || this.isFilled(observedPhone)) {
      const exactMatches = [];
      if (observedEmail) {
        exactMatches.push({ email: observedEmail });
      }
      if (observedPhone) {
        exactMatches.push({ phone: observedPhone });
      }

      const exact = await this.prisma.players.findFirst({
        where: {
          users: {
            is: {
              OR: exactMatches,
            },
          },
        },
        select: { id: true },
      });

      if (exact) {
        return {
          playerId: exact.id,
          resolutionMode: 'exact_match' as ResolutionMode,
        };
      }
    }

    if (
      this.isFilled(observedFirstName) &&
      this.isFilled(observedLastName) &&
      this.isFilled(observedClubName)
    ) {
      const probable = await this.prisma.players.findFirst({
        where: {
          AND: [
            {
              OR: [
                {
                  firstName: {
                    equals: observedFirstName!,
                    mode: 'insensitive',
                  },
                  lastName: {
                    equals: observedLastName!,
                    mode: 'insensitive',
                  },
                },
                {
                  users: {
                    is: {
                      firstName: {
                        equals: observedFirstName!,
                        mode: 'insensitive',
                      },
                      lastName: {
                        equals: observedLastName!,
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ],
            },
            {
              observedClubName: {
                equals: observedClubName!,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: { id: true },
        orderBy: { updatedAt: 'desc' },
      });

      if (probable) {
        return {
          playerId: probable.id,
          resolutionMode: 'probable_match' as ResolutionMode,
        };
      }
    }

    const created = await this.prisma.players.create({
      data: {
        id: randomUUID(),
        userId: null,
        firstName: observedFirstName || null,
        lastName: observedLastName || null,
        observedClubName: observedClubName || null,
        importSource: 'SCOUT_REPORT',
        position: createDto.playerPosition || 'Unknown',
        preferredFoot: null,
        nationality: createDto.observedNationality?.trim() || 'Unknown',
        dateOfBirth: null,
        status: 'PROSPECT',
        updatedAt: new Date(),
      },
      select: { id: true },
    });

    return {
      playerId: created.id,
      resolutionMode: 'created_new' as ResolutionMode,
    };
  }

  private async applyAnalysisWeighting(params: {
    reportId: string;
    scoutId: string;
    matchId: string;
    assignmentId?: string;
    overallRating?: number | null;
    identityCompletenessScore?: number;
    resolutionMode?: ResolutionMode | null;
    voice?: {
      transcription?: string;
      confidence?: number;
      audioUrl?: string;
      warnings?: string[];
    };
  }) {
    const {
      reportId,
      scoutId,
      matchId,
      assignmentId,
      overallRating,
      identityCompletenessScore,
      resolutionMode,
      voice,
    } = params;

    const userStats = await this.prisma.user_stats.findUnique({
      where: { userId: scoutId },
      select: { currentLevel: true },
    });
    const scoutLevel = userStats?.currentLevel ?? 1;
    const scoutTier = scoutLevel >= 5 ? 'CERTIFIED' : 'AMATEUR';
    const weight = scoutTier === 'CERTIFIED' ? 1.15 : 1;
    const weightedOverallRating =
      typeof overallRating === 'number'
        ? Math.min(100, Math.round(overallRating * weight * 10) / 10)
        : null;

    let assignment: {
      id: string;
      missionType: string | null;
      assignedById: string | null;
      scoutId: string;
      matchId: string;
    } | null = null;
    try {
      assignment = assignmentId
        ? await this.prisma.match_assignments.findUnique({
            where: { id: assignmentId },
            select: {
              id: true,
              missionType: true,
              assignedById: true,
              scoutId: true,
              matchId: true,
            },
          })
        : await this.prisma.match_assignments.findFirst({
            where: {
              matchId,
              scoutId,
            },
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              missionType: true,
              assignedById: true,
              scoutId: true,
              matchId: true,
            },
          });
    } catch (error) {
      if (!this.isSchemaDriftError(error, 'match_assignments')) {
        throw error;
      }
      assignment = null;
    }

    const currentReport = await this.prisma.scouting_reports.findUnique({
      where: { id: reportId },
      select: { notesJson: true },
    });

    const notesJson =
      currentReport?.notesJson &&
      typeof currentReport.notesJson === 'object' &&
      !Array.isArray(currentReport.notesJson)
        ? { ...(currentReport.notesJson as Record<string, unknown>) }
        : {};

    const existingAnalysis =
      notesJson.analysis &&
      typeof notesJson.analysis === 'object' &&
      !Array.isArray(notesJson.analysis)
        ? { ...(notesJson.analysis as Record<string, unknown>) }
        : {};

    notesJson.analysis = {
      ...existingAnalysis,
      scoutLevel,
      scoutTier,
      weight,
      weightedOverallRating,
      computedAt: new Date().toISOString(),
      assignmentId: assignment?.id ?? null,
      missionType: assignment?.missionType ?? null,
      assignedById: assignment?.assignedById ?? null,
      identityCompletenessScore:
        typeof identityCompletenessScore === 'number'
          ? identityCompletenessScore
          : (existingAnalysis.identityCompletenessScore ?? null),
      resolutionMode:
        resolutionMode ??
        (typeof existingAnalysis.resolutionMode === 'string'
          ? existingAnalysis.resolutionMode
          : null),
      voice: voice
        ? {
            transcription: voice.transcription,
            confidence: voice.confidence,
            audioUrl: voice.audioUrl,
            warnings: voice.warnings ?? [],
          }
        : existingAnalysis.voice,
    };

    await this.prisma.scouting_reports.update({
      where: { id: reportId },
      data: {
        notesJson: notesJson as any,
        updatedAt: new Date(),
      },
    });
  }

  async create(createDto: CreateScoutingReportDto, scoutId: string) {
    if (!scoutId) {
      throw new BadRequestException('Scout ID is required');
    }

    const resolved = await this.resolvePlayerFromObservedIdentity(createDto);
    const resolvedPlayerId = resolved.playerId;
    const identityCompletenessScore = this.computeIdentityCompletenessScore(createDto);
    const initialAnalysis: Record<string, unknown> = {
      identityCompletenessScore,
    };
    if (resolved.resolutionMode) {
      initialAnalysis.resolutionMode = resolved.resolutionMode;
    }

    const [match, player, scout] = await Promise.all([
      this.prisma.matches.findUnique({
        where: { id: createDto.matchId },
      }),
      this.prisma.players.findUnique({
        where: { id: resolvedPlayerId },
      }),
      this.prisma.users.findUnique({
        where: { id: scoutId },
      }),
    ]);

    if (!match) {
      throw new NotFoundException(`Match avec l'ID ${createDto.matchId} introuvable`);
    }
    if (!player) {
      throw new NotFoundException(`Joueur avec l'ID ${resolvedPlayerId} introuvable`);
    }
    if (!scout) {
      throw new NotFoundException(`Scout avec l'ID ${scoutId} introuvable`);
    }

    const status = createDto.status ?? ReportStatus.DRAFT;

    const reportData: any = {
      id: randomUUID(),
      matches: {
        connect: { id: createDto.matchId },
      },
      players: {
        connect: { id: resolvedPlayerId },
      },
      users: {
        connect: { id: scoutId },
      },
      playerPosition: createDto.playerPosition,
      playerMinutesPlayed: createDto.playerMinutesPlayed,
      status,
      submittedAt: status === ReportStatus.SUBMITTED ? new Date() : undefined,
      overallRating: createDto.overallRating,
      summary: createDto.summary,
      strengths: createDto.strengths,
      weaknesses: createDto.weaknesses,
      technicalRating: createDto.technicalRating,
      physicalRating: createDto.physicalRating,
      mentalRating: createDto.mentalRating,
      tacticalRating: createDto.tacticalRating,
      recommendation: createDto.recommendation,
      recommendationNotes: createDto.recommendationNotes,
      withBallAnalysis: createDto.withBallAnalysis,
      offBallAnalysis: createDto.offBallAnalysis,
      gameIntelligenceAnalysis: createDto.gameIntelligenceAnalysis,
      attitudeAnalysis: createDto.attitudeAnalysis,
      staffOpinion: createDto.staffOpinion,
      observedDominantFoot: createDto.observedDominantFoot,
      observedHeightCm: createDto.observedHeightCm,
      observedWeightKg: createDto.observedWeightKg,
      observedClubName: createDto.observedClubName,
      observedFirstName: createDto.observedFirstName,
      observedLastName: createDto.observedLastName,
      observedNationality: createDto.observedNationality,
      observedPhone: createDto.observedPhone,
      observedEmail: createDto.observedEmail,
      sprint10mSec: createDto.sprint10mSec,
      sprint20mSec: createDto.sprint20mSec,
      sprint40mSec: createDto.sprint40mSec,
      vmaKmh: createDto.vmaKmh,
      tags: createDto.tags,
      similarPlayerIds: createDto.similarPlayerIds,
      notesJson: {
        analysis: initialAnalysis,
      } as any,
      updatedAt: new Date(),
    };

    const createWithoutObservedIdentity = async () => {
      const fallbackData = { ...reportData };
      delete fallbackData.observedFirstName;
      delete fallbackData.observedLastName;
      delete fallbackData.observedNationality;
      delete fallbackData.observedPhone;
      delete fallbackData.observedEmail;
      return this.prisma.scouting_reports.create({
        data: fallbackData as any,
        select: { id: true },
      });
    };

    let createdReportId: string;
    try {
      const created = await this.prisma.scouting_reports.create({
        data: reportData as any,
        select: { id: true },
      });
      createdReportId = created.id;
    } catch (error) {
      if (!this.isSchemaDriftError(error, 'scouting_reports')) {
        throw error;
      }
      const created = await createWithoutObservedIdentity();
      createdReportId = created.id;
    }

    this.gamification.trackUserAction(scoutId, 'report_created').catch((err) => {
      console.error('❌ Gamification error:', err.message);
      console.error('Stack:', err.stack);
    });

    return this.findOne(createdReportId, { id: scoutId, role: 'SCOUT' });
  }

  async bulkSubmit(payload: BulkSubmitScoutingReportsDto, scoutId: string) {
    if (!scoutId) {
      throw new BadRequestException('Scout ID is required');
    }

    const uniquePlayerIds = Array.from(new Set((payload.playerIds ?? []).filter(Boolean)));
    if (uniquePlayerIds.length === 0) {
      throw new BadRequestException('At least one playerId is required');
    }

    const [match, scout] = await Promise.all([
      this.prisma.matches.findUnique({
        where: { id: payload.matchId },
        select: { id: true },
      }),
      this.prisma.users.findUnique({
        where: { id: scoutId },
        select: { id: true, role: true },
      }),
    ]);

    if (!match) {
      throw new NotFoundException(`Match avec l'ID ${payload.matchId} introuvable`);
    }
    if (!scout) {
      throw new NotFoundException(`Scout avec l'ID ${scoutId} introuvable`);
    }
    if (String(scout.role).toUpperCase() !== 'SCOUT') {
      throw new ForbiddenException('Only scouts can bulk submit scouting reports');
    }

    const { template, voice } = payload;
    const reports: any[] = [];

    for (const playerId of uniquePlayerIds) {
      const reportDto: CreateScoutingReportDto = {
        ...(template ?? {}),
        matchId: payload.matchId,
        playerId,
        status: ReportStatus.SUBMITTED,
      };
      delete (reportDto as any).matchId;
      delete (reportDto as any).playerId;
      reportDto.matchId = payload.matchId;
      reportDto.playerId = playerId;

      const created = await this.create(reportDto, scoutId);
      const createdAnalysis = (created?.analysis ?? {}) as Record<string, unknown>;
      await this.applyAnalysisWeighting({
        reportId: created.id,
        scoutId,
        matchId: payload.matchId,
        assignmentId: payload.assignmentId,
        overallRating: created.overallRating,
        identityCompletenessScore:
          typeof createdAnalysis.identityCompletenessScore === 'number'
            ? (createdAnalysis.identityCompletenessScore as number)
            : this.computeIdentityCompletenessScore(created),
        resolutionMode:
          typeof createdAnalysis.resolutionMode === 'string'
            ? (createdAnalysis.resolutionMode as ResolutionMode)
            : null,
        voice,
      });
      const refreshed = await this.findOne(created.id);
      reports.push(refreshed);
    }

    await this.prisma.match_assignments.updateMany({
      where: {
        scoutId,
        ...(payload.assignmentId ? { id: payload.assignmentId } : { matchId: payload.matchId }),
      },
      data: {
        status: 'COMPLETED',
        reportSubmitted: true,
        updatedAt: new Date(),
      },
    });

    return {
      data: reports,
      meta: {
        matchId: payload.matchId,
        scoutId,
        created: reports.length,
      },
    };
  }

  async findAll(query: QueryScoutingReportDto, viewer?: ViewerLike) {
    const { page = 1, limit = 1000 } = query;
    const skip = (page - 1) * limit;
    const role = this.toViewerContext(viewer).role;
    const baseWhere = this.buildWhereFromQuery(query);
    const where = this.applyVisibilityPreFilter(baseWhere, viewer);

    try {
      if (role === 'AGENT') {
        const candidateReports = await this.prisma.scouting_reports.findMany({
          where,
          include: this.reportInclude(),
          orderBy: { createdAt: 'desc' },
        });

        const visible = candidateReports.filter((report) =>
          this.canViewerAccessReport(report, viewer),
        );
        const paginated = visible.slice(skip, skip + limit);
        return {
          data: paginated.map((report) => this.transformReport(report)),
          meta: {
            total: visible.length,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(visible.length / limit)),
          },
        };
      }

      const [reports, total] = await Promise.all([
        this.prisma.scouting_reports.findMany({
          where,
          skip,
          take: limit,
          include: this.reportInclude(),
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.scouting_reports.count({ where }),
      ]);

      const visibleReports = reports.filter((report) => this.canViewerAccessReport(report, viewer));
      return {
        data: visibleReports.map((report) => this.transformReport(report)),
        meta: {
          total,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      };
    } catch (error) {
      if (!this.isSchemaDriftError(error)) {
        throw error;
      }
      return this.findAllLegacy(query, viewer);
    }
  }

  async findOne(id: string, viewer?: ViewerLike) {
    try {
      const report = await this.prisma.scouting_reports.findUnique({
        where: { id },
        include: this.reportInclude(),
      });

      if (!report) {
        throw new NotFoundException(`Rapport avec l'ID ${id} introuvable`);
      }

      if (viewer && !this.canViewerAccessReport(report, viewer)) {
        throw new ForbiddenException("Vous n'avez pas accès à ce rapport");
      }

      return this.transformReport(report);
    } catch (error) {
      if (!this.isSchemaDriftError(error)) {
        throw error;
      }
      return this.findOneLegacy(id, viewer);
    }
  }

  async update(id: string, updateDto: UpdateScoutingReportDto) {
    await this.findOne(id);

    await this.prisma.scouting_reports.update({
      where: { id },
      data: updateDto,
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.scouting_reports.delete({
      where: { id },
    });
    return { message: 'Rapport supprimé avec succès' };
  }

  async submit(id: string) {
    await this.findOne(id);

    await this.prisma.scouting_reports.update({
      where: { id },
      data: {
        status: ReportStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });

    const submitted = await this.findOne(id);

    const mission = (submitted as any)?.mission ?? null;
    if (mission?.assignmentId && !String(mission.assignmentId).startsWith('legacy-')) {
      try {
        await this.prisma.match_assignments.update({
          where: { id: mission.assignmentId },
          data: {
            reportSubmitted: true,
            status: 'COMPLETED',
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        if (!this.isSchemaDriftError(error, 'match_assignments')) {
          throw error;
        }
      }
    }

    const currentAnalysis =
      submitted.notesJson &&
      typeof submitted.notesJson === 'object' &&
      !Array.isArray(submitted.notesJson) &&
      (submitted.notesJson as any).analysis &&
      typeof (submitted.notesJson as any).analysis === 'object'
        ? ((submitted.notesJson as any).analysis as Record<string, unknown>)
        : {};

    await this.applyAnalysisWeighting({
      reportId: submitted.id,
      scoutId: submitted.scoutId,
      matchId: submitted.matchId,
      assignmentId: mission?.assignmentId ?? undefined,
      overallRating: submitted.overallRating,
      identityCompletenessScore:
        typeof currentAnalysis.identityCompletenessScore === 'number'
          ? (currentAnalysis.identityCompletenessScore as number)
          : this.computeIdentityCompletenessScore(submitted),
      resolutionMode:
        typeof currentAnalysis.resolutionMode === 'string'
          ? (currentAnalysis.resolutionMode as ResolutionMode)
          : null,
    });

    const refreshed = await this.findOne(id);
    return refreshed;
  }

  async review(id: string, reviewerId: string, approved: boolean) {
    await this.findOne(id);

    await this.prisma.scouting_reports.update({
      where: { id },
      data: {
        status: approved ? ReportStatus.APPROVED : ReportStatus.REJECTED,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
    });

    return this.findOne(id);
  }

  async getPlayerReports(playerId: string, viewer?: ViewerLike) {
    return this.findAll({ playerId }, viewer);
  }

  async getScoutReports(scoutId: string, viewer?: ViewerLike) {
    return this.findAll({ scoutId }, viewer);
  }

  async getMatchReports(matchId: string, viewer?: ViewerLike) {
    return this.findAll({ matchId }, viewer);
  }

  async getReportsByRecommendation(recommendation: string, viewer?: ViewerLike) {
    return this.findAll({ recommendation: recommendation as any }, viewer);
  }
}
