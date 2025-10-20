import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new player
   */
  async create(createPlayerDto: CreatePlayerDto) {
    const data: any = { ...createPlayerDto };
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    if (data.contractUntil) {
      data.contractUntil = new Date(data.contractUntil);
    }

    return this.prisma.player.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });
  }

  /**
   * Find all players with filters and pagination
   */
  async findAll(params: {
    position?: string;
    status?: string;
    nationality?: string;
    clubId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { position, status, nationality, clubId, search, page = 1, limit = 20 } = params;

    const where: any = {};
    if (position) where.position = position;
    if (status) where.status = status;
    if (nationality) where.nationality = nationality;
    if (clubId) where.clubId = clubId;

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const skip = (page - 1) * limit;

    const [players, total] = await Promise.all([
      this.prisma.player.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          club: {
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
              scoutingReports: true,
              media: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.player.count({ where }),
    ]);

    return {
      data: players,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one player by ID
   */
  async findOne(id: string) {
    const player = await this.prisma.player.findUnique({
      where: { id },
      include: {
        user: true,
        club: true,
        scoutingReports: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            match: {
              include: {
                homeClub: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
                awayClub: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
            scout: {
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
        clubRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            club: {
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
            scoutingReports: true,
            media: true,
            clubRequests: true,
          },
        },
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return player;
  }

  /**
   * Update a player
   */
  async update(id: string, updatePlayerDto: UpdatePlayerDto) {
    const player = await this.prisma.player.findUnique({ where: { id } });
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

    return this.prisma.player.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        club: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    });
  }

  /**
   * Delete a player
   */
  async remove(id: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return this.prisma.player.delete({ where: { id } });
  }

  /**
   * Get player statistics
   */
  async getStats(id: string) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    const [reportsCount, averageRating, recentReports] = await Promise.all([
      this.prisma.scoutingReport.count({
        where: { playerId: id, status: 'APPROVED' },
      }),
      this.prisma.scoutingReport.aggregate({
        where: { playerId: id, status: 'APPROVED', overallRating: { not: null } },
        _avg: { overallRating: true },
      }),
      this.prisma.scoutingReport.findMany({
        where: { playerId: id, status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          overallRating: true,
          createdAt: true,
          match: {
            select: {
              competition: true,
              scheduledAt: true,
              homeClub: { select: { name: true } },
              awayClub: { select: { name: true } },
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
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) {
      throw new NotFoundException(`Player with ID ${id} not found`);
    }

    return this.prisma.scoutingReport.findMany({
      where: { playerId: id },
      include: {
        match: {
          include: {
            homeClub: true,
            awayClub: true,
          },
        },
        scout: {
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
