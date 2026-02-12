import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class MoveCardDto {
  @ApiProperty({ description: 'ID de la colonne de destination' })
  @IsString()
  @IsNotEmpty()
  targetColumnId: string;

  @ApiPropertyOptional({ description: 'Nouvelle position dans la colonne', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  position?: number;
}
