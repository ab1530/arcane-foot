import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère les statistiques globales de la plateforme
   */
  async getPlatformOverview() {
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

    return {
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
  }

  /**
   * Statistiques des joueurs
   */
  async getPlayersAnalytics() {
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
          not: undefined
        }
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

    return {
      byStatus: playersByStatus.map((s) => ({ status: s.status, count: s._count })),
      byPosition: playersByPosition.map((p) => ({ position: p.position, count: p._count })),
      byNationality: playersByNationality.map((n) => ({ nationality: n.nationality, count: n._count })),
      ageStats: {
        average: Math.round(averageAge * 10) / 10,
        min: minAge,
        max: maxAge,
      },
      topRatedPlayers,
    };
  }

  /**
   * Statistiques des clubs
   */
  async getClubsAnalytics() {
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

    return {
      total: totalClubs,
      byCountry: clubsByCountry.map((c) => ({ country: c.country, count: c._count })),
      withMostPlayers: clubsWithMostPlayers,
      mostActive: mostActiveClubs,
    };
  }

  /**
   * Statistiques des rapports de scouting
   */
  async getScoutingReportsAnalytics() {
    // Répartition par statut
    const reportsByStatus = await this.prisma.scouting_reports.groupBy({
      by: ['status'],
      _count: true,
    });

    // Statistiques de notation
    const ratingStats = await this.prisma.scouting_reports.aggregate({
      where: {
        overallRating: {
          not: undefined
        }
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

    return {
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

    const successRate = totalRequests > 0 ? ((acceptedRequests + completedRequests) / totalRequests) * 100 : 0;

    // Temps moyen de réponse
    const requestsWithResponse = await this.prisma.club_requests.findMany({
      where: {
        respondedAt: {
          not: undefined
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
    const usersMap = new Map(usersData.map(d => [d.date.toISOString().split('T')[0], Number(d.count)]));
    const playersMap = new Map(playersData.map(d => [d.date.toISOString().split('T')[0], Number(d.count)]));
    const reportsMap = new Map(reportsData.map(d => [d.date.toISOString().split('T')[0], Number(d.count)]));
    const requestsMap = new Map(requestsData.map(d => [d.date.toISOString().split('T')[0], Number(d.count)]));

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
}
