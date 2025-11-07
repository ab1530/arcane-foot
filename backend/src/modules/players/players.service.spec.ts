import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PrismaService } from '../prisma/prisma.service';
import { CacheManagerService } from '../../common/interceptors/cache.interceptor';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';
import { PlayerSortField, SortOrder } from './dto/filter-players.dto';

describe('PlayersService', () => {
  let service: PlayersService;
  let prisma: DeepMockProxy<PrismaClient>;
  let cacheManager: jest.Mocked<CacheManagerService>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const mockCacheManager = {
      invalidateByTag: jest.fn().mockResolvedValue(1),
      invalidateByTags: jest.fn().mockResolvedValue(2),
      getOrSet: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: CacheManagerService,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    cacheManager = module.get(CacheManagerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createPlayerDto = {
      userId: 'user-123',
      position: 'Forward',
      height: 180,
      weight: 75,
      preferredFoot: 'Right',
      nationality: 'FR',
      dateOfBirth: '1998-05-15',
      clubId: 'club-123',
      status: 'ACTIVE' as any,
    };

    const mockPlayer = {
      id: 'player-123',
      ...createPlayerDto,
      dateOfBirth: new Date('1998-05-15'),
      contractUntil: null,
      jerseyNumber: null,
      marketValue: null,
      overallRating: null,
      availableForTransfer: false,
      statsJson: null,
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

    it('should create a player successfully', async () => {
      prisma.players.create.mockResolvedValue(mockPlayer as any);

      const result = await service.create(createPlayerDto);

      expect(prisma.players.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: createPlayerDto.userId,
          position: createPlayerDto.position,
          dateOfBirth: new Date(createPlayerDto.dateOfBirth),
        }),
        include: expect.objectContaining({
          users: expect.any(Object),
          clubs: expect.any(Object),
        }),
      });
      expect(cacheManager.invalidateByTag).toHaveBeenCalledWith('players:list');
      expect(result).toEqual(mockPlayer);
    });

    it('should convert dateOfBirth string to Date', async () => {
      prisma.players.create.mockResolvedValue(mockPlayer as any);

      await service.create(createPlayerDto);

      expect(prisma.players.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          dateOfBirth: new Date('1998-05-15'),
        }),
        include: expect.any(Object),
      });
    });

    it('should convert contractUntil string to Date', async () => {
      const dtoWithContract = {
        ...createPlayerDto,
        contractUntil: '2026-06-30',
      };
      prisma.players.create.mockResolvedValue(mockPlayer as any);

      await service.create(dtoWithContract);

      expect(prisma.players.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contractUntil: new Date('2026-06-30'),
        }),
        include: expect.any(Object),
      });
    });

    it('should create a player without optional clubId field', async () => {
      const dtoWithoutClub = {
        ...createPlayerDto,
      };
      delete dtoWithoutClub.clubId;
      prisma.players.create.mockResolvedValue(mockPlayer as any);

      await service.create(dtoWithoutClub);

      expect(prisma.players.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: dtoWithoutClub.userId,
          position: dtoWithoutClub.position,
        }),
        include: expect.any(Object),
      });
    });

    it('should create a player without converting date when not provided', async () => {
      const dtoWithoutDates: any = {
        userId: 'user-123',
        position: 'Forward',
        height: 180,
        weight: 75,
        preferredFoot: 'Right',
        nationality: 'FR',
        clubId: 'club-123',
        status: 'ACTIVE' as any,
      };

      const playerWithoutDates = {
        ...mockPlayer,
        dateOfBirth: null,
        contractUntil: null,
      };
      prisma.players.create.mockResolvedValue(playerWithoutDates as any);

      await service.create(dtoWithoutDates);

      const callArgs = (prisma.players.create as jest.Mock).mock.calls[0][0];
      // Check that no date conversion happened
      expect(callArgs.data.dateOfBirth).toBeUndefined();
      expect(callArgs.data.contractUntil).toBeUndefined();
    });
  });

  describe('findAll', () => {
    const mockPlayers = [
      {
        id: 'player-1',
        position: 'Striker',
        dateOfBirth: new Date('1998-01-01'),
        height: 185,
        weight: 80,
        marketValue: 1000000,
        overallRating: 85,
        users: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', avatar: null },
        clubs: { id: 'club-1', name: 'PSG', shortName: 'PSG', logo: 'psg.png', country: 'FR' },
        _count: { scouting_reports: 5, media: 10 },
      },
      {
        id: 'player-2',
        position: 'Central Midfielder',
        dateOfBirth: new Date('2000-06-15'),
        height: 178,
        weight: 72,
        marketValue: 500000,
        overallRating: 78,
        users: { id: 'user-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', avatar: null },
        clubs: { id: 'club-2', name: 'OM', shortName: 'OM', logo: 'om.png', country: 'FR' },
        _count: { scouting_reports: 3, media: 7 },
      },
    ];

    it('should return paginated players with default filters', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(prisma.players.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockPlayers,
        meta: expect.objectContaining({
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        }),
      });
    });

    it('should filter by GOALKEEPER position category', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ position: 'GOALKEEPER', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: { in: ['Goalkeeper'] },
          }),
        }),
      );
    });

    it('should filter by DEFENDER position category', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ position: 'DEFENDER', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: { in: ['Center Back', 'Left Back', 'Right Back'] },
          }),
        }),
      );
    });

    it('should filter by MIDFIELDER position category', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[1]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ position: 'MIDFIELDER', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: { in: ['Central Midfielder', 'Defensive Midfielder', 'Attacking Midfielder'] },
          }),
        }),
      );
    });

    it('should filter by FORWARD position category', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ position: 'FORWARD', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: { in: ['Striker', 'Left Winger', 'Right Winger'] },
          }),
        }),
      );
    });

    it('should filter by exact position when not a category', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ position: 'Striker', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: 'Striker',
          }),
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ status: 'ACTIVE', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        }),
      );
    });

    it('should filter by nationality', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ nationality: 'FR', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            nationality: 'FR',
          }),
        }),
      );
    });

    it('should filter by clubId', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ clubId: 'club-123', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: 'club-123',
          }),
        }),
      );
    });

    it('should filter by preferredFoot', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ preferredFoot: 'RIGHT', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            preferredFoot: 'RIGHT',
          }),
        }),
      );
    });

    it('should filter by availableForTransfer', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ availableForTransfer: true, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            availableForTransfer: true,
          }),
        }),
      );
    });

    it('should filter by height range', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ minHeight: 180, maxHeight: 190, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            height: { gte: 180, lte: 190 },
          }),
        }),
      );
    });

    it('should filter by weight range', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ minWeight: 70, maxWeight: 85, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            weight: { gte: 70, lte: 85 },
          }),
        }),
      );
    });

    it('should filter by market value range', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ minMarketValue: 500000, maxMarketValue: 2000000, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            marketValue: { gte: 500000, lte: 2000000 },
          }),
        }),
      );
    });

    it('should filter by age range', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ minAge: 20, maxAge: 30, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.dateOfBirth).toBeDefined();
      expect(callArgs.where.dateOfBirth.gte).toBeInstanceOf(Date);
      expect(callArgs.where.dateOfBirth.lte).toBeInstanceOf(Date);
    });

    it('should search by player name', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({ search: 'John', page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            users: {
              OR: [
                { firstName: { contains: 'John', mode: 'insensitive' } },
                { lastName: { contains: 'John', mode: 'insensitive' } },
              ],
            },
          }),
        }),
      );
    });

    it('should sort by NAME field', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ sortBy: PlayerSortField.NAME, sortOrder: SortOrder.ASC, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { users: { firstName: 'asc' } },
        }),
      );
    });

    it('should sort by AGE field (inverted)', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ sortBy: PlayerSortField.AGE, sortOrder: SortOrder.ASC, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dateOfBirth: 'desc' },
        }),
      );
    });

    it('should sort by HEIGHT field', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ sortBy: PlayerSortField.HEIGHT, sortOrder: SortOrder.DESC, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { height: 'desc' },
        }),
      );
    });

    it('should sort by MARKET_VALUE field', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ sortBy: PlayerSortField.MARKET_VALUE, sortOrder: SortOrder.DESC, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { marketValue: 'desc' },
        }),
      );
    });

    it('should sort by RATING field', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      await service.findAll({ sortBy: PlayerSortField.RATING, sortOrder: SortOrder.DESC, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { overallRating: 'desc' },
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(45);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.total).toBe(45);
    });

    it('should handle multiple filters simultaneously', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(1);

      await service.findAll({
        position: 'FORWARD',
        nationality: 'FR',
        minHeight: 180,
        maxHeight: 190,
        availableForTransfer: true,
        search: 'John',
        page: 1,
        limit: 20,
      });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: { in: ['Striker', 'Left Winger', 'Right Winger'] },
            nationality: 'FR',
            height: { gte: 180, lte: 190 },
            availableForTransfer: true,
            users: expect.any(Object),
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockPlayer = {
      id: 'player-123',
      position: 'Forward',
      users: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      clubs: { id: 'club-1', name: 'PSG' },
      scouting_reports: [],
      media: [],
      club_requests: [],
      _count: { scouting_reports: 0, media: 0, club_requests: 0 },
    };

    it('should return a player by ID using cache', async () => {
      cacheManager.getOrSet.mockImplementation(async (key, dataProvider) => {
        return await dataProvider();
      });
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const result = await service.findOne('player-123');

      expect(cacheManager.getOrSet).toHaveBeenCalledWith(
        'players:detail:player-123',
        expect.any(Function),
        300,
      );
      expect(result).toEqual(mockPlayer);
    });

    it('should throw NotFoundException if player not found', async () => {
      cacheManager.getOrSet.mockImplementation(async (key, dataProvider) => {
        return await dataProvider();
      });
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
    });

    it('should return cached player without hitting database', async () => {
      cacheManager.getOrSet.mockResolvedValue(mockPlayer);

      const result = await service.findOne('player-123');

      expect(cacheManager.getOrSet).toHaveBeenCalled();
      expect(result).toEqual(mockPlayer);
    });
  });

  describe('update', () => {
    const updatePlayerDto = {
      position: 'Midfielder',
      height: 182,
    };

    const mockPlayer = {
      id: 'player-123',
      position: 'Forward',
      height: 180,
    };

    const mockUpdatedPlayer = {
      ...mockPlayer,
      ...updatePlayerDto,
      users: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', avatar: null },
      clubs: { id: 'club-1', name: 'PSG', logo: 'psg.png' },
    };

    it('should update a player successfully', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.players.update.mockResolvedValue(mockUpdatedPlayer as any);

      const result = await service.update('player-123', updatePlayerDto);

      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prisma.players.update).toHaveBeenCalledWith({
        where: { id: 'player-123' },
        data: expect.objectContaining(updatePlayerDto),
        include: expect.any(Object),
      });
      expect(cacheManager.invalidateByTags).toHaveBeenCalledWith([
        'players:detail:player-123',
        'players:list',
      ]);
      expect(result).toEqual(mockUpdatedPlayer);
    });

    it('should update player with date fields', async () => {
      const dtoWithDates = {
        ...updatePlayerDto,
        dateOfBirth: '1999-03-20',
        contractUntil: '2027-06-30',
      };
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.players.update.mockResolvedValue(mockUpdatedPlayer as any);

      await service.update('player-123', dtoWithDates);

      expect(prisma.players.update).toHaveBeenCalledWith({
        where: { id: 'player-123' },
        data: expect.objectContaining({
          dateOfBirth: new Date('1999-03-20'),
          contractUntil: new Date('2027-06-30'),
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if player not found', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', updatePlayerDto)).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
      expect(prisma.players.update).not.toHaveBeenCalled();
    });

    it('should update player without date fields', async () => {
      const dtoWithoutDates = {
        position: 'Midfielder',
        height: 182,
      };
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.players.update.mockResolvedValue(mockUpdatedPlayer as any);

      await service.update('player-123', dtoWithoutDates);

      const callArgs = (prisma.players.update as jest.Mock).mock.calls[0][0];
      expect(callArgs.data).not.toHaveProperty('dateOfBirth');
      expect(callArgs.data).not.toHaveProperty('contractUntil');
    });
  });

  describe('remove', () => {
    const mockPlayer = {
      id: 'player-123',
      position: 'Forward',
    };

    it('should delete a player successfully', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.players.delete.mockResolvedValue(mockPlayer as any);

      const result = await service.remove('player-123');

      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prisma.players.delete).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(cacheManager.invalidateByTags).toHaveBeenCalledWith([
        'players:detail:player-123',
        'players:list',
      ]);
      expect(result).toEqual(mockPlayer);
    });

    it('should throw NotFoundException if player not found', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
      expect(prisma.players.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    const mockPlayer = {
      id: 'player-123',
      statsJson: { goals: 15, assists: 8 },
    };

    const mockRecentReports = [
      {
        id: 'report-1',
        overallRating: 8.5,
        createdAt: new Date(),
        match: {
          competition: 'Ligue 1',
          scheduledAt: new Date(),
          homeClub: { name: 'PSG' },
          awayClub: { name: 'OM' },
        },
      },
    ];

    it('should return player statistics', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.scouting_reports.count.mockResolvedValue(10);
      prisma.scouting_reports.aggregate.mockResolvedValue({
        _avg: { overallRating: 8.5 },
      } as any);
      prisma.scouting_reports.findMany.mockResolvedValue(mockRecentReports as any);

      const result = await service.getStats('player-123');

      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prisma.scouting_reports.count).toHaveBeenCalledWith({
        where: { playerId: 'player-123', status: 'APPROVED' },
      });
      expect(prisma.scouting_reports.aggregate).toHaveBeenCalledWith({
        where: { playerId: 'player-123', status: 'APPROVED', overallRating: { not: null } },
        _avg: { overallRating: true },
      });
      expect(result).toEqual({
        playerId: 'player-123',
        stats: mockPlayer.statsJson,
        reportsCount: 10,
        averageRating: 8.5,
        recentReports: mockRecentReports,
      });
    });

    it('should handle null average rating', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.scouting_reports.count.mockResolvedValue(0);
      prisma.scouting_reports.aggregate.mockResolvedValue({
        _avg: { overallRating: null },
      } as any);
      prisma.scouting_reports.findMany.mockResolvedValue([]);

      const result = await service.getStats('player-123');

      expect(result.averageRating).toBeNull();
      expect(result.reportsCount).toBe(0);
    });

    it('should throw NotFoundException if player not found', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.getStats('invalid-id')).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
    });
  });

  describe('getReports', () => {
    const mockPlayer = {
      id: 'player-123',
    };

    const mockReports = [
      {
        id: 'report-1',
        playerId: 'player-123',
        overallRating: 8,
        createdAt: new Date(),
        match: {
          id: 'match-1',
          competition: 'Ligue 1',
          homeClub: { id: 'club-1', name: 'PSG' },
          awayClub: { id: 'club-2', name: 'OM' },
        },
        scout: { id: 'scout-1', firstName: 'Scout', lastName: 'One' },
      },
      {
        id: 'report-2',
        playerId: 'player-123',
        overallRating: 7.5,
        createdAt: new Date(),
        match: {
          id: 'match-2',
          competition: 'Ligue 1',
          homeClub: { id: 'club-2', name: 'OM' },
          awayClub: { id: 'club-3', name: 'Lyon' },
        },
        scout: { id: 'scout-2', firstName: 'Scout', lastName: 'Two' },
      },
    ];

    it('should return player scouting reports', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.scouting_reports.findMany.mockResolvedValue(mockReports as any);

      const result = await service.getReports('player-123');

      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
        include: expect.objectContaining({
          matches: expect.any(Object),
          users: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockReports);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no reports exist', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.scouting_reports.findMany.mockResolvedValue([]);

      const result = await service.getReports('player-123');

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should throw NotFoundException if player not found', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.getReports('invalid-id')).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
      expect(prisma.scouting_reports.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findAll - additional branch coverage', () => {
    it('should handle only minHeight filter', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ minHeight: 180, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.height).toEqual({ gte: 180 });
    });

    it('should handle only maxHeight filter', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ maxHeight: 190, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.height).toEqual({ lte: 190 });
    });

    it('should handle only minWeight filter', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ minWeight: 70, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.weight).toEqual({ gte: 70 });
    });

    it('should handle only maxWeight filter', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ maxWeight: 85, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.weight).toEqual({ lte: 85 });
    });

    it('should handle only minMarketValue filter', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ minMarketValue: 500000, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.marketValue).toEqual({ gte: 500000 });
    });

    it('should handle only maxMarketValue filter', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ maxMarketValue: 2000000, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.marketValue).toEqual({ lte: 2000000 });
    });

    it('should handle only minAge filter', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ minAge: 20, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.dateOfBirth).toBeDefined();
      expect(callArgs.where.dateOfBirth.lte).toBeInstanceOf(Date);
    });

    it('should handle only maxAge filter', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ maxAge: 30, page: 1, limit: 20 });

      const callArgs = (prisma.players.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.dateOfBirth).toBeDefined();
      expect(callArgs.where.dateOfBirth.gte).toBeInstanceOf(Date);
    });

    it('should sort by createdAt when sortBy is CREATED_AT', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ sortBy: PlayerSortField.CREATED_AT, sortOrder: SortOrder.DESC, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should sort by createdAt by default when sortBy is undefined', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should invert AGE sort order correctly (DESC becomes asc)', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.findAll({ sortBy: PlayerSortField.AGE, sortOrder: SortOrder.DESC, page: 1, limit: 20 });

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { dateOfBirth: 'asc' },
        }),
      );
    });
  });
});
