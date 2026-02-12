import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber } from 'class-validator';

export class ValuationDataPointDto {
  @ApiProperty({ example: '2024-01-15T10:30:00Z' })
  timestamp: Date;

  @ApiProperty({ example: 23.5 })
  @IsNumber()
  value: number;

  @ApiProperty({ example: 0.82 })
  @IsNumber()
  confidence: number;

  @ApiProperty({ example: 'v1' })
  @IsString()
  modelVersion: string;
}

export class ValuationTrendDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  playerId: string;

  @ApiProperty({ type: [ValuationDataPointDto] })
  @IsArray()
  valuations: ValuationDataPointDto[];

  @ApiProperty({ example: 23.5 })
  @IsNumber()
  currentValue: number;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  previousValue: number;

  @ApiProperty({ example: 17.5, description: 'Percentage change from previous valuation' })
  @IsNumber()
  changePercent: number;

  @ApiProperty({ example: 'up', enum: ['up', 'down', 'stable'] })
  @IsString()
  trend: 'up' | 'down' | 'stable';
}
