import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../../common/interceptors/cache.interceptor';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { FilterPlayersDto, PlayerSortField, SortOrder } from './dto/filter-players.dto';
import {
  ScoutQuickImportDto,
  ScoutQuickImportResult,
  ScoutQuickImportRow,
} from './dto/scout-quick-import.dto';
import { randomUUID } from 'crypto';

type ParsedScoutLine = {
  line: number;
  raw: string;
  firstName?: string;
  lastName?: string;
  birthYear?: number;
  observedClubName?: string;
  position?: string;
  preferredFoot?: string;
};

const RIGHT_FOOT_KEYWORDS = ['droitier', 'droite', 'right', 'right-footed'];
const LEFT_FOOT_KEYWORDS = ['gaucher', 'gauche', 'left', 'left-footed'];
const BOTH_FOOT_KEYWORDS = ['ambi', 'ambidextre', 'both', 'two-footed'];

const POSITION_KEYWORDS: Array<{ value: string; keywords: string[] }> = [
  { value: 'Goalkeeper', keywords: ['gardien', 'goalkeeper', 'keeper', 'gk'] },
  { value: 'Defender', keywords: ['defenseur', 'défenseur', 'defender', 'dc', 'latéral'] },
  { value: 'Midfielder', keywords: ['milieu', 'midfielder', 'midfield', 'mdf'] },
  { value: 'Winger', keywords: ['ailier', 'winger', 'ail', 'lw', 'rw'] },
  { value: 'Forward', keywords: ['attaquant', 'avant-centre', 'striker', 'forward', 'cf'] },
];

@Injectable()
export class PlayersService {
  constructor(
    private prisma: PrismaService,
    private cacheManager: CacheManagerService,
  ) {}

  private normalizeText(value?: string | null): string {
    if (!value) return '';
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private toDisplayCase(value?: string | null): string | undefined {
    if (!value) return undefined;
    const collapsed = value.replace(/\s+/g, ' ').trim();
    if (!collapsed) return undefined;
    return collapsed
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private buildIdentityKey(
    firstName?: string | null,
    lastName?: string | null,
    birthYear?: number | null,
    observedClubName?: string | null,
  ): string {
    return [
      this.normalizeText(firstName),
      this.normalizeText(lastName),
      birthYear ?? '',
      this.normalizeText(observedClubName),
    ].join('|');
  }

  private detectPreferredFoot(raw: string): string | undefined {
    const normalized = this.normalizeText(raw);

    if (BOTH_FOOT_KEYWORDS.some((keyword) => normalized.includes(this.normalizeText(keyword)))) {
      return 'Both';
    }

    if (RIGHT_FOOT_KEYWORDS.some((keyword) => normalized.includes(this.normalizeText(keyword)))) {
      return 'Right';
    }

    if (LEFT_FOOT_KEYWORDS.some((keyword) => normalized.includes(this.normalizeText(keyword)))) {
      return 'Left';
    }

    return undefined;
  }

  private detectPosition(raw: string): string | undefined {
    const normalized = this.normalizeText(raw);
    const match = POSITION_KEYWORDS.find(({ keywords }) =>
      keywords.some((keyword) => normalized.includes(this.normalizeText(keyword))),
    );
    return match?.value;
  }

  private cleanupSegment(raw: string): string {
    let cleaned = raw.replace(/\b(19|20)\d{2}\b/g, ' ');
    for (const keyword of [...RIGHT_FOOT_KEYWORDS, ...LEFT_FOOT_KEYWORDS, ...BOTH_FOOT_KEYWORDS]) {
      const pattern = new RegExp(`\\b${this.normalizeText(keyword)}\\b`, 'gi');
      cleaned = this.normalizeText(cleaned).replace(pattern, ' ');
    }
    for (const { keywords } of POSITION_KEYWORDS) {
      for (const keyword of keywords) {
        const pattern = new RegExp(`\\b${this.normalizeText(keyword)}\\b`, 'gi');
        cleaned = this.normalizeText(cleaned).replace(pattern, ' ');
      }
    }

    return cleaned.replace(/\s+/g, ' ').trim();
  }

  private extractNameAndClub(firstSegment: string): {
    nameCandidate: string;
    clubFromFirstSegment?: string;
  } {
    const raw = firstSegment.replace(/\s+/g, ' ').trim();
    const yearMatch = raw.match(/\b(19|20)\d{2}\b/);
    let candidate = raw;
    let tailAfterYear = '';
    if (yearMatch?.index !== undefined) {
      candidate = raw.slice(0, yearMatch.index).trim();
      tailAfterYear = raw.slice(yearMatch.index + yearMatch[0].length).trim();
    }

    const cleanedCandidate = this.cleanupSegment(candidate);
    const tokens = cleanedCandidate.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) {
      return {
        nameCandidate: '',
        clubFromFirstSegment: this.cleanupSegment(tailAfterYear) || undefined,
      };
    }

    if (tokens.length === 1) {
      return {
        nameCandidate: tokens[0],
        clubFromFirstSegment: this.cleanupSegment(tailAfterYear) || undefined,
      };
    }

    if (tokens.length === 2) {
      return {
        nameCandidate: `${tokens[0]} ${tokens[1]}`.trim(),
        clubFromFirstSegment: this.cleanupSegment(tailAfterYear) || undefined,
      };
    }

    const thirdToken = tokens[2];
    const shouldSplitAsClub =
      tokens.length === 3 ||
      /^[a-z]/.test(thirdToken) ||
      ['fc', 'ac', 'sc', 'as', 'us', 'st'].includes(this.normalizeText(thirdToken));

    if (shouldSplitAsClub) {
      return {
        nameCandidate: `${tokens[0]} ${tokens[1]}`.trim(),
        clubFromFirstSegment: [tokens.slice(2).join(' '), this.cleanupSegment(tailAfterYear)]
          .filter(Boolean)
          .join(' ')
          .trim(),
      };
    }

    return {
      nameCandidate: tokens.join(' '),
      clubFromFirstSegment: this.cleanupSegment(tailAfterYear) || undefined,
    };
  }

  private parseScoutLine(rawLine: string, lineNumber: number): ParsedScoutLine {
    const normalizedRaw = rawLine.replace(/\s+/g, ' ').trim();
    const segments = normalizedRaw
      .split(/[,–-]+/)
      .map((segment) => segment.trim())
      .filter(Boolean);

    const fallbackSegments = segments.length > 0 ? segments : [normalizedRaw];
    const firstSegment = fallbackSegments[0] || '';
    const { nameCandidate, clubFromFirstSegment } = this.extractNameAndClub(firstSegment);

    const yearMatch = normalizedRaw.match(/\b(19|20)\d{2}\b/);
    const birthYear = yearMatch ? Number.parseInt(yearMatch[0], 10) : undefined;

    const preferredFoot = this.detectPreferredFoot(normalizedRaw);
    const position = this.detectPosition(normalizedRaw);

    let observedClubName = clubFromFirstSegment;
    if (!observedClubName) {
      for (let i = 1; i < fallbackSegments.length; i += 1) {
        const candidate = this.cleanupSegment(fallbackSegments[i]);
        if (!candidate) continue;
        if (this.detectPreferredFoot(candidate) || this.detectPosition(candidate)) continue;
        observedClubName = candidate;
        break;
      }
    }

    const nameTokens = nameCandidate.split(/\s+/).filter(Boolean);
    const firstName = nameTokens[0];
    const lastName = nameTokens.length > 1 ? nameTokens.slice(1).join(' ') : undefined;

    return {
      line: lineNumber,
      raw: rawLine,
      firstName: this.toDisplayCase(firstName),
      lastName: this.toDisplayCase(lastName),
      birthYear,
      observedClubName: this.toDisplayCase(observedClubName),
      position,
      preferredFoot,
    };
  }

  private toFrontendPlayer(player: any) {
    const syntheticUser = player?.users
      ? player.users
      : {
          id: null,
          email: null,
          firstName: player?.firstName ?? '',
          lastName: player?.lastName ?? '',
          avatar: null,
        };

    return {
      ...player,
      user: syntheticUser,
      club: player?.clubs ?? null,
    };
  }

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

    return this.toFrontendPlayer(player);
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
      limit = 1000,
    } = filters;

    const where: any = {};

    // Filtre de position - mapper les catégories génériques aux positions spécifiques
    if (position) {
      const positionMap: Record<string, string[]> = {
        GOALKEEPER: ['Goalkeeper'],
        DEFENDER: ['Center Back', 'Left Back', 'Right Back'],
        MIDFIELDER: ['Central Midfielder', 'Defensive Midfielder', 'Attacking Midfielder'],
        FORWARD: ['Striker', 'Left Winger', 'Right Winger'],
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
      where.OR = [
        {
          users: {
            is: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
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

    const players = await this.prisma.players.findMany({
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
    });

    const transformedPlayers = players.map((player) => this.toFrontendPlayer(player));

    // Return array directly for consistency with tests and API standards
    // If pagination metadata is needed, clients can use response headers or separate endpoint
    return transformedPlayers;
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

        return this.toFrontendPlayer(player);
      },
      300, // Cache for 5 minutes
    );
  }

  async quickImportFromScoutText(
    dto: ScoutQuickImportDto,
    importerId: string,
  ): Promise<ScoutQuickImportResult> {
    const rawText = dto.rawText?.trim();
    if (!rawText) {
      throw new BadRequestException('rawText is required');
    }

    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      throw new BadRequestException('No player lines found in rawText');
    }

    const defaultNationality = (dto.defaultNationality || 'FR').toUpperCase();
    const dryRun = dto.dryRun === true;

    const existingPlayers = await this.prisma.players.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        birthYear: true,
        observedClubName: true,
        nationality: true,
        users: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const existingByKey = new Map<string, any>();
    for (const player of existingPlayers) {
      const key = this.buildIdentityKey(
        player.firstName ?? player.users?.firstName,
        player.lastName ?? player.users?.lastName,
        player.birthYear,
        player.observedClubName,
      );
      if (key && !existingByKey.has(key)) {
        existingByKey.set(key, player);
      }
    }

    const rows: ScoutQuickImportRow[] = [];
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (let index = 0; index < lines.length; index += 1) {
      const raw = lines[index];
      const lineNumber = index + 1;
      try {
        const parsed = this.parseScoutLine(raw, lineNumber);
        if (!parsed.firstName) {
          failed += 1;
          rows.push({
            line: lineNumber,
            raw,
            action: 'FAILED',
            reason: 'Unable to detect player name on this line',
          });
          continue;
        }

        const key = this.buildIdentityKey(
          parsed.firstName,
          parsed.lastName,
          parsed.birthYear,
          parsed.observedClubName,
        );
        const existing = existingByKey.get(key);

        if (dryRun) {
          if (existing) {
            updated += 1;
            rows.push({
              line: lineNumber,
              raw,
              action: 'UPDATED',
              playerId: existing.id,
            });
          } else {
            created += 1;
            rows.push({
              line: lineNumber,
              raw,
              action: 'CREATED',
            });
          }
          continue;
        }

        if (existing) {
          const updatedPlayer = await this.prisma.players.update({
            where: { id: existing.id },
            data: {
              firstName: parsed.firstName ?? undefined,
              lastName: parsed.lastName ?? undefined,
              birthYear: parsed.birthYear ?? undefined,
              observedClubName: parsed.observedClubName ?? undefined,
              position: parsed.position ?? undefined,
              preferredFoot: parsed.preferredFoot ?? undefined,
              importSource: 'SCOUT_CHAT',
              nationality: existing.nationality || defaultNationality,
              updatedAt: new Date(),
            },
            select: { id: true },
          });

          updated += 1;
          rows.push({
            line: lineNumber,
            raw,
            action: 'UPDATED',
            playerId: updatedPlayer.id,
          });
        } else {
          const createdPlayer = await this.prisma.players.create({
            data: {
              id: randomUUID(),
              userId: null,
              firstName: parsed.firstName ?? null,
              lastName: parsed.lastName ?? null,
              birthYear: parsed.birthYear ?? null,
              observedClubName: parsed.observedClubName ?? null,
              importSource: 'SCOUT_CHAT',
              position: parsed.position ?? 'Unknown',
              preferredFoot: parsed.preferredFoot ?? null,
              nationality: defaultNationality,
              dateOfBirth: null,
              status: 'PROSPECT',
              isPublic: true,
              updatedAt: new Date(),
            },
            select: { id: true },
          });

          existingByKey.set(key, {
            id: createdPlayer.id,
            firstName: parsed.firstName,
            lastName: parsed.lastName,
            birthYear: parsed.birthYear,
            observedClubName: parsed.observedClubName,
            nationality: defaultNationality,
            users: null,
          });

          created += 1;
          rows.push({
            line: lineNumber,
            raw,
            action: 'CREATED',
            playerId: createdPlayer.id,
          });
        }
      } catch (error) {
        failed += 1;
        rows.push({
          line: lineNumber,
          raw,
          action: 'FAILED',
          reason: (error as Error)?.message || 'Unexpected import error',
        });
      }
    }

    if (!dryRun) {
      await this.cacheManager.invalidateByTag('players:list');
      await this.prisma.audit_logs.create({
        data: {
          id: randomUUID(),
          userId: importerId,
          action: 'SCOUT_QUICK_IMPORT_PLAYERS',
          entityType: 'Player',
          entityId: null,
          changes: {
            created,
            updated,
            failed,
            total: lines.length,
          },
        },
      });
    }

    return { created, updated, failed, rows };
  }

  async recordView(playerId: string, viewerId: string, source?: string) {
    const exists = await this.prisma.players.findUnique({
      where: { id: playerId },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('Player not found');
    }

    const viewedAt = new Date();
    const view = await this.prisma.player_views.upsert({
      where: {
        viewerId_playerId: {
          viewerId,
          playerId,
        },
      },
      create: {
        id: randomUUID(),
        viewerId,
        playerId,
        source,
        viewedAt,
      },
      update: {
        viewedAt,
        source: source ?? undefined,
      },
    });

    return { viewedAt: view.viewedAt };
  }

  async getRecentViews(viewerId: string, limit = 12) {
    const views = await this.prisma.player_views.findMany({
      where: { viewerId },
      orderBy: { viewedAt: 'desc' },
      take: limit,
      include: {
        players: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            clubs: {
              select: {
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    return views.map((view) => {
      const player = view.players;
      const fullName =
        `${player?.users?.firstName ?? player?.firstName ?? ''} ${player?.users?.lastName ?? player?.lastName ?? ''}`.trim();
      return {
        id: view.playerId,
        playerId: view.playerId,
        fullName: fullName || 'Unknown Player',
        position: player?.position ?? null,
        clubName: player?.clubs?.name ?? null,
        photoUrl: player?.photoUrl ?? player?.users?.avatar ?? null,
        lastViewedAt: view.viewedAt,
      };
    });
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

    return this.toFrontendPlayer(updated);
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
