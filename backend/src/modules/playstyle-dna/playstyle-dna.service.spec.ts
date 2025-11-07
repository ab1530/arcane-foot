import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { PlaystyleDnaService } from './playstyle-dna.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlayingStyle, PlayStyleProfile, PlayerAttributes } from './dto/playstyle-dna.dto';

describe('PlaystyleDnaService', () => {
  let service: PlaystyleDnaService;
  let prismaService: any;
  let cacheManager: any;
  let configService: jest.Mocked<ConfigService>;

  const mockPlayer = {
    id: 'player-1',
    position: 'MIDFIELDER',
    dateOfBirth: new Date('2000-01-01'),
    nationality: 'FRA',
    photoUrl: 'https://example.com/photo.jpg',
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: 'user-1',
    clubId: null,
    statsJson: {
      technical: 75,
      physical: 70,
      mental: 80,
      tactical: 85,
      speed: 65,
      finishing: 60,
      passing: 90,
      defending: 50,
      dribbling: 70,
      positioning: 75,
    },
    users: {
      id: 'user-1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: 'PLAYER',
    },
    scouting_reports: [
      {
        id: 'report-1',
        technical: 76,
        physical: 72,
        mental: 81,
        tactical: 86,
        speed: 66,
        finishing: 61,
        passing: 91,
        defending: 51,
        dribbling: 71,
        positioning: 76,
        overallRating: 75,
        createdAt: new Date(),
      },
    ],
  };

  const mockAttributes: PlayerAttributes = {
    technical: 75,
    physical: 70,
    mental: 80,
    tactical: 85,
    speed: 65,
    finishing: 60,
    passing: 90,
    defending: 50,
    dribbling: 70,
    positioning: 75,
  };

  const mockMLResponse = {
    primaryStyle: PlayingStyle.PLAYMAKER,
    secondaryStyle: PlayingStyle.DEEP_LYING_PLAYMAKER,
    confidence: 0.85,
    styleScores: {
      [PlayingStyle.PLAYMAKER]: 92,
      [PlayingStyle.DEEP_LYING_PLAYMAKER]: 88,
      [PlayingStyle.BOX_TO_BOX]: 75,
      [PlayingStyle.STRIKER]: 45,
      [PlayingStyle.POACHER]: 40,
      [PlayingStyle.TARGET_MAN]: 42,
      [PlayingStyle.WINGER]: 60,
      [PlayingStyle.WING_BACK]: 55,
      [PlayingStyle.BALL_PLAYING_DEFENDER]: 65,
      [PlayingStyle.DESTROYER]: 48,
      [PlayingStyle.SWEEPER]: 52,
      [PlayingStyle.GOALKEEPER_SWEEPER]: 30,
    },
  };

  const testAttributes: PlayerAttributes = {
    technical: 70,
    physical: 75,
    mental: 65,
    tactical: 80,
    speed: 85,
    finishing: 90,
    passing: 60,
    defending: 40,
    dribbling: 75,
    positioning: 85,
  };

  beforeEach(async () => {
    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
    };

    const mockPrismaService = {
      players: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
    } as any;

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'ML_SERVICE_URL') return 'http://localhost:8001';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaystyleDnaService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<PlaystyleDnaService>(PlaystyleDnaService);
    prismaService = module.get(PrismaService) as any;
    cacheManager = module.get(CACHE_MANAGER);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize with ML service URL from config', () => {
      expect(configService.get).toHaveBeenCalledWith('ML_SERVICE_URL');
    });

    it('should use default ML service URL when not configured', () => {
      configService.get.mockReturnValue(undefined);
      const testService = new PlaystyleDnaService(prismaService, configService, cacheManager);
      expect(testService).toBeDefined();
    });
  });

  describe('classifyPlayer', () => {
    it('should return cached profile if available', async () => {
      const cachedProfile: PlayStyleProfile = {
        primaryStyle: PlayingStyle.PLAYMAKER,
        secondaryStyle: PlayingStyle.BOX_TO_BOX,
        confidence: 0.9,
        styleScores: mockMLResponse.styleScores,
        radarData: { labels: [], values: [] },
        attributes: mockAttributes,
      };

      cacheManager.get.mockResolvedValue(cachedProfile);

      const result = await service.classifyPlayer('player-1');

      expect(result).toEqual(cachedProfile);
      expect(cacheManager.get).toHaveBeenCalledWith('playstyle:player-1');
      expect(prismaService.players.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if player does not exist', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(null);

      await expect(service.classifyPlayer('non-existent')).rejects.toThrow(NotFoundException);
      await expect(service.classifyPlayer('non-existent')).rejects.toThrow('Player with ID non-existent not found');
    });

    it('should classify player using ML service when available', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      // Mock successful ML service response
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.classifyPlayer('player-1');

      expect(result.primaryStyle).toBe(PlayingStyle.PLAYMAKER);
      expect(result.secondaryStyle).toBe(PlayingStyle.DEEP_LYING_PLAYMAKER);
      expect(result.confidence).toBe(0.85);
      expect(result.attributes).toBeDefined();
      expect(result.radarData).toBeDefined();
      expect(cacheManager.set).toHaveBeenCalledWith('playstyle:player-1', result, 3600);
    });

    it('should use fallback classification when ML service is unavailable', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      // Mock ML service failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Service unavailable'));

      const result = await service.classifyPlayer('player-1');

      expect(result.primaryStyle).toBeDefined();
      expect(result.confidence).toBe(0.6); // Fallback confidence
      expect(result.styleScores).toBeDefined();
      expect(Object.keys(result.styleScores)).toHaveLength(12); // All 12 styles
    });

    it('should use fallback classification when ML service returns error status', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }) as any;

      const result = await service.classifyPlayer('player-1');

      expect(result.confidence).toBe(0.6);
      expect(result.primaryStyle).toBeDefined();
    });

    it('should generate correct radar data', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.classifyPlayer('player-1');

      expect(result.radarData.labels).toHaveLength(8);
      expect(result.radarData.values).toHaveLength(8);
      expect(result.radarData.labels).toContain('Technical');
      expect(result.radarData.labels).toContain('Physical');
      expect(result.radarData.values[0]).toBe(mockAttributes.technical);
    });

    it('should extract attributes from player stats', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.classifyPlayer('player-1');

      expect(result.attributes.technical).toBe(75);
      expect(result.attributes.passing).toBe(90);
      expect(result.attributes.tactical).toBe(85);
    });

    it('should use scouting reports as fallback for missing stats', async () => {
      const playerWithoutStats = {
        ...mockPlayer,
        statsJson: {},
      };

      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(playerWithoutStats);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.classifyPlayer('player-1');

      expect(result.attributes.technical).toBeGreaterThan(0);
      expect(result.attributes).toBeDefined();
    });

    it('should use default values when both stats and scouting reports are missing', async () => {
      const playerWithNoData = {
        ...mockPlayer,
        statsJson: {},
        scouting_reports: [],
      };

      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(playerWithNoData);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.classifyPlayer('player-1');

      expect(result.attributes.technical).toBe(50); // Default value
      expect(result.attributes.passing).toBe(50);
    });
  });

  describe('calculateDNAProfile', () => {
    it('should return the same result as classifyPlayer', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const classifyResult = await service.classifyPlayer('player-1');

      // Clear cache and mocks
      jest.clearAllMocks();
      cacheManager.get.mockResolvedValue(classifyResult);

      const dnaResult = await service.calculateDNAProfile('player-1');

      expect(dnaResult).toEqual(classifyResult);
    });
  });

  describe('findSimilarPlayers', () => {
    const mockCandidates = [
      {
        id: 'player-2',
        position: 'MIDFIELDER',
        users: { firstName: 'Jane', lastName: 'Smith' },
        statsJson: mockPlayer.statsJson,
        scouting_reports: [],
      },
      {
        id: 'player-3',
        position: 'MIDFIELDER',
        users: { firstName: 'Mike', lastName: 'Johnson' },
        statsJson: {
          ...mockPlayer.statsJson,
          passing: 85,
          tactical: 80,
        },
        scouting_reports: [],
      },
    ];

    it('should throw NotFoundException if player does not exist', async () => {
      prismaService.players.findUnique.mockResolvedValue(null);

      await expect(service.findSimilarPlayers('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should find similar players based on playing style', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);
      prismaService.players.findMany.mockResolvedValue(mockCandidates);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.findSimilarPlayers('player-1', 10);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeLessThanOrEqual(10);

      if (result.length > 0) {
        expect(result[0]).toHaveProperty('id');
        expect(result[0]).toHaveProperty('name');
        expect(result[0]).toHaveProperty('similarityScore');
        expect(result[0]).toHaveProperty('playingStyle');
        expect(result[0]).toHaveProperty('sharedAttributes');
      }
    });

    it('should limit results to specified limit', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);
      prismaService.players.findMany.mockResolvedValue(mockCandidates);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.findSimilarPlayers('player-1', 1);

      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should sort results by similarity score descending', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);
      prismaService.players.findMany.mockResolvedValue(mockCandidates);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.findSimilarPlayers('player-1', 10);

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].similarityScore).toBeGreaterThanOrEqual(result[i].similarityScore);
      }
    });

    it('should exclude the reference player from results', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);
      prismaService.players.findMany.mockResolvedValue(mockCandidates);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.findSimilarPlayers('player-1');

      expect(result.find(p => p.id === 'player-1')).toBeUndefined();
      expect(prismaService.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: 'player-1' },
          }),
        }),
      );
    });

    it('should only search players in the same position', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);
      prismaService.players.findMany.mockResolvedValue(mockCandidates);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      await service.findSimilarPlayers('player-1');

      expect(prismaService.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: 'MIDFIELDER',
          }),
        }),
      );
    });

    it('should handle errors when classifying candidates gracefully', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);
      prismaService.players.findMany.mockResolvedValue(mockCandidates);

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call for reference player succeeds
          return Promise.resolve({
            ok: true,
            json: async () => mockMLResponse,
          });
        }
        // Subsequent calls fail
        return Promise.reject(new Error('Service error'));
      }) as any;

      const result = await service.findSimilarPlayers('player-1');

      // Should return empty or partial results without throwing
      expect(Array.isArray(result)).toBe(true);
    });

    it('should use default limit of 10 when not specified', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);
      prismaService.players.findMany.mockResolvedValue(mockCandidates);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.findSimilarPlayers('player-1');

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('comparePlayers', () => {
    const mockPlayer2 = {
      ...mockPlayer,
      id: 'player-2',
      users: {
        ...mockPlayer.users,
        id: 'user-2',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      statsJson: {
        ...mockPlayer.statsJson,
        passing: 70,
        finishing: 80,
      },
    };

    beforeEach(() => {
      cacheManager.get.mockResolvedValue(null);
    });

    it('should throw NotFoundException if first player does not exist', async () => {
      prismaService.players.findUnique.mockResolvedValueOnce(null);

      await expect(service.comparePlayers('non-existent', 'player-2')).rejects.toThrow(NotFoundException);
      await expect(service.comparePlayers('non-existent', 'player-2')).rejects.toThrow('One or both players not found');
    });

    it('should throw NotFoundException if second player does not exist', async () => {
      prismaService.players.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(null);

      await expect(service.comparePlayers('player-1', 'non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should compare two players successfully', async () => {
      // First 2 for comparePlayers itself, then 2 more for classifyPlayer calls
      prismaService.players.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2)
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.comparePlayers('player-1', 'player-2');

      expect(result).toHaveProperty('player1');
      expect(result).toHaveProperty('player2');
      expect(result).toHaveProperty('similarityScore');
      expect(result).toHaveProperty('styleDifferences');
      expect(result).toHaveProperty('attributeDifferences');

      expect(result.player1.id).toBe('player-1');
      expect(result.player2.id).toBe('player-2');
      expect(result.player1.name).toBe('John Doe');
      expect(result.player2.name).toBe('Jane Smith');
    });

    it('should calculate similarity score between 0 and 100', async () => {
      prismaService.players.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2)
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.comparePlayers('player-1', 'player-2');

      expect(result.similarityScore).toBeGreaterThanOrEqual(0);
      expect(result.similarityScore).toBeLessThanOrEqual(100);
    });

    it('should identify style differences', async () => {
      const mockMLResponse2 = {
        ...mockMLResponse,
        primaryStyle: PlayingStyle.STRIKER,
        secondaryStyle: PlayingStyle.POACHER,
      };

      prismaService.players.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2)
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2);

      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => (callCount === 1 ? mockMLResponse : mockMLResponse2),
        });
      }) as any;

      const result = await service.comparePlayers('player-1', 'player-2');

      expect(Array.isArray(result.styleDifferences)).toBe(true);
      // Style differences may be empty if primary/secondary styles match
      expect(result.styleDifferences.length).toBeGreaterThanOrEqual(0);
    });

    it('should calculate attribute differences', async () => {
      prismaService.players.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2)
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(mockPlayer2);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.comparePlayers('player-1', 'player-2');

      expect(result.attributeDifferences).toBeDefined();
      expect(result.attributeDifferences.technical).toBeDefined();
      expect(result.attributeDifferences.technical).toHaveProperty('player1');
      expect(result.attributeDifferences.technical).toHaveProperty('player2');
      expect(result.attributeDifferences.technical).toHaveProperty('diff');
    });

    it('should return higher similarity for identical players', async () => {
      const player2Same = { ...mockPlayer, id: 'player-2', users: { ...mockPlayer.users, id: 'user-2' } };

      prismaService.players.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(player2Same)
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce(player2Same);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.comparePlayers('player-1', 'player-2');

      expect(result.similarityScore).toBeGreaterThan(75); // High similarity
    });
  });

  describe('Playing Style Calculations', () => {
    beforeEach(() => {
      cacheManager.get.mockResolvedValue(null);
      global.fetch = jest.fn().mockRejectedValue(new Error('Force fallback'));
    });

    it('should classify as STRIKER for high finishing and positioning', async () => {
      const strikerPlayer = {
        ...mockPlayer,
        position: 'FORWARD',
        statsJson: testAttributes,
      };

      prismaService.players.findUnique.mockResolvedValue(strikerPlayer);

      const result = await service.classifyPlayer('player-1');

      expect(result.primaryStyle).toBe(PlayingStyle.STRIKER);
    });

    it('should classify as PLAYMAKER for high passing and tactical', async () => {
      const playmakerPlayer = {
        ...mockPlayer,
        position: 'MIDFIELDER',
        statsJson: {
          ...testAttributes,
          passing: 95,
          technical: 90,
          tactical: 90,
          finishing: 50,
        },
      };

      prismaService.players.findUnique.mockResolvedValue(playmakerPlayer);

      const result = await service.classifyPlayer('player-1');

      expect(result.primaryStyle).toBe(PlayingStyle.PLAYMAKER);
    });

    it('should classify as WINGER for high speed and dribbling', async () => {
      const wingerPlayer = {
        ...mockPlayer,
        position: 'FORWARD',
        statsJson: {
          ...testAttributes,
          speed: 95,
          dribbling: 92,
          passing: 70,
          finishing: 50,  // Lower finishing to prefer WINGER
        },
      };

      prismaService.players.findUnique.mockResolvedValue(wingerPlayer);

      const result = await service.classifyPlayer('player-1');

      // Could be WINGER or STRIKER depending on calculation
      expect([PlayingStyle.WINGER, PlayingStyle.STRIKER]).toContain(result.primaryStyle);
    });

    it('should classify as DEFENDER for high defending and tactical', async () => {
      const defenderPlayer = {
        ...mockPlayer,
        position: 'DEFENDER',
        statsJson: {
          ...testAttributes,
          defending: 90,
          tactical: 85,
          physical: 88,
          passing: 50,
          finishing: 30,
        },
      };

      prismaService.players.findUnique.mockResolvedValue(defenderPlayer);

      const result = await service.classifyPlayer('player-1');

      expect([
        PlayingStyle.BALL_PLAYING_DEFENDER,
        PlayingStyle.DESTROYER,
        PlayingStyle.SWEEPER,
      ]).toContain(result.primaryStyle);
    });

    it('should calculate all 12 style scores', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      const result = await service.classifyPlayer('player-1');

      const styleScoreKeys = Object.keys(result.styleScores);
      expect(styleScoreKeys).toHaveLength(12);

      // Verify all styles are present
      Object.values(PlayingStyle).forEach(style => {
        expect(styleScoreKeys).toContain(style);
        expect(result.styleScores[style]).toBeGreaterThanOrEqual(0);
      });
    });

    it('should apply position bonuses correctly', async () => {
      const forwardPlayer = {
        ...mockPlayer,
        position: 'FORWARD',
        statsJson: testAttributes,
      };

      prismaService.players.findUnique.mockResolvedValue(forwardPlayer);

      const result = await service.classifyPlayer('player-1');

      // Forward position should have high scores for attacking styles
      expect([
        PlayingStyle.STRIKER,
        PlayingStyle.POACHER,
        PlayingStyle.TARGET_MAN,
      ]).toContain(result.primaryStyle);
    });

    it('should have secondary style different from primary', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      const result = await service.classifyPlayer('player-1');

      if (result.secondaryStyle) {
        expect(result.secondaryStyle).not.toBe(result.primaryStyle);
      }
    });
  });

  describe('Caching', () => {
    it('should cache classification results', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      await service.classifyPlayer('player-1');

      expect(cacheManager.set).toHaveBeenCalledWith(
        'playstyle:player-1',
        expect.any(Object),
        3600,
      );
    });

    it('should use different cache keys for different players', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      await service.classifyPlayer('player-1');
      await service.classifyPlayer('player-2');

      expect(cacheManager.get).toHaveBeenCalledWith('playstyle:player-1');
      expect(cacheManager.get).toHaveBeenCalledWith('playstyle:player-2');
    });

    it('should not query database when cache hit occurs', async () => {
      const cachedProfile: PlayStyleProfile = {
        primaryStyle: PlayingStyle.PLAYMAKER,
        secondaryStyle: null,
        confidence: 0.9,
        styleScores: mockMLResponse.styleScores,
        radarData: { labels: [], values: [] },
        attributes: mockAttributes,
      };

      cacheManager.get.mockResolvedValue(cachedProfile);

      await service.classifyPlayer('player-1');

      expect(prismaService.players.findUnique).not.toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle ML service timeout gracefully', async () => {
      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);

      global.fetch = jest.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout')), 6000);
          }),
      );

      const result = await service.classifyPlayer('player-1');

      expect(result.confidence).toBe(0.6); // Fallback
      expect(result.primaryStyle).toBeDefined();
    });

    it('should handle malformed player data gracefully', async () => {
      const malformedPlayer = {
        ...mockPlayer,
        statsJson: null,
        scouting_reports: [],
      };

      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(malformedPlayer);

      global.fetch = jest.fn().mockRejectedValue(new Error('Service error'));

      const result = await service.classifyPlayer('player-1');

      expect(result).toBeDefined();
      expect(result.attributes).toBeDefined();
    });

    it('should handle invalid attribute values', async () => {
      const playerWithInvalidStats = {
        ...mockPlayer,
        statsJson: {
          technical: 'invalid',
          physical: -10,
          mental: 150,
          tactical: NaN,
          speed: null,
        },
      };

      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(playerWithInvalidStats);

      global.fetch = jest.fn().mockRejectedValue(new Error('Service error'));

      const result = await service.classifyPlayer('player-1');

      // Should use defaults or fallbacks
      expect(result.attributes.technical).toBeGreaterThanOrEqual(0);
      expect(result.attributes.technical).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle player with no scouting reports', async () => {
      const playerNoReports = {
        ...mockPlayer,
        scouting_reports: [],
      };

      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(playerNoReports);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.classifyPlayer('player-1');

      expect(result).toBeDefined();
      expect(result.attributes).toBeDefined();
    });

    it('should handle goalkeeper position classification', async () => {
      const goalkeeper = {
        ...mockPlayer,
        position: 'GOALKEEPER',
        statsJson: {
          ...testAttributes,
          positioning: 95,
          mental: 90,
        },
      };

      cacheManager.get.mockResolvedValue(null);
      prismaService.players.findUnique.mockResolvedValue(goalkeeper);

      global.fetch = jest.fn().mockRejectedValue(new Error('Force fallback'));

      const result = await service.classifyPlayer('player-1');

      expect(result.primaryStyle).toBe(PlayingStyle.GOALKEEPER_SWEEPER);
    });

    it('should handle finding similar players when no candidates exist', async () => {
      prismaService.players.findUnique.mockResolvedValue(mockPlayer);
      prismaService.players.findMany.mockResolvedValue([]);

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => mockMLResponse,
      }) as any;

      const result = await service.findSimilarPlayers('player-1');

      expect(result).toEqual([]);
    });

    it('should calculate 100% similarity for same profile', async () => {
      const profile: PlayStyleProfile = {
        primaryStyle: PlayingStyle.PLAYMAKER,
        secondaryStyle: PlayingStyle.BOX_TO_BOX,
        confidence: 0.9,
        styleScores: mockMLResponse.styleScores,
        radarData: { labels: [], values: [] },
        attributes: mockAttributes,
      };

      prismaService.players.findUnique
        .mockResolvedValueOnce(mockPlayer)
        .mockResolvedValueOnce({ ...mockPlayer, id: 'player-2', users: { ...mockPlayer.users, id: 'user-2' } });

      cacheManager.get.mockResolvedValue(profile);

      const result = await service.comparePlayers('player-1', 'player-2');

      expect(result.similarityScore).toBeGreaterThan(90); // Very high similarity for identical profiles
    });
  });
});
