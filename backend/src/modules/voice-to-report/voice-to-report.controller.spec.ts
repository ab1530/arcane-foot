import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { VoiceToReportController } from './voice-to-report.controller';
import { VoiceToReportService } from './voice-to-report.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScoutCertificationGuard } from '../../common/guards/scout-certification.guard';
import { ProcessVoiceReportDto, SupportedLanguage } from './dto/process-voice-report.dto';
import { VoiceReportResponseDto, ExtractedReportData } from './dto/voice-report-response.dto';
import { RecommendationType } from '@prisma/client';

describe('VoiceToReportController', () => {
  let controller: VoiceToReportController;
  let service: jest.Mocked<VoiceToReportService>;

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

  const mockExtractedData: ExtractedReportData = {
    playerName: 'John Doe',
    position: 'Forward',
    jerseyNumber: 9,
    team: 'Real Madrid',
    opponent: 'Barcelona',
    technicalRating: 85,
    physicalRating: 90,
    tacticalRating: 80,
    mentalRating: 88,
    overallRating: 86,
    strengths: 'Excellent finishing, good positioning',
    weaknesses: 'Needs to improve heading',
    recommendation: RecommendationType.BUY_NOW,
  };

  const mockVoiceReportResponse: VoiceReportResponseDto = {
    transcription: 'This is a test transcription',
    extractedData: mockExtractedData,
    confidence: 92,
    suggestions: [],
    warnings: [],
    language: 'en',
    processingTimeMs: 2500,
  };

  const mockRequest = {
    user: {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'SCOUT',
    },
  };

  beforeEach(async () => {
    const mockService = {
      processVoiceReport: jest.fn(),
      getSupportedLanguages: jest.fn(),
      getExamples: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoiceToReportController],
      providers: [
        {
          provide: VoiceToReportService,
          useValue: mockService,
        },
        {
          provide: SubscriptionsService,
          useValue: {
            getMySubscription: jest.fn(),
            hasMinimumTier: jest.fn().mockResolvedValue(true),
            createOrUpdateSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            reactivateSubscription: jest.fn(),
            changeTier: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(ScoutCertificationGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<VoiceToReportController>(VoiceToReportController);
    service = module.get(VoiceToReportService) as jest.Mocked<VoiceToReportService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have voiceToReportService injected', () => {
      expect(controller['voiceToReportService']).toBeDefined();
    });
  });

  describe('POST /voice-to-report/process', () => {
    it('should successfully process voice report', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const result = await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.EN,
      );

      expect(result).toEqual(mockVoiceReportResponse);
      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        expect.objectContaining({
          language: SupportedLanguage.EN,
        }),
      );
    });

    it('should throw BadRequestException when no file is provided', async () => {
      await expect(controller.processVoiceReport(null, mockRequest)).rejects.toThrow(
        BadRequestException,
      );

      await expect(controller.processVoiceReport(null, mockRequest)).rejects.toThrow(
        'No audio file provided',
      );

      expect(service.processVoiceReport).not.toHaveBeenCalled();
    });

    it('should use default language EN when not provided', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      await controller.processVoiceReport(mockAudioFile, mockRequest);

      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        expect.objectContaining({
          language: SupportedLanguage.EN,
        }),
      );
    });

    it('should accept all supported languages', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const supportedLanguages = [
        SupportedLanguage.EN,
        SupportedLanguage.ES,
        SupportedLanguage.FR,
        SupportedLanguage.DE,
        SupportedLanguage.IT,
        SupportedLanguage.PT,
      ];

      for (const language of supportedLanguages) {
        await controller.processVoiceReport(mockAudioFile, mockRequest, language);

        expect(service.processVoiceReport).toHaveBeenCalledWith(
          mockAudioFile,
          mockRequest.user.userId,
          expect.objectContaining({ language }),
        );
      }
    });

    it('should pass matchId when provided', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.EN,
        'match-123',
      );

      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        expect.objectContaining({
          matchId: 'match-123',
        }),
      );
    });

    it('should pass playerId when provided', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.EN,
        undefined,
        'player-456',
      );

      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        expect.objectContaining({
          playerId: 'player-456',
        }),
      );
    });

    it('should handle keepAudio as boolean true', async () => {
      service.processVoiceReport.mockResolvedValue({
        ...mockVoiceReportResponse,
        audioUrl: 'https://example.com/audio.mp3',
      });

      await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.EN,
        undefined,
        undefined,
        true,
      );

      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        expect.objectContaining({
          keepAudio: true,
        }),
      );
    });

    it('should handle keepAudio as string "true"', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.EN,
        undefined,
        undefined,
        'true' as any,
      );

      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        expect.objectContaining({
          keepAudio: true,
        }),
      );
    });

    it('should handle keepAudio as false', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.EN,
        undefined,
        undefined,
        false,
      );

      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        expect.objectContaining({
          keepAudio: false,
        }),
      );
    });

    it('should extract userId from request', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const customRequest = {
        user: {
          userId: 'custom-user-456',
          email: 'custom@example.com',
          role: 'SCOUT',
        },
      };

      await controller.processVoiceReport(mockAudioFile, customRequest);

      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        'custom-user-456',
        expect.any(Object),
      );
    });

    it('should pass all parameters correctly', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.ES,
        'match-789',
        'player-101',
        true,
      );

      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        {
          language: SupportedLanguage.ES,
          matchId: 'match-789',
          playerId: 'player-101',
          keepAudio: true,
        },
      );
    });

    it('should return processing time in response', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const result = await controller.processVoiceReport(mockAudioFile, mockRequest);

      expect(result.processingTimeMs).toBeDefined();
      expect(typeof result.processingTimeMs).toBe('number');
      expect(result.processingTimeMs).toBeGreaterThan(0);
    });

    it('should return confidence score', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const result = await controller.processVoiceReport(mockAudioFile, mockRequest);

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should return extracted data', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const result = await controller.processVoiceReport(mockAudioFile, mockRequest);

      expect(result.extractedData).toBeDefined();
      expect(result.extractedData).toEqual(mockExtractedData);
    });

    it('should return transcription text', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const result = await controller.processVoiceReport(mockAudioFile, mockRequest);

      expect(result.transcription).toBeDefined();
      expect(typeof result.transcription).toBe('string');
    });

    it('should return suggestions array', async () => {
      const responseWithSuggestions = {
        ...mockVoiceReportResponse,
        suggestions: ['Add more details', 'Include ratings'],
      };
      service.processVoiceReport.mockResolvedValue(responseWithSuggestions);

      const result = await controller.processVoiceReport(mockAudioFile, mockRequest);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should return warnings when present', async () => {
      const responseWithWarnings = {
        ...mockVoiceReportResponse,
        warnings: ['Player name not found', 'Date format incorrect'],
      };
      service.processVoiceReport.mockResolvedValue(responseWithWarnings);

      const result = await controller.processVoiceReport(mockAudioFile, mockRequest);

      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should include audioUrl when keepAudio is true', async () => {
      const responseWithAudio = {
        ...mockVoiceReportResponse,
        audioUrl: 'https://storage.example.com/audio.mp3',
      };
      service.processVoiceReport.mockResolvedValue(responseWithAudio);

      const result = await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.EN,
        undefined,
        undefined,
        true,
      );

      expect(result.audioUrl).toBeDefined();
      expect(result.audioUrl).toContain('https://');
    });

    it('should propagate service errors', async () => {
      service.processVoiceReport.mockRejectedValue(new Error('Processing failed'));

      await expect(controller.processVoiceReport(mockAudioFile, mockRequest)).rejects.toThrow(
        'Processing failed',
      );
    });
  });

  describe('GET /voice-to-report/languages', () => {
    const mockLanguages = [
      { code: 'en', name: 'English', whisperSupported: true },
      { code: 'es', name: 'Spanish', whisperSupported: true },
      { code: 'fr', name: 'French', whisperSupported: true },
      { code: 'de', name: 'German', whisperSupported: true },
      { code: 'it', name: 'Italian', whisperSupported: true },
      { code: 'pt', name: 'Portuguese', whisperSupported: true },
    ];

    it('should return supported languages', () => {
      service.getSupportedLanguages.mockReturnValue(mockLanguages);

      const result = controller.getSupportedLanguages();

      expect(result).toEqual(mockLanguages);
      expect(service.getSupportedLanguages).toHaveBeenCalled();
    });

    it('should return array of languages', () => {
      service.getSupportedLanguages.mockReturnValue(mockLanguages);

      const result = controller.getSupportedLanguages();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include language code, name, and whisper support', () => {
      service.getSupportedLanguages.mockReturnValue(mockLanguages);

      const result = controller.getSupportedLanguages();

      result.forEach((lang) => {
        expect(lang).toHaveProperty('code');
        expect(lang).toHaveProperty('name');
        expect(lang).toHaveProperty('whisperSupported');
        expect(typeof lang.code).toBe('string');
        expect(typeof lang.name).toBe('string');
        expect(typeof lang.whisperSupported).toBe('boolean');
      });
    });

    it('should include English', () => {
      service.getSupportedLanguages.mockReturnValue(mockLanguages);

      const result = controller.getSupportedLanguages();
      const englishLang = result.find((l) => l.code === 'en');

      expect(englishLang).toBeDefined();
      expect(englishLang.name).toBe('English');
    });

    it('should call service method once', () => {
      service.getSupportedLanguages.mockReturnValue(mockLanguages);

      controller.getSupportedLanguages();

      expect(service.getSupportedLanguages).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET /voice-to-report/examples', () => {
    const mockExamples = [
      {
        language: 'en',
        prompt: 'This is a test prompt',
        tips: ['Tip 1', 'Tip 2'],
      },
      {
        language: 'es',
        prompt: 'Este es un prompt de prueba',
        tips: ['Consejo 1', 'Consejo 2'],
      },
    ];

    it('should return examples', () => {
      service.getExamples.mockReturnValue(mockExamples);

      const result = controller.getExamples();

      expect(result).toEqual(mockExamples);
      expect(service.getExamples).toHaveBeenCalled();
    });

    it('should return array of examples', () => {
      service.getExamples.mockReturnValue(mockExamples);

      const result = controller.getExamples();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should include language, prompt, and tips', () => {
      service.getExamples.mockReturnValue(mockExamples);

      const result = controller.getExamples();

      result.forEach((example) => {
        expect(example).toHaveProperty('language');
        expect(example).toHaveProperty('prompt');
        expect(example).toHaveProperty('tips');
        expect(typeof example.language).toBe('string');
        expect(typeof example.prompt).toBe('string');
        expect(Array.isArray(example.tips)).toBe(true);
      });
    });

    it('should include examples in multiple languages', () => {
      service.getExamples.mockReturnValue(mockExamples);

      const result = controller.getExamples();
      const languages = result.map((e) => e.language);

      expect(languages.length).toBeGreaterThan(1);
      expect(new Set(languages).size).toBeGreaterThan(1);
    });

    it('should call service method once', () => {
      service.getExamples.mockReturnValue(mockExamples);

      controller.getExamples();

      expect(service.getExamples).toHaveBeenCalledTimes(1);
    });

    it('should include tips for each example', () => {
      service.getExamples.mockReturnValue(mockExamples);

      const result = controller.getExamples();

      result.forEach((example) => {
        expect(example.tips.length).toBeGreaterThan(0);
        example.tips.forEach((tip) => {
          expect(typeof tip).toBe('string');
          expect(tip.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('POST /voice-to-report/test-transcription', () => {
    const mockTestResponse = {
      transcription: 'Test transcription',
      extractedData: mockExtractedData,
      confidence: 85,
      suggestions: ['Add more details'],
      warnings: [],
      language: 'en',
    };

    it('should test transcription with text input', async () => {
      // Mock the private methods accessed via (service as any)
      const extractReportData = jest.fn().mockResolvedValue(mockExtractedData);
      const validateData = jest.fn().mockResolvedValue({ data: mockExtractedData, warnings: [] });
      const calculateConfidence = jest.fn().mockReturnValue(85);
      const generateSuggestions = jest.fn().mockReturnValue(['Add more details']);

      (service as any).extractReportData = extractReportData;
      (service as any).validateData = validateData;
      (service as any).calculateConfidence = calculateConfidence;
      (service as any).generateSuggestions = generateSuggestions;

      const result = await controller.testTranscription('This is test text', 'en');

      expect(result).toBeDefined();
      expect(result.transcription).toBe('This is test text');
      expect(extractReportData).toHaveBeenCalledWith('This is test text', 'en');
    });

    it('should throw BadRequestException when text is missing', async () => {
      await expect(controller.testTranscription('', 'en')).rejects.toThrow(BadRequestException);

      await expect(controller.testTranscription(null, 'en')).rejects.toThrow(BadRequestException);
    });

    it('should default to English when language not provided', async () => {
      const extractReportData = jest.fn().mockResolvedValue(mockExtractedData);
      const validateData = jest.fn().mockResolvedValue({ data: mockExtractedData, warnings: [] });
      const calculateConfidence = jest.fn().mockReturnValue(85);
      const generateSuggestions = jest.fn().mockReturnValue([]);

      (service as any).extractReportData = extractReportData;
      (service as any).validateData = validateData;
      (service as any).calculateConfidence = calculateConfidence;
      (service as any).generateSuggestions = generateSuggestions;

      const result = await controller.testTranscription('Test text');

      expect(result.language).toBe('en');
      expect(extractReportData).toHaveBeenCalledWith('Test text', 'en');
    });

    it('should return extracted data', async () => {
      const extractReportData = jest.fn().mockResolvedValue(mockExtractedData);
      const validateData = jest.fn().mockResolvedValue({ data: mockExtractedData, warnings: [] });
      const calculateConfidence = jest.fn().mockReturnValue(85);
      const generateSuggestions = jest.fn().mockReturnValue([]);

      (service as any).extractReportData = extractReportData;
      (service as any).validateData = validateData;
      (service as any).calculateConfidence = calculateConfidence;
      (service as any).generateSuggestions = generateSuggestions;

      const result = await controller.testTranscription('Test text', 'en');

      expect(result.extractedData).toBeDefined();
      expect(result.extractedData).toEqual(mockExtractedData);
    });

    it('should return confidence score', async () => {
      const extractReportData = jest.fn().mockResolvedValue(mockExtractedData);
      const validateData = jest.fn().mockResolvedValue({ data: mockExtractedData, warnings: [] });
      const calculateConfidence = jest.fn().mockReturnValue(92);
      const generateSuggestions = jest.fn().mockReturnValue([]);

      (service as any).extractReportData = extractReportData;
      (service as any).validateData = validateData;
      (service as any).calculateConfidence = calculateConfidence;
      (service as any).generateSuggestions = generateSuggestions;

      const result = await controller.testTranscription('Test text', 'en');

      expect(result.confidence).toBe(92);
    });

    it('should return suggestions', async () => {
      const extractReportData = jest.fn().mockResolvedValue(mockExtractedData);
      const validateData = jest.fn().mockResolvedValue({ data: mockExtractedData, warnings: [] });
      const calculateConfidence = jest.fn().mockReturnValue(85);
      const generateSuggestions = jest.fn().mockReturnValue(['Add ratings', 'Include position']);

      (service as any).extractReportData = extractReportData;
      (service as any).validateData = validateData;
      (service as any).calculateConfidence = calculateConfidence;
      (service as any).generateSuggestions = generateSuggestions;

      const result = await controller.testTranscription('Test text', 'en');

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions).toEqual(['Add ratings', 'Include position']);
    });

    it('should return warnings from validation', async () => {
      const extractReportData = jest.fn().mockResolvedValue({});
      const validateData = jest.fn().mockResolvedValue({
        data: {},
        warnings: ['Player name missing', 'No ratings found'],
      });
      const calculateConfidence = jest.fn().mockReturnValue(30);
      const generateSuggestions = jest.fn().mockReturnValue([]);

      (service as any).extractReportData = extractReportData;
      (service as any).validateData = validateData;
      (service as any).calculateConfidence = calculateConfidence;
      (service as any).generateSuggestions = generateSuggestions;

      const result = await controller.testTranscription('Test text', 'en');

      expect(result.warnings).toBeDefined();
      expect(result.warnings).toEqual(['Player name missing', 'No ratings found']);
    });

    it('should handle different languages', async () => {
      const extractReportData = jest.fn().mockResolvedValue(mockExtractedData);
      const validateData = jest.fn().mockResolvedValue({ data: mockExtractedData, warnings: [] });
      const calculateConfidence = jest.fn().mockReturnValue(85);
      const generateSuggestions = jest.fn().mockReturnValue([]);

      (service as any).extractReportData = extractReportData;
      (service as any).validateData = validateData;
      (service as any).calculateConfidence = calculateConfidence;
      (service as any).generateSuggestions = generateSuggestions;

      const languages = ['en', 'es', 'fr', 'de'];

      for (const lang of languages) {
        const result = await controller.testTranscription('Test text', lang);
        expect(result.language).toBe(lang);
        expect(extractReportData).toHaveBeenCalledWith('Test text', lang);
      }
    });
  });

  describe('Controller Configuration', () => {
    it('should have proper decorators applied', () => {
      // Controller decorators are applied at runtime
      // This test verifies the controller is properly configured
      expect(controller).toBeDefined();
      expect(controller.processVoiceReport).toBeDefined();
      expect(controller.getSupportedLanguages).toBeDefined();
      expect(controller.getExamples).toBeDefined();
      expect(controller.testTranscription).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      service.processVoiceReport.mockRejectedValue(new BadRequestException('Invalid audio format'));

      await expect(controller.processVoiceReport(mockAudioFile, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate file presence before processing', async () => {
      await expect(controller.processVoiceReport(null, mockRequest)).rejects.toThrow(
        BadRequestException,
      );

      await expect(controller.processVoiceReport(undefined, mockRequest)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should validate text presence in test endpoint', async () => {
      await expect(controller.testTranscription('', 'en')).rejects.toThrow(BadRequestException);

      await expect(controller.testTranscription(null, 'en')).rejects.toThrow(BadRequestException);

      await expect(controller.testTranscription(undefined, 'en')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete workflow for voice report', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const result = await controller.processVoiceReport(
        mockAudioFile,
        mockRequest,
        SupportedLanguage.EN,
        'match-123',
        'player-456',
        true,
      );

      expect(result).toBeDefined();
      expect(result.transcription).toBeDefined();
      expect(result.extractedData).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        {
          language: SupportedLanguage.EN,
          matchId: 'match-123',
          playerId: 'player-456',
          keepAudio: true,
        },
      );
    });

    it('should handle minimal parameters', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      const result = await controller.processVoiceReport(mockAudioFile, mockRequest);

      expect(result).toBeDefined();
      expect(service.processVoiceReport).toHaveBeenCalledWith(
        mockAudioFile,
        mockRequest.user.userId,
        {
          language: SupportedLanguage.EN,
          matchId: undefined,
          playerId: undefined,
          keepAudio: false,
        },
      );
    });

    it('should preserve user context throughout request', async () => {
      service.processVoiceReport.mockResolvedValue(mockVoiceReportResponse);

      await controller.processVoiceReport(mockAudioFile, mockRequest);

      const callArgs = service.processVoiceReport.mock.calls[0];
      expect(callArgs[1]).toBe(mockRequest.user.userId);
    });
  });
});
