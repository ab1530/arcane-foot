import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class SubmitPlayerWeeklyUpdateDto {
  @ApiPropertyOptional({
    description: 'Start date of the week (ISO 8601). Defaults to current week start if not provided',
    example: '2026-02-15',
  })
  @IsDateString()
  @IsOptional()
  weekStartDate?: string;

  @ApiProperty({
    description: 'Minutes played this week',
    example: 740,
    minimum: 0,
    maximum: 9999,
  })
  @IsInt()
  @Min(0)
  @Max(9999)
  minutesPlayed: number;

  @ApiProperty({
    description: 'Number of goals scored this week',
    example: 6,
    minimum: 0,
    maximum: 999,
  })
  @IsInt()
  @Min(0)
  @Max(999)
  goals: number;

  @ApiProperty({
    description: 'Number of assists this week',
    example: 4,
    minimum: 0,
    maximum: 999,
  })
  @IsInt()
  @Min(0)
  @Max(999)
  assists: number;

  @ApiProperty({
    description: 'Number of matches played this week',
    example: 4,
    minimum: 0,
    maximum: 99,
  })
  @IsInt()
  @Min(0)
  @Max(99)
  matchesPlayed: number;

  @ApiProperty({
    description: 'Number of matches non joués this week',
    example: 1,
    minimum: 0,
    maximum: 99,
  })
  @IsInt()
  @Min(0)
  @Max(99)
  matchesNotPlayed: number;

  @ApiProperty({
    description: 'Indicates if the player is injured this week',
    example: false,
    required: false,
  })
  @IsBoolean()
  isInjured: boolean;

  @ApiPropertyOptional({
    description: 'Health status for the week',
    example: 'NORMAL',
    enum: ['NORMAL', 'FATIGUE', 'INJURY'],
    default: 'NORMAL',
  })
  @IsString()
  @IsIn(['NORMAL', 'FATIGUE', 'INJURY'])
  @IsOptional()
  healthStatus?: 'NORMAL' | 'FATIGUE' | 'INJURY';

  @ApiPropertyOptional({
    description: 'Brief note with remarks from the player',
    example: 'Bien en forme, charge légère cette semaine.',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  remarks?: string;
}

