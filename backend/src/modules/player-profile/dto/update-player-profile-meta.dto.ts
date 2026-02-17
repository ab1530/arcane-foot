import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';

export class UpdatePlayerProfileMetaDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mainPosition?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  otherPositions?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pronunciation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  outfitter?: string;

  @ApiPropertyOptional({
    description: 'Social links map, e.g. { instagram: "...", x: "..." }',
    type: Object,
  })
  @IsOptional()
  socialLinks?: Record<string, string | null>;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ require_protocol: true })
  externalMarketUrl?: string | null;
}
