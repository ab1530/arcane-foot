import { Injectable, Logger, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { firstValueFrom } from 'rxjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import {
  PlayerValuationDto,
  ValuationTrendDto,
  ComparePlayersResponseDto,
  PlayerComparisonDto,
} from './dto';

@Injectable()
export class MarketValueService {
  private readonly logger = new Logger(MarketValueService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8001';
  }

  /**
   * Get player valuation from ML service
   */
  async getPlayerValuation(playerId: string): Promise<PlayerValuationDto> {
    try {
      // Check cache first
      const cacheKey = `valuation:${playerId}`;
      const cached = await this.cacheManager.get<PlayerValuationDto>(cacheKey);
      if (cached) {
        this.logger.debug(`Returning cached valuation for player ${playerId}`);
        return cached;
      }

      // Fetch player data with scouting reports
      const player = await this.prisma.players.findUnique({
        where: { id: playerId },
        include: {
          scouting_reports: {
            select: {
              overallRating: true,
              technicalRating: true,
              physicalRating: true,
              mentalRating: true,
              tacticalRating: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 20,
          },
          clubs: {
            select: {
              name: true,
              country: true,
            },
          },
        },
      });

      if (!player) {
        throw new HttpException('Player not found', HttpStatus.NOT_FOUND);
      }

      // Calculate age
      const age = player.dateOfBirth
        ? Math.floor(
            (Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000),
          )
        : 25;

      // Aggregate statistics from scouting reports
      const appearances = player.scouting_reports.length;

      // Use overall rating from scouting reports
      const avgRating =
        appearances > 0
          ? player.scouting_reports.reduce((sum, sr) => sum + (sr.overallRating || 0), 0) /
            appearances
          : 6.5;

      // Get scout ratings for ML model
      const scoutRatings = player.scouting_reports
        .map((sr) => sr.overallRating)
        .filter((r) => r !== null && r !== undefined);

      // Estimate goals and assists based on position and ratings
      // This is a rough approximation since we don't have match participation data
      const goals = this.estimateGoalsFromReports(player.position, player.scouting_reports);
      const assists = this.estimateAssistsFromReports(player.position, player.scouting_reports);

      // Determine league from club
      const league = player.clubs ? this.getLeagueFromCountry(player.clubs.country) : 'Unknown';

      // Prepare features for ML service
      const features = {
        age,
        position: player.position || 'MID',
        league,
        goals,
        assists,
        appearances,
        rating: avgRating,
        height: player.height,
        weight: player.weight,
        nationality: player.nationality || 'Unknown',
        contract_years_remaining: this.calculateContractYears(player.contractUntil),
        scout_ratings: scoutRatings,
      };

      // Call AI service
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/predict`, features),
      );

      const valuation: PlayerValuationDto = {
        estimatedValue: response.data.estimated_value,
        confidenceInterval: response.data.confidence_interval,
        confidenceScore: response.data.confidence_score,
        factors: response.data.factors,
        comparablePlayers: response.data.comparable_players,
        modelVersion: response.data.model_version,
        playerId,
        timestamp: new Date(),
      };

      // Store in history
      await this.updateValuationHistory(playerId, valuation);

      // Cache the result (24 hours)
      await this.cacheManager.set(cacheKey, valuation, 86400000);

      this.logger.log(`Valuation calculated for player ${playerId}: €${valuation.estimatedValue}M`);

      return valuation;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(`Error getting valuation for player ${playerId}:`, error.message);

      // If AI service is down, try to get last known valuation
      const lastValuation = await this.prisma.player_valuations.findFirst({
        where: { playerId },
        orderBy: { createdAt: 'desc' },
      });

      if (lastValuation) {
        this.logger.warn('AI service unavailable, returning last known valuation');
        return {
          estimatedValue: lastValuation.estimatedValue,
          confidenceInterval: {
            low: lastValuation.confidenceLow,
            high: lastValuation.confidenceHigh,
          },
          confidenceScore: lastValuation.confidenceScore,
          factors: lastValuation.factors as Record<string, number>,
          comparablePlayers: [],
          modelVersion: lastValuation.modelVersion,
          playerId: lastValuation.playerId,
          timestamp: lastValuation.createdAt,
        };
      }

      throw new HttpException(
        'Could not calculate player valuation',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Update valuation history in database
   */
  async updateValuationHistory(playerId: string, valuation: PlayerValuationDto): Promise<void> {
    try {
      await this.prisma.player_valuations.create({
        data: {
          id: randomUUID(),
          playerId,
          estimatedValue: valuation.estimatedValue,
          confidenceLow: valuation.confidenceInterval.low,
          confidenceHigh: valuation.confidenceInterval.high,
          confidenceScore: valuation.confidenceScore,
          factors: valuation.factors,
          modelVersion: valuation.modelVersion,
        },
      });
    } catch (error) {
      this.logger.error('Error updating valuation history:', error.message);
    }
  }

  /**
   * Get valuation trend for a player
   */
  async getValuationTrend(playerId: string): Promise<ValuationTrendDto> {
    try {
      // Get historical valuations
      const valuations = await this.prisma.player_valuations.findMany({
        where: { playerId },
        orderBy: { createdAt: 'desc' },
        take: 12, // Last 12 valuations
      });

      if (valuations.length === 0) {
        // No history, get current valuation
        const current = await this.getPlayerValuation(playerId);
        return {
          playerId,
          valuations: [
            {
              timestamp: current.timestamp,
              value: current.estimatedValue,
              confidence: current.confidenceScore,
              modelVersion: current.modelVersion,
            },
          ],
          currentValue: current.estimatedValue,
          previousValue: current.estimatedValue,
          changePercent: 0,
          trend: 'stable',
        };
      }

      const currentValue = valuations[0].estimatedValue;
      const previousValue = valuations.length > 1 ? valuations[1].estimatedValue : currentValue;
      const changePercent =
        previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

      let trend: 'up' | 'down' | 'stable';
      if (changePercent > 5) trend = 'up';
      else if (changePercent < -5) trend = 'down';
      else trend = 'stable';

      return {
        playerId,
        valuations: valuations.reverse().map((v) => ({
          timestamp: v.createdAt,
          value: v.estimatedValue,
          confidence: v.confidenceScore,
          modelVersion: v.modelVersion,
        })),
        currentValue,
        previousValue,
        changePercent: Math.round(changePercent * 10) / 10,
        trend,
      };
    } catch (error) {
      this.logger.error('Error getting valuation trend:', error.message);
      throw new HttpException(
        'Could not retrieve valuation trend',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Compare valuations of multiple players
   */
  async compareValuations(playerIds: string[]): Promise<ComparePlayersResponseDto> {
    try {
      if (playerIds.length > 10) {
        throw new HttpException('Maximum 10 players can be compared', HttpStatus.BAD_REQUEST);
      }

      // Get valuations for all players
      const comparisons: PlayerComparisonDto[] = await Promise.all(
        playerIds.map(async (playerId) => {
          const valuation = await this.getPlayerValuation(playerId);

          // Get player basic info
          const player = await this.prisma.players.findUnique({
            where: { id: playerId },
            include: {
              users: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              scouting_reports: {
                select: {
                  overallRating: true,
                },
                take: 10,
              },
            },
          });

          const appearances = player.scouting_reports.length;
          const goals = this.estimateGoalsFromReports(player.position, player.scouting_reports);
          const assists = this.estimateAssistsFromReports(player.position, player.scouting_reports);
          const avgRating =
            appearances > 0
              ? player.scouting_reports.reduce((sum, sr) => sum + (sr.overallRating || 0), 0) /
                appearances
              : 0;

          const age = player.dateOfBirth
            ? Math.floor(
                (Date.now() - new Date(player.dateOfBirth).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000),
              )
            : 25;

          return {
            playerId,
            playerName: `${player.users.firstName} ${player.users.lastName}`,
            age,
            position: player.position || 'MID',
            estimatedValue: valuation.estimatedValue,
            confidenceScore: valuation.confidenceScore,
            appearances,
            goals,
            assists,
            rating: Math.round(avgRating * 10) / 10,
          };
        }),
      );

      // Calculate statistics
      const values = comparisons.map((c) => c.estimatedValue);
      const highestValue = Math.max(...values);
      const highestValuePlayerId = comparisons.find(
        (c) => c.estimatedValue === highestValue,
      ).playerId;
      const averageValue = values.reduce((sum, v) => sum + v, 0) / values.length;

      // Calculate standard deviation
      const variance =
        values.reduce((sum, v) => sum + Math.pow(v - averageValue, 2), 0) / values.length;
      const valueStdDev = Math.sqrt(variance);

      return {
        players: comparisons,
        highestValuePlayerId,
        highestValue: Math.round(highestValue * 100) / 100,
        averageValue: Math.round(averageValue * 100) / 100,
        valueStdDev: Math.round(valueStdDev * 100) / 100,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error comparing players:', error.message);
      throw new HttpException('Could not compare players', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Trigger model retraining (admin only)
   */
  async triggerModelRetrain(): Promise<any> {
    try {
      this.logger.log('Triggering ML model retraining...');

      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/train`, {
          force_retrain: true,
        }),
      );

      this.logger.log('Model retraining completed successfully');

      // Note: Cache doesn't have a reset() method in this version
      // Cached valuations will expire after 24 hours
      this.logger.warn(
        'Cache cannot be programmatically cleared - valuations will expire after 24h',
      );

      return response.data;
    } catch (error) {
      this.logger.error('Error triggering model retrain:', error.message);
      throw new HttpException('Could not trigger model retraining', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Check AI service health
   */
  async checkAIServiceHealth(): Promise<any> {
    try {
      const response = await firstValueFrom(this.httpService.get(`${this.aiServiceUrl}/health`));
      return response.data;
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Helper: Estimate goals from scouting reports based on position
   */
  private estimateGoalsFromReports(position: string, reports: any[]): number {
    if (reports.length === 0) return 0;

    const positionMultipliers = {
      FWD: 0.4,
      ST: 0.5,
      MID: 0.2,
      DEF: 0.05,
      GK: 0,
    };

    const multiplier = positionMultipliers[position] || 0.2;
    const avgTechnical =
      reports.reduce((sum, r) => sum + (r.technicalRating || 7), 0) / reports.length;

    return Math.round((reports.length * multiplier * avgTechnical) / 7);
  }

  /**
   * Helper: Estimate assists from scouting reports based on position
   */
  private estimateAssistsFromReports(position: string, reports: any[]): number {
    if (reports.length === 0) return 0;

    const positionMultipliers = {
      FWD: 0.2,
      ST: 0.15,
      MID: 0.35,
      DEF: 0.1,
      GK: 0,
    };

    const multiplier = positionMultipliers[position] || 0.2;
    const avgTactical =
      reports.reduce((sum, r) => sum + (r.tacticalRating || 7), 0) / reports.length;

    return Math.round((reports.length * multiplier * avgTactical) / 7);
  }

  /**
   * Helper: Get league name from country
   */
  private getLeagueFromCountry(country: string): string {
    const leagueMap = {
      England: 'Premier League',
      Spain: 'LaLiga',
      Italy: 'Serie A',
      Germany: 'Bundesliga',
      France: 'Ligue 1',
      Portugal: 'Primeira Liga',
      Netherlands: 'Eredivisie',
      USA: 'MLS',
      Mexico: 'Liga MX',
    };

    return leagueMap[country] || 'Other';
  }

  /**
   * Helper: Calculate contract years remaining
   */
  private calculateContractYears(contractUntil: Date | null): number {
    if (!contractUntil) return 2.0; // Default

    const now = new Date();
    const contract = new Date(contractUntil);
    const yearsRemaining = (contract.getTime() - now.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

    return Math.max(0, Math.min(yearsRemaining, 5));
  }
}
