import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PlayerValidationService } from './player-validation.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, PlayerType, VerificationStatus, UserRole } from '@prisma/client';

describe('PlayerValidationService', () => {
  let service: PlayerValidationService;
  let prisma: DeepMockProxy<PrismaClient>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockDate = new Date('2025-01-15T10:00:00Z');

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();
    notificationsService = {
      sendToUser: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayerValidationService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<PlayerValidationService>(PlayerValidationService);
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPendingPlayers', () => {
    const mockPlayers = [
      {
        id: 'player-1',
        userId: 'user-1',
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.PENDING,
        createdAt: new Date('2025-01-10'),
        users: {
          id: 'user-1',
          email: 'player1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+33612345678',
          avatar: null,
          createdAt: new Date('2025-01-10'),
        },
        clubs: {
          id: 'club-1',
          name: 'Paris FC',
          shortName: 'PFC',
          logo: 'logo.png',
          country: 'FR',
        },
      },
      {
        id: 'player-2',
        userId: 'user-2',
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.PENDING,
        createdAt: new Date('2025-01-11'),
        users: {
          id: 'user-2',
          email: 'player2@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          phone: null,
          avatar: null,
          createdAt: new Date('2025-01-11'),
        },
        clubs: null,
      },
    ];

    it('should return paginated pending players with default pagination', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(2);

      const result = await service.getPendingPlayers();

      expect(prisma.players.findMany).toHaveBeenCalledWith({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.PENDING,
        },
        skip: 0,
        take: 20,
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              createdAt: true,
            },
          },
          clubs: {
            select: {
              id: true,
              name: true,
              shortName: true,
              logo: true,
              country: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(prisma.players.count).toHaveBeenCalledWith({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.PENDING,
        },
      });
      expect(result).toEqual({
        data: mockPlayers,
        pagination: {
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        },
      });
    });

    it('should return paginated pending players with custom pagination', async () => {
      prisma.players.findMany.mockResolvedValue([mockPlayers[0]] as any);
      prisma.players.count.mockResolvedValue(50);

      const result = await service.getPendingPlayers(2, 10);

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 50,
        totalPages: 5,
      });
    });

    it('should handle empty results', async () => {
      prisma.players.findMany.mockResolvedValue([]);
      prisma.players.count.mockResolvedValue(0);

      const result = await service.getPendingPlayers();

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });

    it('should calculate totalPages correctly', async () => {
      prisma.players.findMany.mockResolvedValue(mockPlayers as any);
      prisma.players.count.mockResolvedValue(45);

      const result = await service.getPendingPlayers(1, 20);

      expect(result.pagination.totalPages).toBe(3); // Math.ceil(45 / 20)
    });
  });

  describe('getPlayersByStatus', () => {
    const mockVerifiedPlayers = [
      {
        id: 'player-1',
        userId: 'user-1',
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.VERIFIED,
        updatedAt: new Date('2025-01-10'),
        users: {
          id: 'user-1',
          email: 'verified@example.com',
          firstName: 'John',
          lastName: 'Verified',
          phone: '+33612345678',
          avatar: null,
          createdAt: new Date('2025-01-01'),
        },
        clubs: null,
      },
    ];

    it('should return players filtered by VERIFIED status', async () => {
      prisma.players.findMany.mockResolvedValue(mockVerifiedPlayers as any);
      prisma.players.count.mockResolvedValue(1);

      const result = await service.getPlayersByStatus(VerificationStatus.VERIFIED);

      expect(prisma.players.findMany).toHaveBeenCalledWith({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.VERIFIED,
        },
        skip: 0,
        take: 20,
        include: expect.any(Object),
        orderBy: {
          updatedAt: 'desc',
        },
      });
      expect(result.data).toEqual(mockVerifiedPlayers);
    });

    it('should return players filtered by REJECTED status', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.getPlayersByStatus(VerificationStatus.REJECTED);

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            playerType: PlayerType.PUBLIC,
            verificationStatus: VerificationStatus.REJECTED,
          },
        }),
      );
    });

    it('should return players filtered by SUSPICIOUS status', async () => {
      prisma.players.findMany.mockResolvedValue([] as any);
      prisma.players.count.mockResolvedValue(0);

      await service.getPlayersByStatus(VerificationStatus.SUSPICIOUS);

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            playerType: PlayerType.PUBLIC,
            verificationStatus: VerificationStatus.SUSPICIOUS,
          },
        }),
      );
    });

    it('should handle pagination for status-filtered results', async () => {
      prisma.players.findMany.mockResolvedValue(mockVerifiedPlayers as any);
      prisma.players.count.mockResolvedValue(100);

      const result = await service.getPlayersByStatus(VerificationStatus.VERIFIED, 3, 15);

      expect(prisma.players.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 30, // (3 - 1) * 15
          take: 15,
        }),
      );
      expect(result.pagination).toEqual({
        page: 3,
        limit: 15,
        total: 100,
        totalPages: 7, // Math.ceil(100 / 15)
      });
    });
  });

  describe('validatePlayer', () => {
    const playerId = 'player-123';
    const verifiedById = 'admin-456';
    const dto = { notes: 'Player credentials verified through club contact' };

    const mockPlayer = {
      id: playerId,
      userId: 'user-123',
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.PENDING,
      users: {
        id: 'user-123',
        email: 'player@example.com',
        firstName: 'Test',
        lastName: 'Player',
      },
    };

    const mockUpdatedPlayer = {
      ...mockPlayer,
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: mockDate,
      verifiedById,
      conversionNotes: dto.notes,
      rejectionReason: null,
      clubs: null,
    };

    it('should successfully validate a pending PUBLIC player', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          players: {
            update: jest.fn().mockResolvedValue(mockUpdatedPlayer),
          },
          audit_logs: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });
      notificationsService.sendToUser.mockResolvedValue(undefined);

      const result = await service.validatePlayer(playerId, verifiedById, dto);

      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: playerId },
        include: { users: true },
      });
      expect(result).toEqual(mockUpdatedPlayer);
      expect(notificationsService.sendToUser).toHaveBeenCalledWith({
        userId: mockPlayer.userId,
        title: 'Profile Verified',
        body: 'Congratulations! Your player profile has been verified by our team.',
        type: 'player_validation',
        data: {
          playerId: mockPlayer.id,
          action: 'verified',
        },
      });
    });

    it('should throw NotFoundException if player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(
        service.validatePlayer(playerId, verifiedById, dto),
      ).rejects.toThrow(new NotFoundException(`Player with ID ${playerId} not found`));
    });

    it('should throw BadRequestException if player is not PUBLIC type', async () => {
      const agencyPlayer = {
        ...mockPlayer,
        playerType: PlayerType.AGENCY,
      };
      prisma.players.findUnique.mockResolvedValue(agencyPlayer as any);

      await expect(
        service.validatePlayer(playerId, verifiedById, dto),
      ).rejects.toThrow(
        new BadRequestException('Only PUBLIC players can be validated through this endpoint'),
      );
    });

    it('should throw BadRequestException if player is already verified', async () => {
      const verifiedPlayer = {
        ...mockPlayer,
        verificationStatus: VerificationStatus.VERIFIED,
      };
      prisma.players.findUnique.mockResolvedValue(verifiedPlayer as any);

      await expect(
        service.validatePlayer(playerId, verifiedById, dto),
      ).rejects.toThrow(new BadRequestException('Player is already verified'));
    });

    it('should create audit log during transaction', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockUpdatedPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.validatePlayer(playerId, verifiedById, dto);

      expect(mockTx.audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: verifiedById,
          action: 'PLAYER_VALIDATED',
          entityType: 'Player',
          entityId: playerId,
          changes: {
            previousStatus: VerificationStatus.PENDING,
            newStatus: VerificationStatus.VERIFIED,
            notes: dto.notes,
          },
        }),
      });
    });

    it('should clear rejection reason when validating', async () => {
      const previouslyRejected = {
        ...mockPlayer,
        verificationStatus: VerificationStatus.REJECTED,
        rejectionReason: 'Some old reason',
      };
      prisma.players.findUnique.mockResolvedValue(previouslyRejected as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockUpdatedPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.validatePlayer(playerId, verifiedById, dto);

      expect(mockTx.players.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: expect.objectContaining({
          rejectionReason: null,
        }),
        include: expect.any(Object),
      });
    });

    it('should not throw if notification fails', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          players: {
            update: jest.fn().mockResolvedValue(mockUpdatedPlayer),
          },
          audit_logs: {
            create: jest.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });
      notificationsService.sendToUser.mockRejectedValue(new Error('Notification service down'));

      const result = await service.validatePlayer(playerId, verifiedById, dto);

      expect(result).toEqual(mockUpdatedPlayer);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should handle validation without notes', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue({ ...mockUpdatedPlayer, conversionNotes: null }),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.validatePlayer(playerId, verifiedById, {});

      expect(mockTx.players.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: expect.objectContaining({
          conversionNotes: null,
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('rejectPlayer', () => {
    const playerId = 'player-123';
    const rejectedById = 'admin-456';
    const dto = { rejectionReason: 'Unable to verify credentials' };

    const mockPlayer = {
      id: playerId,
      userId: 'user-123',
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.PENDING,
      users: {
        id: 'user-123',
        email: 'player@example.com',
        firstName: 'Test',
        lastName: 'Player',
      },
    };

    const mockRejectedPlayer = {
      ...mockPlayer,
      verificationStatus: VerificationStatus.REJECTED,
      rejectionReason: dto.rejectionReason,
      verifiedById: rejectedById,
      verifiedAt: mockDate,
      clubs: null,
    };

    it('should successfully reject a PUBLIC player', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockRejectedPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await service.rejectPlayer(playerId, rejectedById, dto);

      expect(result).toEqual(mockRejectedPlayer);
      expect(mockTx.players.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          rejectionReason: dto.rejectionReason,
          verifiedById: rejectedById,
          verifiedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(
        service.rejectPlayer(playerId, rejectedById, dto),
      ).rejects.toThrow(new NotFoundException(`Player with ID ${playerId} not found`));
    });

    it('should throw BadRequestException if player is not PUBLIC type', async () => {
      const agencyPlayer = {
        ...mockPlayer,
        playerType: PlayerType.AGENCY,
      };
      prisma.players.findUnique.mockResolvedValue(agencyPlayer as any);

      await expect(
        service.rejectPlayer(playerId, rejectedById, dto),
      ).rejects.toThrow(
        new BadRequestException('Only PUBLIC players can be rejected through this endpoint'),
      );
    });

    it('should create audit log with rejection details', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockRejectedPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.rejectPlayer(playerId, rejectedById, dto);

      expect(mockTx.audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: rejectedById,
          action: 'PLAYER_REJECTED',
          entityType: 'Player',
          entityId: playerId,
          changes: {
            previousStatus: VerificationStatus.PENDING,
            newStatus: VerificationStatus.REJECTED,
            rejectionReason: dto.rejectionReason,
          },
        }),
      });
    });

    it('should send rejection notification to player', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockRejectedPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.rejectPlayer(playerId, rejectedById, dto);

      expect(notificationsService.sendToUser).toHaveBeenCalledWith({
        userId: mockPlayer.userId,
        title: 'Profile Review',
        body: `Your player profile has been reviewed. Reason: ${dto.rejectionReason}`,
        type: 'player_validation',
        data: {
          playerId: mockPlayer.id,
          action: 'rejected',
          reason: dto.rejectionReason,
        },
      });
    });

    it('should not throw if notification fails', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockRejectedPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });
      notificationsService.sendToUser.mockRejectedValue(new Error('Service error'));

      const result = await service.rejectPlayer(playerId, rejectedById, dto);

      expect(result).toEqual(mockRejectedPlayer);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('markAsSuspicious', () => {
    const playerId = 'player-123';
    const markedById = 'admin-456';
    const reason = 'Duplicate profile detected with different email';

    const mockPlayer = {
      id: playerId,
      userId: 'user-123',
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.PENDING,
      users: {
        id: 'user-123',
        email: 'suspicious@example.com',
      },
    };

    const mockSuspiciousPlayer = {
      ...mockPlayer,
      verificationStatus: VerificationStatus.SUSPICIOUS,
      rejectionReason: reason,
      verifiedById: markedById,
      verifiedAt: mockDate,
      clubs: null,
    };

    it('should successfully mark a player as suspicious', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockSuspiciousPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await service.markAsSuspicious(playerId, markedById, reason);

      expect(result).toEqual(mockSuspiciousPlayer);
      expect(mockTx.players.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: {
          verificationStatus: VerificationStatus.SUSPICIOUS,
          rejectionReason: reason,
          verifiedById: markedById,
          verifiedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(
        service.markAsSuspicious(playerId, markedById, reason),
      ).rejects.toThrow(new NotFoundException(`Player with ID ${playerId} not found`));
    });

    it('should create audit log with suspicious marker details', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockSuspiciousPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.markAsSuspicious(playerId, markedById, reason);

      expect(mockTx.audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: markedById,
          action: 'PLAYER_MARKED_SUSPICIOUS',
          entityType: 'Player',
          entityId: playerId,
          changes: {
            previousStatus: VerificationStatus.PENDING,
            newStatus: VerificationStatus.SUSPICIOUS,
            reason: reason,
          },
        }),
      });
    });

    it('should log warning when marking as suspicious', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockSuspiciousPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.markAsSuspicious(playerId, markedById, reason);

      expect(Logger.prototype.warn).toHaveBeenCalledWith(
        `Player ${playerId} marked as suspicious by user ${markedById}: ${reason}`,
      );
    });

    it('should work for players with any verification status', async () => {
      const verifiedPlayer = {
        ...mockPlayer,
        verificationStatus: VerificationStatus.VERIFIED,
      };
      prisma.players.findUnique.mockResolvedValue(verifiedPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockSuspiciousPlayer),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.markAsSuspicious(playerId, markedById, reason);

      expect(mockTx.audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          changes: {
            previousStatus: VerificationStatus.VERIFIED,
            newStatus: VerificationStatus.SUSPICIOUS,
            reason: reason,
          },
        }),
      });
    });
  });

  describe('convertToAgency', () => {
    const playerId = 'player-123';
    const convertedById = 'admin-456';
    const dto = { conversionNotes: 'Player signed with our agency' };

    const mockPlayer = {
      id: playerId,
      userId: 'user-123',
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.VERIFIED,
      users: {
        id: 'user-123',
        email: 'player@example.com',
        firstName: 'Test',
        lastName: 'Player',
        role: UserRole.PUBLIC,
      },
    };

    const mockConvertedPlayer = {
      ...mockPlayer,
      playerType: PlayerType.AGENCY,
      conversionNotes: dto.conversionNotes,
      clubs: null,
    };

    it('should successfully convert verified PUBLIC player to AGENCY', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockConvertedPlayer),
        },
        users: {
          update: jest.fn().mockResolvedValue({}),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await service.convertToAgency(playerId, convertedById, dto);

      expect(result).toEqual(mockConvertedPlayer);
      expect(mockTx.players.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: {
          playerType: PlayerType.AGENCY,
          conversionNotes: dto.conversionNotes,
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(
        service.convertToAgency(playerId, convertedById, dto),
      ).rejects.toThrow(new NotFoundException(`Player with ID ${playerId} not found`));
    });

    it('should throw BadRequestException if player is not PUBLIC type', async () => {
      const agencyPlayer = {
        ...mockPlayer,
        playerType: PlayerType.AGENCY,
      };
      prisma.players.findUnique.mockResolvedValue(agencyPlayer as any);

      await expect(
        service.convertToAgency(playerId, convertedById, dto),
      ).rejects.toThrow(
        new BadRequestException('Only PUBLIC players can be converted to AGENCY type'),
      );
    });

    it('should throw BadRequestException if player is not verified', async () => {
      const unverifiedPlayer = {
        ...mockPlayer,
        verificationStatus: VerificationStatus.PENDING,
      };
      prisma.players.findUnique.mockResolvedValue(unverifiedPlayer as any);

      await expect(
        service.convertToAgency(playerId, convertedById, dto),
      ).rejects.toThrow(
        new BadRequestException('Player must be verified before converting to AGENCY type'),
      );
    });

    it('should update user role from PUBLIC to PLAYER if currently PUBLIC', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockConvertedPlayer),
        },
        users: {
          update: jest.fn().mockResolvedValue({}),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.convertToAgency(playerId, convertedById, dto);

      expect(mockTx.users.update).toHaveBeenCalledWith({
        where: { id: mockPlayer.userId },
        data: {
          role: UserRole.PLAYER,
        },
      });
    });

    it('should not update user role if already PLAYER or higher', async () => {
      const playerWithPlayerRole = {
        ...mockPlayer,
        users: {
          ...mockPlayer.users,
          role: UserRole.PLAYER,
        },
      };
      prisma.players.findUnique.mockResolvedValue(playerWithPlayerRole as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockConvertedPlayer),
        },
        users: {
          update: jest.fn(),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.convertToAgency(playerId, convertedById, dto);

      expect(mockTx.users.update).not.toHaveBeenCalled();
    });

    it('should create audit log with conversion details', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockConvertedPlayer),
        },
        users: {
          update: jest.fn().mockResolvedValue({}),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.convertToAgency(playerId, convertedById, dto);

      expect(mockTx.audit_logs.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: convertedById,
          action: 'PLAYER_CONVERTED_TO_AGENCY',
          entityType: 'Player',
          entityId: playerId,
          changes: {
            previousType: PlayerType.PUBLIC,
            newType: PlayerType.AGENCY,
            notes: dto.conversionNotes,
          },
        }),
      });
    });

    it('should send conversion notification to player', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockConvertedPlayer),
        },
        users: {
          update: jest.fn().mockResolvedValue({}),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.convertToAgency(playerId, convertedById, dto);

      expect(notificationsService.sendToUser).toHaveBeenCalledWith({
        userId: mockPlayer.userId,
        title: 'Profile Upgraded',
        body: 'Your profile has been upgraded to Agency Player status. You now have access to premium features!',
        type: 'player_conversion',
        data: {
          playerId: mockPlayer.id,
          action: 'converted_to_agency',
          previousType: PlayerType.PUBLIC,
          newType: PlayerType.AGENCY,
        },
      });
    });

    it('should not throw if notification fails', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue(mockConvertedPlayer),
        },
        users: {
          update: jest.fn().mockResolvedValue({}),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });
      notificationsService.sendToUser.mockRejectedValue(new Error('Service error'));

      const result = await service.convertToAgency(playerId, convertedById, dto);

      expect(result).toEqual(mockConvertedPlayer);
      expect(Logger.prototype.error).toHaveBeenCalled();
    });

    it('should handle conversion without notes', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);

      const mockTx = {
        players: {
          update: jest.fn().mockResolvedValue({ ...mockConvertedPlayer, conversionNotes: null }),
        },
        users: {
          update: jest.fn().mockResolvedValue({}),
        },
        audit_logs: {
          create: jest.fn().mockResolvedValue({}),
        },
      };

      prisma.$transaction.mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      await service.convertToAgency(playerId, convertedById, {});

      expect(mockTx.players.update).toHaveBeenCalledWith({
        where: { id: playerId },
        data: {
          playerType: PlayerType.AGENCY,
          conversionNotes: null,
        },
        include: expect.any(Object),
      });
    });
  });

  describe('getVerificationStats', () => {
    it('should return comprehensive verification statistics', async () => {
      const mockCounts = [
        100, // totalPublicPlayers
        30,  // pendingCount
        50,  // verifiedCount
        15,  // rejectedCount
        5,   // suspiciousCount
        12,  // recentValidations
        3,   // recentRejections
      ];

      prisma.players.count
        .mockResolvedValueOnce(mockCounts[0])
        .mockResolvedValueOnce(mockCounts[1])
        .mockResolvedValueOnce(mockCounts[2])
        .mockResolvedValueOnce(mockCounts[3])
        .mockResolvedValueOnce(mockCounts[4])
        .mockResolvedValueOnce(mockCounts[5])
        .mockResolvedValueOnce(mockCounts[6]);

      const result = await service.getVerificationStats();

      expect(result).toEqual({
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
      });
    });

    it('should handle zero total players gracefully', async () => {
      prisma.players.count.mockResolvedValue(0);

      const result = await service.getVerificationStats();

      expect(result.totalPublicPlayers).toBe(0);
      expect(result.percentages.pending).toBe(0);
      expect(result.percentages.verified).toBe(0);
      expect(result.percentages.rejected).toBe(0);
      expect(result.percentages.suspicious).toBe(0);
    });

    it('should calculate percentages correctly', async () => {
      prisma.players.count
        .mockResolvedValueOnce(200) // total
        .mockResolvedValueOnce(50)  // pending (25%)
        .mockResolvedValueOnce(100) // verified (50%)
        .mockResolvedValueOnce(40)  // rejected (20%)
        .mockResolvedValueOnce(10)  // suspicious (5%)
        .mockResolvedValueOnce(20)  // recent validations
        .mockResolvedValueOnce(8);  // recent rejections

      const result = await service.getVerificationStats();

      expect(result.percentages.pending).toBe(25);
      expect(result.percentages.verified).toBe(50);
      expect(result.percentages.rejected).toBe(20);
      expect(result.percentages.suspicious).toBe(5);
    });

    it('should query recent activity with correct date range (30 days)', async () => {
      prisma.players.count.mockResolvedValue(0);

      await service.getVerificationStats();

      const calls = (prisma.players.count as jest.Mock).mock.calls;
      const recentValidationsCall = calls[5][0];
      const recentRejectionsCall = calls[6][0];

      expect(recentValidationsCall.where.verifiedAt.gte).toBeInstanceOf(Date);
      expect(recentRejectionsCall.where.verifiedAt.gte).toBeInstanceOf(Date);
    });
  });

  describe('getValidationHistory', () => {
    const playerId = 'player-123';

    const mockPlayer = {
      id: playerId,
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.VERIFIED,
      verifiedAt: new Date('2025-01-15'),
      verifiedById: 'admin-123',
      rejectionReason: null,
      conversionNotes: 'Verified through club',
    };

    const mockAuditLogs = [
      {
        id: 'log-1',
        userId: 'admin-123',
        action: 'PLAYER_VALIDATED',
        entityType: 'Player',
        entityId: playerId,
        changes: {
          previousStatus: VerificationStatus.PENDING,
          newStatus: VerificationStatus.VERIFIED,
          notes: 'Verified through club',
        },
        createdAt: new Date('2025-01-15T10:00:00Z'),
      },
      {
        id: 'log-2',
        userId: 'admin-456',
        action: 'PLAYER_CONVERTED_TO_AGENCY',
        entityType: 'Player',
        entityId: playerId,
        changes: {
          previousType: PlayerType.PUBLIC,
          newType: PlayerType.AGENCY,
        },
        createdAt: new Date('2025-01-16T10:00:00Z'),
      },
    ];

    it('should return player validation history', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.audit_logs.findMany.mockResolvedValue(mockAuditLogs as any);

      const result = await service.getValidationHistory(playerId);

      expect(result).toEqual({
        player: {
          id: mockPlayer.id,
          playerType: mockPlayer.playerType,
          verificationStatus: mockPlayer.verificationStatus,
          verifiedAt: mockPlayer.verifiedAt,
          verifiedById: mockPlayer.verifiedById,
          rejectionReason: mockPlayer.rejectionReason,
          conversionNotes: mockPlayer.conversionNotes,
        },
        history: mockAuditLogs,
      });
    });

    it('should throw NotFoundException if player does not exist', async () => {
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.getValidationHistory(playerId)).rejects.toThrow(
        new NotFoundException(`Player with ID ${playerId} not found`),
      );
    });

    it('should query audit logs with correct filters', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.audit_logs.findMany.mockResolvedValue(mockAuditLogs as any);

      await service.getValidationHistory(playerId);

      expect(prisma.audit_logs.findMany).toHaveBeenCalledWith({
        where: {
          entityType: 'Player',
          entityId: playerId,
          action: {
            in: [
              'PLAYER_VALIDATED',
              'PLAYER_REJECTED',
              'PLAYER_MARKED_SUSPICIOUS',
              'PLAYER_CONVERTED_TO_AGENCY',
            ],
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should return empty history if no audit logs found', async () => {
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.audit_logs.findMany.mockResolvedValue([]);

      const result = await service.getValidationHistory(playerId);

      expect(result.history).toEqual([]);
      expect(result.player).toBeDefined();
    });
  });

  describe('Transaction rollback scenarios', () => {
    it('should rollback validation if audit log creation fails', async () => {
      const playerId = 'player-123';
      const verifiedById = 'admin-456';

      const mockPlayer = {
        id: playerId,
        userId: 'user-123',
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.PENDING,
        users: { id: 'user-123', email: 'test@example.com' },
      };

      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.$transaction.mockRejectedValue(new Error('Audit log creation failed'));

      await expect(
        service.validatePlayer(playerId, verifiedById, { notes: 'Test' }),
      ).rejects.toThrow('Audit log creation failed');
    });

    it('should rollback rejection if transaction fails', async () => {
      const playerId = 'player-123';
      const rejectedById = 'admin-456';

      const mockPlayer = {
        id: playerId,
        userId: 'user-123',
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.PENDING,
        users: { id: 'user-123', email: 'test@example.com' },
      };

      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(
        service.rejectPlayer(playerId, rejectedById, { rejectionReason: 'Test' }),
      ).rejects.toThrow('Transaction failed');
    });

    it('should rollback conversion if user role update fails', async () => {
      const playerId = 'player-123';
      const convertedById = 'admin-456';

      const mockPlayer = {
        id: playerId,
        userId: 'user-123',
        playerType: PlayerType.PUBLIC,
        verificationStatus: VerificationStatus.VERIFIED,
        users: {
          id: 'user-123',
          email: 'test@example.com',
          role: UserRole.PUBLIC,
        },
      };

      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.$transaction.mockRejectedValue(new Error('User update failed'));

      await expect(
        service.convertToAgency(playerId, convertedById, { conversionNotes: 'Test' }),
      ).rejects.toThrow('User update failed');
    });
  });
});
