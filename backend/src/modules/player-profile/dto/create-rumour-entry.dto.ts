import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateRumourEntryDto {
  @ApiProperty()
  @IsString()
  headline: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  destinationClub?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  probabilityPercent?: number;

  @ApiProperty()
  @IsString()
  sourceName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  sourceDate?: string;
}

export class UpdateRumourEntryDto extends PartialType(CreateRumourEntryDto) {}
