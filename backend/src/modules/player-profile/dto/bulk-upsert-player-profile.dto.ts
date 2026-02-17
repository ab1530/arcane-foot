import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { UpdatePlayerProfileMetaDto } from './update-player-profile-meta.dto';
import { CreatePerformanceRowDto } from './create-performance-row.dto';
import { CreateTransferEventDto } from './create-transfer-event.dto';
import { CreateCareerEntryDto } from './create-career-entry.dto';
import { CreateAchievementEntryDto } from './create-achievement-entry.dto';
import { CreateNationalTeamEntryDto } from './create-national-team-entry.dto';
import { CreateNewsEntryDto } from './create-news-entry.dto';
import { CreateRumourEntryDto } from './create-rumour-entry.dto';

export class BulkUpsertPlayerProfileItemDto {
  @ApiProperty()
  @IsString()
  playerId: string;

  @ApiPropertyOptional({ type: UpdatePlayerProfileMetaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePlayerProfileMetaDto)
  meta?: UpdatePlayerProfileMetaDto;

  @ApiPropertyOptional({ type: [CreatePerformanceRowDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePerformanceRowDto)
  performanceRows?: CreatePerformanceRowDto[];

  @ApiPropertyOptional({ type: [CreateTransferEventDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTransferEventDto)
  transfers?: CreateTransferEventDto[];

  @ApiPropertyOptional({ type: [CreateCareerEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCareerEntryDto)
  career?: CreateCareerEntryDto[];

  @ApiPropertyOptional({ type: [CreateAchievementEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAchievementEntryDto)
  achievements?: CreateAchievementEntryDto[];

  @ApiPropertyOptional({ type: [CreateNationalTeamEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNationalTeamEntryDto)
  nationalTeam?: CreateNationalTeamEntryDto[];

  @ApiPropertyOptional({ type: [CreateNewsEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNewsEntryDto)
  news?: CreateNewsEntryDto[];

  @ApiPropertyOptional({ type: [CreateRumourEntryDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRumourEntryDto)
  rumours?: CreateRumourEntryDto[];
}

export class BulkUpsertPlayerProfileDto {
  @ApiProperty({ type: [BulkUpsertPlayerProfileItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpsertPlayerProfileItemDto)
  players: BulkUpsertPlayerProfileItemDto[];
}
