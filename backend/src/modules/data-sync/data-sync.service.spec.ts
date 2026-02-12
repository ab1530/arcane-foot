import { Test, TestingModule } from '@nestjs/testing';
import { DataSyncService } from './data-sync.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiFootballService } from './services/api-football.service';
import { ClubMapper } from './mappers/club.mapper';
import { PlayerMapper } from './mappers/player.mapper';
import { CompetitionMapper } from './mappers/competition.mapper';

describe('DataSyncService', () => {
  let service: DataSyncService;
  let prismaService: PrismaService;
  let apiFootballService: ApiFootballService;
  let clubMapper: ClubMapper;
  let playerMapper: PlayerMapper;
  let competitionMapper: CompetitionMapper;

  const mockPrismaService = {
    competitions: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    clubs: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    players: {
      upsert: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    matches: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockApiFootballService = {
    getCompetitions: jest.fn(),
    getTeams: jest.fn(),
    getPlayers: jest.fn(),
    getFixtures: jest.fn(),
  };

  const mockClubMapper = {
    fromExternal: jest.fn(),
  };

  const mockPlayerMapper = {
    fromExternal: jest.fn(),
  };

  const mockCompetitionMapper = {
    fromExternal: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataSyncService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ApiFootballService,
          useValue: mockApiFootballService,
        },
        {
          provide: ClubMapper,
          useValue: mockClubMapper,
        },
        {
          provide: PlayerMapper,
          useValue: mockPlayerMapper,
        },
        {
          provide: CompetitionMapper,
          useValue: mockCompetitionMapper,
        },
      ],
    }).compile();

    service = module.get<DataSyncService>(DataSyncService);
    prismaService = module.get<PrismaService>(PrismaService);
    apiFootballService = module.get<ApiFootballService>(ApiFootballService);
    clubMapper = module.get<ClubMapper>(ClubMapper);
    playerMapper = module.get<PlayerMapper>(PlayerMapper);
    competitionMapper = module.get<CompetitionMapper>(CompetitionMapper);

    mockPrismaService.matches.findFirst.mockResolvedValue(null);
    mockPrismaService.matches.create.mockResolvedValue({});
    mockPrismaService.matches.update.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('syncCompetitions', () => {
    it('should successfully sync competitions from api-football', async () => {
      const mockExternalCompetitions = [
        { id: 1, name: 'Premier League', country: 'GB' },
        { id: 2, name: 'La Liga', country: 'ES' },
      ];

      const mockMappedCompetitions = [
        {
          name: 'Premier League',
          externalId: '1',
          externalSource: 'api-football',
          country: 'GB',
        },
        {
          name: 'La Liga',
          externalId: '2',
          externalSource: 'api-football',
          country: 'ES',
        },
      ];

      mockApiFootballService.getCompetitions.mockResolvedValue(mockExternalCompetitions);
      mockCompetitionMapper.fromExternal
        .mockReturnValueOnce(mockMappedCompetitions[0])
        .mockReturnValueOnce(mockMappedCompetitions[1]);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncCompetitions('api-football');

      expect(mockApiFootballService.getCompetitions).toHaveBeenCalled();
      expect(mockCompetitionMapper.fromExternal).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should use default source if not provided', async () => {
      mockApiFootballService.getCompetitions.mockResolvedValue([]);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncCompetitions();

      expect(mockApiFootballService.getCompetitions).toHaveBeenCalled();
    });

    it('should throw error if API call fails', async () => {
      const error = new Error('API failure');
      mockApiFootballService.getCompetitions.mockRejectedValue(error);

      await expect(service.syncCompetitions('api-football')).rejects.toThrow('API failure');
    });

    it('should handle empty competition list', async () => {
      mockApiFootballService.getCompetitions.mockResolvedValue([]);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncCompetitions('api-football');

      expect(mockApiFootballService.getCompetitions).toHaveBeenCalled();
      expect(mockCompetitionMapper.fromExternal).not.toHaveBeenCalled();
    });
  });

  describe('syncClubs', () => {
    it('should successfully sync clubs for a competition', async () => {
      const mockCompetition = {
        id: 'comp-123',
        name: 'Premier League',
        externalId: '39',
      };

      const mockExternalClubs = [
        { id: 1, name: 'Arsenal', country: 'GB' },
        { id: 2, name: 'Chelsea', country: 'GB' },
      ];

      const mockMappedClubs = [
        {
          name: 'Arsenal',
          externalId: '1',
          externalSource: 'api-football',
        },
        {
          name: 'Chelsea',
          externalId: '2',
          externalSource: 'api-football',
        },
      ];

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getTeams.mockResolvedValue(mockExternalClubs);
      mockClubMapper.fromExternal
        .mockReturnValueOnce(mockMappedClubs[0])
        .mockReturnValueOnce(mockMappedClubs[1]);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncClubs('39', 'api-football');

      expect(mockPrismaService.competitions.findUnique).toHaveBeenCalledWith({
        where: { externalId: '39' },
      });
      expect(mockApiFootballService.getTeams).toHaveBeenCalledWith('39');
      expect(mockClubMapper.fromExternal).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw error if competition not found', async () => {
      mockPrismaService.competitions.findUnique.mockResolvedValue(null);

      await expect(service.syncClubs('999', 'api-football')).rejects.toThrow(
        'Competition 999 not found in database',
      );
    });

    it('should handle API errors during club sync', async () => {
      const mockCompetition = {
        id: 'comp-123',
        externalId: '39',
      };

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getTeams.mockRejectedValue(new Error('API error'));

      await expect(service.syncClubs('39', 'api-football')).rejects.toThrow('API error');
    });

    it('should handle empty club list', async () => {
      const mockCompetition = {
        id: 'comp-123',
        externalId: '39',
      };

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getTeams.mockResolvedValue([]);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncClubs('39', 'api-football');

      expect(mockClubMapper.fromExternal).not.toHaveBeenCalled();
    });
  });

  describe('syncPlayers', () => {
    it('should successfully sync players for a club', async () => {
      const mockClub = {
        id: 'club-123',
        name: 'Arsenal',
        externalId: '42',
      };

      const mockExternalPlayers = [
        {
          id: 1,
          firstName: 'Bukayo',
          lastName: 'Saka',
          position: 'Winger',
        },
      ];

      const mockUser = {
        id: 'user-123',
        email: 'player_1@arcane-sync.internal',
      };

      const mockMappedPlayer = {
        position: 'Winger',
        externalId: '1',
        externalSource: 'api-football',
        _firstName: 'Bukayo',
        _lastName: 'Saka',
      };

      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockResolvedValue(mockExternalPlayers);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPlayerMapper.fromExternal.mockReturnValue(mockMappedPlayer);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncPlayers('42', 'api-football');

      expect(mockPrismaService.clubs.findUnique).toHaveBeenCalledWith({
        where: { externalId: '42' },
      });
      expect(mockApiFootballService.getPlayers).toHaveBeenCalledWith('42');
      expect(mockPrismaService.users.findUnique).toHaveBeenCalled();
      expect(mockPlayerMapper.fromExternal).toHaveBeenCalled();
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('should create user if player user does not exist', async () => {
      const mockClub = {
        id: 'club-123',
        externalId: '42',
      };

      const mockExternalPlayers = [
        {
          id: 1,
          name: 'Bukayo Saka',
          position: 'Winger',
        },
      ];

      const mockCreatedUser = {
        id: 'user-new',
        email: 'player_1@arcane-sync.internal',
        firstName: 'Bukayo',
        lastName: 'Saka',
        role: 'PLAYER',
      };

      const mockMappedPlayer = {
        position: 'Winger',
        externalId: '1',
        externalSource: 'api-football',
        _firstName: 'Bukayo',
        _lastName: 'Saka',
      };

      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockResolvedValue(mockExternalPlayers);
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockCreatedUser);
      mockPlayerMapper.fromExternal.mockReturnValue(mockMappedPlayer);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncPlayers('42', 'api-football');

      expect(mockPrismaService.users.findUnique).toHaveBeenCalledWith({
        where: { email: 'player_1@arcane-sync.internal' },
      });
      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'player_1@arcane-sync.internal',
          firstName: 'Bukayo',
          lastName: 'Saka',
          role: 'PLAYER',
        }),
      });
    });

    it('should throw error if club not found', async () => {
      mockPrismaService.clubs.findUnique.mockResolvedValue(null);

      await expect(service.syncPlayers('999', 'api-football')).rejects.toThrow(
        'Club 999 not found in database',
      );
    });

    it('should handle API errors during player sync', async () => {
      const mockClub = {
        id: 'club-123',
        externalId: '42',
      };

      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockRejectedValue(new Error('API error'));

      await expect(service.syncPlayers('42', 'api-football')).rejects.toThrow('API error');
    });

    it('should handle empty player list', async () => {
      const mockClub = {
        id: 'club-123',
        externalId: '42',
      };

      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockResolvedValue([]);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncPlayers('42', 'api-football');

      expect(mockPlayerMapper.fromExternal).not.toHaveBeenCalled();
    });
  });

  describe('syncMatches', () => {
    it('should successfully sync matches for a competition', async () => {
      const mockCompetition = {
        id: 'comp-123',
        externalId: '39',
        season: '2024-2025',
      };

      const mockHomeClub = {
        id: 'club-home',
        externalId: '42',
        name: 'Arsenal',
      };

      const mockAwayClub = {
        id: 'club-away',
        externalId: '43',
        name: 'Chelsea',
      };

      const mockExternalMatches = [
        {
          homeTeamId: 42,
          awayTeamId: 43,
          scheduledAt: new Date('2024-12-01'),
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          referee: 'John Referee',
          round: 'Regular Season - 14',
        },
      ];

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getFixtures.mockResolvedValue(mockExternalMatches);
      mockPrismaService.clubs.findUnique
        .mockResolvedValueOnce(mockHomeClub)
        .mockResolvedValueOnce(mockAwayClub);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncMatches('39', 'api-football');

      expect(mockPrismaService.competitions.findUnique).toHaveBeenCalledWith({
        where: { externalId: '39' },
      });
      expect(mockApiFootballService.getFixtures).toHaveBeenCalledWith('39');
      expect(mockPrismaService.clubs.findUnique).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.matches.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.matches.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error if competition not found', async () => {
      mockPrismaService.competitions.findUnique.mockResolvedValue(null);

      await expect(service.syncMatches('999', 'api-football')).rejects.toThrow(
        'Competition 999 not found',
      );
    });

    it('should skip matches where clubs are not found', async () => {
      const mockCompetition = {
        id: 'comp-123',
        externalId: '39',
        season: '2024-2025',
      };

      const mockExternalMatches = [
        {
          homeTeamId: 42,
          awayTeamId: 43,
          scheduledAt: new Date('2024-12-01'),
          status: 'SCHEDULED',
        },
        {
          homeTeamId: 44,
          awayTeamId: 45,
          scheduledAt: new Date('2024-12-02'),
          status: 'SCHEDULED',
        },
      ];

      const mockHomeClub = {
        id: 'club-home',
        externalId: '44',
      };

      const mockAwayClub = {
        id: 'club-away',
        externalId: '45',
      };

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getFixtures.mockResolvedValue(mockExternalMatches);

      // First match: home club not found, away club not found
      mockPrismaService.clubs.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        // Second match: both clubs found
        .mockResolvedValueOnce(mockHomeClub)
        .mockResolvedValueOnce(mockAwayClub);

      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncMatches('39', 'api-football');

      // Should be called 4 times (2 for each match)
      expect(mockPrismaService.clubs.findUnique).toHaveBeenCalledTimes(4);
      // Match upsert path should run only for the second match
      expect(mockPrismaService.matches.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.matches.create).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors during match sync', async () => {
      const mockCompetition = {
        id: 'comp-123',
        externalId: '39',
      };

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getFixtures.mockRejectedValue(new Error('API error'));

      await expect(service.syncMatches('39', 'api-football')).rejects.toThrow('API error');
    });

    it('should use default season if competition has no season', async () => {
      const mockCompetition = {
        id: 'comp-123',
        externalId: '39',
        season: null,
      };

      const mockHomeClub = {
        id: 'club-home',
        externalId: '42',
      };

      const mockAwayClub = {
        id: 'club-away',
        externalId: '43',
      };

      const mockExternalMatches = [
        {
          homeTeamId: 42,
          awayTeamId: 43,
          scheduledAt: new Date('2024-12-01'),
          status: 'SCHEDULED',
          homeScore: null,
          awayScore: null,
          referee: 'John Referee',
          round: 'Regular Season - 14',
        },
      ];

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getFixtures.mockResolvedValue(mockExternalMatches);
      mockPrismaService.clubs.findUnique
        .mockResolvedValueOnce(mockHomeClub)
        .mockResolvedValueOnce(mockAwayClub);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncMatches('39', 'api-football');

      expect(mockPrismaService.matches.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrismaService.matches.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('fullSync', () => {
    it('should successfully perform full sync', async () => {
      const competitionIds = ['39', '140'];

      const mockClubs = [
        {
          id: 'club-1',
          externalId: '42',
          externalSource: 'api-football',
        },
        {
          id: 'club-2',
          externalId: '43',
          externalSource: 'api-football',
        },
      ];

      mockApiFootballService.getCompetitions.mockResolvedValue([]);
      mockPrismaService.$transaction.mockResolvedValue([]);

      // Mock syncClubs
      const mockCompetition = { id: 'comp-123', externalId: '39' };
      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getTeams.mockResolvedValue([]);

      // Mock findMany for clubs
      mockPrismaService.clubs.findMany.mockResolvedValue(mockClubs);

      // Mock syncPlayers
      const mockClub = { id: 'club-123', externalId: '42' };
      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockResolvedValue([]);

      // Mock syncMatches
      mockApiFootballService.getFixtures.mockResolvedValue([]);

      // Spy on sleep to avoid delays
      jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      await service.fullSync(competitionIds);

      expect(mockApiFootballService.getCompetitions).toHaveBeenCalled();
      expect(mockPrismaService.clubs.findMany).toHaveBeenCalledWith({
        where: { externalSource: 'api-football' },
      });
      expect(service['sleep']).toHaveBeenCalled();
    });

    it('should handle errors during full sync', async () => {
      const competitionIds = ['39'];

      mockApiFootballService.getCompetitions.mockRejectedValue(new Error('Full sync error'));

      await expect(service.fullSync(competitionIds)).rejects.toThrow('Full sync error');
    });

    it('should process multiple competitions and clubs with rate limiting', async () => {
      const competitionIds = ['39', '140'];

      const mockClubs = [
        {
          id: 'club-1',
          externalId: '42',
          externalSource: 'api-football',
        },
      ];

      mockApiFootballService.getCompetitions.mockResolvedValue([]);
      mockPrismaService.$transaction.mockResolvedValue([]);

      const mockCompetition = { id: 'comp-123', externalId: '39' };
      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getTeams.mockResolvedValue([]);
      mockPrismaService.clubs.findMany.mockResolvedValue(mockClubs);

      const mockClub = { id: 'club-123', externalId: '42' };
      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockResolvedValue([]);
      mockApiFootballService.getFixtures.mockResolvedValue([]);

      // Spy on sleep
      const sleepSpy = jest.spyOn(service as any, 'sleep').mockResolvedValue(undefined);

      await service.fullSync(competitionIds);

      // Should call sleep for rate limiting (once per club)
      expect(sleepSpy).toHaveBeenCalledWith(2000);
    });
  });

  describe('findOrCreatePlayerUser (private method test via syncPlayers)', () => {
    it('should parse player name correctly when creating user', async () => {
      const mockClub = {
        id: 'club-123',
        externalId: '42',
      };

      const mockExternalPlayers = [
        {
          id: 1,
          name: 'Kylian Mbappe Lottin',
          position: 'Forward',
        },
      ];

      const mockCreatedUser = {
        id: 'user-new',
        email: 'player_1@arcane-sync.internal',
        firstName: 'Kylian',
        lastName: 'Mbappe Lottin',
        role: 'PLAYER',
      };

      const mockMappedPlayer = {
        position: 'Forward',
        externalId: '1',
        externalSource: 'api-football',
        _firstName: 'Kylian',
        _lastName: 'Mbappe Lottin',
      };

      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockResolvedValue(mockExternalPlayers);
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockCreatedUser);
      mockPlayerMapper.fromExternal.mockReturnValue(mockMappedPlayer);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncPlayers('42', 'api-football');

      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'Kylian',
          lastName: 'Mbappe Lottin',
          role: 'PLAYER',
          isActive: true,
          emailVerified: false,
        }),
      });
    });

    it('should handle players with no last name', async () => {
      const mockClub = {
        id: 'club-123',
        externalId: '42',
      };

      const mockExternalPlayers = [
        {
          id: 1,
          name: 'Neymar',
          position: 'Forward',
        },
      ];

      const mockCreatedUser = {
        id: 'user-new',
        email: 'player_1@arcane-sync.internal',
        firstName: 'Neymar',
        lastName: 'Player',
        role: 'PLAYER',
      };

      const mockMappedPlayer = {
        position: 'Forward',
        externalId: '1',
        externalSource: 'api-football',
        _firstName: 'Neymar',
        _lastName: 'Player',
      };

      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockResolvedValue(mockExternalPlayers);
      mockPrismaService.users.findUnique.mockResolvedValue(null);
      mockPrismaService.users.create.mockResolvedValue(mockCreatedUser);
      mockPlayerMapper.fromExternal.mockReturnValue(mockMappedPlayer);
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncPlayers('42', 'api-football');

      expect(mockPrismaService.users.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: 'Neymar',
          lastName: 'Player',
        }),
      });
    });
  });

  describe('batch operations', () => {
    it('should handle large number of competitions in batches', async () => {
      // Create 60 competitions to test batching (batch size is 50)
      const mockExternalCompetitions = Array.from({ length: 60 }, (_, i) => ({
        id: i + 1,
        name: `Competition ${i + 1}`,
        country: 'GB',
      }));

      const mockMappedCompetitions = mockExternalCompetitions.map((comp) => ({
        name: comp.name,
        externalId: comp.id.toString(),
        externalSource: 'api-football',
      }));

      mockApiFootballService.getCompetitions.mockResolvedValue(mockExternalCompetitions);
      mockCompetitionMapper.fromExternal.mockImplementation((external, source) => ({
        name: external.name,
        externalId: external.id.toString(),
        externalSource: source,
      }));
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncCompetitions('api-football');

      // Should be called twice (60 competitions / 50 batch size = 2 batches)
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should handle large number of clubs in batches', async () => {
      const mockCompetition = {
        id: 'comp-123',
        externalId: '39',
      };

      // Create 150 clubs to test batching (batch size is 100)
      const mockExternalClubs = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        name: `Club ${i + 1}`,
        country: 'GB',
      }));

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getTeams.mockResolvedValue(mockExternalClubs);
      mockClubMapper.fromExternal.mockImplementation((external, source) => ({
        name: external.name,
        externalId: external.id.toString(),
        externalSource: source,
      }));
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncClubs('39', 'api-football');

      // Should be called twice (150 clubs / 100 batch size = 2 batches)
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should handle large number of players in batches', async () => {
      const mockClub = {
        id: 'club-123',
        externalId: '42',
      };

      // Create 150 players to test batching (batch size is 100)
      const mockExternalPlayers = Array.from({ length: 150 }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        position: 'Midfielder',
      }));

      const mockUser = {
        id: 'user-123',
        email: 'player@test.com',
      };

      mockPrismaService.clubs.findUnique.mockResolvedValue(mockClub);
      mockApiFootballService.getPlayers.mockResolvedValue(mockExternalPlayers);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPlayerMapper.fromExternal.mockImplementation((external, source) => ({
        position: external.position,
        externalId: external.id.toString(),
        externalSource: source,
        _firstName: 'Test',
        _lastName: 'Player',
      }));
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncPlayers('42', 'api-football');

      // Should be called twice (150 players / 100 batch size = 2 batches)
      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(2);
    });

    it('should handle large number of matches in batches', async () => {
      const mockCompetition = {
        id: 'comp-123',
        externalId: '39',
        season: '2024-2025',
      };

      const mockHomeClub = {
        id: 'club-home',
        externalId: '42',
      };

      const mockAwayClub = {
        id: 'club-away',
        externalId: '43',
      };

      // Create 600 matches to test batching (batch size is 500)
      const mockExternalMatches = Array.from({ length: 600 }, (_, i) => ({
        homeTeamId: 42,
        awayTeamId: 43,
        scheduledAt: new Date(`2024-12-${(i % 30) + 1}`),
        status: 'SCHEDULED',
        homeScore: null,
        awayScore: null,
        referee: 'Referee',
        round: `Round ${i + 1}`,
      }));

      mockPrismaService.competitions.findUnique.mockResolvedValue(mockCompetition);
      mockApiFootballService.getFixtures.mockResolvedValue(mockExternalMatches);
      mockPrismaService.clubs.findUnique.mockImplementation((params) => {
        if (params.where.externalId === '42') return Promise.resolve(mockHomeClub);
        if (params.where.externalId === '43') return Promise.resolve(mockAwayClub);
        return Promise.resolve(null);
      });
      mockPrismaService.$transaction.mockResolvedValue([]);

      await service.syncMatches('39', 'api-football');

      // Should process all matches through findFirst/create flow
      expect(mockPrismaService.matches.findFirst).toHaveBeenCalledTimes(600);
      expect(mockPrismaService.matches.create).toHaveBeenCalledTimes(600);
    });
  });
});
