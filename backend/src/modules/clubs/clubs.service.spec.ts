import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClubsService } from './clubs.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ClubsService', () => {
  let service: ClubsService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    clubs: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    players: {
      findMany: jest.fn(),
    },
    matches: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ClubsService>(ClubsService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createClubDto = {
      name: 'Paris Saint-Germain',
      shortName: 'PSG',
      country: 'FR',
      city: 'Paris',
      stadium: 'Parc des Princes',
      founded: 1970,
      logo: 'psg-logo.png',
      website: 'https://www.psg.fr',
    };

    const mockClub = {
      id: 'club-123',
      ...createClubDto,
      contactUser: null,
      createdAt: new Date(),
    };

    it('should create a club successfully', async () => {
      mockPrismaService.clubs.create.mockResolvedValue(mockClub);

      const result = await service.create(createClubDto);

      expect(prismaService.clubs.create).toHaveBeenCalledWith({
        data: createClubDto,
        include: expect.any(Object),
      });
      expect(result).toEqual(mockClub);
    });
  });

  describe('findAll', () => {
    const mockClubs = [
      {
        id: 'club-1',
        name: 'PSG',
        country: 'FR',
        _count: { players: 25, homeMatches: 10, awayMatches: 12 },
      },
      {
        id: 'club-2',
        name: 'OM',
        country: 'FR',
        _count: { players: 23, homeMatches: 11, awayMatches: 9 },
      },
    ];

    it('should return paginated clubs', async () => {
      mockPrismaService.clubs.findMany.mockResolvedValue(mockClubs);
      mockPrismaService.clubs.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(prismaService.clubs.findMany).toHaveBeenCalled();
      expect(prismaService.clubs.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: mockClubs,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('should filter by country', async () => {
      mockPrismaService.clubs.findMany.mockResolvedValue(mockClubs);
      mockPrismaService.clubs.count.mockResolvedValue(2);

      await service.findAll({ country: 'FR', page: 1, limit: 20 });

      expect(prismaService.clubs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: 'FR',
          }),
        }),
      );
    });

    it('should filter by city', async () => {
      mockPrismaService.clubs.findMany.mockResolvedValue([mockClubs[0]]);
      mockPrismaService.clubs.count.mockResolvedValue(1);

      await service.findAll({ city: 'Paris', page: 1, limit: 20 });

      expect(prismaService.clubs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: 'Paris',
          }),
        }),
      );
    });

    it('should search by club name', async () => {
      mockPrismaService.clubs.findMany.mockResolvedValue([mockClubs[0]]);
      mockPrismaService.clubs.count.mockResolvedValue(1);

      await service.findAll({ search: 'PSG', page: 1, limit: 20 });

      expect(prismaService.clubs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        }),
      );
    });

    it('should calculate pagination correctly', async () => {
      mockPrismaService.clubs.findMany.mockResolvedValue(mockClubs);
      mockPrismaService.clubs.count.mockResolvedValue(50);

      const result = await service.findAll({ page: 3, limit: 20 });

      expect(prismaService.clubs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40,
          take: 20,
        }),
      );
      expect(result.meta.totalPages).toBe(3);
    });
  });

  describe('findOne', () => {
    const mockClub = {
      id: 'club-123',
      name: 'PSG',
      contactUser: null,
      players: [],
      homeMatches: [],
      awayMatches: [],
      _count: {
        players: 0,
        homeMatches: 0,
        awayMatches: 0,
        clubRequests: 0,
        camps: 0,
      },
    };

    it('should return a club by ID', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);

      const result = await service.findOne('club-123');

      expect(prismaService.clubs.findUnique).toHaveBeenCalledWith({
        where: { id: 'club-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockClub);
    });

    it('should throw NotFoundException if club not found', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Club with ID invalid-id not found'),
      );
    });
  });

  describe('update', () => {
    const updateClubDto = {
      name: 'Paris SG',
      stadium: 'New Stadium',
    };

    const mockClub = {
      id: 'club-123',
      name: 'PSG',
    };

    const mockUpdatedClub = {
      ...mockClub,
      ...updateClubDto,
      contactUser: null,
    };

    it('should update a club successfully', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockPrismaService.clubs.update.mockResolvedValue(mockUpdatedClub);

      const result = await service.update('club-123', updateClubDto);

      expect(prismaService.clubs.findUnique).toHaveBeenCalledWith({
        where: { id: 'club-123' },
      });
      expect(prismaService.clubs.update).toHaveBeenCalledWith({
        where: { id: 'club-123' },
        data: updateClubDto,
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedClub);
    });

    it('should throw NotFoundException if club not found', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateClubDto)).rejects.toThrow(
        new NotFoundException('Club with ID invalid-id not found'),
      );
      expect(prismaService.clubs.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const mockClub = {
      id: 'club-123',
      name: 'PSG',
    };

    it('should delete a club successfully', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockPrismaService.clubs.delete.mockResolvedValue(mockClub);

      const result = await service.remove('club-123');

      expect(prismaService.clubs.findUnique).toHaveBeenCalledWith({
        where: { id: 'club-123' },
      });
      expect(prismaService.clubs.delete).toHaveBeenCalledWith({
        where: { id: 'club-123' },
      });
      expect(result).toEqual(mockClub);
    });

    it('should throw NotFoundException if club not found', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Club with ID invalid-id not found'),
      );
      expect(prismaService.clubs.delete).not.toHaveBeenCalled();
    });
  });

  describe('getPlayers', () => {
    const mockClub = {
      id: 'club-123',
      name: 'PSG',
    };

    const mockPlayers = [
      {
        id: 'player-1',
        clubId: 'club-123',
        jerseyNumber: 7,
        user: { firstName: 'Kylian', lastName: 'Mbappé' },
      },
      {
        id: 'player-2',
        clubId: 'club-123',
        jerseyNumber: 10,
        user: { firstName: 'Neymar', lastName: 'Jr' },
      },
    ];

    it('should return club players', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockPrismaService.players.findMany.mockResolvedValue(mockPlayers);

      const result = await service.getPlayers('club-123');

      expect(prismaService.clubs.findUnique).toHaveBeenCalledWith({
        where: { id: 'club-123' },
      });
      expect(prismaService.players.findMany).toHaveBeenCalledWith({
        where: { clubId: 'club-123' },
        include: expect.any(Object),
        orderBy: { jerseyNumber: 'asc' },
      });
      expect(result).toEqual(mockPlayers);
    });

    it('should throw NotFoundException if club not found', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(null);

      await expect(service.getPlayers('invalid-id')).rejects.toThrow(
        new NotFoundException('Club with ID invalid-id not found'),
      );
      expect(prismaService.players.findMany).not.toHaveBeenCalled();
    });
  });

  describe('getMatches', () => {
    const mockClub = {
      id: 'club-123',
      name: 'PSG',
    };

    const mockMatches = [
      {
        id: 'match-1',
        homeClubId: 'club-123',
        awayClubId: 'club-456',
        scheduledAt: new Date('2025-12-25'),
        status: 'SCHEDULED',
      },
      {
        id: 'match-2',
        homeClubId: 'club-789',
        awayClubId: 'club-123',
        scheduledAt: new Date('2025-12-30'),
        status: 'SCHEDULED',
      },
    ];

    it('should return all club matches', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockPrismaService.matches.findMany.mockResolvedValue(mockMatches);

      const result = await service.getMatches('club-123');

      expect(prismaService.clubs.findUnique).toHaveBeenCalledWith({
        where: { id: 'club-123' },
      });
      expect(prismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ homeClubId: 'club-123' }, { awayClubId: 'club-123' }],
          }),
        }),
      );
      expect(result).toEqual(mockMatches);
    });

    it('should return only upcoming matches when requested', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockPrismaService.matches.findMany.mockResolvedValue(mockMatches);

      await service.getMatches('club-123', { upcoming: true });

      expect(prismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scheduledAt: { gte: expect.any(Date) },
            status: { in: ['SCHEDULED'] },
          }),
        }),
      );
    });

    it('should throw NotFoundException if club not found', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(null);

      await expect(service.getMatches('invalid-id')).rejects.toThrow(
        new NotFoundException('Club with ID invalid-id not found'),
      );
      expect(prismaService.matches.findMany).not.toHaveBeenCalled();
    });
  });
});
