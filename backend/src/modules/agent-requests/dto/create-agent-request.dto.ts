import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export type AgentRequestCategory = 'INJURY' | 'MEDICAL' | 'EQUIPMENT' | 'OTHER';
export type AgentRequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export class CreateAgentRequestDto {
  @ApiProperty({
    example: "Demande d'équipement",
    description: 'Titre de la demande',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @ApiProperty({
    example: 'EQUIPMENT',
    enum: ['INJURY', 'MEDICAL', 'EQUIPMENT', 'OTHER'],
    description: 'Catégorie de demande',
  })
  @IsString()
  @IsIn(['INJURY', 'MEDICAL', 'EQUIPMENT', 'OTHER'])
  category: AgentRequestCategory;

  @ApiPropertyOptional({
    example: 'player-123',
    description: 'Identifiant joueur associé (optionnel)',
  })
  @IsOptional()
  @IsString()
  playerId?: string;

  @ApiPropertyOptional({
    example: 'scout-123',
    description: 'Identifiant du scout ciblé (agent/admin uniquement)',
  })
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @ApiPropertyOptional({
    example: 'Entorse cheville droite depuis 10 jours',
    description: 'Détail principal de la demande',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  details?: string;

  @ApiPropertyOptional({
    example: 'Besoin de 2 chaussures montantes et 1 montre connectée',
    description: 'Détails du besoin équipement',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  equipment?: string;

  @ApiPropertyOptional({
    example: 'Tendon d’Achille sensible',
    description: 'Contexte médical',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  medicalDetails?: string;

  @ApiPropertyOptional({
    example: 'RIGHT',
    enum: ['LEFT', 'RIGHT', 'BOTH'],
    description: 'Pied recherché (marché/profil)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['LEFT', 'RIGHT', 'BOTH'])
  preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';

  @ApiPropertyOptional({
    example: '2026-03-01',
    description: 'Date souhaitée de résolution',
  })
  @IsOptional()
  @IsString()
  dueAt?: string;

  @ApiPropertyOptional({
    example: 'HIGH',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    description: 'Priorité',
  })
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: AgentRequestPriority;
}
