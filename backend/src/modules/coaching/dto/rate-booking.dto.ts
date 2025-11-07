import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

export class RateBookingDto {
  @ApiProperty({ example: 5, description: 'Note de 1 à 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  userRating: number;

  @ApiPropertyOptional({ example: 'Excellente séance, très à l\'écoute et de bons conseils' })
  @IsString()
  @IsOptional()
  userFeedback?: string;
}
