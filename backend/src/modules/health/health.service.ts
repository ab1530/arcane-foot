import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private prisma: PrismaService) {}

  async getHealth() {
    const startTime = Date.now();

    const dbHealthy = await this.checkDatabase();
    const responseTime = Date.now() - startTime;

    return {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: `${responseTime}ms`,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: dbHealthy ? 'up' : 'down',
        memory: this.getMemoryUsage(),
      },
    };
  }

  async getReadiness() {
    const dbHealthy = await this.checkDatabase();

    if (!dbHealthy) {
      return {
        status: 'not_ready',
        ready: false,
        timestamp: new Date().toISOString(),
        checks: {
          database: 'down',
        },
      };
    }

    return {
      status: 'ready',
      ready: true,
      timestamp: new Date().toISOString(),
      checks: {
        database: 'up',
      },
    };
  }

  async getLiveness() {
    return {
      status: 'alive',
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  private getMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(used.external / 1024 / 1024)} MB`,
    };
  }
}
