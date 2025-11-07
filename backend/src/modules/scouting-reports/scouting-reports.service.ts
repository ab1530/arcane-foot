import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScoutingReportDto } from './dto/create-scouting-report.dto';
import { UpdateScoutingReportDto } from './dto/update-scouting-report.dto';
import { QueryScoutingReportDto } from './dto/query-scouting-report.dto';

@Injectable()
export class ScoutingReportsService {
  constructor(private prisma: PrismaService) {}

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
                firstName: true,
                lastName: true,
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

    return report;
  }

  async findAll(query: QueryScoutingReportDto) {
    const { playerId, scoutId, matchId, status, recommendation } = query;

    const where: any = {};
    if (playerId) where.playerId = playerId;
    if (scoutId) where.scoutId = scoutId;
    if (matchId) where.matchId = matchId;
    if (status) where.status = status;
    if (recommendation) where.recommendation = recommendation;

    const reports = await this.prisma.scouting_reports.findMany({
      where,
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
                firstName: true,
                lastName: true,
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
    });

    return reports;
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
                firstName: true,
                lastName: true,
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

    return report;
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
                firstName: true,
                lastName: true,
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

    return updated;
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
        users: true,
        players: true,
        matches: true,
      },
    });

    return submitted;
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
        users: true,
        players: true,
        matches: true,
      },
    });

    return reviewed;
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
