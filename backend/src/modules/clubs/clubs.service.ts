import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';

@Injectable()
export class ClubsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new club
   */
  async create(createClubDto: CreateClubDto) {
    return this.prisma.club.create({
      data: createClubDto,
      include: {
        contactUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Find all clubs with filters and pagination
   */
  async findAll(params: {
    country?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { country, city, search, page = 1, limit = 20 } = params;

    const where: any = {};
    if (country) where.country = country;
    if (city) where.city = city;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { shortName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [clubs, total] = await Promise.all([
      this.prisma.club.findMany({
        where,
        skip,
        take: limit,
        include: {
          contactUser: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              players: true,
              homeMatches: true,
              awayMatches: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.club.count({ where }),
    ]);

    return {
      data: clubs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find one club by ID
   */
  async findOne(id: string) {
    const club = await this.prisma.club.findUnique({
      where: { id },
      include: {
        contactUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        homeMatches: {
          take: 5,
          orderBy: { scheduledAt: 'desc' },
          include: {
            awayClub: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
        awayMatches: {
          take: 5,
          orderBy: { scheduledAt: 'desc' },
          include: {
            homeClub: {
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
            players: true,
            homeMatches: true,
            awayMatches: true,
            clubRequests: true,
            camps: true,
          },
        },
      },
    });

    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    return club;
  }

  /**
   * Update a club
   */
  async update(id: string, updateClubDto: UpdateClubDto) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    return this.prisma.club.update({
      where: { id },
      data: updateClubDto,
      include: {
        contactUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Delete a club
   */
  async remove(id: string) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    return this.prisma.club.delete({ where: { id } });
  }

  /**
   * Get club players
   */
  async getPlayers(id: string) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    return this.prisma.player.findMany({
      where: { clubId: id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
      orderBy: { jerseyNumber: 'asc' },
    });
  }

  /**
   * Get club matches
   */
  async getMatches(id: string, params: { upcoming?: boolean } = {}) {
    const club = await this.prisma.club.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    const where: any = {
      OR: [{ homeClubId: id }, { awayClubId: id }],
    };

    if (params.upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ['SCHEDULED'] };
    }

    return this.prisma.match.findMany({
      where,
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
        scout: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { scheduledAt: params.upcoming ? 'asc' : 'desc' },
      take: 20,
    });
  }
}
