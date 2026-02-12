import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { VoiceToReportService } from './voice-to-report.service';
import { SupabaseService } from '../supabase/supabase.service';
import { ProcessVoiceReportDto, SupportedLanguage } from './dto/process-voice-report.dto';
import { RecommendationType } from '@prisma/client';
import * as fs from 'fs';

// Mock OpenAI
const mockOpenAI = {
  audio: {
    transcriptions: {
      create: jest.fn(),
    },
  },
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => mockOpenAI);
});

jest.mock('fs', () => ({
  createReadStream: jest.fn(),
  existsSync: jest.fn().mockReturnValue(true),
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
}));

describe('VoiceToReportService', () => {
  let service: VoiceToReportService;
  let configService: jest.Mocked<ConfigService>;
  let supabaseService: jest.Mocked<SupabaseService>;

  const mockAudioFile: Express.Multer.File = {
    fieldname: 'audio',
    originalname: 'test-audio.mp3',
    encoding: '7bit',
    mimetype: 'audio/mpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('mock audio data'),
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock ConfigService
    configService = {
      get: jest.fn((key: string) => {
        const config = {
          OPENAI_API_KEY: 'sk-test-key',
          MAX_AUDIO_SIZE_MB: 25,
          OPENAI_MODEL: 'gpt-4o-mini',
        };
        return config[key];
      }),
    } as any;

    // Mock SupabaseService
    supabaseService = {
      uploadFile: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoiceToReportService,
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: SupabaseService,
          useValue: supabaseService,
        },
      ],
    }).compile();

    service = module.get<VoiceToReportService>(VoiceToReportService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with OpenAI when valid API key is provided', () => {
      expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY');
      expect(service['hasOpenAI']).toBe(true);
    });

    it('should initialize without OpenAI when API key is missing', async () => {
      const mockConfigWithoutKey = {
        get: jest.fn((key: string) => {
          if (key === 'OPENAI_API_KEY') return undefined;
          if (key === 'MAX_AUDIO_SIZE_MB') return 25;
          return undefined;
        }),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VoiceToReportService,
          {
            provide: ConfigService,
            useValue: mockConfigWithoutKey,
          },
          {
            provide: SupabaseService,
            useValue: supabaseService,
          },
        ],
      }).compile();

      const serviceWithoutOpenAI = module.get<VoiceToReportService>(VoiceToReportService);
      expect(serviceWithoutOpenAI['hasOpenAI']).toBe(false);
    });

    it('should set maxFileSizeMB from config or default to 25', () => {
      expect(service['maxFileSizeMB']).toBe(25);
    });
  });

  describe('processVoiceReport', () => {
    const userId = 'user-123';
    const dto: ProcessVoiceReportDto = {
      language: SupportedLanguage.EN,
      keepAudio: false,
    };

    const mockTranscription = 'This is a test transcription';
    const mockExtractedData = {
      playerName: 'John Doe',
      position: 'Forward',
      technicalRating: 85,
    };

    beforeEach(() => {
      // Mock transcription
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockTranscription);
      // Mock extraction
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockExtractedData),
            },
          },
        ],
      });
      // Mock file operations
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue({});
    });

    it('should successfully process voice report', async () => {
      const result = await service.processVoiceReport(mockAudioFile, userId, dto);

      expect(result).toBeDefined();
      expect(result.transcription).toBe(mockTranscription);
      expect(result.extractedData).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.language).toBe(SupportedLanguage.EN);
      expect(result.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should validate audio file before processing', async () => {
      await expect(service.processVoiceReport(null as any, userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should return fallback response with client-side flag when OpenAI is disabled', async () => {
      const mockConfigWithoutKey = {
        get: jest.fn((key: string) => {
          if (key === 'OPENAI_API_KEY') return undefined;
          if (key === 'MAX_AUDIO_SIZE_MB') return 25;
          if (key === 'OPENAI_MODEL') return 'gpt-4o-mini';
          return undefined;
        }),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VoiceToReportService,
          {
            provide: ConfigService,
            useValue: mockConfigWithoutKey,
          },
          {
            provide: SupabaseService,
            useValue: supabaseService,
          },
        ],
      }).compile();

      const fallbackService = module.get<VoiceToReportService>(VoiceToReportService);

      const result = await fallbackService.processVoiceReport(mockAudioFile, userId, dto);

      expect(result.useClientSide).toBe(true);
      expect(result.warnings).toContain(
        'Voice-to-Report running in fallback mode (OPENAI_API_KEY missing).',
      );
      expect(result.transcription).toContain('Server-side transcription unavailable');
    });

    it('should include audio URL when keepAudio is true', async () => {
      const audioUrl = 'https://example.com/audio.mp3';
      supabaseService.uploadFile.mockResolvedValue(audioUrl);

      const result = await service.processVoiceReport(mockAudioFile, userId, {
        ...dto,
        keepAudio: true,
      });

      expect(result.audioUrl).toBe(audioUrl);
      expect(supabaseService.uploadFile).toHaveBeenCalled();
    });

    it('should not save audio when keepAudio is false', async () => {
      await service.processVoiceReport(mockAudioFile, userId, dto);

      expect(supabaseService.uploadFile).not.toHaveBeenCalled();
    });

    it('should use provided matchId and playerId', async () => {
      const dtoWithIds: ProcessVoiceReportDto = {
        ...dto,
        matchId: 'match-123',
        playerId: 'player-456',
      };

      const result = await service.processVoiceReport(mockAudioFile, userId, dtoWithIds);

      expect(result.extractedData['matchId']).toBe('match-123');
      expect(result.extractedData['playerId']).toBe('player-456');
    });

    it('should handle transcription failure', async () => {
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(new Error('Transcription failed'));

      await expect(service.processVoiceReport(mockAudioFile, userId, dto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should provide warnings and suggestions', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ playerName: 'John Doe' }), // Minimal data
            },
          },
        ],
      });

      const result = await service.processVoiceReport(mockAudioFile, userId, dto);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should calculate confidence score', async () => {
      const result = await service.processVoiceReport(mockAudioFile, userId, dto);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should default language to EN when not provided', async () => {
      const dtoWithoutLanguage = { ...dto };
      delete dtoWithoutLanguage.language;

      const result = await service.processVoiceReport(mockAudioFile, userId, dtoWithoutLanguage);

      expect(result.language).toBe(SupportedLanguage.EN);
    });
  });

  describe('validateAudioFile', () => {
    it('should accept valid audio file', () => {
      expect(() => service['validateAudioFile'](mockAudioFile)).not.toThrow();
    });

    it('should throw BadRequestException when file is null', () => {
      expect(() => service['validateAudioFile'](null)).toThrow(BadRequestException);
      expect(() => service['validateAudioFile'](null)).toThrow('No audio file provided');
    });

    it('should throw BadRequestException for oversized files', () => {
      const largeFile = {
        ...mockAudioFile,
        size: 30 * 1024 * 1024, // 30MB
      };

      expect(() => service['validateAudioFile'](largeFile)).toThrow(BadRequestException);
      expect(() => service['validateAudioFile'](largeFile)).toThrow('File size exceeds maximum');
    });

    it('should throw BadRequestException for unsupported MIME types', () => {
      const invalidFile = {
        ...mockAudioFile,
        mimetype: 'video/mp4',
      };

      expect(() => service['validateAudioFile'](invalidFile)).toThrow(BadRequestException);
      expect(() => service['validateAudioFile'](invalidFile)).toThrow('Unsupported audio format');
    });

    it('should accept all supported audio formats', () => {
      const supportedMimetypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/mp4',
        'audio/webm',
        'audio/ogg',
      ];

      supportedMimetypes.forEach((mimetype) => {
        const file = { ...mockAudioFile, mimetype };
        expect(() => service['validateAudioFile'](file)).not.toThrow();
      });
    });
  });

  describe('transcribeAudio', () => {
    it('should transcribe audio using Whisper when OpenAI is available', async () => {
      const mockTranscription = 'Test transcription';
      mockOpenAI.audio.transcriptions.create.mockResolvedValue(mockTranscription);
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue({});

      const result = await service['transcribeAudio'](mockAudioFile, SupportedLanguage.EN);

      expect(result).toBe(mockTranscription);
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalled();
    });

    it('should return placeholder transcription when OpenAI is not available', async () => {
      // Create service without OpenAI
      const mockConfigWithoutKey = {
        get: jest.fn((key: string) => {
          if (key === 'OPENAI_API_KEY') return undefined;
          if (key === 'MAX_AUDIO_SIZE_MB') return 25;
          return undefined;
        }),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VoiceToReportService,
          {
            provide: ConfigService,
            useValue: mockConfigWithoutKey,
          },
          {
            provide: SupabaseService,
            useValue: supabaseService,
          },
        ],
      }).compile();

      const serviceWithoutOpenAI = module.get<VoiceToReportService>(VoiceToReportService);

      const transcription = await serviceWithoutOpenAI['transcribeAudio'](
        mockAudioFile,
        SupportedLanguage.EN,
      );

      expect(transcription).toBe('Transcription unavailable');
    });

    it('should pass language to Whisper API for non-English', async () => {
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue({});
      mockOpenAI.audio.transcriptions.create.mockResolvedValue('Transcription');

      await service['transcribeAudio'](mockAudioFile, SupportedLanguage.ES);

      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          language: SupportedLanguage.ES,
        }),
      );
    });

    it('should cleanup temporary file after transcription', async () => {
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue({});
      mockOpenAI.audio.transcriptions.create.mockResolvedValue('Transcription');

      await service['transcribeAudio'](mockAudioFile, SupportedLanguage.EN);

      expect(fs.promises.unlink).toHaveBeenCalled();
    });

    it('should cleanup temporary file even on transcription failure', async () => {
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
      (fs.createReadStream as jest.Mock).mockReturnValue({});
      mockOpenAI.audio.transcriptions.create.mockRejectedValue(new Error('Transcription failed'));

      await expect(service['transcribeAudio'](mockAudioFile, SupportedLanguage.EN)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(fs.promises.unlink).toHaveBeenCalled();
    });
  });

  describe('extractReportData', () => {
    const mockTranscription =
      'This is a scouting report for John Doe, forward, number 9. Technical rating 8 out of 10.';

    it('should extract data using AI when OpenAI is available', async () => {
      const mockData = { playerName: 'John Doe', position: 'Forward' };
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockData) } }],
      });

      const result = await service['extractReportData'](mockTranscription, SupportedLanguage.EN);

      expect(result).toBeDefined();
      expect(mockOpenAI.chat.completions.create).toHaveBeenCalled();
    });

    it('should use rule-based extraction when OpenAI is not configured', async () => {
      // Create service without OpenAI
      const mockConfigWithoutKey = {
        get: jest.fn((key: string) => {
          if (key === 'OPENAI_API_KEY') return undefined;
          if (key === 'MAX_AUDIO_SIZE_MB') return 25;
          return undefined;
        }),
      } as any;

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          VoiceToReportService,
          {
            provide: ConfigService,
            useValue: mockConfigWithoutKey,
          },
          {
            provide: SupabaseService,
            useValue: supabaseService,
          },
        ],
      }).compile();

      const serviceWithoutOpenAI = module.get<VoiceToReportService>(VoiceToReportService);

      const result = await serviceWithoutOpenAI['extractReportData'](
        mockTranscription,
        SupportedLanguage.EN,
      );

      expect(result).toBeDefined();
      expect(result.playerName).toContain('John Doe');
      expect(result.position).toBe('Forward');
    });

    it('should fallback to rule-based extraction on AI failure', async () => {
      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('AI failed'));

      const result = await service['extractReportData'](mockTranscription, SupportedLanguage.EN);

      expect(result).toBeDefined();
      // Rule-based extraction should still find some data
    });

    it('should use configured OpenAI model', async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify({}) } }],
      });

      await service['extractReportData'](mockTranscription, SupportedLanguage.EN);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
        }),
      );
    });
  });

  describe('extractWithRules', () => {
    it('should extract player name from transcription', () => {
      const transcription = 'This is a scouting report for John Smith.';
      const result = service['extractWithRules'](transcription);

      expect(result.playerName).toContain('John Smith');
    });

    it('should extract position from transcription', () => {
      const transcription = 'The player is a midfielder with good vision.';
      const result = service['extractWithRules'](transcription);

      expect(result.position).toBe('Midfielder');
    });

    it('should extract jersey number', () => {
      const transcription = 'Player number 10 showed great skills.';
      const result = service['extractWithRules'](transcription);

      expect(result.jerseyNumber).toBe(10);
    });

    it('should extract team names', () => {
      const transcription = 'Playing for Real Madrid against Barcelona in the match.';
      const result = service['extractWithRules'](transcription);

      expect(result.team).toBeDefined();
      expect(result.opponent).toBeDefined();
    });

    it('should convert 1-10 ratings to 0-100 scale', () => {
      const transcription = 'Technical rating: 8/10. Physical rating: 9/10.';
      const result = service['extractWithRules'](transcription);

      expect(result.technicalRating).toBe(80);
      expect(result.physicalRating).toBe(90);
    });

    it('should extract ratings already on 0-100 scale', () => {
      const transcription = 'Technical rating: 85. Physical rating: 90.';
      const result = service['extractWithRules'](transcription);

      expect(result.technicalRating).toBe(85);
      expect(result.physicalRating).toBe(90);
    });

    it('should extract strengths and weaknesses', () => {
      const transcription = 'Strengths: excellent passing. Weaknesses: slow pace.';
      const result = service['extractWithRules'](transcription);

      expect(result.strengths).toContain('excellent passing');
      expect(result.weaknesses).toContain('slow pace');
    });

    it('should extract recommendation', () => {
      const transcriptions = [
        { text: 'Recommend to sign this player', expected: 'BUY_NOW' },
        { text: 'Recommend to monitor', expected: 'MONITOR' },
        { text: 'Recommend to pass', expected: 'NOT_INTERESTED' },
        { text: 'Recommend to follow up', expected: 'FOLLOW_UP' },
      ];

      transcriptions.forEach(({ text, expected }) => {
        const result = service['extractWithRules'](text);
        expect(result.recommendation).toBe(expected);
      });
    });

    it('should extract minutes played', () => {
      const transcription = 'The player played 90 minutes.';
      const result = service['extractWithRules'](transcription);

      expect(result.minutesPlayed).toBe(90);
    });

    it('should extract tags from keywords', () => {
      const transcription = 'Fast and technical player with strong leadership.';
      const result = service['extractWithRules'](transcription);

      expect(result.tags).toBeDefined();
      expect(result.tags.length).toBeGreaterThan(0);
      expect(result.tags).toContain('fast');
      expect(result.tags).toContain('technical');
      expect(result.tags).toContain('strong');
    });

    it('should handle empty transcription', () => {
      const result = service['extractWithRules']('');

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('normalizeExtractedData', () => {
    it('should normalize string fields correctly', () => {
      const data = {
        playerName: 'John Doe',
        position: 'Forward',
        team: 'Real Madrid',
      };

      const result = service['normalizeExtractedData'](data);

      expect(result.playerName).toBe('John Doe');
      expect(result.position).toBe('Forward');
      expect(result.team).toBe('Real Madrid');
    });

    it('should normalize numeric fields', () => {
      const data = {
        jerseyNumber: '10',
        technicalRating: '85',
        minutesPlayed: '90',
      };

      const result = service['normalizeExtractedData'](data);

      expect(result.jerseyNumber).toBe(10);
      expect(result.technicalRating).toBe(85);
      expect(result.minutesPlayed).toBe(90);
    });

    it('should clamp ratings to 0-100 range', () => {
      const data = {
        technicalRating: 150,
        physicalRating: -10,
      };

      const result = service['normalizeExtractedData'](data);

      expect(result.technicalRating).toBe(100);
      expect(result.physicalRating).toBe(0);
    });

    it('should normalize valid recommendations', () => {
      const validRecommendations = [
        'BUY_NOW',
        'MONITOR',
        'FOLLOW_UP',
        'NOT_INTERESTED',
        'NEEDS_MORE_DATA',
      ];

      validRecommendations.forEach((rec) => {
        const data = { recommendation: rec };
        const result = service['normalizeExtractedData'](data);
        expect(result.recommendation).toBe(rec);
      });
    });

    it('should filter tags to strings only', () => {
      const data = {
        tags: ['fast', 123, 'technical', null, 'strong'],
      };

      const result = service['normalizeExtractedData'](data);

      expect(result.tags).toEqual(['fast', 'technical', 'strong']);
    });

    it('should ignore invalid data types', () => {
      const data = {
        playerName: 123,
        jerseyNumber: 'not-a-number',
        technicalRating: null,
      };

      const result = service['normalizeExtractedData'](data);

      expect(result.playerName).toBeUndefined();
      expect(result.jerseyNumber).toBeUndefined();
      expect(result.technicalRating).toBeUndefined();
    });
  });

  describe('validateData', () => {
    it('should add matchId and playerId when provided', async () => {
      const data = { playerName: 'John Doe' };
      const result = await service['validateData'](data, 'match-123', 'player-456');

      expect(result.data['matchId']).toBe('match-123');
      expect(result.data['playerId']).toBe('player-456');
    });

    it('should warn when player name is missing and no playerId', async () => {
      const data = { position: 'Forward' };
      const result = await service['validateData'](data);

      expect(result.warnings).toContain('Player name not identified - please specify manually');
    });

    it('should not warn about missing player name when playerId is provided', async () => {
      const data = { position: 'Forward' };
      const result = await service['validateData'](data, undefined, 'player-123');

      const playerWarning = result.warnings.find((w) => w.includes('Player name'));
      expect(playerWarning).toBeUndefined();
    });

    it('should warn when no ratings are detected', async () => {
      const data = { playerName: 'John Doe', position: 'Forward' };
      const result = await service['validateData'](data);

      expect(result.warnings).toContain('No performance ratings detected - consider adding them');
    });

    it('should calculate overall rating from other ratings', async () => {
      const data = {
        technicalRating: 80,
        physicalRating: 90,
        tacticalRating: 70,
        mentalRating: 85,
      };

      const result = await service['validateData'](data);

      expect(result.data.overallRating).toBeDefined();
      expect(result.data.overallRating).toBe(81); // Average of 80,90,70,85
    });

    it('should not override existing overall rating', async () => {
      const data = {
        technicalRating: 80,
        physicalRating: 90,
        overallRating: 95,
      };

      const result = await service['validateData'](data);

      expect(result.data.overallRating).toBe(95);
    });

    it('should warn about incorrect date format', async () => {
      const data = { matchDate: '15/02/2024' };
      const result = await service['validateData'](data);

      expect(result.warnings).toContain('Match date format may be incorrect - expected YYYY-MM-DD');
    });

    it('should not warn for correct date format', async () => {
      const data = { matchDate: '2024-02-15' };
      const result = await service['validateData'](data);

      const dateWarning = result.warnings.find((w) => w.includes('date format'));
      expect(dateWarning).toBeUndefined();
    });
  });

  describe('calculateConfidence', () => {
    it('should return high confidence for complete data', () => {
      const data = {
        playerName: 'John Doe',
        team: 'Real Madrid',
        opponent: 'Barcelona',
        matchDate: '2024-02-15',
        technicalRating: 85,
        physicalRating: 90,
        tacticalRating: 80,
        mentalRating: 88,
        strengths: 'Great skills',
        weaknesses: 'Needs improvement',
        keyMoments: 'Scored a goal',
        recommendation: RecommendationType.BUY_NOW,
      };

      const transcription =
        'A very detailed transcription with lots of information about the player and their performance in the match.';
      const confidence = service['calculateConfidence'](data, transcription);

      expect(confidence).toBeGreaterThanOrEqual(80);
      expect(confidence).toBeLessThanOrEqual(100);
    });

    it('should return low confidence for minimal data', () => {
      const data = { playerName: 'John Doe' };
      const transcription = 'Short text';
      const confidence = service['calculateConfidence'](data, transcription);

      expect(confidence).toBeLessThan(50);
    });

    it('should give points for player identification', () => {
      const withName = { playerName: 'John Doe' } as any;
      const withId = { playerId: 'player-123' } as any;
      const neither = {} as any;

      const transcription = 'Test transcription';

      const scoreWithName = service['calculateConfidence'](withName, transcription);
      const scoreWithId = service['calculateConfidence'](withId, transcription);
      const scoreNeither = service['calculateConfidence'](neither, transcription);

      expect(scoreWithName).toBeGreaterThan(scoreWithId);
      expect(scoreWithId).toBeGreaterThan(scoreNeither);
    });

    it('should adjust score based on transcription length', () => {
      const data = { playerName: 'John Doe' };
      const shortTranscription = 'Short';
      const longTranscription =
        'This is a very long and detailed transcription that contains a lot of information about the player and their performance. '.repeat(
          5,
        );

      const shortScore = service['calculateConfidence'](data, shortTranscription);
      const longScore = service['calculateConfidence'](data, longTranscription);

      expect(longScore).toBeGreaterThan(shortScore);
    });

    it('should never exceed 100', () => {
      const perfectData = {
        playerName: 'John Doe',
        playerId: 'player-123',
        team: 'Team A',
        opponent: 'Team B',
        matchDate: '2024-02-15',
        technicalRating: 100,
        physicalRating: 100,
        tacticalRating: 100,
        mentalRating: 100,
        strengths: 'All skills perfect',
        weaknesses: 'None',
        keyMoments: 'Everything',
        recommendation: RecommendationType.BUY_NOW,
      };

      const veryLongTranscription = 'word '.repeat(1000);
      const confidence = service['calculateConfidence'](perfectData, veryLongTranscription);

      expect(confidence).toBeLessThanOrEqual(100);
    });
  });

  describe('generateSuggestions', () => {
    it('should suggest adding missing player name', () => {
      const data = { position: 'Forward' };
      const suggestions = service['generateSuggestions'](data, []);

      expect(suggestions).toContain("Include the player's full name at the beginning");
    });

    it('should suggest adding missing position', () => {
      const data = { playerName: 'John Doe' };
      const suggestions = service['generateSuggestions'](data, []);

      expect(suggestions).toContain("Mention the player's position");
    });

    it('should suggest adding missing ratings', () => {
      const data = { playerName: 'John Doe', technicalRating: 80 };
      const suggestions = service['generateSuggestions'](data, []);

      expect(suggestions.some((s) => s.includes('Add ratings for:'))).toBe(true);
    });

    it('should suggest adding strengths', () => {
      const data = { playerName: 'John Doe' };
      const suggestions = service['generateSuggestions'](data, []);

      expect(suggestions).toContain("Describe the player's key strengths");
    });

    it('should suggest adding weaknesses', () => {
      const data = { playerName: 'John Doe' };
      const suggestions = service['generateSuggestions'](data, []);

      expect(suggestions).toContain('Mention areas for improvement');
    });

    it('should suggest adding recommendation', () => {
      const data = { playerName: 'John Doe' };
      const suggestions = service['generateSuggestions'](data, []);

      expect(suggestions).toContain('Include a clear recommendation (Sign, Monitor, or Pass)');
    });

    it('should suggest adding key moments', () => {
      const data = { playerName: 'John Doe' };
      const suggestions = service['generateSuggestions'](data, []);

      expect(suggestions).toContain('Add specific examples or key moments from the match');
    });

    it('should return empty array for complete data', () => {
      const completeData = {
        playerName: 'John Doe',
        position: 'Forward',
        technicalRating: 80,
        physicalRating: 90,
        tacticalRating: 85,
        mentalRating: 88,
        strengths: 'Great skills',
        weaknesses: 'Needs work',
        keyMoments: 'Scored a goal',
        recommendation: RecommendationType.BUY_NOW,
      };

      const suggestions = service['generateSuggestions'](completeData, []);

      expect(suggestions).toHaveLength(0);
    });
  });

  describe('saveAudioTemporarily', () => {
    it('should save audio file to /tmp directory', async () => {
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const filepath = await service['saveAudioTemporarily'](mockAudioFile);

      expect(filepath).toContain('/tmp');
      expect(filepath).toContain(mockAudioFile.originalname);
      expect(fs.promises.writeFile).toHaveBeenCalledWith(filepath, mockAudioFile.buffer);
    });

    it('should include timestamp in filename', async () => {
      (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

      const beforeTime = Date.now();
      const filepath = await service['saveAudioTemporarily'](mockAudioFile);
      const afterTime = Date.now();

      const timestamp = filepath.split('/').pop().split('-')[0];
      const timestampNum = parseInt(timestamp);

      expect(timestampNum).toBeGreaterThanOrEqual(beforeTime);
      expect(timestampNum).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('saveAudioPermanently', () => {
    const userId = 'user-123';

    it('should upload file to Supabase storage', async () => {
      const audioUrl = 'https://storage.example.com/audio.mp3';
      supabaseService.uploadFile.mockResolvedValue(audioUrl);

      const result = await service['saveAudioPermanently'](mockAudioFile, userId);

      expect(result).toBe(audioUrl);
      expect(supabaseService.uploadFile).toHaveBeenCalledWith(
        mockAudioFile.buffer,
        expect.stringContaining(userId),
        'voice-reports',
      );
    });

    it('should include userId in filename', async () => {
      const audioUrl = 'https://storage.example.com/audio.mp3';
      supabaseService.uploadFile.mockResolvedValue(audioUrl);

      await service['saveAudioPermanently'](mockAudioFile, userId);

      const uploadCall = (supabaseService.uploadFile as jest.Mock).mock.calls[0];
      const filename = uploadCall[1];
      expect(filename).toContain(userId);
    });

    it('should return undefined on upload failure', async () => {
      supabaseService.uploadFile.mockRejectedValue(new Error('Upload failed'));

      const result = await service['saveAudioPermanently'](mockAudioFile, userId);

      expect(result).toBeUndefined();
    });
  });

  describe('cleanupAudioFile', () => {
    it('should delete file at given path', async () => {
      (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);

      await service['cleanupAudioFile']('/tmp/test-file.mp3');

      expect(fs.promises.unlink).toHaveBeenCalledWith('/tmp/test-file.mp3');
    });

    it('should not throw error on cleanup failure', async () => {
      (fs.promises.unlink as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(service['cleanupAudioFile']('/tmp/test-file.mp3')).resolves.not.toThrow();
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = service.getSupportedLanguages();

      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
    });

    it('should include language codes and names', () => {
      const languages = service.getSupportedLanguages();

      languages.forEach((lang) => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('whisperSupported');
      });
    });

    it('should include common languages', () => {
      const languages = service.getSupportedLanguages();
      const codes = languages.map((l) => l.code);

      expect(codes).toContain('en');
      expect(codes).toContain('es');
      expect(codes).toContain('fr');
      expect(codes).toContain('de');
    });
  });

  describe('getExamples', () => {
    it('should return list of examples', () => {
      const examples = service.getExamples();

      expect(Array.isArray(examples)).toBe(true);
      expect(examples.length).toBeGreaterThan(0);
    });

    it('should include examples in different languages', () => {
      const examples = service.getExamples();
      const languages = examples.map((e) => e.language);

      expect(languages).toContain('en');
      expect(languages.length).toBeGreaterThan(1);
    });

    it('should include prompt and tips for each example', () => {
      const examples = service.getExamples();

      examples.forEach((example) => {
        expect(example).toHaveProperty('language');
        expect(example).toHaveProperty('prompt');
        expect(example).toHaveProperty('tips');
        expect(Array.isArray(example.tips)).toBe(true);
        expect(example.tips.length).toBeGreaterThan(0);
      });
    });
  });
});
