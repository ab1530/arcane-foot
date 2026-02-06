import { Test, TestingModule } from '@nestjs/testing';
import { PerformancePredictorController } from './performance-predictor.controller';
import { PerformancePredictorService } from './performance-predictor.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  PerformancePredictionDto,
  AccuracyMetricsDto,
  FeatureImportanceDto,
} from './dto/performance-prediction.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('PerformancePredictorController', () => {
  let controller: PerformancePredictorController;
  let service: PerformancePredictorService;

  const mockPerformancePredictorService = {
    predictPerformance: jest.fn(),
    batchPredictForMatch: jest.fn(),
    getAccuracy: jest.fn(),
    getFeatureImportance: jest.fn(),
    retrainModel: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PerformancePredictorController],
      providers: [
        {
          provide: PerformancePredictorService,
          useValue: mockPerformancePredictorService,
        },
        {
          provide: SubscriptionsService,
          useValue: {
            getMySubscription: jest.fn(),
            hasMinimumTier: jest.fn().mockResolvedValue(true),
            createOrUpdateSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            reactivateSubscription: jest.fn(),
            changeTier: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PerformancePredictorController>(PerformancePredictorController);
    service = module.get<PerformancePredictorService>(PerformancePredictorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('predictPerformance', () => {
    const mockPrediction: PerformancePredictionDto = {
      playerId: 'player-123',
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
        {
          factor: 'venue',
          value: 1,
          importance: 0.12,
          impact: 'positive',
          description: 'Playing at home',
        },
      ],
      recommendations: ['High performance expected', 'Consider giving player key role in match'],
    };

    it('should predict performance for a single player', async () => {
      mockPerformancePredictorService.predictPerformance.mockResolvedValue(mockPrediction);

      const result = await controller.predictPerformance('player-123', 'match-456');

      expect(result).toEqual(mockPrediction);
      expect(service.predictPerformance).toHaveBeenCalledWith('player-123', 'match-456');
      expect(service.predictPerformance).toHaveBeenCalledTimes(1);
    });

    it('should handle player not found error', async () => {
      mockPerformancePredictorService.predictPerformance.mockRejectedValue(
        new HttpException('Player not found', HttpStatus.NOT_FOUND),
      );

      await expect(controller.predictPerformance('invalid-player', 'match-456')).rejects.toThrow(
        HttpException,
      );

      await expect(controller.predictPerformance('invalid-player', 'match-456')).rejects.toThrow(
        'Player not found',
      );
    });

    it('should handle match not found error', async () => {
      mockPerformancePredictorService.predictPerformance.mockRejectedValue(
        new HttpException('Match not found', HttpStatus.NOT_FOUND),
      );

      await expect(controller.predictPerformance('player-123', 'invalid-match')).rejects.toThrow(
        HttpException,
      );

      await expect(controller.predictPerformance('player-123', 'invalid-match')).rejects.toThrow(
        'Match not found',
      );
    });

    it('should handle prediction service unavailable error', async () => {
      mockPerformancePredictorService.predictPerformance.mockRejectedValue(
        new HttpException('Prediction service unavailable', HttpStatus.SERVICE_UNAVAILABLE),
      );

      await expect(controller.predictPerformance('player-123', 'match-456')).rejects.toThrow(
        HttpException,
      );

      await expect(controller.predictPerformance('player-123', 'match-456')).rejects.toThrow(
        'Prediction service unavailable',
      );
    });
  });

  describe('batchPredictForMatch', () => {
    const mockBatchPredictions: PerformancePredictionDto[] = [
      {
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
        keyFactors: [
          {
            factor: 'form_l5',
            value: 7.0,
            importance: 0.15,
            impact: 'positive',
            description: 'Recent form: 7.0/10',
          },
        ],
        recommendations: ['Solid performance expected'],
      },
      {
        playerId: 'player-2',
        predictedRating: 6.5,
        confidenceInterval: [5.5, 7.5],
        confidence: 0.75,
        ratingDistribution: {
          poor_0_5: 0.15,
          average_5_7: 0.35,
          good_7_8: 0.35,
          excellent_8_plus: 0.15,
        },
        keyFactors: [
          {
            factor: 'days_rest',
            value: 3,
            importance: 0.1,
            impact: 'negative',
            description: 'Limited rest (3 days)',
          },
        ],
        recommendations: ['Average performance expected'],
      },
    ];

    it('should batch predict for all players in a match', async () => {
      mockPerformancePredictorService.batchPredictForMatch.mockResolvedValue(mockBatchPredictions);

      const result = await controller.batchPredictForMatch('match-456');

      expect(result).toEqual(mockBatchPredictions);
      expect(result).toHaveLength(2);
      expect(service.batchPredictForMatch).toHaveBeenCalledWith('match-456');
      expect(service.batchPredictForMatch).toHaveBeenCalledTimes(1);
    });

    it('should handle match not found error for batch prediction', async () => {
      mockPerformancePredictorService.batchPredictForMatch.mockRejectedValue(
        new HttpException('Match not found', HttpStatus.NOT_FOUND),
      );

      await expect(controller.batchPredictForMatch('invalid-match')).rejects.toThrow(HttpException);

      await expect(controller.batchPredictForMatch('invalid-match')).rejects.toThrow(
        'Match not found',
      );
    });

    it('should return empty array when match has no players', async () => {
      mockPerformancePredictorService.batchPredictForMatch.mockResolvedValue([]);

      const result = await controller.batchPredictForMatch('match-empty');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getAccuracy', () => {
    const mockAccuracyMetrics: AccuracyMetricsDto[] = [
      {
        totalPredictions: 100,
        avgError: 0.82,
        rmse: 1.05,
        withinCI: 0.75,
        r2Score: 0.68,
        dateRange: '2024-01',
        modelVersion: 'v1',
      },
      {
        totalPredictions: 95,
        avgError: 0.78,
        rmse: 1.0,
        withinCI: 0.77,
        r2Score: 0.7,
        dateRange: '2024-02',
        modelVersion: 'v1',
      },
    ];

    it('should retrieve accuracy metrics without filters', async () => {
      mockPerformancePredictorService.getAccuracy.mockResolvedValue(mockAccuracyMetrics);

      const result = await controller.getAccuracy();

      expect(result).toEqual(mockAccuracyMetrics);
      expect(result).toHaveLength(2);
      expect(service.getAccuracy).toHaveBeenCalledWith(undefined, undefined);
    });

    it('should retrieve accuracy metrics filtered by playerId', async () => {
      const playerAccuracy = [mockAccuracyMetrics[0]];
      mockPerformancePredictorService.getAccuracy.mockResolvedValue(playerAccuracy);

      const result = await controller.getAccuracy('player-123');

      expect(result).toEqual(playerAccuracy);
      expect(result).toHaveLength(1);
      expect(service.getAccuracy).toHaveBeenCalledWith('player-123', undefined);
    });

    it('should retrieve accuracy metrics filtered by dateRange', async () => {
      const dateRangeAccuracy = [mockAccuracyMetrics[1]];
      mockPerformancePredictorService.getAccuracy.mockResolvedValue(dateRangeAccuracy);

      const result = await controller.getAccuracy(undefined, '2024-02');

      expect(result).toEqual(dateRangeAccuracy);
      expect(result).toHaveLength(1);
      expect(service.getAccuracy).toHaveBeenCalledWith(undefined, '2024-02');
    });

    it('should retrieve accuracy metrics filtered by both playerId and dateRange', async () => {
      const filteredAccuracy = [mockAccuracyMetrics[0]];
      mockPerformancePredictorService.getAccuracy.mockResolvedValue(filteredAccuracy);

      const result = await controller.getAccuracy('player-123', '2024-01');

      expect(result).toEqual(filteredAccuracy);
      expect(service.getAccuracy).toHaveBeenCalledWith('player-123', '2024-01');
    });

    it('should return empty array when no accuracy metrics exist', async () => {
      mockPerformancePredictorService.getAccuracy.mockResolvedValue([]);

      const result = await controller.getAccuracy();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle accuracy metrics without r2Score', async () => {
      const accuracyWithoutR2 = [
        {
          ...mockAccuracyMetrics[0],
          r2Score: undefined,
        },
      ];
      mockPerformancePredictorService.getAccuracy.mockResolvedValue(accuracyWithoutR2);

      const result = await controller.getAccuracy();

      expect(result[0].r2Score).toBeUndefined();
    });
  });

  describe('getFeatureImportance', () => {
    const mockFeatureImportance: FeatureImportanceDto[] = [
      { feature: 'form_l5', importance: 0.15 },
      { feature: 'opponent_strength', importance: 0.12 },
      { feature: 'venue', importance: 0.1 },
      { feature: 'days_rest', importance: 0.09 },
      { feature: 'season_progress', importance: 0.08 },
    ];

    it('should retrieve feature importance rankings', async () => {
      mockPerformancePredictorService.getFeatureImportance.mockResolvedValue(mockFeatureImportance);

      const result = await controller.getFeatureImportance();

      expect(result).toEqual(mockFeatureImportance);
      expect(result).toHaveLength(5);
      expect(result[0].feature).toBe('form_l5');
      expect(result[0].importance).toBe(0.15);
      expect(service.getFeatureImportance).toHaveBeenCalledTimes(1);
    });

    it('should handle feature importance service unavailable', async () => {
      mockPerformancePredictorService.getFeatureImportance.mockRejectedValue(
        new HttpException('Feature importance unavailable', HttpStatus.SERVICE_UNAVAILABLE),
      );

      await expect(controller.getFeatureImportance()).rejects.toThrow(HttpException);
      await expect(controller.getFeatureImportance()).rejects.toThrow(
        'Feature importance unavailable',
      );
    });

    it('should return empty array when no features are available', async () => {
      mockPerformancePredictorService.getFeatureImportance.mockResolvedValue([]);

      const result = await controller.getFeatureImportance();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('retrainModel', () => {
    const mockRetrainResponse = {
      message: 'Model retrained successfully',
      modelVersion: 'v2',
      accuracy: 0.85,
      trainingSamples: 5000,
      trainingDuration: '15m 32s',
      improvements: {
        mae_improvement: 0.05,
        rmse_improvement: 0.08,
      },
    };

    it('should trigger model retraining successfully', async () => {
      mockPerformancePredictorService.retrainModel.mockResolvedValue(mockRetrainResponse);

      const result = await controller.retrainModel();

      expect(result).toEqual(mockRetrainResponse);
      expect(result.modelVersion).toBe('v2');
      expect(result.accuracy).toBe(0.85);
      expect(service.retrainModel).toHaveBeenCalledTimes(1);
    });

    it('should handle model retraining failure', async () => {
      mockPerformancePredictorService.retrainModel.mockRejectedValue(
        new HttpException('Model retraining failed', HttpStatus.INTERNAL_SERVER_ERROR),
      );

      await expect(controller.retrainModel()).rejects.toThrow(HttpException);
      await expect(controller.retrainModel()).rejects.toThrow('Model retraining failed');
    });

    it('should handle insufficient training data error', async () => {
      mockPerformancePredictorService.retrainModel.mockRejectedValue(
        new HttpException('Insufficient training data', HttpStatus.BAD_REQUEST),
      );

      await expect(controller.retrainModel()).rejects.toThrow(HttpException);
    });
  });

  describe('getPlayerPredictions', () => {
    it('should return not implemented message for player predictions', async () => {
      const result = await controller.getPlayerPredictions('player-123');

      expect(result).toEqual({ message: 'Not implemented yet' });
    });
  });

  describe('getPerformanceInsights', () => {
    it('should return not implemented message for performance insights', async () => {
      const result = await controller.getPerformanceInsights('player-123');

      expect(result).toEqual({
        message: 'Not implemented yet - placeholder for future insights',
      });
    });
  });

  describe('Authentication & Guards', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', PerformancePredictorController);
      const guardNames = guards.map((guard: any) => guard.name);

      expect(guardNames).toContain('JwtAuthGuard');
    });

    it('should require bearer token for all endpoints', () => {
      // Check that ApiBearerAuth decorator is applied
      const metadata = Reflect.getMetadata('swagger/apiSecurity', PerformancePredictorController);

      expect(metadata).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should propagate HTTP exceptions correctly', async () => {
      const customError = new HttpException('Custom error', HttpStatus.BAD_REQUEST);
      mockPerformancePredictorService.predictPerformance.mockRejectedValue(customError);

      await expect(controller.predictPerformance('player-123', 'match-456')).rejects.toThrow(
        customError,
      );
    });

    it('should handle unexpected errors', async () => {
      mockPerformancePredictorService.predictPerformance.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(controller.predictPerformance('player-123', 'match-456')).rejects.toThrow(
        'Unexpected error',
      );
    });
  });

  describe('Response Validation', () => {
    it('should return prediction with valid confidence interval', async () => {
      const prediction: PerformancePredictionDto = {
        playerId: 'player-123',
        predictedRating: 7.5,
        confidenceInterval: [6.5, 8.5],
        confidence: 0.9,
        ratingDistribution: {
          poor_0_5: 0.05,
          average_5_7: 0.15,
          good_7_8: 0.5,
          excellent_8_plus: 0.3,
        },
        keyFactors: [],
        recommendations: [],
      };

      mockPerformancePredictorService.predictPerformance.mockResolvedValue(prediction);

      const result = await controller.predictPerformance('player-123', 'match-456');

      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.confidenceInterval[0]).toBeLessThan(result.predictedRating);
      expect(result.confidenceInterval[1]).toBeGreaterThan(result.predictedRating);
    });

    it('should return prediction with valid rating distribution', async () => {
      const prediction: PerformancePredictionDto = {
        playerId: 'player-123',
        predictedRating: 7.0,
        confidenceInterval: [6.0, 8.0],
        confidence: 0.85,
        ratingDistribution: {
          poor_0_5: 0.05,
          average_5_7: 0.25,
          good_7_8: 0.5,
          excellent_8_plus: 0.2,
        },
        keyFactors: [],
        recommendations: [],
      };

      mockPerformancePredictorService.predictPerformance.mockResolvedValue(prediction);

      const result = await controller.predictPerformance('player-123', 'match-456');

      const total =
        result.ratingDistribution.poor_0_5 +
        result.ratingDistribution.average_5_7 +
        result.ratingDistribution.good_7_8 +
        result.ratingDistribution.excellent_8_plus;

      expect(total).toBeCloseTo(1.0, 2);
    });
  });
});
