import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class MarketProfileRuleDto {
  @ApiProperty({ example: 'italy-forward', description: 'Identifiant technique de la règle' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Marché italien', description: 'Nom de la règle' })
  @IsString()
  @MaxLength(120)
  label: string;

  @ApiProperty({ example: 'Italie', description: 'Marché cible' })
  @IsString()
  @MaxLength(80)
  market: string;

  @ApiPropertyOptional({ example: ['ATTAQUANT'], description: 'Positions recherchées' })
  @IsOptional()
  @IsArray()
  positions?: string[];

  @ApiPropertyOptional({ example: 185, description: 'Taille minimum en cm' })
  @IsOptional()
  @Min(140)
  minHeightCm?: number;

  @ApiPropertyOptional({
    enum: ['LEFT', 'RIGHT', 'BOTH'],
    example: 'RIGHT',
    description: 'Pied recherché',
  })
  @IsOptional()
  @IsString()
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';

  @ApiPropertyOptional({ example: 85, description: 'Indice d’endurance minimum (0-100)' })
  @IsOptional()
  @Min(0)
  minEndurance?: number;

  @ApiPropertyOptional({
    example: ['Rapide', 'Endurant'],
    description: 'Traits visibles côté dashboard/agent',
  })
  @IsOptional()
  @IsArray()
  traits?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Règle publiée',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
