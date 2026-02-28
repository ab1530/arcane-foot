import { Test, TestingModule } from '@nestjs/testing';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

describe('NewsController', () => {
  let controller: NewsController;
  let newsService: NewsService;

  const mockNewsService = {
    getNewsFeed: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NewsController],
      providers: [
        {
          provide: NewsService,
          useValue: mockNewsService,
        },
      ],
    }).compile();

    controller = module.get<NewsController>(NewsController);
    newsService = module.get<NewsService>(NewsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service with default categories and limit', async () => {
    const expectedPayload = {
      data: [],
      generatedAt: '2026-02-20T12:00:00.000Z',
      meta: {
        limit: 20,
        total: 0,
        categories: ['clubs', 'players', 'market', 'notifications'],
        include: { players: 0, clubs: 0, market: 0, notifications: 0 },
      },
    };
    mockNewsService.getNewsFeed.mockResolvedValue(expectedPayload);

    const result = await controller.getFeed({ user: { id: 'user-1' } } as any, {});

    expect(result).toEqual(expectedPayload);
    expect(newsService.getNewsFeed).toHaveBeenCalledWith('user-1', 20, [
      'clubs',
      'players',
      'market',
      'notifications',
    ]);
  });

  it('should expose legacy /news alias', async () => {
    const expectedPayload = {
      data: [],
      generatedAt: '2026-02-20T12:00:00.000Z',
      meta: {
        limit: 20,
        total: 0,
        categories: ['clubs', 'players', 'market', 'notifications'],
        include: { players: 0, clubs: 0, market: 0, notifications: 0 },
      },
    };
    mockNewsService.getNewsFeed.mockResolvedValue(expectedPayload);

    const result = await controller.getFeedAlias({ user: { id: 'user-1' } } as any, {});

    expect(result).toEqual(expectedPayload);
    expect(newsService.getNewsFeed).toHaveBeenCalledWith('user-1', 20, [
      'clubs',
      'players',
      'market',
      'notifications',
    ]);
  });
});
