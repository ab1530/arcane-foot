import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { MarketValueService } from './market-value.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MarketValueService', () => {
  let service: MarketValueService;
  let prismaService: PrismaService;
  let httpService: HttpService;
  let cacheManager: any;

  const mockPrismaService = {
    players: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    player_valuations: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketValueService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<MarketValueService>(MarketValueService);
    prismaService = module.get<PrismaService>(PrismaService);
    httpService = module.get<HttpService>(HttpService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPlayerValuation', () => {
    const mockPlayer = {
      id: 'player-1',
      userId: 'user-1',
      position: 'FWD',
      dateOfBirth: new Date('2000-01-01'),
      nationality: 'Spain',
      height: 183,
      weight: 78,
      contractUntil: new Date('2026-06-30'),
      clubs: {
        name: 'Test FC',
        country: 'Spain',
      },
      scouting_reports: [
        {
          overallRating: 8,
          technicalRating: 8,
          physicalRating: 7,
          mentalRating: 8,
          tacticalRating: 7,
          createdAt: new Date(),
        },
        {
          overallRating: 7,
          technicalRating: 7,
          physicalRating: 7,
          mentalRating: 7,
          tacticalRating: 6,
          createdAt: new Date(),
        },
      ],
      users: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    const mockAIResponse = {
      data: {
        estimated_value: 25.5,
        confidence_interval: {
          low: 20.0,
          high: 31.0,
        },
        confidence_score: 0.82,
        factors: {
          age_normalized: 2.5,
          rating_normalized: 5.2,
          goals_per_90: 3.8,
        },
        comparable_players: [],
        model_version: 'v1',
      },
    };

    it('should return cached valuation if available', async () => {
      const cachedValuation = {
        estimatedValue: 25.5,
        confidenceScore: 0.82,
        playerId: 'player-1',
      };

      mockCacheManager.get.mockResolvedValue(cachedValuation);

      const result = await service.getPlayerValuation('player-1');

      expect(result).toEqual(cachedValuation);
      expect(mockCacheManager.get).toHaveBeenCalledWith('valuation:player-1');
      expect(mockPrismaService.players.findUnique).not.toHaveBeenCalled();
    });

    it('should calculate and cache valuation for uncached player', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.players.findUnique.mockResolvedValue(mockPlayer);
      mockHttpService.post.mockReturnValue(of(mockAIResponse));
      mockPrismaService.player_valuations.create.mockResolvedValue({});

      const result = await service.getPlayerValuation('player-1');

      expect(result.estimatedValue).toBe(25.5);
      expect(result.confidenceScore).toBe(0.82);
      expect(result.playerId).toBe('player-1');
      expect(mockCacheManager.set).toHaveBeenCalled();
      expect(mockPrismaService.player_valuations.create).toHaveBeenCalled();
    });

    it('should throw 404 if player not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.players.findUnique.mockResolvedValue(null);

      await expect(service.getPlayerValuation('invalid-id')).rejects.toThrow(
        new HttpException('Player not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should return last known valuation if AI service is down', async () => {
      const lastValuation = {
        playerId: 'player-1',
        estimatedValue: 20.0,
        confidenceLow: 15.0,
        confidenceHigh: 25.0,
        confidenceScore: 0.75,
        factors: {},
        modelVersion: 'v1',
        createdAt: new Date(),
      };

      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.players.findUnique.mockResolvedValue(mockPlayer);
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('Service unavailable')),
      );
      mockPrismaService.player_valuations.findFirst.mockResolvedValue(
        lastValuation,
      );

      const result = await service.getPlayerValuation('player-1');

      expect(result.estimatedValue).toBe(20.0);
      expect(result.confidenceScore).toBe(0.75);
    });
  });

  describe('getValuationTrend', () => {
    it('should return valuation trend with history', async () => {
      const mockValuations = [
        {
          playerId: 'player-1',
          estimatedValue: 25.0,
          confidenceScore: 0.82,
          modelVersion: 'v1',
          createdAt: new Date('2024-11-06'),
        },
        {
          playerId: 'player-1',
          estimatedValue: 20.0,
          confidenceScore: 0.80,
          modelVersion: 'v1',
          createdAt: new Date('2024-10-06'),
        },
      ];

      mockPrismaService.player_valuations.findMany.mockResolvedValue(
        mockValuations,
      );

      const result = await service.getValuationTrend('player-1');

      expect(result.playerId).toBe('player-1');
      expect(result.currentValue).toBe(25.0);
      expect(result.previousValue).toBe(20.0);
      expect(result.changePercent).toBe(25.0);
      expect(result.trend).toBe('up');
    });

    it('should fetch current valuation if no history exists', async () => {
      mockPrismaService.player_valuations.findMany.mockResolvedValue([]);
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.players.findUnique.mockResolvedValue({
        id: 'player-1',
        dateOfBirth: new Date('2000-01-01'),
        position: 'FWD',
        nationality: 'Spain',
        height: 183,
        weight: 78,
        scouting_reports: [],
        clubs: null,
        users: { firstName: 'John', lastName: 'Doe' },
      });
      mockHttpService.post.mockReturnValue(
        of({
          data: {
            estimated_value: 15.0,
            confidence_interval: { low: 12.0, high: 18.0 },
            confidence_score: 0.75,
            factors: {},
            comparable_players: [],
            model_version: 'v1',
          },
        }),
      );
      mockPrismaService.player_valuations.create.mockResolvedValue({});

      const result = await service.getValuationTrend('player-1');

      expect(result.currentValue).toBe(15.0);
      expect(result.trend).toBe('stable');
    });
  });

  describe('compareValuations', () => {
    it('should throw error if more than 10 players', async () => {
      const playerIds = Array(11).fill('player-id');

      await expect(service.compareValuations(playerIds)).rejects.toThrow(
        new HttpException(
          'Maximum 10 players can be compared',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should compare multiple players successfully', async () => {
      const playerIds = ['player-1', 'player-2'];

      // Mock valuation responses
      mockCacheManager.get.mockResolvedValue(null);
      mockPrismaService.players.findUnique
        .mockResolvedValueOnce({
          id: 'player-1',
          position: 'FWD',
          dateOfBirth: new Date('2000-01-01'),
          nationality: 'Spain',
          height: 183,
          weight: 78,
          scouting_reports: [{ overallRating: 8 }],
          clubs: { name: 'FC 1', country: 'Spain' },
          users: { firstName: 'Player', lastName: 'One' },
        })
        .mockResolvedValueOnce({
          id: 'player-1',
          position: 'FWD',
          dateOfBirth: new Date('2000-01-01'),
          users: { firstName: 'Player', lastName: 'One' },
          scouting_reports: [{ overallRating: 8 }],
        })
        .mockResolvedValueOnce({
          id: 'player-2',
          position: 'MID',
          dateOfBirth: new Date('1998-06-15'),
          nationality: 'France',
          height: 178,
          weight: 72,
          scouting_reports: [{ overallRating: 7 }],
          clubs: { name: 'FC 2', country: 'France' },
          users: { firstName: 'Player', lastName: 'Two' },
        })
        .mockResolvedValueOnce({
          id: 'player-2',
          position: 'MID',
          dateOfBirth: new Date('1998-06-15'),
          users: { firstName: 'Player', lastName: 'Two' },
          scouting_reports: [{ overallRating: 7 }],
        });

      mockHttpService.post
        .mockReturnValueOnce(
          of({
            data: {
              estimated_value: 30.0,
              confidence_interval: { low: 25.0, high: 35.0 },
              confidence_score: 0.85,
              factors: {},
              comparable_players: [],
              model_version: 'v1',
            },
          }),
        )
        .mockReturnValueOnce(
          of({
            data: {
              estimated_value: 20.0,
              confidence_interval: { low: 16.0, high: 24.0 },
              confidence_score: 0.78,
              factors: {},
              comparable_players: [],
              model_version: 'v1',
            },
          }),
        );

      mockPrismaService.player_valuations.create.mockResolvedValue({});

      const result = await service.compareValuations(playerIds);

      expect(result.players).toHaveLength(2);
      expect(result.highestValue).toBe(30.0);
      expect(result.averageValue).toBe(25.0);
      expect(result.highestValuePlayerId).toBe('player-1');
    });
  });

  describe('helper methods', () => {
    it('should estimate goals correctly based on position', () => {
      const reports = [
        { technicalRating: 8, tacticalRating: 7 },
        { technicalRating: 7, tacticalRating: 8 },
      ];

      const goalsForward = service['estimateGoalsFromReports']('FWD', reports);
      const goalsDefender = service['estimateGoalsFromReports']('DEF', reports);

      expect(goalsForward).toBeGreaterThan(goalsDefender);
    });

    it('should map countries to leagues correctly', () => {
      expect(service['getLeagueFromCountry']('England')).toBe(
        'Premier League',
      );
      expect(service['getLeagueFromCountry']('Spain')).toBe('LaLiga');
      expect(service['getLeagueFromCountry']('Germany')).toBe('Bundesliga');
      expect(service['getLeagueFromCountry']('Unknown')).toBe('Other');
    });

    it('should calculate contract years remaining', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 3);

      const years = service['calculateContractYears'](futureDate);

      expect(years).toBeGreaterThan(2.5);
      expect(years).toBeLessThan(3.5);
    });

    it('should return default for null contract', () => {
      const years = service['calculateContractYears'](null);
      expect(years).toBe(2.0);
    });
  });

  describe('checkAIServiceHealth', () => {
    it('should return healthy status if service is up', async () => {
      mockHttpService.get.mockReturnValue(
        of({
          data: {
            status: 'healthy',
            model_loaded: true,
            model_version: 'v1',
          },
        }),
      );

      const result = await service.checkAIServiceHealth();

      expect(result.status).toBe('healthy');
      expect(result.model_loaded).toBe(true);
    });

    it('should return unhealthy status if service is down', async () => {
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('Connection refused')),
      );

      const result = await service.checkAIServiceHealth();

      expect(result.status).toBe('unhealthy');
      expect(result.error).toBeDefined();
    });
  });
});
