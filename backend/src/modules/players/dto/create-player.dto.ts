import { IsString, IsOptional, IsInt, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlayerStatus } from '@prisma/client';

export class CreatePlayerDto {
  @ApiProperty({
    description: 'User ID linked to this player',
    example: 'clxxxxxxxxxxxxxx',
  })
  @IsString()
  userId: string;

  @ApiPropertyOptional({
    description: 'Current club ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @IsString()
  @IsOptional()
  clubId?: string;

  @ApiProperty({
    description: 'Player position',
    example: 'Forward',
    enum: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  })
  @IsString()
  position: string;

  @ApiPropertyOptional({
    description: 'Preferred foot',
    example: 'Right',
    enum: ['Left', 'Right', 'Both'],
  })
  @IsString()
  @IsOptional()
  preferredFoot?: string;

  @ApiPropertyOptional({
    description: 'Jersey number',
    example: 10,
    minimum: 1,
    maximum: 99,
  })
  @IsInt()
  @IsOptional()
  jerseyNumber?: number;

  @ApiPropertyOptional({
    description: 'Height in cm',
    example: 180.5,
    minimum: 150,
    maximum: 220,
  })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({
    description: 'Weight in kg',
    example: 75.0,
    minimum: 50,
    maximum: 120,
  })
  @IsNumber()
  @IsOptional()
  weight?: number;

  @ApiProperty({
    description: 'Date of birth (ISO 8601 format)',
    example: '2000-01-15',
  })
  @IsDateString()
  dateOfBirth: string;

  @ApiProperty({
    description: 'Nationality (ISO 3166-1 alpha-2 code)',
    example: 'FR',
  })
  @IsString()
  nationality: string;

  @ApiPropertyOptional({
    description: 'Player status',
    enum: PlayerStatus,
    example: PlayerStatus.ACTIVE,
    default: PlayerStatus.PROSPECT,
  })
  @IsEnum(PlayerStatus)
  @IsOptional()
  status?: PlayerStatus;

  @ApiPropertyOptional({
    description: 'Market value in EUR',
    example: 5000000,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  marketValue?: number;

  @ApiPropertyOptional({
    description: 'Contract end date (ISO 8601 format)',
    example: '2026-06-30',
  })
  @IsDateString()
  @IsOptional()
  contractUntil?: string;

  @ApiPropertyOptional({
    description: 'Player biography',
    example: 'Promising young forward with excellent technical skills',
  })
  @IsString()
  @IsOptional()
  biography?: string;
}
