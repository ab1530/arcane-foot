import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PerformancePredictorService } from './performance-predictor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  PerformancePredictionDto,
  PredictionRequestDto,
  BatchPredictionRequestDto,
  BatchPredictionResponseDto,
  AccuracyMetricsDto,
  FeatureImportanceDto,
} from './dto/performance-prediction.dto';

@ApiTags('Performance Predictor')
@Controller('performance-predictor')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PerformancePredictorController {
  constructor(private readonly predictorService: PerformancePredictorService) {}

  @Post('predict/:playerId/:matchId')
  @ApiOperation({
    summary: 'Predict player performance for upcoming match',
    description: 'Uses ML model to predict player rating, confidence intervals, and provide recommendations'
  })
  @ApiResponse({
    status: 200,
    description: 'Performance prediction generated',
    type: PerformancePredictionDto
  })
  @ApiResponse({ status: 404, description: 'Player or match not found' })
  @ApiResponse({ status: 503, description: 'Prediction service unavailable' })
  async predictPerformance(
    @Param('playerId') playerId: string,
    @Param('matchId') matchId: string,
  ): Promise<PerformancePredictionDto> {
    return this.predictorService.predictPerformance(playerId, matchId);
  }

  @Post('batch-predict/:matchId')
  @ApiOperation({
    summary: 'Predict performance for all players in match',
    description: 'Batch prediction for both teams'
  })
  @ApiResponse({
    status: 200,
    description: 'Batch predictions generated',
    type: [PerformancePredictionDto]
  })
  async batchPredictForMatch(
    @Param('matchId') matchId: string,
  ): Promise<PerformancePredictionDto[]> {
    return this.predictorService.batchPredictForMatch(matchId);
  }

  @Get('accuracy')
  @ApiOperation({
    summary: 'Get historical prediction accuracy',
    description: 'Retrieve accuracy metrics for model performance tracking'
  })
  @ApiResponse({
    status: 200,
    description: 'Accuracy metrics retrieved',
    type: [AccuracyMetricsDto]
  })
  async getAccuracy(
    @Query('playerId') playerId?: string,
    @Query('dateRange') dateRange?: string,
  ): Promise<AccuracyMetricsDto[]> {
    return this.predictorService.getAccuracy(playerId, dateRange);
  }

  @Get('feature-importance')
  @ApiOperation({
    summary: 'Get feature importance from model',
    description: 'Shows which features matter most in predictions'
  })
  @ApiResponse({
    status: 200,
    description: 'Feature importance retrieved',
    type: [FeatureImportanceDto]
  })
  async getFeatureImportance(): Promise<FeatureImportanceDto[]> {
    return this.predictorService.getFeatureImportance();
  }

  @Post('retrain')
  @ApiOperation({
    summary: 'Trigger model retraining',
    description: 'Retrain ML model with latest match data (admin only)'
  })
  @ApiResponse({ status: 200, description: 'Model retrained successfully' })
  @ApiResponse({ status: 500, description: 'Model retraining failed' })
  async retrainModel(): Promise<any> {
    return this.predictorService.retrainModel();
  }

  @Get('predictions/:playerId')
  @ApiOperation({
    summary: 'Get historical predictions for player',
    description: 'Retrieve all predictions made for a specific player'
  })
  @ApiResponse({ status: 200, description: 'Historical predictions retrieved' })
  async getPlayerPredictions(@Param('playerId') playerId: string) {
    // Implementation would query performance_predictions table
    // This is left as an exercise - just showing the endpoint structure
    return { message: 'Not implemented yet' };
  }

  @Get('insights/:playerId')
  @ApiOperation({
    summary: 'Get performance insights for player',
    description: 'Analyze prediction patterns and performance trends'
  })
  @ApiResponse({ status: 200, description: 'Performance insights retrieved' })
  async getPerformanceInsights(@Param('playerId') playerId: string) {
    // Could analyze:
    // - Average predicted vs actual ratings
    // - Performance in home vs away matches
    // - Performance against different opponent strengths
    // - Form trends
    return { message: 'Not implemented yet - placeholder for future insights' };
  }
}
