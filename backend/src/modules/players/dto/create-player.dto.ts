import { IsString, IsOptional, IsInt, IsDateString, IsNumber, IsEnum } from 'class-validator';
import { PlayerStatus } from '@prisma/client';

export class CreatePlayerDto {
  @IsString()
  userId: string;

  @IsString()
  @IsOptional()
  clubId?: string;

  @IsString()
  position: string;

  @IsString()
  @IsOptional()
  preferredFoot?: string;

  @IsInt()
  @IsOptional()
  jerseyNumber?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  nationality: string;

  @IsEnum(PlayerStatus)
  @IsOptional()
  status?: PlayerStatus;

  @IsNumber()
  @IsOptional()
  marketValue?: number;

  @IsDateString()
  @IsOptional()
  contractUntil?: string;

  @IsString()
  @IsOptional()
  biography?: string;
}
