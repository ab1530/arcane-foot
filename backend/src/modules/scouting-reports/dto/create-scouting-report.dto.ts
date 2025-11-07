import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { ReportStatus, RecommendationType } from '@prisma/client';

export class CreateScoutingReportDto {
  @ApiProperty({ description: 'ID du match' })
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @ApiProperty({ description: 'ID du joueur observé' })
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @ApiPropertyOptional({
    description: 'Statut du rapport',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
  })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Note globale (0-100)', minimum: 0, maximum: 100 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(100)
  overallRating?: number;

  @ApiPropertyOptional({ description: 'Résumé du rapport' })
  @IsString()
  @IsOptional()
  summary?: string;

  @ApiPropertyOptional({ description: 'Forces du joueur' })
  @IsString()
  @IsOptional()
  strengths?: string;

  @ApiPropertyOptional({ description: 'Faiblesses du joueur' })
  @IsString()
  @IsOptional()
  weaknesses?: string;

  // Ratings détaillés
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

  // Recommandation
  @ApiPropertyOptional({
    description: 'Type de recommandation',
    enum: RecommendationType,
  })
  @IsEnum(RecommendationType)
  @IsOptional()
  recommendation?: RecommendationType;

  @ApiPropertyOptional({ description: 'Notes sur la recommandation' })
  @IsString()
  @IsOptional()
  recommendationNotes?: string;

  // Tags
  @ApiPropertyOptional({
    description: 'Tags/mots-clés',
    type: [String],
    example: ['rapide', 'bon pied gauche', 'leader'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  // Joueurs similaires
  @ApiPropertyOptional({
    description: 'IDs de joueurs similaires pour comparaison',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  similarPlayerIds?: string[];

  // Contexte match
  @ApiPropertyOptional({ description: 'Minutes jouées pendant le match', minimum: 0, maximum: 120 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(120)
  playerMinutesPlayed?: number;

  @ApiPropertyOptional({ description: 'Position du joueur pendant le match' })
  @IsString()
  @IsOptional()
  playerPosition?: string;
}
