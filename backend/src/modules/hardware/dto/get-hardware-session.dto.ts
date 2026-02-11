import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HardwareMetricsDto } from './create-hardware-session.dto';

export class HardwareSessionPlayerDto {
  @ApiProperty({ description: 'Player ID' })
  id: string;

  @ApiProperty({ description: 'Player first name', example: 'Erling' })
  firstName: string;

  @ApiProperty({ description: 'Player last name', example: 'Haaland' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Club ID' })
  clubId?: string | null;

  @ApiPropertyOptional({ description: 'Club name' })
  clubName?: string | null;

  @ApiPropertyOptional({ description: 'Club logo URL' })
  clubLogo?: string | null;
}

export class GetHardwareSessionDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'Player ID the session belongs to' })
  playerId: string;

  @ApiPropertyOptional({ description: 'Attached player snapshot', type: () => HardwareSessionPlayerDto })
  player?: HardwareSessionPlayerDto;

  @ApiProperty({ description: 'Device identifier' })
  deviceId: string;

  @ApiProperty({ description: 'Data source (device firmware/hardware identifier)' })
  source: string;

  @ApiProperty({ description: 'Session type', enum: ['match', 'training', 'test'] })
  type: string;

  @ApiProperty({ description: 'Session start time' })
  startedAt: Date;

  @ApiProperty({ description: 'Session end time' })
  endedAt: Date;

  @ApiProperty({ description: 'Hardware metrics payload', type: () => HardwareMetricsDto })
  metrics: any;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
