import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class TransferRequestRequirementsDto {
  @ApiPropertyOptional({ example: 'Striker' })
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(45)
  ageMin?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(12)
  @Max(45)
  ageMax?: number;

  @ApiPropertyOptional({ example: 2002 })
  @IsOptional()
  @IsInt()
  @Min(1970)
  @Max(2030)
  birthYearMin?: number;

  @ApiPropertyOptional({ example: 2007 })
  @IsOptional()
  @IsInt()
  @Min(1970)
  @Max(2030)
  birthYearMax?: number;

  @ApiPropertyOptional({ example: 500000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMin?: number;

  @ApiPropertyOptional({ example: 5000000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budgetMax?: number;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'LOAN_WITH_OPTION' })
  @IsOptional()
  @IsString()
  dealType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  euPassportRequired?: boolean;

  @ApiPropertyOptional({ example: 'Summer window 2026' })
  @IsOptional()
  @IsString()
  timing?: string;
}
