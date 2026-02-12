import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PerformancePredictorService } from './performance-predictor.service';
import { PrismaService } from '../prisma/prisma.service';
import { of, throwError } from 'rxjs';

describe('PerformancePredictorService', () => {
  let service: PerformancePredictorService;
  let prismaService: PrismaService;
  let httpService: HttpService;

  const mockPrismaService = {
    players: {
      findUnique: jest.fn(),
    },
    matches: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    scouting_reports: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    performance_predictions: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    prediction_accuracy_log: {
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const mockHttpService = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrismaService.matches.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PerformancePredictorService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<PerformancePredictorService>(PerformancePredictorService);
    prismaService = module.get<PrismaService>(PrismaService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('predictPerformance', () => {
    const mockPlayer = {
      id: 'player-1',
      position: 'CM',
      dateOfBirth: new Date('1999-01-01'),
      height: 178,
      weight: 72,
      marketValue: 5000000,
      clubId: 'club-1',
      scouting_reports: [
        { overallRating: 7.0, submittedAt: new Date() },
        { overallRating: 7.2, submittedAt: new Date() },
      ],
    };

    const mockMatch = {
      id: 'match-1',
      homeClubId: 'club-1',
      awayClubId: 'club-2',
      season: '2024',
      scheduledAt: new Date('2024-06-15'),
      clubs_matches_homeClubIdToclubs: { id: 'club-1', name: 'Home Club' },
      clubs_matches_awayClubIdToclubs: { id: 'club-2', name: 'Away Club' },
      competitions: { name: 'Premier League' },
    };

    const mockPrediction = {
      playerId: 'player-1',
      predictedRating: 7.3,
      confidenceInterval: [6.5, 8.1],
      confidence: 0.85,
      ratingDistribution: {
        poor_0_5: 0.05,
        average_5_7: 0.25,
        good_7_8: 0.5,
        excellent_8_plus: 0.2,
      },
      keyFactors: [
        {
          factor: 'form_l5',
          value: 7.1,
          importance: 0.15,
          impact: 'positive',
          description: 'Recent form: 7.1/10',
        },
      ],
      recommendations: ['High performance expected'],
    };

    it('should predict player performance successfully', async () => {
      mockPrismaService.players.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        {
          overallRating: 7.0,
          technicalRating: 7.0,
          tacticalRating: 6.8,
          physicalRating: 7.2,
          mentalRating: 6.9,
          playerMinutesPlayed: 85,
        },
        {
          overallRating: 7.2,
          technicalRating: 7.1,
          tacticalRating: 6.9,
          physicalRating: 7.1,
          mentalRating: 7.0,
          playerMinutesPlayed: 90,
        },
      ]);
      mockPrismaService.scouting_reports.findFirst.mockResolvedValue({
        matches: { scheduledAt: new Date() },
      });
      mockHttpService.post.mockReturnValue(of({ data: mockPrediction }));
      mockPrismaService.performance_predictions.upsert.mockResolvedValue({});

      const result = await service.predictPerformance('player-1', 'match-1');

      expect(result).toEqual(mockPrediction);
      expect(mockPrismaService.players.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'player-1' } }),
      );
      expect(mockHttpService.post).toHaveBeenCalled();
      expect(mockPrismaService.performance_predictions.upsert).toHaveBeenCalled();
    });

    it('should throw error if player not found', async () => {
      mockPrismaService.players.findUnique.mockResolvedValue(null);

      await expect(service.predictPerformance('invalid-id', 'match-1')).rejects.toThrow(
        'Player not found',
      );
    });

    it('should throw error if match not found', async () => {
      mockPrismaService.players.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.matches.findUnique.mockResolvedValue(null);

      await expect(service.predictPerformance('player-1', 'invalid-match')).rejects.toThrow(
        'Match not found',
      );
    });

    it('should handle AI service failure', async () => {
      mockPrismaService.players.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        {
          overallRating: 7.0,
          technicalRating: 7.0,
          tacticalRating: 6.8,
          physicalRating: 7.2,
          mentalRating: 6.9,
          playerMinutesPlayed: 85,
        },
      ]);
      mockPrismaService.scouting_reports.findFirst.mockResolvedValue({
        matches: { scheduledAt: new Date() },
      });
      mockHttpService.post.mockReturnValue(
        throwError(() => new Error('AI service connection failed')),
      );

      await expect(service.predictPerformance('player-1', 'match-1')).rejects.toThrow(
        HttpException,
      );
      await expect(service.predictPerformance('player-1', 'match-1')).rejects.toThrow(
        'Prediction service unavailable',
      );
    });

    it('should handle player with no height/weight gracefully', async () => {
      const playerNoStats = {
        ...mockPlayer,
        height: null,
        weight: null,
        marketValue: null,
      };

      mockPrismaService.players.findUnique.mockResolvedValue(playerNoStats);
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        {
          overallRating: 7.0,
          technicalRating: 7.0,
          tacticalRating: 6.8,
          physicalRating: 7.2,
          mentalRating: 6.9,
          playerMinutesPlayed: 85,
        },
      ]);
      mockPrismaService.scouting_reports.findFirst.mockResolvedValue({
        matches: { scheduledAt: new Date() },
      });
      mockHttpService.post.mockReturnValue(of({ data: mockPrediction }));
      mockPrismaService.performance_predictions.upsert.mockResolvedValue({});

      const result = await service.predictPerformance('player-1', 'match-1');

      expect(result).toEqual(mockPrediction);
      // Should use defaults: height: 180, weight: 75, marketValue: 0
    });

    it('should calculate venue correctly for away matches', async () => {
      const awayMatch = {
        ...mockMatch,
        homeClubId: 'club-2',
        awayClubId: 'club-1',
      };

      mockPrismaService.players.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.matches.findUnique.mockResolvedValue(awayMatch);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        {
          overallRating: 7.0,
          technicalRating: 7.0,
          tacticalRating: 6.8,
          physicalRating: 7.2,
          mentalRating: 6.9,
          playerMinutesPlayed: 85,
        },
      ]);
      mockPrismaService.scouting_reports.findFirst.mockResolvedValue({
        matches: { scheduledAt: new Date() },
      });
      mockHttpService.post.mockReturnValue(of({ data: mockPrediction }));
      mockPrismaService.performance_predictions.upsert.mockResolvedValue({});

      await service.predictPerformance('player-1', 'match-1');

      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          matchContext: expect.objectContaining({
            venue: 'away',
          }),
        }),
      );
    });
  });

  describe('batchPredictForMatch', () => {
    const mockMatch = {
      id: 'match-1',
      homeClubId: 'club-1',
      awayClubId: 'club-2',
      season: '2024',
      scheduledAt: new Date(),
      clubs_matches_homeClubIdToclubs: {
        id: 'club-1',
        players: [
          { id: 'player-1', position: 'GK', dateOfBirth: new Date('1995-01-01'), clubId: 'club-1' },
          { id: 'player-2', position: 'DF', dateOfBirth: new Date('1998-01-01'), clubId: 'club-1' },
        ],
      },
      clubs_matches_awayClubIdToclubs: {
        id: 'club-2',
        players: [
          { id: 'player-3', position: 'MF', dateOfBirth: new Date('1997-01-01'), clubId: 'club-2' },
        ],
      },
      competitions: { name: 'Premier League' },
    };

    it('should batch predict for all players in match', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);

      // Mock predictPerformance for each player
      jest
        .spyOn(service, 'predictPerformance')
        .mockResolvedValueOnce({
          playerId: 'player-1',
          predictedRating: 7.0,
          confidenceInterval: [6.0, 8.0],
          confidence: 0.8,
          ratingDistribution: {
            poor_0_5: 0.1,
            average_5_7: 0.3,
            good_7_8: 0.4,
            excellent_8_plus: 0.2,
          },
          keyFactors: [],
          recommendations: [],
        })
        .mockResolvedValueOnce({
          playerId: 'player-2',
          predictedRating: 6.8,
          confidenceInterval: [5.8, 7.8],
          confidence: 0.75,
          ratingDistribution: {
            poor_0_5: 0.15,
            average_5_7: 0.35,
            good_7_8: 0.35,
            excellent_8_plus: 0.15,
          },
          keyFactors: [],
          recommendations: [],
        })
        .mockResolvedValueOnce({
          playerId: 'player-3',
          predictedRating: 7.2,
          confidenceInterval: [6.2, 8.2],
          confidence: 0.82,
          ratingDistribution: {
            poor_0_5: 0.08,
            average_5_7: 0.28,
            good_7_8: 0.42,
            excellent_8_plus: 0.22,
          },
          keyFactors: [],
          recommendations: [],
        });

      const result = await service.batchPredictForMatch('match-1');

      expect(result).toHaveLength(3);
      expect(result[0].playerId).toBe('player-1');
      expect(result[1].playerId).toBe('player-2');
      expect(result[2].playerId).toBe('player-3');
    });

    it('should throw error if match not found for batch prediction', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(null);

      await expect(service.batchPredictForMatch('invalid-match')).rejects.toThrow(
        'Match not found',
      );
    });

    it('should handle matches with no players', async () => {
      const emptyMatch = {
        ...mockMatch,
        clubs_matches_homeClubIdToclubs: { id: 'club-1', players: [] },
        clubs_matches_awayClubIdToclubs: { id: 'club-2', players: [] },
      };

      mockPrismaService.matches.findUnique.mockResolvedValue(emptyMatch);

      const result = await service.batchPredictForMatch('match-1');

      expect(result).toEqual([]);
    });
  });

  describe('getAccuracy', () => {
    it('should retrieve accuracy metrics', async () => {
      const mockAccuracyLogs = [
        {
          totalPredictions: 100,
          avgError: 0.82,
          rmse: 1.05,
          withinCI: 0.75,
          r2Score: 0.68,
          dateRange: '2024-01',
          modelVersion: 'v1',
          calculatedAt: new Date(),
        },
      ];

      mockPrismaService.prediction_accuracy_log.findMany.mockResolvedValue(mockAccuracyLogs);

      const result = await service.getAccuracy();

      expect(result).toHaveLength(1);
      expect(result[0].avgError).toBe(0.82);
      expect(result[0].r2Score).toBe(0.68);
    });

    it('should filter accuracy by playerId', async () => {
      const mockAccuracyLogs = [
        {
          totalPredictions: 50,
          avgError: 0.75,
          rmse: 0.95,
          withinCI: 0.8,
          r2Score: 0.72,
          dateRange: '2024-01',
          modelVersion: 'v1',
          calculatedAt: new Date(),
        },
      ];

      mockPrismaService.prediction_accuracy_log.findMany.mockResolvedValue(mockAccuracyLogs);

      const result = await service.getAccuracy('player-1');

      expect(mockPrismaService.prediction_accuracy_log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ playerId: 'player-1' }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should filter accuracy by dateRange', async () => {
      const mockAccuracyLogs = [
        {
          totalPredictions: 75,
          avgError: 0.78,
          rmse: 1.0,
          withinCI: 0.77,
          r2Score: 0.7,
          dateRange: '2024-02',
          modelVersion: 'v1',
          calculatedAt: new Date(),
        },
      ];

      mockPrismaService.prediction_accuracy_log.findMany.mockResolvedValue(mockAccuracyLogs);

      const result = await service.getAccuracy(undefined, '2024-02');

      expect(mockPrismaService.prediction_accuracy_log.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ dateRange: '2024-02' }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('should handle undefined r2Score', async () => {
      const mockAccuracyLogs = [
        {
          totalPredictions: 100,
          avgError: 0.82,
          rmse: 1.05,
          withinCI: 0.75,
          r2Score: null,
          dateRange: '2024-01',
          modelVersion: 'v1',
          calculatedAt: new Date(),
        },
      ];

      mockPrismaService.prediction_accuracy_log.findMany.mockResolvedValue(mockAccuracyLogs);

      const result = await service.getAccuracy();

      expect(result[0].r2Score).toBeUndefined();
    });
  });

  describe('getFeatureImportance', () => {
    it('should retrieve feature importance from AI service', async () => {
      const mockFeatures = {
        features: [
          { feature: 'form_l5', importance: 0.15 },
          { feature: 'opponent_strength', importance: 0.12 },
          { feature: 'venue', importance: 0.1 },
        ],
      };

      mockHttpService.get.mockReturnValue(of({ data: mockFeatures }));

      const result = await service.getFeatureImportance();

      expect(result).toEqual(mockFeatures.features);
      expect(result).toHaveLength(3);
      expect(result[0].feature).toBe('form_l5');
    });

    it('should handle AI service failure for feature importance', async () => {
      mockHttpService.get.mockReturnValue(throwError(() => new Error('AI service unavailable')));

      await expect(service.getFeatureImportance()).rejects.toThrow(HttpException);
      await expect(service.getFeatureImportance()).rejects.toThrow(
        'Feature importance unavailable',
      );
    });
  });

  describe('retrainModel', () => {
    it('should trigger model retraining successfully', async () => {
      const mockResponse = {
        message: 'Model retrained successfully',
        modelVersion: 'v2',
        accuracy: 0.85,
        trainingSamples: 5000,
      };

      mockHttpService.post.mockReturnValue(of({ data: mockResponse }));

      const result = await service.retrainModel();

      expect(result).toEqual(mockResponse);
      expect(mockHttpService.post).toHaveBeenCalledWith(
        expect.stringContaining('/performance/train'),
        {},
      );
    });

    it('should handle model retraining failure', async () => {
      mockHttpService.post.mockReturnValue(throwError(() => new Error('Training failed')));

      await expect(service.retrainModel()).rejects.toThrow(HttpException);
      await expect(service.retrainModel()).rejects.toThrow('Model retraining failed');
    });
  });

  describe('updateAccuracyMetrics (CRON)', () => {
    it('should update accuracy metrics for completed matches', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          playerId: 'player-1',
          matchId: 'match-1',
          predictedRating: 7.5,
          confidenceLow: 6.5,
          confidenceHigh: 8.5,
          predictionError: null,
          actualRating: null,
          matches: {
            status: 'COMPLETED',
            scouting_reports: [
              {
                playerId: 'player-1',
                overallRating: 7.8,
                status: 'APPROVED',
              },
            ],
          },
        },
      ];

      mockPrismaService.performance_predictions.findMany.mockResolvedValue(mockPredictions);
      mockPrismaService.performance_predictions.update.mockResolvedValue({});
      mockPrismaService.prediction_accuracy_log.upsert.mockResolvedValue({});

      await service.updateAccuracyMetrics();

      expect(mockPrismaService.performance_predictions.update).toHaveBeenCalledWith({
        where: { id: 'pred-1' },
        data: {
          actualRating: 7.8,
          predictionError: expect.closeTo(0.3, 2),
        },
      });
    });

    it('should handle errors during accuracy update gracefully', async () => {
      mockPrismaService.performance_predictions.findMany.mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw, just log error
      await expect(service.updateAccuracyMetrics()).resolves.not.toThrow();
    });

    it('should skip predictions without actual ratings', async () => {
      const mockPredictions = [
        {
          id: 'pred-1',
          playerId: 'player-1',
          matchId: 'match-1',
          predictedRating: 7.5,
          confidenceLow: 6.5,
          confidenceHigh: 8.5,
          predictionError: null,
          actualRating: null,
          matches: {
            status: 'COMPLETED',
            scouting_reports: [],
          },
        },
      ];

      mockPrismaService.performance_predictions.findMany.mockResolvedValue(mockPredictions);
      mockPrismaService.performance_predictions.update.mockResolvedValue({});
      mockPrismaService.prediction_accuracy_log.upsert.mockResolvedValue({});

      await service.updateAccuracyMetrics();

      expect(mockPrismaService.performance_predictions.update).not.toHaveBeenCalled();
    });

    it('should calculate monthly accuracy correctly', async () => {
      const now = new Date('2024-02-15');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockPredictionsForAccuracy = [
        {
          id: 'pred-1',
          predictedRating: 7.5,
          actualRating: 7.8,
          predictionError: 0.3,
          confidenceLow: 6.5,
          confidenceHigh: 8.5,
          predictedAt: new Date('2024-02-10'),
        },
        {
          id: 'pred-2',
          predictedRating: 6.5,
          actualRating: 6.2,
          predictionError: 0.3,
          confidenceLow: 5.5,
          confidenceHigh: 7.5,
          predictedAt: new Date('2024-02-12'),
        },
      ];

      mockPrismaService.performance_predictions.findMany
        .mockResolvedValueOnce([]) // First call for completed matches
        .mockResolvedValueOnce(mockPredictionsForAccuracy); // Second call for monthly calculation

      mockPrismaService.prediction_accuracy_log.upsert.mockResolvedValue({});

      await service.updateAccuracyMetrics();

      expect(mockPrismaService.prediction_accuracy_log.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            totalPredictions: 2,
            avgError: 0.3,
            rmse: 0.3,
            withinCI: 1.0,
          }),
        }),
      );

      jest.useRealTimers();
    });

    it('should not calculate monthly accuracy if no predictions exist', async () => {
      mockPrismaService.performance_predictions.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await service.updateAccuracyMetrics();

      expect(mockPrismaService.prediction_accuracy_log.upsert).not.toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    describe('getSeasonStats', () => {
      it('should return default stats when no season reports exist', async () => {
        mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);

        // Access private method via reflection for testing
        const result = await (service as any).getSeasonStats('player-1', '2024');

        expect(result.avg_minutes).toBe(90);
        expect(result.technical_rating).toBe(6.5);
        expect(result.tactical_rating).toBe(6.5);
      });
    });

    describe('calculateAge', () => {
      it('should calculate age correctly', () => {
        const birthDate = new Date('1995-06-15');
        const age = (service as any).calculateAge(birthDate);

        expect(age).toBeGreaterThanOrEqual(28);
        expect(age).toBeLessThanOrEqual(30);
      });

      it('should handle birthdays not yet occurred this year', () => {
        const futureMonth = new Date();
        futureMonth.setMonth(futureMonth.getMonth() + 2);
        const birthDate = new Date(futureMonth);
        birthDate.setFullYear(birthDate.getFullYear() - 25);

        const age = (service as any).calculateAge(birthDate);

        expect(age).toBe(24);
      });
    });

    describe('getMatchImportance', () => {
      it('should return correct importance for Champions League', () => {
        const match = { competitions: { name: 'UEFA Champions League' } };
        const importance = (service as any).getMatchImportance(match);
        expect(importance).toBe(5);
      });

      it('should return correct importance for Premier League', () => {
        const match = { competitions: { name: 'Premier League' } };
        const importance = (service as any).getMatchImportance(match);
        expect(importance).toBe(4);
      });

      it('should return default importance for unknown competition', () => {
        const match = { competitions: { name: 'Unknown League' } };
        const importance = (service as any).getMatchImportance(match);
        expect(importance).toBe(3);
      });

      it('should handle match without competition', () => {
        const match = { competitions: null };
        const importance = (service as any).getMatchImportance(match);
        expect(importance).toBe(3);
      });
    });

    describe('getDaysSinceLastMatch', () => {
      it('should calculate days since last match correctly', async () => {
        const lastMatchDate = new Date();
        lastMatchDate.setDate(lastMatchDate.getDate() - 5);

        mockPrismaService.scouting_reports.findFirst.mockResolvedValue({
          matches: { scheduledAt: lastMatchDate },
        });

        const days = await (service as any).getDaysSinceLastMatch('player-1');

        expect(days).toBe(5);
      });

      it('should return default 7 days when no previous match found', async () => {
        mockPrismaService.scouting_reports.findFirst.mockResolvedValue(null);

        const days = await (service as any).getDaysSinceLastMatch('player-1');

        expect(days).toBe(7);
      });

      it('should cap days at 30 maximum', async () => {
        const lastMatchDate = new Date();
        lastMatchDate.setDate(lastMatchDate.getDate() - 45);

        mockPrismaService.scouting_reports.findFirst.mockResolvedValue({
          matches: { scheduledAt: lastMatchDate },
        });

        const days = await (service as any).getDaysSinceLastMatch('player-1');

        expect(days).toBe(30);
      });
    });

    describe('avg', () => {
      it('should calculate average correctly', () => {
        const values = [7.0, 7.5, 8.0, 6.5];
        const result = (service as any).avg(values);
        expect(result).toBe(7.25);
      });

      it('should return 0 for empty array', () => {
        const result = (service as any).avg([]);
        expect(result).toBe(0);
      });
    });
  });
});
