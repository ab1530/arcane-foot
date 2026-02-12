import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../cache/redis.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;
  let redisService: RedisService;

  const mockPrismaService = {
    users: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    players: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    clubs: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    matches: {
      count: jest.fn(),
    },
    scouting_reports: {
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    events: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    kanban_boards: {
      count: jest.fn(),
    },
    club_requests: {
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    rbac_events: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    upgrade_modals: {
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    subscription_conversions: {
      create: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
  };

  const mockRedisService = {
    get: jest.fn().mockResolvedValue(null), // Always return null to bypass cache
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlatformOverview', () => {
    const mockOverviewCounts = [100, 250, 50, 120, 300, 45, 30, 75];
    const mockRecentCounts = [15, 25, 40, 12];

    beforeEach(() => {
      // Mock all Promise.all counts
      mockPrismaService.users.count
        .mockResolvedValueOnce(mockOverviewCounts[0]) // totalUsers
        .mockResolvedValueOnce(mockRecentCounts[0]); // newUsersLast7Days
      mockPrismaService.players.count
        .mockResolvedValueOnce(mockOverviewCounts[1]) // totalPlayers
        .mockResolvedValueOnce(mockRecentCounts[1]); // newPlayersLast7Days
      mockPrismaService.clubs.count.mockResolvedValue(mockOverviewCounts[2]);
      mockPrismaService.matches.count.mockResolvedValue(mockOverviewCounts[3]);
      mockPrismaService.scouting_reports.count
        .mockResolvedValueOnce(mockOverviewCounts[4]) // totalScoutingReports
        .mockResolvedValueOnce(mockRecentCounts[2]); // newScoutingReportsLast7Days
      mockPrismaService.events.count.mockResolvedValue(mockOverviewCounts[5]);
      mockPrismaService.kanban_boards.count.mockResolvedValue(mockOverviewCounts[6]);
      mockPrismaService.club_requests.count
        .mockResolvedValueOnce(mockOverviewCounts[7]) // totalClubRequests
        .mockResolvedValueOnce(mockRecentCounts[3]); // newClubRequestsLast7Days
    });

    it('should return platform overview statistics', async () => {
      const result = (await service.getPlatformOverview()) as any;

      expect(result.overview).toEqual({
        totalUsers: 100,
        totalPlayers: 250,
        totalClubs: 50,
        totalMatches: 120,
        totalScoutingReports: 300,
        totalEvents: 45,
        totalKanbanBoards: 30,
        totalClubRequests: 75,
      });

      expect(result.recentActivity).toEqual({
        newUsersLast7Days: 15,
        newPlayersLast7Days: 25,
        newScoutingReportsLast7Days: 40,
        newClubRequestsLast7Days: 12,
      });

      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should query counts with correct filters for recent activity', async () => {
      await service.getPlatformOverview();

      // Verify that recent activity queries use date filters
      expect(mockPrismaService.users.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
            }),
          }),
        }),
      );
    });
  });

  describe('getPlayersAnalytics', () => {
    const mockPlayersByStatus = [
      { status: 'ACTIVE', _count: 150 },
      { status: 'INACTIVE', _count: 50 },
    ];

    const mockPlayersByPosition = [
      { position: 'Forward', _count: 80 },
      { position: 'Midfielder', _count: 90 },
      { position: 'Defender', _count: 60 },
    ];

    const mockPlayersByNationality = [
      { nationality: 'FR', _count: 100 },
      { nationality: 'ES', _count: 50 },
    ];

    const mockPlayers = [
      { dateOfBirth: new Date('2000-01-01') },
      { dateOfBirth: new Date('1998-05-15') },
      { dateOfBirth: new Date('2002-09-30') },
    ];

    const mockTopRatedPlayers = [
      {
        id: 'player-1',
        user: { firstName: 'John', lastName: 'Doe', avatar: null },
        club: { name: 'PSG', logo: 'psg.png' },
      },
    ];

    beforeEach(() => {
      mockPrismaService.players.groupBy
        .mockResolvedValueOnce(mockPlayersByStatus)
        .mockResolvedValueOnce(mockPlayersByPosition)
        .mockResolvedValueOnce(mockPlayersByNationality);
      mockPrismaService.players.findMany
        .mockResolvedValueOnce(mockPlayers)
        .mockResolvedValueOnce(mockTopRatedPlayers);
    });

    it('should return players analytics with groupings', async () => {
      const result = (await service.getPlayersAnalytics()) as any;

      expect(result.byStatus).toEqual([
        { status: 'ACTIVE', count: 150 },
        { status: 'INACTIVE', count: 50 },
      ]);

      expect(result.byPosition).toEqual([
        { position: 'Forward', count: 80 },
        { position: 'Midfielder', count: 90 },
        { position: 'Defender', count: 60 },
      ]);

      expect(result.byNationality).toEqual([
        { nationality: 'FR', count: 100 },
        { nationality: 'ES', count: 50 },
      ]);

      expect(result.topRatedPlayers).toEqual(mockTopRatedPlayers);
    });

    it('should calculate age statistics correctly', async () => {
      const result = (await service.getPlayersAnalytics()) as any;

      expect(result.ageStats).toBeDefined();
      expect(result.ageStats.average).toBeGreaterThan(0);
      expect(result.ageStats.min).toBeGreaterThan(0);
      expect(result.ageStats.max).toBeGreaterThan(0);
    });

    it('should group by nationality with top 10 limit', async () => {
      await service.getPlayersAnalytics();

      expect(mockPrismaService.players.groupBy).toHaveBeenCalledWith({
        by: ['nationality'],
        _count: true,
        orderBy: { _count: { nationality: 'desc' } },
        take: 10,
      });
    });
  });

  describe('getClubsAnalytics', () => {
    const mockClubsByCountry = [
      { country: 'France', _count: 30 },
      { country: 'Spain', _count: 20 },
    ];

    const mockClubsWithMostPlayers = [
      {
        id: 'club-1',
        name: 'PSG',
        logo: 'psg.png',
        city: 'Paris',
        country: 'France',
        _count: { players: 25 },
      },
    ];

    const mockMostActiveClubs = [
      {
        id: 'club-1',
        name: 'PSG',
        logo: 'psg.png',
      },
    ];

    beforeEach(() => {
      mockPrismaService.clubs.count.mockResolvedValue(50);
      mockPrismaService.clubs.groupBy.mockResolvedValue(mockClubsByCountry);
      mockPrismaService.clubs.findMany
        .mockResolvedValueOnce(mockClubsWithMostPlayers)
        .mockResolvedValueOnce(mockMostActiveClubs);
    });

    it('should return clubs analytics', async () => {
      const result = (await service.getClubsAnalytics()) as any;

      expect(result.total).toBe(50);
      expect(result.byCountry).toEqual([
        { country: 'France', count: 30 },
        { country: 'Spain', count: 20 },
      ]);
      expect(result.withMostPlayers).toEqual(mockClubsWithMostPlayers);
    });

    it('should return most active clubs', async () => {
      const result = (await service.getClubsAnalytics()) as any;

      expect(result.mostActive).toBeDefined();
      expect(Array.isArray(result.mostActive)).toBe(true);
    });
  });

  describe('getScoutingReportsAnalytics', () => {
    const mockReportsByStatus = [
      { status: 'APPROVED', _count: 150 },
      { status: 'SUBMITTED', _count: 50 },
      { status: 'DRAFT', _count: 25 },
    ];

    const mockRatingStats = {
      _avg: { overallRating: 7.5 },
      _min: { overallRating: 5 },
      _max: { overallRating: 10 },
      _count: 200,
    };

    const mockMostActiveScouts = [
      {
        id: 'scout-1',
        firstName: 'John',
        lastName: 'Scout',
        email: 'scout@example.com',
        avatar: null,
        _count: { scoutingReports: 45 },
      },
    ];

    beforeEach(() => {
      mockPrismaService.scouting_reports.groupBy.mockResolvedValue(mockReportsByStatus);
      mockPrismaService.scouting_reports.aggregate.mockResolvedValue(mockRatingStats);
      mockPrismaService.users.findMany.mockResolvedValue(mockMostActiveScouts);
      mockPrismaService.scouting_reports.count.mockResolvedValue(30);
    });

    it('should return scouting reports analytics', async () => {
      const result = (await service.getScoutingReportsAnalytics()) as any;

      expect(result.byStatus).toEqual([
        { status: 'APPROVED', count: 150 },
        { status: 'SUBMITTED', count: 50 },
        { status: 'DRAFT', count: 25 },
      ]);

      expect(result.ratingStats).toEqual({
        average: 7.5,
        min: 5,
        max: 10,
        total: 200,
      });

      expect(result.mostActiveScouts).toEqual(mockMostActiveScouts);
      expect(result.recentCount).toBe(30);
    });

    it('should aggregate rating stats with correct filter', async () => {
      await service.getScoutingReportsAnalytics();

      expect(mockPrismaService.scouting_reports.aggregate).toHaveBeenCalledWith({
        where: { overallRating: { not: undefined } },
        _avg: { overallRating: true },
        _min: { overallRating: true },
        _max: { overallRating: true },
        _count: true,
      });
    });

    it('should find top 10 most active scouts', async () => {
      await service.getScoutingReportsAnalytics();

      expect(mockPrismaService.users.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          orderBy: {
            scouting_reports: {
              _count: 'desc',
            },
          },
        }),
      );
    });
  });

  describe('getClubRequestsAnalytics', () => {
    const mockRequestsByStatus = [
      { status: 'ACCEPTED', _count: 40 },
      { status: 'COMPLETED', _count: 30 },
      { status: 'PENDING', _count: 20 },
      { status: 'REJECTED', _count: 10 },
    ];

    const mockRequestsWithResponse = [
      {
        createdAt: new Date('2025-01-01'),
        respondedAt: new Date('2025-01-03'),
      },
      {
        createdAt: new Date('2025-01-05'),
        respondedAt: new Date('2025-01-06'),
      },
    ];

    it('should return club requests analytics', async () => {
      mockPrismaService.club_requests.groupBy.mockResolvedValue(mockRequestsByStatus);
      mockPrismaService.club_requests.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(40) // accepted
        .mockResolvedValueOnce(30); // completed
      mockPrismaService.club_requests.findMany.mockResolvedValue(mockRequestsWithResponse);

      const result = (await service.getClubRequestsAnalytics()) as any;

      expect(result.byStatus).toEqual([
        { status: 'ACCEPTED', count: 40 },
        { status: 'COMPLETED', count: 30 },
        { status: 'PENDING', count: 20 },
        { status: 'REJECTED', count: 10 },
      ]);

      expect(result.total).toBe(100);
      expect(result.successRate).toBeGreaterThan(0);
      expect(result.averageResponseTimeInDays).toBeGreaterThan(0);
    });

    it('should calculate success rate correctly', async () => {
      mockPrismaService.club_requests.groupBy.mockResolvedValue(mockRequestsByStatus);
      mockPrismaService.club_requests.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(40) // accepted
        .mockResolvedValueOnce(30); // completed
      mockPrismaService.club_requests.findMany.mockResolvedValue(mockRequestsWithResponse);

      const result = (await service.getClubRequestsAnalytics()) as any;

      // Success rate = (40 accepted + 30 completed) / 100 total = 70%
      expect(result.successRate).toBe(70);
    });

    it('should handle zero total requests', async () => {
      mockPrismaService.club_requests.groupBy.mockResolvedValue([]);
      mockPrismaService.club_requests.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // accepted
        .mockResolvedValueOnce(0); // completed
      mockPrismaService.club_requests.findMany.mockResolvedValue([]);

      const result = (await service.getClubRequestsAnalytics()) as any;

      expect(result.successRate).toBe(0);
    });

    it('should calculate average response time in days', async () => {
      mockPrismaService.club_requests.groupBy.mockResolvedValue(mockRequestsByStatus);
      mockPrismaService.club_requests.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(40) // accepted
        .mockResolvedValueOnce(30); // completed
      mockPrismaService.club_requests.findMany.mockResolvedValue(mockRequestsWithResponse);

      const result = (await service.getClubRequestsAnalytics()) as any;

      // (2 days + 1 day) / 2 = 1.5 days
      expect(result.averageResponseTimeInDays).toBeCloseTo(1.5, 1);
    });
  });

  describe('getEventsAnalytics', () => {
    const mockEventsByType = [
      { type: 'MATCH', _count: 50 },
      { type: 'TRAINING', _count: 30 },
    ];

    const mockPopularEvents = [{ id: 'event-1', title: 'Match PSG vs OM', type: 'MATCH' }];

    beforeEach(() => {
      mockPrismaService.events.count
        .mockResolvedValueOnce(80) // total
        .mockResolvedValueOnce(45); // upcoming
      mockPrismaService.events.groupBy.mockResolvedValue(mockEventsByType);
      mockPrismaService.events.findMany.mockResolvedValue(mockPopularEvents);
    });

    it('should return events analytics', async () => {
      const result = (await service.getEventsAnalytics()) as any;

      expect(result.total).toBe(80);
      expect(result.upcoming).toBe(45);
      expect(result.byType).toEqual([
        { type: 'MATCH', count: 50 },
        { type: 'TRAINING', count: 30 },
      ]);
      expect(result.popular).toEqual(mockPopularEvents);
    });

    it('should query upcoming events with date filter', async () => {
      await service.getEventsAnalytics();

      expect(mockPrismaService.events.count).toHaveBeenCalledWith({
        where: { startDate: { gte: expect.any(Date) } },
      });
    });
  });

  describe('getActivityTrends', () => {
    beforeEach(() => {
      // Mock $queryRaw responses for grouped data
      mockPrismaService.$queryRaw
        .mockResolvedValueOnce([]) // users data
        .mockResolvedValueOnce([]) // players data
        .mockResolvedValueOnce([]) // reports data
        .mockResolvedValueOnce([]); // requests data
    });

    it('should return activity trends for default 30 days', async () => {
      const result = (await service.getActivityTrends()) as any;

      expect(result.period).toBe('30 derniers jours');
      expect(result.data).toHaveLength(30);
      expect(result.data[0]).toHaveProperty('date');
      expect(result.data[0]).toHaveProperty('newUsers');
      expect(result.data[0]).toHaveProperty('newPlayers');
      expect(result.data[0]).toHaveProperty('newReports');
      expect(result.data[0]).toHaveProperty('newRequests');
    });

    it('should return activity trends for custom days', async () => {
      const result = (await service.getActivityTrends(7)) as any;

      expect(result.period).toBe('7 derniers jours');
      expect(result.data).toHaveLength(7);
    });

    it('should query data with date range filters', async () => {
      await service.getActivityTrends(7);

      // Should call $queryRaw 4 times (users, players, reports, requests)
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(4);
    });

    it('should format dates as ISO strings', async () => {
      const result = (await service.getActivityTrends(3)) as any;

      result.data.forEach((day) => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  // ==========================================
  // CACHE HIT SCENARIOS - Lines 21, 93, 185, 250
  // ==========================================

  describe('Cache hit scenarios', () => {
    it('should return cached result for getPlatformOverview', async () => {
      const cachedData = { overview: { totalUsers: 999 } };
      mockRedisService.get.mockResolvedValueOnce(cachedData);

      const result = await service.getPlatformOverview();

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.users.count).not.toHaveBeenCalled();
    });

    it('should return cached result for getPlayersAnalytics', async () => {
      const cachedData = { byStatus: [], ageStats: { average: 25 } };
      mockRedisService.get.mockResolvedValueOnce(cachedData);

      const result = await service.getPlayersAnalytics();

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.players.groupBy).not.toHaveBeenCalled();
    });

    it('should return cached result for getClubsAnalytics', async () => {
      const cachedData = { total: 100, byCountry: [] };
      mockRedisService.get.mockResolvedValueOnce(cachedData);

      const result = await service.getClubsAnalytics();

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.clubs.count).not.toHaveBeenCalled();
    });

    it('should return cached result for getScoutingReportsAnalytics', async () => {
      const cachedData = { byStatus: [], ratingStats: { average: 8 } };
      mockRedisService.get.mockResolvedValueOnce(cachedData);

      const result = await service.getScoutingReportsAnalytics();

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.scouting_reports.groupBy).not.toHaveBeenCalled();
    });
  });

  // ==========================================
  // RBAC MONITORING - Lines 491-850
  // ==========================================

  describe('trackFeatureBlocked', () => {
    it('should find and return existing event ID within last minute', async () => {
      const mockEvent = {
        id: 'event-123',
        userId: 'user-1',
        feature: 'advanced-analytics',
        eventType: 'FEATURE_BLOCKED',
        timestamp: new Date(),
      };
      mockPrismaService.rbac_events.findFirst.mockResolvedValue(mockEvent);

      const result = await service.trackFeatureBlocked('user-1', 'advanced-analytics', 'PRO');

      expect(result).toBe('event-123');
      expect(mockPrismaService.rbac_events.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          feature: 'advanced-analytics',
          eventType: 'FEATURE_BLOCKED',
          timestamp: {
            gte: expect.any(Date),
          },
        },
      });
    });

    it('should return null when no recent event found', async () => {
      mockPrismaService.rbac_events.findFirst.mockResolvedValue(null);

      const result = await service.trackFeatureBlocked('user-1', 'advanced-analytics', 'PRO');

      expect(result).toBeNull();
    });
  });

  describe('trackUpgradeModalShown', () => {
    it('should create upgrade modal record', async () => {
      const mockModal = {
        id: 'modal_123',
        userId: 'user-1',
        feature: 'advanced-analytics',
        trigger: '403_error',
        shownAt: new Date(),
      };
      mockPrismaService.upgrade_modals.create.mockResolvedValue(mockModal);

      const result = await service.trackUpgradeModalShown('user-1', 'advanced-analytics');

      expect(result).toBe('modal_123');
      expect(mockPrismaService.upgrade_modals.create).toHaveBeenCalledWith({
        data: {
          id: expect.stringContaining('modal_'),
          userId: 'user-1',
          feature: 'advanced-analytics',
          trigger: '403_error',
        },
      });
    });

    it('should generate unique modal IDs', async () => {
      const mockModal1 = {
        id: 'modal_1',
        userId: 'user-1',
        feature: 'feat-1',
        trigger: '403_error',
      };
      const mockModal2 = {
        id: 'modal_2',
        userId: 'user-2',
        feature: 'feat-2',
        trigger: '403_error',
      };

      mockPrismaService.upgrade_modals.create
        .mockResolvedValueOnce(mockModal1)
        .mockResolvedValueOnce(mockModal2);

      const result1 = await service.trackUpgradeModalShown('user-1', 'feat-1');
      const result2 = await service.trackUpgradeModalShown('user-2', 'feat-2');

      expect(result1).toBe('modal_1');
      expect(result2).toBe('modal_2');
    });
  });

  describe('trackUpgradeModalDismissed', () => {
    it('should update modal with dismissal data', async () => {
      mockPrismaService.upgrade_modals.update.mockResolvedValue({});

      await service.trackUpgradeModalDismissed('modal-123', 45);

      expect(mockPrismaService.upgrade_modals.update).toHaveBeenCalledWith({
        where: { id: 'modal-123' },
        data: {
          dismissedAt: expect.any(Date),
          timeShownSeconds: 45,
        },
      });
    });

    it('should handle different time shown values', async () => {
      mockPrismaService.upgrade_modals.update.mockResolvedValue({});

      await service.trackUpgradeModalDismissed('modal-123', 120);

      expect(mockPrismaService.upgrade_modals.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timeShownSeconds: 120,
          }),
        }),
      );
    });
  });

  describe('trackUpgradeModalCtaClicked', () => {
    it('should update modal with CTA click timestamp', async () => {
      mockPrismaService.upgrade_modals.update.mockResolvedValue({});

      await service.trackUpgradeModalCtaClicked('modal-123');

      expect(mockPrismaService.upgrade_modals.update).toHaveBeenCalledWith({
        where: { id: 'modal-123' },
        data: {
          ctaClickedAt: expect.any(Date),
        },
      });
    });

    it('should handle multiple CTA clicks for different modals', async () => {
      mockPrismaService.upgrade_modals.update.mockResolvedValue({});

      await service.trackUpgradeModalCtaClicked('modal-1');
      await service.trackUpgradeModalCtaClicked('modal-2');

      expect(mockPrismaService.upgrade_modals.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('trackUpgradeConversion', () => {
    it('should create conversion record with calculated revenue', async () => {
      mockPrismaService.subscription_conversions.create.mockResolvedValue({});

      await service.trackUpgradeConversion(
        'user-1',
        'FREE',
        'PRO',
        'upgrade_modal',
        'advanced-analytics',
      );

      expect(mockPrismaService.subscription_conversions.create).toHaveBeenCalledWith({
        data: {
          id: expect.stringContaining('conv_'),
          userId: 'user-1',
          fromTier: 'FREE',
          toTier: 'PRO',
          source: 'upgrade_modal',
          feature: 'advanced-analytics',
          revenue: 39.99,
          currency: 'EUR',
        },
      });
    });

    it('should use custom revenue when provided', async () => {
      mockPrismaService.subscription_conversions.create.mockResolvedValue({});

      await service.trackUpgradeConversion(
        'user-1',
        'FREE',
        'ENTERPRISE',
        'sales_call',
        'custom',
        150,
      );

      expect(mockPrismaService.subscription_conversions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            revenue: 150,
          }),
        }),
      );
    });

    it('should handle all tier pricing correctly', async () => {
      mockPrismaService.subscription_conversions.create.mockResolvedValue({});

      const tiers = [
        { from: 'FREE', to: 'BASIC', expectedRevenue: 19.99 },
        { from: 'BASIC', to: 'PRO', expectedRevenue: 39.99 },
        { from: 'PRO', to: 'GOLD', expectedRevenue: 49.99 },
        { from: 'GOLD', to: 'ENTERPRISE', expectedRevenue: 99.99 },
      ];

      for (const tier of tiers) {
        await service.trackUpgradeConversion('user-1', tier.from, tier.to, 'test');

        expect(mockPrismaService.subscription_conversions.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              revenue: tier.expectedRevenue,
            }),
          }),
        );
      }
    });

    it('should use 0 revenue for unknown tiers', async () => {
      mockPrismaService.subscription_conversions.create.mockResolvedValue({});

      await service.trackUpgradeConversion('user-1', 'FREE', 'UNKNOWN_TIER', 'test');

      expect(mockPrismaService.subscription_conversions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            revenue: 0,
          }),
        }),
      );
    });

    it('should set default source to unknown when not provided', async () => {
      mockPrismaService.subscription_conversions.create.mockResolvedValue({});

      await service.trackUpgradeConversion('user-1', 'FREE', 'PRO');

      expect(mockPrismaService.subscription_conversions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: 'unknown',
          }),
        }),
      );
    });
  });

  describe('get403Rate', () => {
    it('should calculate 403 error rate correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      mockPrismaService.rbac_events.count.mockResolvedValue(50);
      mockPrismaService.users.count.mockResolvedValue(10);

      const result = await service.get403Rate(startDate, endDate);

      expect(result.total403Errors).toBe(50);
      expect(result.estimatedTotalRequests).toBe(1000); // 10 users * 100 requests
      expect(result.rate403Percentage).toBe(5); // 50/1000 * 100 = 5%
    });

    it('should handle zero active users', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      mockPrismaService.rbac_events.count.mockResolvedValue(0);
      mockPrismaService.users.count.mockResolvedValue(0);

      const result = await service.get403Rate(startDate, endDate);

      expect(result.rate403Percentage).toBe(0);
    });

    it('should query with correct date range', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      mockPrismaService.rbac_events.count.mockResolvedValue(50);
      mockPrismaService.users.count.mockResolvedValue(10);

      await service.get403Rate(startDate, endDate);

      expect(mockPrismaService.rbac_events.count).toHaveBeenCalledWith({
        where: {
          eventType: 'FEATURE_BLOCKED',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(mockPrismaService.users.count).toHaveBeenCalledWith({
        where: {
          lastLoginAt: {
            gte: startDate,
          },
        },
      });
    });
  });

  describe('getConversionRate', () => {
    it('should calculate conversion rate correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      mockPrismaService.rbac_events.count.mockResolvedValue(100); // blocked
      mockPrismaService.subscription_conversions.count.mockResolvedValue(15); // conversions

      const result = await service.getConversionRate(startDate, endDate);

      expect(result.totalBlocked).toBe(100);
      expect(result.totalConversions).toBe(15);
      expect(result.conversionRatePercentage).toBe(15); // 15/100 * 100 = 15%
    });

    it('should handle zero blocked events', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      mockPrismaService.rbac_events.count.mockResolvedValue(0);
      mockPrismaService.subscription_conversions.count.mockResolvedValue(0);

      const result = await service.getConversionRate(startDate, endDate);

      expect(result.conversionRatePercentage).toBe(0);
    });

    it('should query both tables with correct date filters', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-07');

      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.subscription_conversions.count.mockResolvedValue(15);

      await service.getConversionRate(startDate, endDate);

      expect(mockPrismaService.rbac_events.count).toHaveBeenCalledWith({
        where: {
          eventType: 'FEATURE_BLOCKED',
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      expect(mockPrismaService.subscription_conversions.count).toHaveBeenCalledWith({
        where: {
          convertedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      });
    });
  });

  describe('getRbacMetrics', () => {
    const mockRbacData = {
      total403Events: 100,
      mostBlockedFeatures: [
        { feature: 'advanced-analytics' },
        { feature: 'advanced-analytics' },
        { feature: 'export-data' },
      ],
      modalStats: [
        { id: 'modal-1', dismissedAt: new Date(), ctaClickedAt: null },
        { id: 'modal-2', dismissedAt: null, ctaClickedAt: new Date() },
        { id: 'modal-3', dismissedAt: new Date(), ctaClickedAt: new Date() },
      ],
      conversions: [
        {
          fromTier: 'FREE',
          toTier: 'GOLD',
          revenue: 49.99,
          source: 'upgrade_modal',
          feature: 'feat-1',
        },
        { fromTier: 'FREE', toTier: 'PRO', revenue: 39.99, source: 'direct', feature: 'feat-2' },
        {
          fromTier: 'BASIC',
          toTier: 'GOLD',
          revenue: 49.99,
          source: 'upgrade_modal',
          feature: 'feat-3',
        },
      ],
      conversionsBySource: [
        { source: 'upgrade_modal', _count: 2, _sum: { revenue: 99.98 } },
        { source: 'direct', _count: 1, _sum: { revenue: 39.99 } },
      ],
      totalRevenue: { _sum: { revenue: 139.97 } },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockRedisService.get.mockResolvedValue(null);
    });

    it('should return comprehensive RBAC metrics', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(mockRbacData.total403Events);
      mockPrismaService.rbac_events.findMany.mockResolvedValue(mockRbacData.mostBlockedFeatures);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue(mockRbacData.modalStats);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue(
        mockRbacData.conversions,
      );
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue(
        mockRbacData.conversionsBySource,
      );
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue(
        mockRbacData.totalRevenue,
      );
      mockPrismaService.users.count.mockResolvedValue(50);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.period).toBe('last_7_days');
      expect(result.total_403_errors).toBe(100);
      expect(result.most_blocked_features).toHaveLength(2);
      expect(result.conversions.total).toBe(3);
      expect(result.conversions.revenue_generated).toBe(139.97);
    });

    it('should return empty blocked features when there are no blocked events', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(0);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockPrismaService.users.count.mockResolvedValue(10);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.most_blocked_features).toEqual([]);
    });

    it('should fallback to empty blocked features when blocked-features query fails', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockRejectedValue(new Error('prisma panic simulation'));
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockPrismaService.users.count.mockResolvedValue(10);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.most_blocked_features).toEqual([]);
      expect(result.total_403_errors).toBe(100);
    });

    it('should calculate modal statistics correctly', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue(mockRbacData.modalStats);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockPrismaService.users.count.mockResolvedValue(10);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.upgrade_modal.shown).toBe(3);
      expect(result.upgrade_modal.dismissed).toBe(2);
      expect(result.upgrade_modal.cta_clicked).toBe(2);
      expect(result.upgrade_modal.ctr).toBeCloseTo(66.67, 1); // 2/3 * 100
      expect(result.upgrade_modal.dismiss_rate).toBeCloseTo(66.67, 1); // 2/3 * 100
    });

    it('should calculate conversion by tier correctly', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue(
        mockRbacData.conversions,
      );
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue(
        mockRbacData.conversionsBySource,
      );
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue(
        mockRbacData.totalRevenue,
      );
      mockPrismaService.users.count.mockResolvedValue(10);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.conversions.by_tier['FREE_to_GOLD']).toBe(1);
      expect(result.conversions.by_tier['FREE_to_PRO']).toBe(1);
      expect(result.conversions.by_tier['BASIC_to_GOLD']).toBe(1);
      expect(result.conversions.free_to_gold).toBe(1);
    });

    it('should group conversions by source', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue(
        mockRbacData.conversions,
      );
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue(
        mockRbacData.conversionsBySource,
      );
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue(
        mockRbacData.totalRevenue,
      );
      mockPrismaService.users.count.mockResolvedValue(10);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.conversions.by_source).toEqual([
        { source: 'upgrade_modal', count: 2, revenue: 99.98 },
        { source: 'direct', count: 1, revenue: 39.99 },
      ]);
    });

    it('should cache results for 5 minutes', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockPrismaService.users.count.mockResolvedValue(10);

      await service.getRbacMetrics(7);

      expect(mockRedisService.set).toHaveBeenCalledWith(
        'analytics:rbac_metrics:7',
        expect.any(Object),
        300,
      );
    });

    it('should return cached result when available', async () => {
      const cachedData = { period: 'last_7_days', total_403_errors: 999 };
      mockRedisService.get.mockResolvedValueOnce(cachedData);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result).toEqual(cachedData);
      expect(mockPrismaService.rbac_events.count).not.toHaveBeenCalled();
    });

    it('should include recommendations', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockPrismaService.users.count.mockResolvedValue(10);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should support custom date ranges', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockPrismaService.users.count.mockResolvedValue(10);

      const result30 = (await service.getRbacMetrics(30)) as any;
      const result14 = (await service.getRbacMetrics(14)) as any;

      expect(result30.period).toBe('last_30_days');
      expect(result14.period).toBe('last_14_days');
    });

    it('should handle null revenue sums gracefully', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([
        { source: 'test', _count: 1, _sum: { revenue: null } },
      ]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: null },
      });
      mockPrismaService.users.count.mockResolvedValue(10);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.conversions.revenue_generated).toBe(0);
      expect(result.conversions.by_source[0].revenue).toBe(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should recommend action for high 403 rate', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockPrismaService.users.count.mockResolvedValue(8); // Creates >10% 403 rate

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.recommendations.some((r: string) => r.includes('HIGH 403 RATE ALERT'))).toBe(
        true,
      );
    });

    it('should recommend action for low conversion rate', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([
        { fromTier: 'FREE', toTier: 'PRO', revenue: 39.99, source: 'test', feature: 'feat' },
      ]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 39.99 },
      });
      mockPrismaService.users.count.mockResolvedValue(100);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.recommendations.some((r: string) => r.includes('LOW CONVERSION RATE'))).toBe(
        true,
      );
    });

    it('should recommend action for low CTR', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([
        { id: 'modal-1', dismissedAt: new Date(), ctaClickedAt: null },
        { id: 'modal-2', dismissedAt: new Date(), ctaClickedAt: null },
        { id: 'modal-3', dismissedAt: new Date(), ctaClickedAt: null },
        { id: 'modal-4', dismissedAt: new Date(), ctaClickedAt: null },
        { id: 'modal-5', dismissedAt: new Date(), ctaClickedAt: null },
      ]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 0 },
      });
      mockPrismaService.users.count.mockResolvedValue(100);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.recommendations.some((r: string) => r.includes('LOW MODAL CTR'))).toBe(true);
    });

    it('should show excellent performance message for good metrics', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([
        { id: 'modal-1', dismissedAt: null, ctaClickedAt: new Date() },
        { id: 'modal-2', dismissedAt: null, ctaClickedAt: new Date() },
        { id: 'modal-3', dismissedAt: null, ctaClickedAt: new Date() },
      ]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([
        ...Array(20).fill({
          fromTier: 'FREE',
          toTier: 'PRO',
          revenue: 39.99,
          source: 'test',
          feature: 'feat',
        }),
      ]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 799.8 },
      });
      mockPrismaService.users.count.mockResolvedValue(100);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.recommendations.some((r: string) => r.includes('EXCELLENT PERFORMANCE'))).toBe(
        true,
      );
    });

    it('should show moderate performance when metrics are acceptable', async () => {
      mockPrismaService.rbac_events.count.mockResolvedValue(100);
      mockPrismaService.rbac_events.findMany.mockResolvedValue([]);
      mockPrismaService.upgrade_modals.findMany.mockResolvedValue([
        { id: 'modal-1', dismissedAt: null, ctaClickedAt: new Date() },
        { id: 'modal-2', dismissedAt: new Date(), ctaClickedAt: null },
      ]);
      mockPrismaService.subscription_conversions.findMany.mockResolvedValue([
        ...Array(8).fill({
          fromTier: 'FREE',
          toTier: 'PRO',
          revenue: 39.99,
          source: 'test',
          feature: 'feat',
        }),
      ]);
      mockPrismaService.subscription_conversions.groupBy.mockResolvedValue([]);
      mockPrismaService.subscription_conversions.aggregate.mockResolvedValue({
        _sum: { revenue: 319.92 },
      });
      mockPrismaService.users.count.mockResolvedValue(100);

      const result = (await service.getRbacMetrics(7)) as any;

      expect(result.recommendations.some((r: string) => r.includes('MODERATE PERFORMANCE'))).toBe(
        true,
      );
    });
  });
});
