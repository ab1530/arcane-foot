import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class RegisterCampDto {
  @ApiProperty({ example: 'player-id-123', description: 'ID du joueur participant' })
  @IsString()
  playerId: string;

  @ApiPropertyOptional({ example: 'Jean Dupont', description: 'Nom du parent (si mineur)' })
  @IsString()
  @IsOptional()
  parentName?: string;

  @ApiPropertyOptional({ example: 'parent@example.com' })
  @IsString()
  @IsOptional()
  parentEmail?: string;

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsString()
  @IsOptional()
  parentPhone?: string;

  @ApiPropertyOptional({ example: true, description: 'Consentement parental donné' })
  @IsBoolean()
  @IsOptional()
  parentalConsentGiven?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/consent.pdf' })
  @IsString()
  @IsOptional()
  parentalConsentUrl?: string;

  @ApiPropertyOptional({ example: true, description: 'Décharge médicale signée' })
  @IsBoolean()
  @IsOptional()
  medicalWaiverSigned?: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/waiver.pdf' })
  @IsString()
  @IsOptional()
  medicalWaiverUrl?: string;

  @ApiPropertyOptional({ example: 'Asthme léger', description: 'Conditions médicales' })
  @IsString()
  @IsOptional()
  medicalConditions?: string;

  @ApiPropertyOptional({ example: 'Marie Dupont' })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: '+33698765432' })
  @IsString()
  @IsOptional()
  emergencyPhone?: string;

  @ApiPropertyOptional({ example: 'Allergie aux cacahuètes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
