import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export enum PlayerSortField {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  AGE = 'age',
  HEIGHT = 'height',
  MARKET_VALUE = 'marketValue',
  RATING = 'rating',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class FilterPlayersDto {
  @ApiPropertyOptional({ description: 'Position du joueur', example: 'FORWARD' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: 'Statut du joueur', example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Nationalité (ISO code)', example: 'FR' })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional({ description: 'ID du club' })
  @IsString()
  @IsOptional()
  clubId?: string;

  @ApiPropertyOptional({ description: 'Recherche par nom' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Âge minimum', example: 18 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(14)
  @Max(50)
  minAge?: number;

  @ApiPropertyOptional({ description: 'Âge maximum', example: 30 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(14)
  @Max(50)
  maxAge?: number;

  @ApiPropertyOptional({ description: 'Taille minimum (cm)', example: 170 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(150)
  @Max(220)
  minHeight?: number;

  @ApiPropertyOptional({ description: 'Taille maximum (cm)', example: 190 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(150)
  @Max(220)
  maxHeight?: number;

  @ApiPropertyOptional({ description: 'Poids minimum (kg)', example: 65 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(130)
  minWeight?: number;

  @ApiPropertyOptional({ description: 'Poids maximum (kg)', example: 85 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(50)
  @Max(130)
  maxWeight?: number;

  @ApiPropertyOptional({ description: 'Valeur marchande minimum (€)', example: 100000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  minMarketValue?: number;

  @ApiPropertyOptional({ description: 'Valeur marchande maximum (€)', example: 5000000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxMarketValue?: number;

  @ApiPropertyOptional({ description: 'Pied préféré', enum: ['LEFT', 'RIGHT', 'BOTH'] })
  @IsString()
  @IsOptional()
  preferredFoot?: string;

  @ApiPropertyOptional({ description: 'Disponible pour un transfert', example: true })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  availableForTransfer?: boolean;

  @ApiPropertyOptional({
    description: 'Champ de tri',
    enum: PlayerSortField,
    default: PlayerSortField.CREATED_AT,
  })
  @IsEnum(PlayerSortField)
  @IsOptional()
  sortBy?: PlayerSortField;

  @ApiPropertyOptional({ description: 'Ordre de tri', enum: SortOrder, default: SortOrder.DESC })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;

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
