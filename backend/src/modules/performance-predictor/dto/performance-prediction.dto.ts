import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsObject, ValidateNested, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class KeyFactorDto {
  @ApiProperty({ example: 'form_l5', description: 'Feature name' })
  @IsString()
  factor: string;

  @ApiProperty({ example: 7.2, description: 'Feature value' })
  @IsNumber()
  value: number;

  @ApiProperty({ example: 0.15, description: 'Feature importance (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  importance: number;

  @ApiProperty({ example: 'positive', enum: ['positive', 'negative', 'neutral'] })
  @IsString()
  impact: string;

  @ApiProperty({ example: 'Recent form: 7.2/10 (last 5 matches)' })
  @IsString()
  description: string;
}

export class RatingDistributionDto {
  @ApiProperty({ example: 0.05, description: 'Probability of poor performance (0-5)' })
  @IsNumber()
  poor_0_5: number;

  @ApiProperty({ example: 0.25, description: 'Probability of average performance (5-7)' })
  @IsNumber()
  average_5_7: number;

  @ApiProperty({ example: 0.50, description: 'Probability of good performance (7-8)' })
  @IsNumber()
  good_7_8: number;

  @ApiProperty({ example: 0.20, description: 'Probability of excellent performance (8+)' })
  @IsNumber()
  excellent_8_plus: number;
}

export class PerformancePredictionDto {
  @ApiProperty({ example: 'player-123', description: 'Player ID' })
  @IsString()
  playerId: string;

  @ApiProperty({ example: 7.3, description: 'Predicted rating (0-10)' })
  @IsNumber()
  @Min(0)
  @Max(10)
  predictedRating: number;

  @ApiProperty({
    example: [6.5, 8.1],
    description: '95% confidence interval [low, high]',
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  confidenceInterval: number[];

  @ApiProperty({ example: 0.85, description: 'Prediction confidence score (0-1)' })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence: number;

  @ApiProperty({ type: RatingDistributionDto })
  @ValidateNested()
  @Type(() => RatingDistributionDto)
  ratingDistribution: RatingDistributionDto;

  @ApiProperty({ type: [KeyFactorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyFactorDto)
  keyFactors: KeyFactorDto[];

  @ApiProperty({
    example: ['High performance expected. Consider giving player key role in match.'],
    description: 'Actionable recommendations',
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  recommendations: string[];
}

export class PredictionRequestDto {
  @ApiProperty({ example: 'player-123' })
  @IsString()
  playerId: string;

  @ApiProperty({
    example: {
      venue: 'home',
      importance: 4,
      opponent_strength: 3,
      days_rest: 4,
      season_progress: 0.6,
      playing_position: 'CM'
    },
    description: 'Match context data'
  })
  @IsObject()
  matchContext: {
    venue?: string;
    importance?: number;
    opponent_strength?: number;
    days_rest?: number;
    season_progress?: number;
    playing_position?: string;
  };

  @ApiProperty({
    example: [6.5, 7.0, 6.8, 7.2, 7.5],
    description: 'Recent match ratings (last 5-10 matches)',
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  recentForm: number[];

  @ApiProperty({
    example: {
      avg_minutes: 85,
      technical_rating: 7.0,
      tactical_rating: 6.8,
      physical_rating: 7.2,
      mental_rating: 6.9
    },
    description: 'Season statistics'
  })
  @IsObject()
  seasonStats: {
    avg_minutes?: number;
    technical_rating?: number;
    tactical_rating?: number;
    physical_rating?: number;
    mental_rating?: number;
  };

  @ApiProperty({
    example: {
      age: 24,
      height: 178,
      weight: 72,
      market_value: 5000000,
      position: 'CM'
    },
    description: 'Player attributes'
  })
  @IsObject()
  playerAttributes: {
    age: number;
    height?: number;
    weight?: number;
    market_value?: number;
    position: string;
  };
}

export class BatchPredictionRequestDto {
  @ApiProperty({ type: [PredictionRequestDto] })
  @IsArray()
  @ValidateNested({ each: true})
  @Type(() => PredictionRequestDto)
  predictions: PredictionRequestDto[];
}

export class BatchPredictionResponseDto {
  @ApiProperty({ type: [PerformancePredictionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PerformancePredictionDto)
  predictions: PerformancePredictionDto[];
}

export class AccuracyMetricsDto {
  @ApiProperty({ example: 100, description: 'Total predictions made' })
  @IsNumber()
  totalPredictions: number;

  @ApiProperty({ example: 0.82, description: 'Mean Absolute Error (rating points)' })
  @IsNumber()
  avgError: number;

  @ApiProperty({ example: 1.05, description: 'Root Mean Squared Error' })
  @IsNumber()
  rmse: number;

  @ApiProperty({ example: 0.75, description: '% of predictions within confidence interval' })
  @IsNumber()
  withinCI: number;

  @ApiProperty({ example: 0.68, description: 'R² score (optional)', required: false })
  @IsNumber()
  r2Score?: number;

  @ApiProperty({ example: '2024-01', description: 'Date range of metrics' })
  @IsString()
  dateRange: string;

  @ApiProperty({ example: 'v1' })
  @IsString()
  modelVersion: string;
}

export class FeatureImportanceDto {
  @ApiProperty({ example: 'form_l5' })
  @IsString()
  feature: string;

  @ApiProperty({ example: 0.15 })
  @IsNumber()
  importance: number;
}
