import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PlayerStats, AggregationOptions, MatchSummary } from './interfaces/report.interface';

@Injectable()
export class StatsAggregatorService {
  private readonly logger = new Logger(StatsAggregatorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate comprehensive player statistics
   */
  async getPlayerStats(
    playerId: string,
    options?: AggregationOptions,
  ): Promise<PlayerStats | null> {
    try {
      // Fetch player basic info
      const player = await this.prisma.players.findUnique({
        where: { id: playerId },
        include: {
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          clubs: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!player) {
        this.logger.warn(`Player ${playerId} not found in database`);
        return null;
      }

      // Check if user relation exists
      if (!player.users) {
        this.logger.error(`Player ${playerId} has no associated user`);
        return null;
      }

      // Get career stats from historical reports
      const careerStats = await this.getCareerStats(playerId);

      // Get recent match performance
      const recentMatches = options?.includeMatches
        ? await this.getRecentMatches(playerId, options?.matchCount || 5)
        : [];

      // Calculate average ratings from scouting reports
      const avgRatings = await this.getAverageRatings(playerId);

      // Determine performance trends
      const trends = this.calculateTrends(recentMatches, avgRatings);

      return {
        basic: {
          name:
            `${player.users.firstName || ''} ${player.users.lastName || ''}`.trim() ||
            'Unknown Player',
          age: this.calculateAge(player.dateOfBirth),
          position: player.position || 'Unknown',
          nationality: player.nationality || 'Unknown',
          club: player.clubs?.name,
        },
        career: careerStats,
        recent: {
          last5Matches: recentMatches,
          recentForm: this.assessRecentForm(recentMatches),
        },
        ratings: avgRatings,
        physical: {
          height: player.height,
          weight: player.weight,
          preferredFoot: player.preferredFoot,
        },
        trends,
      };
    } catch (error) {
      this.logger.error(`Failed to aggregate stats for player ${playerId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get career statistics from various sources
   */
  private async getCareerStats(playerId: string) {
    // Get total matches, goals, assists from scouting reports and matches
    const scoutingReports = await this.prisma.scouting_reports.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate stats
    const uniqueMatches = new Set(scoutingReports.filter((r) => r.matchId).map((r) => r.matchId));
    const totalMatches = uniqueMatches.size;

    // Note: goalsScored and assists fields don't exist in scouting_reports schema
    // These would need to be tracked elsewhere or estimated from ratings
    // For now, we'll return 0 or estimate based on position/ratings

    return {
      totalMatches,
      totalGoals: 0, // Would need actual match participation data
      totalAssists: 0, // Would need actual match participation data
    };
  }

  /**
   * Get recent match performances
   */
  private async getRecentMatches(playerId: string, count: number): Promise<MatchSummary[]> {
    const recentReports = await this.prisma.scouting_reports.findMany({
      where: {
        playerId,
      },
      include: {
        matches: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: count * 2, // Fetch more to account for filtering null matchIds
    });

    // Filter reports that have matchId and return only the requested count
    return recentReports
      .filter((report) => report.matchId !== null)
      .slice(0, count)
      .map((report) => ({
        matchId: report.matchId || '',
        date: report.matches?.scheduledAt || report.createdAt,
        opponent: 'Unknown', // Would need opponent data in schema
        result: 'N/A',
        minutesPlayed: 90, // Default value, actual data not in schema
        goals: 0, // Not tracked in scouting_reports
        assists: 0, // Not tracked in scouting_reports
        rating: report.overallRating,
      }));
  }

  /**
   * Calculate average ratings across all categories
   */
  private async getAverageRatings(playerId: string) {
    const reports = await this.prisma.scouting_reports.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
      take: 10, // Last 10 reports for rolling average
    });

    if (reports.length === 0) {
      return {
        avgTechnical: 0,
        avgTactical: 0,
        avgPhysical: 0,
        avgMental: 0,
      };
    }

    const sum = reports.reduce(
      (acc, report) => ({
        technical: acc.technical + (report.technicalRating || 0),
        tactical: acc.tactical + (report.tacticalRating || 0),
        physical: acc.physical + (report.physicalRating || 0),
        mental: acc.mental + (report.mentalRating || 0),
      }),
      { technical: 0, tactical: 0, physical: 0, mental: 0 },
    );

    const count = reports.length;

    return {
      avgTechnical: sum.technical / count,
      avgTactical: sum.tactical / count,
      avgPhysical: sum.physical / count,
      avgMental: sum.mental / count,
    };
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(matches: MatchSummary[], _ratings: any) {
    if (matches.length < 3) {
      return {
        improving: false,
        declining: false,
        consistent: true,
      };
    }

    // Get ratings from recent matches
    const recentRatings = matches
      .filter((m) => m.rating !== undefined)
      .map((m) => m.rating as number);

    if (recentRatings.length < 3) {
      return {
        improving: false,
        declining: false,
        consistent: true,
      };
    }

    // Calculate trend (simple linear regression)
    const firstHalf = recentRatings.slice(0, Math.floor(recentRatings.length / 2));
    const secondHalf = recentRatings.slice(Math.floor(recentRatings.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const improvement = secondAvg - firstAvg;
    const threshold = 0.5;

    // Calculate consistency (standard deviation)
    const mean = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
    const variance =
      recentRatings.reduce((sum, rating) => sum + Math.pow(rating - mean, 2), 0) /
      recentRatings.length;
    const stdDev = Math.sqrt(variance);
    const isConsistent = stdDev < 1.0;

    return {
      improving: improvement > threshold,
      declining: improvement < -threshold,
      consistent: isConsistent && Math.abs(improvement) <= threshold,
    };
  }

  /**
   * Assess recent form as a text description
   */
  private assessRecentForm(matches: MatchSummary[]): string {
    if (matches.length === 0) {
      return 'No recent match data available';
    }

    const recentRatings = matches
      .filter((m) => m.rating !== undefined)
      .map((m) => m.rating as number);

    if (recentRatings.length === 0) {
      return 'Insufficient rating data';
    }

    const avgRating = recentRatings.reduce((a, b) => a + b, 0) / recentRatings.length;
    const totalGoals = matches.reduce((sum, m) => sum + m.goals, 0);
    const totalAssists = matches.reduce((sum, m) => sum + m.assists, 0);

    let form = '';

    if (avgRating >= 8) {
      form = 'Excellent form';
    } else if (avgRating >= 7) {
      form = 'Good form';
    } else if (avgRating >= 6) {
      form = 'Decent form';
    } else if (avgRating >= 5) {
      form = 'Average form';
    } else {
      form = 'Poor form';
    }

    if (totalGoals > 0 || totalAssists > 0) {
      form += ` with ${totalGoals} goals and ${totalAssists} assists in last ${matches.length} matches`;
    }

    return form;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date | null): number {
    if (!dateOfBirth) return 0;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }
}
