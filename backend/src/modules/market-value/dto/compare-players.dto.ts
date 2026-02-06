import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ComparePlayersRequestDto {
  @ApiProperty({
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174001'],
    description: 'Array of player IDs to compare (max 10)',
  })
  @IsArray()
  @IsString({ each: true })
  playerIds: string[];
}

export class PlayerComparisonDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  playerId: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  playerName: string;

  @ApiProperty({ example: 23 })
  age: number;

  @ApiProperty({ example: 'FWD' })
  position: string;

  @ApiProperty({ example: 23.5 })
  estimatedValue: number;

  @ApiProperty({ example: 0.82 })
  confidenceScore: number;

  @ApiProperty({ example: 32 })
  appearances: number;

  @ApiProperty({ example: 15 })
  goals: number;

  @ApiProperty({ example: 8 })
  assists: number;

  @ApiProperty({ example: 7.8 })
  rating: number;
}

export class ComparePlayersResponseDto {
  @ApiProperty({ type: [PlayerComparisonDto] })
  @IsArray()
  @Type(() => PlayerComparisonDto)
  players: PlayerComparisonDto[];

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsString()
  highestValuePlayerId: string;

  @ApiProperty({ example: 28.5 })
  highestValue: number;

  @ApiProperty({ example: 22.3 })
  averageValue: number;

  @ApiProperty({ example: 3.2 })
  valueStdDev: number;
}
