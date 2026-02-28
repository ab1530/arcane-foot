import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service';
import { MatchStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import {
  PerformancePredictionDto,
  PredictionRequestDto,
  AccuracyMetricsDto,
  FeatureImportanceDto,
} from './dto/performance-prediction.dto';

@Injectable()
export class PerformancePredictorService {
  private readonly logger = new Logger(PerformancePredictorService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Predict performance for a single player in an upcoming match
   */
  async predictPerformance(playerId: string, matchId: string): Promise<PerformancePredictionDto> {
    this.logger.log(`Predicting performance for player ${playerId} in match ${matchId}`);

    // Fetch player with history
    const player = await this.getPlayerWithDetails(playerId);
    if (!player) {
      throw new HttpException('Player not found', HttpStatus.NOT_FOUND);
    }

    // Fetch match context
    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        clubs_matches_homeClubIdToclubs: true,
        clubs_matches_awayClubIdToclubs: true,
        competitions: true,
      },
    });

    if (!match) {
      throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
    }

    // Calculate recent form
    const recentForm = await this.calculateRecentForm(playerId);

    // Get season stats
    const seasonStats = await this.getSeasonStats(playerId, match.season);

    // Prepare request for AI service
    const opponentStrength =
      player.clubId && (player.clubId === match.homeClubId || player.clubId === match.awayClubId)
        ? await this.calculateOpponentStrength(match, player.clubId)
        : 3;

    const requestData: PredictionRequestDto = {
      playerId: player.id,
      matchContext: {
        venue: player.clubId === match.homeClubId ? 'home' : 'away',
        importance: this.getMatchImportance(match),
        opponent_strength: opponentStrength,
        days_rest: await this.getDaysSinceLastMatch(playerId),
        season_progress: this.getSeasonProgress(match.scheduledAt),
        playing_position: player.position,
      },
      recentForm,
      seasonStats,
      playerAttributes: {
        age: this.calculateAge(player.dateOfBirth),
        height: player.height || 180,
        weight: player.weight || 75,
        market_value: player.marketValue || 0,
        position: player.position,
      },
    };

    // Call AI service
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/performance/predict`, requestData),
      );

      const prediction: PerformancePredictionDto = response.data;

      // Store prediction in database
      await this.storePrediction(playerId, matchId, prediction);

      return prediction;
    } catch (error) {
      this.logger.error(`AI service error: ${error.message}`, error.stack);
      throw new HttpException('Prediction service unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Batch predict for all players in a match
   */
  async batchPredictForMatch(matchId: string): Promise<PerformancePredictionDto[]> {
    this.logger.log(`Batch predicting for match ${matchId}`);

    // Get all players who might play in this match
    const match = await this.prisma.matches.findUnique({
      where: { id: matchId },
      include: {
        clubs_matches_homeClubIdToclubs: {
          include: { players: true },
        },
        clubs_matches_awayClubIdToclubs: {
          include: { players: true },
        },
      },
    });

    if (!match) {
      throw new HttpException('Match not found', HttpStatus.NOT_FOUND);
    }

    const homePlayers = match.clubs_matches_homeClubIdToclubs.players || [];
    const awayPlayers = match.clubs_matches_awayClubIdToclubs.players || [];
    const allPlayers = [...homePlayers, ...awayPlayers];

    // Predict for each player
    const predictions = await Promise.all(
      allPlayers.map((player) => this.predictPerformance(player.id, matchId)),
    );

    return predictions;
  }

  private async calculateOpponentStrength(match: any, playerClubId: string): Promise<number> {
    const opponentClubId = playerClubId === match.homeClubId ? match.awayClubId : match.homeClubId;

    if (!opponentClubId) {
      return 3;
    }

    const completedMatches = await this.prisma.matches.findMany({
      where: {
        season: match.season,
        status: MatchStatus.COMPLETED,
        OR: [{ homeClubId: opponentClubId }, { awayClubId: opponentClubId }],
        homeScore: { not: null },
        awayScore: { not: null },
      },
      select: {
        homeClubId: true,
        awayClubId: true,
        homeScore: true,
        awayScore: true,
      },
    });

    if (completedMatches.length === 0) {
      return 3;
    }

    let points = 0;
    for (const completed of completedMatches) {
      const isHome = completed.homeClubId === opponentClubId;
      const homeScore = completed.homeScore ?? 0;
      const awayScore = completed.awayScore ?? 0;

      if (homeScore === awayScore) {
        points += 1;
      } else if ((isHome && homeScore > awayScore) || (!isHome && awayScore > homeScore)) {
        points += 3;
      }
    }

    const maxPoints = completedMatches.length * 3;
    const ratio = maxPoints > 0 ? points / maxPoints : 0.5;
    const normalized = 1 + ratio * 4;

    return Number(normalized.toFixed(1));
  }

  /**
   * Get historical prediction accuracy
   */
  async getAccuracy(playerId?: string, dateRange?: string): Promise<AccuracyMetricsDto[]> {
    const where: any = {
      ...(playerId && { playerId }),
      ...(dateRange && { dateRange }),
    };

    const accuracyLogs = await this.prisma.prediction_accuracy_log.findMany({
      where,
      orderBy: { calculatedAt: 'desc' },
      take: 10,
    });

    return accuracyLogs.map((log) => ({
      totalPredictions: log.totalPredictions,
      avgError: log.avgError,
      rmse: log.rmse,
      withinCI: log.withinCI,
      r2Score: log.r2Score || undefined,
      dateRange: log.dateRange,
      modelVersion: log.modelVersion,
    }));
  }

  /**
   * Get feature importance from AI service
   */
  async getFeatureImportance(): Promise<FeatureImportanceDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.aiServiceUrl}/performance/feature-importance`),
      );

      return response.data.features;
    } catch (error) {
      this.logger.error(`Failed to get feature importance: ${error.message}`);
      throw new HttpException('Feature importance unavailable', HttpStatus.SERVICE_UNAVAILABLE);
    }
  }

  /**
   * Retrain model with latest data
   */
  async retrainModel(): Promise<any> {
    this.logger.log('Triggering model retraining...');

    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/performance/train`, {}),
      );

      this.logger.log('Model retrained successfully');
      return response.data;
    } catch (error) {
      this.logger.error(`Model retraining failed: ${error.message}`, error.stack);
      throw new HttpException('Model retraining failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private async getPlayerWithDetails(playerId: string) {
    return this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        clubs: true,
        scouting_reports: {
          where: {
            status: { in: ['SUBMITTED', 'REVIEWED', 'APPROVED'] },
            overallRating: { not: null },
          },
          orderBy: { submittedAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  private async calculateRecentForm(playerId: string): Promise<number[]> {
    const recentReports = await this.prisma.scouting_reports.findMany({
      where: {
        playerId,
        status: { in: ['SUBMITTED', 'REVIEWED', 'APPROVED'] },
        overallRating: { not: null },
      },
      orderBy: { submittedAt: 'desc' },
      take: 10,
      select: { overallRating: true },
    });

    return recentReports.map((r) => r.overallRating).filter((rating) => rating !== null);
  }

  private async getSeasonStats(playerId: string, season: string) {
    const seasonReports = await this.prisma.scouting_reports.findMany({
      where: {
        playerId,
        matches: { season },
        status: { in: ['SUBMITTED', 'REVIEWED', 'APPROVED'] },
        overallRating: { not: null },
      },
      select: {
        technicalRating: true,
        tacticalRating: true,
        physicalRating: true,
        mentalRating: true,
        playerMinutesPlayed: true,
      },
    });

    if (seasonReports.length === 0) {
      return {
        avg_minutes: 90,
        technical_rating: 6.5,
        tactical_rating: 6.5,
        physical_rating: 6.5,
        mental_rating: 6.5,
      };
    }

    const avgTechnical = this.avg(
      seasonReports.map((r) => r.technicalRating).filter((v) => v !== null),
    );
    const avgTactical = this.avg(
      seasonReports.map((r) => r.tacticalRating).filter((v) => v !== null),
    );
    const avgPhysical = this.avg(
      seasonReports.map((r) => r.physicalRating).filter((v) => v !== null),
    );
    const avgMental = this.avg(seasonReports.map((r) => r.mentalRating).filter((v) => v !== null));
    const avgMinutes = this.avg(
      seasonReports.map((r) => r.playerMinutesPlayed).filter((v) => v !== null),
    );

    return {
      avg_minutes: avgMinutes || 90,
      technical_rating: avgTechnical || 6.5,
      tactical_rating: avgTactical || 6.5,
      physical_rating: avgPhysical || 6.5,
      mental_rating: avgMental || 6.5,
    };
  }

  private getMatchImportance(match: any): number {
    const competitionMap: Record<string, number> = {
      'UEFA Champions League': 5,
      'UEFA Europa League': 4,
      'Primera División': 4,
      'Premier League': 4,
      'Serie A': 4,
      Bundesliga: 4,
      'Ligue 1': 4,
      'FA Cup': 3,
      'Copa del Rey': 3,
    };

    return competitionMap[match.competitions?.name] || 3;
  }

  private async getDaysSinceLastMatch(playerId: string): Promise<number> {
    const lastMatch = await this.prisma.scouting_reports.findFirst({
      where: {
        playerId,
        status: { in: ['SUBMITTED', 'REVIEWED', 'APPROVED'] },
      },
      orderBy: { submittedAt: 'desc' },
      include: { matches: true },
    });

    if (!lastMatch) return 7; // Default to 1 week

    const daysSince = Math.floor(
      (Date.now() - new Date(lastMatch.matches.scheduledAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    return Math.max(0, Math.min(30, daysSince));
  }

  private getSeasonProgress(matchDate: Date): number {
    const dayOfYear = this.getDayOfYear(new Date(matchDate));
    return dayOfYear / 365;
  }

  private getDayOfYear(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private avg(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async storePrediction(
    playerId: string,
    matchId: string,
    prediction: PerformancePredictionDto,
  ) {
    await this.prisma.performance_predictions.upsert({
      where: {
        playerId_matchId: { playerId, matchId },
      },
      create: {
        id: `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        playerId,
        matchId,
        predictedRating: prediction.predictedRating,
        confidenceLow: prediction.confidenceInterval[0],
        confidenceHigh: prediction.confidenceInterval[1],
        confidenceScore: prediction.confidence,
        ratingDistribution: prediction.ratingDistribution as any,
        keyFactors: prediction.keyFactors as any,
        recommendations: prediction.recommendations,
        modelVersion: 'v1',
      },
      update: {
        predictedRating: prediction.predictedRating,
        confidenceLow: prediction.confidenceInterval[0],
        confidenceHigh: prediction.confidenceInterval[1],
        confidenceScore: prediction.confidence,
        ratingDistribution: prediction.ratingDistribution as any,
        keyFactors: prediction.keyFactors as any,
        recommendations: prediction.recommendations,
        predictedAt: new Date(),
      },
    });
  }

  // ==========================================
  // ACCURACY TRACKING (CRON JOB)
  // ==========================================

  /**
   * Daily job to update prediction accuracy
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateAccuracyMetrics() {
    this.logger.log('Running daily accuracy metrics update...');

    try {
      // Find completed matches with predictions
      const predictions = await this.prisma.performance_predictions.findMany({
        where: {
          predictionError: null,
          matches: { status: 'COMPLETED' },
        },
        include: {
          matches: {
            include: {
              scouting_reports: {
                where: {
                  status: { in: ['SUBMITTED', 'REVIEWED', 'APPROVED'] },
                  overallRating: { not: null },
                },
              },
            },
          },
        },
      });

      for (const prediction of predictions) {
        // Find actual rating from scouting report
        const actualReport = prediction.matches.scouting_reports.find(
          (r) => r.playerId === prediction.playerId,
        );

        if (actualReport && actualReport.overallRating !== null) {
          const error = Math.abs(prediction.predictedRating - actualReport.overallRating);

          // Update prediction with actual rating
          await this.prisma.performance_predictions.update({
            where: { id: prediction.id },
            data: {
              actualRating: actualReport.overallRating,
              predictionError: error,
            },
          });

          this.logger.log(
            `Updated prediction ${prediction.id} with actual rating ${actualReport.overallRating}`,
          );
        }
      }

      // Calculate monthly aggregates
      await this.calculateMonthlyAccuracy();

      this.logger.log('Accuracy metrics updated successfully');
    } catch (error) {
      this.logger.error(`Failed to update accuracy metrics: ${error.message}`, error.stack);
    }
  }

  private async calculateMonthlyAccuracy() {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get all predictions for current month with actual ratings
    const predictions = await this.prisma.performance_predictions.findMany({
      where: {
        predictedAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1),
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        },
        actualRating: { not: null },
        predictionError: { not: null },
      },
    });

    if (predictions.length === 0) return;

    // Calculate metrics
    const errors = predictions.map((p) => p.predictionError);
    const withinCI = predictions.filter(
      (p) => p.actualRating >= p.confidenceLow && p.actualRating <= p.confidenceHigh,
    ).length;

    const avgError = this.avg(errors);
    const rmse = Math.sqrt(this.avg(errors.map((e) => e * e)));
    const withinCIPercent = withinCI / predictions.length;

    // Store aggregate metrics
    await this.prisma.prediction_accuracy_log.upsert({
      where: {
        playerId_dateRange_modelVersion: {
          playerId: null,
          dateRange: currentMonth,
          modelVersion: 'v1',
        },
      },
      create: {
        id: `acc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateRange: currentMonth,
        totalPredictions: predictions.length,
        avgError,
        rmse,
        withinCI: withinCIPercent,
        modelVersion: 'v1',
      },
      update: {
        totalPredictions: predictions.length,
        avgError,
        rmse,
        withinCI: withinCIPercent,
      },
    });

    this.logger.log(
      `Monthly accuracy (${currentMonth}): MAE=${avgError.toFixed(2)}, RMSE=${rmse.toFixed(2)}, WithinCI=${(withinCIPercent * 100).toFixed(1)}%`,
    );
  }
}
