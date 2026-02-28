import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ListAgentRequestsQueryDto {
  @ApiPropertyOptional({
    example: 'CREATED',
    enum: ['CREATED', 'IN_PROGRESS', 'SATISFIED', 'CANCELLED'],
    description: 'Filtrer par statut de demande',
  })
  @IsOptional()
  @IsString()
  @IsIn(['CREATED', 'IN_PROGRESS', 'SATISFIED', 'CANCELLED'])
  status?: 'CREATED' | 'IN_PROGRESS' | 'SATISFIED' | 'CANCELLED';

  @ApiPropertyOptional({
    example: 'EQUIPMENT',
    enum: ['INJURY', 'MEDICAL', 'EQUIPMENT', 'OTHER'],
    description: 'Filtrer par catégorie de demande',
  })
  @IsOptional()
  @IsString()
  @IsIn(['INJURY', 'MEDICAL', 'EQUIPMENT', 'OTHER'])
  category?: 'INJURY' | 'MEDICAL' | 'EQUIPMENT' | 'OTHER';

  @ApiPropertyOptional({
    example: 1,
    description: 'Page (1+)',
  })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiPropertyOptional({
    example: 20,
    description: 'Nombre max d’éléments par page',
  })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({
    description: 'Voir uniquement les demandes créées par l’utilisateur connecté',
  })
  @IsOptional()
  @IsString()
  myOnly?: string;

  @ApiPropertyOptional({
    example: 'SCOUT',
    enum: ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'SCOUT', 'ANALYST', 'PLAYER', 'CLUB_CONTACT', 'PUBLIC'],
    description: 'Filtrer selon le rôle du créateur de la demande',
  })
  @IsOptional()
  @IsString()
  @IsIn(['SUPER_ADMIN', 'ADMIN', 'AGENT', 'SCOUT', 'ANALYST', 'PLAYER', 'CLUB_CONTACT', 'PUBLIC'])
  creatorRole?:
    | 'SUPER_ADMIN'
    | 'ADMIN'
    | 'AGENT'
    | 'SCOUT'
    | 'ANALYST'
    | 'PLAYER'
    | 'CLUB_CONTACT'
    | 'PUBLIC';
}
