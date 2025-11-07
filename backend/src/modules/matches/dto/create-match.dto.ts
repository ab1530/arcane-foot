import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MatchStatus } from '@prisma/client';

export class CreateMatchDto {
  @ApiProperty({
    description: 'Home club ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @IsString()
  homeClubId: string;

  @ApiProperty({
    description: 'Away club ID',
    example: 'clxxxxxxxxxxxxxx',
  })
  @IsString()
  awayClubId: string;

  @ApiProperty({
    description: 'Match scheduled date and time (ISO 8601 format)',
    example: '2025-12-25T15:00:00Z',
  })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({
    description: 'Venue or stadium name (legacy field)',
    example: 'Stade de France',
  })
  @IsString()
  @IsOptional()
  venueOld?: string;

  @ApiPropertyOptional({
    description: 'Competition name (legacy field)',
    example: 'Ligue 1',
  })
  @IsString()
  @IsOptional()
  competitionOld?: string;

  @ApiProperty({
    description: 'Season identifier',
    example: '2025-2026',
  })
  @IsString()
  season: string;

  @ApiPropertyOptional({
    description: 'Match status',
    enum: MatchStatus,
    example: MatchStatus.SCHEDULED,
    default: MatchStatus.SCHEDULED,
  })
  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @ApiPropertyOptional({
    description: 'Scout assigned to this match',
    example: 'clxxxxxxxxxxxxxx',
  })
  @IsString()
  @IsOptional()
  scoutId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the match',
    example: 'Important derby match',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
