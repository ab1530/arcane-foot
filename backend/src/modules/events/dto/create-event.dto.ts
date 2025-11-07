import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { EventType, EventStatus } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty({ description: 'Titre de l\'événement' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Description de l\'événement' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: EventType,
    description: 'Type d\'événement',
    default: EventType.OTHER,
  })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiProperty({
    enum: EventStatus,
    description: 'Statut de l\'événement',
    default: EventStatus.PLANNED,
  })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiProperty({ description: 'Date de début (ISO 8601)', example: '2025-01-15T10:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Date de fin (ISO 8601)', example: '2025-01-15T12:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: 'Lieu de l\'événement' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiPropertyOptional({ description: 'Latitude du lieu', example: 48.8566 })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude du lieu', example: 2.3522 })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'ID du match associé (optionnel)' })
  @IsString()
  @IsOptional()
  matchId?: string;

  @ApiPropertyOptional({
    description: 'IDs des utilisateurs assignés (scouts/agents)',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assignedUserIds?: string[];
}
