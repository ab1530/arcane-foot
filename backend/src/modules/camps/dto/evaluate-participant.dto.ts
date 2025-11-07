import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class EvaluateParticipantDto {
  @ApiProperty({ example: 8, description: 'Note de performance générale (1-10)' })
  @IsNumber()
  @Min(1)
  @Max(10)
  performanceRating: number;

  @ApiPropertyOptional({ example: 7, description: 'Note technique (1-10)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  technicalRating?: number;

  @ApiPropertyOptional({ example: 9, description: 'Note physique (1-10)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  physicalRating?: number;

  @ApiPropertyOptional({ example: 8, description: 'Note mentale (1-10)' })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  mentalRating?: number;

  @ApiPropertyOptional({ example: 'Excellent joueur avec beaucoup de potentiel' })
  @IsString()
  @IsOptional()
  scoutNotes?: string;

  @ApiPropertyOptional({ example: true, description: 'Sélectionné pour le match showcase' })
  @IsBoolean()
  @IsOptional()
  selectedForShowcase?: boolean;

  @ApiPropertyOptional({ example: 'Très bon niveau technique, à suivre de près' })
  @IsString()
  @IsOptional()
  feedbackReport?: string;
}
