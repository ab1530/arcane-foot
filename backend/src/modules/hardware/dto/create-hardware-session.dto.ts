import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class HardwareMetricsDto {
  @ApiPropertyOptional({ description: 'Total distance covered (meters)', example: 10400 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  movementDistanceM?: number;

  @ApiPropertyOptional({ description: 'Distance covered in sprints (meters)', example: 1250 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sprintDistanceM?: number;

  @ApiPropertyOptional({ description: 'Offense / Defense ratio', example: 1.12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offenseDefenseRatio?: number;

  @ApiPropertyOptional({ description: 'Average speed (km/h)', example: 22.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  avgSpeedKmh?: number;

  @ApiPropertyOptional({ description: 'Maximum speed (km/h)', example: 34.8 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSpeedKmh?: number;

  @ApiPropertyOptional({ description: 'Total sprint time (seconds)', example: 72.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  sprintTimeS?: number;

  @ApiPropertyOptional({ description: 'Number of sprints', example: 18 })
  @IsOptional()
  @IsInt()
  sprintCount?: number;

  @ApiPropertyOptional({ description: 'Session duration (minutes)', example: 92.5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalTimeMin?: number;

  @ApiPropertyOptional({ description: 'Calories burned', example: 1180 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  caloriesBurned?: number;

  @ApiPropertyOptional({ description: 'Maximum acceleration (g)', example: 3.1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAccelerationG?: number;

  @ApiPropertyOptional({ description: 'Maximum deceleration (g)', example: 3.4 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDecelerationG?: number;

  @ApiPropertyOptional({ description: 'Number of accelerations', example: 44 })
  @IsOptional()
  @IsInt()
  accelerationCount?: number;

  @ApiPropertyOptional({ description: 'Number of speed reductions', example: 19 })
  @IsOptional()
  @IsInt()
  reductionStepsCount?: number;

  @ApiPropertyOptional({ description: 'Thermal / heatmap data', type: Object })
  @IsOptional()
  @IsObject()
  thermalTrajectoryMap?: any;

  @ApiPropertyOptional({ description: 'Sprint vectorisation data', type: Object })
  @IsOptional()
  @IsObject()
  sprintVectorData?: any;

  @ApiPropertyOptional({ description: 'Motion trajectory playback data', type: Object })
  @IsOptional()
  @IsObject()
  motionTrajectoryData?: any;

  @ApiPropertyOptional({ description: 'Six-dimensional quality metrics', type: Object })
  @IsOptional()
  @IsObject()
  qualitySixDimensional?: any;

  @ApiPropertyOptional({ description: 'Raw hardware metrics payload', type: Object })
  @IsOptional()
  @IsObject()
  rawMetrics?: any;

  @ApiPropertyOptional({ description: 'Normalized metrics payload', type: Object })
  @IsOptional()
  @IsObject()
  normalizedMetrics?: any;
}

export class CreateHardwareSessionDto {
  @ApiPropertyOptional({
    description: 'Player ID (defaults to the authenticated player when omitted)',
  })
  @IsOptional()
  @IsString()
  playerId?: string;

  @ApiProperty({
    description: 'Unique device identifier',
    example: 'gps-vest-001',
  })
  @IsString()
  deviceId: string;

  @ApiProperty({
    description: 'Source identifier for the hardware',
    example: 'nashone_v1',
  })
  @IsString()
  source: string;

  @ApiProperty({
    description: 'Session type',
    enum: ['match', 'training', 'test'],
    example: 'training',
  })
  @IsIn(['match', 'training', 'test'])
  @IsString()
  type: string;

  @ApiProperty({
    description: 'Session start time (ISO8601)',
    example: '2025-02-14T09:00:00Z',
  })
  @IsDateString()
  startedAt: string;

  @ApiProperty({
    description: 'Session end time (ISO8601)',
    example: '2025-02-14T10:15:00Z',
  })
  @IsDateString()
  endedAt: string;

  @ApiPropertyOptional({ description: 'Metrics payload', type: () => HardwareMetricsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => HardwareMetricsDto)
  metrics?: HardwareMetricsDto;
}
