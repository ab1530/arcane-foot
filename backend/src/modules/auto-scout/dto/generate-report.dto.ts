import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '../interfaces/report.interface';

export class GenerateReportDto {
  @ApiProperty({
    description: 'ID of the player to generate report for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  playerId: string;

  @ApiPropertyOptional({
    description: 'Optional match ID for match-specific report',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsString()
  matchId?: string;

  @ApiPropertyOptional({
    description: 'Type of report to generate',
    enum: ReportType,
    default: ReportType.SEASON_OVERVIEW,
  })
  @IsOptional()
  @IsEnum(ReportType)
  reportType?: ReportType;

  @ApiPropertyOptional({
    description: 'Additional context or specific focus areas for the report',
    example: 'Focus on defensive capabilities and potential as a central midfielder',
  })
  @IsOptional()
  @IsString()
  customContext?: string;

  @ApiPropertyOptional({
    description: 'Whether to automatically save the report to database',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  autoSave?: boolean;

  @ApiPropertyOptional({
    description: 'AI temperature (creativity level). Lower = more focused, Higher = more creative',
    minimum: 0,
    maximum: 1,
    default: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Include player comparisons in the report',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeComparisons?: boolean;
}
