import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { PrismaService } from '../prisma/prisma.service';
import { MatchStatus } from '@prisma/client';

describe('MatchesService', () => {
  let service: MatchesService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    matches: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    clubs: {
      findUnique: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
    match_assignments: {
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createMatchDto = {
      homeClubId: 'club-home',
      awayClubId: 'club-away',
      scheduledAt: '2025-12-25T15:00:00Z',
      venue: 'Stade de France',
      competition: 'Ligue 1',
      season: '2025-2026',
      status: MatchStatus.SCHEDULED,
    };

    const mockHomeClub = { id: 'club-home', name: 'PSG' };
    const mockAwayClub = { id: 'club-away', name: 'OM' };
    const mockMatch = {
      id: 'match-123',
      ...createMatchDto,
      scheduledAt: new Date('2025-12-25T15:00:00Z'),
      homeClub: mockHomeClub,
      awayClub: mockAwayClub,
      scout: null,
    };

    it('should create a match successfully', async () => {
      mockPrismaService.clubs.findUnique
        .mockResolvedValueOnce(mockHomeClub)
        .mockResolvedValueOnce(mockAwayClub);
      mockPrismaService.matches.create.mockResolvedValue(mockMatch);

      const result = await service.create(createMatchDto);

      expect(prismaService.clubs.findUnique).toHaveBeenCalledTimes(2);
      expect(prismaService.matches.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          homeClubId: createMatchDto.homeClubId,
          awayClubId: createMatchDto.awayClubId,
          scheduledAt: new Date(createMatchDto.scheduledAt),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockMatch);
    });

    it('should throw NotFoundException if home club not found', async () => {
      mockPrismaService.clubs.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockAwayClub);

      await expect(service.create(createMatchDto)).rejects.toThrow(
        new NotFoundException(`Home club with ID ${createMatchDto.homeClubId} not found`),
      );
      expect(prismaService.matches.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if away club not found', async () => {
      mockPrismaService.clubs.findUnique
        .mockResolvedValueOnce(mockHomeClub)
        .mockResolvedValueOnce(null);

      await expect(service.create(createMatchDto)).rejects.toThrow(
        new NotFoundException(`Away club with ID ${createMatchDto.awayClubId} not found`),
      );
      expect(prismaService.matches.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if home and away clubs are the same', async () => {
      const invalidDto = {
        ...createMatchDto,
        awayClubId: createMatchDto.homeClubId,
      };
      mockPrismaService.clubs.findUnique
        .mockResolvedValueOnce(mockHomeClub)
        .mockResolvedValueOnce(mockHomeClub);

      await expect(service.create(invalidDto)).rejects.toThrow(
        new BadRequestException('Home and away clubs must be different'),
      );
      expect(prismaService.matches.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    const mockMatches = [
      {
        id: 'match-1',
        clubs_matches_homeClubIdToclubs: { name: 'PSG' },
        clubs_matches_awayClubIdToclubs: { name: 'OM' },
        users_matches_scoutIdTousers: null,
        _count: { scouting_reports: 3 },
      },
      {
        id: 'match-2',
        clubs_matches_homeClubIdToclubs: { name: 'Lyon' },
        clubs_matches_awayClubIdToclubs: { name: 'PSG' },
        users_matches_scoutIdTousers: null,
        _count: { scouting_reports: 5 },
      },
    ];

    const expectedMatches = [
      {
        id: 'match-1',
        clubs_matches_homeClubIdToclubs: { name: 'PSG' },
        clubs_matches_awayClubIdToclubs: { name: 'OM' },
        users_matches_scoutIdTousers: null,
        mobileStatus: 'PLANNED',
        homeClub: { name: 'PSG' },
        awayClub: { name: 'OM' },
        scout: null,
        assignments: [],
        _count: { scoutingReports: 3 },
      },
      {
        id: 'match-2',
        clubs_matches_homeClubIdToclubs: { name: 'Lyon' },
        clubs_matches_awayClubIdToclubs: { name: 'PSG' },
        users_matches_scoutIdTousers: null,
        mobileStatus: 'PLANNED',
        homeClub: { name: 'Lyon' },
        awayClub: { name: 'PSG' },
        scout: null,
        assignments: [],
        _count: { scoutingReports: 5 },
      },
    ];

    it('should return paginated matches', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockMatches);
      mockPrismaService.matches.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(prismaService.matches.findMany).toHaveBeenCalled();
      expect(prismaService.matches.count).toHaveBeenCalled();
      expect(result).toEqual({
        data: expectedMatches,
        meta: {
          total: 2,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('should filter by status', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue([mockMatches[0]]);
      mockPrismaService.matches.count.mockResolvedValue(1);

      await service.findAll({
        status: MatchStatus.SCHEDULED,
        page: 1,
        limit: 20,
      });

      expect(prismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: MatchStatus.SCHEDULED,
          }),
        }),
      );
    });

    it('should filter by clubId (home or away)', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockMatches);
      mockPrismaService.matches.count.mockResolvedValue(2);

      await service.findAll({ clubId: 'club-123', page: 1, limit: 20 });

      expect(prismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ homeClubId: 'club-123' }, { awayClubId: 'club-123' }],
          }),
        }),
      );
    });

    it('should filter by date range', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockMatches);
      mockPrismaService.matches.count.mockResolvedValue(2);

      await service.findAll({
        from: '2025-01-01',
        to: '2025-12-31',
        page: 1,
        limit: 20,
      });

      expect(prismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scheduledAt: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-12-31'),
            },
          }),
        }),
      );
    });
  });

  describe('findUserAssignments', () => {
    const mockAssignedMatches = [
      {
        id: 'match-1',
        scheduledAt: new Date('2026-06-13T12:00:00Z'),
        clubs_matches_homeClubIdToclubs: {
          id: 'club-home-1',
          name: 'FC Home',
          shortName: 'FH',
          logo: null,
        },
        clubs_matches_awayClubIdToclubs: {
          id: 'club-away-1',
          name: 'FC Away',
          shortName: 'FA',
          logo: null,
        },
        users_matches_scoutIdTousers: {
          id: 'legacy-scout',
          firstName: 'Legacy',
          lastName: 'Scout',
        },
        match_assignments: [
          {
            id: 'assignment-1',
            scoutId: 'scout-1',
            status: 'IN_PROGRESS',
            role: 'SCOUT',
            reportSubmitted: true,
            users_match_assignments_scoutIdTousers: {
              id: 'scout-1',
              firstName: 'Jane',
              lastName: 'Doe',
              avatar: 'avatar.jpg',
              role: 'SCOUT',
            },
            users_match_assignments_assignedByIdTousers: {
              id: 'admin-1',
              firstName: 'Admin',
              lastName: 'Lead',
              role: 'ADMIN',
            },
          },
        ],
        _count: { scouting_reports: 3 },
      },
    ];

    const expectedAssignments = [
      {
        id: 'match-1',
        scheduledAt: new Date('2026-06-13T12:00:00Z'),
        clubs_matches_homeClubIdToclubs: {
          id: 'club-home-1',
          name: 'FC Home',
          shortName: 'FH',
          logo: null,
        },
        clubs_matches_awayClubIdToclubs: {
          id: 'club-away-1',
          name: 'FC Away',
          shortName: 'FA',
          logo: null,
        },
        users_matches_scoutIdTousers: {
          id: 'legacy-scout',
          firstName: 'Legacy',
          lastName: 'Scout',
        },
        match_assignments: [
          {
            id: 'assignment-1',
            scoutId: 'scout-1',
            status: 'IN_PROGRESS',
            role: 'SCOUT',
            reportSubmitted: true,
            users_match_assignments_scoutIdTousers: {
              id: 'scout-1',
              firstName: 'Jane',
              lastName: 'Doe',
              avatar: 'avatar.jpg',
              role: 'SCOUT',
            },
            users_match_assignments_assignedByIdTousers: {
              id: 'admin-1',
              firstName: 'Admin',
              lastName: 'Lead',
              role: 'ADMIN',
            },
          },
        ],
        _count: { scouting_reports: 3 },
      },
    ];

    it('should return assignments for user with transformed assignment payload', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockAssignedMatches);
      mockPrismaService.matches.count.mockResolvedValue(1);

      const result = await service.findUserAssignments('legacy-scout', {
        page: 1,
        limit: 20,
      });

      expect(prismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { scoutId: 'legacy-scout' },
              { match_assignments: { some: { scoutId: 'legacy-scout' } } },
            ],
          }),
          skip: 0,
          take: 20,
          include: expect.objectContaining({
            match_assignments: expect.any(Object),
          }),
        }),
      );

      expect(result).toEqual({
        data: expectedAssignments.map((match) => ({
          ...match,
          mobileStatus: 'REPORT_SUBMITTED',
          homeClub: match.clubs_matches_homeClubIdToclubs,
          awayClub: match.clubs_matches_awayClubIdToclubs,
          scout: match.users_matches_scoutIdTousers,
          assignments: [
            {
              id: 'assignment-1',
              scoutId: 'scout-1',
              status: 'IN_PROGRESS',
              mobileStatus: 'REPORT_SUBMITTED',
              role: 'SCOUT',
              reportSubmitted: true,
              scout: {
                firstName: 'Jane',
                lastName: 'Doe',
                avatar: 'avatar.jpg',
                role: 'SCOUT',
              },
              assignedBy: {
                id: 'admin-1',
                firstName: 'Admin',
                lastName: 'Lead',
                role: 'ADMIN',
              },
            },
          ],
          _count: {
            scoutingReports: 3,
          },
        })),
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      });
    });

    it('should pass date filters to assignment query', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockAssignedMatches);
      mockPrismaService.matches.count.mockResolvedValue(1);

      await service.findUserAssignments('legacy-scout', {
        from: '2026-06-01',
        to: '2026-06-30',
        page: 1,
        limit: 20,
      });

      expect(prismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            scheduledAt: {
              gte: new Date('2026-06-01'),
              lte: new Date('2026-06-30'),
            },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    const mockMatch = {
      id: 'match-123',
      clubs_matches_homeClubIdToclubs: { name: 'PSG' },
      clubs_matches_awayClubIdToclubs: { name: 'OM' },
      users_matches_scoutIdTousers: { firstName: 'John', lastName: 'Doe' },
      scouting_reports: [],
      media: [],
      _count: { scouting_reports: 0 },
    };

    const expectedMatch = {
      id: 'match-123',
      clubs_matches_homeClubIdToclubs: { name: 'PSG' },
      clubs_matches_awayClubIdToclubs: { name: 'OM' },
      users_matches_scoutIdTousers: { firstName: 'John', lastName: 'Doe' },
      scouting_reports: [],
      media: [],
      mobileStatus: 'PLANNED',
      homeClub: { name: 'PSG' },
      awayClub: { name: 'OM' },
      scout: { firstName: 'John', lastName: 'Doe' },
      _count: { scoutingReports: 0 },
    };

    it('should return a match by ID', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);

      const result = await service.findOne('match-123');

      expect(prismaService.matches.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(expectedMatch);
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException('Match with ID invalid-id not found'),
      );
    });
  });

  describe('update', () => {
    const updateMatchDto = {
      venue: 'New Stadium',
      status: MatchStatus.LIVE,
    };

    const mockMatch = {
      id: 'match-123',
      venue: 'Old Stadium',
      status: MatchStatus.SCHEDULED,
    };

    const mockUpdatedMatch = {
      ...mockMatch,
      ...updateMatchDto,
      homeClub: { name: 'PSG' },
      awayClub: { name: 'OM' },
    };

    it('should update a match successfully', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.matches.update.mockResolvedValue(mockUpdatedMatch);

      const result = await service.update('match-123', updateMatchDto);

      expect(prismaService.matches.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-123' },
      });
      expect(prismaService.matches.update).toHaveBeenCalledWith({
        where: { id: 'match-123' },
        data: expect.objectContaining(updateMatchDto),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedMatch);
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateMatchDto)).rejects.toThrow(
        new NotFoundException('Match with ID invalid-id not found'),
      );
      expect(prismaService.matches.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const mockMatch = {
      id: 'match-123',
      status: MatchStatus.SCHEDULED,
    };

    it('should delete a match successfully', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.matches.delete.mockResolvedValue(mockMatch);

      const result = await service.remove('match-123');

      expect(prismaService.matches.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-123' },
      });
      expect(prismaService.matches.delete).toHaveBeenCalledWith({
        where: { id: 'match-123' },
      });
      expect(result).toEqual(mockMatch);
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException('Match with ID invalid-id not found'),
      );
      expect(prismaService.matches.delete).not.toHaveBeenCalled();
    });
  });

  describe('assignScout', () => {
    const mockMatch = { id: 'match-123' };
    const mockScout = {
      id: 'scout-123',
      role: 'SCOUT',
      firstName: 'John',
      lastName: 'Doe',
    };
    const mockUpdatedMatch = {
      ...mockMatch,
      scoutId: 'scout-123',
      homeClub: { name: 'PSG' },
      awayClub: { name: 'OM' },
      scout: mockScout,
    };

    it('should assign scout to match successfully', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.users.findUnique.mockResolvedValue(mockScout);
      mockPrismaService.matches.update.mockResolvedValue(mockUpdatedMatch);

      const result = await service.assignScout('match-123', 'scout-123');

      expect(prismaService.matches.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-123' },
      });
      expect(prismaService.users.findUnique).toHaveBeenCalledWith({
        where: { id: 'scout-123' },
      });
      expect(prismaService.matches.update).toHaveBeenCalledWith({
        where: { id: 'match-123' },
        data: { scoutId: 'scout-123' },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedMatch);
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(null);

      await expect(service.assignScout('invalid-id', 'scout-123')).rejects.toThrow(
        new NotFoundException('Match with ID invalid-id not found'),
      );
    });

    it('should throw NotFoundException if scout not found', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.assignScout('match-123', 'invalid-scout')).rejects.toThrow(
        new NotFoundException('Scout with ID invalid-scout not found'),
      );
    });

    it('should throw BadRequestException if user is not a scout', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.users.findUnique.mockResolvedValue({
        ...mockScout,
        role: 'PUBLIC',
      });

      await expect(service.assignScout('match-123', 'scout-123')).rejects.toThrow(
        new BadRequestException('User is not a scout'),
      );
    });
  });

  describe('updateScore', () => {
    const mockMatch = {
      id: 'match-123',
      homeScore: null,
      awayScore: null,
      status: MatchStatus.LIVE,
    };

    const mockUpdatedMatch = {
      ...mockMatch,
      homeScore: 2,
      awayScore: 1,
      status: MatchStatus.COMPLETED,
      homeClub: { name: 'PSG' },
      awayClub: { name: 'OM' },
    };

    it('should update match score and mark as completed', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(mockMatch);
      mockPrismaService.matches.update.mockResolvedValue(mockUpdatedMatch);

      const result = await service.updateScore('match-123', 2, 1);

      expect(prismaService.matches.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-123' },
      });
      expect(prismaService.matches.update).toHaveBeenCalledWith({
        where: { id: 'match-123' },
        data: {
          homeScore: 2,
          awayScore: 1,
          status: MatchStatus.COMPLETED,
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedMatch);
    });

    it('should throw NotFoundException if match not found', async () => {
      mockPrismaService.matches.findUnique.mockResolvedValue(null);

      await expect(service.updateScore('invalid-id', 2, 1)).rejects.toThrow(
        new NotFoundException('Match with ID invalid-id not found'),
      );
    });
  });

  describe('getUpcoming', () => {
    const mockUpcomingMatches = [
      {
        id: 'match-1',
        scheduledAt: new Date('2026-01-15'),
        status: MatchStatus.SCHEDULED,
      },
      {
        id: 'match-2',
        scheduledAt: new Date('2026-01-20'),
        status: MatchStatus.SCHEDULED,
      },
    ];

    it('should return upcoming matches', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockUpcomingMatches);

      const result = await service.getUpcoming(10);

      expect(prismaService.matches.findMany).toHaveBeenCalledWith({
        where: {
          scheduledAt: { gte: expect.any(Date) },
          status: MatchStatus.SCHEDULED,
        },
        take: 10,
        include: expect.any(Object),
        orderBy: { scheduledAt: 'asc' },
      });
      expect(result).toEqual(
        mockUpcomingMatches.map((match) => ({
          ...match,
          mobileStatus: 'PLANNED',
          homeClub: undefined,
          awayClub: undefined,
          scout: undefined,
        })),
      );
    });

    it('should use default limit of 10', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockUpcomingMatches);

      await service.getUpcoming();

      expect(prismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  describe('getLive', () => {
    const mockLiveMatches = [
      {
        id: 'match-1',
        status: MatchStatus.LIVE,
        clubs_matches_homeClubIdToclubs: { name: 'PSG' },
        clubs_matches_awayClubIdToclubs: { name: 'OM' },
      },
    ];

    const expectedLiveMatches = [
      {
        id: 'match-1',
        status: MatchStatus.LIVE,
        clubs_matches_homeClubIdToclubs: { name: 'PSG' },
        clubs_matches_awayClubIdToclubs: { name: 'OM' },
        mobileStatus: 'EN_ROUTE',
        homeClub: { name: 'PSG' },
        awayClub: { name: 'OM' },
      },
    ];

    it('should return live matches', async () => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockLiveMatches);

      const result = await service.getLive();

      expect(prismaService.matches.findMany).toHaveBeenCalledWith({
        where: { status: MatchStatus.LIVE },
        include: expect.any(Object),
      });
      expect(result).toEqual(expectedLiveMatches);
    });
  });
});
