import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReportStatus, RecommendationType } from '@prisma/client';

export class CreateScoutingReportDto {
  @ApiProperty({ description: 'ID du match' })
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @ApiPropertyOptional({ description: 'ID du joueur observé' })
  @IsString()
  @IsOptional()
  playerId?: string;

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

  @ApiPropertyOptional({ description: 'Analyse technique avec ballon' })
  @IsString()
  @IsOptional()
  withBallAnalysis?: string;

  @ApiPropertyOptional({ description: 'Analyse du jeu sans ballon' })
  @IsString()
  @IsOptional()
  offBallAnalysis?: string;

  @ApiPropertyOptional({ description: "Analyse de l'intelligence de jeu" })
  @IsString()
  @IsOptional()
  gameIntelligenceAnalysis?: string;

  @ApiPropertyOptional({ description: "Analyse de l'attitude du joueur" })
  @IsString()
  @IsOptional()
  attitudeAnalysis?: string;

  @ApiPropertyOptional({ description: 'Avis consolidé du staff' })
  @IsString()
  @IsOptional()
  staffOpinion?: string;

  @ApiPropertyOptional({ description: 'Pied fort observé pendant le match' })
  @IsString()
  @IsOptional()
  observedDominantFoot?: string;

  @ApiPropertyOptional({ description: 'Taille observée (cm)', minimum: 100, maximum: 260 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(100)
  @Max(260)
  observedHeightCm?: number;

  @ApiPropertyOptional({ description: 'Poids observé (kg)', minimum: 30, maximum: 200 })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  @Min(30)
  @Max(200)
  observedWeightKg?: number;

  @ApiPropertyOptional({ description: 'Nom du club observé lors du match' })
  @IsString()
  @IsOptional()
  observedClubName?: string;

  @ApiPropertyOptional({ description: 'Prénom observé du joueur' })
  @IsString()
  @IsOptional()
  observedFirstName?: string;

  @ApiPropertyOptional({ description: 'Nom observé du joueur' })
  @IsString()
  @IsOptional()
  observedLastName?: string;

  @ApiPropertyOptional({ description: 'Nationalité observée du joueur' })
  @IsString()
  @IsOptional()
  observedNationality?: string;

  @ApiPropertyOptional({ description: 'Téléphone observé du joueur' })
  @IsString()
  @IsOptional()
  observedPhone?: string;

  @ApiPropertyOptional({ description: 'Email observé du joueur' })
  @IsString()
  @IsOptional()
  observedEmail?: string;

  @ApiPropertyOptional({ description: 'Sprint 10m (secondes)', minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  sprint10mSec?: number;

  @ApiPropertyOptional({ description: 'Sprint 20m (secondes)', minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  sprint20mSec?: number;

  @ApiPropertyOptional({ description: 'Sprint 40m (secondes)', minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  sprint40mSec?: number;

  @ApiPropertyOptional({ description: 'VMA (km/h)', minimum: 0 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsOptional()
  @Min(0)
  vmaKmh?: number;
}
