import { IsString, IsOptional, IsInt, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClubDto {
  @ApiProperty({
    description: 'Club full name',
    example: 'Paris Saint-Germain',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Club short name or abbreviation',
    example: 'PSG',
  })
  @IsString()
  @IsOptional()
  shortName?: string;

  @ApiPropertyOptional({
    description: 'Club logo URL',
    example: 'https://example.com/logos/psg.png',
  })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiProperty({
    description: 'Country (ISO 3166-1 alpha-2 code)',
    example: 'FR',
  })
  @IsString()
  country: string;

  @ApiPropertyOptional({
    description: 'City where the club is based',
    example: 'Paris',
  })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({
    description: 'Stadium name',
    example: 'Parc des Princes',
  })
  @IsString()
  @IsOptional()
  stadium?: string;

  @ApiPropertyOptional({
    description: 'Year the club was founded',
    example: 1970,
    minimum: 1800,
    maximum: 2100,
  })
  @IsInt()
  @IsOptional()
  founded?: number;

  @ApiPropertyOptional({
    description: 'Official website URL',
    example: 'https://www.psg.fr',
  })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({
    description: 'User ID of the club contact person',
    example: 'clxxxxxxxxxxxxxx',
  })
  @IsString()
  @IsOptional()
  contactUserId?: string;
}
