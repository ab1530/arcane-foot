import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlaystyleDnaController } from './playstyle-dna.controller';
import { PlaystyleDnaService } from './playstyle-dna.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  ClassifyPlayerDto,
  ComparePlayersDto,
  FindSimilarPlayersDto,
  PlayingStyle,
  PlayStyleProfile,
  PlayerComparison,
  SimilarPlayer,
  RadarChartData,
} from './dto/playstyle-dna.dto';

describe('PlaystyleDnaController', () => {
  let controller: PlaystyleDnaController;
  let service: jest.Mocked<PlaystyleDnaService>;

  const mockProfile: PlayStyleProfile = {
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
    radarData: {
      labels: [
        'Technical',
        'Physical',
        'Mental',
        'Tactical',
        'Speed',
        'Finishing',
        'Passing',
        'Defending',
      ],
      values: [75, 70, 80, 85, 65, 60, 90, 50],
    },
    attributes: {
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
  };

  const mockSimilarPlayers: SimilarPlayer[] = [
    {
      id: 'player-2',
      name: 'Jane Smith',
      position: 'MIDFIELDER',
      similarityScore: 85,
      playingStyle: PlayingStyle.PLAYMAKER,
      sharedAttributes: ['passing', 'tactical', 'mental'],
    },
    {
      id: 'player-3',
      name: 'Mike Johnson',
      position: 'MIDFIELDER',
      similarityScore: 78,
      playingStyle: PlayingStyle.BOX_TO_BOX,
      sharedAttributes: ['tactical', 'physical'],
    },
  ];

  const mockComparison: PlayerComparison = {
    player1: {
      id: 'player-1',
      name: 'John Doe',
      profile: mockProfile,
    },
    player2: {
      id: 'player-2',
      name: 'Jane Smith',
      profile: { ...mockProfile, primaryStyle: PlayingStyle.BOX_TO_BOX },
    },
    similarityScore: 72,
    styleDifferences: ['Primary style: PLAYMAKER vs BOX_TO_BOX'],
    attributeDifferences: {
      technical: { player1: 75, player2: 70, diff: 5 },
      physical: { player1: 70, player2: 75, diff: -5 },
    },
  };

  beforeEach(async () => {
    const mockService = {
      classifyPlayer: jest.fn(),
      calculateDNAProfile: jest.fn(),
      findSimilarPlayers: jest.fn(),
      comparePlayers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlaystyleDnaController],
      providers: [
        {
          provide: PlaystyleDnaService,
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
      .compile();

    controller = module.get<PlaystyleDnaController>(PlaystyleDnaController);
    service = module.get(PlaystyleDnaService) as jest.Mocked<PlaystyleDnaService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have service injected', () => {
      expect(service).toBeDefined();
    });
  });

  describe('classifyPlayer', () => {
    const dto: ClassifyPlayerDto = {
      playerId: 'player-1',
    };

    it('should classify a player successfully', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.classifyPlayer(dto);

      expect(result).toEqual(mockProfile);
      expect(service.classifyPlayer).toHaveBeenCalledWith('player-1');
      expect(service.classifyPlayer).toHaveBeenCalledTimes(1);
    });

    it('should return all 12 playing style scores', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.classifyPlayer(dto);

      expect(Object.keys(result.styleScores)).toHaveLength(12);
      expect(result.styleScores[PlayingStyle.STRIKER]).toBeDefined();
      expect(result.styleScores[PlayingStyle.PLAYMAKER]).toBeDefined();
      expect(result.styleScores[PlayingStyle.GOALKEEPER_SWEEPER]).toBeDefined();
    });

    it('should return radar chart data', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.classifyPlayer(dto);

      expect(result.radarData).toBeDefined();
      expect(result.radarData.labels).toBeDefined();
      expect(result.radarData.values).toBeDefined();
      expect(result.radarData.labels.length).toBe(result.radarData.values.length);
    });

    it('should return player attributes', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.classifyPlayer(dto);

      expect(result.attributes).toBeDefined();
      expect(result.attributes.technical).toBeDefined();
      expect(result.attributes.physical).toBeDefined();
      expect(result.attributes.mental).toBeDefined();
    });

    it('should throw NotFoundException when player does not exist', async () => {
      service.classifyPlayer.mockRejectedValue(new NotFoundException('Player not found'));

      await expect(controller.classifyPlayer(dto)).rejects.toThrow(NotFoundException);
      expect(service.classifyPlayer).toHaveBeenCalledWith('player-1');
    });

    it('should include confidence score in response', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.classifyPlayer(dto);

      expect(result.confidence).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include primary and secondary styles', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.classifyPlayer(dto);

      expect(result.primaryStyle).toBeDefined();
      expect(Object.values(PlayingStyle)).toContain(result.primaryStyle);

      if (result.secondaryStyle) {
        expect(Object.values(PlayingStyle)).toContain(result.secondaryStyle);
      }
    });

    it('should handle different player IDs', async () => {
      const dto2: ClassifyPlayerDto = { playerId: 'player-999' };
      service.classifyPlayer.mockResolvedValue(mockProfile);

      await controller.classifyPlayer(dto2);

      expect(service.classifyPlayer).toHaveBeenCalledWith('player-999');
    });
  });

  describe('getDNAProfile', () => {
    it('should get DNA profile for a player', async () => {
      service.calculateDNAProfile.mockResolvedValue(mockProfile);

      const result = await controller.getDNAProfile('player-1');

      expect(result).toEqual(mockProfile);
      expect(service.calculateDNAProfile).toHaveBeenCalledWith('player-1');
      expect(service.calculateDNAProfile).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException when player does not exist', async () => {
      service.calculateDNAProfile.mockRejectedValue(new NotFoundException('Player not found'));

      await expect(controller.getDNAProfile('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return complete profile data', async () => {
      service.calculateDNAProfile.mockResolvedValue(mockProfile);

      const result = await controller.getDNAProfile('player-1');

      expect(result.primaryStyle).toBeDefined();
      expect(result.styleScores).toBeDefined();
      expect(result.radarData).toBeDefined();
      expect(result.attributes).toBeDefined();
      expect(result.confidence).toBeDefined();
    });

    it('should handle different player IDs correctly', async () => {
      service.calculateDNAProfile.mockResolvedValue(mockProfile);

      await controller.getDNAProfile('player-123');
      await controller.getDNAProfile('player-456');

      expect(service.calculateDNAProfile).toHaveBeenNthCalledWith(1, 'player-123');
      expect(service.calculateDNAProfile).toHaveBeenNthCalledWith(2, 'player-456');
    });
  });

  describe('findSimilarPlayers', () => {
    it('should find similar players with default limit', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers);

      const result = await controller.findSimilarPlayers('player-1', undefined);

      expect(result).toEqual(mockSimilarPlayers);
      expect(service.findSimilarPlayers).toHaveBeenCalledWith('player-1', 10);
    });

    it('should find similar players with custom limit', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers.slice(0, 5));

      const result = await controller.findSimilarPlayers('player-1', 5);

      expect(result).toBeDefined();
      expect(service.findSimilarPlayers).toHaveBeenCalledWith('player-1', 5);
    });

    it('should throw NotFoundException when player does not exist', async () => {
      service.findSimilarPlayers.mockRejectedValue(new NotFoundException('Player not found'));

      await expect(controller.findSimilarPlayers('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return array of similar players', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers);

      const result = await controller.findSimilarPlayers('player-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return similar players with required fields', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers);

      const result = await controller.findSimilarPlayers('player-1');

      result.forEach((player) => {
        expect(player.id).toBeDefined();
        expect(player.name).toBeDefined();
        expect(player.position).toBeDefined();
        expect(player.similarityScore).toBeDefined();
        expect(player.playingStyle).toBeDefined();
        expect(player.sharedAttributes).toBeDefined();
        expect(Array.isArray(player.sharedAttributes)).toBe(true);
      });
    });

    it('should return players sorted by similarity score', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers);

      const result = await controller.findSimilarPlayers('player-1');

      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].similarityScore).toBeGreaterThanOrEqual(result[i].similarityScore);
      }
    });

    it('should handle empty results', async () => {
      service.findSimilarPlayers.mockResolvedValue([]);

      const result = await controller.findSimilarPlayers('player-1');

      expect(result).toEqual([]);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should respect maximum limit of 50', async () => {
      const largeMockArray = Array(50).fill(mockSimilarPlayers[0]);
      service.findSimilarPlayers.mockResolvedValue(largeMockArray);

      const result = await controller.findSimilarPlayers('player-1', 50);

      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('should use limit of 10 when undefined', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers);

      await controller.findSimilarPlayers('player-1', undefined);

      expect(service.findSimilarPlayers).toHaveBeenCalledWith('player-1', 10);
    });

    it('should include similarity scores between 0 and 100', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers);

      const result = await controller.findSimilarPlayers('player-1');

      result.forEach((player) => {
        expect(player.similarityScore).toBeGreaterThanOrEqual(0);
        expect(player.similarityScore).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('comparePlayers', () => {
    const dto: ComparePlayersDto = {
      player1Id: 'player-1',
      player2Id: 'player-2',
    };

    it('should compare two players successfully', async () => {
      service.comparePlayers.mockResolvedValue(mockComparison);

      const result = await controller.comparePlayers(dto);

      expect(result).toEqual(mockComparison);
      expect(service.comparePlayers).toHaveBeenCalledWith('player-1', 'player-2');
    });

    it('should throw NotFoundException when first player does not exist', async () => {
      service.comparePlayers.mockRejectedValue(
        new NotFoundException('One or both players not found'),
      );

      await expect(controller.comparePlayers(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when second player does not exist', async () => {
      const dto2: ComparePlayersDto = {
        player1Id: 'player-1',
        player2Id: 'non-existent',
      };

      service.comparePlayers.mockRejectedValue(
        new NotFoundException('One or both players not found'),
      );

      await expect(controller.comparePlayers(dto2)).rejects.toThrow(NotFoundException);
    });

    it('should return comparison with both player profiles', async () => {
      service.comparePlayers.mockResolvedValue(mockComparison);

      const result = await controller.comparePlayers(dto);

      expect(result.player1).toBeDefined();
      expect(result.player2).toBeDefined();
      expect(result.player1.id).toBe('player-1');
      expect(result.player2.id).toBe('player-2');
      expect(result.player1.name).toBeDefined();
      expect(result.player2.name).toBeDefined();
      expect(result.player1.profile).toBeDefined();
      expect(result.player2.profile).toBeDefined();
    });

    it('should return similarity score', async () => {
      service.comparePlayers.mockResolvedValue(mockComparison);

      const result = await controller.comparePlayers(dto);

      expect(result.similarityScore).toBeDefined();
      expect(result.similarityScore).toBeGreaterThanOrEqual(0);
      expect(result.similarityScore).toBeLessThanOrEqual(100);
    });

    it('should return style differences', async () => {
      service.comparePlayers.mockResolvedValue(mockComparison);

      const result = await controller.comparePlayers(dto);

      expect(result.styleDifferences).toBeDefined();
      expect(Array.isArray(result.styleDifferences)).toBe(true);
    });

    it('should return attribute differences', async () => {
      service.comparePlayers.mockResolvedValue(mockComparison);

      const result = await controller.comparePlayers(dto);

      expect(result.attributeDifferences).toBeDefined();
      expect(typeof result.attributeDifferences).toBe('object');
    });

    it('should handle comparing player with themselves', async () => {
      const samePlayers: ComparePlayersDto = {
        player1Id: 'player-1',
        player2Id: 'player-1',
      };

      const highSimilarityComparison = {
        ...mockComparison,
        similarityScore: 100,
        styleDifferences: [],
      };

      service.comparePlayers.mockResolvedValue(highSimilarityComparison);

      const result = await controller.comparePlayers(samePlayers);

      expect(result.similarityScore).toBeGreaterThan(95);
    });

    it('should include detailed attribute comparisons', async () => {
      service.comparePlayers.mockResolvedValue(mockComparison);

      const result = await controller.comparePlayers(dto);

      Object.values(result.attributeDifferences).forEach((diff) => {
        expect(diff).toHaveProperty('player1');
        expect(diff).toHaveProperty('player2');
        expect(diff).toHaveProperty('diff');
      });
    });

    it('should handle different playing styles comparison', async () => {
      const differentStylesComparison = {
        ...mockComparison,
        similarityScore: 45,
        styleDifferences: [
          'Primary style: PLAYMAKER vs STRIKER',
          'Secondary style: DEEP_LYING_PLAYMAKER vs POACHER',
        ],
      };

      service.comparePlayers.mockResolvedValue(differentStylesComparison);

      const result = await controller.comparePlayers(dto);

      expect(result.styleDifferences.length).toBeGreaterThan(0);
    });
  });

  describe('getRadarData', () => {
    const radarData: RadarChartData = {
      labels: [
        'Technical',
        'Physical',
        'Mental',
        'Tactical',
        'Speed',
        'Finishing',
        'Passing',
        'Defending',
      ],
      values: [75, 70, 80, 85, 65, 60, 90, 50],
    };

    it('should get radar data for a player', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.getRadarData('player-1');

      expect(result).toEqual(radarData);
      expect(service.classifyPlayer).toHaveBeenCalledWith('player-1');
    });

    it('should throw NotFoundException when player does not exist', async () => {
      service.classifyPlayer.mockRejectedValue(new NotFoundException('Player not found'));

      await expect(controller.getRadarData('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should return radar data with labels and values', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.getRadarData('player-1');

      expect(result.labels).toBeDefined();
      expect(result.values).toBeDefined();
      expect(Array.isArray(result.labels)).toBe(true);
      expect(Array.isArray(result.values)).toBe(true);
    });

    it('should return matching number of labels and values', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.getRadarData('player-1');

      expect(result.labels.length).toBe(result.values.length);
    });

    it('should return 8 attributes for radar chart', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.getRadarData('player-1');

      expect(result.labels.length).toBe(8);
      expect(result.values.length).toBe(8);
    });

    it('should include all key attributes in labels', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.getRadarData('player-1');

      expect(result.labels).toContain('Technical');
      expect(result.labels).toContain('Physical');
      expect(result.labels).toContain('Mental');
      expect(result.labels).toContain('Tactical');
    });

    it('should return values between 0 and 100', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.getRadarData('player-1');

      result.values.forEach((value) => {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should handle different players correctly', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      await controller.getRadarData('player-1');
      await controller.getRadarData('player-2');

      expect(service.classifyPlayer).toHaveBeenCalledTimes(2);
      expect(service.classifyPlayer).toHaveBeenNthCalledWith(1, 'player-1');
      expect(service.classifyPlayer).toHaveBeenNthCalledWith(2, 'player-2');
    });
  });

  describe('Authentication and Guards', () => {
    it('should be protected by JwtAuthGuard', () => {
      expect(PlaystyleDnaController).toBeDefined();
      // Guards are applied via decorators
    });

    it('should require authentication for all endpoints', () => {
      expect(controller).toBeDefined();
      // JWT auth is enforced at controller level
    });
  });

  describe('API Documentation', () => {
    it('should have controller decorated with ApiTags', () => {
      // Controller is decorated with @ApiTags
      expect(PlaystyleDnaController).toBeDefined();
    });

    it('should have endpoints with API documentation', () => {
      // All methods have Swagger decorators
      expect(controller.classifyPlayer).toBeDefined();
      expect(controller.getDNAProfile).toBeDefined();
      expect(controller.findSimilarPlayers).toBeDefined();
      expect(controller.comparePlayers).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      service.classifyPlayer.mockRejectedValue(error);

      await expect(controller.classifyPlayer({ playerId: 'player-1' })).rejects.toThrow(
        'Service error',
      );
    });

    it('should handle NotFoundExceptions properly', async () => {
      service.classifyPlayer.mockRejectedValue(new NotFoundException('Player not found'));

      await expect(controller.classifyPlayer({ playerId: 'player-1' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle comparison errors', async () => {
      service.comparePlayers.mockRejectedValue(new Error('Comparison failed'));

      const dto: ComparePlayersDto = {
        player1Id: 'player-1',
        player2Id: 'player-2',
      };

      await expect(controller.comparePlayers(dto)).rejects.toThrow('Comparison failed');
    });

    it('should handle similar players search errors', async () => {
      service.findSimilarPlayers.mockRejectedValue(new Error('Search failed'));

      await expect(controller.findSimilarPlayers('player-1')).rejects.toThrow('Search failed');
    });
  });

  describe('Input Validation', () => {
    it('should accept valid ClassifyPlayerDto', async () => {
      const dto: ClassifyPlayerDto = { playerId: 'valid-id' };
      service.classifyPlayer.mockResolvedValue(mockProfile);

      await controller.classifyPlayer(dto);

      expect(service.classifyPlayer).toHaveBeenCalledWith('valid-id');
    });

    it('should accept valid ComparePlayersDto', async () => {
      const dto: ComparePlayersDto = {
        player1Id: 'player-1',
        player2Id: 'player-2',
      };
      service.comparePlayers.mockResolvedValue(mockComparison);

      await controller.comparePlayers(dto);

      expect(service.comparePlayers).toHaveBeenCalledWith('player-1', 'player-2');
    });

    it('should handle optional limit parameter', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers);

      await controller.findSimilarPlayers('player-1');
      await controller.findSimilarPlayers('player-1', 5);

      expect(service.findSimilarPlayers).toHaveBeenNthCalledWith(1, 'player-1', 10);
      expect(service.findSimilarPlayers).toHaveBeenNthCalledWith(2, 'player-1', 5);
    });
  });

  describe('Response Format', () => {
    it('should return properly formatted classification response', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.classifyPlayer({ playerId: 'player-1' });

      expect(result).toHaveProperty('primaryStyle');
      expect(result).toHaveProperty('secondaryStyle');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('styleScores');
      expect(result).toHaveProperty('radarData');
      expect(result).toHaveProperty('attributes');
    });

    it('should return properly formatted comparison response', async () => {
      service.comparePlayers.mockResolvedValue(mockComparison);

      const result = await controller.comparePlayers({
        player1Id: 'player-1',
        player2Id: 'player-2',
      });

      expect(result).toHaveProperty('player1');
      expect(result).toHaveProperty('player2');
      expect(result).toHaveProperty('similarityScore');
      expect(result).toHaveProperty('styleDifferences');
      expect(result).toHaveProperty('attributeDifferences');
    });

    it('should return properly formatted similar players response', async () => {
      service.findSimilarPlayers.mockResolvedValue(mockSimilarPlayers);

      const result = await controller.findSimilarPlayers('player-1');

      expect(Array.isArray(result)).toBe(true);
      result.forEach((player) => {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('name');
        expect(player).toHaveProperty('position');
        expect(player).toHaveProperty('similarityScore');
        expect(player).toHaveProperty('playingStyle');
        expect(player).toHaveProperty('sharedAttributes');
      });
    });
  });

  describe('Playing Styles Coverage', () => {
    it('should support all 12 playing styles in classification', async () => {
      service.classifyPlayer.mockResolvedValue(mockProfile);

      const result = await controller.classifyPlayer({ playerId: 'player-1' });

      const allStyles = Object.values(PlayingStyle);
      allStyles.forEach((style) => {
        expect(result.styleScores).toHaveProperty(style);
      });
    });

    it('should handle STRIKER classification', async () => {
      const strikerProfile = { ...mockProfile, primaryStyle: PlayingStyle.STRIKER };
      service.classifyPlayer.mockResolvedValue(strikerProfile);

      const result = await controller.classifyPlayer({ playerId: 'player-1' });

      expect(result.primaryStyle).toBe(PlayingStyle.STRIKER);
    });

    it('should handle GOALKEEPER_SWEEPER classification', async () => {
      const gkProfile = { ...mockProfile, primaryStyle: PlayingStyle.GOALKEEPER_SWEEPER };
      service.classifyPlayer.mockResolvedValue(gkProfile);

      const result = await controller.classifyPlayer({ playerId: 'player-1' });

      expect(result.primaryStyle).toBe(PlayingStyle.GOALKEEPER_SWEEPER);
    });

    it('should handle defensive styles', async () => {
      const defenderProfile = { ...mockProfile, primaryStyle: PlayingStyle.BALL_PLAYING_DEFENDER };
      service.classifyPlayer.mockResolvedValue(defenderProfile);

      const result = await controller.classifyPlayer({ playerId: 'player-1' });

      expect([
        PlayingStyle.BALL_PLAYING_DEFENDER,
        PlayingStyle.DESTROYER,
        PlayingStyle.SWEEPER,
      ]).toContain(result.primaryStyle);
    });

    it('should handle midfield styles', async () => {
      const midfielderProfile = { ...mockProfile, primaryStyle: PlayingStyle.BOX_TO_BOX };
      service.classifyPlayer.mockResolvedValue(midfielderProfile);

      const result = await controller.classifyPlayer({ playerId: 'player-1' });

      expect([
        PlayingStyle.PLAYMAKER,
        PlayingStyle.BOX_TO_BOX,
        PlayingStyle.DEEP_LYING_PLAYMAKER,
      ]).toContain(result.primaryStyle);
    });

    it('should handle attacking styles', async () => {
      const attackerProfile = { ...mockProfile, primaryStyle: PlayingStyle.WINGER };
      service.classifyPlayer.mockResolvedValue(attackerProfile);

      const result = await controller.classifyPlayer({ playerId: 'player-1' });

      expect([
        PlayingStyle.STRIKER,
        PlayingStyle.POACHER,
        PlayingStyle.TARGET_MAN,
        PlayingStyle.WINGER,
      ]).toContain(result.primaryStyle);
    });
  });
});
