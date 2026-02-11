import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CalculateMatchingDto {
  @ApiProperty({ description: 'Desired leagues', example: ['LaLiga', 'Bundesliga'] })
  @IsArray()
  @IsString({ each: true })
  leagues: string[];

  @ApiProperty({ description: 'Desired positions', example: ['GK', 'CB'] })
  @IsArray()
  @IsString({ each: true })
  positions: string[];

  @ApiProperty({ description: 'Age group', example: 'U21' })
  @IsString()
  ageGroup: string;

  @ApiProperty({ description: 'Maximum budget (hourly rate)' })
  @IsNumber()
  @Min(0)
  budget: number;

  @ApiProperty({ description: 'Location (country code)', example: 'ES' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Minimum rating', required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minRating?: number;
}
