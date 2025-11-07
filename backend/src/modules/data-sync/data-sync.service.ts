import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballService } from './services/api-football.service';
import { ClubMapper } from './mappers/club.mapper';
import { PlayerMapper } from './mappers/player.mapper';
import { CompetitionMapper } from './mappers/competition.mapper';

@Injectable()
export class DataSyncService {
  private readonly logger = new Logger(DataSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apiFootballService: ApiFootballService,
    private readonly clubMapper: ClubMapper,
    private readonly playerMapper: PlayerMapper,
    private readonly competitionMapper: CompetitionMapper,
  ) {}

  /**
   * Synchronise toutes les competitions principales
   */
  async syncCompetitions(source: string = 'api-football'): Promise<void> {
    this.logger.log(`Starting competition sync from ${source}`);

    try {
      const externalCompetitions = await this.apiFootballService.getCompetitions();
      const competitions = [];

      for (const extComp of externalCompetitions) {
        const mapped = this.competitionMapper.fromExternal(extComp, source);
        competitions.push(mapped);
      }

      // Batch upsert (max 50 competitions)
      await this.batchUpsertCompetitions(competitions);

      this.logger.log(`Successfully synced ${competitions.length} competitions`);
    } catch (error) {
      this.logger.error(`Error syncing competitions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronise tous les clubs d'une competition
   */
  async syncClubs(competitionExternalId: string, source: string): Promise<void> {
    this.logger.log(`Starting clubs sync for competition ${competitionExternalId}`);

    try {
      // Recuperer competition locale
      const competition = await this.prisma.competitions.findUnique({
        where: { externalId: competitionExternalId },
      });

      if (!competition) {
        throw new Error(`Competition ${competitionExternalId} not found in database`);
      }

      // Recuperer clubs depuis API
      const externalClubs = await this.apiFootballService.getTeams(competitionExternalId);
      const clubs = [];

      for (const extClub of externalClubs) {
        const mappedClub = this.clubMapper.fromExternal(extClub, source);
        clubs.push(mappedClub);
      }

      // Batch upsert (max 100 clubs)
      await this.batchUpsertClubs(clubs, 100);

      this.logger.log(`Successfully synced ${clubs.length} clubs`);
    } catch (error) {
      this.logger.error(`Error syncing clubs: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronise les joueurs d'un club
   */
  async syncPlayers(clubExternalId: string, source: string): Promise<void> {
    this.logger.log(`Starting players sync for club ${clubExternalId}`);

    try {
      // Recuperer club local
      const club = await this.prisma.clubs.findUnique({
        where: { externalId: clubExternalId },
      });

      if (!club) {
        throw new Error(`Club ${clubExternalId} not found in database`);
      }

      // Recuperer joueurs depuis API
      const externalPlayers = await this.apiFootballService.getPlayers(clubExternalId);
      const players = [];

      for (const extPlayer of externalPlayers) {
        // Creer ou recuperer User pour ce joueur
        const user = await this.findOrCreatePlayerUser(extPlayer);

        const mappedPlayer = this.playerMapper.fromExternal(extPlayer, source);

        // Remove temporary fields and add real data
        const { _firstName, _lastName, ...playerData } = mappedPlayer;
        playerData.userId = user.id;
        playerData.clubId = club.id;

        players.push(playerData);
      }

      // Batch upsert (max 100 players)
      await this.batchUpsertPlayers(players, 100);

      this.logger.log(`Successfully synced ${players.length} players`);
    } catch (error) {
      this.logger.error(`Error syncing players: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Synchronise les matchs d'une competition
   */
  async syncMatches(competitionExternalId: string, source: string): Promise<void> {
    this.logger.log(`Starting matches sync for competition ${competitionExternalId}`);

    try {
      const competition = await this.prisma.competitions.findUnique({
        where: { externalId: competitionExternalId },
      });

      if (!competition) {
        throw new Error(`Competition ${competitionExternalId} not found`);
      }

      // Recuperer matchs depuis API
      const externalMatches = await this.apiFootballService.getFixtures(competitionExternalId);
      const matches = [];

      for (const extMatch of externalMatches) {
        // Trouver clubs locaux via externalId
        const homeClub = await this.prisma.clubs.findUnique({
          where: { externalId: extMatch.homeTeamId.toString() },
        });
        const awayClub = await this.prisma.clubs.findUnique({
          where: { externalId: extMatch.awayTeamId.toString() },
        });

        if (!homeClub || !awayClub) {
          this.logger.warn(`Skipping match: clubs not found (home: ${extMatch.homeTeamId}, away: ${extMatch.awayTeamId})`);
          continue;
        }

        matches.push({
          homeClubId: homeClub.id,
          awayClubId: awayClub.id,
          competitionId: competition.id,
          scheduledAt: extMatch.scheduledAt,
          season: competition.season || '2024-2025',
          status: extMatch.status,
          homeScore: extMatch.homeScore,
          awayScore: extMatch.awayScore,
          referee: extMatch.referee,
          round: extMatch.round,
        });
      }

      // Batch upsert (max 500 matches)
      await this.batchUpsertMatches(matches, 500);

      this.logger.log(`Successfully synced ${matches.length} matches`);
    } catch (error) {
      this.logger.error(`Error syncing matches: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Batch upsert competitions (transaction atomique)
   */
  private async batchUpsertCompetitions(competitions: any[], batchSize = 50): Promise<void> {
    for (let i = 0; i < competitions.length; i += batchSize) {
      const batch = competitions.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((comp) =>
          this.prisma.competitions.upsert({
            where: { externalId: comp.externalId },
            update: { ...comp, updatedAt: new Date() },
            create: comp,
          })
        )
      );

      this.logger.debug(`Upserted batch ${i / batchSize + 1} (${batch.length} competitions)`);
    }
  }

  /**
   * Batch upsert clubs
   */
  private async batchUpsertClubs(clubs: any[], batchSize = 100): Promise<void> {
    for (let i = 0; i < clubs.length; i += batchSize) {
      const batch = clubs.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((club) =>
          this.prisma.clubs.upsert({
            where: { externalId: club.externalId },
            update: { ...club, updatedAt: new Date() },
            create: club,
          })
        )
      );

      this.logger.debug(`Upserted batch ${i / batchSize + 1} (${batch.length} clubs)`);
    }
  }

  /**
   * Batch upsert players
   */
  private async batchUpsertPlayers(players: any[], batchSize = 100): Promise<void> {
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);

      await this.prisma.$transaction(
        batch.map((player) =>
          this.prisma.players.upsert({
            where: { externalId: player.externalId },
            update: { ...player, updatedAt: new Date() },
            create: player,
          })
        )
      );

      this.logger.debug(`Upserted batch ${i / batchSize + 1} (${batch.length} players)`);
    }
  }

  /**
   * Batch upsert matches
   */
  private async batchUpsertMatches(matches: any[], batchSize = 500): Promise<void> {
    for (let i = 0; i < matches.length; i += batchSize) {
      const batch = matches.slice(i, i + batchSize);

      // Matches n'ont pas d'externalId unique, on utilise combinaison homeClubId + awayClubId + scheduledAt
      await this.prisma.$transaction(
        batch.map((match) =>
          this.prisma.matches.upsert({
            where: {
              // Composite unique constraint
              homeClubId_awayClubId_scheduledAt: {
                homeClubId: match.homeClubId,
                awayClubId: match.awayClubId,
                scheduledAt: match.scheduledAt,
              },
            },
            update: { ...match, updatedAt: new Date() },
            create: match,
          })
        )
      );

      this.logger.debug(`Upserted batch ${i / batchSize + 1} (${batch.length} matches)`);
    }
  }

  /**
   * Trouve ou cree un User pour un joueur externe
   */
  private async findOrCreatePlayerUser(externalPlayer: any): Promise<any> {
    const email = `player_${externalPlayer.id}@arcane-sync.internal`;

    let user = await this.prisma.users.findUnique({ where: { email } });

    if (!user) {
      const firstName = externalPlayer.firstName || externalPlayer.name?.split(' ')[0] || 'Unknown';
      const lastName = externalPlayer.lastName || externalPlayer.name?.split(' ').slice(1).join(' ') || 'Player';

      user = await this.prisma.users.create({
        data: {
          id: randomUUID(),
          email,
          firstName,
          lastName,
          role: 'PLAYER',
          isActive: true,
          emailVerified: false,
          updatedAt: new Date(),
        },
      });
    }

    return user;
  }

  /**
   * Full sync: competitions + clubs + players + matches
   */
  async fullSync(competitionIds: string[]): Promise<void> {
    this.logger.log('Starting full sync process');

    try {
      // 1. Sync competitions
      await this.syncCompetitions('api-football');

      // 2. Pour chaque competition, sync clubs
      for (const compId of competitionIds) {
        await this.syncClubs(compId, 'api-football');
      }

      // 3. Pour chaque club, sync players (avec rate limiting)
      const clubs = await this.prisma.clubs.findMany({
        where: { externalSource: 'api-football' },
      });

      for (const club of clubs) {
        await this.syncPlayers(club.externalId, 'api-football');
        await this.sleep(2000); // 2s delay entre chaque club (rate limiting)
      }

      // 4. Pour chaque competition, sync matches
      for (const compId of competitionIds) {
        await this.syncMatches(compId, 'api-football');
      }

      this.logger.log('Full sync completed successfully');
    } catch (error) {
      this.logger.error(`Full sync failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
