import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateNewsEntryDto {
  @ApiProperty()
  @IsString()
  headline: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  publishedAtSource?: string;

  @ApiProperty()
  @IsString()
  sourceName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  sourceUrl?: string;
}

export class UpdateNewsEntryDto extends PartialType(CreateNewsEntryDto) {}
