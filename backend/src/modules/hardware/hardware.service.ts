import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHardwareSessionDto } from './dto/create-hardware-session.dto';
import { GetHardwareSessionDto, HardwareSessionPlayerDto } from './dto/get-hardware-session.dto';

@Injectable()
export class HardwareService {
  private readonly logger = new Logger(HardwareService.name);

  private readonly sessionInclude = {
    players: {
      include: {
        users: true,
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  async createSession(dto: CreateHardwareSessionDto, user: any): Promise<GetHardwareSessionDto> {
    const playerId = await this.resolvePlayerForWrite(user, dto.playerId);

    const startedAt = new Date(dto.startedAt);
    const endedAt = new Date(dto.endedAt);

    if (Number.isNaN(startedAt.getTime()) || Number.isNaN(endedAt.getTime())) {
      throw new BadRequestException('Invalid date provided for session');
    }

    if (endedAt <= startedAt) {
      throw new BadRequestException('endedAt must be after startedAt');
    }

    const metrics = dto.metrics || {};
    const totalTimeMin = this.computeDurationMinutes(metrics.totalTimeMin, startedAt, endedAt);

    const session = await this.prisma.hardwareSession.create({
      data: {
        id: randomUUID(),
        playerId,
        deviceId: dto.deviceId,
        source: dto.source,
        type: dto.type.toLowerCase(),
        startedAt,
        endedAt,
        totalTimeMin,
        movementDistanceM: metrics.movementDistanceM,
        sprintDistanceM: metrics.sprintDistanceM,
        offenseDefenseRatio: metrics.offenseDefenseRatio,
        avgSpeedKmh: metrics.avgSpeedKmh,
        maxSpeedKmh: metrics.maxSpeedKmh,
        sprintTimeS: metrics.sprintTimeS,
        sprintCount: metrics.sprintCount,
        caloriesBurned: metrics.caloriesBurned,
        maxAccelerationG: metrics.maxAccelerationG,
        maxDecelerationG: metrics.maxDecelerationG,
        accelerationCount: metrics.accelerationCount,
        reductionStepsCount: metrics.reductionStepsCount,
        thermalTrajectoryMap: metrics.thermalTrajectoryMap,
        sprintVectorData: metrics.sprintVectorData,
        motionTrajectoryData: metrics.motionTrajectoryData,
        qualitySixDimensional: metrics.qualitySixDimensional,
        rawMetrics: metrics.rawMetrics,
        normalizedMetrics: metrics.normalizedMetrics,
        updatedAt: new Date(),
      },
      include: this.sessionInclude,
    });

    this.logger.debug(`Created hardware session ${session.id} for player ${session.playerId}`);
    return this.mapSession(session);
  }

  async getSessionsByPlayer(playerId: string, user: any): Promise<GetHardwareSessionDto[]> {
    await this.assertReadable(user, playerId);

    const sessions = await this.prisma.hardwareSession.findMany({
      where: { playerId },
      orderBy: { startedAt: 'desc' },
      include: this.sessionInclude,
    });

    if (sessions.length === 0) {
      const playerExists = await this.prisma.players.findUnique({
        where: { id: playerId },
        select: { id: true },
      });

      if (!playerExists) {
        throw new NotFoundException('Player not found');
      }
    }

    return sessions.map((session) => this.mapSession(session));
  }

  async getSessionById(sessionId: string, user: any): Promise<GetHardwareSessionDto> {
    const session = await this.prisma.hardwareSession.findUnique({
      where: { id: sessionId },
      include: this.sessionInclude,
    });

    if (!session) {
      throw new NotFoundException('Hardware session not found');
    }

    await this.assertReadable(user, session.playerId);

    return this.mapSession(session);
  }

  async deleteSession(sessionId: string, user: any): Promise<void> {
    const session = await this.prisma.hardwareSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Hardware session not found');
    }

    await this.assertReadable(user, session.playerId);

    await this.prisma.hardwareSession.delete({ where: { id: sessionId } });
    this.logger.debug(`Deleted hardware session ${sessionId} for player ${session.playerId}`);
  }

  private computeDurationMinutes(
    provided: number | undefined,
    startedAt: Date,
    endedAt: Date,
  ): number {
    if (provided !== undefined && provided !== null) {
      return provided;
    }

    const minutes = (endedAt.getTime() - startedAt.getTime()) / 1000 / 60;
    return Math.round(minutes * 100) / 100;
  }

  private async resolvePlayerForWrite(user: any, requestedPlayerId?: string): Promise<string> {
    // Player: always force to own profile; ignore/override body playerId
    if (user && user.role === 'PLAYER') {
      const player = await this.prisma.players.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });

      if (!player) {
        throw new BadRequestException('No player profile associated with this account');
      }
      return player.id;
    }

    // Non-player roles: allow explicit playerId when present
    if (requestedPlayerId) {
      const exists = await this.prisma.players.findUnique({
        where: { id: requestedPlayerId },
        select: { id: true },
      });
      if (!exists) {
        throw new BadRequestException('Player not found');
      }
      return requestedPlayerId;
    }

    throw new ForbiddenException('Player ID is required to create hardware sessions');
  }

  private async assertReadable(user: any, playerId: string) {
    if (!user || user.role !== 'PLAYER') {
      return;
    }

    const player = await this.prisma.players.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!player) {
      throw new BadRequestException('No player profile associated with this account');
    }

    if (player.id !== playerId) {
      throw new ForbiddenException('Players can only access their own hardware sessions');
    }
  }

  private mapSession(session: any): GetHardwareSessionDto {
    const metrics = {
      movementDistanceM: session.movementDistanceM,
      sprintDistanceM: session.sprintDistanceM,
      offenseDefenseRatio: session.offenseDefenseRatio,
      avgSpeedKmh: session.avgSpeedKmh,
      maxSpeedKmh: session.maxSpeedKmh,
      sprintTimeS: session.sprintTimeS,
      sprintCount: session.sprintCount,
      totalTimeMin: session.totalTimeMin,
      caloriesBurned: session.caloriesBurned,
      maxAccelerationG: session.maxAccelerationG,
      maxDecelerationG: session.maxDecelerationG,
      accelerationCount: session.accelerationCount,
      reductionStepsCount: session.reductionStepsCount,
      thermalTrajectoryMap: session.thermalTrajectoryMap,
      sprintVectorData: session.sprintVectorData,
      motionTrajectoryData: session.motionTrajectoryData,
      qualitySixDimensional: session.qualitySixDimensional,
      rawMetrics: session.rawMetrics,
      normalizedMetrics: session.normalizedMetrics,
    };

    let player: HardwareSessionPlayerDto | undefined;
    if (session.players) {
      player = {
        id: session.players.id,
        firstName: session.players.users?.firstName || '',
        lastName: session.players.users?.lastName || '',
        clubId: session.players.clubId || session.players.clubs?.id || null,
        clubName: session.players.clubs?.name || null,
        clubLogo: session.players.clubs?.logo || null,
      };
    }

    return {
      id: session.id,
      playerId: session.playerId,
      player,
      deviceId: session.deviceId,
      source: session.source,
      type: session.type,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      metrics,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
