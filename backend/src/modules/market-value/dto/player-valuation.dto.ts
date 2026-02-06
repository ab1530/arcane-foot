import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsObject, IsString, IsArray } from 'class-validator';

export class ConfidenceIntervalDto {
  @ApiProperty({ example: 18.5, description: 'Lower bound of confidence interval in M EUR' })
  @IsNumber()
  low: number;

  @ApiProperty({ example: 28.5, description: 'Upper bound of confidence interval in M EUR' })
  @IsNumber()
  high: number;
}

export class ComparablePlayerDto {
  @ApiProperty({ example: 'Similar Player 1' })
  @IsString()
  name: string;

  @ApiProperty({ example: 23 })
  @IsNumber()
  age: number;

  @ApiProperty({ example: 'FWD' })
  @IsString()
  position: string;

  @ApiProperty({ example: 25.0 })
  @IsNumber()
  market_value: number;

  @ApiProperty({ example: 0.85 })
  @IsNumber()
  similarity_score: number;
}

export class PlayerValuationDto {
  @ApiProperty({ example: 23.5, description: 'Estimated market value in millions EUR' })
  @IsNumber()
  estimatedValue: number;

  @ApiProperty({ type: ConfidenceIntervalDto })
  @IsObject()
  confidenceInterval: ConfidenceIntervalDto;

  @ApiProperty({ example: 0.82, description: 'Confidence score between 0 and 1' })
  @IsNumber()
  confidenceScore: number;

  @ApiProperty({
    example: {
      age_normalized: 2.5,
      rating_normalized: 5.2,
      goals_per_90: 3.8,
    },
    description: 'Breakdown of contributing factors',
  })
  @IsObject()
  factors: Record<string, number>;

  @ApiProperty({ type: [ComparablePlayerDto] })
  @IsArray()
  comparablePlayers: ComparablePlayerDto[];

  @ApiProperty({ example: 'v1' })
  @IsString()
  modelVersion: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  playerId: string;

  @ApiProperty()
  timestamp: Date;
}
