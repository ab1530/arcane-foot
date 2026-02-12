import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray, Min, Max } from 'class-validator';

export class PartialReportDto {
  @ApiPropertyOptional({ description: 'ID du match (optionnel pour le contexte)' })
  @IsString()
  @IsOptional()
  matchId?: string;

  @ApiPropertyOptional({ description: 'ID du joueur observé' })
  @IsString()
  @IsOptional()
  playerId?: string;

  @ApiPropertyOptional({ description: 'Position du joueur pendant le match' })
  @IsString()
  @IsOptional()
  playerPosition?: string;

  @ApiPropertyOptional({ description: 'Note technique (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  technicalRating?: number;

  @ApiPropertyOptional({ description: 'Note physique (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  physicalRating?: number;

  @ApiPropertyOptional({ description: 'Note mentale (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  mentalRating?: number;

  @ApiPropertyOptional({ description: 'Note tactique (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  tacticalRating?: number;

  @ApiPropertyOptional({ description: 'Forces du joueur (texte partiel)' })
  @IsString()
  @IsOptional()
  strengths?: string;

  @ApiPropertyOptional({ description: 'Faiblesses du joueur (texte partiel)' })
  @IsString()
  @IsOptional()
  weaknesses?: string;

  @ApiPropertyOptional({ description: 'Résumé du rapport (texte partiel)' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: 'Notes supplémentaires' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Tags/mots-clés',
    type: [String],
    example: ['rapide', 'bon pied gauche'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
