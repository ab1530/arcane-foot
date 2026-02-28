import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlayersController } from './players.controller';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { FilterPlayersDto, PlayerSortField, SortOrder } from './dto/filter-players.dto';
import { PlayerStatus } from '@prisma/client';

describe('PlayersController', () => {
  let controller: PlayersController;
  let service: jest.Mocked<PlayersService>;

  const mockPlayersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getStats: jest.fn(),
    getReports: jest.fn(),
    resolveObservedPlayer: jest.fn(),
    getDiscoveredTree: jest.fn(),
    getMyPlayerSpace: jest.fn(),
    submitMyPlayerWeeklyUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [
        {
          provide: PlayersService,
          useValue: mockPlayersService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PlayersController>(PlayersController);
    service = module.get(PlayersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createPlayerDto: CreatePlayerDto = {
      userId: 'user-123',
      position: 'Forward',
      height: 180,
      weight: 75,
      preferredFoot: 'Right',
      nationality: 'FR',
      dateOfBirth: '1998-05-15',
      clubId: 'club-123',
      status: PlayerStatus.ACTIVE,
      jerseyNumber: 10,
      marketValue: 1000000,
      contractUntil: '2026-06-30',
      biography: 'Test player',
    };

    const mockPlayer = {
      id: 'player-123',
      ...createPlayerDto,
      dateOfBirth: new Date('1998-05-15'),
      contractUntil: new Date('2026-06-30'),
      createdAt: new Date(),
      updatedAt: new Date(),
      users: {
        id: 'user-123',
        email: 'player@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      clubs: {
        id: 'club-123',
        name: 'PSG',
        logo: 'psg.png',
      },
    };

    it('should create a player', async () => {
      service.create.mockResolvedValue(mockPlayer as any);

      const result = await controller.create(createPlayerDto);

      expect(service.create).toHaveBeenCalledWith(createPlayerDto);
      expect(result).toEqual(mockPlayer);
    });

    it('should require JWT authentication', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PlayersController],
        providers: [
          {
            provide: PlayersService,
            useValue: mockPlayersService,
          },
        ],
      }).compile();

      const testController = module.get<PlayersController>(PlayersController);
      const guards = Reflect.getMetadata('__guards__', testController.create);

      expect(guards).toBeDefined();
    });

    it('should handle validation errors', async () => {
      const invalidDto = { userId: 'user-123' } as CreatePlayerDto;
      service.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create(invalidDto)).rejects.toThrow('Validation failed');
    });

    it('should create a player without optional fields', async () => {
      const minimalDto: CreatePlayerDto = {
        userId: 'user-123',
        position: 'Forward',
        nationality: 'FR',
        dateOfBirth: '1998-05-15',
      };

      const minimalPlayer = {
        id: 'player-123',
        ...minimalDto,
        dateOfBirth: new Date('1998-05-15'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      service.create.mockResolvedValue(minimalPlayer as any);

      const result = await controller.create(minimalDto);

      expect(service.create).toHaveBeenCalledWith(minimalDto);
      expect(result).toEqual(minimalPlayer);
    });
  });

  describe('findAll', () => {
    const mockPlayers = [
      {
        id: 'player-1',
        position: 'Forward',
        users: { id: 'user-1', firstName: 'John', lastName: 'Doe' },
        clubs: { id: 'club-1', name: 'PSG' },
      },
      {
        id: 'player-2',
        position: 'Midfielder',
        users: { id: 'user-2', firstName: 'Jane', lastName: 'Smith' },
        clubs: { id: 'club-2', name: 'OM' },
      },
    ];

    it('should return all players with default filters', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { page: 1, limit: 20 };
      const result = await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockPlayers);
      expect(result).toHaveLength(2);
    });

    it('should filter by position', async () => {
      service.findAll.mockResolvedValue([mockPlayers[0]] as any);

      const filters: FilterPlayersDto = { position: 'FORWARD', page: 1, limit: 20 };
      const result = await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(filters);
      expect(result).toHaveLength(1);
    });

    it('should filter by nationality', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { nationality: 'FR', page: 1, limit: 20 };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ nationality: 'FR' }));
    });

    it('should filter by club', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { clubId: 'club-123', page: 1, limit: 20 };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ clubId: 'club-123' }));
    });

    it('should filter by age range', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { minAge: 20, maxAge: 30, page: 1, limit: 20 };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ minAge: 20, maxAge: 30 }),
      );
    });

    it('should filter by height range', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { minHeight: 175, maxHeight: 190, page: 1, limit: 20 };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ minHeight: 175, maxHeight: 190 }),
      );
    });

    it('should filter by weight range', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { minWeight: 70, maxWeight: 85, page: 1, limit: 20 };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ minWeight: 70, maxWeight: 85 }),
      );
    });

    it('should filter by market value range', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = {
        minMarketValue: 500000,
        maxMarketValue: 2000000,
        page: 1,
        limit: 20,
      };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ minMarketValue: 500000, maxMarketValue: 2000000 }),
      );
    });

    it('should filter by preferredFoot', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { preferredFoot: 'RIGHT', page: 1, limit: 20 };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ preferredFoot: 'RIGHT' }),
      );
    });

    it('should filter by availableForTransfer', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { availableForTransfer: true, page: 1, limit: 20 };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ availableForTransfer: true }),
      );
    });

    it('should search by player name', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { search: 'John', page: 1, limit: 20 };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: 'John' }));
    });

    it('should sort by NAME field', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = {
        sortBy: PlayerSortField.NAME,
        sortOrder: SortOrder.ASC,
        page: 1,
        limit: 20,
      };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ sortBy: PlayerSortField.NAME, sortOrder: SortOrder.ASC }),
      );
    });

    it('should sort by MARKET_VALUE field', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = {
        sortBy: PlayerSortField.MARKET_VALUE,
        sortOrder: SortOrder.DESC,
        page: 1,
        limit: 20,
      };
      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          sortBy: PlayerSortField.MARKET_VALUE,
          sortOrder: SortOrder.DESC,
        }),
      );
    });

    it('should handle pagination', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = { page: 2, limit: 10 };
      const result = await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(filters);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle multiple filters simultaneously', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const filters: FilterPlayersDto = {
        position: 'FORWARD',
        nationality: 'FR',
        minAge: 20,
        maxAge: 30,
        minHeight: 175,
        availableForTransfer: true,
        search: 'John',
        sortBy: PlayerSortField.MARKET_VALUE,
        sortOrder: SortOrder.DESC,
        page: 1,
        limit: 20,
      };

      await controller.findAll(filters);

      expect(service.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when no players found', async () => {
      service.findAll.mockResolvedValue([] as any);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should not require authentication for public access', async () => {
      service.findAll.mockResolvedValue(mockPlayers as any);

      const result = await controller.findAll({ page: 1, limit: 20 });

      expect(result).toBeDefined();
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    const mockPlayer = {
      id: 'player-123',
      position: 'Forward',
      users: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      clubs: { id: 'club-1', name: 'PSG' },
      scouting_reports: [],
      media: [],
      club_requests: [],
      _count: {
        scouting_reports: 0,
        media: 0,
        club_requests: 0,
      },
    };

    it('should return a player by ID', async () => {
      service.findOne.mockResolvedValue(mockPlayer as any);

      const result = await controller.findOne('player-123');

      expect(service.findOne).toHaveBeenCalledWith('player-123');
      expect(result).toEqual(mockPlayer);
    });

    it('should throw NotFoundException when player not found', async () => {
      service.findOne.mockRejectedValue(
        new NotFoundException('Player with ID invalid-id not found'),
      );

      await expect(controller.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(controller.findOne('invalid-id')).rejects.toThrow(
        'Player with ID invalid-id not found',
      );
    });

    it('should include all relations', async () => {
      const playerWithRelations = {
        ...mockPlayer,
        scouting_reports: [{ id: 'report-1', overallRating: 8 }],
        media: [{ id: 'media-1', url: 'https://example.com/image.jpg' }],
      };

      service.findOne.mockResolvedValue(playerWithRelations as any);

      const result = await controller.findOne('player-123');

      expect(result.scouting_reports).toBeDefined();
      expect(result.media).toBeDefined();
      expect(result._count).toBeDefined();
    });

    it('should not require authentication for public access', async () => {
      service.findOne.mockResolvedValue(mockPlayer as any);

      const result = await controller.findOne('player-123');

      expect(result).toBeDefined();
      expect(service.findOne).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    const updatePlayerDto: UpdatePlayerDto = {
      position: 'Midfielder',
      height: 182,
      jerseyNumber: 8,
    };

    const mockUpdatedPlayer = {
      id: 'player-123',
      position: 'Midfielder',
      height: 182,
      jerseyNumber: 8,
      users: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
      },
      clubs: { id: 'club-1', name: 'PSG' },
    };

    it('should update a player', async () => {
      service.update.mockResolvedValue(mockUpdatedPlayer as any);

      const result = await controller.update('player-123', updatePlayerDto);

      expect(service.update).toHaveBeenCalledWith('player-123', updatePlayerDto);
      expect(result).toEqual(mockUpdatedPlayer);
    });

    it('should require JWT authentication', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PlayersController],
        providers: [
          {
            provide: PlayersService,
            useValue: mockPlayersService,
          },
        ],
      }).compile();

      const testController = module.get<PlayersController>(PlayersController);
      const guards = Reflect.getMetadata('__guards__', testController.update);

      expect(guards).toBeDefined();
    });

    it('should throw NotFoundException when player not found', async () => {
      service.update.mockRejectedValue(
        new NotFoundException('Player with ID invalid-id not found'),
      );

      await expect(controller.update('invalid-id', updatePlayerDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should update player with date fields', async () => {
      const dtoWithDates = {
        ...updatePlayerDto,
        dateOfBirth: '1999-03-20',
        contractUntil: '2027-06-30',
      };

      service.update.mockResolvedValue({
        ...mockUpdatedPlayer,
        dateOfBirth: new Date('1999-03-20'),
        contractUntil: new Date('2027-06-30'),
      } as any);

      const result = await controller.update('player-123', dtoWithDates);

      expect(service.update).toHaveBeenCalledWith('player-123', dtoWithDates);
      expect(result).toBeDefined();
    });

    it('should allow partial updates', async () => {
      const partialDto: UpdatePlayerDto = { height: 185 };

      service.update.mockResolvedValue({
        ...mockUpdatedPlayer,
        height: 185,
      } as any);

      const result = await controller.update('player-123', partialDto);

      expect(service.update).toHaveBeenCalledWith('player-123', partialDto);
      expect(result.height).toBe(185);
    });

    it('should handle validation errors', async () => {
      const invalidDto = { height: -10 } as UpdatePlayerDto;
      service.update.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.update('player-123', invalidDto)).rejects.toThrow(
        'Validation failed',
      );
    });
  });

  describe('remove', () => {
    const mockDeletedPlayer = {
      id: 'player-123',
      position: 'Forward',
    };

    it('should delete a player', async () => {
      service.remove.mockResolvedValue(mockDeletedPlayer as any);

      const result = await controller.remove('player-123');

      expect(service.remove).toHaveBeenCalledWith('player-123');
      expect(result).toEqual(mockDeletedPlayer);
    });

    it('should require JWT authentication', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PlayersController],
        providers: [
          {
            provide: PlayersService,
            useValue: mockPlayersService,
          },
        ],
      }).compile();

      const testController = module.get<PlayersController>(PlayersController);
      const guards = Reflect.getMetadata('__guards__', testController.remove);

      expect(guards).toBeDefined();
    });

    it('should throw NotFoundException when player not found', async () => {
      service.remove.mockRejectedValue(
        new NotFoundException('Player with ID invalid-id not found'),
      );

      await expect(controller.remove('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(controller.remove('invalid-id')).rejects.toThrow(
        'Player with ID invalid-id not found',
      );
    });

    it('should return deleted player data', async () => {
      const deletedPlayer = {
        id: 'player-123',
        position: 'Forward',
        users: { firstName: 'John', lastName: 'Doe' },
      };

      service.remove.mockResolvedValue(deletedPlayer as any);

      const result = await controller.remove('player-123');

      expect(result).toEqual(deletedPlayer);
      expect(result.id).toBe('player-123');
    });
  });

  describe('getStats', () => {
    const mockStats = {
      playerId: 'player-123',
      stats: { goals: 15, assists: 8 },
      reportsCount: 10,
      averageRating: 8.5,
      recentReports: [
        {
          id: 'report-1',
          overallRating: 8.5,
          createdAt: new Date(),
          matches: {
            competitionId: 'competition-1',
            scheduledAt: new Date(),
            clubs_matches_homeClubIdToclubs: { name: 'PSG' },
            clubs_matches_awayClubIdToclubs: { name: 'OM' },
          },
        },
      ],
    };

    it('should return player statistics', async () => {
      service.getStats.mockResolvedValue(mockStats as any);

      const result = await controller.getStats('player-123');

      expect(service.getStats).toHaveBeenCalledWith('player-123');
      expect(result).toEqual(mockStats);
      expect(result.reportsCount).toBe(10);
      expect(result.averageRating).toBe(8.5);
    });

    it('should throw NotFoundException when player not found', async () => {
      service.getStats.mockRejectedValue(
        new NotFoundException('Player with ID invalid-id not found'),
      );

      await expect(controller.getStats('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should handle player with no reports', async () => {
      const emptyStats = {
        playerId: 'player-123',
        stats: null,
        reportsCount: 0,
        averageRating: null,
        recentReports: [],
      };

      service.getStats.mockResolvedValue(emptyStats as any);

      const result = await controller.getStats('player-123');

      expect(result.reportsCount).toBe(0);
      expect(result.averageRating).toBeNull();
      expect(result.recentReports).toHaveLength(0);
    });

    it('should not require authentication for public access', async () => {
      service.getStats.mockResolvedValue(mockStats as any);

      const result = await controller.getStats('player-123');

      expect(result).toBeDefined();
      expect(service.getStats).toHaveBeenCalled();
    });
  });

  describe('getReports', () => {
    const mockReports = [
      {
        id: 'report-1',
        playerId: 'player-123',
        overallRating: 8,
        createdAt: new Date(),
        matches: {
          id: 'match-1',
          clubs_matches_homeClubIdToclubs: { name: 'PSG' },
          clubs_matches_awayClubIdToclubs: { name: 'OM' },
        },
        users: { id: 'scout-1', firstName: 'Scout', lastName: 'One' },
      },
      {
        id: 'report-2',
        playerId: 'player-123',
        overallRating: 7.5,
        createdAt: new Date(),
        matches: {
          id: 'match-2',
          clubs_matches_homeClubIdToclubs: { name: 'OM' },
          clubs_matches_awayClubIdToclubs: { name: 'Lyon' },
        },
        users: { id: 'scout-2', firstName: 'Scout', lastName: 'Two' },
      },
    ];

    it('should return player scouting reports', async () => {
      service.getReports.mockResolvedValue(mockReports as any);

      const result = await controller.getReports('player-123');

      expect(service.getReports).toHaveBeenCalledWith('player-123');
      expect(result).toEqual(mockReports);
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when player not found', async () => {
      service.getReports.mockRejectedValue(
        new NotFoundException('Player with ID invalid-id not found'),
      );

      await expect(controller.getReports('invalid-id')).rejects.toThrow(NotFoundException);
    });

    it('should return empty array when no reports exist', async () => {
      service.getReports.mockResolvedValue([]);

      const result = await controller.getReports('player-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should include match and scout information', async () => {
      service.getReports.mockResolvedValue(mockReports as any);

      const result = await controller.getReports('player-123');

      expect(result[0].matches).toBeDefined();
      expect(result[0].users).toBeDefined();
      expect(result[0].matches.clubs_matches_homeClubIdToclubs).toBeDefined();
    });

    it('should not require authentication for public access', async () => {
      service.getReports.mockResolvedValue(mockReports as any);

      const result = await controller.getReports('player-123');

      expect(result).toBeDefined();
      expect(service.getReports).toHaveBeenCalled();
    });
  });

  describe('player space', () => {
    const mockPayload = {
      playerId: 'player-123',
      player: {
        id: 'player-123',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        position: 'Attaquant',
        nationality: 'FR',
      },
      snapshot: {
        matchesPlayed: 2,
        matchesNotPlayed: 1,
        goals: 3,
        assists: 1,
        minutesPlayed: 320,
        isInjured: false,
        injuryStatus: null,
      },
      performanceTrend: [],
      upcomingCalendar: [],
      health: {
        status: 'Connecté',
        lastDeviceSync: '2026-02-20T10:00:00.000Z',
        syncSource: 'Tracker',
      },
      weekly: { latest: null, totalUpdates: 0 },
      news: [],
      generatedAt: '2026-02-20T10:00:00.000Z',
    };

    it('should return player space dashboard for connected player', async () => {
      service.getMyPlayerSpace.mockResolvedValue(mockPayload as any);
      const req = { user: { id: 'user-123', playerId: 'player-123' } };

      const result = await controller.getMyPlayerSpace(req as any);

      expect(service.getMyPlayerSpace).toHaveBeenCalledWith('user-123', 'player-123');
      expect(result).toEqual(mockPayload);
    });

    it('should require JWT authentication', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PlayersController],
        providers: [
          {
            provide: PlayersService,
            useValue: mockPlayersService,
          },
        ],
      }).compile();

      const testController = module.get<PlayersController>(PlayersController);
      const guards = Reflect.getMetadata('__guards__', testController.getMyPlayerSpace);

      expect(guards).toBeDefined();
    });

    it('should submit weekly update', async () => {
      const payload = {
        minutesPlayed: 480,
        goals: 1,
        assists: 2,
        matchesPlayed: 3,
        matchesNotPlayed: 1,
        isInjured: false,
      };
      const updatedPayload = {
        ...mockPayload,
        weekly: {
          latest: {
            weekStartDate: '2026-02-15',
            submittedAt: '2026-02-20T10:00:00.000Z',
            updatedBy: 'player-123',
            minutesPlayed: 480,
            goals: 1,
            assists: 2,
            matchesPlayed: 3,
            matchesNotPlayed: 1,
            isInjured: false,
            healthStatus: 'NORMAL',
            remarks: null,
          },
          totalUpdates: 1,
        },
      };
      service.submitMyPlayerWeeklyUpdate.mockResolvedValue(updatedPayload as any);
      const req = { user: { id: 'user-123', playerId: 'player-123' } };

      const result = await controller.submitWeeklyUpdate(req as any, payload as any);

      expect(service.submitMyPlayerWeeklyUpdate).toHaveBeenCalledWith(
        'user-123',
        'player-123',
        payload,
      );
      expect(result).toEqual(updatedPayload);
    });

    it('should require JWT authentication on weekly update', async () => {
      const module: TestingModule = await Test.createTestingModule({
        controllers: [PlayersController],
        providers: [
          {
            provide: PlayersService,
            useValue: mockPlayersService,
          },
        ],
      }).compile();

      const testController = module.get<PlayersController>(PlayersController);
      const guards = Reflect.getMetadata('__guards__', testController.submitWeeklyUpdate);

      expect(guards).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors in create', async () => {
      const createDto: CreatePlayerDto = {
        userId: 'user-123',
        position: 'Forward',
        nationality: 'FR',
        dateOfBirth: '1998-05-15',
      };

      service.create.mockRejectedValue(new Error('Database error'));

      await expect(controller.create(createDto)).rejects.toThrow('Database error');
    });

    it('should handle service errors in findAll', async () => {
      service.findAll.mockRejectedValue(new Error('Database error'));

      await expect(controller.findAll({ page: 1, limit: 20 })).rejects.toThrow('Database error');
    });

    it('should handle service errors in findOne', async () => {
      service.findOne.mockRejectedValue(new Error('Database error'));

      await expect(controller.findOne('player-123')).rejects.toThrow('Database error');
    });

    it('should handle service errors in update', async () => {
      service.update.mockRejectedValue(new Error('Database error'));

      await expect(controller.update('player-123', { height: 180 })).rejects.toThrow(
        'Database error',
      );
    });

    it('should handle service errors in remove', async () => {
      service.remove.mockRejectedValue(new Error('Database error'));

      await expect(controller.remove('player-123')).rejects.toThrow('Database error');
    });

    it('should handle service errors in getStats', async () => {
      service.getStats.mockRejectedValue(new Error('Database error'));

      await expect(controller.getStats('player-123')).rejects.toThrow('Database error');
    });

    it('should handle service errors in getReports', async () => {
      service.getReports.mockRejectedValue(new Error('Database error'));

      await expect(controller.getReports('player-123')).rejects.toThrow('Database error');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large page numbers', async () => {
      service.findAll.mockResolvedValue([] as any);

      const result = await controller.findAll({ page: 1000, limit: 20 });

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should handle concurrent requests', async () => {
      const mockPlayer = {
        id: 'player-123',
        position: 'Forward',
      };

      service.findOne.mockResolvedValue(mockPlayer as any);

      const promises = [
        controller.findOne('player-123'),
        controller.findOne('player-123'),
        controller.findOne('player-123'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(service.findOne).toHaveBeenCalledTimes(3);
    });

    it('should handle special characters in search', async () => {
      service.findAll.mockResolvedValue([] as any);

      const result = await controller.findAll({ search: "O'Connor", page: 1, limit: 20 });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ search: "O'Connor" }));
    });

    it('should handle maximum limit value', async () => {
      service.findAll.mockResolvedValue([] as any);

      await controller.findAll({ page: 1, limit: 100 });

      expect(service.findAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });
  });

  describe('Swagger Documentation', () => {
    it('should have proper API decorators', () => {
      const metadata = Reflect.getMetadata('swagger/apiUseTags', PlayersController);
      expect(metadata).toBeDefined();
    });

    it('should document create endpoint', () => {
      const operationMetadata = Reflect.getMetadata('swagger/apiOperation', controller.create);
      expect(operationMetadata).toBeDefined();
    });

    it('should document findAll endpoint', () => {
      const operationMetadata = Reflect.getMetadata('swagger/apiOperation', controller.findAll);
      expect(operationMetadata).toBeDefined();
    });

    it('should document findOne endpoint', () => {
      const operationMetadata = Reflect.getMetadata('swagger/apiOperation', controller.findOne);
      expect(operationMetadata).toBeDefined();
    });

    it('should document update endpoint', () => {
      const operationMetadata = Reflect.getMetadata('swagger/apiOperation', controller.update);
      expect(operationMetadata).toBeDefined();
    });

    it('should document remove endpoint', () => {
      const operationMetadata = Reflect.getMetadata('swagger/apiOperation', controller.remove);
      expect(operationMetadata).toBeDefined();
    });
  });
});
