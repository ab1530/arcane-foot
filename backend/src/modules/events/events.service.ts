import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto, createdById: string) {
    const { assignedUserIds, ...eventData } = createEventDto;

    // Validation des dates
    if (new Date(eventData.startDate) >= new Date(eventData.endDate)) {
      throw new BadRequestException(
        'La date de début doit être antérieure à la date de fin',
      );
    }

    // Vérifier que le match existe si matchId est fourni
    if (eventData.matchId) {
      const match = await this.prisma.matches.findUnique({
        where: { id: eventData.matchId },
      });
      if (!match) {
        throw new NotFoundException(`Match avec l'ID ${eventData.matchId} introuvable`);
      }
    }

    // Créer l'événement avec les assignations
    const event = await this.prisma.events.create({
      data: {
        id: randomUUID(),
        title: eventData.title,
        description: eventData.description,
        type: eventData.type,
        status: eventData.status,
        startDate: new Date(eventData.startDate),
        endDate: new Date(eventData.endDate),
        location: eventData.location,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        matchId: eventData.matchId,
        createdById,
        updatedAt: new Date(),
        event_assignments: assignedUserIds
          ? {
              create: assignedUserIds.map((userId) => ({
                id: randomUUID(),
                userId,
              })),
            }
          : undefined,
      },
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
        event_assignments: {
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
          },
        },
        matches: {
          include: {
            clubs_matches_homeClubIdToclubs: true,
            clubs_matches_awayClubIdToclubs: true,
          },
        },
      },
    });

    return event;
  }

  async findAll(query: QueryEventDto) {
    const { type, status, startDate, endDate, assignedUserId, matchId } = query;

    const where: any = {};

    if (type) where.type = type;
    if (status) where.status = status;
    if (matchId) where.matchId = matchId;

    // Filtre par plage de dates
    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) where.startDate.gte = new Date(startDate);
      if (endDate) where.startDate.lte = new Date(endDate);
    }

    // Filtre par utilisateur assigné
    if (assignedUserId) {
      where.event_assignments = {
        some: {
          userId: assignedUserId,
        },
      };
    }

    const events = await this.prisma.events.findMany({
      where,
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
        event_assignments: {
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
          },
        },
        matches: {
          include: {
            clubs_matches_homeClubIdToclubs: true,
            clubs_matches_awayClubIdToclubs: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return events;
  }

  async findOne(id: string) {
    const event = await this.prisma.events.findUnique({
      where: { id },
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
        event_assignments: {
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
          },
        },
        matches: {
          include: {
            clubs_matches_homeClubIdToclubs: true,
            clubs_matches_awayClubIdToclubs: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundException(`Événement avec l'ID ${id} introuvable`);
    }

    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const { assignedUserIds, ...eventData } = updateEventDto;

    // Vérifier que l'événement existe
    await this.findOne(id);

    // Validation des dates si modifiées
    if (eventData.startDate || eventData.endDate) {
      const event = await this.prisma.events.findUnique({ where: { id } });
      const newStartDate = eventData.startDate
        ? new Date(eventData.startDate)
        : new Date(event.startDate);
      const newEndDate = eventData.endDate
        ? new Date(eventData.endDate)
        : new Date(event.endDate);

      if (newStartDate >= newEndDate) {
        throw new BadRequestException(
          'La date de début doit être antérieure à la date de fin',
        );
      }
    }

    // Mettre à jour l'événement
    const updateData: any = { updatedAt: new Date() };
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.type !== undefined) updateData.type = eventData.type;
    if (eventData.status !== undefined) updateData.status = eventData.status;
    if (eventData.startDate !== undefined) updateData.startDate = new Date(eventData.startDate);
    if (eventData.endDate !== undefined) updateData.endDate = new Date(eventData.endDate);
    if (eventData.location !== undefined) updateData.location = eventData.location;
    if (eventData.latitude !== undefined) updateData.latitude = eventData.latitude;
    if (eventData.longitude !== undefined) updateData.longitude = eventData.longitude;
    if (eventData.matchId !== undefined) updateData.matchId = eventData.matchId;

    if (assignedUserIds) {
      updateData.event_assignments = {
        deleteMany: {},
        create: assignedUserIds.map((userId) => ({
          id: randomUUID(),
          userId,
        })),
      };
    }

    const updated = await this.prisma.events.update({
      where: { id },
      data: updateData,
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
        event_assignments: {
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
          },
        },
        matches: {
          include: {
            clubs_matches_homeClubIdToclubs: true,
            clubs_matches_awayClubIdToclubs: true,
          },
        },
      },
    });

    return updated;
  }

  async remove(id: string) {
    // Vérifier que l'événement existe
    await this.findOne(id);

    await this.prisma.events.delete({
      where: { id },
    });

    return { message: 'Événement supprimé avec succès' };
  }

  // Méthode utilitaire pour obtenir les événements d'un utilisateur
  async findUserEvents(userId: string, query: QueryEventDto) {
    return this.findAll({
      ...query,
      assignedUserId: userId,
    });
  }

  // Méthode pour obtenir les événements à venir
  async findUpcoming(limit = 10) {
    const now = new Date();

    const events = await this.prisma.events.findMany({
      where: {
        startDate: {
          gte: now,
        },
        status: {
          in: ['PLANNED', 'CONFIRMED'],
        },
      },
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
        event_assignments: {
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
          },
        },
        matches: {
          include: {
            clubs_matches_homeClubIdToclubs: true,
            clubs_matches_awayClubIdToclubs: true,
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      take: limit,
    });

    return events;
  }
}
