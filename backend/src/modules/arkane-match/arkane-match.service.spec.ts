import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { ArkaneMatchService } from './arkane-match.service';
import { MarketplaceService } from '../marketplace/marketplace.service';
import { RedisService } from '../cache/redis.service';
import { IntentType } from './dto/chat.dto';
import { Conversation, ConversationMessage } from './dto/conversation.dto';

describe('ArkaneMatchService', () => {
  let service: ArkaneMatchService;
  let marketplaceService: jest.Mocked<MarketplaceService>;
  let redisService: jest.Mocked<RedisService>;
  let configService: jest.Mocked<ConfigService>;

  // Mock data
  const mockUserId = 'user-123';
  const mockConversationId = 'conv-456';

  const mockScout: any = {
    id: 'scout-1',
    userId: 'user-1',
    users: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    headline: 'LaLiga specialist with 10 years experience',
    bio: 'Experienced scout with deep knowledge of LaLiga',
    hourlyRate: 120,
    matchRate: 500,
    reportRate: 250,
    currency: 'EUR',
    languages: ['English', 'Spanish'],
    isVerified: true,
    verifiedAt: new Date(),
    featuredUntil: null,
    expertise: {
      leagues: ['LaLiga', 'Premier League'],
      positions: ['CB', 'LB', 'RB'],
    },
    availability: {
      available: true,
    },
    portfolio: null,
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
    marketplace_reviews: [{ rating: 5 }, { rating: 4 }],
    stats: {
      avgRating: 4.5,
      totalReviews: 25,
    },
  };

  const mockSearchResult = {
    data: [mockScout],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArkaneMatchService,
        {
          provide: MarketplaceService,
          useValue: {
            searchListings: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ArkaneMatchService>(ArkaneMatchService);
    marketplaceService = module.get(MarketplaceService) as jest.Mocked<MarketplaceService>;
    redisService = module.get(RedisService) as jest.Mocked<RedisService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with default conversation TTL', () => {
      expect(service['conversationTTL']).toBe(3600);
    });

    it('should initialize with empty in-memory conversation map', () => {
      expect(service['inMemoryConversations'].size).toBe(0);
    });
  });

  describe('chat', () => {
    describe('New Conversation', () => {
      it('should create new conversation when conversationId is not provided', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'I need a LaLiga scout for defenders',
        });

        expect(result.conversationId).toBeDefined();
        expect(result.intent).toBe(IntentType.SEARCH_SCOUT);
        expect(result.response).toContain('found');
      });

      it('should create conversation with correct user message', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const message = 'Find me a Premier League scout';
        await service.chat(mockUserId, { message });

        // Verify conversation was saved
        expect(redisService.set).toHaveBeenCalled();
        const savedConversation = redisService.set.mock.calls[0][1] as Conversation;
        expect(savedConversation.messages[0].content).toBe(message);
        expect(savedConversation.messages[0].role).toBe('user');
      });
    });

    describe('Existing Conversation', () => {
      it('should retrieve existing conversation when conversationId is provided', async () => {
        const existingConversation: Conversation = {
          id: mockConversationId,
          userId: mockUserId,
          messages: [
            {
              role: 'user',
              content: 'Hello',
              timestamp: new Date(),
            },
          ],
          currentCriteria: { leagues: ['LaLiga'] },
          createdAt: new Date(),
          lastMessageAt: new Date(),
          scoutingHistory: [],
        };

        redisService.get.mockResolvedValue(existingConversation);
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Show me defenders',
          conversationId: mockConversationId,
        });

        expect(result.conversationId).toBe(mockConversationId);
        expect(redisService.get).toHaveBeenCalledWith(
          `arkane-match:conversation:${mockConversationId}`,
        );
      });

      it('should throw BadRequestException if conversation belongs to different user', async () => {
        const existingConversation: Conversation = {
          id: mockConversationId,
          userId: 'different-user',
          messages: [],
          currentCriteria: {},
          createdAt: new Date(),
          lastMessageAt: new Date(),
          scoutingHistory: [],
        };

        redisService.get.mockResolvedValue(existingConversation);

        await expect(
          service.chat(mockUserId, {
            message: 'Hello',
            conversationId: mockConversationId,
          }),
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('Intent Detection', () => {
      it('should detect SEARCH_SCOUT intent', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'I need a scout for LaLiga',
        });

        expect(result.intent).toBe(IntentType.SEARCH_SCOUT);
      });

      it('should detect REFINE_SEARCH intent', async () => {
        const existingConversation: Conversation = {
          id: mockConversationId,
          userId: mockUserId,
          messages: [
            { role: 'user', content: 'Find LaLiga scouts', timestamp: new Date() },
            { role: 'assistant', content: 'Here are some scouts', timestamp: new Date() },
          ],
          currentCriteria: { leagues: ['LaLiga'] },
          createdAt: new Date(),
          lastMessageAt: new Date(),
          scoutingHistory: [],
        };

        redisService.get.mockResolvedValue(existingConversation);
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Actually, I prefer defenders',
          conversationId: mockConversationId,
        });

        expect(result.intent).toBe(IntentType.REFINE_SEARCH);
      });

      it('should detect GET_DETAILS intent', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await service.chat(mockUserId, {
          message: 'Tell me more about this scout',
        });

        expect(result.intent).toBe(IntentType.GET_DETAILS);
      });

      it('should detect COMPARE_SCOUTS intent', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await service.chat(mockUserId, {
          message: 'Compare these two scouts',
        });

        expect(result.intent).toBe(IntentType.COMPARE_SCOUTS);
      });

      it('should detect GENERAL_QUESTION intent', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await service.chat(mockUserId, {
          message: 'How does this platform work?',
        });

        expect(result.intent).toBe(IntentType.GENERAL_QUESTION);
      });
    });

    describe('Criteria Extraction', () => {
      it('should extract league from natural language', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find me a LaLiga scout',
        });

        expect(result.extractedCriteria.leagues).toContain('LaLiga');
      });

      it('should extract multiple leagues', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'I need a scout who knows Premier League and Bundesliga',
        });

        expect(result.extractedCriteria.leagues).toContain('Premier League');
        expect(result.extractedCriteria.leagues).toContain('Bundesliga');
      });

      it('should extract specific positions', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find me a center back specialist',
        });

        expect(result.extractedCriteria.positions).toContain('CB');
      });

      it('should extract general position categories', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'I need a scout for defenders',
        });

        expect(result.extractedCriteria.positions).toEqual(
          expect.arrayContaining(['CB', 'LB', 'RB', 'LWB', 'RWB']),
        );
      });

      it('should extract budget constraints', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find scouts under €150 per hour',
        });

        expect(result.extractedCriteria.maxBudget).toBe(150);
        expect(result.extractedCriteria.currency).toBe('EUR');
      });

      it('should extract budget with different currency symbols', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find scouts under $200',
        });

        expect(result.extractedCriteria.maxBudget).toBe(200);
        expect(result.extractedCriteria.currency).toBe('USD');
      });

      it('should extract minimum rating', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Show me scouts with rating above 4',
        });

        expect(result.extractedCriteria.minRating).toBe(4);
      });

      it('should extract verified requirement', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Only show verified scouts',
        });

        expect(result.extractedCriteria.verifiedOnly).toBe(true);
      });

      it('should extract languages', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find scouts who speak Spanish and English',
        });

        expect(result.extractedCriteria.languages).toContain('Spanish');
        expect(result.extractedCriteria.languages).toContain('English');
      });

      it('should extract countries', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find scouts in Spain',
        });

        expect(result.extractedCriteria.countries).toContain('Spain');
      });

      it('should extract multiple criteria at once', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'I need a verified LaLiga scout for defenders under €150/hr who speaks Spanish',
        });

        expect(result.extractedCriteria.leagues).toContain('LaLiga');
        expect(result.extractedCriteria.positions).toEqual(
          expect.arrayContaining(['CB', 'LB', 'RB']),
        );
        expect(result.extractedCriteria.maxBudget).toBe(150);
        expect(result.extractedCriteria.verifiedOnly).toBe(true);
        expect(result.extractedCriteria.languages).toContain('Spanish');
      });
    });

    describe('Scout Search', () => {
      it('should search for scouts with extracted criteria', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        await service.chat(mockUserId, {
          message: 'Find LaLiga scouts for defenders',
        });

        expect(marketplaceService.searchListings).toHaveBeenCalledWith(
          expect.objectContaining({
            leagues: expect.arrayContaining(['LaLiga']),
            positions: expect.arrayContaining(['CB', 'LB', 'RB']),
            page: 1,
            limit: 10,
          }),
        );
      });

      it('should filter out previously shown scouts', async () => {
        const existingConversation: Conversation = {
          id: mockConversationId,
          userId: mockUserId,
          messages: [],
          currentCriteria: {},
          createdAt: new Date(),
          lastMessageAt: new Date(),
          scoutingHistory: ['scout-1'],
        };

        redisService.get.mockResolvedValue(existingConversation);
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Show me more scouts',
          conversationId: mockConversationId,
        });

        expect(result.scouts).toHaveLength(0); // scout-1 already shown
      });

      it('should return up to 5 scouts in response', async () => {
        const manyScouts = Array.from({ length: 10 }, (_, i) => ({
          ...mockScout,
          id: `scout-${i}`,
        }));

        marketplaceService.searchListings.mockResolvedValue({
          data: manyScouts,
          pagination: {
            page: 1,
            limit: 10,
            total: 10,
            totalPages: 1,
          },
        });

        const result = await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        expect(result.scouts).toHaveLength(5);
      });

      it('should handle search errors gracefully', async () => {
        marketplaceService.searchListings.mockRejectedValue(new Error('Search failed'));

        const result = await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        expect(result.scouts).toHaveLength(0);
        expect(result.response).toBeDefined();
      });
    });

    describe('Response Generation', () => {
      it('should generate response for successful search', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find LaLiga scouts',
        });

        expect(result.response).toContain('found');
        expect(result.response).toContain('John Doe');
      });

      it('should generate no results response', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
        });

        const result = await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        expect(result.response).toContain("couldn't find");
      });

      it('should include scout details in response', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        expect(result.response).toContain('John Doe');
        expect(result.response).toContain('4.5');
        expect(result.response).toContain('EUR120/hr');
        expect(result.response).toContain('Verified');
      });

      it('should generate response for GET_DETAILS intent', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await service.chat(mockUserId, {
          message: 'Tell me more about this scout',
        });

        expect(result.response).toContain('details');
      });

      it('should generate response for COMPARE_SCOUTS intent', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await service.chat(mockUserId, {
          message: 'Compare scouts',
        });

        expect(result.response).toContain('compare');
      });

      it('should generate response for general how-it-works question', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await service.chat(mockUserId, {
          message: 'How does this work?',
        });

        expect(result.response).toContain('ArkaneMatch');
      });

      it('should generate response for capabilities question', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await service.chat(mockUserId, {
          message: 'What can you do?',
        });

        expect(result.response).toContain('help you');
      });

      it('should generate response for pricing question', async () => {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });

        const result = await service.chat(mockUserId, {
          message: 'How much do scouts cost?',
        });

        expect(result.response).toContain('rate');
      });
    });

    describe('Suggestions', () => {
      it('should generate suggestions for incomplete criteria', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find LaLiga scouts',
        });

        expect(result.suggestions).toBeDefined();
        expect(result.suggestions.length).toBeGreaterThan(0);
      });

      it('should suggest budget when not specified', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        expect(result.suggestions.some((s) => s.includes('budget'))).toBe(true);
      });

      it('should suggest narrowing when many results', async () => {
        const manyScouts = Array.from({ length: 10 }, (_, i) => ({
          ...mockScout,
          id: `scout-${i}`,
        }));

        marketplaceService.searchListings.mockResolvedValue({
          data: manyScouts,
          pagination: {
            page: 1,
            limit: 10,
            total: 10,
            totalPages: 1,
          },
        });

        const result = await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        expect(result.suggestions.some((s) => s.includes('narrow'))).toBe(true);
      });
    });

    describe('Conversation Management', () => {
      it('should add both user and assistant messages to conversation', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        const savedConversation = redisService.set.mock.calls[0][1] as Conversation;
        expect(savedConversation.messages).toHaveLength(2);
        expect(savedConversation.messages[0].role).toBe('user');
        expect(savedConversation.messages[1].role).toBe('assistant');
      });

      it('should update lastMessageAt timestamp', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        const savedConversation = redisService.set.mock.calls[0][1] as Conversation;
        expect(savedConversation.lastMessageAt).toBeDefined();
      });

      it('should merge criteria when refining search', async () => {
        const existingConversation: Conversation = {
          id: mockConversationId,
          userId: mockUserId,
          messages: [
            { role: 'user', content: 'Find LaLiga scouts', timestamp: new Date() },
            { role: 'assistant', content: 'Here are some scouts', timestamp: new Date() },
          ],
          currentCriteria: { leagues: ['LaLiga'] },
          createdAt: new Date(),
          lastMessageAt: new Date(),
          scoutingHistory: [],
        };

        redisService.get.mockResolvedValue(existingConversation);
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Actually, I prefer defenders',
          conversationId: mockConversationId,
        });

        expect(result.extractedCriteria.leagues).toContain('LaLiga');
        expect(result.extractedCriteria.positions).toEqual(
          expect.arrayContaining(['CB', 'LB', 'RB']),
        );
      });

      it('should save conversation to Redis with TTL', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        expect(redisService.set).toHaveBeenCalledWith(
          expect.stringContaining('arkane-match:conversation:'),
          expect.any(Object),
          3600,
        );
      });

      it('should save conversation to in-memory cache as fallback', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        const result = await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        expect(service['inMemoryConversations'].has(result.conversationId)).toBe(true);
      });

      it('should track shown scouts in scouting history', async () => {
        marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

        await service.chat(mockUserId, {
          message: 'Find scouts',
        });

        const savedConversation = redisService.set.mock.calls[0][1] as Conversation;
        expect(savedConversation.scoutingHistory).toContain('scout-1');
      });
    });

    describe('Error Handling', () => {
      it('should handle and log errors', async () => {
        const loggerSpy = jest.spyOn(service['logger'], 'error');
        marketplaceService.searchListings.mockRejectedValue(new Error('Test error'));

        const result = await service.chat(mockUserId, { message: 'Find scouts' });

        expect(loggerSpy).toHaveBeenCalled();
        expect(result.scouts).toHaveLength(0);
        expect(result.response).toBeDefined();
      });

      it('should throw error for invalid conversation ownership', async () => {
        const existingConversation: Conversation = {
          id: mockConversationId,
          userId: 'other-user',
          messages: [],
          currentCriteria: {},
          createdAt: new Date(),
          lastMessageAt: new Date(),
          scoutingHistory: [],
        };

        redisService.get.mockResolvedValue(existingConversation);

        await expect(
          service.chat(mockUserId, {
            message: 'Hello',
            conversationId: mockConversationId,
          }),
        ).rejects.toThrow('Conversation does not belong to this user');
      });
    });
  });

  describe('getConversation', () => {
    it('should retrieve conversation from Redis', async () => {
      const mockConversation: Conversation = {
        id: mockConversationId,
        userId: mockUserId,
        messages: [],
        currentCriteria: {},
        createdAt: new Date(),
        lastMessageAt: new Date(),
        scoutingHistory: [],
      };

      redisService.get.mockResolvedValue(mockConversation);

      const result = await service.getConversation(mockConversationId);

      expect(result).toEqual(mockConversation);
      expect(redisService.get).toHaveBeenCalledWith(
        `arkane-match:conversation:${mockConversationId}`,
      );
    });

    it('should fallback to in-memory when Redis returns null', async () => {
      const mockConversation: Conversation = {
        id: mockConversationId,
        userId: mockUserId,
        messages: [],
        currentCriteria: {},
        createdAt: new Date(),
        lastMessageAt: new Date(),
        scoutingHistory: [],
      };

      service['inMemoryConversations'].set(mockConversationId, mockConversation);
      redisService.get.mockResolvedValue(null);

      const result = await service.getConversation(mockConversationId);

      expect(result).toEqual(mockConversation);
    });

    it('should return null when conversation not found', async () => {
      redisService.get.mockResolvedValue(null);

      const result = await service.getConversation('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('clearConversation', () => {
    it('should delete conversation from Redis and in-memory cache', async () => {
      const mockConversation: Conversation = {
        id: mockConversationId,
        userId: mockUserId,
        messages: [],
        currentCriteria: {},
        createdAt: new Date(),
        lastMessageAt: new Date(),
        scoutingHistory: [],
      };

      service['inMemoryConversations'].set(mockConversationId, mockConversation);
      redisService.get.mockResolvedValue(mockConversation);

      await service.clearConversation(mockConversationId, mockUserId);

      expect(redisService.del).toHaveBeenCalledWith(
        `arkane-match:conversation:${mockConversationId}`,
      );
      expect(service['inMemoryConversations'].has(mockConversationId)).toBe(false);
    });

    it('should throw error if conversation belongs to different user', async () => {
      const mockConversation: Conversation = {
        id: mockConversationId,
        userId: 'different-user',
        messages: [],
        currentCriteria: {},
        createdAt: new Date(),
        lastMessageAt: new Date(),
        scoutingHistory: [],
      };

      redisService.get.mockResolvedValue(mockConversation);

      await expect(service.clearConversation(mockConversationId, mockUserId)).rejects.toThrow(
        'Conversation does not belong to this user',
      );
    });

    it('should handle clearing non-existent conversation', async () => {
      redisService.get.mockResolvedValue(null);

      await service.clearConversation('non-existent', mockUserId);

      expect(redisService.del).toHaveBeenCalled();
    });
  });

  describe('getInfo', () => {
    it('should return service information', () => {
      const info = service.getInfo();

      expect(info.serviceName).toBe('ArkaneMatch');
      expect(info.version).toBe('1.0.0');
      expect(info.capabilities).toBeInstanceOf(Array);
      expect(info.capabilities.length).toBeGreaterThan(0);
    });

    it('should indicate OpenAI when API key is configured', () => {
      configService.get.mockReturnValue('test-openai-key');

      const info = service.getInfo();

      expect(info.aiProvider).toBe('OpenAI GPT-4');
    });

    it('should indicate Anthropic when API key is configured', () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'OPENAI_API_KEY') return null;
        if (key === 'ANTHROPIC_API_KEY') return 'test-anthropic-key';
        return null;
      });

      const info = service.getInfo();

      expect(info.aiProvider).toBe('Anthropic Claude');
    });

    it('should indicate rule-based fallback when no AI keys configured', () => {
      configService.get.mockReturnValue(null);

      const info = service.getInfo();

      expect(info.aiProvider).toBe('Rule-based fallback');
    });

    it('should return rate limit configuration', () => {
      configService.get.mockImplementation((key: string, defaultValue: any) => defaultValue);

      const info = service.getInfo();

      expect(info.rateLimit).toEqual({
        perMinute: 20,
        perHour: 100,
      });
    });

    it('should return supported languages', () => {
      const info = service.getInfo();

      expect(info.supportedLanguages).toContain('English');
    });
  });

  describe('In-Memory Conversation Cleanup', () => {
    it('should limit in-memory conversations to 100', async () => {
      // Create 101 conversations
      for (let i = 0; i < 101; i++) {
        marketplaceService.searchListings.mockResolvedValue({
          data: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        });
        await service.chat(`user-${i}`, { message: 'Test' });
      }

      expect(service['inMemoryConversations'].size).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty message gracefully', async () => {
      marketplaceService.searchListings.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await service.chat(mockUserId, {
        message: '',
      });

      expect(result).toBeDefined();
      expect(result.conversationId).toBeDefined();
    });

    it('should handle very long messages', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const longMessage = 'I need a scout '.repeat(100);
      const result = await service.chat(mockUserId, {
        message: longMessage,
      });

      expect(result).toBeDefined();
    });

    it('should handle special characters in messages', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const result = await service.chat(mockUserId, {
        message: 'Find scouts with €150 budget & verified ⭐⭐⭐⭐⭐',
      });

      expect(result).toBeDefined();
    });

    it('should handle case-insensitive league matching', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const result = await service.chat(mockUserId, {
        message: 'Find LALIGA scouts',
      });

      expect(result.extractedCriteria.leagues).toContain('LaLiga');
    });

    it('should handle position abbreviations', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const result = await service.chat(mockUserId, {
        message: 'Find scouts for CB and LB positions',
      });

      expect(result.extractedCriteria.positions).toContain('CB');
      expect(result.extractedCriteria.positions).toContain('LB');
    });

    it('should deduplicate positions when multiple patterns match', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const result = await service.chat(mockUserId, {
        message: 'Find striker and forward specialists',
      });

      const positions = result.extractedCriteria.positions || [];
      const uniquePositions = [...new Set(positions)];
      expect(positions.length).toBe(uniquePositions.length);
    });

    it('should handle no-results with specific suggestions', async () => {
      marketplaceService.searchListings.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      });

      const result = await service.chat(mockUserId, {
        message: 'Find verified scouts under €50 with rating above 4',
      });

      expect(result.response).toContain("couldn't find");
      expect(result.response).toContain('budget');
    });

    it('should handle refinement without previous criteria', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const result = await service.chat(mockUserId, {
        message: 'Actually, show me defenders',
      });

      expect(result.extractedCriteria).toBeDefined();
    });
  });

  describe('NLU Pattern Matching', () => {
    it('should match Serie A with variations', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const result = await service.chat(mockUserId, {
        message: 'Find seria a scouts', // Common misspelling
      });

      expect(result.extractedCriteria.leagues).toContain('Serie A');
    });

    it('should match goalkeeper with multiple keywords', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const testCases = ['goalkeeper', 'keeper', 'gk', 'goalie'];

      for (const keyword of testCases) {
        const result = await service.chat(mockUserId, {
          message: `Find ${keyword} specialists`,
        });

        expect(result.extractedCriteria.positions).toContain('GK');
      }
    });

    it('should extract budget with various formats', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const testCases = [
        { message: 'under €150', expected: 150, currency: 'EUR' },
        { message: 'below $200', expected: 200, currency: 'USD' },
        { message: 'max £100', expected: 100, currency: 'GBP' },
        { message: 'maximum 300', expected: 300, currency: 'EUR' },
      ];

      for (const testCase of testCases) {
        const result = await service.chat(mockUserId, {
          message: testCase.message,
        });

        expect(result.extractedCriteria.maxBudget).toBe(testCase.expected);
        if (result.extractedCriteria.currency) {
          expect(result.extractedCriteria.currency).toBe(testCase.currency);
        }
      }
    });
  });

  describe('Response Formatting', () => {
    it('should format scout response with all details', async () => {
      marketplaceService.searchListings.mockResolvedValue(mockSearchResult);

      const result = await service.chat(mockUserId, {
        message: 'Find scouts',
      });

      expect(result.response).toContain('John Doe');
      expect(result.response).toContain('LaLiga specialist');
      expect(result.response).toContain('4.5');
      expect(result.response).toContain('EUR120/hr');
      expect(result.response).toContain('Verified');
    });

    it('should handle scouts without ratings', async () => {
      const scoutWithoutRating = {
        ...mockScout,
        stats: {},
      };

      marketplaceService.searchListings.mockResolvedValue({
        data: [scoutWithoutRating],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      const result = await service.chat(mockUserId, {
        message: 'Find scouts',
      });

      expect(result.response).toBeDefined();
    });

    it('should indicate when more scouts available', async () => {
      const manyScouts = Array.from({ length: 10 }, (_, i) => ({
        ...mockScout,
        id: `scout-${i}`,
      }));

      marketplaceService.searchListings.mockResolvedValue({
        data: manyScouts,
        pagination: {
          page: 1,
          limit: 10,
          total: 10,
          totalPages: 1,
        },
      });

      const result = await service.chat(mockUserId, {
        message: 'Find scouts',
      });

      expect(result.response).toContain('more scout');
    });
  });
});
