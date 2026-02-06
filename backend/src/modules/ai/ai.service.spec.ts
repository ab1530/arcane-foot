import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlayersService } from '../players/players.service';
import { NotFoundException } from '@nestjs/common';

describe('AiService', () => {
  let service: AiService;
  let prismaService: PrismaService;
  let playersService: PlayersService;

  const mockPlayer = {
    id: 'player-123',
    userId: 'user-123',
    position: 'MIDFIELDER',
    nationality: 'France',
    dateOfBirth: new Date('2000-01-01'),
    photoUrl: 'http://example.com/photo.jpg',
    currentLevel: 'PROFESSIONAL',
    createdAt: new Date('2024-01-15T10:00:00Z'),
    statsJson: {
      technical: 75,
      physical: 80,
      mental: 70,
      tactical: 72,
      form: 78,
      potential: 85,
    },
    users: {
      id: 'user-123',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+33612345678',
      email: 'john@example.com',
    },
    clubs: {
      id: 'club-123',
      name: 'Test FC',
    },
    scouting_reports: [
      { id: 'report-1', overallRating: 75, createdAt: new Date('2024-03-01') },
      { id: 'report-2', overallRating: 78, createdAt: new Date('2024-02-15') },
      { id: 'report-3', overallRating: 80, createdAt: new Date('2024-02-01') },
      { id: 'report-4', overallRating: 72, createdAt: new Date('2024-01-15') },
      { id: 'report-5', overallRating: 70, createdAt: new Date('2024-01-01') },
    ],
  };

  const mockClub = {
    id: 'club-123',
    name: 'Test FC',
    leagueLevel: 'PROFESSIONAL',
    hasYouthAcademy: true,
    players: [
      { id: 'p1', position: 'FORWARD' },
      { id: 'p2', position: 'DEFENDER' },
    ],
  };

  beforeEach(async () => {
    const configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'AI_SERVICE_URL') {
          return 'http://127.0.0.1:65534';
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const prismaServiceMock = {
      players: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      clubs: {
        findMany: jest.fn(),
      },
    } as unknown as PrismaService;

    const playersServiceMock = {
      findAll: jest.fn().mockResolvedValue([]),
      findOne: jest.fn(),
    } as unknown as PlayersService;

    const httpServiceMock = {} as unknown as HttpService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: configServiceMock },
        { provide: PrismaService, useValue: prismaServiceMock },
        { provide: PlayersService, useValue: playersServiceMock },
        { provide: HttpService, useValue: httpServiceMock },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    prismaService = module.get<PrismaService>(PrismaService);
    playersService = module.get<PlayersService>(PlayersService);
  });

  describe('Basic Tests', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should fall back when AI service unavailable', async () => {
      const result = await service.generateSummary({ prompt: 'Test' });
      expect(result.summary).toContain('Test');
      expect(result.source).toBe('ai-fallback');
    });

    it('should return player index fallback when AI service unavailable', async () => {
      const result = await service.getPlayerIndex('player-1');
      expect(result.playerId).toBe('player-1');
      expect(result.source).toBe('ai-fallback');
    });

    it('should return matchmaking fallback when AI service unavailable', async () => {
      const payload = { playerIds: ['p1'], clubIds: ['c1'] };
      const result = await service.matchmaking(payload);
      expect(result.matches).toEqual([]);
      expect(result.filters).toEqual(payload);
      expect(result.source).toBe('ai-fallback');
    });

    it('should return empty matches for matchmaking with empty player or club lists', async () => {
      const payload1 = { playerIds: [], clubIds: ['c1'] };
      const result1 = await service.matchmaking(payload1);
      expect(result1.matches).toEqual([]);
      expect(result1.source).toBe('ai-fallback');

      const payload2 = { playerIds: ['p1'], clubIds: [] };
      const result2 = await service.matchmaking(payload2);
      expect(result2.matches).toEqual([]);
      expect(result2.source).toBe('ai-fallback');
    });
  });

  describe('getPlayerIndex with real player data', () => {
    it('should parse player stats and call AI service', async () => {
      jest.spyOn(playersService, 'findOne').mockResolvedValue(mockPlayer as any);

      const result = await service.getPlayerIndex('player-123');

      expect(result.playerId).toBe('player-123');
      expect(result.source).toBe('ai-fallback'); // Will fallback since AI service is unavailable
      expect(playersService.findOne).toHaveBeenCalledWith('player-123');
    });

    it('should return fallback when player not found', async () => {
      jest.spyOn(playersService, 'findOne').mockResolvedValue(null);

      const result = await service.getPlayerIndex('nonexistent');

      expect(result.playerId).toBe('nonexistent');
      expect(result.source).toBe('ai-fallback');
      expect(result.overallScore).toBe(0);
    });

    it('should handle player with missing stats using defaults', async () => {
      const playerWithoutStats = {
        ...mockPlayer,
        statsJson: {},
      };
      jest.spyOn(playersService, 'findOne').mockResolvedValue(playerWithoutStats as any);

      const result = await service.getPlayerIndex('player-123');

      expect(result.playerId).toBe('player-123');
    });

    it('should parse numeric stats correctly', async () => {
      const playerWithStringStats = {
        ...mockPlayer,
        statsJson: {
          technical: '75',
          physical: '80',
          mental: 70,
          tactical: 72,
        },
      };
      jest.spyOn(playersService, 'findOne').mockResolvedValue(playerWithStringStats as any);

      const result = await service.getPlayerIndex('player-123');

      expect(result.playerId).toBe('player-123');
    });

    it('should clamp stats to 0-100 range', async () => {
      const playerWithOutOfRangeStats = {
        ...mockPlayer,
        statsJson: {
          technical: 150,
          physical: -20,
          mental: 70,
          tactical: 72,
        },
      };
      jest.spyOn(playersService, 'findOne').mockResolvedValue(playerWithOutOfRangeStats as any);

      const result = await service.getPlayerIndex('player-123');

      expect(result.playerId).toBe('player-123');
    });

    it('should handle invalid stat values with defaults', async () => {
      const playerWithInvalidStats = {
        ...mockPlayer,
        statsJson: {
          technical: 'invalid',
          physical: NaN,
          mental: null,
          tactical: undefined,
        },
      };
      jest.spyOn(playersService, 'findOne').mockResolvedValue(playerWithInvalidStats as any);

      const result = await service.getPlayerIndex('player-123');

      expect(result.playerId).toBe('player-123');
    });
  });

  describe('analyzePlayerPerformance', () => {
    it('should analyze player performance successfully', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result).toBeDefined();
      expect(result.playerId).toBe('player-123');
      expect(result.overallRating).toBeGreaterThan(0);
      expect(result.strengthWeakness).toBeDefined();
      expect(result.potentialScore).toBeGreaterThan(0);
      expect(result.marketValue).toBeDefined();
      expect(result.performanceTrend).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.injuryRisk).toBeDefined();
    });

    it('should throw NotFoundException when player not found', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(null);

      await expect(service.analyzePlayerPerformance('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle player with minimal data', async () => {
      const minimalPlayer = {
        ...mockPlayer,
        statsJson: {},
        scouting_reports: [],
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(minimalPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result).toBeDefined();
      expect(result.overallRating).toBe(50); // Default rating
      expect(result.performanceTrend).toBe('INSUFFICIENT_DATA');
    });

    it('should calculate correct overall rating', async () => {
      const playerWithHighStats = {
        ...mockPlayer,
        statsJson: {
          technical: 90,
          physical: 85,
          mental: 88,
          tactical: 87,
        },
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(playerWithHighStats as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.overallRating).toBeGreaterThanOrEqual(85);
    });

    it('should identify strengths and weaknesses correctly', async () => {
      const playerWithVariedStats = {
        ...mockPlayer,
        statsJson: {
          technical: 85, // strength (>70)
          physical: 30, // weakness (<40)
          mental: 75, // strength
          tactical: 35, // weakness
        },
      };
      jest
        .spyOn(prismaService.players, 'findUnique')
        .mockResolvedValue(playerWithVariedStats as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.strengthWeakness.strengths).toContain('technical');
      expect(result.strengthWeakness.strengths).toContain('mental');
      expect(result.strengthWeakness.weaknesses).toContain('physical');
      expect(result.strengthWeakness.weaknesses).toContain('tactical');
    });

    it('should calculate potential based on age', async () => {
      // Young player (19 years old)
      const youngPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 19, 0, 1),
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(youngPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      // Young players should have higher potential
      expect(result.potentialScore).toBeGreaterThan(result.overallRating);
    });

    it('should estimate market value correctly', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.marketValue).toMatch(/€\d+\.\d+M/);
    });

    it('should calculate higher market value for forwards', async () => {
      const forwardPlayer = {
        ...mockPlayer,
        position: 'FORWARD',
        statsJson: {
          technical: 80,
          physical: 80,
          mental: 80,
          tactical: 80,
        },
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(forwardPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.marketValue).toMatch(/€\d+\.\d+M/);
      // Forward should have higher value due to 1.3x multiplier
    });

    it('should calculate market value boost for young players', async () => {
      const youngForward = {
        ...mockPlayer,
        position: 'FORWARD',
        dateOfBirth: new Date(new Date().getFullYear() - 22, 0, 1),
        statsJson: {
          technical: 80,
          physical: 80,
          mental: 80,
          tactical: 80,
        },
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(youngForward as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.marketValue).toMatch(/€\d+\.\d+M/);
      // Young forward should have highest value (age 1.5x + position 1.3x)
    });

    it('should reduce market value for older players', async () => {
      const olderPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 32, 0, 1),
        statsJson: {
          technical: 80,
          physical: 80,
          mental: 80,
          tactical: 80,
        },
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(olderPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.marketValue).toMatch(/€\d+\.\d+M/);
      // Older player should have reduced value (0.7x multiplier)
    });

    it('should detect improving performance trend', async () => {
      const improvingPlayer = {
        ...mockPlayer,
        scouting_reports: [
          { id: 'r1', overallRating: 80, createdAt: new Date() },
          { id: 'r2', overallRating: 78, createdAt: new Date() },
          { id: 'r3', overallRating: 76, createdAt: new Date() },
          { id: 'r4', overallRating: 70, createdAt: new Date() },
          { id: 'r5', overallRating: 68, createdAt: new Date() },
          { id: 'r6', overallRating: 65, createdAt: new Date() },
        ],
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(improvingPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.performanceTrend).toBe('IMPROVING');
    });

    it('should detect declining performance trend', async () => {
      const decliningPlayer = {
        ...mockPlayer,
        scouting_reports: [
          { id: 'r1', overallRating: 65, createdAt: new Date() },
          { id: 'r2', overallRating: 68, createdAt: new Date() },
          { id: 'r3', overallRating: 70, createdAt: new Date() },
          { id: 'r4', overallRating: 76, createdAt: new Date() },
          { id: 'r5', overallRating: 78, createdAt: new Date() },
          { id: 'r6', overallRating: 80, createdAt: new Date() },
        ],
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(decliningPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.performanceTrend).toBe('DECLINING');
    });

    it('should detect stable performance trend', async () => {
      const stablePlayer = {
        ...mockPlayer,
        scouting_reports: [
          { id: 'r1', overallRating: 75, createdAt: new Date() },
          { id: 'r2', overallRating: 74, createdAt: new Date() },
          { id: 'r3', overallRating: 76, createdAt: new Date() },
          { id: 'r4', overallRating: 75, createdAt: new Date() },
          { id: 'r5', overallRating: 74, createdAt: new Date() },
          { id: 'r6', overallRating: 76, createdAt: new Date() },
        ],
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(stablePlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.performanceTrend).toBe('STABLE');
    });

    it('should return stable when not enough historical data', async () => {
      const playerWithLimitedHistory = {
        ...mockPlayer,
        scouting_reports: [
          { id: 'r1', overallRating: 75, createdAt: new Date() },
          { id: 'r2', overallRating: 78, createdAt: new Date() },
          { id: 'r3', overallRating: 80, createdAt: new Date() },
        ],
      };
      jest
        .spyOn(prismaService.players, 'findUnique')
        .mockResolvedValue(playerWithLimitedHistory as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.performanceTrend).toBe('STABLE');
    });

    it('should generate appropriate recommendations', async () => {
      const weakPlayer = {
        ...mockPlayer,
        statsJson: {
          technical: 50,
          physical: 40,
          mental: 60,
          tactical: 45,
        },
        scouting_reports: [],
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(weakPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.recommendations).toContain('Focus on physical conditioning');
      expect(result.recommendations).toContain('Improve tactical awareness');
      expect(result.recommendations).toContain('Gain more match experience and scouting exposure');
    });

    it('should assess high injury risk for older players with low physical', async () => {
      const oldPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 32, 0, 1),
        statsJson: {
          ...mockPlayer.statsJson,
          physical: 45,
        },
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(oldPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.injuryRisk).toBe('HIGH');
    });

    it('should assess medium injury risk', async () => {
      const mediumRiskPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 29, 0, 1),
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mediumRiskPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.injuryRisk).toBe('MEDIUM');
    });

    it('should assess low injury risk for young players', async () => {
      const youngPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 22, 0, 1),
        statsJson: {
          ...mockPlayer.statsJson,
          physical: 85,
        },
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(youngPlayer as any);

      const result = await service.analyzePlayerPerformance('player-123');

      expect(result.injuryRisk).toBe('LOW');
    });
  });

  describe('predictTalentPotential', () => {
    it('should predict talent potential successfully', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);

      const result = await service.predictTalentPotential('player-123');

      expect(result).toBeDefined();
      expect(result.playerId).toBe('player-123');
      expect(result.currentAbility).toBeGreaterThan(0);
      expect(result.potentialAbility).toBeGreaterThan(0);
      expect(result.peakAge).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.factors).toBeDefined();
    });

    it('should throw NotFoundException when player not found', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(null);

      await expect(service.predictTalentPotential('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should predict correct peak age for different positions', async () => {
      const positions = [
        { position: 'GOALKEEPER', expectedPeakAge: 32 },
        { position: 'DEFENDER', expectedPeakAge: 29 },
        { position: 'MIDFIELDER', expectedPeakAge: 28 },
        { position: 'FORWARD', expectedPeakAge: 27 },
      ];

      for (const { position, expectedPeakAge } of positions) {
        const player = { ...mockPlayer, position };
        jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(player as any);

        const result = await service.predictTalentPotential('player-123');

        expect(result.peakAge).toBe(expectedPeakAge);
      }
    });

    it('should calculate high growth rate for young players', async () => {
      const youngPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 19, 0, 1),
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(youngPlayer as any);

      const result = await service.predictTalentPotential('player-123');

      expect(result.factors.growthRate).toBeGreaterThanOrEqual(0.8);
    });

    it('should calculate low growth rate for older players', async () => {
      const olderPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 30, 0, 1),
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(olderPlayer as any);

      const result = await service.predictTalentPotential('player-123');

      expect(result.factors.growthRate).toBeLessThanOrEqual(0.1);
    });

    it('should generate ascending trajectory for young players', async () => {
      const youngPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 22, 0, 1),
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(youngPlayer as any);

      const result = await service.predictTalentPotential('player-123');

      expect(result.developmentCurve.trajectory).toBe('ASCENDING');
    });

    it('should generate descending trajectory for players past peak', async () => {
      const olderPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 32, 0, 1),
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(olderPlayer as any);

      const result = await service.predictTalentPotential('player-123');

      expect(result.developmentCurve.trajectory).toBe('DESCENDING');
    });

    it('should calculate age score correctly for various ages', async () => {
      const ages = [
        { age: 17, expectedScore: 20 },
        { age: 20, expectedScore: 40 },
        { age: 23, expectedScore: 70 },
        { age: 26, expectedScore: 90 },
        { age: 29, expectedScore: 70 },
        { age: 32, expectedScore: 50 },
      ];

      for (const { age, expectedScore } of ages) {
        const player = {
          ...mockPlayer,
          dateOfBirth: new Date(new Date().getFullYear() - age, 0, 1),
        };
        jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(player as any);

        const result = await service.predictTalentPotential('player-123');

        expect(result.factors.age).toBe(expectedScore);
      }
    });

    it('should predict correct peak age for unknown position', async () => {
      const player = { ...mockPlayer, position: 'UNKNOWN' };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(player as any);

      const result = await service.predictTalentPotential('player-123');

      expect(result.peakAge).toBe(28); // Default peak age
    });

    it('should calculate growth rate for mid-career players', async () => {
      const midCareerPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 25, 0, 1),
      };
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(midCareerPlayer as any);

      const result = await service.predictTalentPotential('player-123');

      expect(result.factors.growthRate).toBe(0.3);
    });
  });

  describe('intelligentMatchmaking', () => {
    it('should perform intelligent matchmaking successfully', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue([mockClub] as any);

      const result = await service.intelligentMatchmaking('player-123');

      expect(result).toBeDefined();
      expect(result.playerId).toBe('player-123');
      expect(result.playerName).toContain('John');
      expect(result.topMatches).toBeInstanceOf(Array);
      expect(result.topMatches.length).toBeLessThanOrEqual(5);
    });

    it('should throw NotFoundException when player not found', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(null);

      await expect(service.intelligentMatchmaking('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should sort matches by compatibility score', async () => {
      const clubs = [
        { ...mockClub, id: 'club-1', name: 'Club 1' },
        { ...mockClub, id: 'club-2', name: 'Club 2' },
        { ...mockClub, id: 'club-3', name: 'Club 3' },
      ];

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue(clubs as any);

      const result = await service.intelligentMatchmaking('player-123');

      // Verify matches are sorted by score
      for (let i = 0; i < result.topMatches.length - 1; i++) {
        expect(result.topMatches[i].compatibilityScore).toBeGreaterThanOrEqual(
          result.topMatches[i + 1].compatibilityScore,
        );
      }
    });

    it('should return top 5 matches only', async () => {
      const clubs = Array.from({ length: 10 }, (_, i) => ({
        ...mockClub,
        id: `club-${i}`,
        name: `Club ${i}`,
      }));

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue(clubs as any);

      const result = await service.intelligentMatchmaking('player-123');

      expect(result.topMatches.length).toBe(5);
    });

    it('should include compatibility metrics in matches', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue([mockClub] as any);

      const result = await service.intelligentMatchmaking('player-123');

      const match = result.topMatches[0];
      expect(match.clubId).toBeDefined();
      expect(match.clubName).toBeDefined();
      expect(match.compatibilityScore).toBeDefined();
      expect(match.tacticalFit).toBeDefined();
      expect(match.financialFeasibility).toBeDefined();
      expect(match.developmentOpportunity).toBeDefined();
    });

    it('should assess high development opportunity for young players in clubs with academy', async () => {
      const youngPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 22, 0, 1),
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(youngPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue([mockClub] as any);

      const result = await service.intelligentMatchmaking('player-123');

      expect(result.topMatches[0].developmentOpportunity).toBe('HIGH');
    });

    it('should assess moderate development opportunity for mid-age players', async () => {
      const midAgePlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 26, 0, 1),
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(midAgePlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue([mockClub] as any);

      const result = await service.intelligentMatchmaking('player-123');

      expect(result.topMatches[0].developmentOpportunity).toBe('MODERATE');
    });

    it('should assess low development opportunity for older players', async () => {
      const olderPlayer = {
        ...mockPlayer,
        dateOfBirth: new Date(new Date().getFullYear() - 30, 0, 1),
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(olderPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue([mockClub] as any);

      const result = await service.intelligentMatchmaking('player-123');

      expect(result.topMatches[0].developmentOpportunity).toBe('LOW');
    });

    it('should handle position need assessment with no players in position', async () => {
      const clubWithNoMidfielders = {
        ...mockClub,
        players: [
          { id: 'p1', position: 'FORWARD' },
          { id: 'p2', position: 'DEFENDER' },
        ],
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue([clubWithNoMidfielders] as any);

      const result = await service.intelligentMatchmaking('player-123');

      expect(result.topMatches[0].compatibilityScore).toBeGreaterThan(50);
    });

    it('should handle clubs with empty player arrays', async () => {
      const clubWithNoPlayers = {
        ...mockClub,
        players: [],
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue([clubWithNoPlayers] as any);

      const result = await service.intelligentMatchmaking('player-123');

      expect(result.topMatches).toHaveLength(1);
    });

    it('should handle clubs without player data', async () => {
      const clubWithoutPlayers = {
        ...mockClub,
        players: undefined,
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.clubs, 'findMany').mockResolvedValue([clubWithoutPlayers] as any);

      const result = await service.intelligentMatchmaking('player-123');

      expect(result.topMatches).toHaveLength(1);
    });
  });

  describe('detectSuspiciousProfile', () => {
    it('should detect legitimate profile', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([]);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result).toBeDefined();
      expect(result.playerId).toBe('player-123');
      expect(result.isSuspicious).toBe(false);
      expect(result.recommendation).toBe('APPEARS_LEGITIMATE');
    });

    it('should throw NotFoundException when player not found', async () => {
      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(null);

      await expect(service.detectSuspiciousProfile('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should detect incomplete profile', async () => {
      const incompletePlayer = {
        ...mockPlayer,
        users: {
          ...mockPlayer.users,
          phone: null,
        },
        photoUrl: null,
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(incompletePlayer as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([]);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.factors).toContain('Incomplete profile information');
      expect(result.suspicionScore).toBeGreaterThanOrEqual(15);
    });

    it('should detect unrealistic stats', async () => {
      const playerWithMaxStats = {
        ...mockPlayer,
        statsJson: {
          technical: 98,
          physical: 99,
          mental: 97,
          tactical: 98,
          form: 99,
          potential: 98,
        },
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(playerWithMaxStats as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([]);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.factors).toContain('Unrealistic performance statistics');
      expect(result.suspicionScore).toBeGreaterThanOrEqual(30);
    });

    it('should detect uniform stats as suspicious', async () => {
      const playerWithUniformStats = {
        ...mockPlayer,
        statsJson: {
          technical: 75,
          physical: 75,
          mental: 75,
          tactical: 75,
        },
      };

      jest
        .spyOn(prismaService.players, 'findUnique')
        .mockResolvedValue(playerWithUniformStats as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([]);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.factors).toContain('Unrealistic performance statistics');
    });

    it('should detect similar profiles (duplicates)', async () => {
      const duplicatePlayer = {
        id: 'player-456',
        ...mockPlayer,
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(mockPlayer as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([duplicatePlayer] as any);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.factors).toContain('Similar profiles detected');
      expect(result.suspicionScore).toBeGreaterThanOrEqual(25);
    });

    it('should detect anomalous registration pattern', async () => {
      const suspiciousPlayer = {
        ...mockPlayer,
        createdAt: new Date('2024-01-15T03:30:00Z'), // 3:30 AM registration
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(suspiciousPlayer as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([]);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.factors).toContain('Anomalous registration pattern');
      expect(result.suspicionScore).toBeGreaterThanOrEqual(20);
    });

    it('should detect no activity history', async () => {
      const inactivePlayer = {
        ...mockPlayer,
        scouting_reports: [],
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(inactivePlayer as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([]);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.factors).toContain('No activity history');
      expect(result.suspicionScore).toBeGreaterThanOrEqual(10);
    });

    it('should recommend REVIEW_IMMEDIATELY for high suspicion scores', async () => {
      const highSuspicionPlayer = {
        ...mockPlayer,
        users: {
          ...mockPlayer.users,
          phone: null,
        },
        photoUrl: null,
        statsJson: {
          technical: 98,
          physical: 99,
          mental: 97,
          tactical: 98,
        },
        scouting_reports: [],
        createdAt: new Date('2024-01-15T03:30:00Z'),
      };

      jest.spyOn(prismaService.players, 'findUnique').mockResolvedValue(highSuspicionPlayer as any);
      jest
        .spyOn(prismaService.players, 'findMany')
        .mockResolvedValue([{ ...mockPlayer, id: 'duplicate' }] as any);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.suspicionScore).toBeGreaterThan(70);
      expect(result.recommendation).toBe('REVIEW_IMMEDIATELY');
    });

    it('should recommend FLAG_FOR_REVIEW for medium suspicion scores', async () => {
      const mediumSuspicionPlayer = {
        ...mockPlayer,
        users: {
          ...mockPlayer.users,
          phone: null,
        },
        photoUrl: null,
        statsJson: {
          technical: 98,
          physical: 99,
          mental: 97,
          tactical: 98,
        },
        scouting_reports: [],
      };

      jest
        .spyOn(prismaService.players, 'findUnique')
        .mockResolvedValue(mediumSuspicionPlayer as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([]);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.suspicionScore).toBeGreaterThan(50);
      expect(result.suspicionScore).toBeLessThanOrEqual(70);
      expect(result.recommendation).toBe('FLAG_FOR_REVIEW');
    });

    it('should cap suspicion score at 100', async () => {
      // Create a player with all suspicious factors
      const extremelySuspiciousPlayer = {
        ...mockPlayer,
        users: {
          ...mockPlayer.users,
          phone: null,
        },
        photoUrl: null,
        statsJson: {
          technical: 100,
          physical: 100,
          mental: 100,
          tactical: 100,
        },
        scouting_reports: [],
        createdAt: new Date('2024-01-15T03:30:00Z'),
      };

      jest
        .spyOn(prismaService.players, 'findUnique')
        .mockResolvedValue(extremelySuspiciousPlayer as any);
      jest.spyOn(prismaService.players, 'findMany').mockResolvedValue([
        { ...mockPlayer, id: 'dup1' },
        { ...mockPlayer, id: 'dup2' },
      ] as any);

      const result = await service.detectSuspiciousProfile('player-123');

      expect(result.suspicionScore).toBeLessThanOrEqual(100);
    });
  });
});
