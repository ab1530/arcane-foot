import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchListingsDto {
  @ApiProperty({
    description: 'Filter by leagues',
    required: false,
    example: ['LaLiga', 'Bundesliga'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  leagues?: string[];

  @ApiProperty({ description: 'Filter by positions', required: false, example: ['GK', 'CB'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positions?: string[];

  @ApiProperty({ description: 'Filter by age group', required: false, example: 'U21' })
  @IsOptional()
  @IsString()
  ageGroup?: string;

  @ApiProperty({ description: 'Filter by country', required: false, example: 'ES' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Filter by languages', required: false, example: ['en', 'es'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ description: 'Maximum budget (hourly rate)', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  maxBudget?: number;

  @ApiProperty({ description: 'Minimum rating', required: false })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiProperty({ description: 'Only verified scouts', required: false, default: false })
  @IsOptional()
  verifiedOnly?: boolean;

  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number;
}
