import { IsArray, IsOptional, IsString } from 'class-validator';

export class GenerateSummaryDto {
  @IsString()
  prompt: string;
}

export class MatchmakingRequestDto {
  @IsOptional()
  @IsArray()
  playerIds?: string[];

  @IsOptional()
  @IsArray()
  clubIds?: string[];

  @IsOptional()
  @IsArray()
  tags?: string[];
}
