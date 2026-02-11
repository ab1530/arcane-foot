import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RecommendationType } from '@prisma/client';

export class ExtractedReportData {
  @ApiPropertyOptional({ description: 'Player name', example: 'Cristiano Ronaldo' })
  playerName?: string;

  @ApiPropertyOptional({ description: 'Player position', example: 'Forward' })
  position?: string;

  @ApiPropertyOptional({ description: 'Jersey number', example: 7 })
  jerseyNumber?: number;

  @ApiPropertyOptional({ description: 'Player team', example: 'Real Madrid' })
  team?: string;

  @ApiPropertyOptional({ description: 'Opponent team', example: 'Barcelona' })
  opponent?: string;

  @ApiPropertyOptional({ description: 'Competition name', example: 'La Liga' })
  competition?: string;

  @ApiPropertyOptional({ description: 'Match date', example: '2024-02-15' })
  matchDate?: string;

  @ApiPropertyOptional({ description: 'Match venue', example: 'Santiago Bernabéu' })
  venue?: string;

  @ApiPropertyOptional({ description: 'Technical rating (0-100)', example: 85 })
  technicalRating?: number;

  @ApiPropertyOptional({ description: 'Physical rating (0-100)', example: 90 })
  physicalRating?: number;

  @ApiPropertyOptional({ description: 'Tactical rating (0-100)', example: 75 })
  tacticalRating?: number;

  @ApiPropertyOptional({ description: 'Mental rating (0-100)', example: 88 })
  mentalRating?: number;

  @ApiPropertyOptional({ description: 'Overall rating (0-100)', example: 84 })
  overallRating?: number;

  @ApiPropertyOptional({
    description: 'Player strengths',
    example: 'Excellent positioning, strong in the air',
  })
  strengths?: string;

  @ApiPropertyOptional({ description: 'Player weaknesses', example: 'Can be slow to turn' })
  weaknesses?: string;

  @ApiPropertyOptional({
    description: 'Key moments during match',
    example: 'Crucial block in 67th minute',
  })
  keyMoments?: string;

  @ApiPropertyOptional({
    description: 'General observations',
    example: 'Top-quality defender with Champions League potential',
  })
  observations?: string;

  @ApiPropertyOptional({ description: 'Minutes played', example: 90 })
  minutesPlayed?: number;

  @ApiPropertyOptional({
    description: 'Scout recommendation',
    enum: RecommendationType,
    example: RecommendationType.BUY_NOW,
  })
  recommendation?: RecommendationType;

  @ApiPropertyOptional({
    description: 'Tags extracted from report',
    example: ['fast', 'technical', 'leader'],
  })
  tags?: string[];
}

export class VoiceReportResponseDto {
  @ApiProperty({
    description: 'Transcribed text from audio',
    example: 'This is a scouting report for...',
  })
  transcription: string;

  @ApiProperty({ description: 'Extracted scouting report data', type: ExtractedReportData })
  extractedData: ExtractedReportData;

  @ApiProperty({ description: 'Confidence score of extraction (0-100)', example: 92 })
  confidence: number;

  @ApiProperty({
    description: 'Suggestions for improving the report',
    example: ['Add more details about tactical awareness'],
  })
  suggestions: string[];

  @ApiPropertyOptional({
    description: 'Audio URL if saved',
    example: 'https://storage.example.com/audio/report-123.mp3',
  })
  audioUrl?: string;

  @ApiPropertyOptional({
    description: 'Whether client-side transcription is needed',
    example: false,
  })
  useClientSide?: boolean;

  @ApiPropertyOptional({
    description: 'Warnings about missing or invalid data',
    example: ['No match date specified'],
  })
  warnings?: string[];

  @ApiProperty({ description: 'Language detected or used', example: 'en' })
  language: string;

  @ApiProperty({ description: 'Processing duration in milliseconds', example: 2500 })
  processingTimeMs: number;
}

export class LanguageInfo {
  @ApiProperty({ description: 'Language code', example: 'en' })
  code: string;

  @ApiProperty({ description: 'Language name', example: 'English' })
  name: string;

  @ApiProperty({ description: 'Whether Whisper supports this language', example: true })
  whisperSupported: boolean;
}

export class VoiceReportExample {
  @ApiProperty({ description: 'Language code', example: 'en' })
  language: string;

  @ApiProperty({ description: 'Example prompt', example: 'This is a scouting report for...' })
  prompt: string;

  @ApiProperty({ description: 'Tips for better voice reports', type: [String] })
  tips: string[];
}
