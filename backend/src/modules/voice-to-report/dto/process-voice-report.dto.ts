import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum SupportedLanguage {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
}

export class ProcessVoiceReportDto {
  @ApiPropertyOptional({
    description: 'Language of the audio recording',
    enum: SupportedLanguage,
    default: SupportedLanguage.EN,
    example: 'en',
  })
  @IsOptional()
  @IsEnum(SupportedLanguage)
  language?: SupportedLanguage;

  @ApiPropertyOptional({
    description: 'Match ID if report is for a specific match',
    example: 'clm123abc456',
  })
  @IsOptional()
  @IsString()
  matchId?: string;

  @ApiPropertyOptional({
    description: 'Player ID if report is for a specific player',
    example: 'clm789def012',
  })
  @IsOptional()
  @IsString()
  playerId?: string;

  @ApiPropertyOptional({
    description: 'Keep audio file in permanent storage',
    example: false,
  })
  @IsOptional()
  keepAudio?: boolean;
}
