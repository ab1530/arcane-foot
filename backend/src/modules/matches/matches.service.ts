import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { MatchStatus } from '@prisma/client';

@Injectable()
export class MatchesService {
  constructor(private prisma: PrismaService) {}

  private toMobileStatusFromAssignment(
    assignment?: { status?: string | null; reportSubmitted?: boolean | null } | null,
  ): 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED' {
    if (!assignment) {
      return 'PLANNED';
    }
    if (assignment.reportSubmitted) {
      return 'REPORT_SUBMITTED';
    }

    const source = String(assignment.status ?? '').toUpperCase();
    if (source === 'IN_PROGRESS') return 'EN_ROUTE';
    if (source === 'COMPLETED') return 'REPORT_SUBMITTED';
    return 'PLANNED';
  }

  private toMobileStatusFromMatch(match: any): 'PLANNED' | 'EN_ROUTE' | 'REPORT_SUBMITTED' {
    const assignments = Array.isArray(match?.match_assignments) ? match.match_assignments : [];

    if (assignments.some((assignment: any) => assignment?.reportSubmitted)) {
      return 'REPORT_SUBMITTED';
    }

    if (
      assignments.some(
        (assignment: any) => this.toMobileStatusFromAssignment(assignment) === 'REPORT_SUBMITTED',
      )
    ) {
      return 'REPORT_SUBMITTED';
    }

    if (
      assignments.some(
        (assignment: any) => this.toMobileStatusFromAssignment(assignment) === 'EN_ROUTE',
      )
    ) {
      return 'EN_ROUTE';
    }

    const source = String(match?.status ?? '').toUpperCase();
    if (source === 'LIVE') return 'EN_ROUTE';
    if (source === 'COMPLETED') return 'REPORT_SUBMITTED';
    return 'PLANNED';
  }

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
      mobileStatus: this.toMobileStatusFromMatch(match),
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
   * Find matches assigned to a specific user (legacy scout assignment + advanced assignments)
   */
  async findUserAssignments(
    userId: string,
    params: {
      status?: MatchStatus;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, from, to, page = 1, limit = 1000 } = params;

    const where: any = {
      OR: [{ scoutId: userId }, { match_assignments: { some: { scoutId: userId } } }],
    };

    if (status) where.status = status;
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
          match_assignments: {
            include: {
              users_match_assignments_scoutIdTousers: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  role: true,
                },
              },
              users_match_assignments_assignedByIdTousers: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                },
              },
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

    const transformedMatches = matches.map((match: any) => ({
      ...match,
      mobileStatus: this.toMobileStatusFromMatch(match),
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
      scout: match.users_matches_scoutIdTousers,
      assignments: (match.match_assignments ?? []).map((assignment: any) => ({
        id: assignment.id,
        scoutId: assignment.scoutId,
        status: assignment.status,
        mobileStatus: this.toMobileStatusFromAssignment(assignment),
        role: assignment.role,
        reportSubmitted: assignment.reportSubmitted,
        scout: assignment.users_match_assignments_scoutIdTousers
          ? {
              firstName: assignment.users_match_assignments_scoutIdTousers.firstName,
              lastName: assignment.users_match_assignments_scoutIdTousers.lastName,
              avatar: assignment.users_match_assignments_scoutIdTousers.avatar,
              role: assignment.users_match_assignments_scoutIdTousers.role,
            }
          : null,
        assignedBy: assignment.users_match_assignments_assignedByIdTousers
          ? {
              id: assignment.users_match_assignments_assignedByIdTousers.id,
              firstName: assignment.users_match_assignments_assignedByIdTousers.firstName,
              lastName: assignment.users_match_assignments_assignedByIdTousers.lastName,
              role: assignment.users_match_assignments_assignedByIdTousers.role,
            }
          : null,
      })),
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
      mobileStatus: this.toMobileStatusFromMatch(match),
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
      mobileStatus: this.toMobileStatusFromMatch(match),
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
      mobileStatus: this.toMobileStatusFromMatch(match),
      homeClub: match.clubs_matches_homeClubIdToclubs,
      awayClub: match.clubs_matches_awayClubIdToclubs,
    }));
  }
}
