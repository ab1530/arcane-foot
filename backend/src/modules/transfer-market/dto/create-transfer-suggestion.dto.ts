import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateTransferSuggestionDto {
  @ApiProperty({ description: 'Player proposed by scout' })
  @IsUUID('4')
  @IsNotEmpty()
  playerId: string;

  @ApiPropertyOptional({ description: 'Scout comment', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
