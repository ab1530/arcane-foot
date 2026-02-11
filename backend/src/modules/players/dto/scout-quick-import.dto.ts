import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';

export class ScoutQuickImportDto {
  @ApiProperty({
    description: 'Raw multi-line text copied from scout notes/chat',
    example:
      'Alidini Jasmin 2010 Saint Brice - ailier - droitier\nWalid Regragui Torcy - 2010 - Attaquant',
  })
  @IsString()
  rawText: string;

  @ApiPropertyOptional({
    description: 'When true, parse and validate only without writing to database',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  dryRun?: boolean;

  @ApiPropertyOptional({
    description: 'Default nationality (ISO 3166-1 alpha-2) when not specified per line',
    default: 'FR',
    example: 'FR',
  })
  @IsString()
  @Length(2, 2)
  @IsOptional()
  defaultNationality?: string;
}

export type ScoutQuickImportAction = 'CREATED' | 'UPDATED' | 'FAILED';

export interface ScoutQuickImportRow {
  line: number;
  raw: string;
  action: ScoutQuickImportAction;
  playerId?: string;
  reason?: string;
}

export interface ScoutQuickImportResult {
  created: number;
  updated: number;
  failed: number;
  rows: ScoutQuickImportRow[];
}
