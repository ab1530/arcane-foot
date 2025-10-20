import { IsString, IsOptional, IsEnum } from 'class-validator';
import { MediaType } from '@prisma/client';

export class UploadMediaDto {
  @IsEnum(MediaType)
  type: MediaType;

  @IsString()
  @IsOptional()
  playerId?: string;

  @IsString()
  @IsOptional()
  matchId?: string;

  @IsString()
  @IsOptional()
  reportId?: string;
}
