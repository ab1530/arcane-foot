import {
  Controller,
  Post,
  Get,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { VoiceToReportService } from './voice-to-report.service';
import {
  ProcessVoiceReportDto,
  SupportedLanguage,
} from './dto/process-voice-report.dto';
import {
  VoiceReportResponseDto,
  LanguageInfo,
  VoiceReportExample,
} from './dto/voice-report-response.dto';

@Controller('voice-to-report')
@ApiTags('Voice to Report')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceToReportController {
  constructor(private readonly voiceToReportService: VoiceToReportService) {}

  @Post('process')
  @UseInterceptors(
    FileInterceptor('audio', {
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('audio/')) {
          return callback(
            new BadRequestException('Only audio files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Process voice recording into scouting report',
    description:
      'Upload an audio file (mp3, wav, webm, m4a, ogg) containing a spoken scouting report. The system will transcribe the audio using OpenAI Whisper and extract structured scouting report data using AI.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        audio: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (max 25MB)',
        },
        language: {
          type: 'string',
          enum: ['en', 'es', 'fr', 'de', 'it', 'pt'],
          description: 'Language of the audio recording',
          default: 'en',
        },
        matchId: {
          type: 'string',
          description: 'Match ID if report is for a specific match',
        },
        playerId: {
          type: 'string',
          description: 'Player ID if report is for a specific player',
        },
        keepAudio: {
          type: 'boolean',
          description: 'Keep audio file in permanent storage',
          default: false,
        },
      },
      required: ['audio'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Voice report processed successfully',
    type: VoiceReportResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid audio file or format',
  })
  @ApiResponse({
    status: 413,
    description: 'File too large (max 25MB)',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests (rate limit: 10 per minute)',
  })
  async processVoiceReport(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Body('language') language?: SupportedLanguage,
    @Body('matchId') matchId?: string,
    @Body('playerId') playerId?: string,
    @Body('keepAudio') keepAudio?: boolean,
  ): Promise<VoiceReportResponseDto> {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    const dto: ProcessVoiceReportDto = {
      language: language || SupportedLanguage.EN,
      matchId,
      playerId,
      keepAudio: keepAudio === true || (keepAudio as any) === 'true',
    };

    return this.voiceToReportService.processVoiceReport(
      file,
      req.user.userId,
      dto,
    );
  }

  @Get('languages')
  @ApiOperation({
    summary: 'Get supported languages',
    description:
      'Returns a list of all supported languages for voice transcription and their Whisper API support status.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of supported languages',
    type: [LanguageInfo],
  })
  getSupportedLanguages(): LanguageInfo[] {
    return this.voiceToReportService.getSupportedLanguages();
  }

  @Get('examples')
  @ApiOperation({
    summary: 'Get example voice report templates',
    description:
      'Returns example voice report prompts in different languages with tips for creating effective voice reports.',
  })
  @ApiResponse({
    status: 200,
    description: 'Example voice report templates',
    type: [VoiceReportExample],
  })
  getExamples(): VoiceReportExample[] {
    return this.voiceToReportService.getExamples();
  }

  @Post('test-transcription')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({
    summary: 'Test data extraction from text',
    description:
      'Test the NLU extraction without uploading audio. Useful for development and testing.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Sample transcription text',
          example:
            'This is a scouting report for John Doe, center back, number 5...',
        },
        language: {
          type: 'string',
          enum: ['en', 'es', 'fr', 'de', 'it', 'pt'],
          default: 'en',
        },
      },
      required: ['text'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Extraction test completed',
  })
  async testTranscription(
    @Body('text') text: string,
    @Body('language') language?: string,
  ) {
    if (!text) {
      throw new BadRequestException('Text is required');
    }

    // Use the service's private method through a test-only public method
    // For production, you might want to remove this endpoint or protect it better
    const extractedData = await (this.voiceToReportService as any).extractReportData(
      text,
      language || 'en',
    );

    const { data: validatedData, warnings } = await (
      this.voiceToReportService as any
    ).validateData(extractedData);

    const confidence = (this.voiceToReportService as any).calculateConfidence(
      validatedData,
      text,
    );

    const suggestions = (this.voiceToReportService as any).generateSuggestions(
      validatedData,
      warnings,
    );

    return {
      transcription: text,
      extractedData: validatedData,
      confidence,
      suggestions,
      warnings,
      language: language || 'en',
    };
  }
}
