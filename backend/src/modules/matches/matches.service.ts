import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchStatus } from '@prisma/client';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new match
   */
  async create(createMatchDto: CreateMatchDto) {
    // Validate clubs exist
    const [homeClub, awayClub] = await Promise.all([
      this.prisma.clubs.findUnique({ where: { id: createMatchDto.homeClubId } }),
      this.prisma.clubs.findUnique({ where: { id: createMatchDto.awayClubId } }),
    ]);

    if (!homeClub) {
      throw new NotFoundException(`Home club with ID ${createMatchDto.homeClubId} not found`);
    }
    if (!awayClub) {
      throw new NotFoundException(`Away club with ID ${createMatchDto.awayClubId} not found`);
    }
    if (createMatchDto.homeClubId === createMatchDto.awayClubId) {
      throw new BadRequestException('Home and away clubs must be different');
    }

    return this.prisma.matches.create({
      data: {
        id: randomUUID(),
        ...createMatchDto,
        scheduledAt: new Date(createMatchDto.scheduledAt),
        updatedAt: new Date(),
      },
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
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Find all matches with filters and pagination
   */
  async findAll(params: {
    status?: MatchStatus;
    clubId?: string;
    scoutId?: string;
    competition?: string;
    season?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      status,
      clubId,
      scoutId,
      competition,
      season,
      from,
      to,
      page = 1,
      limit = 1000,
    } = params;

    const where: any = {};
    if (status) where.status = status;
    if (scoutId) where.scoutId = scoutId;
    if (competition) where.competitionOld = competition; // Use legacy field for now
    if (season) where.season = season;

    if (clubId) {
      where.OR = [{ homeClubId: clubId }, { awayClubId: clubId }];
    }

    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      this.prisma.matches.findMany({
        where,
        skip,
        take: limit,
        include: {
          clubs_matches_homeClubIdToclubs: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
            },
          },
          clubs_matches_awayClubIdToclubs: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
            },
          },
          users_matches_scoutIdTousers: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              scouting_reports: true,
            },
          },
        },
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.matches.count({ where }),
    ]);

    // Transform matches to have cleaner field names
    const transformedMatches = matches.map((match: any) => ({
      ...match,
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
      scout: match.users_matches_scoutIdTousers,
      _count: {
        scoutingReports: match._count?.scouting_reports || 0,
      },
    }));

    return {
      data: transformedMatches,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one match by ID
   */
  async findOne(id: string) {
    const match = await this.prisma.matches.findUnique({
      where: { id },
      include: {
        clubs_matches_homeClubIdToclubs: true,
        clubs_matches_awayClubIdToclubs: true,
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        scouting_reports: {
          include: {
            players: {
              include: {
                users: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
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
        media: true,
        _count: {
          select: {
            scouting_reports: true,
          },
        },
      },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    // Transform to have cleaner field names
    return {
      ...match,
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
      scout: match.users_matches_scoutIdTousers,
      _count: {
        scoutingReports: match._count?.scouting_reports || 0,
      },
    };
  }

  /**
   * Update a match
   */
  async update(id: string, updateMatchDto: UpdateMatchDto) {
    const match = await this.prisma.matches.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    const updateData: any = { ...updateMatchDto };
    if (updateMatchDto.scheduledAt) {
      updateData.scheduledAt = new Date(updateMatchDto.scheduledAt);
    }

    return this.prisma.matches.update({
      where: { id },
      data: updateData,
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
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a match
   */
  async remove(id: string) {
    const match = await this.prisma.matches.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return this.prisma.matches.delete({ where: { id } });
  }

  /**
   * Assign scout to match
   */
  async assignScout(id: string, scoutId: string) {
    const match = await this.prisma.matches.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    const scout = await this.prisma.users.findUnique({
      where: { id: scoutId },
    });
    if (!scout) {
      throw new NotFoundException(`Scout with ID ${scoutId} not found`);
    }
    if (scout.role !== 'SCOUT' && scout.role !== 'ADMIN' && scout.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('User is not a scout');
    }

    return this.prisma.matches.update({
      where: { id },
      data: { scoutId },
      include: {
        clubs_matches_homeClubIdToclubs: true,
        clubs_matches_awayClubIdToclubs: true,
        users_matches_scoutIdTousers: true,
      },
    });
  }

  /**
   * Update match score
   */
  async updateScore(id: string, homeScore: number, awayScore: number) {
    const match = await this.prisma.matches.findUnique({ where: { id } });
    if (!match) {
      throw new NotFoundException(`Match with ID ${id} not found`);
    }

    return this.prisma.matches.update({
      where: { id },
      data: {
        homeScore,
        awayScore,
        status: MatchStatus.COMPLETED,
      },
      include: {
        clubs_matches_homeClubIdToclubs: true,
        clubs_matches_awayClubIdToclubs: true,
      },
    });
  }

  /**
   * Get upcoming matches
   */
  async getUpcoming(limit: number = 10) {
    const matches = await this.prisma.matches.findMany({
      where: {
        scheduledAt: { gte: new Date() },
        status: MatchStatus.SCHEDULED,
      },
      take: limit,
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
        users_matches_scoutIdTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Transform matches to have cleaner field names
    return matches.map((match: any) => ({
      ...match,
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
      scout: match.users_matches_scoutIdTousers,
    }));
  }

  /**
   * Get live matches
   */
  async getLive() {
    const matches = await this.prisma.matches.findMany({
      where: { status: MatchStatus.LIVE },
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
    });

    // Transform matches to have cleaner field names
    return matches.map((match: any) => ({
      ...match,
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
    }));
  }
}
