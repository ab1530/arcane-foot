import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';
import { EventType, EventStatus } from '@prisma/client';

export class QueryEventDto {
  @ApiPropertyOptional({ enum: EventType, description: "Filtrer par type d'événement" })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @ApiPropertyOptional({ enum: EventStatus, description: 'Filtrer par statut' })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Date de début (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Date de fin (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: "ID de l'utilisateur assigné" })
  @IsString()
  @IsOptional()
  assignedUserId?: string;

  @ApiPropertyOptional({ description: 'ID du match associé' })
  @IsString()
  @IsOptional()
  matchId?: string;
}
