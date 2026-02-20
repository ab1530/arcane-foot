import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NewsService', () => {
  let service: NewsService;

  const mockPrismaService = {
    player_news_entries: {
      findMany: jest.fn(),
    },
    clubs: {
      findMany: jest.fn(),
    },
    club_requests: {
      findMany: jest.fn(),
    },
    notifications: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return feed items from each section and sort by date', async () => {
    mockPrismaService.player_news_entries.findMany.mockResolvedValue([
      {
        id: 'pn1',
        headline: 'N1',
        summary: 'Résumé joueur',
        sourceName: 'AFP',
        sourceUrl: null,
        publishedAtSource: '2026-02-20T09:00:00.000Z',
        publishedAt: null,
        createdAt: '2026-02-20T09:00:00.000Z',
        players: {
          firstName: 'Kylian',
          lastName: 'Mbappé',
          clubId: 'club-1',
        },
      },
    ]);

    mockPrismaService.clubs.findMany.mockResolvedValue([
      {
        id: 'c1',
        name: 'FC Paris',
        country: 'FR',
        city: 'Paris',
        updatedAt: '2026-02-20T10:00:00.000Z',
        createdAt: '2026-02-20T08:00:00.000Z',
      },
    ]);

    mockPrismaService.club_requests.findMany.mockResolvedValue([
      {
        id: 'r1',
        requestType: 'Transfert',
        message: 'Négociation',
        updatedAt: '2026-02-20T11:00:00.000Z',
        createdAt: '2026-02-20T07:00:00.000Z',
        players: {
          firstName: 'Kylian',
          lastName: 'Mbappé',
          nationality: 'FR',
        },
        clubs: {
          name: 'FC Paris',
        },
      },
    ]);

    mockPrismaService.notifications.findMany.mockResolvedValue([
      {
        id: 'n1',
        title: 'Alerte',
        body: 'Nouvelle demande',
        type: 'system',
        createdAt: '2026-02-20T12:00:00.000Z',
      },
    ]);

    const result = await service.getNewsFeed('user-1', 10, ['clubs', 'players', 'market', 'notifications']);

    expect(result.data).toHaveLength(4);
    expect(result.data[0].category).toBe('notifications');
    expect(result.data[0].id).toBe('notifications-n1');
    expect(result.meta.total).toBe(4);
    expect(mockPrismaService.player_news_entries.findMany).toHaveBeenCalled();
    expect(mockPrismaService.clubs.findMany).toHaveBeenCalled();
    expect(mockPrismaService.club_requests.findMany).toHaveBeenCalled();
    expect(mockPrismaService.notifications.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-1' },
      }),
    );
  });

  it('should return only requested categories', async () => {
    mockPrismaService.player_news_entries.findMany.mockResolvedValue([]);
    mockPrismaService.clubs.findMany.mockResolvedValue([]);
    mockPrismaService.club_requests.findMany.mockResolvedValue([]);
    mockPrismaService.notifications.findMany.mockResolvedValue([]);

    const result = await service.getNewsFeed('user-1', 10, ['clubs']);

    expect(result.data).toHaveLength(0);
    expect(mockPrismaService.player_news_entries.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.club_requests.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.notifications.findMany).not.toHaveBeenCalled();
    expect(mockPrismaService.clubs.findMany).toHaveBeenCalled();
  });
});
