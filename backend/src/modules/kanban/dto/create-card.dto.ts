import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateCardDto {
  @ApiProperty({ description: 'ID du joueur' })
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @ApiProperty({ description: 'ID de la colonne' })
  @IsString()
  @IsNotEmpty()
  columnId: string;

  @ApiPropertyOptional({ description: 'Notes sur la carte' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    enum: TaskPriority,
    description: 'Priorité de la carte',
    default: TaskPriority.MEDIUM,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    description: 'Tags personnalisés',
    type: [String],
    example: ['urgent', 'contacté'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Date limite (ISO 8601)', example: '2025-02-15T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Date de rappel (ISO 8601)',
    example: '2025-02-10T09:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  reminderDate?: string;

  @ApiPropertyOptional({ description: 'Position dans la colonne', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  position?: number;
}
