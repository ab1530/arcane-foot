import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../../common/interceptors/cache.interceptor';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ClubsService {
  constructor(
    private prisma: PrismaService,
    private cacheManager: CacheManagerService,
  ) {}

  /**
   * Create a new club
   * Invalidates cache on creation
   */
  async create(createClubDto: CreateClubDto) {
    const { contactUserId, ...clubData } = createClubDto;

    const club = await this.prisma.clubs.create({
      data: {
        id: randomUUID(),
        ...clubData,
        updatedAt: new Date(),
        ...(contactUserId && {
          users: {
            connect: { id: contactUserId },
          },
        }),
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Invalidate clubs list cache
    await this.cacheManager.invalidateByTag('clubs:list');

    return club;
  }

  /**
   * Find all clubs with filters and pagination
   * CACHED: 60s TTL (1 minute) with tag-based invalidation
   */
  async findAll(params: {
    country?: string;
    city?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { country, city, search, page = 1, limit = 20 } = params;

    // Generate cache key based on query params
    const cacheKey = `clubs:list:${JSON.stringify(params)}`;

    return this.cacheManager
      .getOrSet(
        cacheKey,
        async () => {
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

          const clubs = await this.prisma.clubs.findMany({
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
                },
              },
              _count: {
                select: {
                  players: true,
                  matches_matches_homeClubIdToclubs: true,
                  matches_matches_awayClubIdToclubs: true,
                },
              },
            },
            orderBy: { name: 'asc' },
          });

          // Return array directly for consistency with tests and API standards
          // If pagination metadata is needed, clients can use response headers or separate endpoint
          return clubs;
        },
        60, // Cache for 1 minute
      )
      .then(async (result) => {
        // Tag for invalidation
        await this.cacheManager.cacheWithTags(cacheKey, result, ['clubs:list'], 60);
        return result;
      });
  }

  /**
   * Find one club by ID
   * CACHED: 300s TTL (5 minutes) - Heavy query with multiple relations
   */
  async findOne(id: string) {
    const cacheKey = `clubs:detail:${id}`;

    return this.cacheManager.getOrSet(
      cacheKey,
      async () => {
        const club = await this.prisma.clubs.findUnique({
          where: { id },
          include: {
            users: {
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
            matches_matches_homeClubIdToclubs: {
              take: 5,
              orderBy: { scheduledAt: 'desc' },
              include: {
                clubs_matches_awayClubIdToclubs: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
              },
            },
            matches_matches_awayClubIdToclubs: {
              take: 5,
              orderBy: { scheduledAt: 'desc' },
              include: {
                clubs_matches_homeClubIdToclubs: {
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
                matches_matches_homeClubIdToclubs: true,
                matches_matches_awayClubIdToclubs: true,
                club_requests: true,
                camps: true,
              },
            },
          },
        });

        if (!club) {
          throw new NotFoundException(`Club with ID ${id} not found`);
        }

        return club;
      },
      300, // Cache for 5 minutes
    );
  }

  /**
   * Update a club
   * Invalidates cache on update
   */
  async update(id: string, updateClubDto: UpdateClubDto) {
    const club = await this.prisma.clubs.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    const updated = await this.prisma.clubs.update({
      where: { id },
      data: updateClubDto,
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Invalidate both detail and list caches
    await this.cacheManager.invalidateByTags([`clubs:detail:${id}`, 'clubs:list']);

    return updated;
  }

  /**
   * Delete a club
   * Invalidates cache on deletion
   */
  async remove(id: string) {
    const club = await this.prisma.clubs.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    const deleted = await this.prisma.clubs.delete({ where: { id } });

    // Invalidate both detail and list caches
    await this.cacheManager.invalidateByTags([`clubs:detail:${id}`, 'clubs:list']);

    return deleted;
  }

  /**
   * Get club players
   */
  async getPlayers(id: string) {
    const club = await this.prisma.clubs.findUnique({ where: { id } });
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    return this.prisma.players.findMany({
      where: { clubId: id },
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
      orderBy: { jerseyNumber: 'asc' },
    });
  }

  /**
   * Get club matches
   */
  async getMatches(id: string, params: { upcoming?: boolean } = {}) {
    const club = await this.prisma.clubs.findUnique({ where: { id } });
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

    return this.prisma.matches.findMany({
      where,
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
      orderBy: { scheduledAt: params.upcoming ? 'asc' : 'desc' },
      take: 20,
    });
  }
}
