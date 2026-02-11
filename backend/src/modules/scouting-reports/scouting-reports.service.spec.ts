import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ScoutingReportsService } from './scouting-reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, ReportStatus, RecommendationType } from '@prisma/client';
import { GamificationService } from '../gamification/gamification.service';

describe('ScoutingReportsService', () => {
  let service: ScoutingReportsService;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockMatch = {
    id: 'match-123',
    homeClubId: 'club-1',
    awayClubId: 'club-2',
    scheduledAt: new Date(),
    competition: 'Ligue 1',
  };

  const mockPlayer = {
    id: 'player-123',
    userId: 'user-player-123',
    position: 'Striker',
    dateOfBirth: new Date('1998-05-15'),
    height: 180,
    weight: 75,
  };

  const mockScout = {
    id: 'scout-123',
    email: 'scout@example.com',
    firstName: 'John',
    lastName: 'Scout',
    role: 'SCOUT',
  };

  const mockReportDb = {
    id: 'report-123',
    matchId: 'match-123',
    playerId: 'player-123',
    scoutId: 'scout-123',
    playerPosition: 'Striker',
    playerMinutesPlayed: 90,
    status: 'DRAFT' as ReportStatus,
    overallRating: 85,
    summary: 'Excellent performance',
    strengths: 'Great speed and finishing',
    weaknesses: 'Needs to work on defensive contribution',
    technicalRating: 88,
    physicalRating: 90,
    mentalRating: 82,
    tacticalRating: 80,
    recommendation: 'HIGHLY_RECOMMENDED' as RecommendationType,
    recommendationNotes: 'Strong candidate for first team',
    tags: ['fast', 'clinical', 'left-footed'],
    similarPlayerIds: ['player-456', 'player-789'],
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: mockScout,
    players: {
      ...mockPlayer,
      users: {
        firstName: 'Player',
        lastName: 'One',
      },
    },
    matches: {
      ...mockMatch,
      clubs_matches_homeClubIdToclubs: {
        id: 'club-1',
        name: 'PSG',
        logo: 'psg.png',
      },
      clubs_matches_awayClubIdToclubs: {
        id: 'club-2',
        name: 'OM',
        logo: 'om.png',
      },
    },
    scouting_notes: [],
    media: [],
  };

  const transformReport = (report: any) => ({
    ...report,
    player: {
      ...report.players,
      user: report.players?.users,
      club: (report.players as any)?.clubs,
    },
    scout: report.users,
    match: {
      ...report.matches,
      homeClub: report.matches?.clubs_matches_homeClubIdToclubs,
      awayClub: report.matches?.clubs_matches_awayClubIdToclubs,
    },
    players: undefined,
    users: undefined,
    matches: undefined,
  });

  const mockReport = transformReport(mockReportDb);

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoutingReportsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: GamificationService,
          useValue: {
            trackUserAction: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<ScoutingReportsService>(ScoutingReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createDto = {
      matchId: 'match-123',
      playerId: 'player-123',
      status: 'DRAFT' as ReportStatus,
      overallRating: 85,
      summary: 'Excellent performance',
      strengths: 'Great speed and finishing',
      weaknesses: 'Needs to work on defensive contribution',
      technicalRating: 88,
      physicalRating: 90,
      mentalRating: 82,
      tacticalRating: 80,
      recommendation: 'HIGHLY_RECOMMENDED' as RecommendationType,
      recommendationNotes: 'Strong candidate for first team',
      tags: ['fast', 'clinical', 'left-footed'],
      similarPlayerIds: ['player-456', 'player-789'],
      playerMinutesPlayed: 90,
      playerPosition: 'Striker',
    };

    it('should create a scouting report successfully', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      const result = await service.create(createDto, 'scout-123');

      expect(prisma.matches.findUnique).toHaveBeenCalledWith({
        where: { id: 'match-123' },
      });
      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prisma.users.findUnique).toHaveBeenCalledWith({
        where: { id: 'scout-123' },
      });
      expect(prisma.scouting_reports.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          playerPosition: createDto.playerPosition,
          playerMinutesPlayed: createDto.playerMinutesPlayed,
          status: createDto.status,
          overallRating: createDto.overallRating,
          summary: createDto.summary,
          strengths: createDto.strengths,
          weaknesses: createDto.weaknesses,
          technicalRating: createDto.technicalRating,
          physicalRating: createDto.physicalRating,
          mentalRating: createDto.mentalRating,
          tacticalRating: createDto.tacticalRating,
          recommendation: createDto.recommendation,
          recommendationNotes: createDto.recommendationNotes,
          tags: createDto.tags,
          similarPlayerIds: createDto.similarPlayerIds,
        }),
        include: expect.objectContaining({
          users: expect.any(Object),
          players: expect.any(Object),
          matches: expect.any(Object),
          scouting_notes: true,
          media: true,
        }),
      });
      expect(result).toEqual(mockReport);
    });

    it('should throw BadRequestException if scoutId is not provided', async () => {
      await expect(service.create(createDto, '')).rejects.toThrow(
        new BadRequestException('Scout ID is required'),
      );
      expect(prisma.matches.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if match not found', async () => {
      prisma.matches.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 'scout-123')).rejects.toThrow(
        new NotFoundException(`Match avec l'ID match-123 introuvable`),
      );
      expect(prisma.players.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if player not found', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 'scout-123')).rejects.toThrow(
        new NotFoundException(`Joueur avec l'ID player-123 introuvable`),
      );
      expect(prisma.users.findUnique).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if scout not found', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto, 'scout-123')).rejects.toThrow(
        new NotFoundException(`Scout avec l'ID scout-123 introuvable`),
      );
      expect(prisma.scouting_reports.create).not.toHaveBeenCalled();
    });

    it('should create report with minimal required fields', async () => {
      const minimalDto = {
        matchId: 'match-123',
        playerId: 'player-123',
      };
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(minimalDto, 'scout-123');

      expect(prisma.scouting_reports.create).toHaveBeenCalled();
    });

    it('should create report with all rating fields', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(createDto, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.technicalRating).toBe(88);
      expect(createCall.data.physicalRating).toBe(90);
      expect(createCall.data.mentalRating).toBe(82);
      expect(createCall.data.tacticalRating).toBe(80);
    });

    it('should create report with tags array', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(createDto, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.tags).toEqual(['fast', 'clinical', 'left-footed']);
    });

    it('should create report with similarPlayerIds', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(createDto, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.similarPlayerIds).toEqual(['player-456', 'player-789']);
    });
  });

  describe('findAll', () => {
    const mockReportsDb = [mockReportDb];
    const mockReports = [mockReport];

    it('should return all reports without filters', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);
      prisma.scouting_reports.count.mockResolvedValue(mockReportsDb.length as any);

      const result = await service.findAll({});

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
          players: {
            include: {
              users: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          matches: {
            include: {
              clubs_matches_homeClubIdToclubs: true,
              clubs_matches_awayClubIdToclubs: true,
            },
          },
          scouting_notes: true,
          media: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: 0,
        take: 1000,
      });
      expect(result).toEqual({
        data: mockReports,
        meta: { total: 1, page: 1, limit: 1000, totalPages: 1 },
      });
    });

    it('should filter by playerId', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);

      await service.findAll({ playerId: 'player-123' });

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { playerId: 'player-123' },
        }),
      );
    });

    it('should filter by scoutId', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);

      await service.findAll({ scoutId: 'scout-123' });

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scoutId: 'scout-123' },
        }),
      );
    });

    it('should filter by matchId', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);

      await service.findAll({ matchId: 'match-123' });

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { matchId: 'match-123' },
        }),
      );
    });

    it('should filter by status', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);

      await service.findAll({ status: 'SUBMITTED' as ReportStatus });

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'SUBMITTED' },
        }),
      );
    });

    it('should filter by recommendation', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);

      await service.findAll({ recommendation: 'HIGHLY_RECOMMENDED' as RecommendationType });

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recommendation: 'HIGHLY_RECOMMENDED' },
        }),
      );
    });

    it('should filter with multiple criteria', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);

      await service.findAll({
        playerId: 'player-123',
        scoutId: 'scout-123',
        status: 'APPROVED' as ReportStatus,
      });

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            playerId: 'player-123',
            scoutId: 'scout-123',
            status: 'APPROVED',
          },
        }),
      );
    });

    it('should order by createdAt desc', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);

      await service.findAll({});

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { createdAt: 'desc' },
        }),
      );
    });

    it('should include all relations', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);

      await service.findAll({});

      const callArgs = (prisma.scouting_reports.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.include.users).toBeDefined();
      expect(callArgs.include.players).toBeDefined();
      expect(callArgs.include.matches).toBeDefined();
      expect(callArgs.include.scouting_notes).toBe(true);
      expect(callArgs.include.media).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a report by ID', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);

      const result = await service.findOne('report-123');

      expect(prisma.scouting_reports.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        include: expect.objectContaining({
          users: expect.any(Object),
          players: expect.any(Object),
          matches: expect.any(Object),
          scouting_notes: expect.any(Object),
          media: true,
        }),
      });
      expect(result).toEqual(mockReport);
    });

    it('should order scouting_notes by minute', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);

      await service.findOne('report-123');

      const callArgs = (prisma.scouting_reports.findUnique as jest.Mock).mock.calls[0][0];
      expect(callArgs.include.scouting_notes.orderBy).toEqual({ minute: 'asc' });
    });

    it('should throw NotFoundException if report not found', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException(`Rapport avec l'ID invalid-id introuvable`),
      );
    });
  });

  describe('update', () => {
    const updateDto = {
      summary: 'Updated summary',
      overallRating: 90,
      strengths: 'Updated strengths',
    };

    it('should update a report successfully', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      const updatedReportDb = { ...mockReportDb, ...updateDto };
      prisma.scouting_reports.update.mockResolvedValue(updatedReportDb as any);

      const result = await service.update('report-123', updateDto);

      expect(prisma.scouting_reports.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        include: expect.any(Object),
      });
      expect(prisma.scouting_reports.update).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        data: updateDto,
        include: expect.any(Object),
      });
      expect(result).toEqual(transformReport(updatedReportDb));
    });

    it('should throw NotFoundException if report not found', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateDto)).rejects.toThrow(
        new NotFoundException(`Rapport avec l'ID invalid-id introuvable`),
      );
      expect(prisma.scouting_reports.update).not.toHaveBeenCalled();
    });

    it('should update status field', async () => {
      const statusUpdate = { status: 'SUBMITTED' as ReportStatus };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue({ ...mockReportDb, ...statusUpdate } as any);

      await service.update('report-123', statusUpdate);

      expect(prisma.scouting_reports.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: statusUpdate,
        }),
      );
    });

    it('should update rating fields', async () => {
      const ratingsUpdate = {
        technicalRating: 92,
        physicalRating: 88,
        mentalRating: 85,
        tacticalRating: 87,
      };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue({ ...mockReportDb, ...ratingsUpdate } as any);

      await service.update('report-123', ratingsUpdate);

      expect(prisma.scouting_reports.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: ratingsUpdate,
        }),
      );
    });

    it('should update tags array', async () => {
      const tagsUpdate = { tags: ['updated', 'tags', 'list'] };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue({ ...mockReport, ...tagsUpdate } as any);

      await service.update('report-123', tagsUpdate);

      expect(prisma.scouting_reports.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: tagsUpdate,
        }),
      );
    });

    it('should update recommendation and notes', async () => {
      const recommendationUpdate = {
        recommendation: 'NOT_RECOMMENDED' as RecommendationType,
        recommendationNotes: 'Does not meet requirements',
      };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue({
        ...mockReport,
        ...recommendationUpdate,
      } as any);

      await service.update('report-123', recommendationUpdate);

      expect(prisma.scouting_reports.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: recommendationUpdate,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete a report successfully', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.delete.mockResolvedValue(mockReportDb as any);

      const result = await service.remove('report-123');

      expect(prisma.scouting_reports.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        include: expect.any(Object),
      });
      expect(prisma.scouting_reports.delete).toHaveBeenCalledWith({
        where: { id: 'report-123' },
      });
      expect(result).toEqual({ message: 'Rapport supprimé avec succès' });
    });

    it('should throw NotFoundException if report not found', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        new NotFoundException(`Rapport avec l'ID invalid-id introuvable`),
      );
      expect(prisma.scouting_reports.delete).not.toHaveBeenCalled();
    });
  });

  describe('submit', () => {
    it('should submit a report successfully', async () => {
      const submittedReportDb = {
        ...mockReportDb,
        status: 'SUBMITTED' as ReportStatus,
        submittedAt: new Date(),
      };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue(submittedReportDb as any);

      const result = await service.submit('report-123');

      expect(prisma.scouting_reports.findUnique).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        include: expect.any(Object),
      });
      expect(prisma.scouting_reports.update).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        data: {
          status: 'SUBMITTED',
          submittedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(transformReport(submittedReportDb));
    });

    it('should throw NotFoundException if report not found', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.submit('invalid-id')).rejects.toThrow(
        new NotFoundException(`Rapport avec l'ID invalid-id introuvable`),
      );
      expect(prisma.scouting_reports.update).not.toHaveBeenCalled();
    });

    it('should update status to SUBMITTED', async () => {
      const submittedReport = {
        ...mockReportDb,
        status: 'SUBMITTED' as ReportStatus,
        submittedAt: new Date(),
      };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue(submittedReport as any);

      const result = await service.submit('report-123');

      expect(result.status).toBe('SUBMITTED');
      expect(result.submittedAt).toBeInstanceOf(Date);
    });
  });

  describe('review', () => {
    it('should approve a report successfully', async () => {
      const approvedReportDb = {
        ...mockReportDb,
        status: 'APPROVED' as ReportStatus,
        reviewedAt: new Date(),
        reviewedBy: 'reviewer-123',
      };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue(approvedReportDb as any);

      const result = await service.review('report-123', 'reviewer-123', true);

      expect(prisma.scouting_reports.update).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        data: {
          status: 'APPROVED',
          reviewedAt: expect.any(Date),
          reviewedBy: 'reviewer-123',
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(transformReport(approvedReportDb));
    });

    it('should reject a report successfully', async () => {
      const rejectedReportDb = {
        ...mockReportDb,
        status: 'REJECTED' as ReportStatus,
        reviewedAt: new Date(),
        reviewedBy: 'reviewer-123',
      };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue(rejectedReportDb as any);

      const result = await service.review('report-123', 'reviewer-123', false);

      expect(prisma.scouting_reports.update).toHaveBeenCalledWith({
        where: { id: 'report-123' },
        data: {
          status: 'REJECTED',
          reviewedAt: expect.any(Date),
          reviewedBy: 'reviewer-123',
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(transformReport(rejectedReportDb));
    });

    it('should throw NotFoundException if report not found', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(null);

      await expect(service.review('invalid-id', 'reviewer-123', true)).rejects.toThrow(
        new NotFoundException(`Rapport avec l'ID invalid-id introuvable`),
      );
      expect(prisma.scouting_reports.update).not.toHaveBeenCalled();
    });

    it('should set reviewedBy field', async () => {
      const approvedReport = {
        ...mockReportDb,
        status: 'APPROVED' as ReportStatus,
        reviewedAt: new Date(),
        reviewedBy: 'reviewer-456',
      };
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockResolvedValue(approvedReport as any);

      const result = await service.review('report-123', 'reviewer-456', true);

      expect(result.reviewedBy).toBe('reviewer-456');
      expect(result.reviewedAt).toBeInstanceOf(Date);
    });
  });

  describe('getPlayerReports', () => {
    it('should return reports for a specific player', async () => {
      const mockReportsDb = [mockReportDb];
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);
      prisma.scouting_reports.count.mockResolvedValue(mockReportsDb.length as any);

      const result = await service.getPlayerReports('player-123');

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { playerId: 'player-123' },
        }),
      );
      expect(result).toEqual({
        data: [transformReport(mockReportDb)],
        meta: { total: 1, page: 1, limit: 1000, totalPages: 1 },
      });
    });

    it('should return empty array when no reports exist', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue([]);
      prisma.scouting_reports.count.mockResolvedValue(0 as any);

      const result = await service.getPlayerReports('player-456');

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 1000, totalPages: 0 },
      });
    });
  });

  describe('getScoutReports', () => {
    it('should return reports for a specific scout', async () => {
      const mockReportsDb = [mockReportDb];
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);
      prisma.scouting_reports.count.mockResolvedValue(mockReportsDb.length as any);

      const result = await service.getScoutReports('scout-123');

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { scoutId: 'scout-123' },
        }),
      );
      expect(result).toEqual({
        data: [transformReport(mockReportDb)],
        meta: { total: 1, page: 1, limit: 1000, totalPages: 1 },
      });
    });

    it('should return empty array when scout has no reports', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue([]);
      prisma.scouting_reports.count.mockResolvedValue(0 as any);

      const result = await service.getScoutReports('scout-456');

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 1000, totalPages: 0 },
      });
    });
  });

  describe('getMatchReports', () => {
    it('should return reports for a specific match', async () => {
      const mockReportsDb = [mockReportDb];
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);
      prisma.scouting_reports.count.mockResolvedValue(mockReportsDb.length as any);

      const result = await service.getMatchReports('match-123');

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { matchId: 'match-123' },
        }),
      );
      expect(result).toEqual({
        data: [transformReport(mockReportDb)],
        meta: { total: 1, page: 1, limit: 1000, totalPages: 1 },
      });
    });

    it('should return empty array when match has no reports', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue([]);
      prisma.scouting_reports.count.mockResolvedValue(0 as any);

      const result = await service.getMatchReports('match-456');

      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 1000, totalPages: 0 },
      });
    });
  });

  describe('getReportsByRecommendation', () => {
    it('should return reports with HIGHLY_RECOMMENDED recommendation', async () => {
      const mockReportsDb = [mockReportDb];
      prisma.scouting_reports.findMany.mockResolvedValue(mockReportsDb as any);
      prisma.scouting_reports.count.mockResolvedValue(mockReportsDb.length as any);

      const result = await service.getReportsByRecommendation('HIGHLY_RECOMMENDED');

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recommendation: 'HIGHLY_RECOMMENDED' },
        }),
      );
      expect(result).toEqual({
        data: [transformReport(mockReportDb)],
        meta: { total: 1, page: 1, limit: 1000, totalPages: 1 },
      });
    });

    it('should return reports with NOT_RECOMMENDED recommendation', async () => {
      prisma.scouting_reports.findMany.mockResolvedValue([]);
      prisma.scouting_reports.count.mockResolvedValue(0 as any);

      const result = await service.getReportsByRecommendation('NOT_RECOMMENDED');

      expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recommendation: 'NOT_RECOMMENDED' },
        }),
      );
      expect(result).toEqual({
        data: [],
        meta: { total: 0, page: 1, limit: 1000, totalPages: 0 },
      });
    });
  });

  describe('Status workflow transitions', () => {
    it('should transition from DRAFT to SUBMITTED', async () => {
      const draftReport = { ...mockReport, status: 'DRAFT' as ReportStatus };
      const submittedReport = {
        ...mockReport,
        status: 'SUBMITTED' as ReportStatus,
        submittedAt: new Date(),
      };

      prisma.scouting_reports.findUnique.mockResolvedValue(draftReport as any);
      prisma.scouting_reports.update.mockResolvedValue(submittedReport as any);

      const result = await service.submit('report-123');

      expect(result.status).toBe('SUBMITTED');
      expect(result.submittedAt).toBeDefined();
    });

    it('should transition from SUBMITTED to APPROVED', async () => {
      const submittedReport = { ...mockReport, status: 'SUBMITTED' as ReportStatus };
      const approvedReport = {
        ...mockReport,
        status: 'APPROVED' as ReportStatus,
        reviewedAt: new Date(),
      };

      prisma.scouting_reports.findUnique.mockResolvedValue(submittedReport as any);
      prisma.scouting_reports.update.mockResolvedValue(approvedReport as any);

      const result = await service.review('report-123', 'reviewer-123', true);

      expect(result.status).toBe('APPROVED');
      expect(result.reviewedAt).toBeDefined();
    });

    it('should transition from SUBMITTED to REJECTED', async () => {
      const submittedReport = { ...mockReport, status: 'SUBMITTED' as ReportStatus };
      const rejectedReport = {
        ...mockReport,
        status: 'REJECTED' as ReportStatus,
        reviewedAt: new Date(),
      };

      prisma.scouting_reports.findUnique.mockResolvedValue(submittedReport as any);
      prisma.scouting_reports.update.mockResolvedValue(rejectedReport as any);

      const result = await service.review('report-123', 'reviewer-123', false);

      expect(result.status).toBe('REJECTED');
      expect(result.reviewedAt).toBeDefined();
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle database connection errors on create', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockRejectedValue(new Error('Database connection failed'));

      const createDto = {
        matchId: 'match-123',
        playerId: 'player-123',
        status: 'DRAFT' as ReportStatus,
        overallRating: 85,
      };

      await expect(service.create(createDto, 'scout-123')).rejects.toThrow(
        'Database connection failed',
      );
    });

    it('should handle database errors on update', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.update.mockRejectedValue(new Error('Update failed'));

      await expect(service.update('report-123', { summary: 'Updated' })).rejects.toThrow(
        'Update failed',
      );
    });

    it('should handle database errors on delete', async () => {
      prisma.scouting_reports.findUnique.mockResolvedValue(mockReportDb as any);
      prisma.scouting_reports.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.remove('report-123')).rejects.toThrow('Delete failed');
    });

    it('should handle empty scoutId', async () => {
      const createDto = {
        matchId: 'match-123',
        playerId: 'player-123',
      };

      await expect(service.create(createDto, '')).rejects.toThrow(
        new BadRequestException('Scout ID is required'),
      );
    });

    it('should handle null scoutId', async () => {
      const createDto = {
        matchId: 'match-123',
        playerId: 'player-123',
      };

      await expect(service.create(createDto, null as any)).rejects.toThrow(
        new BadRequestException('Scout ID is required'),
      );
    });

    it('should handle undefined scoutId', async () => {
      const createDto = {
        matchId: 'match-123',
        playerId: 'player-123',
      };

      await expect(service.create(createDto, undefined as any)).rejects.toThrow(
        new BadRequestException('Scout ID is required'),
      );
    });
  });

  describe('Rating validations and edge cases', () => {
    it('should create report with minimum rating values (0)', async () => {
      const minRatingDto = {
        matchId: 'match-123',
        playerId: 'player-123',
        technicalRating: 0,
        physicalRating: 0,
        mentalRating: 0,
        tacticalRating: 0,
        overallRating: 0,
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(minRatingDto, 'scout-123');

      expect(prisma.scouting_reports.create).toHaveBeenCalled();
    });

    it('should create report with maximum rating values (100)', async () => {
      const maxRatingDto = {
        matchId: 'match-123',
        playerId: 'player-123',
        technicalRating: 100,
        physicalRating: 100,
        mentalRating: 100,
        tacticalRating: 100,
        overallRating: 100,
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(maxRatingDto, 'scout-123');

      expect(prisma.scouting_reports.create).toHaveBeenCalled();
    });

    it('should create report with mixed rating values', async () => {
      const mixedRatingDto = {
        matchId: 'match-123',
        playerId: 'player-123',
        technicalRating: 75,
        physicalRating: 50,
        mentalRating: 0,
        tacticalRating: 100,
        overallRating: 56,
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(mixedRatingDto, 'scout-123');

      expect(prisma.scouting_reports.create).toHaveBeenCalled();
    });
  });

  describe('Recommendation types coverage', () => {
    const recommendations = [
      'BUY_NOW',
      'MONITOR',
      'FOLLOW_UP',
      'NOT_INTERESTED',
      'HIGHLY_RECOMMENDED',
      'RECOMMENDED',
      'NOT_RECOMMENDED',
    ];

    recommendations.forEach((rec) => {
      it(`should filter by ${rec} recommendation`, async () => {
        prisma.scouting_reports.findMany.mockResolvedValue([mockReport] as any);

        await service.getReportsByRecommendation(rec);

        expect(prisma.scouting_reports.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { recommendation: rec },
          }),
        );
      });
    });
  });

  describe('Player minutes and position edge cases', () => {
    it('should create report with 0 minutes played', async () => {
      const dtoWithZeroMinutes = {
        matchId: 'match-123',
        playerId: 'player-123',
        playerMinutesPlayed: 0,
        playerPosition: 'Substitute',
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithZeroMinutes, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.playerMinutesPlayed).toBe(0);
    });

    it('should create report with maximum minutes played (120)', async () => {
      const dtoWithMaxMinutes = {
        matchId: 'match-123',
        playerId: 'player-123',
        playerMinutesPlayed: 120,
        playerPosition: 'Striker',
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithMaxMinutes, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.playerMinutesPlayed).toBe(120);
    });

    it('should create report without position specified', async () => {
      const dtoWithoutPosition = {
        matchId: 'match-123',
        playerId: 'player-123',
        playerMinutesPlayed: 45,
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithoutPosition, 'scout-123');

      expect(prisma.scouting_reports.create).toHaveBeenCalled();
    });
  });

  describe('Tags and similar players array handling', () => {
    it('should create report with empty tags array', async () => {
      const dtoWithEmptyTags = {
        matchId: 'match-123',
        playerId: 'player-123',
        tags: [],
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithEmptyTags, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.tags).toEqual([]);
    });

    it('should create report with empty similarPlayerIds array', async () => {
      const dtoWithEmptySimilar = {
        matchId: 'match-123',
        playerId: 'player-123',
        similarPlayerIds: [],
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithEmptySimilar, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.similarPlayerIds).toEqual([]);
    });

    it('should create report with multiple tags', async () => {
      const dtoWithManyTags = {
        matchId: 'match-123',
        playerId: 'player-123',
        tags: ['fast', 'technical', 'creative', 'leader', 'versatile'],
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithManyTags, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.tags).toHaveLength(5);
    });

    it('should create report with multiple similar player IDs', async () => {
      const dtoWithManySimilar = {
        matchId: 'match-123',
        playerId: 'player-123',
        similarPlayerIds: ['player-1', 'player-2', 'player-3', 'player-4', 'player-5'],
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithManySimilar, 'scout-123');

      const createCall = (prisma.scouting_reports.create as jest.Mock).mock.calls[0][0];
      expect(createCall.data.similarPlayerIds).toHaveLength(5);
    });
  });

  describe('Text field handling', () => {
    it('should create report with empty strings', async () => {
      const dtoWithEmptyStrings = {
        matchId: 'match-123',
        playerId: 'player-123',
        summary: '',
        strengths: '',
        weaknesses: '',
        recommendationNotes: '',
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithEmptyStrings, 'scout-123');

      expect(prisma.scouting_reports.create).toHaveBeenCalled();
    });

    it('should create report with very long text fields', async () => {
      const longText = 'A'.repeat(5000);
      const dtoWithLongText = {
        matchId: 'match-123',
        playerId: 'player-123',
        summary: longText,
        strengths: longText,
        weaknesses: longText,
        recommendationNotes: longText,
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithLongText, 'scout-123');

      expect(prisma.scouting_reports.create).toHaveBeenCalled();
    });

    it('should create report with special characters in text', async () => {
      const specialText = 'Special chars: <>&"\'{}[]|\\`~!@#$%^&*()';
      const dtoWithSpecialChars = {
        matchId: 'match-123',
        playerId: 'player-123',
        summary: specialText,
        strengths: specialText,
        weaknesses: specialText,
      };

      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.users.findUnique.mockResolvedValue(mockScout as any);
      prisma.scouting_reports.create.mockResolvedValue(mockReportDb as any);

      await service.create(dtoWithSpecialChars, 'scout-123');

      expect(prisma.scouting_reports.create).toHaveBeenCalled();
    });
  });
});
