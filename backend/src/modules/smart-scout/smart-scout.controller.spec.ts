import { Test, TestingModule } from '@nestjs/testing';
import { SmartScoutController } from './smart-scout.controller';
import { SmartScoutService } from './smart-scout.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ExecutionContext } from '@nestjs/common';

describe('SmartScoutController', () => {
  let controller: SmartScoutController;
  let service: SmartScoutService;

  const mockSmartScoutService = {
    getSuggestions: jest.fn(),
    autocomplete: jest.fn(),
    generateInsights: jest.fn(),
    indexReport: jest.fn(),
    reindexAll: jest.fn(),
  };

  // Mock guards to bypass authentication/authorization in tests
  const mockJwtAuthGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  const mockRolesGuard = {
    canActivate: jest.fn((context: ExecutionContext) => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SmartScoutController],
      providers: [
        {
          provide: SmartScoutService,
          useValue: mockSmartScoutService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    controller = module.get<SmartScoutController>(SmartScoutController);
    service = module.get<SmartScoutService>(SmartScoutService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSuggestions', () => {
    it('should return suggestions successfully', async () => {
      const partialReport = {
        playerPosition: 'Forward',
        technicalRating: 85,
        strengths: 'Fast runner',
      };

      const context = {
        position: 'Forward',
        league: 'Premier League',
      };

      const mockResponse = {
        similarReports: [
          {
            reportId: 'report-1',
            similarity: 0.9,
            player: {
              id: 'player-1',
              name: 'John Doe',
              position: 'Forward',
            },
            excerpts: {
              strengths: 'Excellent finishing',
              weaknesses: 'Needs work on heading',
              summary: 'Promising player',
            },
          },
        ],
        suggestions: [
          {
            field: 'weaknesses',
            value: 'Needs work on heading',
            confidence: 0.8,
            source: 'similar_reports',
          },
        ],
        usingAI: true,
      };

      mockSmartScoutService.getSuggestions.mockResolvedValue(mockResponse);

      const result = await controller.getSuggestions(partialReport, context);

      expect(result).toEqual(mockResponse);
      expect(service.getSuggestions).toHaveBeenCalledWith(partialReport, context);
    });

    it('should handle empty context', async () => {
      const partialReport = {
        playerPosition: 'Midfielder',
      };

      const mockResponse = {
        similarReports: [],
        suggestions: [],
        usingAI: false,
      };

      mockSmartScoutService.getSuggestions.mockResolvedValue(mockResponse);

      const result = await controller.getSuggestions(partialReport, undefined);

      expect(result).toEqual(mockResponse);
      expect(service.getSuggestions).toHaveBeenCalledWith(partialReport, {});
    });

    it('should handle null context', async () => {
      const partialReport = {
        technicalRating: 75,
      };

      const mockResponse = {
        similarReports: [],
        suggestions: [],
        usingAI: false,
      };

      mockSmartScoutService.getSuggestions.mockResolvedValue(mockResponse);

      const result = await controller.getSuggestions(partialReport, null);

      expect(result).toEqual(mockResponse);
      expect(service.getSuggestions).toHaveBeenCalledWith(partialReport, {});
    });

    it('should propagate service errors', async () => {
      const partialReport = {
        playerPosition: 'Forward',
      };

      mockSmartScoutService.getSuggestions.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        controller.getSuggestions(partialReport, {}),
      ).rejects.toThrow('Database error');
    });
  });

  describe('autocomplete', () => {
    it('should return autocomplete suggestions for position field', async () => {
      const dto = {
        fieldName: 'position',
        partialValue: 'For',
        context: { position: 'Forward' },
      };

      const mockResponse = {
        suggestions: ['Forward', 'Forward Left', 'Forward Right'],
        usingAI: false,
      };

      mockSmartScoutService.autocomplete.mockResolvedValue(mockResponse);

      const result = await controller.autocomplete(dto);

      expect(result).toEqual(mockResponse);
      expect(service.autocomplete).toHaveBeenCalledWith(
        'position',
        'For',
        { position: 'Forward' },
      );
    });

    it('should return autocomplete suggestions for text fields', async () => {
      const dto = {
        fieldName: 'strengths',
        partialValue: 'Fast',
        context: {},
      };

      const mockResponse = {
        suggestions: ['Fast runner', 'Fast acceleration', 'Fast decision making'],
        usingAI: false,
      };

      mockSmartScoutService.autocomplete.mockResolvedValue(mockResponse);

      const result = await controller.autocomplete(dto);

      expect(result).toEqual(mockResponse);
      expect(service.autocomplete).toHaveBeenCalledWith('strengths', 'Fast', {});
    });

    it('should handle empty context', async () => {
      const dto = {
        fieldName: 'weaknesses',
        partialValue: 'poor',
        context: undefined,
      };

      const mockResponse = {
        suggestions: ['Poor positioning', 'Poor passing'],
        usingAI: false,
      };

      mockSmartScoutService.autocomplete.mockResolvedValue(mockResponse);

      const result = await controller.autocomplete(dto);

      expect(result).toEqual(mockResponse);
      expect(service.autocomplete).toHaveBeenCalledWith('weaknesses', 'poor', {});
    });

    it('should throw BadRequestException for invalid field name', async () => {
      const dto = {
        fieldName: 'invalidField',
        partialValue: 'test',
        context: {},
      };

      mockSmartScoutService.autocomplete.mockRejectedValue(
        new BadRequestException('Invalid field name: invalidField'),
      );

      await expect(controller.autocomplete(dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle empty suggestions', async () => {
      const dto = {
        fieldName: 'summary',
        partialValue: 'xyz',
        context: {},
      };

      const mockResponse = {
        suggestions: [],
        usingAI: false,
      };

      mockSmartScoutService.autocomplete.mockResolvedValue(mockResponse);

      const result = await controller.autocomplete(dto);

      expect(result.suggestions).toEqual([]);
    });
  });

  describe('getInsights', () => {
    it('should return player insights successfully', async () => {
      const playerId = 'player-123';
      const mockInsights = 'Player shows consistent improvement across all areas...';

      mockSmartScoutService.generateInsights.mockResolvedValue(mockInsights);

      // Set environment variable for test
      process.env.OPENAI_API_KEY = 'test-key';

      const result = await controller.getInsights(playerId);

      expect(result).toEqual({
        playerId,
        insights: mockInsights,
        usingAI: true,
      });
      expect(service.generateInsights).toHaveBeenCalledWith(playerId);

      // Clean up
      delete process.env.OPENAI_API_KEY;
    });

    it('should indicate when AI is not available', async () => {
      const playerId = 'player-456';
      const mockInsights = 'Player Analysis (3 reports):\n\nAverage Ratings...';

      mockSmartScoutService.generateInsights.mockResolvedValue(mockInsights);

      // Ensure OpenAI key is not set
      delete process.env.OPENAI_API_KEY;

      const result = await controller.getInsights(playerId);

      expect(result).toEqual({
        playerId,
        insights: mockInsights,
        usingAI: false,
      });
    });

    it('should throw NotFoundException when no reports exist', async () => {
      const playerId = 'player-no-reports';

      mockSmartScoutService.generateInsights.mockRejectedValue(
        new NotFoundException(`No reports found for player ${playerId}`),
      );

      await expect(controller.getInsights(playerId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle service errors', async () => {
      const playerId = 'player-error';

      mockSmartScoutService.generateInsights.mockRejectedValue(
        new Error('OpenAI API error'),
      );

      await expect(controller.getInsights(playerId)).rejects.toThrow(
        'OpenAI API error',
      );
    });
  });

  describe('indexReport', () => {
    it('should index report successfully', async () => {
      const reportId = 'report-123';

      mockSmartScoutService.indexReport.mockResolvedValue(undefined);

      const result = await controller.indexReport(reportId);

      expect(result).toEqual({
        message: 'Report indexed successfully',
        reportId,
      });
      expect(service.indexReport).toHaveBeenCalledWith(reportId);
    });

    it('should throw NotFoundException for non-existent report', async () => {
      const reportId = 'non-existent-report';

      mockSmartScoutService.indexReport.mockRejectedValue(
        new NotFoundException(`Report with ID ${reportId} not found`),
      );

      await expect(controller.indexReport(reportId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle indexing errors gracefully', async () => {
      const reportId = 'report-error';

      mockSmartScoutService.indexReport.mockRejectedValue(
        new Error('Embedding generation failed'),
      );

      await expect(controller.indexReport(reportId)).rejects.toThrow(
        'Embedding generation failed',
      );
    });
  });

  describe('reindexAll', () => {
    it('should reindex all reports successfully', async () => {
      const mockResult = {
        indexed: 42,
        failed: 3,
      };

      mockSmartScoutService.reindexAll.mockResolvedValue(mockResult);

      const result = await controller.reindexAll();

      expect(result).toEqual({
        message: 'Reindexing completed',
        indexed: 42,
        failed: 3,
        totalProcessed: 45,
      });
      expect(service.reindexAll).toHaveBeenCalled();
    });

    it('should handle all reports indexed successfully', async () => {
      const mockResult = {
        indexed: 100,
        failed: 0,
      };

      mockSmartScoutService.reindexAll.mockResolvedValue(mockResult);

      const result = await controller.reindexAll();

      expect(result).toEqual({
        message: 'Reindexing completed',
        indexed: 100,
        failed: 0,
        totalProcessed: 100,
      });
    });

    it('should handle all reports failed', async () => {
      const mockResult = {
        indexed: 0,
        failed: 10,
      };

      mockSmartScoutService.reindexAll.mockResolvedValue(mockResult);

      const result = await controller.reindexAll();

      expect(result).toEqual({
        message: 'Reindexing completed',
        indexed: 0,
        failed: 10,
        totalProcessed: 10,
      });
    });

    it('should handle empty database', async () => {
      const mockResult = {
        indexed: 0,
        failed: 0,
      };

      mockSmartScoutService.reindexAll.mockResolvedValue(mockResult);

      const result = await controller.reindexAll();

      expect(result).toEqual({
        message: 'Reindexing completed',
        indexed: 0,
        failed: 0,
        totalProcessed: 0,
      });
    });

    it('should propagate service errors', async () => {
      mockSmartScoutService.reindexAll.mockRejectedValue(
        new Error('Database connection failed'),
      );

      await expect(controller.reindexAll()).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('Authentication and Authorization', () => {
    it('should use JWT and Roles guards', () => {
      // Guards are applied at the controller level
      const guards = Reflect.getMetadata('__guards__', SmartScoutController);
      expect(guards).toBeDefined();
    });

    it('should require proper roles for getSuggestions', () => {
      const roles = Reflect.getMetadata(
        'roles',
        SmartScoutController.prototype.getSuggestions,
      );
      expect(roles).toContain('SCOUT');
      expect(roles).toContain('ANALYST');
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
    });

    it('should require proper roles for autocomplete', () => {
      const roles = Reflect.getMetadata(
        'roles',
        SmartScoutController.prototype.autocomplete,
      );
      expect(roles).toContain('SCOUT');
      expect(roles).toContain('ANALYST');
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
    });

    it('should require proper roles for getInsights', () => {
      const roles = Reflect.getMetadata(
        'roles',
        SmartScoutController.prototype.getInsights,
      );
      expect(roles).toContain('SCOUT');
      expect(roles).toContain('ANALYST');
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
      expect(roles).toContain('AGENT');
      expect(roles).toContain('CLUB_CONTACT');
    });

    it('should require admin roles for indexReport', () => {
      const roles = Reflect.getMetadata(
        'roles',
        SmartScoutController.prototype.indexReport,
      );
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
      expect(roles.length).toBe(2); // Only admin roles
    });

    it('should require admin roles for reindexAll', () => {
      const roles = Reflect.getMetadata(
        'roles',
        SmartScoutController.prototype.reindexAll,
      );
      expect(roles).toContain('ADMIN');
      expect(roles).toContain('SUPER_ADMIN');
      expect(roles.length).toBe(2); // Only admin roles
    });
  });

  describe('HTTP Status Codes', () => {
    it('should return 200 for getSuggestions', () => {
      const statusCode = Reflect.getMetadata(
        '__httpCode__',
        SmartScoutController.prototype.getSuggestions,
      );
      expect(statusCode).toBe(200);
    });

    it('should return 200 for autocomplete', () => {
      const statusCode = Reflect.getMetadata(
        '__httpCode__',
        SmartScoutController.prototype.autocomplete,
      );
      expect(statusCode).toBe(200);
    });

    it('should return 200 for indexReport', () => {
      const statusCode = Reflect.getMetadata(
        '__httpCode__',
        SmartScoutController.prototype.indexReport,
      );
      expect(statusCode).toBe(200);
    });

    it('should return 200 for reindexAll', () => {
      const statusCode = Reflect.getMetadata(
        '__httpCode__',
        SmartScoutController.prototype.reindexAll,
      );
      expect(statusCode).toBe(200);
    });
  });

  describe('Request Validation', () => {
    it('should validate autocomplete request DTO', async () => {
      const validDto = {
        fieldName: 'strengths',
        partialValue: 'test',
        context: {},
      };

      mockSmartScoutService.autocomplete.mockResolvedValue({
        suggestions: [],
        usingAI: false,
      });

      await expect(controller.autocomplete(validDto)).resolves.toBeDefined();
    });

    it('should handle missing optional context in autocomplete', async () => {
      const dto = {
        fieldName: 'weaknesses',
        partialValue: 'test',
      };

      mockSmartScoutService.autocomplete.mockResolvedValue({
        suggestions: [],
        usingAI: false,
      });

      const result = await controller.autocomplete(dto as any);

      expect(service.autocomplete).toHaveBeenCalledWith(
        'weaknesses',
        'test',
        {},
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected errors in getSuggestions', async () => {
      const partialReport = { playerPosition: 'Forward' };

      mockSmartScoutService.getSuggestions.mockRejectedValue(
        new Error('Unexpected error'),
      );

      await expect(
        controller.getSuggestions(partialReport, {}),
      ).rejects.toThrow('Unexpected error');
    });

    it('should handle timeout errors in autocomplete', async () => {
      const dto = {
        fieldName: 'summary',
        partialValue: 'test',
        context: {},
      };

      mockSmartScoutService.autocomplete.mockRejectedValue(
        new Error('Request timeout'),
      );

      await expect(controller.autocomplete(dto)).rejects.toThrow(
        'Request timeout',
      );
    });

    it('should handle database errors in getInsights', async () => {
      mockSmartScoutService.generateInsights.mockRejectedValue(
        new Error('Database connection lost'),
      );

      await expect(controller.getInsights('player-1')).rejects.toThrow(
        'Database connection lost',
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long partial values in autocomplete', async () => {
      const longValue = 'a'.repeat(1000);
      const dto = {
        fieldName: 'strengths',
        partialValue: longValue,
        context: {},
      };

      mockSmartScoutService.autocomplete.mockResolvedValue({
        suggestions: [],
        usingAI: false,
      });

      const result = await controller.autocomplete(dto);

      expect(service.autocomplete).toHaveBeenCalledWith(
        'strengths',
        longValue,
        {},
      );
    });

    it('should handle special characters in autocomplete', async () => {
      const dto = {
        fieldName: 'strengths',
        partialValue: 'test@#$%',
        context: {},
      };

      mockSmartScoutService.autocomplete.mockResolvedValue({
        suggestions: [],
        usingAI: false,
      });

      await controller.autocomplete(dto);

      expect(service.autocomplete).toHaveBeenCalledWith(
        'strengths',
        'test@#$%',
        {},
      );
    });

    it('should handle unicode characters in partial report', async () => {
      const partialReport = {
        strengths: 'Très rapide et technique 中文',
      };

      mockSmartScoutService.getSuggestions.mockResolvedValue({
        similarReports: [],
        suggestions: [],
        usingAI: false,
      });

      const result = await controller.getSuggestions(partialReport, {});

      expect(result).toBeDefined();
    });
  });
});
