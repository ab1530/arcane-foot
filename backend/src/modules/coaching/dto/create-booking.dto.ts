import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'coach-id-123', description: 'ID du coach' })
  @IsString()
  coachId: string;

  @ApiProperty({ example: '2025-12-15T14:00:00Z', description: 'Date et heure de la séance' })
  @IsDateString()
  sessionDate: string;

  @ApiPropertyOptional({ example: 60, description: 'Durée en minutes' })
  @IsNumber()
  @IsOptional()
  @Min(15)
  duration?: number;

  @ApiPropertyOptional({ example: 'Centre sportif de Paris' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: true, description: 'Session à distance' })
  @IsBoolean()
  @IsOptional()
  isRemote?: boolean;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsString()
  @IsOptional()
  meetingLink?: string;

  @ApiPropertyOptional({
    example: 'Je souhaiterais travailler sur la gestion du stress avant les matchs',
  })
  @IsString()
  @IsOptional()
  userNotes?: string;
}
