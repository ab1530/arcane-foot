import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class ReportContextDto {
  @ApiPropertyOptional({ description: 'ID du match pour le contexte' })
  @IsString()
  @IsOptional()
  matchId?: string;

  @ApiPropertyOptional({ description: 'ID du joueur pour le contexte' })
  @IsString()
  @IsOptional()
  playerId?: string;

  @ApiPropertyOptional({ description: 'ID du scout pour le contexte' })
  @IsString()
  @IsOptional()
  scoutId?: string;

  @ApiPropertyOptional({ description: 'Position du joueur pour filtrage' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: 'League/Compétition pour filtrage' })
  @IsString()
  @IsOptional()
  league?: string;
}
