import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Récupère les statistiques globales de la plateforme
   * Cached for 5 minutes
   */
  async getPlatformOverview() {
    // Try cache first
    const cacheKey = 'analytics:platform_overview';
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return cached;
    }
    const [
      totalUsers,
      totalPlayers,
      totalClubs,
      totalMatches,
      totalScoutingReports,
      totalEvents,
      totalKanbanBoards,
      totalClubRequests,
    ] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.players.count(),
      this.prisma.clubs.count(),
      this.prisma.matches.count(),
      this.prisma.scouting_reports.count(),
      this.prisma.events.count(),
      this.prisma.kanban_boards.count(),
      this.prisma.club_requests.count(),
    ]);

    // Statistiques d'activité récente (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      newUsersLast7Days,
      newPlayersLast7Days,
      newScoutingReportsLast7Days,
      newClubRequestsLast7Days,
    ] = await Promise.all([
      this.prisma.users.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.players.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.scouting_reports.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.club_requests.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    const result = {
      overview: {
        totalUsers,
        totalPlayers,
        totalClubs,
        totalMatches,
        totalScoutingReports,
        totalEvents,
        totalKanbanBoards,
        totalClubRequests,
      },
      recentActivity: {
        newUsersLast7Days,
        newPlayersLast7Days,
        newScoutingReportsLast7Days,
        newClubRequestsLast7Days,
      },
      timestamp: new Date(),
    };

    // Cache for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Get personalized dashboard stats for current user
   * Based on user role
   */
  async getUserDashboard(userId: string, role: string) {
    // Try cache first
    const cacheKey = `analytics:user_dashboard:${userId}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return cached;
    }

    let result: any = {
      userId,
      role,
    };

    if (role === 'SCOUT' || role === 'ADMIN' || role === 'SUPER_ADMIN') {
      // Scout dashboard: reports stats
      const [totalReports, reportsLast7Days, reportsLast30Days] = await Promise.all([
        this.prisma.scouting_reports.count({ where: { scoutId: userId } }),
        this.prisma.scouting_reports.count({
          where: {
            scoutId: userId,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        }),
        this.prisma.scouting_reports.count({
          where: {
            scoutId: userId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

      result = {
        ...result,
        totalReports,
        reportsLast7Days,
        reportsLast30Days,
        totalPlayers: await this.prisma.players.count(),
        totalClubs: await this.prisma.clubs.count(),
      };
    }

    if (role === 'PLAYER') {
      // Player dashboard: their own stats
      const player = await this.prisma.players.findUnique({
        where: { userId },
        include: {
          _count: {
            select: {
              scouting_reports: true,
              media: true,
            },
          },
        },
      });

      if (player) {
        result = {
          ...result,
          reportsAboutMe: player._count.scouting_reports,
          mediaCount: player._count.media,
          marketValue: player.marketValue,
          position: player.position,
        };
      }
    }

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      // Admin dashboard: platform overview
      const platformStats: any = await this.getPlatformOverview();
      result = {
        ...result,
        ...platformStats.overview,
        recentActivity: platformStats.recentActivity,
      };
    }

    // Cache for 2 minutes (120 seconds)
    await this.redisService.set(cacheKey, result, 120);
    return result;
  }

  /**
   * Statistiques des joueurs
   * Cached for 10 minutes
   */
  async getPlayersAnalytics() {
    // Try cache first
    const cacheKey = 'analytics:players';
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return cached;
    }
    // Répartition par statut
    const playersByStatus = await this.prisma.players.groupBy({
      by: ['status'],
      _count: true,
    });

    // Répartition par position
    const playersByPosition = await this.prisma.players.groupBy({
      by: ['position'],
      _count: true,
    });

    // Répartition par nationalité (top 10)
    const playersByNationality = await this.prisma.players.groupBy({
      by: ['nationality'],
      _count: true,
      orderBy: { _count: { nationality: 'desc' } },
      take: 10,
    });

    // Statistiques d'âge
    const allPlayers = await this.prisma.players.findMany({
      select: { dateOfBirth: true },
      where: {
        dateOfBirth: {
          not: undefined,
        },
      },
    });

    const ages = allPlayers
      .map((p) => {
        if (!p.dateOfBirth) return null;
        const today = new Date();
        const birthDate = new Date(p.dateOfBirth);
        return today.getFullYear() - birthDate.getFullYear();
      })
      .filter((age) => age !== null);

    const averageAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
    const minAge = ages.length > 0 ? Math.min(...ages) : 0;
    const maxAge = ages.length > 0 ? Math.max(...ages) : 0;

    // Joueurs récemment ajoutés (top 10)
    const topRatedPlayers = await this.prisma.players.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
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
    });

    const result = {
      byStatus: playersByStatus.map((s) => ({ status: s.status, count: s._count })),
      byPosition: playersByPosition.map((p) => ({ position: p.position, count: p._count })),
      byNationality: playersByNationality.map((n) => ({
        nationality: n.nationality,
        count: n._count,
      })),
      ageStats: {
        average: Math.round(averageAge * 10) / 10,
        min: minAge,
        max: maxAge,
      },
      topRatedPlayers,
    };

    // Cache for 10 minutes (600 seconds)
    await this.redisService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Statistiques des clubs
   * Cached for 10 minutes
   */
  async getClubsAnalytics() {
    // Try cache first
    const cacheKey = 'analytics:clubs';
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return cached;
    }
    const totalClubs = await this.prisma.clubs.count();

    // Répartition par pays (top 10)
    const clubsByCountry = await this.prisma.clubs.groupBy({
      by: ['country'],
      _count: true,
      orderBy: { _count: { country: 'desc' } },
      take: 10,
    });

    // Clubs avec le plus de joueurs
    const clubsWithMostPlayers = await this.prisma.clubs.findMany({
      take: 10,
      orderBy: {
        players: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        name: true,
        logo: true,
        city: true,
        country: true,
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    // Clubs les plus actifs (basé sur les matchs) - simplified without _count
    const mostActiveClubs = await this.prisma.clubs.findMany({
      take: 10,
      select: {
        id: true,
        name: true,
        logo: true,
      },
    });

    const result = {
      total: totalClubs,
      byCountry: clubsByCountry.map((c) => ({ country: c.country, count: c._count })),
      withMostPlayers: clubsWithMostPlayers,
      mostActive: mostActiveClubs,
    };

    // Cache for 10 minutes (600 seconds)
    await this.redisService.set(cacheKey, result, 600);
    return result;
  }

  /**
   * Statistiques des rapports de scouting
   * Cached for 5 minutes
   */
  async getScoutingReportsAnalytics() {
    // Try cache first
    const cacheKey = 'analytics:scouting_reports';
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return cached;
    }
    // Répartition par statut
    const reportsByStatus = await this.prisma.scouting_reports.groupBy({
      by: ['status'],
      _count: true,
    });

    // Statistiques de notation
    const ratingStats = await this.prisma.scouting_reports.aggregate({
      where: {
        overallRating: {
          not: undefined,
        },
      },
      _avg: { overallRating: true },
      _min: { overallRating: true },
      _max: { overallRating: true },
      _count: true,
    });

    // Scouts les plus actifs
    const mostActiveScouts = await this.prisma.users.findMany({
      where: {
        scouting_reports: {
          some: {},
        },
      },
      take: 10,
      orderBy: {
        scouting_reports: {
          _count: 'desc',
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        _count: {
          select: {
            scouting_reports: true,
          },
        },
      },
    });

    // Rapports récents (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentReportsCount = await this.prisma.scouting_reports.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    const result = {
      byStatus: reportsByStatus.map((r) => ({ status: r.status, count: r._count })),
      ratingStats: {
        average: ratingStats._avg.overallRating,
        min: ratingStats._min.overallRating,
        max: ratingStats._max.overallRating,
        total: ratingStats._count,
      },
      mostActiveScouts,
      recentCount: recentReportsCount,
    };

    // Cache for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Statistiques des demandes de clubs
   */
  async getClubRequestsAnalytics() {
    // Répartition par statut
    const requestsByStatus = await this.prisma.club_requests.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalRequests = await this.prisma.club_requests.count();
    const acceptedRequests = await this.prisma.club_requests.count({
      where: { status: 'ACCEPTED' },
    });
    const completedRequests = await this.prisma.club_requests.count({
      where: { status: 'COMPLETED' },
    });

    const successRate =
      totalRequests > 0 ? ((acceptedRequests + completedRequests) / totalRequests) * 100 : 0;

    // Temps moyen de réponse
    const requestsWithResponse = await this.prisma.club_requests.findMany({
      where: {
        respondedAt: {
          not: undefined,
        },
      },
      select: {
        createdAt: true,
        respondedAt: true,
      },
    });

    let averageResponseTime = 0;
    if (requestsWithResponse.length > 0) {
      const totalResponseTime = requestsWithResponse.reduce((acc, req) => {
        const responseTime = req.respondedAt.getTime() - req.createdAt.getTime();
        return acc + responseTime;
      }, 0);
      averageResponseTime = totalResponseTime / requestsWithResponse.length / (1000 * 60 * 60 * 24); // En jours
    }

    return {
      byStatus: requestsByStatus.map((r) => ({ status: r.status, count: r._count })),
      total: totalRequests,
      successRate: Math.round(successRate * 10) / 10,
      averageResponseTimeInDays: Math.round(averageResponseTime * 10) / 10,
    };
  }

  /**
   * Statistiques des événements
   */
  async getEventsAnalytics() {
    const totalEvents = await this.prisma.events.count();

    // Événements à venir
    const upcomingEvents = await this.prisma.events.count({
      where: { startDate: { gte: new Date() } },
    });

    // Événements par type
    const eventsByType = await this.prisma.events.groupBy({
      by: ['type'],
      _count: true,
    });

    // Événements les plus populaires (basé sur le nombre de participants si disponible)
    const popularEvents = await this.prisma.events.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
    });

    return {
      total: totalEvents,
      upcoming: upcomingEvents,
      byType: eventsByType.map((e) => ({ type: e.type, count: e._count })),
      popular: popularEvents,
    };
  }

  /**
   * Tendances et activité sur une période
   * OPTIMIZED: Reduced from 120 queries to 4 queries using GROUP BY
   */
  async getActivityTrends(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all data in parallel with GROUP BY (4 queries total instead of 120!)
    const [usersData, playersData, reportsData, requestsData] = await Promise.all([
      // Users created per day
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "users"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt")
      `,
      // Players created per day
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "players"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt")
      `,
      // Reports created per day
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "scouting_reports"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt")
      `,
      // Club requests created per day
      this.prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
        SELECT DATE("createdAt") as date, COUNT(*)::int as count
        FROM "club_requests"
        WHERE "createdAt" >= ${startDate}
        GROUP BY DATE("createdAt")
        ORDER BY DATE("createdAt")
      `,
    ]);

    // Create lookup maps for O(1) access
    const usersMap = new Map(
      usersData.map((d) => [d.date.toISOString().split('T')[0], Number(d.count)]),
    );
    const playersMap = new Map(
      playersData.map((d) => [d.date.toISOString().split('T')[0], Number(d.count)]),
    );
    const reportsMap = new Map(
      reportsData.map((d) => [d.date.toISOString().split('T')[0], Number(d.count)]),
    );
    const requestsMap = new Map(
      requestsData.map((d) => [d.date.toISOString().split('T')[0], Number(d.count)]),
    );

    // Build daily activity array with all days (including zeros for days with no activity)
    const dailyActivity = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      dailyActivity.push({
        date: dateStr,
        newUsers: usersMap.get(dateStr) || 0,
        newPlayers: playersMap.get(dateStr) || 0,
        newReports: reportsMap.get(dateStr) || 0,
        newRequests: requestsMap.get(dateStr) || 0,
      });
    }

    return {
      period: `${days} derniers jours`,
      data: dailyActivity,
      performance: {
        queries: 4,
        optimized: true,
        improvement: '96% reduction (120→4 queries)',
      },
    };
  }

  // ==========================================
  // RBAC MONITORING METHODS
  // ==========================================

  /**
   * Track when a feature is blocked due to insufficient tier
   */
  async trackFeatureBlocked(userId: string, feature: string, _requiredTier: string) {
    // This is handled by the Sentry interceptor
    // But we can also track it here for immediate dashboard access
    const event = await this.prisma.rbac_events.findFirst({
      where: {
        userId,
        feature,
        eventType: 'FEATURE_BLOCKED',
        timestamp: {
          gte: new Date(Date.now() - 60000), // Last minute
        },
      },
    });

    return event ? event.id : null;
  }

  /**
   * Track when upgrade modal is shown to user
   */
  async trackUpgradeModalShown(userId: string, feature: string) {
    const modal = await this.prisma.upgrade_modals.create({
      data: {
        id: `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        feature,
        trigger: '403_error',
      },
    });

    return modal.id;
  }

  /**
   * Track when upgrade modal is dismissed
   */
  async trackUpgradeModalDismissed(modalId: string, timeShownSeconds: number) {
    await this.prisma.upgrade_modals.update({
      where: { id: modalId },
      data: {
        dismissedAt: new Date(),
        timeShownSeconds,
      },
    });
  }

  /**
   * Track when upgrade modal CTA is clicked
   */
  async trackUpgradeModalCtaClicked(modalId: string) {
    await this.prisma.upgrade_modals.update({
      where: { id: modalId },
      data: {
        ctaClickedAt: new Date(),
      },
    });
  }

  /**
   * Track subscription upgrade/conversion
   */
  async trackUpgradeConversion(
    userId: string,
    fromTier: string,
    toTier: string,
    source: string = 'unknown',
    feature?: string,
    revenue?: number,
  ) {
    const tierPricing = {
      FREE: 0,
      BASIC: 19.99,
      PRO: 39.99,
      GOLD: 49.99,
      ENTERPRISE: 99.99,
    };

    const calculatedRevenue = revenue || tierPricing[toTier] || 0;

    await this.prisma.subscription_conversions.create({
      data: {
        id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        fromTier,
        toTier,
        source,
        feature,
        revenue: calculatedRevenue,
        currency: 'EUR',
      },
    });
  }

  /**
   * Get 403 error rate for a date range
   */
  async get403Rate(startDate: Date, endDate: Date) {
    const total403s = await this.prisma.rbac_events.count({
      where: {
        eventType: 'FEATURE_BLOCKED',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Estimate total requests (we'd need a request log for this)
    // For now, use a simplified calculation
    const totalUsers = await this.prisma.users.count({
      where: {
        lastLoginAt: {
          gte: startDate,
        },
      },
    });

    // Rough estimate: each active user makes ~100 requests per session
    const estimatedTotalRequests = totalUsers * 100;
    const rate = estimatedTotalRequests > 0 ? (total403s / estimatedTotalRequests) * 100 : 0;

    return {
      total403Errors: total403s,
      estimatedTotalRequests,
      rate403Percentage: Math.round(rate * 100) / 100,
    };
  }

  /**
   * Get conversion rate for a date range
   */
  async getConversionRate(startDate: Date, endDate: Date) {
    const [totalBlocked, totalConversions] = await Promise.all([
      this.prisma.rbac_events.count({
        where: {
          eventType: 'FEATURE_BLOCKED',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      this.prisma.subscription_conversions.count({
        where: {
          convertedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const rate = totalBlocked > 0 ? (totalConversions / totalBlocked) * 100 : 0;

    return {
      totalBlocked,
      totalConversions,
      conversionRatePercentage: Math.round(rate * 100) / 100,
    };
  }

  /**
   * Get comprehensive RBAC metrics for dashboard
   * Cached for 5 minutes
   */
  async getRbacMetrics(days: number = 7) {
    // Try cache first
    const cacheKey = `analytics:rbac_metrics:${days}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return cached;
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const endDate = new Date();

    // Run all queries in parallel
    const [
      total403Events,
      mostBlockedFeatures,
      modalStats,
      conversions,
      conversionsBySource,
      totalRevenue,
      rateData,
    ] = await Promise.all([
      // Total 403 errors
      this.prisma.rbac_events.count({
        where: {
          eventType: 'FEATURE_BLOCKED',
          timestamp: { gte: startDate },
        },
      }),

      // Most blocked features (avoid Prisma groupBy instability on rbac_events)
      this.getMostBlockedFeatures(startDate),

      // Modal stats
      this.prisma.upgrade_modals.findMany({
        where: {
          shownAt: { gte: startDate },
        },
        select: {
          id: true,
          dismissedAt: true,
          ctaClickedAt: true,
        },
      }),

      // Conversions
      this.prisma.subscription_conversions.findMany({
        where: {
          convertedAt: { gte: startDate },
        },
        select: {
          fromTier: true,
          toTier: true,
          revenue: true,
          source: true,
          feature: true,
        },
      }),

      // Conversions by source
      this.prisma.subscription_conversions.groupBy({
        by: ['source'],
        where: {
          convertedAt: { gte: startDate },
        },
        _count: true,
        _sum: {
          revenue: true,
        },
      }),

      // Total revenue
      this.prisma.subscription_conversions.aggregate({
        where: {
          convertedAt: { gte: startDate },
        },
        _sum: {
          revenue: true,
        },
      }),

      // Get 403 rate
      this.get403Rate(startDate, endDate),
    ]);

    // Calculate modal stats
    const totalModalsShown = modalStats.length;
    const totalDismissed = modalStats.filter((m) => m.dismissedAt).length;
    const totalCtaClicked = modalStats.filter((m) => m.ctaClickedAt).length;
    const ctr = totalModalsShown > 0 ? (totalCtaClicked / totalModalsShown) * 100 : 0;

    // Calculate conversion stats
    const freeToGoldConversions = conversions.filter(
      (c) => c.fromTier === 'FREE' && c.toTier === 'GOLD',
    ).length;

    const conversionRate = total403Events > 0 ? (conversions.length / total403Events) * 100 : 0;

    const result = {
      period: `last_${days}_days`,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      total_403_errors: total403Events,
      '403_rate': rateData.rate403Percentage,
      most_blocked_features: mostBlockedFeatures,
      conversions: {
        free_to_gold: freeToGoldConversions,
        total: conversions.length,
        conversion_rate: Math.round(conversionRate * 100) / 100,
        revenue_generated: totalRevenue._sum.revenue || 0,
        by_tier: conversions.reduce((acc, c) => {
          const key = `${c.fromTier}_to_${c.toTier}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {}),
        by_source: conversionsBySource.map((s) => ({
          source: s.source,
          count: s._count,
          revenue: s._sum.revenue || 0,
        })),
      },
      upgrade_modal: {
        shown: totalModalsShown,
        dismissed: totalDismissed,
        cta_clicked: totalCtaClicked,
        ctr: Math.round(ctr * 100) / 100,
        dismiss_rate:
          totalModalsShown > 0 ? Math.round((totalDismissed / totalModalsShown) * 10000) / 100 : 0,
      },
      recommendations: this.generateRecommendations(
        rateData.rate403Percentage,
        conversionRate,
        ctr,
      ),
    };

    // Cache for 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, result, 300);
    return result;
  }

  /**
   * Build top blocked features with a resilient JS aggregation.
   * If this analytics-only computation fails, we degrade to an empty list
   * instead of impacting auth/runtime flows.
   */
  private async getMostBlockedFeatures(startDate: Date): Promise<Array<{ feature: string; count: number }>> {
    try {
      const blockedEvents = await this.prisma.rbac_events.findMany({
        where: {
          eventType: 'FEATURE_BLOCKED',
          timestamp: { gte: startDate },
        },
        select: {
          feature: true,
        },
      });

      if (blockedEvents.length === 0) {
        return [];
      }

      const counts = blockedEvents.reduce<Record<string, number>>((acc, event) => {
        acc[event.feature] = (acc[event.feature] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(counts)
        .map(([feature, count]) => ({ feature, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    } catch (error) {
      this.logger.error(
        'Failed to compute most blocked features; returning empty fallback list.',
        error instanceof Error ? error.stack : String(error),
      );
      return [];
    }
  }

  /**
   * Generate recommendations based on metrics
   */
  private generateRecommendations(rate403: number, conversionRate: number, ctr: number): string[] {
    const recommendations: string[] = [];

    if (rate403 > 10) {
      recommendations.push(
        'HIGH 403 RATE ALERT: Over 10% of requests are being blocked. Consider reviewing feature access tiers or improving messaging.',
      );
    }

    if (conversionRate < 5) {
      recommendations.push(
        'LOW CONVERSION RATE: Less than 5% of blocked users are upgrading. Review pricing, value proposition, and upgrade flow.',
      );
    }

    if (ctr < 10) {
      recommendations.push(
        'LOW MODAL CTR: Less than 10% click-through rate on upgrade modals. Consider improving modal design and messaging.',
      );
    }

    if (rate403 < 5 && conversionRate > 15 && ctr > 20) {
      recommendations.push(
        'EXCELLENT PERFORMANCE: All metrics are within healthy ranges. Current RBAC strategy is working well.',
      );
    }

    if (recommendations.length === 0) {
      recommendations.push(
        'MODERATE PERFORMANCE: Metrics are within acceptable ranges but there is room for improvement.',
      );
    }

    return recommendations;
  }
}
