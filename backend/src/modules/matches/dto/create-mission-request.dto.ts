import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMissionRequestDto {
  @ApiPropertyOptional({
    description: 'Scout target for this mission request',
    example: 'user_scout_123',
  })
  @IsOptional()
  @IsString()
  targetScoutId?: string;

  @ApiPropertyOptional({
    description: 'Mission type requested',
    enum: ['PRIORITY', 'VOLUNTARY'],
    default: 'PRIORITY',
  })
  @IsOptional()
  @IsString()
  @IsIn(['PRIORITY', 'VOLUNTARY'])
  missionType?: 'PRIORITY' | 'VOLUNTARY';

  @ApiPropertyOptional({
    description: 'Optional note attached to request',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
