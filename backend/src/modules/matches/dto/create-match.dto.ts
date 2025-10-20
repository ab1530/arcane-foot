import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { MatchStatus } from '@prisma/client';

export class CreateMatchDto {
  @IsString()
  homeClubId: string;

  @IsString()
  awayClubId: string;

  @IsDateString()
  scheduledAt: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsString()
  competition: string;

  @IsString()
  season: string;

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @IsString()
  @IsOptional()
  scoutId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
