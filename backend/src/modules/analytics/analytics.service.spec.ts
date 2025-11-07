import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prismaService: PrismaService;

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
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prismaService = module.get<PrismaService>(PrismaService);

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
      const result = await service.getPlatformOverview();

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
      const result = await service.getPlayersAnalytics();

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
      const result = await service.getPlayersAnalytics();

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
      const result = await service.getClubsAnalytics();

      expect(result.total).toBe(50);
      expect(result.byCountry).toEqual([
        { country: 'France', count: 30 },
        { country: 'Spain', count: 20 },
      ]);
      expect(result.withMostPlayers).toEqual(mockClubsWithMostPlayers);
    });

    it('should return most active clubs', async () => {
      const result = await service.getClubsAnalytics();

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
      const result = await service.getScoutingReportsAnalytics();

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

      const result = await service.getClubRequestsAnalytics();

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

      const result = await service.getClubRequestsAnalytics();

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

      const result = await service.getClubRequestsAnalytics();

      expect(result.successRate).toBe(0);
    });

    it('should calculate average response time in days', async () => {
      mockPrismaService.club_requests.groupBy.mockResolvedValue(mockRequestsByStatus);
      mockPrismaService.club_requests.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(40) // accepted
        .mockResolvedValueOnce(30); // completed
      mockPrismaService.club_requests.findMany.mockResolvedValue(mockRequestsWithResponse);

      const result = await service.getClubRequestsAnalytics();

      // (2 days + 1 day) / 2 = 1.5 days
      expect(result.averageResponseTimeInDays).toBeCloseTo(1.5, 1);
    });
  });

  describe('getEventsAnalytics', () => {
    const mockEventsByType = [
      { type: 'MATCH', _count: 50 },
      { type: 'TRAINING', _count: 30 },
    ];

    const mockPopularEvents = [
      { id: 'event-1', title: 'Match PSG vs OM', type: 'MATCH' },
    ];

    beforeEach(() => {
      mockPrismaService.events.count
        .mockResolvedValueOnce(80) // total
        .mockResolvedValueOnce(45); // upcoming
      mockPrismaService.events.groupBy.mockResolvedValue(mockEventsByType);
      mockPrismaService.events.findMany.mockResolvedValue(mockPopularEvents);
    });

    it('should return events analytics', async () => {
      const result = await service.getEventsAnalytics();

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
      const result = await service.getActivityTrends();

      expect(result.period).toBe('30 derniers jours');
      expect(result.data).toHaveLength(30);
      expect(result.data[0]).toHaveProperty('date');
      expect(result.data[0]).toHaveProperty('newUsers');
      expect(result.data[0]).toHaveProperty('newPlayers');
      expect(result.data[0]).toHaveProperty('newReports');
      expect(result.data[0]).toHaveProperty('newRequests');
    });

    it('should return activity trends for custom days', async () => {
      const result = await service.getActivityTrends(7);

      expect(result.period).toBe('7 derniers jours');
      expect(result.data).toHaveLength(7);
    });

    it('should query data with date range filters', async () => {
      await service.getActivityTrends(7);

      // Should call $queryRaw 4 times (users, players, reports, requests)
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(4);
    });

    it('should format dates as ISO strings', async () => {
      const result = await service.getActivityTrends(3);

      result.data.forEach((day) => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });
});
