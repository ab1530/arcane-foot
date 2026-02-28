import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateScoutingReportDto } from './create-scouting-report.dto';

class VoicePayloadDto {
  @ApiPropertyOptional({ description: 'Voice transcription text' })
  @IsString()
  @IsOptional()
  transcription?: string;

  @ApiPropertyOptional({ description: 'Extraction confidence score (0-100)' })
  @IsNumber()
  @IsOptional()
  confidence?: number;

  @ApiPropertyOptional({ description: 'Audio URL (if persisted)' })
  @IsString()
  @IsOptional()
  audioUrl?: string;

  @ApiPropertyOptional({ type: [String], description: 'Voice extraction warnings' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  warnings?: string[];
}

export class BulkSubmitScoutingReportsDto {
  @ApiProperty({ description: 'Match ID' })
  @IsString()
  @IsNotEmpty()
  matchId: string;

  @ApiProperty({ type: [String], description: 'Observed player IDs to submit' })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  playerIds: string[];

  @ApiPropertyOptional({ description: 'Optional mission assignment ID' })
  @IsString()
  @IsOptional()
  assignmentId?: string;

  @ApiPropertyOptional({
    description: 'Template fields applied to all generated reports',
    type: CreateScoutingReportDto,
  })
  @IsObject()
  @IsOptional()
  template?: Partial<CreateScoutingReportDto>;

  @ApiPropertyOptional({
    description: 'Voice payload metadata attached to report analysis',
    type: VoicePayloadDto,
  })
  @ValidateNested()
  @Type(() => VoicePayloadDto)
  @IsOptional()
  voice?: VoicePayloadDto;
}
