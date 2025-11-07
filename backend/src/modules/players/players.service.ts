import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../../common/interceptors/cache.interceptor';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { FilterPlayersDto, PlayerSortField, SortOrder } from './dto/filter-players.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PlayersService {
  constructor(
    private prisma: PrismaService,
    private cacheManager: CacheManagerService,
  ) {}

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

    return player;
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
      limit = 20,
    } = filters;

    const where: any = {};

    // Filtre de position - mapper les catégories génériques aux positions spécifiques
    if (position) {
      const positionMap: Record<string, string[]> = {
        'GOALKEEPER': ['Goalkeeper'],
        'DEFENDER': ['Center Back', 'Left Back', 'Right Back'],
        'MIDFIELDER': ['Central Midfielder', 'Defensive Midfielder', 'Attacking Midfielder'],
        'FORWARD': ['Striker', 'Left Winger', 'Right Winger'],
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
      where.users = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
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

    const [players, total] = await Promise.all([
      this.prisma.players.findMany({
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
      }),
      this.prisma.players.count({ where }),
    ]);

    return {
      data: players,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        filters: {
          position,
          status,
          nationality,
          clubId,
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
          sortBy,
          sortOrder,
        },
      },
    };
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

        return player;
      },
      300, // Cache for 5 minutes
    );
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

    return updated;
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
