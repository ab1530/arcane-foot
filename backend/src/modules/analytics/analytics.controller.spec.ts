import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let analyticsService: AnalyticsService;

  const mockAnalyticsService = {
    getUserDashboard: jest.fn(),
    getPlatformOverview: jest.fn(),
    getPlayersAnalytics: jest.fn(),
    getClubsAnalytics: jest.fn(),
    getScoutingReportsAnalytics: jest.fn(),
    getClubRequestsAnalytics: jest.fn(),
    getEventsAnalytics: jest.fn(),
    getActivityTrends: jest.fn(),
    getRbacMetrics: jest.fn(),
    get403Rate: jest.fn(),
    getConversionRate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: AnalyticsService,
          useValue: mockAnalyticsService,
        },
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserDashboard', () => {
    it('should return user dashboard stats for current user', async () => {
      const mockUser = {
        id: 'user-123',
        role: 'SCOUT',
      };
      const mockDashboard = {
        userId: 'user-123',
        role: 'SCOUT',
        totalReports: 14,
        reportsLast7Days: 4,
        reportsLast30Days: 8,
        playersScouted: 5,
        matchesAttended: 12,
        openDemandRequests: 9,
      };

      mockAnalyticsService.getUserDashboard.mockResolvedValue(mockDashboard);

      const result = await controller.getUserDashboard({ user: mockUser } as any);

      expect(result).toEqual(mockDashboard);
      expect(mockAnalyticsService.getUserDashboard).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getUserDashboard).toHaveBeenCalledWith('user-123', 'SCOUT');
    });
  });

  describe('getPlatformOverview', () => {
    it('should return platform overview statistics', async () => {
      const mockOverview = {
        overview: {
          totalUsers: 100,
          totalPlayers: 250,
          totalClubs: 50,
          totalMatches: 120,
          totalScoutingReports: 300,
          totalEvents: 45,
          totalKanbanBoards: 30,
          totalClubRequests: 75,
        },
        recentActivity: {
          newUsersLast7Days: 15,
          newPlayersLast7Days: 25,
          newScoutingReportsLast7Days: 40,
          newClubRequestsLast7Days: 12,
        },
        timestamp: new Date(),
      };

      mockAnalyticsService.getPlatformOverview.mockResolvedValue(mockOverview);

      const result = await controller.getPlatformOverview();

      expect(result).toEqual(mockOverview);
      expect(mockAnalyticsService.getPlatformOverview).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getPlatformOverview).toHaveBeenCalledWith();
    });

    it('should call service method without any parameters', async () => {
      const mockData = { overview: {}, recentActivity: {} };
      mockAnalyticsService.getPlatformOverview.mockResolvedValue(mockData);

      await controller.getPlatformOverview();

      expect(mockAnalyticsService.getPlatformOverview).toHaveBeenCalledWith();
    });
  });

  describe('getPlayersAnalytics', () => {
    it('should return players analytics', async () => {
      const mockPlayersAnalytics = {
        byStatus: [
          { status: 'ACTIVE', count: 150 },
          { status: 'INACTIVE', count: 50 },
        ],
        byPosition: [
          { position: 'Forward', count: 80 },
          { position: 'Midfielder', count: 90 },
        ],
        byNationality: [
          { nationality: 'FR', count: 100 },
          { nationality: 'ES', count: 50 },
        ],
        ageStats: {
          average: 24.5,
          min: 18,
          max: 35,
        },
        topRatedPlayers: [],
      };

      mockAnalyticsService.getPlayersAnalytics.mockResolvedValue(mockPlayersAnalytics);

      const result = await controller.getPlayersAnalytics();

      expect(result).toEqual(mockPlayersAnalytics);
      expect(mockAnalyticsService.getPlayersAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getPlayersAnalytics).toHaveBeenCalledWith();
    });

    it('should call service method without parameters', async () => {
      const mockData = { byStatus: [], byPosition: [] };
      mockAnalyticsService.getPlayersAnalytics.mockResolvedValue(mockData);

      await controller.getPlayersAnalytics();

      expect(mockAnalyticsService.getPlayersAnalytics).toHaveBeenCalledWith();
    });
  });

  describe('getClubsAnalytics', () => {
    it('should return clubs analytics', async () => {
      const mockClubsAnalytics = {
        total: 50,
        byCountry: [
          { country: 'France', count: 30 },
          { country: 'Spain', count: 20 },
        ],
        withMostPlayers: [],
        mostActive: [],
      };

      mockAnalyticsService.getClubsAnalytics.mockResolvedValue(mockClubsAnalytics);

      const result = await controller.getClubsAnalytics();

      expect(result).toEqual(mockClubsAnalytics);
      expect(mockAnalyticsService.getClubsAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getClubsAnalytics).toHaveBeenCalledWith();
    });

    it('should call service method without parameters', async () => {
      const mockData = { total: 0, byCountry: [] };
      mockAnalyticsService.getClubsAnalytics.mockResolvedValue(mockData);

      await controller.getClubsAnalytics();

      expect(mockAnalyticsService.getClubsAnalytics).toHaveBeenCalledWith();
    });
  });

  describe('getScoutingReportsAnalytics', () => {
    it('should return scouting reports analytics', async () => {
      const mockScoutingReportsAnalytics = {
        byStatus: [
          { status: 'APPROVED', count: 150 },
          { status: 'SUBMITTED', count: 50 },
        ],
        ratingStats: {
          average: 7.5,
          min: 5,
          max: 10,
          total: 200,
        },
        mostActiveScouts: [],
        recentCount: 30,
      };

      mockAnalyticsService.getScoutingReportsAnalytics.mockResolvedValue(
        mockScoutingReportsAnalytics,
      );

      const result = await controller.getScoutingReportsAnalytics();

      expect(result).toEqual(mockScoutingReportsAnalytics);
      expect(mockAnalyticsService.getScoutingReportsAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getScoutingReportsAnalytics).toHaveBeenCalledWith();
    });

    it('should call service method without parameters', async () => {
      const mockData = { byStatus: [], ratingStats: {} };
      mockAnalyticsService.getScoutingReportsAnalytics.mockResolvedValue(mockData);

      await controller.getScoutingReportsAnalytics();

      expect(mockAnalyticsService.getScoutingReportsAnalytics).toHaveBeenCalledWith();
    });
  });

  describe('getClubRequestsAnalytics', () => {
    it('should return club requests analytics', async () => {
      const mockClubRequestsAnalytics = {
        byStatus: [
          { status: 'ACCEPTED', count: 40 },
          { status: 'PENDING', count: 20 },
        ],
        total: 100,
        successRate: 70,
        averageResponseTimeInDays: 1.5,
      };

      mockAnalyticsService.getClubRequestsAnalytics.mockResolvedValue(mockClubRequestsAnalytics);

      const result = await controller.getClubRequestsAnalytics();

      expect(result).toEqual(mockClubRequestsAnalytics);
      expect(mockAnalyticsService.getClubRequestsAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getClubRequestsAnalytics).toHaveBeenCalledWith();
    });

    it('should call service method without parameters', async () => {
      const mockData = { byStatus: [], total: 0 };
      mockAnalyticsService.getClubRequestsAnalytics.mockResolvedValue(mockData);

      await controller.getClubRequestsAnalytics();

      expect(mockAnalyticsService.getClubRequestsAnalytics).toHaveBeenCalledWith();
    });
  });

  describe('getEventsAnalytics', () => {
    it('should return events analytics', async () => {
      const mockEventsAnalytics = {
        total: 80,
        upcoming: 45,
        byType: [
          { type: 'MATCH', count: 50 },
          { type: 'TRAINING', count: 30 },
        ],
        popular: [],
      };

      mockAnalyticsService.getEventsAnalytics.mockResolvedValue(mockEventsAnalytics);

      const result = await controller.getEventsAnalytics();

      expect(result).toEqual(mockEventsAnalytics);
      expect(mockAnalyticsService.getEventsAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getEventsAnalytics).toHaveBeenCalledWith();
    });

    it('should call service method without parameters', async () => {
      const mockData = { total: 0, upcoming: 0 };
      mockAnalyticsService.getEventsAnalytics.mockResolvedValue(mockData);

      await controller.getEventsAnalytics();

      expect(mockAnalyticsService.getEventsAnalytics).toHaveBeenCalledWith();
    });
  });

  describe('getActivityTrends', () => {
    it('should return activity trends with default days (30)', async () => {
      const mockActivityTrends = {
        period: '30 derniers jours',
        data: [
          {
            date: '2025-01-01',
            newUsers: 5,
            newPlayers: 10,
            newReports: 8,
            newRequests: 3,
          },
        ],
      };

      mockAnalyticsService.getActivityTrends.mockResolvedValue(mockActivityTrends);

      const result = await controller.getActivityTrends();

      expect(result).toEqual(mockActivityTrends);
      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledWith(30);
    });

    it('should return activity trends with custom days', async () => {
      const mockActivityTrends = {
        period: '7 derniers jours',
        data: [],
      };

      mockAnalyticsService.getActivityTrends.mockResolvedValue(mockActivityTrends);

      const result = await controller.getActivityTrends('7');

      expect(result).toEqual(mockActivityTrends);
      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledWith(7);
    });

    it('should parse days query parameter as integer', async () => {
      mockAnalyticsService.getActivityTrends.mockResolvedValue({ period: '15 days', data: [] });

      await controller.getActivityTrends('15');

      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledWith(15);
    });

    it('should handle string days parameter correctly', async () => {
      mockAnalyticsService.getActivityTrends.mockResolvedValue({ period: '90 days', data: [] });

      await controller.getActivityTrends('90');

      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledWith(90);
    });

    it('should use default when days is undefined', async () => {
      mockAnalyticsService.getActivityTrends.mockResolvedValue({ period: '30 days', data: [] });

      await controller.getActivityTrends(undefined);

      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledWith(30);
    });
  });

  describe('getRbacMetrics', () => {
    it('should return RBAC metrics with default days (7)', async () => {
      const mockRbacMetrics = {
        period: 'last_7_days',
        dateRange: {
          start: '2025-11-01T00:00:00.000Z',
          end: '2025-11-07T23:59:59.999Z',
        },
        total_403_errors: 450,
        '403_rate': 4.2,
        most_blocked_features: [
          { feature: 'AI Analysis', count: 120 },
          { feature: 'ArkaneMatch Chat', count: 85 },
        ],
        conversions: {
          free_to_gold: 12,
          total: 15,
          conversion_rate: 14.5,
          revenue_generated: 749.85,
        },
        upgrade_modal: {
          shown: 83,
          dismissed: 71,
          cta_clicked: 15,
          ctr: 18.1,
          dismiss_rate: 85.5,
        },
        recommendations: ['MODERATE PERFORMANCE: Metrics are within acceptable ranges.'],
      };

      mockAnalyticsService.getRbacMetrics.mockResolvedValue(mockRbacMetrics);

      const result = await controller.getRbacMetrics();

      expect(result).toEqual(mockRbacMetrics);
      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledWith(7);
    });

    it('should return RBAC metrics with custom days', async () => {
      const mockRbacMetrics = {
        period: 'last_30_days',
        total_403_errors: 1200,
        conversions: { total: 50 },
      };

      mockAnalyticsService.getRbacMetrics.mockResolvedValue(mockRbacMetrics);

      const result = await controller.getRbacMetrics('30');

      expect(result).toEqual(mockRbacMetrics);
      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledWith(30);
    });

    it('should parse days query parameter as integer', async () => {
      mockAnalyticsService.getRbacMetrics.mockResolvedValue({ period: 'last_14_days' });

      await controller.getRbacMetrics('14');

      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledWith(14);
    });

    it('should use default when days is undefined', async () => {
      mockAnalyticsService.getRbacMetrics.mockResolvedValue({ period: 'last_7_days' });

      await controller.getRbacMetrics(undefined);

      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledWith(7);
    });
  });

  describe('get403Rate', () => {
    it('should return 403 error rate with default date range (7 days)', async () => {
      const mockRateData = {
        total403Errors: 450,
        estimatedTotalRequests: 10000,
        rate403Percentage: 4.5,
      };

      mockAnalyticsService.get403Rate.mockResolvedValue(mockRateData);

      const result = await controller.get403Rate();

      expect(result).toEqual(mockRateData);
      expect(mockAnalyticsService.get403Rate).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.get403Rate).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should return 403 error rate with custom start date', async () => {
      const startDate = '2025-11-01T00:00:00.000Z';
      const mockRateData = {
        total403Errors: 100,
        estimatedTotalRequests: 5000,
        rate403Percentage: 2.0,
      };

      mockAnalyticsService.get403Rate.mockResolvedValue(mockRateData);

      const result = await controller.get403Rate(startDate);

      expect(result).toEqual(mockRateData);
      expect(mockAnalyticsService.get403Rate).toHaveBeenCalledTimes(1);

      const callArgs = mockAnalyticsService.get403Rate.mock.calls[0];
      expect(callArgs[0]).toEqual(new Date(startDate));
      expect(callArgs[1]).toBeInstanceOf(Date);
    });

    it('should return 403 error rate with custom date range', async () => {
      const startDate = '2025-11-01T00:00:00.000Z';
      const endDate = '2025-11-07T23:59:59.999Z';
      const mockRateData = {
        total403Errors: 250,
        estimatedTotalRequests: 8000,
        rate403Percentage: 3.125,
      };

      mockAnalyticsService.get403Rate.mockResolvedValue(mockRateData);

      const result = await controller.get403Rate(startDate, endDate);

      expect(result).toEqual(mockRateData);
      expect(mockAnalyticsService.get403Rate).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.get403Rate).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
    });

    it('should parse date strings into Date objects', async () => {
      const startDate = '2025-10-01';
      const endDate = '2025-10-31';

      mockAnalyticsService.get403Rate.mockResolvedValue({ total403Errors: 0 });

      await controller.get403Rate(startDate, endDate);

      const callArgs = mockAnalyticsService.get403Rate.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[1]).toBeInstanceOf(Date);
      expect(callArgs[0].getTime()).toBe(new Date(startDate).getTime());
      expect(callArgs[1].getTime()).toBe(new Date(endDate).getTime());
    });

    it('should calculate default start date as 7 days ago when not provided', async () => {
      mockAnalyticsService.get403Rate.mockResolvedValue({ total403Errors: 0 });

      const beforeCall = Date.now();
      await controller.get403Rate();
      const afterCall = Date.now();

      const callArgs = mockAnalyticsService.get403Rate.mock.calls[0];
      const startDate = callArgs[0] as Date;
      const endDate = callArgs[1] as Date;

      // Start date should be approximately 7 days ago
      const sevenDaysAgo = beforeCall - 7 * 24 * 60 * 60 * 1000;
      expect(startDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo - 1000);
      expect(startDate.getTime()).toBeLessThanOrEqual(afterCall - 7 * 24 * 60 * 60 * 1000 + 1000);

      // End date should be now
      expect(endDate.getTime()).toBeGreaterThanOrEqual(beforeCall);
      expect(endDate.getTime()).toBeLessThanOrEqual(afterCall);
    });

    it('should only provide start date when end date is not specified', async () => {
      const startDate = '2025-11-01';
      mockAnalyticsService.get403Rate.mockResolvedValue({ total403Errors: 0 });

      const beforeCall = Date.now();
      await controller.get403Rate(startDate);
      const afterCall = Date.now();

      const callArgs = mockAnalyticsService.get403Rate.mock.calls[0];
      expect(callArgs[0]).toEqual(new Date(startDate));

      const endDate = callArgs[1] as Date;
      expect(endDate.getTime()).toBeGreaterThanOrEqual(beforeCall);
      expect(endDate.getTime()).toBeLessThanOrEqual(afterCall);
    });
  });

  describe('getConversionRate', () => {
    it('should return conversion rate with default date range (7 days)', async () => {
      const mockConversionData = {
        totalBlocked: 450,
        totalConversions: 67,
        conversionRatePercentage: 14.89,
      };

      mockAnalyticsService.getConversionRate.mockResolvedValue(mockConversionData);

      const result = await controller.getConversionRate();

      expect(result).toEqual(mockConversionData);
      expect(mockAnalyticsService.getConversionRate).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getConversionRate).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date),
      );
    });

    it('should return conversion rate with custom start date', async () => {
      const startDate = '2025-11-01T00:00:00.000Z';
      const mockConversionData = {
        totalBlocked: 200,
        totalConversions: 30,
        conversionRatePercentage: 15.0,
      };

      mockAnalyticsService.getConversionRate.mockResolvedValue(mockConversionData);

      const result = await controller.getConversionRate(startDate);

      expect(result).toEqual(mockConversionData);
      expect(mockAnalyticsService.getConversionRate).toHaveBeenCalledTimes(1);

      const callArgs = mockAnalyticsService.getConversionRate.mock.calls[0];
      expect(callArgs[0]).toEqual(new Date(startDate));
      expect(callArgs[1]).toBeInstanceOf(Date);
    });

    it('should return conversion rate with custom date range', async () => {
      const startDate = '2025-11-01T00:00:00.000Z';
      const endDate = '2025-11-07T23:59:59.999Z';
      const mockConversionData = {
        totalBlocked: 350,
        totalConversions: 52,
        conversionRatePercentage: 14.86,
      };

      mockAnalyticsService.getConversionRate.mockResolvedValue(mockConversionData);

      const result = await controller.getConversionRate(startDate, endDate);

      expect(result).toEqual(mockConversionData);
      expect(mockAnalyticsService.getConversionRate).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getConversionRate).toHaveBeenCalledWith(
        new Date(startDate),
        new Date(endDate),
      );
    });

    it('should parse date strings into Date objects', async () => {
      const startDate = '2025-10-01';
      const endDate = '2025-10-31';

      mockAnalyticsService.getConversionRate.mockResolvedValue({
        totalBlocked: 0,
        totalConversions: 0,
      });

      await controller.getConversionRate(startDate, endDate);

      const callArgs = mockAnalyticsService.getConversionRate.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[1]).toBeInstanceOf(Date);
      expect(callArgs[0].getTime()).toBe(new Date(startDate).getTime());
      expect(callArgs[1].getTime()).toBe(new Date(endDate).getTime());
    });

    it('should calculate default start date as 7 days ago when not provided', async () => {
      mockAnalyticsService.getConversionRate.mockResolvedValue({
        totalBlocked: 0,
        totalConversions: 0,
      });

      const beforeCall = Date.now();
      await controller.getConversionRate();
      const afterCall = Date.now();

      const callArgs = mockAnalyticsService.getConversionRate.mock.calls[0];
      const startDate = callArgs[0] as Date;
      const endDate = callArgs[1] as Date;

      // Start date should be approximately 7 days ago
      const sevenDaysAgo = beforeCall - 7 * 24 * 60 * 60 * 1000;
      expect(startDate.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo - 1000);
      expect(startDate.getTime()).toBeLessThanOrEqual(afterCall - 7 * 24 * 60 * 60 * 1000 + 1000);

      // End date should be now
      expect(endDate.getTime()).toBeGreaterThanOrEqual(beforeCall);
      expect(endDate.getTime()).toBeLessThanOrEqual(afterCall);
    });

    it('should only provide start date when end date is not specified', async () => {
      const startDate = '2025-11-01';
      mockAnalyticsService.getConversionRate.mockResolvedValue({
        totalBlocked: 0,
        totalConversions: 0,
      });

      const beforeCall = Date.now();
      await controller.getConversionRate(startDate);
      const afterCall = Date.now();

      const callArgs = mockAnalyticsService.getConversionRate.mock.calls[0];
      expect(callArgs[0]).toEqual(new Date(startDate));

      const endDate = callArgs[1] as Date;
      expect(endDate.getTime()).toBeGreaterThanOrEqual(beforeCall);
      expect(endDate.getTime()).toBeLessThanOrEqual(afterCall);
    });
  });

  describe('Error Handling', () => {
    it('should propagate errors from getPlatformOverview', async () => {
      const error = new Error('Database connection failed');
      mockAnalyticsService.getPlatformOverview.mockRejectedValue(error);

      await expect(controller.getPlatformOverview()).rejects.toThrow('Database connection failed');
    });

    it('should propagate errors from getPlayersAnalytics', async () => {
      const error = new Error('Service unavailable');
      mockAnalyticsService.getPlayersAnalytics.mockRejectedValue(error);

      await expect(controller.getPlayersAnalytics()).rejects.toThrow('Service unavailable');
    });

    it('should propagate errors from getClubsAnalytics', async () => {
      const error = new Error('Query timeout');
      mockAnalyticsService.getClubsAnalytics.mockRejectedValue(error);

      await expect(controller.getClubsAnalytics()).rejects.toThrow('Query timeout');
    });

    it('should propagate errors from getScoutingReportsAnalytics', async () => {
      const error = new Error('Invalid data');
      mockAnalyticsService.getScoutingReportsAnalytics.mockRejectedValue(error);

      await expect(controller.getScoutingReportsAnalytics()).rejects.toThrow('Invalid data');
    });

    it('should propagate errors from getClubRequestsAnalytics', async () => {
      const error = new Error('Access denied');
      mockAnalyticsService.getClubRequestsAnalytics.mockRejectedValue(error);

      await expect(controller.getClubRequestsAnalytics()).rejects.toThrow('Access denied');
    });

    it('should propagate errors from getEventsAnalytics', async () => {
      const error = new Error('Network error');
      mockAnalyticsService.getEventsAnalytics.mockRejectedValue(error);

      await expect(controller.getEventsAnalytics()).rejects.toThrow('Network error');
    });

    it('should propagate errors from getActivityTrends', async () => {
      const error = new Error('Invalid date range');
      mockAnalyticsService.getActivityTrends.mockRejectedValue(error);

      await expect(controller.getActivityTrends('30')).rejects.toThrow('Invalid date range');
    });

    it('should propagate errors from getRbacMetrics', async () => {
      const error = new Error('Metrics calculation failed');
      mockAnalyticsService.getRbacMetrics.mockRejectedValue(error);

      await expect(controller.getRbacMetrics('7')).rejects.toThrow('Metrics calculation failed');
    });

    it('should propagate errors from get403Rate', async () => {
      const error = new Error('Rate calculation failed');
      mockAnalyticsService.get403Rate.mockRejectedValue(error);

      await expect(controller.get403Rate()).rejects.toThrow('Rate calculation failed');
    });

    it('should propagate errors from getConversionRate', async () => {
      const error = new Error('Conversion data unavailable');
      mockAnalyticsService.getConversionRate.mockRejectedValue(error);

      await expect(controller.getConversionRate()).rejects.toThrow('Conversion data unavailable');
    });
  });

  describe('Query Parameter Parsing', () => {
    it('should handle valid numeric string for days in getActivityTrends', async () => {
      mockAnalyticsService.getActivityTrends.mockResolvedValue({ period: '15 days', data: [] });

      await controller.getActivityTrends('15');

      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledWith(15);
    });

    it('should handle valid numeric string for days in getRbacMetrics', async () => {
      mockAnalyticsService.getRbacMetrics.mockResolvedValue({ period: 'last_30_days' });

      await controller.getRbacMetrics('30');

      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledWith(30);
    });

    it('should handle NaN when parsing invalid days string in getActivityTrends', async () => {
      mockAnalyticsService.getActivityTrends.mockResolvedValue({ period: 'NaN days', data: [] });

      await controller.getActivityTrends('invalid');

      // parseInt('invalid') returns NaN
      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledWith(NaN);
    });

    it('should handle NaN when parsing invalid days string in getRbacMetrics', async () => {
      mockAnalyticsService.getRbacMetrics.mockResolvedValue({ period: 'last_NaN_days' });

      await controller.getRbacMetrics('abc');

      // parseInt('abc') returns NaN
      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledWith(NaN);
    });

    it('should handle empty string for days in getActivityTrends', async () => {
      mockAnalyticsService.getActivityTrends.mockResolvedValue({ period: '30 days', data: [] });

      await controller.getActivityTrends('');

      // parseInt('') returns NaN, so default 30 should be used
      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledWith(30);
    });

    it('should handle null date strings in get403Rate', async () => {
      mockAnalyticsService.get403Rate.mockResolvedValue({ total403Errors: 0 });

      await controller.get403Rate(null, null);

      const callArgs = mockAnalyticsService.get403Rate.mock.calls[0];
      // When null is passed, default dates should be calculated
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[1]).toBeInstanceOf(Date);
    });

    it('should handle null date strings in getConversionRate', async () => {
      mockAnalyticsService.getConversionRate.mockResolvedValue({
        totalBlocked: 0,
        totalConversions: 0,
      });

      await controller.getConversionRate(null, null);

      const callArgs = mockAnalyticsService.getConversionRate.mock.calls[0];
      // When null is passed, default dates should be calculated
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[1]).toBeInstanceOf(Date);
    });
  });

  describe('Service Integration', () => {
    it('should correctly delegate to service for all analytics endpoints', async () => {
      const mockData = { data: 'test' };

      mockAnalyticsService.getPlatformOverview.mockResolvedValue(mockData);
      mockAnalyticsService.getPlayersAnalytics.mockResolvedValue(mockData);
      mockAnalyticsService.getClubsAnalytics.mockResolvedValue(mockData);
      mockAnalyticsService.getScoutingReportsAnalytics.mockResolvedValue(mockData);
      mockAnalyticsService.getClubRequestsAnalytics.mockResolvedValue(mockData);
      mockAnalyticsService.getEventsAnalytics.mockResolvedValue(mockData);
      mockAnalyticsService.getActivityTrends.mockResolvedValue(mockData);
      mockAnalyticsService.getRbacMetrics.mockResolvedValue(mockData);
      mockAnalyticsService.get403Rate.mockResolvedValue(mockData);
      mockAnalyticsService.getConversionRate.mockResolvedValue(mockData);

      await controller.getPlatformOverview();
      await controller.getPlayersAnalytics();
      await controller.getClubsAnalytics();
      await controller.getScoutingReportsAnalytics();
      await controller.getClubRequestsAnalytics();
      await controller.getEventsAnalytics();
      await controller.getActivityTrends();
      await controller.getRbacMetrics();
      await controller.get403Rate();
      await controller.getConversionRate();

      expect(mockAnalyticsService.getPlatformOverview).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getPlayersAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getClubsAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getScoutingReportsAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getClubRequestsAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getEventsAnalytics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getActivityTrends).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getRbacMetrics).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.get403Rate).toHaveBeenCalledTimes(1);
      expect(mockAnalyticsService.getConversionRate).toHaveBeenCalledTimes(1);
    });
  });
});
