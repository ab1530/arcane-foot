import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlayersService', () => {
  let service: PlayersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    player: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    scoutingReport: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    prismaService = module.get<PrismaService>(PrismaService);

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
      user: {
        id: 'user-123',
        email: 'player@example.com',
        firstName: 'John',
        lastName: 'Doe',
        avatar: null,
      },
      club: {
        id: 'club-123',
        name: 'PSG',
        logo: 'psg.png',
      },
    };

    it('should create a player successfully', async () => {
      mockPrismaService.player.create.mockResolvedValue(mockPlayer);

      const result = await service.create(createPlayerDto);

      expect(prismaService.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: createPlayerDto.userId,
          position: createPlayerDto.position,
          dateOfBirth: new Date(createPlayerDto.dateOfBirth),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should convert contractUntil string to Date', async () => {
      const dtoWithContract = {
        ...createPlayerDto,
        contractUntil: '2026-06-30',
      };
      mockPrismaService.player.create.mockResolvedValue(mockPlayer);

      await service.create(dtoWithContract);

      expect(prismaService.player.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contractUntil: new Date('2026-06-30'),
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    const mockPlayers = [
      {
        id: 'player-1',
        position: 'Forward',
        user: { firstName: 'John', lastName: 'Doe' },
        club: { name: 'PSG' },
        _count: { scoutingReports: 5, media: 10 },
      },
      {
        id: 'player-2',
        position: 'Midfielder',
        user: { firstName: 'Jane', lastName: 'Smith' },
        club: { name: 'OM' },
        _count: { scoutingReports: 3, media: 7 },
      },
    ];

    it('should return paginated players', async () => {
      mockPrismaService.player.findMany.mockResolvedValue(mockPlayers);
      mockPrismaService.player.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(prismaService.player.findMany).toHaveBeenCalled();
      expect(prismaService.player.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockPlayers,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('should filter by position', async () => {
      mockPrismaService.player.findMany.mockResolvedValue([mockPlayers[0]]);
      mockPrismaService.player.count.mockResolvedValue(1);

      await service.findAll({ position: 'Forward', page: 1, limit: 20 });

      expect(prismaService.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            position: 'Forward',
          }),
        }),
      );
    });

    it('should filter by clubId', async () => {
      mockPrismaService.player.findMany.mockResolvedValue(mockPlayers);
      mockPrismaService.player.count.mockResolvedValue(2);

      await service.findAll({ clubId: 'club-123', page: 1, limit: 20 });

      expect(prismaService.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clubId: 'club-123',
          }),
        }),
      );
    });

    it('should search by player name', async () => {
      mockPrismaService.player.findMany.mockResolvedValue([mockPlayers[0]]);
      mockPrismaService.player.count.mockResolvedValue(1);

      await service.findAll({ search: 'John', page: 1, limit: 20 });

      expect(prismaService.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            user: {
              OR: expect.any(Array),
            },
          }),
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      mockPrismaService.player.findMany.mockResolvedValue(mockPlayers);
      mockPrismaService.player.count.mockResolvedValue(45);

      const result = await service.findAll({ page: 2, limit: 20 });

      expect(prismaService.player.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        }),
      );
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    const mockPlayer = {
      id: 'player-123',
      position: 'Forward',
      user: { firstName: 'John', lastName: 'Doe' },
      club: { name: 'PSG' },
      scoutingReports: [],
      media: [],
      clubRequests: [],
      _count: { scoutingReports: 0, media: 0, clubRequests: 0 },
    };

    it('should return a player by ID', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);

      const result = await service.findOne('player-123');

      expect(prismaService.player.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
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
    };

    const mockUpdatedPlayer = {
      ...mockPlayer,
      ...updatePlayerDto,
      user: { firstName: 'John' },
      club: { name: 'PSG' },
    };

    it('should update a player successfully', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.player.update.mockResolvedValue(mockUpdatedPlayer);

      const result = await service.update('player-123', updatePlayerDto);

      expect(prismaService.player.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prismaService.player.update).toHaveBeenCalledWith({
        where: { id: 'player-123' },
        data: expect.objectContaining(updatePlayerDto),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedPlayer);
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);

      await expect(
        service.update('invalid-id', updatePlayerDto),
      ).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
      expect(prismaService.player.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const mockPlayer = {
      id: 'player-123',
      position: 'Forward',
    };

    it('should delete a player successfully', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.player.delete.mockResolvedValue(mockPlayer);

      const result = await service.remove('player-123');

      expect(prismaService.player.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prismaService.player.delete).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(result).toEqual(mockPlayer);
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
      expect(prismaService.player.delete).not.toHaveBeenCalled();
    });
  });

  describe('getStats', () => {
    const mockPlayer = {
      id: 'player-123',
      statsJson: { goals: 15, assists: 8 },
    };

    const mockStats = {
      reportsCount: 10,
      averageRating: { _avg: { overallRating: 8.5 } },
      recentReports: [],
    };

    it('should return player statistics', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.scoutingReport.count.mockResolvedValue(
        mockStats.reportsCount,
      );
      mockPrismaService.scoutingReport.aggregate.mockResolvedValue(
        mockStats.averageRating,
      );
      mockPrismaService.scoutingReport.findMany.mockResolvedValue(
        mockStats.recentReports,
      );

      const result = await service.getStats('player-123');

      expect(prismaService.player.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(result).toEqual({
        playerId: 'player-123',
        stats: mockPlayer.statsJson,
        reportsCount: mockStats.reportsCount,
        averageRating: mockStats.averageRating._avg.overallRating,
        recentReports: mockStats.recentReports,
      });
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);

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
        match: { competition: 'Ligue 1' },
        scout: { firstName: 'Scout', lastName: 'One' },
      },
    ];

    it('should return player scouting reports', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(mockPlayer);
      mockPrismaService.scoutingReport.findMany.mockResolvedValue(mockReports);

      const result = await service.getReports('player-123');

      expect(prismaService.player.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prismaService.scoutingReport.findMany).toHaveBeenCalledWith({
        where: { playerId: 'player-123' },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockReports);
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPrismaService.player.findUnique.mockResolvedValue(null);

      await expect(service.getReports('invalid-id')).rejects.toThrow(
        new NotFoundException('Player with ID invalid-id not found'),
      );
    });
  });
});
