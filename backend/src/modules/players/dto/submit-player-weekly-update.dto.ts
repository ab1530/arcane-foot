import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
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
    description:
      'Start date of the week (ISO 8601). Defaults to current week start if not provided',
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

  @ApiPropertyOptional({
    description: 'Selected match for this weekly availability declaration',
    example: '2fd4597b-b123-45bc-91a4-0ec90f8c12d4',
  })
  @IsString()
  @IsOptional()
  selectedMatchId?: string;

  @ApiPropertyOptional({
    description: 'Availability status for the selected match',
    example: 'PLAYING',
    enum: ['PLAYING', 'BENCH', 'INJURED', 'ABSENT'],
  })
  @IsString()
  @IsIn(['PLAYING', 'BENCH', 'INJURED', 'ABSENT'])
  @IsOptional()
  selectedMatchAvailability?: 'PLAYING' | 'BENCH' | 'INJURED' | 'ABSENT';

  @ApiPropertyOptional({
    description: 'Tracker steps accumulated for the week',
    example: 54230,
    minimum: 0,
    maximum: 500000,
  })
  @IsInt()
  @Min(0)
  @Max(500000)
  @IsOptional()
  trackerSteps?: number;

  @ApiPropertyOptional({
    description: 'Tracker movement distance (meters) for the week',
    example: 18350,
    minimum: 0,
    maximum: 2000000,
  })
  @IsInt()
  @Min(0)
  @Max(2000000)
  @IsOptional()
  trackerDistanceM?: number;

  @ApiPropertyOptional({
    description: 'Tracker source used for synchronization',
    example: 'QCBAND',
  })
  @IsString()
  @IsOptional()
  trackerSource?: string;

  @ApiPropertyOptional({
    description: 'Declared team score for selected match',
    example: 2,
    minimum: 0,
    maximum: 30,
  })
  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  selectedMatchTeamScore?: number;

  @ApiPropertyOptional({
    description: 'Declared opponent score for selected match',
    example: 1,
    minimum: 0,
    maximum: 30,
  })
  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  selectedMatchOpponentScore?: number;

  @ApiPropertyOptional({
    description: 'Self-evaluated rating after selected match (0-10)',
    example: 7,
    minimum: 0,
    maximum: 10,
  })
  @IsInt()
  @Min(0)
  @Max(10)
  @IsOptional()
  selectedMatchRating?: number;

  @ApiPropertyOptional({
    description: 'Number of highlights uploaded this week',
    example: 2,
    minimum: 0,
    maximum: 20,
  })
  @IsInt()
  @Min(0)
  @Max(20)
  @IsOptional()
  highlightsUploaded?: number;

  @ApiPropertyOptional({
    description: 'Player confirms GPS/tracker data has been synced or entered manually',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  gpsSyncConfirmed?: boolean;

  @ApiPropertyOptional({
    description: 'Day-by-day weekly timeline for the active week (Monday to Monday)',
    example: [
      {
        dayKey: '2026-03-02',
        activityType: 'TRAINING',
        braceletSynced: true,
        notes: 'Séance collective',
      },
      {
        dayKey: '2026-03-08',
        activityType: 'MATCH',
        matchAvailability: 'PLAYING',
        gpsDistanceM: 9850,
        videoUploaded: true,
      },
    ],
  })
  @IsArray()
  @IsOptional()
  dailyTimeline?: Array<Record<string, any>>;
}
