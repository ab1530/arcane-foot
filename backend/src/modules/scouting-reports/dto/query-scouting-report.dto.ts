import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportStatus, RecommendationType } from '@prisma/client';

export class QueryScoutingReportDto {
  @ApiPropertyOptional({ description: 'ID du joueur' })
  @IsString()
  @IsOptional()
  playerId?: string;

  @ApiPropertyOptional({ description: 'ID du scout' })
  @IsString()
  @IsOptional()
  scoutId?: string;

  @ApiPropertyOptional({ description: 'ID du match' })
  @IsString()
  @IsOptional()
  matchId?: string;

  @ApiPropertyOptional({ enum: ReportStatus, description: 'Statut du rapport' })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: RecommendationType, description: 'Type de recommandation' })
  @IsEnum(RecommendationType)
  @IsOptional()
  recommendation?: RecommendationType;

  @ApiPropertyOptional({ description: 'Numéro de page', example: 1, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: "Nombre d'éléments par page", example: 20, default: 1000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  limit?: number;
}
