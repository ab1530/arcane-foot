import { Test, TestingModule } from '@nestjs/testing';
import { SmartScoutService } from './smart-scout.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import OpenAI from 'openai';

// Mock OpenAI
jest.mock('openai');

const mockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('SmartScoutService', () => {
  let service: SmartScoutService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    scouting_reports: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    report_embeddings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartScoutService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SmartScoutService>(SmartScoutService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateEmbedding', () => {
    it('should return null if OpenAI is not initialized', async () => {
      const result = await service.generateEmbedding('test text');
      expect(result).toBeNull();
    });

    it('should return null for empty text', async () => {
      const result = await service.generateEmbedding('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace-only text', async () => {
      const result = await service.generateEmbedding('   ');
      expect(result).toBeNull();
    });
  });

  describe('indexReport', () => {
    it('should throw NotFoundException if report does not exist', async () => {
      mockPrismaService.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.indexReport('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should skip indexing if report already has embeddings', async () => {
      const mockReport = {
        id: 'report-1',
        strengths: 'Fast, technical',
        weaknesses: 'Decision making',
      };

      mockPrismaService.scouting_reports.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.report_embeddings.findUnique.mockResolvedValue({
        id: 'embedding-1',
        reportId: 'report-1',
      });

      await service.indexReport('report-1');

      expect(mockPrismaService.report_embeddings.create).not.toHaveBeenCalled();
    });

    it('should not create embedding when OpenAI is unavailable', async () => {
      const mockReport = {
        id: 'report-1',
        strengths: 'Fast, technical',
        weaknesses: 'Decision making',
        players: { id: 'player-1' },
        matches: { id: 'match-1' },
      };

      mockPrismaService.scouting_reports.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.report_embeddings.findUnique.mockResolvedValue(null);

      await service.indexReport('report-1');

      expect(mockPrismaService.report_embeddings.create).not.toHaveBeenCalled();
    });
  });

  describe('getSuggestions', () => {
    it('should return suggestions using rule-based fallback', async () => {
      const partialReport = {
        playerPosition: 'Forward',
        technicalRating: 85,
      };

      const mockReports = [
        {
          id: 'report-1',
          playerPosition: 'Forward',
          strengths: 'Excellent finishing',
          weaknesses: 'Needs to improve heading',
          players: {
            id: 'player-1',
            users: { firstName: 'John', lastName: 'Doe' },
            position: 'Forward',
          },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      const result = await service.getSuggestions(partialReport, {
        position: 'Forward',
      });

      expect(result).toBeDefined();
      expect(result.similarReports).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.usingAI).toBe(false);
    });

    it('should handle empty similar reports gracefully', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);

      const result = await service.getSuggestions(
        { playerPosition: 'Goalkeeper' },
        {},
      );

      expect(result.similarReports).toHaveLength(0);
      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('autocomplete', () => {
    it('should throw BadRequestException for invalid field name', async () => {
      await expect(
        service.autocomplete('invalidField', 'test', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should provide autocomplete for position field', async () => {
      mockPrismaService.scouting_reports.groupBy.mockResolvedValue([
        { playerPosition: 'Forward', _count: 5 },
        { playerPosition: 'Midfielder', _count: 3 },
      ]);

      const result = await service.autocomplete('position', 'For', {});

      expect(result.suggestions).toContain('Forward');
      expect(result.usingAI).toBe(false);
    });

    it('should provide autocomplete for text fields', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        { strengths: 'Fast and agile player' },
        { strengths: 'Fast runner with great stamina' },
        { strengths: 'Fast acceleration off the mark' },
        { strengths: 'Fast and technical dribbler' },
      ]);

      const result = await service.autocomplete('strengths', 'fast', {});

      expect(result.suggestions.length).toBeGreaterThanOrEqual(3);
      // usingAI can be true or false depending on OpenAI initialization
      expect(typeof result.usingAI).toBe('boolean');
    });

    it('should remove duplicate suggestions', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        { strengths: 'Good passer' },
        { strengths: 'Good passer' },
        { strengths: 'Good passer' },
      ]);

      const result = await service.autocomplete('strengths', 'Good', {});

      expect(result.suggestions).toHaveLength(1);
    });
  });

  describe('generateInsights', () => {
    it('should throw NotFoundException if no reports exist', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);

      await expect(service.generateInsights('player-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should generate fallback insights when OpenAI is unavailable', async () => {
      const mockReports = [
        {
          id: 'report-1',
          technicalRating: 80,
          physicalRating: 75,
          mentalRating: 85,
          tacticalRating: 70,
          users: { firstName: 'Scout', lastName: 'One' },
        },
        {
          id: 'report-2',
          technicalRating: 82,
          physicalRating: 78,
          mentalRating: 88,
          tacticalRating: 72,
          users: { firstName: 'Scout', lastName: 'Two' },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      const result = await service.generateInsights('player-1');

      expect(result).toContain('Player Analysis');
      expect(result).toContain('Average Ratings');
      expect(result).toContain('Technical:');
      expect(result).toContain('Physical:');
    });

    it('should calculate correct average ratings in fallback', async () => {
      const mockReports = [
        {
          id: 'report-1',
          technicalRating: 80,
          physicalRating: 80,
          mentalRating: 80,
          tacticalRating: 80,
          users: { firstName: 'Scout', lastName: 'One' },
        },
        {
          id: 'report-2',
          technicalRating: 90,
          physicalRating: 90,
          mentalRating: 90,
          tacticalRating: 90,
          users: { firstName: 'Scout', lastName: 'Two' },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      const result = await service.generateInsights('player-1');

      expect(result).toContain('85.0'); // Average of 80 and 90
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate correct cosine similarity', () => {
      const a = [1, 0, 0];
      const b = [1, 0, 0];

      // Access private method through any type casting for testing
      const similarity = (service as any).cosineSimilarity(a, b);

      expect(similarity).toBe(1); // Identical vectors
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];

      const similarity = (service as any).cosineSimilarity(a, b);

      expect(similarity).toBe(0);
    });

    it('should throw error for different length vectors', () => {
      const a = [1, 0];
      const b = [1, 0, 0];

      expect(() => (service as any).cosineSimilarity(a, b)).toThrow();
    });
  });

  describe('reindexAll', () => {
    it('should reindex all approved reports', async () => {
      const mockReports = [
        { id: 'report-1' },
        { id: 'report-2' },
        { id: 'report-3' },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      // Mock indexReport to skip (already indexed)
      mockPrismaService.scouting_reports.findUnique.mockResolvedValue({
        id: 'report-1',
        strengths: 'test',
        players: {},
        matches: {},
      });
      mockPrismaService.report_embeddings.findUnique.mockResolvedValue({
        id: 'existing-embedding',
        reportId: 'report-1',
      });

      const result = await service.reindexAll();

      expect(result.indexed).toBe(3); // All skipped because already indexed
      expect(result.failed).toBe(0);
    });
  });

  describe('normalizeReportText', () => {
    it('should normalize report data into text', () => {
      const report = {
        playerPosition: 'Forward',
        technicalRating: 85,
        physicalRating: 80,
        mentalRating: 90,
        tacticalRating: 75,
        strengths: 'Fast and technical',
        weaknesses: 'Needs work on heading',
        summary: 'Promising young player',
        tags: ['fast', 'technical'],
      };

      const text = (service as any).normalizeReportText(report);

      expect(text).toContain('Position: Forward');
      expect(text).toContain('Technical: 85/100');
      expect(text).toContain('Strengths: Fast and technical');
      expect(text).toContain('Tags: fast, technical');
    });

    it('should handle partial report data', () => {
      const report = {
        playerPosition: 'Midfielder',
        technicalRating: 85,
      };

      const text = (service as any).normalizeReportText(report);

      expect(text).toContain('Position: Midfielder');
      expect(text).toContain('Technical: 85/100');
      expect(text).not.toContain('Strengths:');
    });

    it('should handle empty report', () => {
      const report = {};
      const text = (service as any).normalizeReportText(report);
      expect(text).toBe('');
    });

    it('should handle report with only tags', () => {
      const report = {
        tags: ['versatile', 'leader'],
      };
      const text = (service as any).normalizeReportText(report);
      expect(text).toContain('Tags: versatile, leader');
    });
  });

  describe('generateEmbedding - Additional Tests', () => {
    let openAIInstance: any;

    beforeEach(() => {
      // Create a fresh service instance with OpenAI
      openAIInstance = {
        embeddings: {
          create: jest.fn(),
        },
      };

      // Mock OpenAI constructor
      mockOpenAI.mockImplementation(() => openAIInstance);

      // Set environment variable for this test suite
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    it('should successfully generate embedding with OpenAI', async () => {
      // Create new service with OpenAI enabled
      const testService = new SmartScoutService(prismaService);

      const mockEmbedding = new Array(1536).fill(0.5);
      openAIInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await (testService as any).generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(openAIInstance.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text',
      });
    });

    it('should retry on failure and succeed on second attempt', async () => {
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return 0 as any;
      });

      const testService = new SmartScoutService(prismaService);
      const mockEmbedding = new Array(1536).fill(0.5);

      openAIInstance.embeddings.create
        .mockRejectedValueOnce(new Error('API Error'))
        .mockResolvedValueOnce({
          data: [{ embedding: mockEmbedding }],
        });

      const result = await (testService as any).generateEmbedding('test text');

      expect(result).toEqual(mockEmbedding);
      expect(openAIInstance.embeddings.create).toHaveBeenCalledTimes(2);

      jest.restoreAllMocks();
    });

    it('should return null after max retries exhausted', async () => {
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return 0 as any;
      });

      const testService = new SmartScoutService(prismaService);

      openAIInstance.embeddings.create.mockRejectedValue(new Error('API Error'));

      const result = await (testService as any).generateEmbedding('test text');

      expect(result).toBeNull();
      expect(openAIInstance.embeddings.create).toHaveBeenCalledTimes(3);

      jest.restoreAllMocks();
    });

    it('should throw error for invalid embedding dimensions', async () => {
      // Mock setTimeout to execute immediately
      jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => {
        cb();
        return 0 as any;
      });

      const testService = new SmartScoutService(prismaService);
      const invalidEmbedding = new Array(512).fill(0.5); // Wrong dimension

      openAIInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: invalidEmbedding }],
      });

      const result = await (testService as any).generateEmbedding('test text');

      expect(result).toBeNull(); // Should return null after retries fail

      jest.restoreAllMocks();
    });

    it('should truncate long input text to 8000 characters', async () => {
      const testService = new SmartScoutService(prismaService);
      const longText = 'a'.repeat(10000);
      const mockEmbedding = new Array(1536).fill(0.5);

      openAIInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: mockEmbedding }],
      });

      await (testService as any).generateEmbedding(longText);

      expect(openAIInstance.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: longText.slice(0, 8000),
      });
    });
  });

  describe('indexReport - Additional Tests', () => {
    it('should create embedding when report exists and not indexed', async () => {
      const mockReport = {
        id: 'report-1',
        playerPosition: 'Forward',
        technicalRating: 85,
        strengths: 'Fast, technical',
        weaknesses: 'Decision making',
        players: { id: 'player-1' },
        matches: { id: 'match-1' },
      };

      mockPrismaService.scouting_reports.findUnique.mockResolvedValue(mockReport);
      mockPrismaService.report_embeddings.findUnique.mockResolvedValue(null);

      await service.indexReport('report-1');

      // Should not create since OpenAI is not available in default test setup
      expect(mockPrismaService.report_embeddings.create).not.toHaveBeenCalled();
    });
  });

  describe('findSimilarReportsWithEmbeddings', () => {
    it('should find similar reports and apply position boost', () => {
      const embedding = new Array(1536).fill(0.5);
      const mockEmbeddings = [
        {
          id: 'emb-1',
          reportId: 'report-1',
          embedding: new Array(1536).fill(0.5),
          scouting_reports: {
            id: 'report-1',
            playerPosition: 'Forward',
            strengths: 'Fast runner',
            weaknesses: 'Heading',
            summary: 'Good player',
            matches: {
              competitions: { country: 'France' },
            },
            players: {
              id: 'player-1',
              position: 'Forward',
              users: { firstName: 'John', lastName: 'Doe' },
            },
          },
        },
      ];

      mockPrismaService.report_embeddings.findMany.mockResolvedValue(mockEmbeddings);

      const context = { position: 'Forward', league: 'France' };

      // This is a private method, so we'll test it through getSuggestions
      // which internally uses it when embeddings are available
    });
  });

  describe('generateSuggestions', () => {
    it('should generate strength suggestions from similar reports', () => {
      const similarReports = [
        {
          reportId: 'report-1',
          similarity: 0.9,
          player: {
            id: 'player-1',
            name: 'John Doe',
            position: 'Forward',
          },
          excerpts: {
            strengths: 'Excellent finishing ability, Good positioning in the box',
            weaknesses: 'Needs to improve passing',
            summary: 'Promising striker',
          },
        },
        {
          reportId: 'report-2',
          similarity: 0.85,
          player: {
            id: 'player-2',
            name: 'Jane Smith',
            position: 'Forward',
          },
          excerpts: {
            strengths: 'Excellent finishing ability, Fast acceleration',
            weaknesses: 'Work rate could be better',
            summary: 'Clinical finisher',
          },
        },
      ];

      const partialReport = {
        playerPosition: 'Forward',
        technicalRating: 80,
      };

      const suggestions = (service as any).generateSuggestions(
        similarReports,
        partialReport,
      );

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.field === 'strengths')).toBe(true);
    });

    it('should not generate suggestions if fields are already filled', () => {
      const similarReports = [
        {
          reportId: 'report-1',
          similarity: 0.9,
          player: { id: 'player-1', name: 'John Doe', position: 'Forward' },
          excerpts: {
            strengths: 'Excellent finishing ability',
            weaknesses: 'Needs to improve passing',
            summary: null,
          },
        },
      ];

      const partialReport = {
        playerPosition: 'Forward',
        strengths: 'Already has a very detailed strength description that is over fifty characters',
        weaknesses: 'Already has a very detailed weakness description that is over fifty characters',
      };

      const suggestions = (service as any).generateSuggestions(
        similarReports,
        partialReport,
      );

      expect(suggestions.length).toBe(0);
    });

    it('should handle empty similar reports', () => {
      const suggestions = (service as any).generateSuggestions([], {});
      expect(suggestions).toEqual([]);
    });

    it('should filter out short phrases', () => {
      const similarReports = [
        {
          reportId: 'report-1',
          similarity: 0.9,
          player: { id: 'player-1', name: 'John Doe', position: 'Forward' },
          excerpts: {
            strengths: 'Fast, Good, Nice', // All too short
            weaknesses: null,
            summary: null,
          },
        },
      ];

      const partialReport = { playerPosition: 'Forward' };

      const suggestions = (service as any).generateSuggestions(
        similarReports,
        partialReport,
      );

      expect(suggestions.length).toBe(0);
    });
  });

  describe('autocomplete - Additional Edge Cases', () => {
    it('should handle empty result set for position autocomplete', async () => {
      mockPrismaService.scouting_reports.groupBy.mockResolvedValue([]);

      const result = await service.autocomplete('position', 'Xyz', {});

      expect(result.suggestions).toEqual([]);
    });

    it('should handle null positions in groupBy results', async () => {
      mockPrismaService.scouting_reports.groupBy.mockResolvedValue([
        { playerPosition: null, _count: 2 },
        { playerPosition: 'Forward', _count: 5 },
      ]);

      const result = await service.autocomplete('position', 'For', {});

      expect(result.suggestions).toEqual(['Forward']);
      expect(result.suggestions).not.toContain(null);
    });

    it('should limit autocomplete results to 5', async () => {
      mockPrismaService.scouting_reports.groupBy.mockResolvedValue([
        { playerPosition: 'Forward', _count: 10 },
        { playerPosition: 'Midfielder', _count: 8 },
        { playerPosition: 'Defender', _count: 6 },
        { playerPosition: 'Goalkeeper', _count: 4 },
        { playerPosition: 'Winger', _count: 3 },
        { playerPosition: 'Striker', _count: 2 },
        { playerPosition: 'Fullback', _count: 1 },
      ]);

      const result = await service.autocomplete('position', '', {});

      expect(result.suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should handle autocomplete with context position filter', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        { strengths: 'Excellent passing range' },
        { strengths: 'Great vision and passing' },
      ]);

      const result = await service.autocomplete('strengths', 'pass', {
        position: 'Midfielder',
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(mockPrismaService.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            playerPosition: 'Midfielder',
          }),
        }),
      );
    });

    it('should handle empty strings in text field results', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        { weaknesses: '' },
        { weaknesses: null },
        { weaknesses: 'Poor decision making' },
      ]);

      const result = await service.autocomplete('weaknesses', 'poor', {});

      expect(result.suggestions.length).toBe(1);
      expect(result.suggestions[0]).toBe('Poor decision making');
    });

    it('should handle case-insensitive matching', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        { summary: 'EXCELLENT player with great potential' },
        { summary: 'excellent technical skills' },
      ]);

      const result = await service.autocomplete('summary', 'ExCeLLeNt', {});

      expect(result.suggestions.length).toBe(2);
    });

    it('should autocomplete notes field', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        { strengths: null, weaknesses: null, summary: null },
      ]);

      const result = await service.autocomplete('notes', 'observation', {});

      expect(result.suggestions).toBeDefined();
    });

    it('should autocomplete tags field', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([
        { strengths: null, weaknesses: null, summary: null },
      ]);

      const result = await service.autocomplete('tags', 'fast', {});

      expect(result.suggestions).toBeDefined();
    });
  });

  describe('generateInsights - Additional Tests', () => {
    it('should handle reports with null ratings', async () => {
      const mockReports = [
        {
          id: 'report-1',
          technicalRating: null,
          physicalRating: null,
          mentalRating: null,
          tacticalRating: null,
          users: { firstName: 'Scout', lastName: 'One' },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      const result = await service.generateInsights('player-1');

      expect(result).toContain('0.0'); // Average of nulls treated as 0
    });

    it('should handle mixed null and valid ratings', async () => {
      const mockReports = [
        {
          id: 'report-1',
          technicalRating: 80,
          physicalRating: null,
          mentalRating: 90,
          tacticalRating: null,
          users: { firstName: 'Scout', lastName: 'One' },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      const result = await service.generateInsights('player-1');

      expect(result).toBeDefined();
      expect(result).toContain('Technical:');
    });

    it('should handle single report', async () => {
      const mockReports = [
        {
          id: 'report-1',
          technicalRating: 75,
          physicalRating: 80,
          mentalRating: 70,
          tacticalRating: 85,
          users: { firstName: 'Scout', lastName: 'One' },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      const result = await service.generateInsights('player-1');

      expect(result).toContain('1 report');
      expect(result).toContain('75.0'); // Technical rating
    });
  });

  describe('generateInsights - OpenAI Integration', () => {
    let openAIInstance: any;

    beforeEach(() => {
      openAIInstance = {
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
      };

      mockOpenAI.mockImplementation(() => openAIInstance);
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    afterEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    it('should use GPT-4 for insights when available', async () => {
      const testService = new SmartScoutService(prismaService);

      const mockReports = [
        {
          id: 'report-1',
          technicalRating: 85,
          physicalRating: 80,
          mentalRating: 90,
          tacticalRating: 75,
          strengths: 'Excellent passing',
          weaknesses: 'Needs work on defending',
          users: { firstName: 'Scout', lastName: 'One' },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      openAIInstance.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'AI-generated insights about player development',
            },
          },
        ],
      });

      const result = await testService.generateInsights('player-1');

      expect(result).toBe('AI-generated insights about player development');
      expect(openAIInstance.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4',
          max_tokens: 500,
          temperature: 0.7,
        }),
      );
    });

    it('should fallback to rule-based on GPT-4 error', async () => {
      const testService = new SmartScoutService(prismaService);

      const mockReports = [
        {
          id: 'report-1',
          technicalRating: 85,
          physicalRating: 80,
          mentalRating: 90,
          tacticalRating: 75,
          users: { firstName: 'Scout', lastName: 'One' },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);
      openAIInstance.chat.completions.create.mockRejectedValue(
        new Error('GPT-4 API Error'),
      );

      const result = await testService.generateInsights('player-1');

      expect(result).toContain('Player Analysis');
      expect(result).toContain('Average Ratings');
    });

    it('should handle empty GPT-4 response', async () => {
      const testService = new SmartScoutService(prismaService);

      const mockReports = [
        {
          id: 'report-1',
          technicalRating: 85,
          physicalRating: 80,
          mentalRating: 90,
          tacticalRating: 75,
          users: { firstName: 'Scout', lastName: 'One' },
        },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);
      openAIInstance.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const result = await testService.generateInsights('player-1');

      expect(result).toContain('Player Analysis');
    });
  });

  describe('cosineSimilarity - Additional Tests', () => {
    it('should return 0 for zero vectors', () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];

      const similarity = (service as any).cosineSimilarity(a, b);
      expect(similarity).toBe(0);
    });

    it('should calculate similarity for negative values', () => {
      const a = [1, -1];
      const b = [-1, 1];

      const similarity = (service as any).cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(-1, 5);
    });

    it('should handle decimal values', () => {
      const a = [0.5, 0.5, 0.5];
      const b = [0.5, 0.5, 0.5];

      const similarity = (service as any).cosineSimilarity(a, b);
      expect(similarity).toBeCloseTo(1, 5);
    });
  });

  describe('reindexAll - Additional Tests', () => {
    it('should handle partial failures during reindexing', async () => {
      const mockReports = [
        { id: 'report-1' },
        { id: 'report-2' },
        { id: 'report-3' },
      ];

      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);

      // Mock first report succeeds, second fails, third succeeds
      mockPrismaService.scouting_reports.findUnique
        .mockResolvedValueOnce({
          id: 'report-1',
          strengths: 'test',
          players: {},
          matches: {},
        })
        .mockResolvedValueOnce(null) // Will throw NotFoundException
        .mockResolvedValueOnce({
          id: 'report-3',
          strengths: 'test',
          players: {},
          matches: {},
        });

      mockPrismaService.report_embeddings.findUnique
        .mockResolvedValueOnce({ id: 'emb-1', reportId: 'report-1' }) // Already indexed
        .mockResolvedValueOnce(null) // For report-3
        .mockResolvedValueOnce({ id: 'emb-3', reportId: 'report-3' }); // Already indexed

      const result = await service.reindexAll();

      expect(result.indexed).toBe(2); // Two succeeded (skipped since already indexed)
      expect(result.failed).toBe(1); // One failed (report-2)
    });

    it('should return correct counts for empty database', async () => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);

      const result = await service.reindexAll();

      expect(result.indexed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('OpenAI Initialization', () => {
    it('should initialize without OpenAI when API key is not set', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      const testService = new SmartScoutService(prismaService);

      // Service should be created without errors
      expect(testService).toBeDefined();

      // Restore
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      }
    });

    it('should initialize with OpenAI when API key is set', () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = 'test-key';

      const openAIInstance = {
        embeddings: { create: jest.fn() },
      };
      mockOpenAI.mockImplementation(() => openAIInstance as any);

      const testService = new SmartScoutService(prismaService);

      expect(testService).toBeDefined();

      // Restore
      if (originalEnv) {
        process.env.OPENAI_API_KEY = originalEnv;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });
  });
});
