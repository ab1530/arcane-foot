import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  PlayingStyle,
  PlayStyleProfile,
  RadarChartData,
  PlayerAttributes,
  PlayerComparison,
  SimilarPlayer,
} from './dto/playstyle-dna.dto';

@Injectable()
export class PlaystyleDnaService {
  private readonly logger = new Logger(PlaystyleDnaService.name);
  private readonly mlServiceUrl: string;
  private readonly cacheTimeout = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.mlServiceUrl = this.configService.get<string>('ML_SERVICE_URL') || 'http://localhost:8001';
  }

  /**
   * Classify a player's playing style using ML
   */
  async classifyPlayer(playerId: string): Promise<PlayStyleProfile> {
    // Check cache first
    const cacheKey = `playstyle:${playerId}`;
    const cached = await this.cacheManager.get<PlayStyleProfile>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for player ${playerId}`);
      return cached;
    }

    // Fetch player data
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
        scouting_reports: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Extract attributes
    const attributes = this.extractPlayerAttributes(player);

    // Call ML service for classification
    let mlResponse;
    try {
      mlResponse = await this.callMLService(attributes);
    } catch (error) {
      this.logger.warn(`ML service unavailable, using fallback classification: ${error.message}`);
      mlResponse = this.fallbackClassification(attributes, player.position);
    }

    // Build profile
    const profile: PlayStyleProfile = {
      primaryStyle: mlResponse.primaryStyle,
      secondaryStyle: mlResponse.secondaryStyle,
      confidence: mlResponse.confidence,
      styleScores: mlResponse.styleScores,
      radarData: this.generateRadarData(attributes),
      attributes,
    };

    // Cache result
    await this.cacheManager.set(cacheKey, profile, this.cacheTimeout);

    return profile;
  }

  /**
   * Calculate DNA profile for a player
   */
  async calculateDNAProfile(playerId: string): Promise<PlayStyleProfile> {
    return this.classifyPlayer(playerId);
  }

  /**
   * Find similar players based on playing style
   */
  async findSimilarPlayers(playerId: string, limit: number = 10): Promise<SimilarPlayer[]> {
    const targetPlayer = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: { users: true },
    });

    if (!targetPlayer) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Get target player's profile
    const targetProfile = await this.classifyPlayer(playerId);

    // Get all players in similar position
    const candidates = await this.prisma.players.findMany({
      where: {
        position: targetPlayer.position,
        id: { not: playerId },
      },
      include: { users: true },
      take: 100, // Limit search space
    });

    // Calculate similarity for each candidate
    const similarities = await Promise.all(
      candidates.map(async (candidate) => {
        try {
          const candidateProfile = await this.classifyPlayer(candidate.id);
          const similarityScore = this.calculateSimilarity(targetProfile, candidateProfile);
          const sharedAttributes = this.identifySharedAttributes(targetProfile, candidateProfile);

          return {
            id: candidate.id,
            name: `${candidate.users.firstName} ${candidate.users.lastName}`,
            position: candidate.position,
            similarityScore,
            playingStyle: candidateProfile.primaryStyle,
            sharedAttributes,
          };
        } catch (error) {
          this.logger.warn(`Failed to process candidate ${candidate.id}: ${error.message}`);
          return null;
        }
      }),
    );

    // Filter nulls and sort by similarity
    return similarities
      .filter((s): s is SimilarPlayer => s !== null)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  /**
   * Compare two players' playing styles
   */
  async comparePlayers(player1Id: string, player2Id: string): Promise<PlayerComparison> {
    const [player1, player2] = await Promise.all([
      this.prisma.players.findUnique({
        where: { id: player1Id },
        include: { users: true },
      }),
      this.prisma.players.findUnique({
        where: { id: player2Id },
        include: { users: true },
      }),
    ]);

    if (!player1 || !player2) {
      throw new NotFoundException('One or both players not found');
    }

    const [profile1, profile2] = await Promise.all([
      this.classifyPlayer(player1Id),
      this.classifyPlayer(player2Id),
    ]);

    const similarityScore = this.calculateSimilarity(profile1, profile2);
    const styleDifferences = this.identifyStyleDifferences(profile1, profile2);
    const attributeDifferences = this.calculateAttributeDifferences(
      profile1.attributes,
      profile2.attributes,
    );

    return {
      player1: {
        id: player1Id,
        name: `${player1.users.firstName} ${player1.users.lastName}`,
        profile: profile1,
      },
      player2: {
        id: player2Id,
        name: `${player2.users.firstName} ${player2.users.lastName}`,
        profile: profile2,
      },
      similarityScore,
      styleDifferences,
      attributeDifferences,
    };
  }

  /**
   * Extract player attributes from database
   */
  private extractPlayerAttributes(player: any): PlayerAttributes {
    const statsJson = (player.statsJson as any) || {};
    const scoutingAvg = this.calculateScoutingAverage(player.scouting_reports);

    return {
      technical: this.parseAttribute(statsJson.technical, scoutingAvg.technical, 50),
      physical: this.parseAttribute(statsJson.physical, scoutingAvg.physical, 50),
      mental: this.parseAttribute(statsJson.mental, scoutingAvg.mental, 50),
      tactical: this.parseAttribute(statsJson.tactical, scoutingAvg.tactical, 50),
      speed: this.parseAttribute(statsJson.speed, scoutingAvg.speed, 50),
      finishing: this.parseAttribute(statsJson.finishing, scoutingAvg.finishing, 50),
      passing: this.parseAttribute(statsJson.passing, scoutingAvg.passing, 50),
      defending: this.parseAttribute(statsJson.defending, scoutingAvg.defending, 50),
      dribbling: this.parseAttribute(statsJson.dribbling, scoutingAvg.dribbling, 50),
      positioning: this.parseAttribute(statsJson.positioning, scoutingAvg.positioning, 50),
    };
  }

  /**
   * Parse attribute with fallbacks
   */
  private parseAttribute(statValue: any, scoutingValue: number, defaultValue: number): number {
    if (typeof statValue === 'number' && !isNaN(statValue)) {
      return Math.max(0, Math.min(100, statValue));
    }
    if (typeof scoutingValue === 'number' && !isNaN(scoutingValue)) {
      return Math.max(0, Math.min(100, scoutingValue));
    }
    return defaultValue;
  }

  /**
   * Calculate average from scouting reports
   */
  private calculateScoutingAverage(reports: any[]): Record<string, number> {
    if (!reports || reports.length === 0) {
      return {};
    }

    const attributes = [
      'technical',
      'physical',
      'mental',
      'tactical',
      'speed',
      'finishing',
      'passing',
      'defending',
      'dribbling',
      'positioning',
    ];
    const result: Record<string, number> = {};

    attributes.forEach((attr) => {
      const values = reports.map((r) => r[attr]).filter((v) => typeof v === 'number' && !isNaN(v));

      if (values.length > 0) {
        result[attr] = values.reduce((sum, v) => sum + v, 0) / values.length;
      }
    });

    return result;
  }

  /**
   * Call external ML service for classification
   */
  private async callMLService(attributes: PlayerAttributes): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${this.mlServiceUrl}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributes }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`ML service responded with ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Fallback classification when ML service is unavailable
   */
  private fallbackClassification(attributes: PlayerAttributes, position: string): any {
    const styleScores = this.calculateStyleScores(attributes, position);
    const sorted = Object.entries(styleScores).sort(([, a], [, b]) => b - a);

    return {
      primaryStyle: sorted[0][0] as PlayingStyle,
      secondaryStyle: sorted[1][0] as PlayingStyle,
      confidence: 0.6,
      styleScores: Object.fromEntries(sorted) as Record<PlayingStyle, number>,
    };
  }

  /**
   * Calculate style scores based on attributes
   */
  private calculateStyleScores(
    attributes: PlayerAttributes,
    position: string,
  ): Record<PlayingStyle, number> {
    const scores: Record<PlayingStyle, number> = {
      [PlayingStyle.STRIKER]: this.calculateStrikerScore(attributes),
      [PlayingStyle.POACHER]: this.calculatePoacherScore(attributes),
      [PlayingStyle.TARGET_MAN]: this.calculateTargetManScore(attributes),
      [PlayingStyle.PLAYMAKER]: this.calculatePlaymakerScore(attributes),
      [PlayingStyle.BOX_TO_BOX]: this.calculateBoxToBoxScore(attributes),
      [PlayingStyle.DEEP_LYING_PLAYMAKER]: this.calculateDeepLyingPlaymakerScore(attributes),
      [PlayingStyle.WINGER]: this.calculateWingerScore(attributes),
      [PlayingStyle.WING_BACK]: this.calculateWingBackScore(attributes),
      [PlayingStyle.BALL_PLAYING_DEFENDER]: this.calculateBallPlayingDefenderScore(attributes),
      [PlayingStyle.DESTROYER]: this.calculateDestroyerScore(attributes),
      [PlayingStyle.SWEEPER]: this.calculateSweeperScore(attributes),
      [PlayingStyle.GOALKEEPER_SWEEPER]: this.calculateGoalkeeperSweeperScore(attributes),
    };

    // Apply position bonuses
    this.applyPositionBonuses(scores, position);

    return scores;
  }

  // Individual style score calculators
  private calculateStrikerScore(attr: PlayerAttributes): number {
    return attr.finishing * 0.4 + attr.positioning * 0.3 + attr.speed * 0.2 + attr.technical * 0.1;
  }

  private calculatePoacherScore(attr: PlayerAttributes): number {
    return attr.finishing * 0.5 + attr.positioning * 0.4 + attr.mental * 0.1;
  }

  private calculateTargetManScore(attr: PlayerAttributes): number {
    return (
      attr.physical * 0.4 + attr.finishing * 0.3 + attr.positioning * 0.2 + attr.technical * 0.1
    );
  }

  private calculatePlaymakerScore(attr: PlayerAttributes): number {
    return attr.passing * 0.4 + attr.technical * 0.3 + attr.tactical * 0.2 + attr.mental * 0.1;
  }

  private calculateBoxToBoxScore(attr: PlayerAttributes): number {
    return attr.physical * 0.25 + attr.passing * 0.25 + attr.tactical * 0.25 + attr.mental * 0.25;
  }

  private calculateDeepLyingPlaymakerScore(attr: PlayerAttributes): number {
    return attr.passing * 0.4 + attr.tactical * 0.3 + attr.mental * 0.2 + attr.technical * 0.1;
  }

  private calculateWingerScore(attr: PlayerAttributes): number {
    return attr.speed * 0.3 + attr.dribbling * 0.3 + attr.technical * 0.2 + attr.passing * 0.2;
  }

  private calculateWingBackScore(attr: PlayerAttributes): number {
    return attr.physical * 0.25 + attr.defending * 0.25 + attr.speed * 0.25 + attr.tactical * 0.25;
  }

  private calculateBallPlayingDefenderScore(attr: PlayerAttributes): number {
    return attr.defending * 0.3 + attr.passing * 0.3 + attr.tactical * 0.2 + attr.technical * 0.2;
  }

  private calculateDestroyerScore(attr: PlayerAttributes): number {
    return attr.defending * 0.4 + attr.physical * 0.3 + attr.tactical * 0.2 + attr.mental * 0.1;
  }

  private calculateSweeperScore(attr: PlayerAttributes): number {
    return attr.defending * 0.3 + attr.tactical * 0.3 + attr.positioning * 0.2 + attr.speed * 0.2;
  }

  private calculateGoalkeeperSweeperScore(attr: PlayerAttributes): number {
    return attr.positioning * 0.4 + attr.mental * 0.3 + attr.physical * 0.2 + attr.tactical * 0.1;
  }

  /**
   * Apply position-based bonuses to style scores
   */
  private applyPositionBonuses(scores: Record<PlayingStyle, number>, position: string): void {
    const bonusMap: Record<string, PlayingStyle[]> = {
      FORWARD: [PlayingStyle.STRIKER, PlayingStyle.POACHER, PlayingStyle.TARGET_MAN],
      MIDFIELDER: [
        PlayingStyle.PLAYMAKER,
        PlayingStyle.BOX_TO_BOX,
        PlayingStyle.DEEP_LYING_PLAYMAKER,
      ],
      DEFENDER: [PlayingStyle.BALL_PLAYING_DEFENDER, PlayingStyle.DESTROYER, PlayingStyle.SWEEPER],
      GOALKEEPER: [PlayingStyle.GOALKEEPER_SWEEPER],
    };

    const bonusStyles = bonusMap[position] || [];
    bonusStyles.forEach((style) => {
      scores[style] *= 1.2; // 20% bonus for position-appropriate styles
    });
  }

  /**
   * Generate radar chart data
   */
  private generateRadarData(attributes: PlayerAttributes): RadarChartData {
    return {
      labels: [
        'Technical',
        'Physical',
        'Mental',
        'Tactical',
        'Speed',
        'Finishing',
        'Passing',
        'Defending',
      ],
      values: [
        attributes.technical,
        attributes.physical,
        attributes.mental,
        attributes.tactical,
        attributes.speed,
        attributes.finishing,
        attributes.passing,
        attributes.defending,
      ],
    };
  }

  /**
   * Calculate similarity between two profiles
   */
  private calculateSimilarity(profile1: PlayStyleProfile, profile2: PlayStyleProfile): number {
    // Style similarity (40%)
    let styleSimilarity = 0;
    if (profile1.primaryStyle === profile2.primaryStyle) styleSimilarity += 0.6;
    if (profile1.secondaryStyle === profile2.secondaryStyle) styleSimilarity += 0.2;
    if (
      profile1.primaryStyle === profile2.secondaryStyle ||
      profile1.secondaryStyle === profile2.primaryStyle
    ) {
      styleSimilarity += 0.2;
    }

    // Attribute similarity (60%)
    const attr1 = profile1.attributes;
    const attr2 = profile2.attributes;
    const attrKeys = Object.keys(attr1) as (keyof PlayerAttributes)[];

    const attrDiffs = attrKeys.map((key) => Math.abs(attr1[key] - attr2[key]));
    const avgDiff = attrDiffs.reduce((sum, diff) => sum + diff, 0) / attrDiffs.length;
    const attrSimilarity = Math.max(0, 1 - avgDiff / 100);

    return Math.round((styleSimilarity * 0.4 + attrSimilarity * 0.6) * 100);
  }

  /**
   * Identify shared attributes between profiles
   */
  private identifySharedAttributes(
    profile1: PlayStyleProfile,
    profile2: PlayStyleProfile,
  ): string[] {
    const shared: string[] = [];
    const attr1 = profile1.attributes;
    const attr2 = profile2.attributes;

    Object.entries(attr1).forEach(([key, value]) => {
      const otherValue = attr2[key as keyof PlayerAttributes];
      if (Math.abs(value - otherValue) < 10 && value > 65) {
        shared.push(key);
      }
    });

    return shared;
  }

  /**
   * Identify style differences
   */
  private identifyStyleDifferences(
    profile1: PlayStyleProfile,
    profile2: PlayStyleProfile,
  ): string[] {
    const differences: string[] = [];

    if (profile1.primaryStyle !== profile2.primaryStyle) {
      differences.push(`Primary style: ${profile1.primaryStyle} vs ${profile2.primaryStyle}`);
    }

    if (profile1.secondaryStyle !== profile2.secondaryStyle) {
      differences.push(`Secondary style: ${profile1.secondaryStyle} vs ${profile2.secondaryStyle}`);
    }

    // Compare top 3 style scores
    const top1 = Object.entries(profile1.styleScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style);

    const top2 = Object.entries(profile2.styleScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([style]) => style);

    const uniqueStyles = top1.filter((style) => !top2.includes(style));
    if (uniqueStyles.length > 0) {
      differences.push(`Unique strengths: ${uniqueStyles.join(', ')}`);
    }

    return differences;
  }

  /**
   * Calculate attribute differences
   */
  private calculateAttributeDifferences(
    attr1: PlayerAttributes,
    attr2: PlayerAttributes,
  ): Record<string, { player1: number; player2: number; diff: number }> {
    const result: Record<string, { player1: number; player2: number; diff: number }> = {};

    Object.keys(attr1).forEach((key) => {
      const k = key as keyof PlayerAttributes;
      result[key] = {
        player1: attr1[k],
        player2: attr2[k],
        diff: attr1[k] - attr2[k],
      };
    });

    return result;
  }
}
