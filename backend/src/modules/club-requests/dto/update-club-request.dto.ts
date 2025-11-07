import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsNumber, Min } from 'class-validator';
import { ClubRequestStatus } from '@prisma/client';

export class UpdateClubRequestDto {
  @ApiPropertyOptional({
    enum: ClubRequestStatus,
    description: 'Statut de la demande'
  })
  @IsEnum(ClubRequestStatus)
  @IsOptional()
  status?: ClubRequestStatus;

  @ApiPropertyOptional({ description: 'Message pour le club/joueur' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: 'Montant de l\'offre (en euros)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  offerAmount?: number;
}
