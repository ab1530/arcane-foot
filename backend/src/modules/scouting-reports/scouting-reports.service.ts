import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateScoutingReportDto } from './dto/create-scouting-report.dto';
import { UpdateScoutingReportDto } from './dto/update-scouting-report.dto';
import { QueryScoutingReportDto } from './dto/query-scouting-report.dto';

@Injectable()
export class ScoutingReportsService {
  constructor(
    private prisma: PrismaService,
    private gamification: GamificationService,
  ) {}

  async create(createDto: CreateScoutingReportDto, scoutId: string) {
    // Validate scoutId is provided
    if (!scoutId) {
      throw new BadRequestException('Scout ID is required');
    }

    // Vérifier que le match existe
    const match = await this.prisma.matches.findUnique({
      where: { id: createDto.matchId },
    });
    if (!match) {
      throw new NotFoundException(`Match avec l'ID ${createDto.matchId} introuvable`);
    }

    // Vérifier que le joueur existe
    const player = await this.prisma.players.findUnique({
      where: { id: createDto.playerId },
    });
    if (!player) {
      throw new NotFoundException(`Joueur avec l'ID ${createDto.playerId} introuvable`);
    }

    // Vérifier que le scout existe
    const scout = await this.prisma.users.findUnique({
      where: { id: scoutId },
    });
    if (!scout) {
      throw new NotFoundException(`Scout avec l'ID ${scoutId} introuvable`);
    }

    const report = await this.prisma.scouting_reports.create({
      data: {
        id: randomUUID(),
        matches: {
          connect: { id: createDto.matchId },
        },
        players: {
          connect: { id: createDto.playerId },
        },
        users: {
          connect: { id: scoutId },
        },
        playerPosition: createDto.playerPosition,
        playerMinutesPlayed: createDto.playerMinutesPlayed,
        status: createDto.status,
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
        sprint10mSec: createDto.sprint10mSec,
        sprint20mSec: createDto.sprint20mSec,
        sprint40mSec: createDto.sprint40mSec,
        vmaKmh: createDto.vmaKmh,
        tags: createDto.tags,
        similarPlayerIds: createDto.similarPlayerIds,
        updatedAt: new Date(),
      },
      include: {
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
        scouting_notes: true,
        media: true,
      },
    });

    // Trigger gamification system (fire and forget - don't wait)
    this.gamification.trackUserAction(scoutId, 'report_created').catch((err) => {
      console.error('❌ Gamification error:', err.message);
      console.error('Stack:', err.stack);
    });

    // Transform data to match frontend expectations
    return {
      ...report,
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
      // Remove old fields
      players: undefined,
      users: undefined,
      matches: undefined,
    };
  }

  async findAll(query: QueryScoutingReportDto) {
    const { playerId, scoutId, matchId, status, recommendation, page = 1, limit = 1000 } = query;

    const where: any = {};
    if (playerId) where.playerId = playerId;
    if (scoutId) where.scoutId = scoutId;
    if (matchId) where.matchId = matchId;
    if (status) where.status = status;
    if (recommendation) where.recommendation = recommendation;

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.scouting_reports.findMany({
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
            },
          },
          matches: {
            include: {
              clubs_matches_homeClubIdToclubs: true,
              clubs_matches_awayClubIdToclubs: true,
            },
          },
          scouting_notes: true,
          media: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.scouting_reports.count({ where }),
    ]);

    // Transform data to match frontend expectations
    const transformedReports = reports.map((report: any) => ({
      ...report,
      player: {
        ...report.players,
        user: report.players?.users,
      },
      scout: report.users,
      match: {
        ...report.matches,
        homeClub: report.matches?.clubs_matches_homeClubIdToclubs,
        awayClub: report.matches?.clubs_matches_awayClubIdToclubs,
      },
      // Remove old fields
      players: undefined,
      users: undefined,
      matches: undefined,
    }));

    return {
      data: transformedReports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const report = await this.prisma.scouting_reports.findUnique({
      where: { id },
      include: {
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
            minute: 'asc',
          },
        },
        media: true,
      },
    });

    if (!report) {
      throw new NotFoundException(`Rapport avec l'ID ${id} introuvable`);
    }

    // Transform data to match frontend expectations
    return {
      ...report,
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
      // Remove old fields
      players: undefined,
      users: undefined,
      matches: undefined,
    };
  }

  async update(id: string, updateDto: UpdateScoutingReportDto) {
    // Vérifier que le rapport existe
    await this.findOne(id);

    const updated = await this.prisma.scouting_reports.update({
      where: { id },
      data: updateDto,
      include: {
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
        scouting_notes: true,
        media: true,
      },
    });

    // Transform data to match frontend expectations
    return {
      ...updated,
      player: {
        ...updated.players,
        user: updated.players?.users,
        club: updated.players?.clubs,
      },
      scout: updated.users,
      match: {
        ...updated.matches,
        homeClub: updated.matches?.clubs_matches_homeClubIdToclubs,
        awayClub: updated.matches?.clubs_matches_awayClubIdToclubs,
      },
      // Remove old fields
      players: undefined,
      users: undefined,
      matches: undefined,
    };
  }

  async remove(id: string) {
    // Vérifier que le rapport existe
    await this.findOne(id);

    await this.prisma.scouting_reports.delete({
      where: { id },
    });

    return { message: 'Rapport supprimé avec succès' };
  }

  async submit(id: string) {
    await this.findOne(id);

    const submitted = await this.prisma.scouting_reports.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
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
      },
    });

    // Transform data to match frontend expectations
    return {
      ...submitted,
      player: {
        ...submitted.players,
        user: submitted.players?.users,
        club: submitted.players?.clubs,
      },
      scout: submitted.users,
      match: {
        ...submitted.matches,
        homeClub: submitted.matches?.clubs_matches_homeClubIdToclubs,
        awayClub: submitted.matches?.clubs_matches_awayClubIdToclubs,
      },
      // Remove old fields
      players: undefined,
      users: undefined,
      matches: undefined,
    };
  }

  async review(id: string, reviewerId: string, approved: boolean) {
    await this.findOne(id);

    const reviewed = await this.prisma.scouting_reports.update({
      where: { id },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      },
      include: {
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
      },
    });

    // Transform data to match frontend expectations
    return {
      ...reviewed,
      player: {
        ...reviewed.players,
        user: reviewed.players?.users,
        club: reviewed.players?.clubs,
      },
      scout: reviewed.users,
      match: {
        ...reviewed.matches,
        homeClub: reviewed.matches?.clubs_matches_homeClubIdToclubs,
        awayClub: reviewed.matches?.clubs_matches_awayClubIdToclubs,
      },
      // Remove old fields
      players: undefined,
      users: undefined,
      matches: undefined,
    };
  }

  async getPlayerReports(playerId: string) {
    return this.findAll({ playerId });
  }

  async getScoutReports(scoutId: string) {
    return this.findAll({ scoutId });
  }

  async getMatchReports(matchId: string) {
    return this.findAll({ matchId });
  }

  async getReportsByRecommendation(recommendation: string) {
    return this.findAll({ recommendation: recommendation as any });
  }
}
