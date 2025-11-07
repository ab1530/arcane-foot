import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
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
}
