import { Injectable } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';

@Injectable()
export class HealthService {
  private startTime = Date.now();

  constructor(private prisma: PrismaService) {}

  async check() {
    const uptime = this.getUptime();
    const database = await this.checkDatabase();
    const memory = this.getMemoryUsage();

    const status = database.healthy ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime,
      checks: {
        database,
        memory,
      },
      version: process.env.APP_VERSION || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
    };
  }

  async readiness() {
    // Check if service is ready to accept traffic
    const database = await this.checkDatabase();

    if (!database.healthy) {
      return {
        ready: false,
        reason: 'Database not available',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  }

  async liveness() {
    // Simple liveness check - is the process running?
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
    };
  }

  async getMetrics() {
    const memory = this.getMemoryUsage();
    const uptime = this.getUptime();

    // Get database stats
    const [usersCount, playersCount, clubsCount, reportsCount, matchesCount] = await Promise.all([
      this.prisma.users.count(),
      this.prisma.players.count(),
      this.prisma.clubs.count(),
      this.prisma.scouting_reports.count(),
      this.prisma.matches.count(),
    ]);

    return {
      timestamp: new Date().toISOString(),
      uptime,
      memory,
      database: {
        users: usersCount,
        players: playersCount,
        clubs: clubsCount,
        reports: reportsCount,
        matches: matchesCount,
      },
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        healthy: true,
        responseTime: 0, // Could measure actual response time
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  private getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
    };
  }

  private getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeSeconds = Math.floor(uptimeMs / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    return {
      ms: uptimeMs,
      formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
  }
}
