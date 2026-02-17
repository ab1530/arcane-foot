import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateTransferEventDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  transferDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fromClubName?: string;

  @ApiProperty()
  @IsString()
  toClubName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  marketValueAtTime?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  feeAmount?: number;

  @ApiPropertyOptional({ default: 'EUR' })
  @IsOptional()
  @IsString()
  feeCurrency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  transferType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'Ligue data office' })
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

export class UpdateTransferEventDto extends PartialType(CreateTransferEventDto) {}
