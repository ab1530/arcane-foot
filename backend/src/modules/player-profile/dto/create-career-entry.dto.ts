import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { ProfileTeamLevel } from '@prisma/client';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCareerEntryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty()
  @IsString()
  clubName: string;

  @ApiProperty({ enum: ProfileTeamLevel })
  @IsEnum(ProfileTeamLevel)
  teamLevel: ProfileTeamLevel;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isLoan?: boolean;

  @ApiProperty({ example: 'Club archive' })
  @IsString()
  sourceName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  sourceUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  sourceDate?: string;
}

export class UpdateCareerEntryDto extends PartialType(CreateCareerEntryDto) {}
