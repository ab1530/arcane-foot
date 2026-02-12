import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ClassifyPlayerDto {
  @ApiProperty({ description: 'Player ID to classify' })
  @IsString()
  playerId: string;
}

export class ComparePlayersDto {
  @ApiProperty({ description: 'First player ID' })
  @IsString()
  player1Id: string;

  @ApiProperty({ description: 'Second player ID' })
  @IsString()
  player2Id: string;
}

export class FindSimilarPlayersDto {
  @ApiProperty({ description: 'Reference player ID' })
  @IsString()
  playerId: string;

  @ApiPropertyOptional({ description: 'Number of similar players to return', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export enum PlayingStyle {
  STRIKER = 'STRIKER',
  POACHER = 'POACHER',
  TARGET_MAN = 'TARGET_MAN',
  PLAYMAKER = 'PLAYMAKER',
  BOX_TO_BOX = 'BOX_TO_BOX',
  DEEP_LYING_PLAYMAKER = 'DEEP_LYING_PLAYMAKER',
  WINGER = 'WINGER',
  WING_BACK = 'WING_BACK',
  BALL_PLAYING_DEFENDER = 'BALL_PLAYING_DEFENDER',
  DESTROYER = 'DESTROYER',
  SWEEPER = 'SWEEPER',
  GOALKEEPER_SWEEPER = 'GOALKEEPER_SWEEPER',
}

export interface PlayStyleProfile {
  primaryStyle: PlayingStyle;
  secondaryStyle: PlayingStyle | null;
  confidence: number;
  styleScores: Record<PlayingStyle, number>;
  radarData: RadarChartData;
  attributes: PlayerAttributes;
}

export interface RadarChartData {
  labels: string[];
  values: number[];
}

export interface PlayerAttributes {
  technical: number;
  physical: number;
  mental: number;
  tactical: number;
  speed: number;
  finishing: number;
  passing: number;
  defending: number;
  dribbling: number;
  positioning: number;
}

export interface PlayerComparison {
  player1: {
    id: string;
    name: string;
    profile: PlayStyleProfile;
  };
  player2: {
    id: string;
    name: string;
    profile: PlayStyleProfile;
  };
  similarityScore: number;
  styleDifferences: string[];
  attributeDifferences: Record<string, { player1: number; player2: number; diff: number }>;
}

export interface SimilarPlayer {
  id: string;
  name: string;
  position: string;
  similarityScore: number;
  playingStyle: PlayingStyle;
  sharedAttributes: string[];
}
