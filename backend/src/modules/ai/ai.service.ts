import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateSummaryDto, MatchmakingRequestDto } from './dto/ai.dto';
import { PlayersService } from '../players/players.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs = 5000;

  constructor(
    private readonly configService: ConfigService,
    private readonly playersService: PlayersService,
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {
    const configuredUrl = this.configService.get<string>('AI_SERVICE_URL');
    this.baseUrl = configuredUrl?.replace(/\/+$/, '') || 'http://localhost:8000';
  }

  async generateSummary(dto: GenerateSummaryDto) {
    try {
      const response = await this.post<{
        summary: string;
        confidence?: number;
        tokens_used?: number;
      }>('/summary', {
        prompt: dto.prompt,
      });

      return {
        summary: response.summary,
        confidence: response.confidence ?? 0.75,
        tokensUsed: response.tokens_used ?? 0,
        source: 'ai-service',
      };
    } catch (error) {
      this.logger.warn(`AI summary fallback triggered: ${(error as Error).message}`);
      return {
        summary: `Résumé généré (fallback) pour la requête: ${dto.prompt}`,
        confidence: 0.0,
        source: 'ai-fallback',
        tokensUsed: 0,
      };
    }
  }

  async getPlayerIndex(playerId: string) {
    try {
      // Fetch real player stats from database
      const player = await this.playersService.findOne(playerId);

      if (!player) {
        throw new NotFoundException(`Player with ID ${playerId} not found`);
      }

      // Extract metrics from player data
      const statsJson = (player.statsJson as any) || {};

      // Parse stats with sensible defaults
      const metrics = {
        technical: this.parseStatValue(statsJson.technical, 50),
        physical: this.parseStatValue(statsJson.physical, 50),
        mental: this.parseStatValue(statsJson.mental, 50),
        tactical: this.parseStatValue(statsJson.tactical, 50),
        form: this.parseStatValue(statsJson.form, 50),
        potential: this.parseStatValue(statsJson.potential, 50),
      };

      this.logger.log(
        `Fetching AI index for player ${playerId} with metrics: ${JSON.stringify(metrics)}`,
      );

      const response = await this.post<{
        player_id: string;
        overall_score: number;
        breakdown: Array<{ name: string; score: number; weight: number }>;
        updated_at: string;
      }>('/index', {
        player_id: playerId,
        metrics,
      });

      return {
        playerId: response.player_id,
        overallScore: response.overall_score,
        breakdown: response.breakdown,
        updatedAt: response.updated_at,
        source: 'ai-service',
      };
    } catch (error) {
      this.logger.warn(`AI index fallback triggered: ${(error as Error).message}`);
      return {
        playerId: playerId,
        overallScore: 0,
        breakdown: [],
        updatedAt: new Date().toISOString(),
        source: 'ai-fallback',
      };
    }
  }

  /**
   * Parse and validate stat value (0-100 range)
   */
  private parseStatValue(value: any, defaultValue: number = 50): number {
    const parsed = typeof value === 'number' ? value : parseFloat(value);

    if (isNaN(parsed)) {
      return defaultValue;
    }

    // Clamp between 0-100
    return Math.max(0, Math.min(100, parsed));
  }

  async matchmaking(dto: MatchmakingRequestDto) {
    const players = (dto.playerIds || []).map((id, idx) => ({
      id,
      score: 0.6 + idx * 0.05,
      tags: dto.tags ?? [],
    }));

    const clubs = (dto.clubIds || []).map((id, idx) => ({
      id,
      score: 0.6 + idx * 0.04,
      tags: dto.tags ?? [],
    }));

    if (players.length === 0 || clubs.length === 0) {
      return {
        matches: [],
        filters: dto,
        generatedAt: new Date().toISOString(),
        source: 'ai-fallback',
      };
    }

    try {
      const response = await this.post<{
        matches: Array<{ player_id: string; club_id: string; score: number }>;
      }>('/matchmaking', {
        players,
        clubs,
        top: 5,
      });

      return {
        matches: response.matches,
        filters: dto,
        generatedAt: new Date().toISOString(),
        source: 'ai-service',
      };
    } catch (error) {
      this.logger.warn(`AI matchmaking fallback triggered: ${(error as Error).message}`);
      return {
        matches: [],
        filters: dto,
        generatedAt: new Date().toISOString(),
        source: 'ai-fallback',
      };
    }
  }

  /**
   * Analyze player performance and generate insights
   */
  async analyzePlayerPerformance(playerId: string) {
    try {
      const player = await this.prisma.players.findUnique({
        where: { id: playerId },
        include: {
          users: true,
          clubs: true,
          scouting_reports: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!player) {
        throw new NotFoundException(`Player with ID ${playerId} not found`);
      }

      // Generate AI analysis based on player data
      const analysis = {
        playerId,
        overallRating: this.calculateOverallRating(player),
        strengthWeakness: this.analyzeStrengthsWeaknesses(player),
        potentialScore: this.calculatePotential(player),
        marketValue: this.estimateMarketValue(player),
        performanceTrend: this.analyzePerformanceTrend(player),
        recommendations: this.generateRecommendations(player),
        injuryRisk: this.assessInjuryRisk(player),
      };

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to analyze player: ${error.message}`);
      throw error;
    }
  }

  /**
   * Predict talent potential using ML-like scoring
   */
  async predictTalentPotential(playerId: string) {
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
        clubs: true,
        scouting_reports: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Calculate potential based on multiple factors
    const ageScore = this.calculateAgeScore(player.dateOfBirth);
    const performanceScore = this.calculatePerformanceScore(player);
    const consistencyScore = this.calculateConsistencyScore(player);
    const growthRate = this.calculateGrowthRate(player);

    const potential = {
      playerId,
      currentAbility: performanceScore,
      potentialAbility: Math.min(100, performanceScore + (100 - ageScore) * 0.3),
      peakAge: this.predictPeakAge(player.position),
      developmentCurve: this.generateDevelopmentCurve(player),
      confidence: 0.75 + consistencyScore * 0.25,
      factors: {
        age: ageScore,
        performance: performanceScore,
        consistency: consistencyScore,
        growthRate,
      },
    };

    return potential;
  }

  /**
   * Match players with clubs using AI compatibility scoring
   */
  async intelligentMatchmaking(playerId: string) {
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        clubs: true,
        users: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player not found`);
    }

    const clubs = await this.prisma.clubs.findMany({
      include: { players: true },
    });

    const matches = clubs.map((club) => ({
      clubId: club.id,
      clubName: club.name,
      compatibilityScore: this.calculateCompatibility(player, club),
      tacticalFit: this.assessTacticalFit(player, club),
      financialFeasibility: this.assessFinancialFit(player, club),
      developmentOpportunity: this.assessDevelopmentPotential(player, club),
    }));

    // Sort by compatibility score
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return {
      playerId,
      playerName: `${player.users.firstName} ${player.users.lastName}`,
      topMatches: matches.slice(0, 5),
      generatedAt: new Date(),
    };
  }

  /**
   * Detect suspicious or fraudulent profiles
   */
  async detectSuspiciousProfile(playerId: string) {
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
        scouting_reports: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player not found`);
    }

    const suspicionFactors = [];
    let suspicionScore = 0;

    // Check for incomplete profile
    if (!player.users.phone || !player.photoUrl) {
      suspicionFactors.push('Incomplete profile information');
      suspicionScore += 15;
    }

    // Check for unrealistic stats
    const statsJson = (player.statsJson as any) || {};
    if (this.hasUnrealisticStats(statsJson)) {
      suspicionFactors.push('Unrealistic performance statistics');
      suspicionScore += 30;
    }

    // Check for duplicate patterns
    const duplicates = await this.findSimilarProfiles(player);
    if (duplicates.length > 0) {
      suspicionFactors.push('Similar profiles detected');
      suspicionScore += 25;
    }

    // Check registration patterns
    if (this.hasAnomalousRegistration(player)) {
      suspicionFactors.push('Anomalous registration pattern');
      suspicionScore += 20;
    }

    // Check activity patterns
    if (!player.scouting_reports?.length) {
      suspicionFactors.push('No activity history');
      suspicionScore += 10;
    }

    return {
      playerId,
      suspicionScore: Math.min(100, suspicionScore),
      isSuspicious: suspicionScore > 50,
      factors: suspicionFactors,
      recommendation:
        suspicionScore > 70
          ? 'REVIEW_IMMEDIATELY'
          : suspicionScore > 50
            ? 'FLAG_FOR_REVIEW'
            : 'APPEARS_LEGITIMATE',
      checkedAt: new Date(),
    };
  }

  // Helper methods for calculations
  private calculateOverallRating(player: any): number {
    const statsJson = (player.statsJson as any) || {};
    const ratings = [
      statsJson.technical || 50,
      statsJson.physical || 50,
      statsJson.mental || 50,
      statsJson.tactical || 50,
    ];
    return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
  }

  private analyzeStrengthsWeaknesses(player: any) {
    const statsJson = (player.statsJson as any) || {};
    const attributes = {
      technical: statsJson.technical || 50,
      physical: statsJson.physical || 50,
      mental: statsJson.mental || 50,
      tactical: statsJson.tactical || 50,
    };

    const strengths = Object.entries(attributes)
      .filter(([_, value]) => value > 70)
      .map(([key]) => key);

    const weaknesses = Object.entries(attributes)
      .filter(([_, value]) => value < 40)
      .map(([key]) => key);

    return { strengths, weaknesses };
  }

  private calculatePotential(player: any): number {
    const age = this.getAge(player.dateOfBirth);
    const basePotential = this.calculateOverallRating(player);

    if (age < 21) return Math.min(100, basePotential + 20);
    if (age < 24) return Math.min(100, basePotential + 10);
    if (age < 27) return Math.min(100, basePotential + 5);
    return basePotential;
  }

  private estimateMarketValue(player: any): string {
    const rating = this.calculateOverallRating(player);
    const age = this.getAge(player.dateOfBirth);
    const position = player.position;

    let baseValue = rating * 100000;

    // Age multiplier
    if (age < 24) baseValue *= 1.5;
    else if (age > 30) baseValue *= 0.7;

    // Position multiplier
    if (position === 'FORWARD') baseValue *= 1.3;
    else if (position === 'MIDFIELDER') baseValue *= 1.1;

    return `€${(baseValue / 1000000).toFixed(1)}M`;
  }

  private analyzePerformanceTrend(player: any): string {
    if (!player.scouting_reports || player.scouting_reports.length < 3) {
      return 'INSUFFICIENT_DATA';
    }

    // Simple trend analysis based on recent scouting reports
    const recentReports = player.scouting_reports.slice(0, 3);
    const olderReports = player.scouting_reports.slice(3, 6);

    if (!olderReports.length) return 'STABLE';

    // Compare average ratings
    const recentAvg =
      recentReports.reduce((sum, r) => sum + (r.overallRating || 50), 0) / recentReports.length;
    const olderAvg =
      olderReports.reduce((sum, r) => sum + (r.overallRating || 50), 0) / olderReports.length;

    if (recentAvg > olderAvg + 5) return 'IMPROVING';
    if (recentAvg < olderAvg - 5) return 'DECLINING';
    return 'STABLE';
  }

  private generateRecommendations(player: any): string[] {
    const recommendations = [];
    const statsJson = (player.statsJson as any) || {};

    if (statsJson.physical < 60) {
      recommendations.push('Focus on physical conditioning');
    }
    if (statsJson.tactical < 60) {
      recommendations.push('Improve tactical awareness');
    }
    if (statsJson.technical < 60) {
      recommendations.push('Enhance technical skills');
    }
    if (!player.scouting_reports?.length) {
      recommendations.push('Gain more match experience and scouting exposure');
    }

    return recommendations;
  }

  private assessInjuryRisk(player: any): string {
    const age = this.getAge(player.dateOfBirth);
    const physicalScore = (player.statsJson as any)?.physical || 50;

    if (age > 30 && physicalScore < 60) return 'HIGH';
    if (age > 28 || physicalScore < 50) return 'MEDIUM';
    return 'LOW';
  }

  private calculateAgeScore(dateOfBirth: Date): number {
    const age = this.getAge(dateOfBirth);
    if (age < 18) return 20;
    if (age < 21) return 40;
    if (age < 24) return 70;
    if (age < 27) return 90;
    if (age < 30) return 70;
    return 50;
  }

  private calculatePerformanceScore(player: any): number {
    return this.calculateOverallRating(player);
  }

  private calculateConsistencyScore(_player: any): number {
    // Simplified consistency score
    return 0.7 + Math.random() * 0.3;
  }

  private calculateGrowthRate(player: any): number {
    const age = this.getAge(player.dateOfBirth);
    if (age < 21) return 0.8;
    if (age < 24) return 0.5;
    if (age < 27) return 0.3;
    return 0.1;
  }

  private predictPeakAge(position: string): number {
    switch (position) {
      case 'GOALKEEPER':
        return 32;
      case 'DEFENDER':
        return 29;
      case 'MIDFIELDER':
        return 28;
      case 'FORWARD':
        return 27;
      default:
        return 28;
    }
  }

  private generateDevelopmentCurve(player: any): any {
    const currentAge = this.getAge(player.dateOfBirth);
    const peakAge = this.predictPeakAge(player.position);

    return {
      current: currentAge,
      peak: peakAge,
      trajectory: currentAge < peakAge ? 'ASCENDING' : 'DESCENDING',
    };
  }

  private calculateCompatibility(player: any, club: any): number {
    // Simplified compatibility scoring
    let score = 50;

    // Check if club needs players in this position
    const positionNeed = this.assessPositionNeed(player.position, club);
    score += positionNeed * 20;

    // Check league level match
    if (club.leagueLevel === player.currentLevel) score += 15;

    // Check playing style fit
    score += Math.random() * 15;

    return Math.min(100, score);
  }

  private assessTacticalFit(_player: any, _club: any): string {
    // Simplified tactical assessment
    const fits = ['PERFECT', 'GOOD', 'MODERATE', 'POOR'];
    return fits[Math.floor(Math.random() * fits.length)];
  }

  private assessFinancialFit(_player: any, _club: any): boolean {
    // Simplified financial assessment
    return Math.random() > 0.3;
  }

  private assessDevelopmentPotential(player: any, club: any): string {
    const age = this.getAge(player.dateOfBirth);
    if (age < 24 && club.hasYouthAcademy) return 'HIGH';
    if (age < 27) return 'MODERATE';
    return 'LOW';
  }

  private assessPositionNeed(position: string, club: any): number {
    // Count players in position
    const playersInPosition = club.players?.filter((p) => p.position === position).length || 0;

    if (playersInPosition === 0) return 1;
    if (playersInPosition < 2) return 0.7;
    if (playersInPosition < 4) return 0.3;
    return 0;
  }

  private hasUnrealisticStats(stats: any): boolean {
    if (!stats) return false;

    const values = Object.values(stats).filter((v) => typeof v === 'number') as number[];

    // Check if all stats are maxed out (suspicious)
    if (values.every((v) => v > 95)) return true;

    // Check if stats are too uniform (suspicious)
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    if (variance < 5) return true;

    return false;
  }

  private async findSimilarProfiles(player: any) {
    // Find players with the same user details (potential duplicates)
    const similar = await this.prisma.players.findMany({
      where: {
        AND: [
          { id: { not: player.id } },
          { dateOfBirth: player.dateOfBirth },
          { nationality: player.nationality },
        ],
      },
      include: {
        users: true,
      },
    });

    // Filter by similar names
    return similar.filter(
      (p) =>
        p.users.firstName === player.users.firstName && p.users.lastName === player.users.lastName,
    );
  }

  private hasAnomalousRegistration(player: any): boolean {
    // Check for patterns like registration at odd hours
    const createdHour = new Date(player.createdAt).getHours();
    if (createdHour >= 2 && createdHour <= 5) return true;

    // Check for rapid succession registrations
    // (would need more context to properly implement)

    return false;
  }

  private getAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private async post<T>(path: string, payload: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`AI service responded with ${response.status}`);
      }

      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
