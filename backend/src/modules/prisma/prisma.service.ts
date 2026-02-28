import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('[DB] Database connected');
    } catch (error) {
      const databaseUrl = process.env.DATABASE_URL ?? '';
      const hasSslMode = databaseUrl.includes('sslmode=');
      const host = extractDbHost(databaseUrl);
      const message = (error as Error)?.message ?? String(error);

      this.logger.error('[DB] Prisma initialization failed');
      if (host) {
        this.logger.error(`[DB] Host: ${host}`);
      }
      this.logger.error(`[DB] sslmode present in DATABASE_URL: ${hasSslMode}`);

      if (message.includes('Authentication failed')) {
        this.logger.error(
          '[DB] Invalid DB credentials. Refresh DATABASE_URL from Supabase > Database > Connect.',
        );
      }
      if (message.includes("Can't reach database server")) {
        this.logger.error(
          '[DB] Database host unreachable. On IPv4 networks, use Supabase pooler (port 6543).',
        );
      }
      if (!hasSslMode) {
        this.logger.error(
          '[DB] Missing sslmode. For Supabase, append ?sslmode=require to DATABASE_URL.',
        );
      }

      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function extractDbHost(url: string): string | null {
  if (!url) {
    return null;
  }
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}
