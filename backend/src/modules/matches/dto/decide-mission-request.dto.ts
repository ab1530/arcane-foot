import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DecideMissionRequestDto {
  @ApiPropertyOptional({
    description: 'Scout selected by admin while approving request',
    example: 'user_scout_123',
  })
  @IsOptional()
  @IsString()
  scoutId?: string;

  @ApiPropertyOptional({
    description: 'Decision note',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;
}
