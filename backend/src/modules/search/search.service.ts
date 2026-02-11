import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryDto, SearchEntity } from './dto/search-query.dto';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(searchQueryDto: SearchQueryDto) {
    const { query, entities = [SearchEntity.ALL], limit = 10 } = searchQueryDto;

    const searchEntities = entities.includes(SearchEntity.ALL)
      ? [
          SearchEntity.PLAYERS,
          SearchEntity.CLUBS,
          SearchEntity.MATCHES,
          SearchEntity.EVENTS,
          SearchEntity.SCOUTING_REPORTS,
        ]
      : entities;

    const results: any = {
      query,
      results: {},
      totalResults: 0,
    };

    // Recherche dans chaque entité en parallèle
    const searchPromises = searchEntities.map(async (entity) => {
      switch (entity) {
        case SearchEntity.PLAYERS:
          return { entity, data: await this.searchPlayers(query, limit) };
        case SearchEntity.CLUBS:
          return { entity, data: await this.searchClubs(query, limit) };
        case SearchEntity.MATCHES:
          return { entity, data: await this.searchMatches(query, limit) };
        case SearchEntity.EVENTS:
          return { entity, data: await this.searchEvents(query, limit) };
        case SearchEntity.SCOUTING_REPORTS:
          return { entity, data: await this.searchScoutingReports(query, limit) };
        default:
          return { entity, data: [] };
      }
    });

    const searchResults = await Promise.all(searchPromises);

    searchResults.forEach(({ entity, data }) => {
      results.results[entity] = data;
      results.totalResults += data.length;
    });

    return results;
  }

  private async searchPlayers(query: string, limit: number) {
    return this.prisma.players.findMany({
      where: {
        users: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      take: limit,
      include: {
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
      orderBy: { createdAt: 'desc' },
    });
  }

  private async searchClubs(query: string, limit: number) {
    return this.prisma.clubs.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { shortName: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
          { country: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        shortName: true,
        logo: true,
        city: true,
        country: true,
        _count: {
          select: {
            players: true,
            matches_matches_homeClubIdToclubs: true,
            matches_matches_awayClubIdToclubs: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async searchMatches(query: string, limit: number) {
    return this.prisma.matches.findMany({
      where: {
        OR: [
          { competitionOld: { contains: query, mode: 'insensitive' } }, // Use legacy field
          { venueOld: { contains: query, mode: 'insensitive' } }, // Use legacy field
          { clubs_matches_homeClubIdToclubs: { name: { contains: query, mode: 'insensitive' } } },
          { clubs_matches_awayClubIdToclubs: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
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
        _count: {
          select: {
            scouting_reports: true,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  private async searchEvents(query: string, limit: number) {
    return this.prisma.events.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      orderBy: { startDate: 'desc' },
    });
  }

  private async searchScoutingReports(query: string, limit: number) {
    return this.prisma.scouting_reports.findMany({
      where: {
        OR: [
          { players: { users: { firstName: { contains: query, mode: 'insensitive' } } } },
          { players: { users: { lastName: { contains: query, mode: 'insensitive' } } } },
          { users: { firstName: { contains: query, mode: 'insensitive' } } },
          { users: { lastName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      take: limit,
      include: {
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
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        matches: {
          select: {
            id: true,
            scheduledAt: true,
            clubs_matches_homeClubIdToclubs: {
              select: {
                name: true,
                logo: true,
              },
            },
            clubs_matches_awayClubIdToclubs: {
              select: {
                name: true,
                logo: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async quickSearch(query: string, limit: number = 5) {
    // Recherche rapide dans les principales entités
    const [players, clubs, matches] = await Promise.all([
      this.searchPlayers(query, limit),
      this.searchClubs(query, limit),
      this.searchMatches(query, limit),
    ]);

    return {
      query,
      results: {
        players: players.slice(0, limit),
        clubs: clubs.slice(0, limit),
        matches: matches.slice(0, limit),
      },
      totalResults: players.length + clubs.length + matches.length,
    };
  }
}
