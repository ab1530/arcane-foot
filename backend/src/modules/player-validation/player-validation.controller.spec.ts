import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PlayerValidationController } from './player-validation.controller';
import { PlayerValidationService } from './player-validation.service';
import { BulkImportService, ImportResult } from './bulk-import.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { VerificationStatus, PlayerType } from '@prisma/client';

describe('PlayerValidationController', () => {
  let controller: PlayerValidationController;
  let validationService: jest.Mocked<PlayerValidationService>;
  let bulkImportService: jest.Mocked<BulkImportService>;

  const mockRequest = {
    user: {
      id: 'admin-123',
      email: 'admin@example.com',
      role: 'ADMIN',
    },
  };

  beforeEach(async () => {
    validationService = {
      getPendingPlayers: jest.fn(),
      getPlayersByStatus: jest.fn(),
      validatePlayer: jest.fn(),
      rejectPlayer: jest.fn(),
      markAsSuspicious: jest.fn(),
      convertToAgency: jest.fn(),
      getVerificationStats: jest.fn(),
      getValidationHistory: jest.fn(),
    } as any;

    bulkImportService = {
      importPlayers: jest.fn(),
      parseCsvFile: jest.fn(),
      exportPlayersToCSV: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayerValidationController],
      providers: [
        {
          provide: PlayerValidationService,
          useValue: validationService,
        },
        {
          provide: BulkImportService,
          useValue: bulkImportService,
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
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<PlayerValidationController>(PlayerValidationController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPendingPlayers', () => {
    const mockResponse = {
      data: [
        {
          id: 'player-1',
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.PENDING,
          users: {
            id: 'user-1',
            email: 'pending@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: null,
            avatar: null,
            createdAt: new Date(),
          },
          clubs: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    } as any;

    it('should return pending players with default pagination', async () => {
      validationService.getPendingPlayers.mockResolvedValue(mockResponse);

      const result = await controller.getPendingPlayers();

      expect(validationService.getPendingPlayers).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual(mockResponse);
    });

    it('should return pending players with custom pagination', async () => {
      validationService.getPendingPlayers.mockResolvedValue(mockResponse);

      const result = await controller.getPendingPlayers('2', '10');

      expect(validationService.getPendingPlayers).toHaveBeenCalledWith(2, 10);
      expect(result).toEqual(mockResponse);
    });

    it('should parse string query parameters to numbers', async () => {
      validationService.getPendingPlayers.mockResolvedValue(mockResponse);

      await controller.getPendingPlayers('5', '15');

      expect(validationService.getPendingPlayers).toHaveBeenCalledWith(5, 15);
    });

    it('should handle undefined pagination parameters', async () => {
      validationService.getPendingPlayers.mockResolvedValue(mockResponse);

      await controller.getPendingPlayers(undefined, undefined);

      expect(validationService.getPendingPlayers).toHaveBeenCalledWith(1, 20);
    });
  });

  describe('getPlayersByStatus', () => {
    const mockResponse = {
      data: [
        {
          id: 'player-1',
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.VERIFIED,
          users: {
            id: 'user-1',
            email: 'verified@example.com',
            firstName: 'John',
            lastName: 'Verified',
            phone: null,
            avatar: null,
            createdAt: new Date(),
          },
          clubs: null,
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      },
    } as any;

    it('should return players filtered by VERIFIED status', async () => {
      validationService.getPlayersByStatus.mockResolvedValue(mockResponse);

      const result = await controller.getPlayersByStatus('VERIFIED');

      expect(validationService.getPlayersByStatus).toHaveBeenCalledWith(
        VerificationStatus.VERIFIED,
        1,
        20,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return players filtered by PENDING status', async () => {
      validationService.getPlayersByStatus.mockResolvedValue(mockResponse);

      await controller.getPlayersByStatus('PENDING', '1', '20');

      expect(validationService.getPlayersByStatus).toHaveBeenCalledWith(
        VerificationStatus.PENDING,
        1,
        20,
      );
    });

    it('should return players filtered by REJECTED status', async () => {
      validationService.getPlayersByStatus.mockResolvedValue(mockResponse);

      await controller.getPlayersByStatus('REJECTED');

      expect(validationService.getPlayersByStatus).toHaveBeenCalledWith(
        VerificationStatus.REJECTED,
        1,
        20,
      );
    });

    it('should return players filtered by SUSPICIOUS status', async () => {
      validationService.getPlayersByStatus.mockResolvedValue(mockResponse);

      await controller.getPlayersByStatus('SUSPICIOUS');

      expect(validationService.getPlayersByStatus).toHaveBeenCalledWith(
        VerificationStatus.SUSPICIOUS,
        1,
        20,
      );
    });

    it('should throw BadRequestException for invalid status', async () => {
      await expect(
        controller.getPlayersByStatus('INVALID_STATUS'),
      ).rejects.toThrow(new BadRequestException('Invalid status: INVALID_STATUS'));

      expect(validationService.getPlayersByStatus).not.toHaveBeenCalled();
    });

    it('should handle custom pagination parameters', async () => {
      validationService.getPlayersByStatus.mockResolvedValue(mockResponse);

      await controller.getPlayersByStatus('VERIFIED', '3', '15');

      expect(validationService.getPlayersByStatus).toHaveBeenCalledWith(
        VerificationStatus.VERIFIED,
        3,
        15,
      );
    });
  });

  describe('validatePlayer', () => {
    const playerId = 'player-123';
    const dto = { notes: 'Player credentials verified' };
    const mockValidatedPlayer = {
      id: playerId,
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date(),
      verifiedById: mockRequest.user.id,
    };

    it('should validate a player successfully', async () => {
      validationService.validatePlayer.mockResolvedValue(mockValidatedPlayer as any);

      const result = await controller.validatePlayer(playerId, dto, mockRequest);

      expect(validationService.validatePlayer).toHaveBeenCalledWith(
        playerId,
        mockRequest.user.id,
        dto,
      );
      expect(result).toEqual(mockValidatedPlayer);
    });

    it('should extract user ID from request', async () => {
      validationService.validatePlayer.mockResolvedValue(mockValidatedPlayer as any);

      await controller.validatePlayer(playerId, dto, mockRequest);

      expect(validationService.validatePlayer).toHaveBeenCalledWith(
        playerId,
        'admin-123',
        dto,
      );
    });

    it('should handle validation with empty notes', async () => {
      validationService.validatePlayer.mockResolvedValue(mockValidatedPlayer as any);

      await controller.validatePlayer(playerId, {}, mockRequest);

      expect(validationService.validatePlayer).toHaveBeenCalledWith(
        playerId,
        mockRequest.user.id,
        {},
      );
    });
  });

  describe('rejectPlayer', () => {
    const playerId = 'player-123';
    const dto = { rejectionReason: 'Unable to verify credentials' };
    const mockRejectedPlayer = {
      id: playerId,
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.REJECTED,
      rejectionReason: dto.rejectionReason,
      verifiedAt: new Date(),
      verifiedById: mockRequest.user.id,
    };

    it('should reject a player successfully', async () => {
      validationService.rejectPlayer.mockResolvedValue(mockRejectedPlayer as any);

      const result = await controller.rejectPlayer(playerId, dto, mockRequest);

      expect(validationService.rejectPlayer).toHaveBeenCalledWith(
        playerId,
        mockRequest.user.id,
        dto,
      );
      expect(result).toEqual(mockRejectedPlayer);
    });

    it('should extract user ID from request', async () => {
      validationService.rejectPlayer.mockResolvedValue(mockRejectedPlayer as any);

      await controller.rejectPlayer(playerId, dto, mockRequest);

      expect(validationService.rejectPlayer).toHaveBeenCalledWith(
        playerId,
        'admin-123',
        dto,
      );
    });
  });

  describe('markAsSuspicious', () => {
    const playerId = 'player-123';
    const reason = 'Duplicate profile detected';
    const mockSuspiciousPlayer = {
      id: playerId,
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.SUSPICIOUS,
      rejectionReason: reason,
    };

    it('should mark player as suspicious successfully', async () => {
      validationService.markAsSuspicious.mockResolvedValue(mockSuspiciousPlayer as any);

      const result = await controller.markAsSuspicious(playerId, reason, mockRequest);

      expect(validationService.markAsSuspicious).toHaveBeenCalledWith(
        playerId,
        mockRequest.user.id,
        reason,
      );
      expect(result).toEqual(mockSuspiciousPlayer);
    });

    it('should throw BadRequestException if reason is missing', async () => {
      await expect(
        controller.markAsSuspicious(playerId, '', mockRequest),
      ).rejects.toThrow(new BadRequestException('Reason is required'));

      expect(validationService.markAsSuspicious).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reason is null', async () => {
      await expect(
        controller.markAsSuspicious(playerId, null as any, mockRequest),
      ).rejects.toThrow(new BadRequestException('Reason is required'));

      expect(validationService.markAsSuspicious).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if reason is undefined', async () => {
      await expect(
        controller.markAsSuspicious(playerId, undefined as any, mockRequest),
      ).rejects.toThrow(new BadRequestException('Reason is required'));

      expect(validationService.markAsSuspicious).not.toHaveBeenCalled();
    });
  });

  describe('convertToAgency', () => {
    const playerId = 'player-123';
    const dto = { conversionNotes: 'Player signed with our agency' };
    const mockConvertedPlayer = {
      id: playerId,
      playerType: PlayerType.AGENCY,
      verificationStatus: VerificationStatus.VERIFIED,
      conversionNotes: dto.conversionNotes,
    };

    it('should convert player to AGENCY successfully', async () => {
      validationService.convertToAgency.mockResolvedValue(mockConvertedPlayer as any);

      const result = await controller.convertToAgency(playerId, dto, mockRequest);

      expect(validationService.convertToAgency).toHaveBeenCalledWith(
        playerId,
        mockRequest.user.id,
        dto,
      );
      expect(result).toEqual(mockConvertedPlayer);
    });

    it('should extract user ID from request', async () => {
      validationService.convertToAgency.mockResolvedValue(mockConvertedPlayer as any);

      await controller.convertToAgency(playerId, dto, mockRequest);

      expect(validationService.convertToAgency).toHaveBeenCalledWith(
        playerId,
        'admin-123',
        dto,
      );
    });

    it('should handle conversion without notes', async () => {
      validationService.convertToAgency.mockResolvedValue(mockConvertedPlayer as any);

      await controller.convertToAgency(playerId, {}, mockRequest);

      expect(validationService.convertToAgency).toHaveBeenCalledWith(
        playerId,
        mockRequest.user.id,
        {},
      );
    });
  });

  describe('getVerificationStats', () => {
    const mockStats = {
      totalPublicPlayers: 100,
      statusBreakdown: {
        pending: 30,
        verified: 50,
        rejected: 15,
        suspicious: 5,
      },
      percentages: {
        pending: 30,
        verified: 50,
        rejected: 15,
        suspicious: 5,
      },
      recentActivity: {
        validationsLast30Days: 12,
        rejectionsLast30Days: 3,
      },
    };

    it('should return verification statistics', async () => {
      validationService.getVerificationStats.mockResolvedValue(mockStats);

      const result = await controller.getVerificationStats();

      expect(validationService.getVerificationStats).toHaveBeenCalled();
      expect(result).toEqual(mockStats);
    });

    it('should call service method without parameters', async () => {
      validationService.getVerificationStats.mockResolvedValue(mockStats);

      await controller.getVerificationStats();

      expect(validationService.getVerificationStats).toHaveBeenCalledWith();
    });
  });

  describe('getValidationHistory', () => {
    const playerId = 'player-123';
    const mockHistory = {
      player: {
        id: playerId,
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.VERIFIED,
        verifiedAt: new Date(),
        verifiedById: 'admin-123',
        rejectionReason: null,
        conversionNotes: 'Verified',
      },
      history: [
        {
          id: 'log-1',
          action: 'PLAYER_VALIDATED',
          createdAt: new Date(),
        },
      ],
    };

    it('should return player validation history', async () => {
      validationService.getValidationHistory.mockResolvedValue(mockHistory as any);

      const result = await controller.getValidationHistory(playerId);

      expect(validationService.getValidationHistory).toHaveBeenCalledWith(playerId);
      expect(result).toEqual(mockHistory);
    });
  });

  describe('bulkImport', () => {
    const dto = {
      players: [
        {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          position: 'Forward',
          dateOfBirth: '1998-01-15',
          nationality: 'FR',
        },
      ],
      autoVerify: false,
    };

    const mockImportResult: ImportResult = {
      success: true,
      imported: 1,
      failed: 0,
      errors: [],
      players: [
        {
          id: 'player-1',
          email: 'john@example.com',
        },
      ],
    };

    it('should import players successfully', async () => {
      bulkImportService.importPlayers.mockResolvedValue(mockImportResult);

      const result = await controller.bulkImport(dto, mockRequest);

      expect(bulkImportService.importPlayers).toHaveBeenCalledWith(
        dto,
        mockRequest.user.id,
      );
      expect(result).toEqual(mockImportResult);
    });

    it('should extract user ID from request for bulk import', async () => {
      bulkImportService.importPlayers.mockResolvedValue(mockImportResult);

      await controller.bulkImport(dto, mockRequest);

      expect(bulkImportService.importPlayers).toHaveBeenCalledWith(dto, 'admin-123');
    });

    it('should handle bulk import with autoVerify enabled', async () => {
      const dtoWithAutoVerify = { ...dto, autoVerify: true };
      const resultWithAutoVerify = { ...mockImportResult, imported: 1 };
      bulkImportService.importPlayers.mockResolvedValue(resultWithAutoVerify);

      const result = await controller.bulkImport(dtoWithAutoVerify, mockRequest);

      expect(bulkImportService.importPlayers).toHaveBeenCalledWith(
        dtoWithAutoVerify,
        mockRequest.user.id,
      );
      expect(result).toEqual(resultWithAutoVerify);
    });

    it('should return import result with errors', async () => {
      const resultWithErrors: ImportResult = {
        success: false,
        imported: 0,
        failed: 1,
        errors: [
          {
            row: 1,
            field: 'email',
            message: 'Email already exists',
          },
        ],
        players: [],
      };
      bulkImportService.importPlayers.mockResolvedValue(resultWithErrors);

      const result = await controller.bulkImport(dto, mockRequest);

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.failed).toBe(1);
    });
  });

  describe('bulkImportCsv', () => {
    const csvContent = 'firstName,lastName,email,position,dateOfBirth,nationality\nJohn,Doe,john@example.com,Forward,1998-01-15,FR';
    const autoVerify = false;

    const mockParsedPlayers = [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        position: 'Forward',
        dateOfBirth: '1998-01-15',
        nationality: 'FR',
      },
    ];

    const mockImportResult: ImportResult = {
      success: true,
      imported: 1,
      failed: 0,
      errors: [],
      players: [{ id: 'player-1' }],
    };

    it('should import players from CSV successfully', async () => {
      bulkImportService.parseCsvFile.mockReturnValue(mockParsedPlayers as any);
      bulkImportService.importPlayers.mockResolvedValue(mockImportResult);

      const result = await controller.bulkImportCsv(csvContent, autoVerify, mockRequest);

      expect(bulkImportService.parseCsvFile).toHaveBeenCalledWith(csvContent);
      expect(bulkImportService.importPlayers).toHaveBeenCalledWith(
        { players: mockParsedPlayers, autoVerify },
        mockRequest.user.id,
      );
      expect(result).toEqual(mockImportResult);
    });

    it('should throw BadRequestException if CSV content is missing', async () => {
      await expect(
        controller.bulkImportCsv('', autoVerify, mockRequest),
      ).rejects.toThrow(new BadRequestException('CSV content is required'));

      expect(bulkImportService.parseCsvFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if CSV content is null', async () => {
      await expect(
        controller.bulkImportCsv(null as any, autoVerify, mockRequest),
      ).rejects.toThrow(new BadRequestException('CSV content is required'));
    });

    it('should throw BadRequestException if CSV content is undefined', async () => {
      await expect(
        controller.bulkImportCsv(undefined as any, autoVerify, mockRequest),
      ).rejects.toThrow(new BadRequestException('CSV content is required'));
    });

    it('should handle CSV import with autoVerify enabled', async () => {
      bulkImportService.parseCsvFile.mockReturnValue(mockParsedPlayers as any);
      bulkImportService.importPlayers.mockResolvedValue(mockImportResult);

      await controller.bulkImportCsv(csvContent, true, mockRequest);

      expect(bulkImportService.importPlayers).toHaveBeenCalledWith(
        { players: mockParsedPlayers, autoVerify: true },
        mockRequest.user.id,
      );
    });

    it('should use default autoVerify value (false)', async () => {
      bulkImportService.parseCsvFile.mockReturnValue(mockParsedPlayers as any);
      bulkImportService.importPlayers.mockResolvedValue(mockImportResult);

      await controller.bulkImportCsv(csvContent, undefined as any, mockRequest);

      expect(bulkImportService.importPlayers).toHaveBeenCalledWith(
        { players: mockParsedPlayers, autoVerify: false },
        mockRequest.user.id,
      );
    });
  });

  describe('exportCsv', () => {
    const mockCsvData = 'firstName,lastName,email,position\nJohn,Doe,john@example.com,Forward';

    it('should export all PUBLIC players to CSV without status filter', async () => {
      bulkImportService.exportPlayersToCSV.mockResolvedValue(mockCsvData);

      const result = await controller.exportCsv();

      expect(bulkImportService.exportPlayersToCSV).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockCsvData);
    });

    it('should export players filtered by VERIFIED status', async () => {
      bulkImportService.exportPlayersToCSV.mockResolvedValue(mockCsvData);

      const result = await controller.exportCsv('VERIFIED');

      expect(bulkImportService.exportPlayersToCSV).toHaveBeenCalledWith(
        VerificationStatus.VERIFIED,
      );
      expect(result).toEqual(mockCsvData);
    });

    it('should export players filtered by PENDING status', async () => {
      bulkImportService.exportPlayersToCSV.mockResolvedValue(mockCsvData);

      await controller.exportCsv('PENDING');

      expect(bulkImportService.exportPlayersToCSV).toHaveBeenCalledWith(
        VerificationStatus.PENDING,
      );
    });

    it('should export players filtered by REJECTED status', async () => {
      bulkImportService.exportPlayersToCSV.mockResolvedValue(mockCsvData);

      await controller.exportCsv('REJECTED');

      expect(bulkImportService.exportPlayersToCSV).toHaveBeenCalledWith(
        VerificationStatus.REJECTED,
      );
    });

    it('should export players filtered by SUSPICIOUS status', async () => {
      bulkImportService.exportPlayersToCSV.mockResolvedValue(mockCsvData);

      await controller.exportCsv('SUSPICIOUS');

      expect(bulkImportService.exportPlayersToCSV).toHaveBeenCalledWith(
        VerificationStatus.SUSPICIOUS,
      );
    });

    it('should throw BadRequestException for invalid status', async () => {
      await expect(controller.exportCsv('INVALID_STATUS')).rejects.toThrow(
        new BadRequestException('Invalid status: INVALID_STATUS'),
      );

      expect(bulkImportService.exportPlayersToCSV).not.toHaveBeenCalled();
    });

    it('should handle empty status parameter as undefined', async () => {
      bulkImportService.exportPlayersToCSV.mockResolvedValue(mockCsvData);

      await controller.exportCsv(undefined);

      expect(bulkImportService.exportPlayersToCSV).toHaveBeenCalledWith(undefined);
    });
  });
});
