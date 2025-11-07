import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsInt, Min, IsHexColor } from 'class-validator';
import { KanbanColumnType } from '@prisma/client';

export class CreateColumnDto {
  @ApiProperty({ description: 'Nom de la colonne' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: KanbanColumnType, description: 'Type de colonne' })
  @IsEnum(KanbanColumnType)
  type: KanbanColumnType;

  @ApiPropertyOptional({ description: 'Couleur hex pour l\'UI', example: '#3498db' })
  @IsString()
  @IsOptional()
  @IsHexColor()
  color?: string;

  @ApiPropertyOptional({ description: 'Position de la colonne', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({ description: 'Limite de cartes dans la colonne', minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  cardLimit?: number;
}
