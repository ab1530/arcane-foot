import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreatePassportShareSetDto {
  @ApiProperty({
    description: 'Player IDs to include in the shortlist (1..20).',
    example: ['e7a65c16-580c-407d-bd88-89ddcf1c53e9'],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true })
  playerIds: string[];

  @ApiPropertyOptional({ description: 'Optional title displayed on the shortlist page.' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Optional club name displayed on the shortlist page.' })
  @IsOptional()
  @IsString()
  clubName?: string;
}

