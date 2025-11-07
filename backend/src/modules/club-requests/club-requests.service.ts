import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClubRequestDto } from './dto/create-club-request.dto';
import { UpdateClubRequestDto } from './dto/update-club-request.dto';
import { ClubRequestStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class ClubRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(createClubRequestDto: CreateClubRequestDto) {
    // Vérifier que le club existe
    const club = await this.prisma.clubs.findUnique({
      where: { id: createClubRequestDto.clubId },
    });

    if (!club) {
      throw new NotFoundException(`Club avec l'ID ${createClubRequestDto.clubId} introuvable`);
    }

    // Vérifier que le joueur existe
    const player = await this.prisma.players.findUnique({
      where: { id: createClubRequestDto.playerId },
    });

    if (!player) {
      throw new NotFoundException(`Joueur avec l'ID ${createClubRequestDto.playerId} introuvable`);
    }

    // Vérifier qu'il n'existe pas déjà une demande en attente
    const existingRequest = await this.prisma.club_requests.findFirst({
      where: {
        clubId: createClubRequestDto.clubId,
        playerId: createClubRequestDto.playerId,
        status: ClubRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'Une demande en attente existe déjà pour ce joueur et ce club'
      );
    }

    const { clubId, playerId, ...requestData } = createClubRequestDto;

    return this.prisma.club_requests.create({
      data: {
        id: randomUUID(),
        ...requestData,
        updatedAt: new Date(),
        clubs: {
          connect: { id: clubId },
        },
        players: {
          connect: { id: playerId },
        },
      },
      include: {
        clubs: true,
        players: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(filters?: {
    clubId?: string;
    playerId?: string;
    status?: ClubRequestStatus;
  }) {
    return this.prisma.club_requests.findMany({
      where: {
        clubId: filters?.clubId,
        playerId: filters?.playerId,
        status: filters?.status,
      },
      include: {
        clubs: {
          select: {
            id: true,
            name: true,
            logo: true,
            country: true,
            city: true,
          },
        },
        players: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const request = await this.prisma.club_requests.findUnique({
      where: { id },
      include: {
        clubs: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        players: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatar: true,
              },
            },
            clubs: {
              select: {
                name: true,
                logo: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException(`Demande avec l'ID ${id} introuvable`);
    }

    return request;
  }

  async update(id: string, updateClubRequestDto: UpdateClubRequestDto) {
    const request = await this.findOne(id);

    // Vérifier les transitions de statut valides
    if (updateClubRequestDto.status) {
      this.validateStatusTransition(request.status, updateClubRequestDto.status);
    }

    const data: any = {
      ...updateClubRequestDto,
    };

    // Si le statut change vers ACCEPTED, REJECTED ou COMPLETED, ajouter respondedAt
    const terminalStatuses: ClubRequestStatus[] = [
      ClubRequestStatus.ACCEPTED,
      ClubRequestStatus.REJECTED,
      ClubRequestStatus.COMPLETED
    ];
    if (updateClubRequestDto.status && terminalStatuses.includes(updateClubRequestDto.status)) {
      data.respondedAt = new Date();
    }

    return this.prisma.club_requests.update({
      where: { id },
      data,
      include: {
        clubs: true,
        players: {
          include: {
            users: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findOne(id);

    return this.prisma.club_requests.delete({
      where: { id },
    });
  }

  async accept(id: string, message?: string) {
    return this.update(id, {
      status: ClubRequestStatus.ACCEPTED,
      message,
    });
  }

  async reject(id: string, message?: string) {
    return this.update(id, {
      status: ClubRequestStatus.REJECTED,
      message,
    });
  }

  async negotiate(id: string, offerAmount?: number, message?: string) {
    return this.update(id, {
      status: ClubRequestStatus.NEGOTIATING,
      offerAmount,
      message,
    });
  }

  async complete(id: string, message?: string) {
    return this.update(id, {
      status: ClubRequestStatus.COMPLETED,
      message,
    });
  }

  async getStatistics(clubId?: string) {
    const where = clubId ? { clubId } : {};

    const [
      total,
      pending,
      accepted,
      rejected,
      negotiating,
      completed,
    ] = await Promise.all([
      this.prisma.club_requests.count({ where }),
      this.prisma.club_requests.count({ where: { ...where, status: ClubRequestStatus.PENDING } }),
      this.prisma.club_requests.count({ where: { ...where, status: ClubRequestStatus.ACCEPTED } }),
      this.prisma.club_requests.count({ where: { ...where, status: ClubRequestStatus.REJECTED } }),
      this.prisma.club_requests.count({ where: { ...where, status: ClubRequestStatus.NEGOTIATING } }),
      this.prisma.club_requests.count({ where: { ...where, status: ClubRequestStatus.COMPLETED } }),
    ]);

    return {
      total,
      pending,
      accepted,
      rejected,
      negotiating,
      completed,
      successRate: total > 0 ? ((accepted + completed) / total) * 100 : 0,
    };
  }

  private validateStatusTransition(currentStatus: ClubRequestStatus, newStatus: ClubRequestStatus) {
    const validTransitions: Record<ClubRequestStatus, ClubRequestStatus[]> = {
      [ClubRequestStatus.PENDING]: [
        ClubRequestStatus.ACCEPTED,
        ClubRequestStatus.REJECTED,
        ClubRequestStatus.NEGOTIATING,
      ],
      [ClubRequestStatus.NEGOTIATING]: [
        ClubRequestStatus.ACCEPTED,
        ClubRequestStatus.REJECTED,
        ClubRequestStatus.PENDING,
      ],
      [ClubRequestStatus.ACCEPTED]: [ClubRequestStatus.COMPLETED, ClubRequestStatus.NEGOTIATING],
      [ClubRequestStatus.REJECTED]: [], // Terminal state
      [ClubRequestStatus.COMPLETED]: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Transition de statut invalide: ${currentStatus} -> ${newStatus}`
      );
    }
  }
}
