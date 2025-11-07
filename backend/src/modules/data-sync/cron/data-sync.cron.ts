import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSyncService } from '../data-sync.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DataSyncCron {
  private readonly logger = new Logger(DataSyncCron.name);

  constructor(
    private dataSyncService: DataSyncService,
    private prisma: PrismaService,
  ) {}

  /**
   * Sync competitions (1x par mois)
   * Tous les 1er du mois a 02:00
   */
  @Cron('0 2 1 * *')
  async syncCompetitionsMonthly() {
    this.logger.log('Starting monthly competitions sync');
    try {
      await this.dataSyncService.syncCompetitions('api-football');
    } catch (error) {
      this.logger.error('Monthly competitions sync failed', error.stack);
    }
  }

  /**
   * Sync clubs (1x par semaine)
   * Tous les lundis a 03:00
   */
  @Cron('0 3 * * 1')
  async syncClubsWeekly() {
    this.logger.log('Starting weekly clubs sync');
    try {
      const competitions = ['61', '39', '78', '135', '140']; // Top 5 ligues
      for (const compId of competitions) {
        await this.dataSyncService.syncClubs(compId, 'api-football');
      }
    } catch (error) {
      this.logger.error('Weekly clubs sync failed', error.stack);
    }
  }

  /**
   * Sync players (1x par semaine)
   * Tous les lundis a 04:00
   */
  @Cron('0 4 * * 1')
  async syncPlayersWeekly() {
    this.logger.log('Starting weekly players sync');
    try {
      // Recuperer tous les clubs avec externalId
      const clubs = await this.prisma.clubs.findMany({
        where: { externalSource: 'api-football' },
        select: { externalId: true },
      });

      for (const club of clubs) {
        await this.dataSyncService.syncPlayers(club.externalId, 'api-football');
        await this.sleep(2000); // 2s delay (rate limiting)
      }
    } catch (error) {
      this.logger.error('Weekly players sync failed', error.stack);
    }
  }

  /**
   * Sync matches (daily)
   * Tous les jours a 06:00
   */
  @Cron('0 6 * * *')
  async syncMatchesDaily() {
    this.logger.log('Starting daily matches sync');
    try {
      const competitions = ['61', '39', '78', '135', '140'];
      for (const compId of competitions) {
        await this.dataSyncService.syncMatches(compId, 'api-football');
      }
    } catch (error) {
      this.logger.error('Daily matches sync failed', error.stack);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
