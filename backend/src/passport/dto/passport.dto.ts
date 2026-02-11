import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PassportStatus } from '@prisma/client';

export class CreatePassportDto {
  @IsString()
  playerId: string;

  @IsOptional()
  @IsString()
  verificationNotes?: string;
}

export class VerifyPassportDto {
  @IsEnum(PassportStatus)
  status: PassportStatus;

  @IsOptional()
  @IsString()
  verificationNotes?: string;
}
