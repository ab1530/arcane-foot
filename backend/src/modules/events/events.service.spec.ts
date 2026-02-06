import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { EventType, EventStatus } from '@prisma/client';

describe('EventsService', () => {
  let service: EventsService;
  let prisma: any;

  const mockUserId = 'user-123';
  const mockEventId = 'event-123';
  const mockMatchId = 'match-123';

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'SCOUT',
  };

  const mockMatch = {
    id: mockMatchId,
    homeClubId: 'club-1',
    awayClubId: 'club-2',
    date: new Date('2025-01-15'),
    clubs_matches_homeClubIdToclubs: {
      id: 'club-1',
      name: 'Home Club',
    },
    clubs_matches_awayClubIdToclubs: {
      id: 'club-2',
      name: 'Away Club',
    },
  };

  const mockEvent = {
    id: mockEventId,
    title: 'Match Scouting',
    description: 'Scouting event for the match',
    type: EventType.MATCH,
    status: EventStatus.PLANNED,
    startDate: new Date('2025-01-15T10:00:00Z'),
    endDate: new Date('2025-01-15T12:00:00Z'),
    location: 'Stadium A',
    latitude: 48.8566,
    longitude: 2.3522,
    matchId: mockMatchId,
    createdById: mockUserId,
    updatedAt: new Date(),
    users: mockUser,
    event_assignments: [
      {
        id: 'assignment-1',
        userId: mockUserId,
        users: mockUser,
      },
    ],
    matches: mockMatch,
  };

  beforeEach(async () => {
    const mockPrismaService = {
      events: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      matches: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });
  });

  describe('create', () => {
    const validCreateDto: CreateEventDto = {
      title: 'Match Scouting',
      description: 'Scouting event for the match',
      type: EventType.MATCH,
      status: EventStatus.PLANNED,
      startDate: '2025-01-15T10:00:00Z',
      endDate: '2025-01-15T12:00:00Z',
      location: 'Stadium A',
      latitude: 48.8566,
      longitude: 2.3522,
      matchId: mockMatchId,
      assignedUserIds: [mockUserId],
    };

    it('should create an event successfully', async () => {
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        matches: mockMatch,
      } as any);

      const result = await service.create(validCreateDto, mockUserId);

      expect(result).toBeDefined();
      expect(prisma.matches.findUnique).toHaveBeenCalledWith({
        where: { id: mockMatchId },
      });
      expect(prisma.events.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: validCreateDto.title,
            type: validCreateDto.type,
            status: validCreateDto.status,
            createdById: mockUserId,
          }),
          include: expect.any(Object),
        }),
      );
    });

    it('should create event without matchId', async () => {
      const dtoWithoutMatch = { ...validCreateDto, matchId: undefined };
      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        matchId: null,
        matches: null,
      } as any);

      const result = await service.create(dtoWithoutMatch, mockUserId);

      expect(result).toBeDefined();
      expect(prisma.matches.findUnique).not.toHaveBeenCalled();
    });

    it('should create event without assignedUserIds', async () => {
      const dtoWithoutUsers = { ...validCreateDto, assignedUserIds: undefined };
      prisma.matches.findUnique.mockResolvedValue(mockMatch as any);
      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        event_assignments: [],
        matches: mockMatch,
      } as any);

      const result = await service.create(dtoWithoutUsers, mockUserId);

      expect(result).toBeDefined();
      expect(result.event_assignments).toEqual([]);
    });

    it('should throw BadRequestException when start date is after end date', async () => {
      const invalidDto = {
        ...validCreateDto,
        startDate: '2025-01-15T12:00:00Z',
        endDate: '2025-01-15T10:00:00Z',
      };

      await expect(service.create(invalidDto, mockUserId)).rejects.toThrow(BadRequestException);
      await expect(service.create(invalidDto, mockUserId)).rejects.toThrow(
        'La date de début doit être antérieure à la date de fin',
      );
    });

    it('should throw BadRequestException when start date equals end date', async () => {
      const invalidDto = {
        ...validCreateDto,
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T10:00:00Z',
      };

      await expect(service.create(invalidDto, mockUserId)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when match does not exist', async () => {
      prisma.matches.findUnique.mockResolvedValue(null);

      await expect(service.create(validCreateDto, mockUserId)).rejects.toThrow(NotFoundException);
      await expect(service.create(validCreateDto, mockUserId)).rejects.toThrow(
        `Match avec l'ID ${mockMatchId} introuvable`,
      );
    });

    it('should create event with all event types', async () => {
      const eventTypes = [
        EventType.MATCH,
        EventType.TRAINING,
        EventType.MEETING,
        EventType.CAMP,
        EventType.OTHER,
      ];

      for (const type of eventTypes) {
        const dto = { ...validCreateDto, type, matchId: undefined };
        prisma.events.create.mockResolvedValue({
          ...mockEvent,
          type,
          matchId: null,
          matches: null,
        } as any);

        const result = await service.create(dto, mockUserId);

        expect(result.type).toBe(type);
      }
    });

    it('should create event with all event statuses', async () => {
      const eventStatuses = [
        EventStatus.PLANNED,
        EventStatus.CONFIRMED,
        EventStatus.COMPLETED,
        EventStatus.CANCELLED,
      ];

      for (const status of eventStatuses) {
        const dto = { ...validCreateDto, status, matchId: undefined };
        prisma.events.create.mockResolvedValue({
          ...mockEvent,
          status,
        } as any);

        const result = await service.create(dto, mockUserId);

        expect(result.status).toBe(status);
      }
    });

    it('should create event with location coordinates', async () => {
      prisma.events.create.mockResolvedValue(mockEvent as any);

      const result = await service.create({ ...validCreateDto, matchId: undefined }, mockUserId);

      expect(result.latitude).toBe(48.8566);
      expect(result.longitude).toBe(2.3522);
    });

    it('should create event without location coordinates', async () => {
      const dtoWithoutCoords = {
        ...validCreateDto,
        latitude: undefined,
        longitude: undefined,
        matchId: undefined,
      };
      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        latitude: null,
        longitude: null,
      } as any);

      const result = await service.create(dtoWithoutCoords, mockUserId);

      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });

    it('should create event with multiple assigned users', async () => {
      const multipleUsers = ['user-1', 'user-2', 'user-3'];
      const dtoWithMultipleUsers = {
        ...validCreateDto,
        assignedUserIds: multipleUsers,
        matchId: undefined,
      };
      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        event_assignments: multipleUsers.map((userId, idx) => ({
          id: `assignment-${idx}`,
          userId,
          users: { ...mockUser, id: userId },
        })),
      } as any);

      const result = await service.create(dtoWithMultipleUsers, mockUserId);

      expect(result.event_assignments).toHaveLength(3);
    });
  });

  describe('findAll', () => {
    const mockEvents = [mockEvent];

    it('should return all events without filters', async () => {
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll({});

      expect(result).toEqual(mockEvents);
      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { startDate: 'asc' },
        }),
      );
    });

    it('should filter events by type', async () => {
      const query: QueryEventDto = { type: EventType.MATCH };
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { type: EventType.MATCH },
        }),
      );
    });

    it('should filter events by status', async () => {
      const query: QueryEventDto = { status: EventStatus.PLANNED };
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: EventStatus.PLANNED },
        }),
      );
    });

    it('should filter events by matchId', async () => {
      const query: QueryEventDto = { matchId: mockMatchId };
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { matchId: mockMatchId },
        }),
      );
    });

    it('should filter events by startDate', async () => {
      const query: QueryEventDto = { startDate: '2025-01-01T00:00:00Z' };
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll(query);

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            startDate: {
              gte: new Date('2025-01-01T00:00:00Z'),
            },
          },
        }),
      );
    });

    it('should filter events by endDate', async () => {
      const query: QueryEventDto = { endDate: '2025-12-31T23:59:59Z' };
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll(query);

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            startDate: {
              lte: new Date('2025-12-31T23:59:59Z'),
            },
          },
        }),
      );
    });

    it('should filter events by date range', async () => {
      const query: QueryEventDto = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      };
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll(query);

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            startDate: {
              gte: new Date('2025-01-01T00:00:00Z'),
              lte: new Date('2025-12-31T23:59:59Z'),
            },
          },
        }),
      );
    });

    it('should filter events by assignedUserId', async () => {
      const query: QueryEventDto = { assignedUserId: mockUserId };
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll(query);

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            event_assignments: {
              some: {
                userId: mockUserId,
              },
            },
          },
        }),
      );
    });

    it('should filter events with multiple criteria', async () => {
      const query: QueryEventDto = {
        type: EventType.MATCH,
        status: EventStatus.PLANNED,
        startDate: '2025-01-01T00:00:00Z',
        assignedUserId: mockUserId,
      };
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findAll(query);

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: EventType.MATCH,
            status: EventStatus.PLANNED,
            startDate: {
              gte: new Date('2025-01-01T00:00:00Z'),
            },
            event_assignments: {
              some: {
                userId: mockUserId,
              },
            },
          },
        }),
      );
    });

    it('should include all relations', async () => {
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      await service.findAll({});

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            users: expect.any(Object),
            event_assignments: expect.any(Object),
            matches: expect.any(Object),
          },
        }),
      );
    });

    it('should order events by startDate ascending', async () => {
      const events = [
        { ...mockEvent, startDate: new Date('2025-01-20') },
        { ...mockEvent, startDate: new Date('2025-01-10') },
        { ...mockEvent, startDate: new Date('2025-01-15') },
      ];
      prisma.events.findMany.mockResolvedValue(events as any);

      await service.findAll({});

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startDate: 'asc' },
        }),
      );
    });

    it('should return empty array when no events match', async () => {
      prisma.events.findMany.mockResolvedValue([]);

      const result = await service.findAll({ type: EventType.TRAINING });

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return event by id', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);

      const result = await service.findOne(mockEventId);

      expect(result).toEqual(mockEvent);
      expect(prisma.events.findUnique).toHaveBeenCalledWith({
        where: { id: mockEventId },
        include: expect.any(Object),
      });
    });

    it('should include all relations', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);

      await service.findOne(mockEventId);

      expect(prisma.events.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            users: expect.any(Object),
            event_assignments: expect.any(Object),
            matches: expect.any(Object),
          },
        }),
      );
    });

    it('should throw NotFoundException when event does not exist', async () => {
      prisma.events.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        `Événement avec l'ID non-existent-id introuvable`,
      );
    });
  });

  describe('update', () => {
    const updateDto: UpdateEventDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should update event successfully', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        ...updateDto,
      } as any);

      const result = await service.update(mockEventId, updateDto);

      expect(result.title).toBe(updateDto.title);
      expect(result.description).toBe(updateDto.description);
      expect(prisma.events.update).toHaveBeenCalled();
    });

    it('should update event title only', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        title: 'New Title',
      } as any);

      const result = await service.update(mockEventId, { title: 'New Title' });

      expect(result.title).toBe('New Title');
    });

    it('should update event type', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        type: EventType.TRAINING,
      } as any);

      const result = await service.update(mockEventId, {
        type: EventType.TRAINING,
      });

      expect(result.type).toBe(EventType.TRAINING);
    });

    it('should update event status', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        status: EventStatus.COMPLETED,
      } as any);

      const result = await service.update(mockEventId, {
        status: EventStatus.COMPLETED,
      });

      expect(result.status).toBe(EventStatus.COMPLETED);
    });

    it('should update event dates', async () => {
      const newDates = {
        startDate: '2025-01-20T10:00:00Z',
        endDate: '2025-01-20T12:00:00Z',
      };
      prisma.events.findUnique
        .mockResolvedValueOnce(mockEvent as any)
        .mockResolvedValueOnce(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        startDate: new Date(newDates.startDate),
        endDate: new Date(newDates.endDate),
      } as any);

      const result = await service.update(mockEventId, newDates);

      expect(result.startDate).toEqual(new Date(newDates.startDate));
      expect(result.endDate).toEqual(new Date(newDates.endDate));
    });

    it('should update location', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        location: 'New Stadium',
      } as any);

      const result = await service.update(mockEventId, {
        location: 'New Stadium',
      });

      expect(result.location).toBe('New Stadium');
    });

    it('should update coordinates', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        latitude: 40.4168,
        longitude: -3.7038,
      } as any);

      const result = await service.update(mockEventId, {
        latitude: 40.4168,
        longitude: -3.7038,
      });

      expect(result.latitude).toBe(40.4168);
      expect(result.longitude).toBe(-3.7038);
    });

    it('should update assigned users', async () => {
      const newUserIds = ['user-2', 'user-3'];
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        event_assignments: newUserIds.map((userId, idx) => ({
          id: `assignment-${idx}`,
          userId,
          users: { ...mockUser, id: userId },
        })),
      } as any);

      const result = await service.update(mockEventId, {
        assignedUserIds: newUserIds,
      });

      expect(result.event_assignments).toHaveLength(2);
    });

    it('should throw NotFoundException when event does not exist', async () => {
      prisma.events.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when updating with invalid dates', async () => {
      const invalidDates = {
        startDate: '2025-01-20T12:00:00Z',
        endDate: '2025-01-20T10:00:00Z',
      };
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);

      await expect(service.update(mockEventId, invalidDates)).rejects.toThrow(BadRequestException);
    });

    it('should validate dates when updating only startDate', async () => {
      const eventWithLaterEnd = {
        ...mockEvent,
        endDate: new Date('2025-01-15T20:00:00Z'),
      };
      prisma.events.findUnique
        .mockResolvedValueOnce(eventWithLaterEnd as any)
        .mockResolvedValueOnce(eventWithLaterEnd as any);
      prisma.events.update.mockResolvedValue(eventWithLaterEnd as any);

      await expect(
        service.update(mockEventId, {
          startDate: '2025-01-15T21:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate dates when updating only endDate', async () => {
      const eventWithEarlierStart = {
        ...mockEvent,
        startDate: new Date('2025-01-15T10:00:00Z'),
      };
      prisma.events.findUnique
        .mockResolvedValueOnce(eventWithEarlierStart as any)
        .mockResolvedValueOnce(eventWithEarlierStart as any);
      prisma.events.update.mockResolvedValue(eventWithEarlierStart as any);

      await expect(
        service.update(mockEventId, {
          endDate: '2025-01-15T09:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update matchId', async () => {
      const newMatchId = 'match-456';
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockResolvedValue({
        ...mockEvent,
        matchId: newMatchId,
      } as any);

      const result = await service.update(mockEventId, {
        matchId: newMatchId,
      });

      expect(result.matchId).toBe(newMatchId);
    });

    it('should update updatedAt timestamp', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.update.mockImplementation((args: any) => {
        expect(args.data.updatedAt).toBeInstanceOf(Date);
        return Promise.resolve({ ...mockEvent, ...updateDto } as any);
      });

      await service.update(mockEventId, updateDto);
    });
  });

  describe('remove', () => {
    it('should delete event successfully', async () => {
      prisma.events.findUnique.mockResolvedValue(mockEvent as any);
      prisma.events.delete.mockResolvedValue(mockEvent as any);

      const result = await service.remove(mockEventId);

      expect(result).toEqual({ message: 'Événement supprimé avec succès' });
      expect(prisma.events.delete).toHaveBeenCalledWith({
        where: { id: mockEventId },
      });
    });

    it('should throw NotFoundException when event does not exist', async () => {
      prisma.events.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findUserEvents', () => {
    it('should find events for a specific user', async () => {
      const mockEvents = [mockEvent];
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const result = await service.findUserEvents(mockUserId, {});

      expect(result).toEqual(mockEvents);
      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            event_assignments: {
              some: {
                userId: mockUserId,
              },
            },
          },
        }),
      );
    });

    it('should combine user filter with other filters', async () => {
      const mockEvents = [mockEvent];
      prisma.events.findMany.mockResolvedValue(mockEvents as any);

      const query: QueryEventDto = {
        type: EventType.MATCH,
        status: EventStatus.PLANNED,
      };

      const result = await service.findUserEvents(mockUserId, query);

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: EventType.MATCH,
            status: EventStatus.PLANNED,
            event_assignments: {
              some: {
                userId: mockUserId,
              },
            },
          },
        }),
      );
    });

    it('should return empty array when user has no events', async () => {
      prisma.events.findMany.mockResolvedValue([]);

      const result = await service.findUserEvents('user-without-events', {});

      expect(result).toEqual([]);
    });
  });

  describe('findUpcoming', () => {
    it('should find upcoming events with default limit', async () => {
      const upcomingEvents = [mockEvent];
      prisma.events.findMany.mockResolvedValue(upcomingEvents as any);

      const result = await service.findUpcoming();

      expect(result).toEqual(upcomingEvents);
      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            startDate: {
              gte: expect.any(Date),
            },
            status: {
              in: ['PLANNED', 'CONFIRMED'],
            },
          },
          take: 10,
          orderBy: { startDate: 'asc' },
        }),
      );
    });

    it('should find upcoming events with custom limit', async () => {
      const upcomingEvents = [mockEvent];
      prisma.events.findMany.mockResolvedValue(upcomingEvents as any);

      const result = await service.findUpcoming(5);

      expect(result).toEqual(upcomingEvents);
      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        }),
      );
    });

    it('should only include PLANNED and CONFIRMED events', async () => {
      prisma.events.findMany.mockResolvedValue([]);

      await service.findUpcoming();

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: {
              in: ['PLANNED', 'CONFIRMED'],
            },
          }),
        }),
      );
    });

    it('should only include future events', async () => {
      const beforeCall = Date.now();
      prisma.events.findMany.mockResolvedValue([]);

      await service.findUpcoming();

      const callArgs = (prisma.events.findMany as jest.Mock).mock.calls[0][0];
      const queryDate = callArgs.where.startDate.gte;

      expect(queryDate.getTime()).toBeGreaterThanOrEqual(beforeCall);
      expect(queryDate.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should return empty array when no upcoming events', async () => {
      prisma.events.findMany.mockResolvedValue([]);

      const result = await service.findUpcoming();

      expect(result).toEqual([]);
    });

    it('should include all relations', async () => {
      prisma.events.findMany.mockResolvedValue([]);

      await service.findUpcoming();

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            users: expect.any(Object),
            event_assignments: expect.any(Object),
            matches: expect.any(Object),
          },
        }),
      );
    });

    it('should order by startDate ascending', async () => {
      prisma.events.findMany.mockResolvedValue([]);

      await service.findUpcoming();

      expect(prisma.events.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { startDate: 'asc' },
        }),
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long event titles', async () => {
      const longTitle = 'A'.repeat(500);
      const dto = {
        title: longTitle,
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T12:00:00Z',
        location: 'Stadium',
      } as CreateEventDto;

      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        title: longTitle,
      } as any);

      const result = await service.create(dto, mockUserId);

      expect(result.title).toBe(longTitle);
    });

    it('should handle very long descriptions', async () => {
      const longDescription = 'Description '.repeat(200);
      const dto = {
        title: 'Event',
        description: longDescription,
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T12:00:00Z',
        location: 'Stadium',
      } as CreateEventDto;

      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        description: longDescription,
      } as any);

      const result = await service.create(dto, mockUserId);

      expect(result.description).toBe(longDescription);
    });

    it('should handle events spanning multiple days', async () => {
      const dto = {
        title: 'Multi-day Event',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-20T18:00:00Z',
        location: 'Stadium',
      } as CreateEventDto;

      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      } as any);

      const result = await service.create(dto, mockUserId);

      const durationDays =
        (result.endDate.getTime() - result.startDate.getTime()) / (1000 * 60 * 60 * 24);
      expect(durationDays).toBeGreaterThan(5);
    });

    it('should handle extreme latitude values', async () => {
      const dto = {
        title: 'Event',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T12:00:00Z',
        location: 'North Pole',
        latitude: 90,
        longitude: 0,
      } as CreateEventDto;

      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        latitude: 90,
      } as any);

      const result = await service.create(dto, mockUserId);

      expect(result.latitude).toBe(90);
    });

    it('should handle extreme longitude values', async () => {
      const dto = {
        title: 'Event',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T12:00:00Z',
        location: 'International Date Line',
        latitude: 0,
        longitude: 180,
      } as CreateEventDto;

      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        longitude: 180,
      } as any);

      const result = await service.create(dto, mockUserId);

      expect(result.longitude).toBe(180);
    });

    it('should handle large number of assigned users', async () => {
      const manyUsers = Array.from({ length: 100 }, (_, i) => `user-${i}`);
      const dto = {
        title: 'Event',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T12:00:00Z',
        location: 'Stadium',
        assignedUserIds: manyUsers,
      } as CreateEventDto;

      prisma.events.create.mockResolvedValue({
        ...mockEvent,
        event_assignments: manyUsers.map((userId, idx) => ({
          id: `assignment-${idx}`,
          userId,
          users: { ...mockUser, id: userId },
        })),
      } as any);

      const result = await service.create(dto, mockUserId);

      expect(result.event_assignments).toHaveLength(100);
    });
  });
});
