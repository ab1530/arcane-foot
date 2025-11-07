import { Test, TestingModule } from '@nestjs/testing';
import { AutoScoutService } from './auto-scout.service';
import { PrismaService } from '../prisma/prisma.service';
import { StatsAggregatorService } from './stats-aggregator.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException } from '@nestjs/common';

describe('AutoScoutService', () => {
  let service: AutoScoutService;
  let prismaService: PrismaService;
  let statsAggregator: StatsAggregatorService;
  let cacheManager: any;

  const mockPrismaService = {
    players: {
      findUnique: jest.fn(),
    },
    scouting_reports: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    auto_generated_reports: {
      create: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
    },
  };

  const mockStatsAggregator = {
    getPlayerStats: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockPlayerStats = {
    basic: {
      name: 'John Doe',
      age: 22,
      position: 'Midfielder',
      nationality: 'France',
      club: 'Test FC',
    },
    career: {
      totalMatches: 50,
      totalGoals: 10,
      totalAssists: 15,
    },
    recent: {
      last5Matches: [
        {
          matchId: 'match-1',
          date: new Date(),
          opponent: 'Opponent FC',
          result: '2-1',
          minutesPlayed: 90,
          goals: 1,
          assists: 0,
          rating: 7.5,
        },
      ],
      recentForm: 'Good form with 1 goals and 0 assists in last 1 matches',
    },
    ratings: {
      avgTechnical: 7.5,
      avgTactical: 7.0,
      avgPhysical: 8.0,
      avgMental: 7.2,
    },
    physical: {
      height: 180,
      weight: 75,
      preferredFoot: 'Right',
    },
    trends: {
      improving: true,
      declining: false,
      consistent: true,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoScoutService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StatsAggregatorService,
          useValue: mockStatsAggregator,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<AutoScoutService>(AutoScoutService);
    prismaService = module.get<PrismaService>(PrismaService);
    statsAggregator = module.get<StatsAggregatorService>(StatsAggregatorService);
    cacheManager = module.get(CACHE_MANAGER);

    // Set environment variable for tests
    process.env.OPENAI_API_KEY = 'test-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateReport', () => {
    it('should generate a report successfully', async () => {
      mockStatsAggregator.getPlayerStats.mockResolvedValue(mockPlayerStats);
      mockCacheManager.get.mockResolvedValue(null);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockPrismaService.auto_generated_reports.create.mockResolvedValue({});

      // Note: This will fail without actual OpenAI API key, but tests template fallback
      const result = await service.generateReport('player-123', undefined, undefined, 'scout-123');

      expect(result).toBeDefined();
      expect(result.playerName).toBe('John Doe');
      expect(result.position).toBe('Midfielder');
      expect(result.qualityScore).toBeDefined();
      expect(statsAggregator.getPlayerStats).toHaveBeenCalledWith('player-123', {
        includeMatches: true,
        matchCount: 5,
        includeHistoricalReports: true,
      });
    });

    it('should return cached report if available', async () => {
      const cachedReport = {
        playerId: 'player-123',
        playerName: 'John Doe',
        position: 'Midfielder',
        summary: 'Cached summary',
        technicalSkills: { rating: 7, strengths: [], weaknesses: [], details: '' },
        tacticalAwareness: { rating: 7, strengths: [], weaknesses: [], details: '' },
        physicalAttributes: { rating: 8, strengths: [], weaknesses: [], details: '' },
        mentalAttributes: { rating: 7, strengths: [], weaknesses: [], details: '' },
        overallRating: 7.25,
        potential: 'Good potential',
        recommendations: [],
        comparablePlayers: [],
        qualityScore: { total: 75, breakdown: {}, grade: 'B' as const },
        generatedAt: new Date(),
        model: 'gpt-4-turbo-preview',
      };

      mockCacheManager.get.mockResolvedValue(cachedReport);

      const result = await service.generateReport('player-123');

      expect(result).toEqual(cachedReport);
      expect(statsAggregator.getPlayerStats).not.toHaveBeenCalled();
    });

    it('should throw error if player not found', async () => {
      mockStatsAggregator.getPlayerStats.mockResolvedValue(null);
      mockCacheManager.get.mockResolvedValue(null);

      await expect(service.generateReport('invalid-player')).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateQualityScore', () => {
    it('should calculate quality score correctly', () => {
      const mockReport = {
        playerId: 'player-123',
        playerName: 'John Doe',
        position: 'Midfielder',
        summary: 'A talented midfielder with excellent technical ability and strong tactical awareness.',
        technicalSkills: {
          rating: 8,
          strengths: ['Excellent passing', 'Good dribbling'],
          weaknesses: ['Shooting accuracy'],
          details: 'Strong technical foundation',
        },
        tacticalAwareness: {
          rating: 7,
          strengths: ['Positioning', 'Decision making'],
          weaknesses: ['Defensive work'],
          details: 'Good tactical understanding',
        },
        physicalAttributes: {
          rating: 8,
          strengths: ['Stamina', 'Pace'],
          weaknesses: ['Strength'],
          details: 'Physically gifted',
        },
        mentalAttributes: {
          rating: 7,
          strengths: ['Composure', 'Work rate'],
          weaknesses: ['Leadership'],
          details: 'Mentally strong',
        },
        overallRating: 7.5,
        potential: 'High potential prospect',
        recommendations: ['Continue development', 'Monitor progress'],
        comparablePlayers: ['Player A', 'Player B'],
        qualityScore: {
          total: 0,
          breakdown: {
            dataCompleteness: 0,
            insightDepth: 0,
            technicalAccuracy: 0,
            actionability: 0
          },
          grade: 'C' as const
        },
        generatedAt: new Date(),
        model: 'gpt-4-turbo-preview',
      };

      const score = service['calculateQualityScore'](mockReport, mockPlayerStats);

      expect(score.total).toBeGreaterThan(60);
      expect(score.grade).toMatch(/[SABCD]/);
      expect(score.breakdown.dataCompleteness).toBeGreaterThan(0);
      expect(score.breakdown.insightDepth).toBeGreaterThan(0);
      expect(score.breakdown.technicalAccuracy).toBeGreaterThan(0);
      expect(score.breakdown.actionability).toBeGreaterThan(0);
    });
  });

  describe('getReportTemplates', () => {
    it('should return all available templates', () => {
      const templates = service.getReportTemplates();

      expect(templates).toBeDefined();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('description');
      expect(templates[0]).toHaveProperty('promptTemplate');
    });
  });

  describe('getAnalytics', () => {
    it('should return analytics data', async () => {
      mockPrismaService.auto_generated_reports.count.mockResolvedValue(100);
      mockPrismaService.auto_generated_reports.aggregate.mockResolvedValue({
        _avg: { qualityScore: 75.5 },
        _sum: { tokensUsed: 350000 },
      });
      mockPrismaService.auto_generated_reports.groupBy.mockResolvedValue([
        { template: 'Season Overview Report', _count: { template: 50 } },
        { template: 'Match Performance Report', _count: { template: 30 } },
        { template: 'Transfer Target Report', _count: { template: 20 } },
      ]);

      const analytics = await service.getAnalytics();

      expect(analytics).toBeDefined();
      expect(analytics.totalReports).toBe(100);
      expect(analytics.averageQualityScore).toBe(75.5);
      expect(analytics.totalTokensUsed).toBe(350000);
      expect(analytics.estimatedCost).toBeGreaterThan(0);
      expect(analytics.templateUsage).toHaveLength(3);
    });
  });

  describe('Quality Scoring Sub-methods', () => {
    it('should score data completeness correctly', () => {
      const score = service['scoreDataCompleteness'](mockPlayerStats);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(25);
    });

    it('should score insight depth correctly', () => {
      const mockReport = {
        summary: 'A comprehensive analysis of the player showing excellent technical skills and tactical awareness.',
        technicalSkills: {
          rating: 8,
          strengths: ['Passing', 'Dribbling', 'Control'],
          weaknesses: ['Shooting', 'Weak foot'],
          details: 'Excellent technical foundation',
        },
        tacticalAwareness: {
          rating: 7,
          strengths: ['Positioning', 'Awareness'],
          weaknesses: ['Defensive work'],
          details: 'Good tactical understanding',
        },
        physicalAttributes: {
          rating: 8,
          strengths: ['Stamina', 'Pace'],
          weaknesses: ['Strength'],
          details: 'Strong physical attributes',
        },
        mentalAttributes: {
          rating: 7,
          strengths: ['Composure', 'Concentration'],
          weaknesses: ['Leadership'],
          details: 'Mentally resilient',
        },
        recommendations: ['Focus on shooting', 'Improve weak foot'],
      } as any;

      const score = service['scoreInsightDepth'](mockReport);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(25);
    });

    it('should score technical accuracy correctly', () => {
      const mockReport = {
        overallRating: 7.5,
        technicalSkills: { rating: 8 },
        tacticalAwareness: { rating: 7 },
        physicalAttributes: { rating: 8 },
        mentalAttributes: { rating: 7 },
      } as any;

      const score = service['scoreTechnicalAccuracy'](mockReport, mockPlayerStats);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(25);
    });

    it('should score actionability correctly', () => {
      const mockReport = {
        recommendations: ['Focus on technical training', 'Improve tactical awareness'],
        comparablePlayers: ['Player A', 'Player B', 'Player C'],
        potential: 'High potential with proper development',
        technicalSkills: { weaknesses: ['Shooting'] },
        tacticalAwareness: { weaknesses: ['Defensive positioning'] },
        physicalAttributes: { weaknesses: ['Strength'] },
        mentalAttributes: { weaknesses: ['Leadership'] },
      } as any;

      const score = service['scoreActionability'](mockReport);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(25);
    });
  });

  describe('getGrade', () => {
    it('should return S grade for scores >= 90', () => {
      expect(service['getGrade'](95)).toBe('S');
    });

    it('should return A grade for scores >= 80', () => {
      expect(service['getGrade'](85)).toBe('A');
    });

    it('should return B grade for scores >= 70', () => {
      expect(service['getGrade'](75)).toBe('B');
    });

    it('should return C grade for scores >= 60', () => {
      expect(service['getGrade'](65)).toBe('C');
    });

    it('should return D grade for scores < 60', () => {
      expect(service['getGrade'](50)).toBe('D');
    });
  });

  describe('calculateCost', () => {
    it('should calculate cost correctly', () => {
      const tokens = 3000;
      const cost = service['calculateCost'](tokens);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1); // Should be cents, not dollars
    });
  });
});
