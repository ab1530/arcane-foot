import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, IsObject, Min } from 'class-validator';

export class CreateScoutListingDto {
  @ApiProperty({ description: 'Professional headline', example: 'Senior Scout - LaLiga & Bundesliga' })
  @IsString()
  headline: string;

  @ApiProperty({ description: 'Professional bio', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'Expertise in leagues, positions, age groups',
    example: { leagues: ['LaLiga', 'Bundesliga'], positions: ['GK', 'CB'], ageGroups: ['U21', 'SENIOR'] },
  })
  @IsObject()
  expertise: {
    leagues: string[];
    positions: string[];
    ageGroups: string[];
  };

  @ApiProperty({ description: 'Languages spoken', example: ['en', 'es', 'de'] })
  @IsArray()
  @IsString({ each: true })
  languages: string[];

  @ApiProperty({
    description: 'Availability in countries and travel radius',
    example: { countries: ['ES', 'DE', 'FR'], travelRadius: 500 },
  })
  @IsObject()
  availability: {
    countries: string[];
    travelRadius?: number;
  };

  @ApiProperty({ description: 'Hourly rate in EUR', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({ description: 'Per-match rate in EUR', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  matchRate?: number;

  @ApiProperty({ description: 'Per-report rate in EUR', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reportRate?: number;

  @ApiProperty({ description: 'Currency', default: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({
    description: 'Portfolio with top reports and players discovered',
    required: false,
  })
  @IsOptional()
  @IsObject()
  portfolio?: {
    topReports?: string[];
    playersDiscovered?: string[];
  };
}
