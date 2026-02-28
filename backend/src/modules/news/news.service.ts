import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { NewsFeedCategory } from './dto/news-feed-query.dto';

type RawNewsFeedItem = {
  id: string;
  category: 'players' | 'clubs' | 'market' | 'notifications';
  title: string;
  summary: string | null;
  source: string;
  details: string | null;
  timestamp: string;
  link: string | null;
};

export type NewsFeedResponse = {
  data: RawNewsFeedItem[];
  generatedAt: string;
  meta: {
    limit: number;
    total: number;
    categories: NewsFeedCategory[];
    include: {
      players: number;
      clubs: number;
      market: number;
      notifications: number;
    };
  };
};

const DEFAULT_LIMIT = 20;
const MAX_PER_SECTION = 40;
const NEWS_CATEGORIES: ReadonlyArray<NewsFeedCategory> = [
  'clubs',
  'players',
  'market',
  'notifications',
];

const toDate = (value: unknown): Date | null => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

const toIso = (value: unknown): string | null => {
  const parsed = toDate(value);
  return parsed ? parsed.toISOString() : null;
};

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}

  async getNewsFeed(
    userId: string,
    limit = DEFAULT_LIMIT,
    categories: NewsFeedCategory[] = [...NEWS_CATEGORIES],
  ) {
    const sanitizedLimit = this.normalizeLimit(limit);
    const requestedCategories = categories.length > 0 ? categories : [...NEWS_CATEGORIES];

    const sectionLimit = Math.max(
      1,
      Math.floor(
        Math.max(sanitizedLimit, requestedCategories.length) /
          Math.max(requestedCategories.length, 1),
      ),
    );

    const includes = {
      players: requestedCategories.includes('players')
        ? this.loadPlayerNewsEntries(sectionLimit)
        : Promise.resolve([]),
      clubs: requestedCategories.includes('clubs')
        ? this.loadClubNews(sectionLimit)
        : Promise.resolve([]),
      market: requestedCategories.includes('market')
        ? this.loadMarketDemandFeed(sectionLimit)
        : Promise.resolve([]),
      notifications: requestedCategories.includes('notifications')
        ? this.loadNotifications(userId, sectionLimit)
        : Promise.resolve([]),
    } as const;

    const [playerItems, clubItems, marketItems, notificationItems] = await Promise.all([
      includes.players,
      includes.clubs,
      includes.market,
      includes.notifications,
    ]);

    const allItems = [...playerItems, ...clubItems, ...marketItems, ...notificationItems]
      .filter((item): item is RawNewsFeedItem => Boolean(item))
      .sort((left, right) => {
        const leftTime = toDate(left.timestamp)?.getTime() ?? 0;
        const rightTime = toDate(right.timestamp)?.getTime() ?? 0;
        return rightTime - leftTime;
      })
      .slice(0, sanitizedLimit);

    return {
      data: allItems,
      generatedAt: new Date().toISOString(),
      meta: {
        limit: sanitizedLimit,
        total: allItems.length,
        categories: requestedCategories,
        include: {
          players: playerItems.length,
          clubs: clubItems.length,
          market: marketItems.length,
          notifications: notificationItems.length,
        },
      },
    };
  }

  private normalizeLimit(input: number) {
    if (!Number.isInteger(input) || input <= 0) return DEFAULT_LIMIT;
    return Math.min(50, Math.max(5, input));
  }

  private async loadPlayerNewsEntries(limit: number): Promise<RawNewsFeedItem[]> {
    const rows = await this.prisma.player_news_entries.findMany({
      where: { contentStatus: 'PUBLISHED' },
      orderBy: { publishedAtSource: 'desc' },
      take: Math.max(1, Math.min(MAX_PER_SECTION, limit)),
      include: {
        players: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            clubId: true,
          },
        },
      },
    });

    return rows.map((entry) => {
      const playerName =
        `${entry.players?.firstName ?? ''} ${entry.players?.lastName ?? ''}`.trim();
      return {
        id: `players-${entry.id}`,
        category: 'players',
        title: entry.headline || 'Actualité joueur',
        summary: entry.summary ?? null,
        source: playerName || 'Actualités joueur',
        details: entry.headline || null,
        timestamp:
          toIso(entry.publishedAtSource) ||
          toIso(entry.publishedAt) ||
          toIso(entry.createdAt) ||
          new Date().toISOString(),
        link: entry.sourceUrl ?? null,
      };
    });
  }

  private async loadClubNews(limit: number): Promise<RawNewsFeedItem[]> {
    const rows = await this.prisma.clubs.findMany({
      orderBy: { updatedAt: 'desc' },
      take: Math.max(1, Math.min(MAX_PER_SECTION, limit)),
      select: { id: true, name: true, country: true, city: true, updatedAt: true, createdAt: true },
    });

    return rows.map((club) => {
      const location = [club.city, club.country].filter(Boolean).join(' • ');
      return {
        id: `clubs-${club.id}`,
        category: 'clubs',
        title: `Infos club : ${club.name}`,
        summary: location || null,
        source: 'Clubs',
        details: `${club.name}${location ? ` · ${location}` : ''}`,
        timestamp: toIso(club.updatedAt) || toIso(club.createdAt) || new Date().toISOString(),
        link: `/clubs/${club.id}`,
      };
    });
  }

  private async loadMarketDemandFeed(limit: number): Promise<RawNewsFeedItem[]> {
    const rows = await this.prisma.club_requests.findMany({
      orderBy: { updatedAt: 'desc' },
      take: Math.max(1, Math.min(MAX_PER_SECTION, limit)),
      include: {
        players: {
          select: {
            firstName: true,
            lastName: true,
            nationality: true,
          },
        },
        clubs: {
          select: {
            name: true,
          },
        },
      },
    });

    return rows.map((request) => {
      const playerName =
        `${request.players?.firstName ?? ''} ${request.players?.lastName ?? ''}`.trim() ||
        'Joueur inconnu';
      const clubName = request.clubs?.name ?? 'Club inconnu';
      return {
        id: `market-${request.id}`,
        category: 'market',
        title: `${clubName} · Demande marché`,
        summary: `${playerName} • ${request.requestType}`,
        source: clubName,
        details: request.message ?? null,
        timestamp: toIso(request.updatedAt) || toIso(request.createdAt) || new Date().toISOString(),
        link: `/club-requests/${request.id}`,
      };
    });
  }

  private async loadNotifications(userId: string, limit: number): Promise<RawNewsFeedItem[]> {
    const rows = await this.prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(MAX_PER_SECTION, limit)),
    });

    return rows.map((notification) => ({
      id: `notifications-${notification.id}`,
      category: 'notifications',
      title: notification.title,
      summary: notification.body,
      source: notification.type,
      details: `${notification.title} ${notification.body}`.trim(),
      timestamp: toIso(notification.createdAt) || new Date().toISOString(),
      link: `/notifications`,
    }));
  }
}
