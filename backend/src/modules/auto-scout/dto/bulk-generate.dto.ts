import { IsString, IsArray, ArrayMinSize, ArrayMaxSize, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkGenerateDto {
  @ApiProperty({
    description: 'Array of player IDs to generate reports for',
    example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50, { message: 'Maximum 50 players can be processed at once' })
  @IsString({ each: true })
  playerIds: string[];

  @ApiProperty({
    description: 'Match ID for match-specific bulk reports',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsString()
  matchId: string;

  @ApiPropertyOptional({
    description: 'Additional context for all reports',
    example: 'Post-match analysis for championship final',
  })
  @IsOptional()
  @IsString()
  customContext?: string;
}
