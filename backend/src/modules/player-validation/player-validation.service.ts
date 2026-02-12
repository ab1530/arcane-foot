import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PlayerType, VerificationStatus, UserRole, Prisma } from '@prisma/client';
import { ValidatePlayerDto, RejectPlayerDto, ConvertToAgencyDto } from './dto/validate-player.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PlayerValidationService {
  private readonly logger = new Logger(PlayerValidationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Get all PUBLIC players with PENDING verification status
   */
  async getPendingPlayers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: Prisma.playersWhereInput = {
      playerType: PlayerType.PUBLIC,
      verificationStatus: VerificationStatus.PENDING,
    };

    const [players, total] = await Promise.all([
      this.prisma.players.findMany({
        where,
        skip,
        take: limit,
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
      }),
      this.prisma.players.count({ where }),
    ]);

    return {
      data: players,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get players by verification status
   */
  async getPlayersByStatus(status: VerificationStatus, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const where: Prisma.playersWhereInput = {
      playerType: PlayerType.PUBLIC,
      verificationStatus: status,
    };

    const [players, total] = await Promise.all([
      this.prisma.players.findMany({
        where,
        skip,
        take: limit,
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
          updatedAt: 'desc',
        },
      }),
      this.prisma.players.count({ where }),
    ]);

    return {
      data: players,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Validate a player profile
   */
  async validatePlayer(playerId: string, verifiedById: string, dto: ValidatePlayerDto) {
    // Check if player exists
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Check if player is PUBLIC type
    if (player.playerType !== PlayerType.PUBLIC) {
      throw new BadRequestException('Only PUBLIC players can be validated through this endpoint');
    }

    // Check if already verified
    if (player.verificationStatus === VerificationStatus.VERIFIED) {
      throw new BadRequestException('Player is already verified');
    }

    // Update player status using transaction
    const updatedPlayer = await this.prisma.$transaction(async (tx) => {
      // Update player
      const updated = await tx.players.update({
        where: { id: playerId },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
          verifiedAt: new Date(),
          verifiedById,
          conversionNotes: dto.notes || null,
          rejectionReason: null, // Clear any previous rejection reason
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          clubs: true,
        },
      });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          id: randomUUID(),
          userId: verifiedById,
          action: 'PLAYER_VALIDATED',
          entityType: 'Player',
          entityId: playerId,
          changes: {
            previousStatus: player.verificationStatus,
            newStatus: VerificationStatus.VERIFIED,
            notes: dto.notes,
          },
        },
      });

      return updated;
    });

    // Send notification to player
    try {
      await this.notificationsService.sendToUser({
        userId: player.userId,
        title: 'Profile Verified',
        body: 'Congratulations! Your player profile has been verified by our team.',
        type: 'player_validation',
        data: {
          playerId: player.id,
          action: 'verified',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${player.userId}: ${error.message}`);
      // Don't throw error - notification failure shouldn't stop the validation
    }

    this.logger.log(`Player ${playerId} validated by user ${verifiedById}`);

    return updatedPlayer;
  }

  /**
   * Reject a player profile
   */
  async rejectPlayer(playerId: string, rejectedById: string, dto: RejectPlayerDto) {
    // Check if player exists
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Check if player is PUBLIC type
    if (player.playerType !== PlayerType.PUBLIC) {
      throw new BadRequestException('Only PUBLIC players can be rejected through this endpoint');
    }

    // Update player status using transaction
    const updatedPlayer = await this.prisma.$transaction(async (tx) => {
      // Update player
      const updated = await tx.players.update({
        where: { id: playerId },
        data: {
          verificationStatus: VerificationStatus.REJECTED,
          rejectionReason: dto.rejectionReason,
          verifiedById: rejectedById,
          verifiedAt: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          clubs: true,
        },
      });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          id: randomUUID(),
          userId: rejectedById,
          action: 'PLAYER_REJECTED',
          entityType: 'Player',
          entityId: playerId,
          changes: {
            previousStatus: player.verificationStatus,
            newStatus: VerificationStatus.REJECTED,
            rejectionReason: dto.rejectionReason,
          },
        },
      });

      return updated;
    });

    // Send notification to player
    try {
      await this.notificationsService.sendToUser({
        userId: player.userId,
        title: 'Profile Review',
        body: `Your player profile has been reviewed. Reason: ${dto.rejectionReason}`,
        type: 'player_validation',
        data: {
          playerId: player.id,
          action: 'rejected',
          reason: dto.rejectionReason,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${player.userId}: ${error.message}`);
    }

    this.logger.log(`Player ${playerId} rejected by user ${rejectedById}`);

    return updatedPlayer;
  }

  /**
   * Mark player as suspicious
   */
  async markAsSuspicious(playerId: string, markedById: string, reason: string) {
    // Check if player exists
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Update player status using transaction
    const updatedPlayer = await this.prisma.$transaction(async (tx) => {
      // Update player
      const updated = await tx.players.update({
        where: { id: playerId },
        data: {
          verificationStatus: VerificationStatus.SUSPICIOUS,
          rejectionReason: reason,
          verifiedById: markedById,
          verifiedAt: new Date(),
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          clubs: true,
        },
      });

      // Create audit log
      await tx.audit_logs.create({
        data: {
          id: randomUUID(),
          userId: markedById,
          action: 'PLAYER_MARKED_SUSPICIOUS',
          entityType: 'Player',
          entityId: playerId,
          changes: {
            previousStatus: player.verificationStatus,
            newStatus: VerificationStatus.SUSPICIOUS,
            reason: reason,
          },
        },
      });

      return updated;
    });

    this.logger.warn(`Player ${playerId} marked as suspicious by user ${markedById}: ${reason}`);

    return updatedPlayer;
  }

  /**
   * Convert PUBLIC player to AGENCY type
   */
  async convertToAgency(playerId: string, convertedById: string, dto: ConvertToAgencyDto) {
    // Check if player exists
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
      include: {
        users: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Check if player is PUBLIC type
    if (player.playerType !== PlayerType.PUBLIC) {
      throw new BadRequestException('Only PUBLIC players can be converted to AGENCY type');
    }

    // Check if player is verified
    if (player.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new BadRequestException('Player must be verified before converting to AGENCY type');
    }

    // Convert player using transaction
    const convertedPlayer = await this.prisma.$transaction(async (tx) => {
      // Update player type
      const updated = await tx.players.update({
        where: { id: playerId },
        data: {
          playerType: PlayerType.AGENCY,
          conversionNotes: dto.conversionNotes || null,
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          clubs: true,
        },
      });

      // Update user role if still PUBLIC
      if (player.users.role === UserRole.PUBLIC) {
        await tx.users.update({
          where: { id: player.userId },
          data: {
            role: UserRole.PLAYER,
          },
        });
      }

      // Create audit log
      await tx.audit_logs.create({
        data: {
          id: randomUUID(),
          userId: convertedById,
          action: 'PLAYER_CONVERTED_TO_AGENCY',
          entityType: 'Player',
          entityId: playerId,
          changes: {
            previousType: PlayerType.PUBLIC,
            newType: PlayerType.AGENCY,
            notes: dto.conversionNotes,
          },
        },
      });

      return updated;
    });

    // Send notification to player
    try {
      await this.notificationsService.sendToUser({
        userId: player.userId,
        title: 'Profile Upgraded',
        body: 'Your profile has been upgraded to Agency Player status. You now have access to premium features!',
        type: 'player_conversion',
        data: {
          playerId: player.id,
          action: 'converted_to_agency',
          previousType: PlayerType.PUBLIC,
          newType: PlayerType.AGENCY,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${player.userId}: ${error.message}`);
    }

    this.logger.log(`Player ${playerId} converted to AGENCY by user ${convertedById}`);

    return convertedPlayer;
  }

  /**
   * Get verification statistics
   */
  async getVerificationStats() {
    const [
      totalPublicPlayers,
      pendingCount,
      verifiedCount,
      rejectedCount,
      suspiciousCount,
      recentValidations,
      recentRejections,
    ] = await Promise.all([
      // Total PUBLIC players
      this.prisma.players.count({
        where: {
          playerType: PlayerType.PUBLIC,
        },
      }),

      // Pending count
      this.prisma.players.count({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.PENDING,
        },
      }),

      // Verified count
      this.prisma.players.count({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      }),

      // Rejected count
      this.prisma.players.count({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.REJECTED,
        },
      }),

      // Suspicious count
      this.prisma.players.count({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.SUSPICIOUS,
        },
      }),

      // Recent validations (last 30 days)
      this.prisma.players.count({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.VERIFIED,
          verifiedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Recent rejections (last 30 days)
      this.prisma.players.count({
        where: {
          playerType: PlayerType.PUBLIC,
          verificationStatus: VerificationStatus.REJECTED,
          verifiedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      totalPublicPlayers,
      statusBreakdown: {
        pending: pendingCount,
        verified: verifiedCount,
        rejected: rejectedCount,
        suspicious: suspiciousCount,
      },
      percentages: {
        pending: totalPublicPlayers > 0 ? (pendingCount / totalPublicPlayers) * 100 : 0,
        verified: totalPublicPlayers > 0 ? (verifiedCount / totalPublicPlayers) * 100 : 0,
        rejected: totalPublicPlayers > 0 ? (rejectedCount / totalPublicPlayers) * 100 : 0,
        suspicious: totalPublicPlayers > 0 ? (suspiciousCount / totalPublicPlayers) * 100 : 0,
      },
      recentActivity: {
        validationsLast30Days: recentValidations,
        rejectionsLast30Days: recentRejections,
      },
    };
  }

  /**
   * Get player validation history
   */
  async getValidationHistory(playerId: string) {
    const player = await this.prisma.players.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException(`Player with ID ${playerId} not found`);
    }

    // Get audit logs for this player
    const auditLogs = await this.prisma.audit_logs.findMany({
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

    return {
      player: {
        id: player.id,
        playerType: player.playerType,
        verificationStatus: player.verificationStatus,
        verifiedAt: player.verifiedAt,
        verifiedById: player.verifiedById,
        rejectionReason: player.rejectionReason,
        conversionNotes: player.conversionNotes,
      },
      history: auditLogs,
    };
  }
}
