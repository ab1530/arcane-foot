import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';
import { SearchEntity } from './dto/search-query.dto';

describe('SearchService', () => {
  let service: SearchService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    players: {
      findMany: jest.fn(),
    },
    clubs: {
      findMany: jest.fn(),
    },
    matches: {
      findMany: jest.fn(),
    },
    events: {
      findMany: jest.fn(),
    },
    scouting_reports: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('globalSearch', () => {
    const mockPlayers = [
      {
        id: 'player-1',
        user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com', avatar: null },
        club: { id: 'club-1', name: 'PSG', logo: 'psg.png' },
      },
    ];

    const mockClubs = [
      {
        id: 'club-1',
        name: 'Paris Saint-Germain',
        shortName: 'PSG',
        logo: 'psg.png',
        city: 'Paris',
        country: 'France',
        _count: { players: 25, homeMatches: 15, awayMatches: 13 },
      },
    ];

    const mockMatches = [
      {
        id: 'match-1',
        homeClub: { id: 'club-1', name: 'PSG', shortName: 'PSG', logo: 'psg.png' },
        awayClub: { id: 'club-2', name: 'OM', shortName: 'OM', logo: 'om.png' },
        _count: { scoutingReports: 5 },
      },
    ];

    const mockEvents = [
      {
        id: 'event-1',
        title: 'Training Session',
        description: 'Weekly training',
        location: 'Paris',
      },
    ];

    const mockReports = [
      {
        id: 'report-1',
        player: { user: { id: 'user-1', firstName: 'John', lastName: 'Doe', avatar: null } },
        scout: { id: 'scout-1', firstName: 'Jane', lastName: 'Smith' },
        match: {
          id: 'match-1',
          competition: { id: 'comp-1', name: 'Ligue 1' },
          homeClub: { name: 'PSG', logo: 'psg.png' },
          awayClub: { name: 'OM', logo: 'om.png' },
        },
      },
    ];

    beforeEach(() => {
      mockPrismaService.players.findMany.mockResolvedValue(mockPlayers);
      mockPrismaService.clubs.findMany.mockResolvedValue(mockClubs);
      mockPrismaService.matches.findMany.mockResolvedValue(mockMatches);
      mockPrismaService.events.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);
    });

    it('should search all entities when SearchEntity.ALL is specified', async () => {
      const result = await service.globalSearch({
        query: 'test',
        entities: [SearchEntity.ALL],
        limit: 10,
      });

      expect(result.query).toBe('test');
      expect(result.results[SearchEntity.PLAYERS]).toEqual(mockPlayers);
      expect(result.results[SearchEntity.CLUBS]).toEqual(mockClubs);
      expect(result.results[SearchEntity.MATCHES]).toEqual(mockMatches);
      expect(result.results[SearchEntity.EVENTS]).toEqual(mockEvents);
      expect(result.results[SearchEntity.SCOUTING_REPORTS]).toEqual(mockReports);
      expect(result.totalResults).toBe(5); // 1 player + 1 club + 1 match + 1 event + 1 report
    });

    it('should search only specified entities', async () => {
      const result = await service.globalSearch({
        query: 'test',
        entities: [SearchEntity.PLAYERS, SearchEntity.CLUBS],
        limit: 10,
      });

      expect(result.results[SearchEntity.PLAYERS]).toEqual(mockPlayers);
      expect(result.results[SearchEntity.CLUBS]).toEqual(mockClubs);
      expect(result.results[SearchEntity.MATCHES]).toBeUndefined();
      expect(result.results[SearchEntity.EVENTS]).toBeUndefined();
      expect(result.totalResults).toBe(2);
    });

    it('should use default limit of 10 if not specified', async () => {
      await service.globalSearch({
        query: 'test',
      });

      expect(mockPrismaService.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });

    it('should use custom limit when specified', async () => {
      await service.globalSearch({
        query: 'test',
        entities: [SearchEntity.PLAYERS],
        limit: 5,
      });

      expect(mockPrismaService.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5 }),
      );
    });

    it('should return empty results for empty search results', async () => {
      mockPrismaService.players.findMany.mockResolvedValue([]);
      mockPrismaService.clubs.findMany.mockResolvedValue([]);
      mockPrismaService.matches.findMany.mockResolvedValue([]);
      mockPrismaService.events.findMany.mockResolvedValue([]);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);

      const result = await service.globalSearch({
        query: 'nonexistent',
      });

      expect(result.totalResults).toBe(0);
    });

    it('should execute all searches in parallel', async () => {
      const startTime = Date.now();

      await service.globalSearch({
        query: 'test',
        entities: [SearchEntity.ALL],
        limit: 10,
      });

      // Verify all findMany calls were made (parallelism can't be directly tested,
      // but we verify all were called)
      expect(mockPrismaService.players.findMany).toHaveBeenCalled();
      expect(mockPrismaService.clubs.findMany).toHaveBeenCalled();
      expect(mockPrismaService.matches.findMany).toHaveBeenCalled();
      expect(mockPrismaService.events.findMany).toHaveBeenCalled();
      expect(mockPrismaService.scouting_reports.findMany).toHaveBeenCalled();
    });
  });

  describe('searchPlayers (private method via globalSearch)', () => {
    const mockPlayers = [
      {
        id: 'player-1',
        user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        club: { name: 'PSG' },
      },
    ];

    beforeEach(() => {
      mockPrismaService.players.findMany.mockResolvedValue(mockPlayers);
      mockPrismaService.clubs.findMany.mockResolvedValue([]);
      mockPrismaService.matches.findMany.mockResolvedValue([]);
      mockPrismaService.events.findMany.mockResolvedValue([]);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);
    });

    it('should search players by firstName (case insensitive)', async () => {
      await service.globalSearch({
        query: 'john',
        entities: [SearchEntity.PLAYERS],
        limit: 10,
      });

      expect(mockPrismaService.players.findMany).toHaveBeenCalledWith({
        where: {
          user: {
            OR: [
              { firstName: { contains: 'john', mode: 'insensitive' } },
              { lastName: { contains: 'john', mode: 'insensitive' } },
              { email: { contains: 'john', mode: 'insensitive' } },
            ],
          },
        },
        take: 10,
        include: expect.objectContaining({
          user: expect.any(Object),
          club: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should include user and club data in player results', async () => {
      const result = await service.globalSearch({
        query: 'john',
        entities: [SearchEntity.PLAYERS],
      });

      expect(mockPrismaService.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
            club: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        }),
      );
    });
  });

  describe('searchClubs (private method via globalSearch)', () => {
    const mockClubs = [
      {
        id: 'club-1',
        name: 'Paris Saint-Germain',
        shortName: 'PSG',
        city: 'Paris',
        country: 'France',
      },
    ];

    beforeEach(() => {
      mockPrismaService.clubs.findMany.mockResolvedValue(mockClubs);
      mockPrismaService.players.findMany.mockResolvedValue([]);
      mockPrismaService.matches.findMany.mockResolvedValue([]);
      mockPrismaService.events.findMany.mockResolvedValue([]);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);
    });

    it('should search clubs by name, shortName, city, or country (case insensitive)', async () => {
      await service.globalSearch({
        query: 'paris',
        entities: [SearchEntity.CLUBS],
        limit: 10,
      });

      expect(mockPrismaService.clubs.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'paris', mode: 'insensitive' } },
            { shortName: { contains: 'paris', mode: 'insensitive' } },
            { city: { contains: 'paris', mode: 'insensitive' } },
            { country: { contains: 'paris', mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: expect.objectContaining({
          id: true,
          name: true,
          shortName: true,
          logo: true,
          city: true,
          country: true,
          _count: expect.objectContaining({
            select: {
              players: true,
              homeMatches: true,
              awayMatches: true,
            },
          }),
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should include player and match counts in club results', async () => {
      await service.globalSearch({
        query: 'paris',
        entities: [SearchEntity.CLUBS],
      });

      expect(mockPrismaService.clubs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({
            _count: {
              select: {
                players: true,
                homeMatches: true,
                awayMatches: true,
              },
            },
          }),
        }),
      );
    });
  });

  describe('searchMatches (private method via globalSearch)', () => {
    const mockMatches = [
      {
        id: 'match-1',
        homeClub: { name: 'PSG' },
        awayClub: { name: 'OM' },
        competitionOld: 'Ligue 1',
        venueOld: 'Parc des Princes',
      },
    ];

    beforeEach(() => {
      mockPrismaService.matches.findMany.mockResolvedValue(mockMatches);
      mockPrismaService.players.findMany.mockResolvedValue([]);
      mockPrismaService.clubs.findMany.mockResolvedValue([]);
      mockPrismaService.events.findMany.mockResolvedValue([]);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);
    });

    it('should search matches by competition, venue, or club names', async () => {
      await service.globalSearch({
        query: 'ligue',
        entities: [SearchEntity.MATCHES],
        limit: 10,
      });

      expect(mockPrismaService.matches.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { competitionOld: { contains: 'ligue', mode: 'insensitive' } },
            { venueOld: { contains: 'ligue', mode: 'insensitive' } },
            { homeClub: { name: { contains: 'ligue', mode: 'insensitive' } } },
            { awayClub: { name: { contains: 'ligue', mode: 'insensitive' } } },
          ],
        },
        take: 10,
        include: expect.objectContaining({
          homeClub: expect.any(Object),
          awayClub: expect.any(Object),
          _count: expect.objectContaining({
            select: { scoutingReports: true },
          }),
        }),
        orderBy: { scheduledAt: 'desc' },
      });
    });
  });

  describe('searchEvents (private method via globalSearch)', () => {
    const mockEvents = [
      {
        id: 'event-1',
        title: 'Training Session',
        description: 'Weekly training',
        location: 'Paris',
      },
    ];

    beforeEach(() => {
      mockPrismaService.events.findMany.mockResolvedValue(mockEvents);
      mockPrismaService.players.findMany.mockResolvedValue([]);
      mockPrismaService.clubs.findMany.mockResolvedValue([]);
      mockPrismaService.matches.findMany.mockResolvedValue([]);
      mockPrismaService.scouting_reports.findMany.mockResolvedValue([]);
    });

    it('should search events by title, description, or location', async () => {
      await service.globalSearch({
        query: 'training',
        entities: [SearchEntity.EVENTS],
        limit: 10,
      });

      expect(mockPrismaService.events.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'training', mode: 'insensitive' } },
            { description: { contains: 'training', mode: 'insensitive' } },
            { location: { contains: 'training', mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { startDate: 'desc' },
      });
    });
  });

  describe('searchScoutingReports (private method via globalSearch)', () => {
    const mockReports = [
      {
        id: 'report-1',
        player: { user: { firstName: 'John', lastName: 'Doe' } },
        scout: { firstName: 'Jane', lastName: 'Smith' },
      },
    ];

    beforeEach(() => {
      mockPrismaService.scouting_reports.findMany.mockResolvedValue(mockReports);
      mockPrismaService.players.findMany.mockResolvedValue([]);
      mockPrismaService.clubs.findMany.mockResolvedValue([]);
      mockPrismaService.matches.findMany.mockResolvedValue([]);
      mockPrismaService.events.findMany.mockResolvedValue([]);
    });

    it('should search reports by player or scout names', async () => {
      await service.globalSearch({
        query: 'john',
        entities: [SearchEntity.SCOUTING_REPORTS],
        limit: 10,
      });

      expect(mockPrismaService.scouting_reports.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { player: { user: { firstName: { contains: 'john', mode: 'insensitive' } } } },
            { player: { user: { lastName: { contains: 'john', mode: 'insensitive' } } } },
            { scout: { firstName: { contains: 'john', mode: 'insensitive' } } },
            { scout: { lastName: { contains: 'john', mode: 'insensitive' } } },
          ],
        },
        take: 10,
        include: expect.objectContaining({
          player: expect.any(Object),
          scout: expect.any(Object),
          match: expect.any(Object),
        }),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should include player, scout, and match data in report results', async () => {
      await service.globalSearch({
        query: 'john',
        entities: [SearchEntity.SCOUTING_REPORTS],
      });

      expect(mockPrismaService.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            player: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true,
                  },
                },
              },
            },
            scout: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            match: expect.any(Object),
          },
        }),
      );
    });
  });

  describe('quickSearch', () => {
    const mockPlayers = [
      { id: 'player-1', user: { firstName: 'John' } },
      { id: 'player-2', user: { firstName: 'Jane' } },
      { id: 'player-3', user: { firstName: 'Jack' } },
    ];

    const mockClubs = [
      { id: 'club-1', name: 'PSG' },
      { id: 'club-2', name: 'OM' },
    ];

    const mockMatches = [
      { id: 'match-1', homeClub: { name: 'PSG' } },
    ];

    beforeEach(() => {
      mockPrismaService.players.findMany.mockResolvedValue(mockPlayers);
      mockPrismaService.clubs.findMany.mockResolvedValue(mockClubs);
      mockPrismaService.matches.findMany.mockResolvedValue(mockMatches);
    });

    it('should return quick search results with default limit of 5', async () => {
      const result = await service.quickSearch('test');

      expect(result.query).toBe('test');
      expect(result.results.players).toHaveLength(3);
      expect(result.results.clubs).toHaveLength(2);
      expect(result.results.matches).toHaveLength(1);
      expect(result.totalResults).toBe(6);
    });

    it('should use custom limit when specified', async () => {
      const result = await service.quickSearch('test', 2);

      expect(mockPrismaService.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
      expect(mockPrismaService.clubs.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
      expect(mockPrismaService.matches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 }),
      );
    });

    it('should limit results to specified limit per entity', async () => {
      mockPrismaService.players.findMany.mockResolvedValue([
        ...mockPlayers,
        { id: 'player-4', user: { firstName: 'Jim' } },
        { id: 'player-5', user: { firstName: 'Joe' } },
        { id: 'player-6', user: { firstName: 'Jay' } },
      ]);

      const result = await service.quickSearch('test', 3);

      expect(result.results.players).toHaveLength(3);
    });

    it('should search players, clubs, and matches in parallel', async () => {
      await service.quickSearch('test');

      expect(mockPrismaService.players.findMany).toHaveBeenCalled();
      expect(mockPrismaService.clubs.findMany).toHaveBeenCalled();
      expect(mockPrismaService.matches.findMany).toHaveBeenCalled();
    });
  });
});
