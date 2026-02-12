import { Test, TestingModule } from '@nestjs/testing';
import { ScoutingReportsController } from './scouting-reports.controller';
import { ScoutingReportsService } from './scouting-reports.service';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ReportStatus, RecommendationType } from '@prisma/client';

describe('ScoutingReportsController', () => {
  let controller: ScoutingReportsController;
  let service: ScoutingReportsService;

  const mockScoutingReportsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    submit: jest.fn(),
    review: jest.fn(),
    getPlayerReports: jest.fn(),
    getScoutReports: jest.fn(),
    getMatchReports: jest.fn(),
    getReportsByRecommendation: jest.fn(),
  };

  const mockPdfService = {
    generateReportPdf: jest.fn(),
  };

  const mockReport = {
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
    users: {
      id: 'scout-123',
      email: 'scout@example.com',
      firstName: 'John',
      lastName: 'Scout',
      role: 'SCOUT',
    },
    players: {
      id: 'player-123',
      position: 'Striker',
      users: {
        firstName: 'Player',
        lastName: 'One',
      },
    },
    matches: {
      id: 'match-123',
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

  const mockRequest = {
    user: {
      id: 'scout-123',
      sub: 'scout-123',
      email: 'scout@example.com',
      role: 'SCOUT',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScoutingReportsController],
      providers: [
        {
          provide: ScoutingReportsService,
          useValue: mockScoutingReportsService,
        },
        {
          provide: PdfService,
          useValue: mockPdfService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ScoutingReportsController>(ScoutingReportsController);
    service = module.get<ScoutingReportsService>(ScoutingReportsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
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

    it('should create a scouting report', async () => {
      mockScoutingReportsService.create.mockResolvedValue(mockReport);

      const result = await controller.create(createDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(createDto, 'scout-123');
      expect(result).toEqual(mockReport);
    });

    it('should extract scoutId from req.user.id', async () => {
      mockScoutingReportsService.create.mockResolvedValue(mockReport);

      await controller.create(createDto, { user: { id: 'scout-456' } });

      expect(service.create).toHaveBeenCalledWith(createDto, 'scout-456');
    });

    it('should extract scoutId from req.user.sub when id is not available', async () => {
      mockScoutingReportsService.create.mockResolvedValue(mockReport);

      await controller.create(createDto, { user: { sub: 'scout-789' } });

      expect(service.create).toHaveBeenCalledWith(createDto, 'scout-789');
    });

    it('should handle validation errors from DTO', async () => {
      const invalidDto = { matchId: 'match-123' }; // Missing required playerId
      mockScoutingReportsService.create.mockRejectedValue(new Error('Validation failed'));

      await expect(controller.create(invalidDto as any, mockRequest)).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    const mockReports = [mockReport];

    it('should return all reports without filters', async () => {
      mockScoutingReportsService.findAll.mockResolvedValue(mockReports);

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(mockReports);
    });

    it('should filter by playerId', async () => {
      mockScoutingReportsService.findAll.mockResolvedValue(mockReports);

      await controller.findAll({ playerId: 'player-123' });

      expect(service.findAll).toHaveBeenCalledWith({ playerId: 'player-123' });
    });

    it('should filter by scoutId', async () => {
      mockScoutingReportsService.findAll.mockResolvedValue(mockReports);

      await controller.findAll({ scoutId: 'scout-123' });

      expect(service.findAll).toHaveBeenCalledWith({ scoutId: 'scout-123' });
    });

    it('should filter by matchId', async () => {
      mockScoutingReportsService.findAll.mockResolvedValue(mockReports);

      await controller.findAll({ matchId: 'match-123' });

      expect(service.findAll).toHaveBeenCalledWith({ matchId: 'match-123' });
    });

    it('should filter by status', async () => {
      mockScoutingReportsService.findAll.mockResolvedValue(mockReports);

      await controller.findAll({ status: 'SUBMITTED' as ReportStatus });

      expect(service.findAll).toHaveBeenCalledWith({ status: 'SUBMITTED' });
    });

    it('should filter by recommendation', async () => {
      mockScoutingReportsService.findAll.mockResolvedValue(mockReports);

      await controller.findAll({ recommendation: 'HIGHLY_RECOMMENDED' as RecommendationType });

      expect(service.findAll).toHaveBeenCalledWith({ recommendation: 'HIGHLY_RECOMMENDED' });
    });

    it('should handle multiple filters', async () => {
      mockScoutingReportsService.findAll.mockResolvedValue(mockReports);
      const queryDto = {
        playerId: 'player-123',
        scoutId: 'scout-123',
        status: 'APPROVED' as ReportStatus,
      };

      await controller.findAll(queryDto);

      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('findOne', () => {
    it('should return a report by ID', async () => {
      mockScoutingReportsService.findOne.mockResolvedValue(mockReport);

      const result = await controller.findOne('report-123');

      expect(service.findOne).toHaveBeenCalledWith('report-123');
      expect(result).toEqual(mockReport);
    });

    it('should handle not found errors', async () => {
      mockScoutingReportsService.findOne.mockRejectedValue(new Error('Report not found'));

      await expect(controller.findOne('invalid-id')).rejects.toThrow();
    });
  });

  describe('getPlayerReports', () => {
    it('should return reports for a player', async () => {
      const mockReports = [mockReport];
      mockScoutingReportsService.getPlayerReports.mockResolvedValue(mockReports);

      const result = await controller.getPlayerReports('player-123');

      expect(service.getPlayerReports).toHaveBeenCalledWith('player-123');
      expect(result).toEqual(mockReports);
    });

    it('should return empty array when player has no reports', async () => {
      mockScoutingReportsService.getPlayerReports.mockResolvedValue([]);

      const result = await controller.getPlayerReports('player-456');

      expect(result).toEqual([]);
    });
  });

  describe('getScoutReports', () => {
    it('should return reports for a scout', async () => {
      const mockReports = [mockReport];
      mockScoutingReportsService.getScoutReports.mockResolvedValue(mockReports);

      const result = await controller.getScoutReports('scout-123');

      expect(service.getScoutReports).toHaveBeenCalledWith('scout-123');
      expect(result).toEqual(mockReports);
    });

    it('should return empty array when scout has no reports', async () => {
      mockScoutingReportsService.getScoutReports.mockResolvedValue([]);

      const result = await controller.getScoutReports('scout-456');

      expect(result).toEqual([]);
    });
  });

  describe('getMatchReports', () => {
    it('should return reports for a match', async () => {
      const mockReports = [mockReport];
      mockScoutingReportsService.getMatchReports.mockResolvedValue(mockReports);

      const result = await controller.getMatchReports('match-123');

      expect(service.getMatchReports).toHaveBeenCalledWith('match-123');
      expect(result).toEqual(mockReports);
    });

    it('should return empty array when match has no reports', async () => {
      mockScoutingReportsService.getMatchReports.mockResolvedValue([]);

      const result = await controller.getMatchReports('match-456');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateDto = {
      summary: 'Updated summary',
      overallRating: 90,
      strengths: 'Updated strengths',
    };

    const updatedReport = {
      ...mockReport,
      ...updateDto,
    };

    it('should update a report', async () => {
      mockScoutingReportsService.update.mockResolvedValue(updatedReport);

      const result = await controller.update('report-123', updateDto);

      expect(service.update).toHaveBeenCalledWith('report-123', updateDto);
      expect(result).toEqual(updatedReport);
    });

    it('should handle not found errors during update', async () => {
      mockScoutingReportsService.update.mockRejectedValue(new Error('Report not found'));

      await expect(controller.update('invalid-id', updateDto)).rejects.toThrow();
    });

    it('should update specific fields', async () => {
      const partialUpdate = { overallRating: 95 };
      mockScoutingReportsService.update.mockResolvedValue({ ...mockReport, overallRating: 95 });

      await controller.update('report-123', partialUpdate);

      expect(service.update).toHaveBeenCalledWith('report-123', partialUpdate);
    });

    it('should update status field', async () => {
      const statusUpdate = { status: 'SUBMITTED' as ReportStatus };
      mockScoutingReportsService.update.mockResolvedValue({ ...mockReport, status: 'SUBMITTED' });

      await controller.update('report-123', statusUpdate);

      expect(service.update).toHaveBeenCalledWith('report-123', statusUpdate);
    });

    it('should update ratings', async () => {
      const ratingsUpdate = {
        technicalRating: 92,
        physicalRating: 88,
        mentalRating: 85,
        tacticalRating: 87,
      };
      mockScoutingReportsService.update.mockResolvedValue({ ...mockReport, ...ratingsUpdate });

      await controller.update('report-123', ratingsUpdate);

      expect(service.update).toHaveBeenCalledWith('report-123', ratingsUpdate);
    });

    it('should update tags', async () => {
      const tagsUpdate = { tags: ['updated', 'tags'] };
      mockScoutingReportsService.update.mockResolvedValue({
        ...mockReport,
        tags: ['updated', 'tags'],
      });

      await controller.update('report-123', tagsUpdate);

      expect(service.update).toHaveBeenCalledWith('report-123', tagsUpdate);
    });
  });

  describe('submit', () => {
    it('should submit a report', async () => {
      const submittedReport = {
        ...mockReport,
        status: 'SUBMITTED' as ReportStatus,
        submittedAt: new Date(),
      };
      mockScoutingReportsService.submit.mockResolvedValue(submittedReport);

      const result = await controller.submit('report-123');

      expect(service.submit).toHaveBeenCalledWith('report-123');
      expect(result).toEqual(submittedReport);
    });

    it('should handle not found errors during submit', async () => {
      mockScoutingReportsService.submit.mockRejectedValue(new Error('Report not found'));

      await expect(controller.submit('invalid-id')).rejects.toThrow();
    });
  });

  describe('review', () => {
    it('should approve a report', async () => {
      const approvedReport = {
        ...mockReport,
        status: 'APPROVED' as ReportStatus,
        reviewedAt: new Date(),
        reviewedBy: 'reviewer-123',
      };
      mockScoutingReportsService.review.mockResolvedValue(approvedReport);

      const reviewRequest = {
        user: {
          id: 'reviewer-123',
          sub: 'reviewer-123',
        },
      };

      const result = await controller.review('report-123', true, reviewRequest);

      expect(service.review).toHaveBeenCalledWith('report-123', 'reviewer-123', true);
      expect(result).toEqual(approvedReport);
    });

    it('should reject a report', async () => {
      const rejectedReport = {
        ...mockReport,
        status: 'REJECTED' as ReportStatus,
        reviewedAt: new Date(),
        reviewedBy: 'reviewer-123',
      };
      mockScoutingReportsService.review.mockResolvedValue(rejectedReport);

      const reviewRequest = {
        user: {
          id: 'reviewer-123',
          sub: 'reviewer-123',
        },
      };

      const result = await controller.review('report-123', false, reviewRequest);

      expect(service.review).toHaveBeenCalledWith('report-123', 'reviewer-123', false);
      expect(result).toEqual(rejectedReport);
    });

    it('should extract reviewerId from req.user.id', async () => {
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      await controller.review('report-123', true, { user: { id: 'reviewer-456' } });

      expect(service.review).toHaveBeenCalledWith('report-123', 'reviewer-456', true);
    });

    it('should extract reviewerId from req.user.sub when id is not available', async () => {
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      await controller.review('report-123', true, { user: { sub: 'reviewer-789' } });

      expect(service.review).toHaveBeenCalledWith('report-123', 'reviewer-789', true);
    });

    it('should handle not found errors during review', async () => {
      mockScoutingReportsService.review.mockRejectedValue(new Error('Report not found'));

      await expect(controller.review('invalid-id', true, mockRequest)).rejects.toThrow();
    });
  });

  describe('remove', () => {
    it('should delete a report', async () => {
      const deleteResponse = { message: 'Rapport supprimé avec succès' };
      mockScoutingReportsService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove('report-123');

      expect(service.remove).toHaveBeenCalledWith('report-123');
      expect(result).toEqual(deleteResponse);
    });

    it('should handle not found errors during delete', async () => {
      mockScoutingReportsService.remove.mockRejectedValue(new Error('Report not found'));

      await expect(controller.remove('invalid-id')).rejects.toThrow();
    });
  });

  describe('JwtAuthGuard protection', () => {
    it('should be protected by JwtAuthGuard', () => {
      const protectedMethods = ['create', 'update', 'submit', 'review', 'remove'] as const;

      for (const method of protectedMethods) {
        const guards = Reflect.getMetadata(
          '__guards__',
          ScoutingReportsController.prototype[method],
        );
        expect(guards).toBeDefined();
        expect(guards.length).toBeGreaterThan(0);

        const hasJwtAuthGuard = guards.some(
          (guard: any) =>
            guard === JwtAuthGuard ||
            guard?.name === 'JwtAuthGuard' ||
            guard?.metatype?.name === 'JwtAuthGuard',
        );
        expect(hasJwtAuthGuard).toBe(true);
      }
    });
  });

  describe('API documentation', () => {
    it('should have ApiTags decorator', () => {
      const tags = Reflect.getMetadata('swagger/apiUseTags', ScoutingReportsController);
      expect(tags).toContain('scouting-reports');
    });

    it('should have ApiBearerAuth decorator', () => {
      const protectedMethods = ['create', 'update', 'submit', 'review', 'remove'] as const;

      for (const method of protectedMethods) {
        const security = Reflect.getMetadata(
          'swagger/apiSecurity',
          ScoutingReportsController.prototype[method],
        );
        expect(security).toBeDefined();
      }
    });
  });

  describe('Request parameter extraction', () => {
    it('should handle req.user.id for scoutId extraction', async () => {
      mockScoutingReportsService.create.mockResolvedValue(mockReport);
      const createDto = {
        matchId: 'match-123',
        playerId: 'player-123',
      };

      await controller.create(createDto, { user: { id: 'scout-999', sub: 'scout-000' } });

      expect(service.create).toHaveBeenCalledWith(createDto, 'scout-999');
    });

    it('should fallback to req.user.sub if id is undefined', async () => {
      mockScoutingReportsService.create.mockResolvedValue(mockReport);
      const createDto = {
        matchId: 'match-123',
        playerId: 'player-123',
      };

      await controller.create(createDto, { user: { id: undefined, sub: 'scout-888' } });

      expect(service.create).toHaveBeenCalledWith(createDto, 'scout-888');
    });

    it('should handle req.user.id for reviewerId extraction', async () => {
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      await controller.review('report-123', true, {
        user: { id: 'reviewer-999', sub: 'reviewer-000' },
      });

      expect(service.review).toHaveBeenCalledWith('report-123', 'reviewer-999', true);
    });

    it('should fallback to req.user.sub for reviewerId if id is undefined', async () => {
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      await controller.review('report-123', false, {
        user: { id: undefined, sub: 'reviewer-888' },
      });

      expect(service.review).toHaveBeenCalledWith('report-123', 'reviewer-888', false);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty query parameters', async () => {
      mockScoutingReportsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });

    it('should handle service errors gracefully', async () => {
      mockScoutingReportsService.create.mockRejectedValue(new Error('Database error'));

      await expect(
        controller.create({ matchId: 'match-123', playerId: 'player-123' }, mockRequest),
      ).rejects.toThrow('Database error');
    });

    it('should pass through all query filters', async () => {
      const complexQuery = {
        playerId: 'player-123',
        scoutId: 'scout-456',
        matchId: 'match-789',
        status: 'APPROVED' as ReportStatus,
        recommendation: 'HIGHLY_RECOMMENDED' as RecommendationType,
      };
      mockScoutingReportsService.findAll.mockResolvedValue([]);

      await controller.findAll(complexQuery);

      expect(service.findAll).toHaveBeenCalledWith(complexQuery);
    });
  });

  describe('Additional controller edge cases', () => {
    it('should handle NotFoundException from service on findOne', async () => {
      mockScoutingReportsService.findOne.mockRejectedValue(new Error('Report not found'));

      await expect(controller.findOne('non-existent-id')).rejects.toThrow('Report not found');
    });

    it('should handle concurrent update requests', async () => {
      mockScoutingReportsService.update.mockResolvedValue(mockReport);

      const updatePromises = [
        controller.update('report-123', { summary: 'Update 1' }),
        controller.update('report-123', { summary: 'Update 2' }),
        controller.update('report-123', { summary: 'Update 3' }),
      ];

      await Promise.all(updatePromises);

      expect(service.update).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid submit and review workflow', async () => {
      mockScoutingReportsService.submit.mockResolvedValue({
        ...mockReport,
        status: 'SUBMITTED' as ReportStatus,
      });
      mockScoutingReportsService.review.mockResolvedValue({
        ...mockReport,
        status: 'APPROVED' as ReportStatus,
      });

      await controller.submit('report-123');
      await controller.review('report-123', true, mockRequest);

      expect(service.submit).toHaveBeenCalledWith('report-123');
      expect(service.review).toHaveBeenCalledWith('report-123', 'scout-123', true);
    });

    it('should handle empty report ID gracefully', async () => {
      mockScoutingReportsService.findOne.mockRejectedValue(new Error('Invalid ID'));

      await expect(controller.findOne('')).rejects.toThrow('Invalid ID');
    });

    it('should handle reports with all optional fields undefined', async () => {
      const minimalDto = {
        matchId: 'match-123',
        playerId: 'player-123',
      };
      mockScoutingReportsService.create.mockResolvedValue(mockReport);

      await controller.create(minimalDto, mockRequest);

      expect(service.create).toHaveBeenCalledWith(minimalDto, 'scout-123');
    });
  });

  describe('Status-specific filtering', () => {
    const allStatuses: ReportStatus[] = ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'];

    allStatuses.forEach((status) => {
      it(`should filter reports by ${status} status`, async () => {
        mockScoutingReportsService.findAll.mockResolvedValue([mockReport]);

        await controller.findAll({ status });

        expect(service.findAll).toHaveBeenCalledWith({ status });
      });
    });
  });

  describe('Recommendation-specific filtering', () => {
    const allRecommendations = [
      'BUY_NOW',
      'MONITOR',
      'FOLLOW_UP',
      'NOT_INTERESTED',
      'HIGHLY_RECOMMENDED',
      'RECOMMENDED',
      'NOT_RECOMMENDED',
    ];

    allRecommendations.forEach((recommendation) => {
      it(`should filter reports by ${recommendation} recommendation`, async () => {
        mockScoutingReportsService.findAll.mockResolvedValue([mockReport]);

        await controller.findAll({ recommendation: recommendation as RecommendationType });

        expect(service.findAll).toHaveBeenCalledWith({ recommendation });
      });
    });
  });

  describe('User context extraction', () => {
    it('should handle user with only email field', async () => {
      const requestWithEmail = {
        user: {
          email: 'test@example.com',
        },
      } as any;
      mockScoutingReportsService.create.mockResolvedValue(mockReport);

      await controller.create({ matchId: 'match-123', playerId: 'player-123' }, requestWithEmail);

      expect(service.create).toHaveBeenCalledWith(
        { matchId: 'match-123', playerId: 'player-123' },
        undefined,
      );
    });

    it('should prioritize id over sub for reviewer extraction', async () => {
      const requestBothIds = {
        user: {
          id: 'id-should-win',
          sub: 'sub-should-lose',
        },
      } as any;
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      await controller.review('report-123', true, requestBothIds);

      expect(service.review).toHaveBeenCalledWith('report-123', 'id-should-win', true);
    });
  });

  describe('Multiple entity fetching', () => {
    it('should handle fetching reports for multiple players sequentially', async () => {
      mockScoutingReportsService.getPlayerReports.mockResolvedValue([mockReport]);

      await controller.getPlayerReports('player-1');
      await controller.getPlayerReports('player-2');
      await controller.getPlayerReports('player-3');

      expect(service.getPlayerReports).toHaveBeenCalledTimes(3);
      expect(service.getPlayerReports).toHaveBeenCalledWith('player-1');
      expect(service.getPlayerReports).toHaveBeenCalledWith('player-2');
      expect(service.getPlayerReports).toHaveBeenCalledWith('player-3');
    });

    it('should handle fetching reports for multiple scouts sequentially', async () => {
      mockScoutingReportsService.getScoutReports.mockResolvedValue([mockReport]);

      await controller.getScoutReports('scout-1');
      await controller.getScoutReports('scout-2');

      expect(service.getScoutReports).toHaveBeenCalledTimes(2);
    });

    it('should handle fetching reports for multiple matches sequentially', async () => {
      mockScoutingReportsService.getMatchReports.mockResolvedValue([mockReport]);

      await controller.getMatchReports('match-1');
      await controller.getMatchReports('match-2');

      expect(service.getMatchReports).toHaveBeenCalledTimes(2);
    });
  });

  describe('Update operation variants', () => {
    it('should update only summary field', async () => {
      mockScoutingReportsService.update.mockResolvedValue(mockReport);

      await controller.update('report-123', { summary: 'New summary only' });

      expect(service.update).toHaveBeenCalledWith('report-123', { summary: 'New summary only' });
    });

    it('should update only rating fields', async () => {
      const ratingsOnly = {
        technicalRating: 95,
        physicalRating: 93,
        mentalRating: 91,
        tacticalRating: 89,
      };
      mockScoutingReportsService.update.mockResolvedValue(mockReport);

      await controller.update('report-123', ratingsOnly);

      expect(service.update).toHaveBeenCalledWith('report-123', ratingsOnly);
    });

    it('should update only recommendation fields', async () => {
      const recommendationOnly = {
        recommendation: 'BUY_NOW' as RecommendationType,
        recommendationNotes: 'Must acquire immediately',
      };
      mockScoutingReportsService.update.mockResolvedValue(mockReport);

      await controller.update('report-123', recommendationOnly);

      expect(service.update).toHaveBeenCalledWith('report-123', recommendationOnly);
    });

    it('should update tags only', async () => {
      const tagsOnly = { tags: ['new', 'updated', 'tags'] };
      mockScoutingReportsService.update.mockResolvedValue(mockReport);

      await controller.update('report-123', tagsOnly);

      expect(service.update).toHaveBeenCalledWith('report-123', tagsOnly);
    });

    it('should update similar players only', async () => {
      const similarPlayersOnly = { similarPlayerIds: ['p1', 'p2', 'p3'] };
      mockScoutingReportsService.update.mockResolvedValue(mockReport);

      await controller.update('report-123', similarPlayersOnly);

      expect(service.update).toHaveBeenCalledWith('report-123', similarPlayersOnly);
    });
  });

  describe('Review workflow scenarios', () => {
    it('should approve with different reviewer IDs', async () => {
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      const reviewer1 = { user: { id: 'reviewer-1' } };
      const reviewer2 = { user: { id: 'reviewer-2' } };
      const reviewer3 = { user: { id: 'reviewer-3' } };

      await controller.review('report-1', true, reviewer1);
      await controller.review('report-2', true, reviewer2);
      await controller.review('report-3', true, reviewer3);

      expect(service.review).toHaveBeenCalledWith('report-1', 'reviewer-1', true);
      expect(service.review).toHaveBeenCalledWith('report-2', 'reviewer-2', true);
      expect(service.review).toHaveBeenCalledWith('report-3', 'reviewer-3', true);
    });

    it('should reject with different reviewer IDs', async () => {
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      const reviewer1 = { user: { id: 'reviewer-1' } };
      const reviewer2 = { user: { id: 'reviewer-2' } };

      await controller.review('report-1', false, reviewer1);
      await controller.review('report-2', false, reviewer2);

      expect(service.review).toHaveBeenCalledWith('report-1', 'reviewer-1', false);
      expect(service.review).toHaveBeenCalledWith('report-2', 'reviewer-2', false);
    });

    it('should handle review decision as boolean true', async () => {
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      await controller.review('report-123', true, mockRequest);

      expect(service.review).toHaveBeenCalledWith('report-123', 'scout-123', true);
    });

    it('should handle review decision as boolean false', async () => {
      mockScoutingReportsService.review.mockResolvedValue(mockReport);

      await controller.review('report-123', false, mockRequest);

      expect(service.review).toHaveBeenCalledWith('report-123', 'scout-123', false);
    });
  });

  describe('Delete operation scenarios', () => {
    it('should successfully delete and return message', async () => {
      const deleteResponse = { message: 'Rapport supprimé avec succès' };
      mockScoutingReportsService.remove.mockResolvedValue(deleteResponse);

      const result = await controller.remove('report-123');

      expect(result).toEqual(deleteResponse);
      expect(result.message).toBe('Rapport supprimé avec succès');
    });

    it('should handle deleting multiple reports sequentially', async () => {
      const deleteResponse = { message: 'Rapport supprimé avec succès' };
      mockScoutingReportsService.remove.mockResolvedValue(deleteResponse);

      await controller.remove('report-1');
      await controller.remove('report-2');
      await controller.remove('report-3');

      expect(service.remove).toHaveBeenCalledTimes(3);
      expect(service.remove).toHaveBeenCalledWith('report-1');
      expect(service.remove).toHaveBeenCalledWith('report-2');
      expect(service.remove).toHaveBeenCalledWith('report-3');
    });
  });

  describe('Service method invocations', () => {
    it('should call service methods with correct parameters', async () => {
      mockScoutingReportsService.create.mockResolvedValue(mockReport);
      mockScoutingReportsService.findAll.mockResolvedValue([mockReport]);
      mockScoutingReportsService.findOne.mockResolvedValue(mockReport);
      mockScoutingReportsService.update.mockResolvedValue(mockReport);
      mockScoutingReportsService.submit.mockResolvedValue(mockReport);
      mockScoutingReportsService.review.mockResolvedValue(mockReport);
      mockScoutingReportsService.remove.mockResolvedValue({ message: 'Deleted' });
      mockScoutingReportsService.getPlayerReports.mockResolvedValue([mockReport]);
      mockScoutingReportsService.getScoutReports.mockResolvedValue([mockReport]);
      mockScoutingReportsService.getMatchReports.mockResolvedValue([mockReport]);

      await controller.create({ matchId: 'match-123', playerId: 'player-123' }, mockRequest);
      await controller.findAll({});
      await controller.findOne('report-123');
      await controller.update('report-123', { summary: 'Updated' });
      await controller.submit('report-123');
      await controller.review('report-123', true, mockRequest);
      await controller.remove('report-123');
      await controller.getPlayerReports('player-123');
      await controller.getScoutReports('scout-123');
      await controller.getMatchReports('match-123');

      expect(service.create).toHaveBeenCalled();
      expect(service.findAll).toHaveBeenCalled();
      expect(service.findOne).toHaveBeenCalled();
      expect(service.update).toHaveBeenCalled();
      expect(service.submit).toHaveBeenCalled();
      expect(service.review).toHaveBeenCalled();
      expect(service.remove).toHaveBeenCalled();
      expect(service.getPlayerReports).toHaveBeenCalled();
      expect(service.getScoutReports).toHaveBeenCalled();
      expect(service.getMatchReports).toHaveBeenCalled();
    });
  });
});
