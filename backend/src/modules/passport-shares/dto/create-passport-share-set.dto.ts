import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

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

  @ApiPropertyOptional({
    description: 'Optional source feature used to create this share.',
    enum: ['CLUB_NEEDS'],
  })
  @IsOptional()
  @IsIn(['CLUB_NEEDS'])
  sourceFeature?: 'CLUB_NEEDS';

  @ApiPropertyOptional({
    description: 'Optional source request id (e.g. club needs request id).',
  })
  @IsOptional()
  @IsUUID('4')
  sourceRequestId?: string;

  @ApiPropertyOptional({
    description: 'Optional source request line number (1-based).',
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  sourceRequestLineNumber?: number;
}
