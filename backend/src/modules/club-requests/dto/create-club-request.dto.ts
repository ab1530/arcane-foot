import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateClubRequestDto {
  @ApiProperty({ description: 'ID du club' })
  @IsString()
  @IsNotEmpty()
  clubId: string;

  @ApiProperty({ description: 'ID du joueur' })
  @IsString()
  @IsNotEmpty()
  playerId: string;

  @ApiProperty({
    description: 'Type de demande',
    example: 'TRIAL',
    examples: ['TRIAL', 'LOAN', 'TRANSFER', 'FRIENDLY', 'SCOUTING'],
  })
  @IsString()
  @IsNotEmpty()
  requestType: string;

  @ApiPropertyOptional({ description: 'Message pour le club/joueur' })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({ description: "Montant de l'offre (en euros)" })
  @IsNumber()
  @IsOptional()
  @Min(0)
  offerAmount?: number;
}
