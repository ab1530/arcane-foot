import { Test, TestingModule } from '@nestjs/testing';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { EventType, EventStatus, UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

describe('EventsController', () => {
  let controller: EventsController;
  let service: any;

  const mockUserId = 'user-123';
  const mockEventId = 'event-123';

  const mockRequest = {
    user: {
      sub: mockUserId,
      email: 'test@example.com',
      role: 'SCOUT',
    },
  };

  const mockUser = {
    id: mockUserId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.SCOUT,
  };

  const mockEvent: any = {
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
    matchId: 'match-123',
    createdById: mockUserId,
    updatedAt: new Date(),
    users: mockUser,
    event_assignments: [
      {
        id: 'assignment-1',
        userId: mockUserId,
        assignedAt: new Date(),
        eventId: mockEventId,
        users: mockUser,
      },
    ],
    matches: {
      id: 'match-123',
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
    },
  };

  const mockEventsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findUserEvents: jest.fn(),
    findTeamEvents: jest.fn(),
    findUpcoming: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<EventsController>(EventsController);
    service = module.get(EventsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Controller Initialization', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('POST /events - create', () => {
    const createDto: CreateEventDto = {
      title: 'Match Scouting',
      description: 'Scouting event for the match',
      type: EventType.MATCH,
      status: EventStatus.PLANNED,
      startDate: '2025-01-15T10:00:00Z',
      endDate: '2025-01-15T12:00:00Z',
      location: 'Stadium A',
      latitude: 48.8566,
      longitude: 2.3522,
      matchId: 'match-123',
      assignedUserIds: [mockUserId],
    };

    it('should create a new event', async () => {
      service.create.mockResolvedValue(mockEvent);

      const result = await controller.create(createDto, mockRequest as any);

      expect(result).toEqual(mockEvent);
      expect(service.create).toHaveBeenCalledWith(createDto, mockUserId);
    });

    it('should extract user id from request', async () => {
      service.create.mockResolvedValue(mockEvent);

      await controller.create(createDto, mockRequest as any);

      expect(service.create).toHaveBeenCalledWith(createDto, mockRequest.user.sub);
    });

    it('should create event with minimal data', async () => {
      const minimalDto: CreateEventDto = {
        title: 'Simple Event',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T12:00:00Z',
        location: 'Stadium',
      };

      service.create.mockResolvedValue({
        ...mockEvent,
        title: minimalDto.title,
      });

      const result = await controller.create(minimalDto, mockRequest as any);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(minimalDto, mockUserId);
    });

    it('should create event with all fields', async () => {
      service.create.mockResolvedValue(mockEvent);

      const result = await controller.create(createDto, mockRequest as any);

      expect(result).toBeDefined();
      expect(service.create).toHaveBeenCalledWith(createDto, mockUserId);
    });

    it('should handle different event types', async () => {
      const eventTypes = [
        EventType.MATCH,
        EventType.TRAINING,
        EventType.MEETING,
        EventType.CAMP,
        EventType.OTHER,
      ];

      for (const type of eventTypes) {
        const dto = { ...createDto, type };
        service.create.mockResolvedValue({ ...mockEvent, type });

        const result = await controller.create(dto, mockRequest as any);

        expect(result.type).toBe(type);
      }
    });

    it('should handle different event statuses', async () => {
      const eventStatuses = [
        EventStatus.PLANNED,
        EventStatus.CONFIRMED,
        EventStatus.COMPLETED,
        EventStatus.CANCELLED,
      ];

      for (const status of eventStatuses) {
        const dto = { ...createDto, status };
        service.create.mockResolvedValue({ ...mockEvent, status });

        const result = await controller.create(dto, mockRequest as any);

        expect(result.status).toBe(status);
      }
    });
  });

  describe('GET /events - findAll', () => {
    it('should return all events without filters', async () => {
      const mockEvents = [mockEvent];
      service.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll({});

      expect(result).toEqual(mockEvents);
      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('should filter by event type', async () => {
      const query: QueryEventDto = { type: EventType.MATCH };
      const mockEvents = [mockEvent];
      service.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by event status', async () => {
      const query: QueryEventDto = { status: EventStatus.PLANNED };
      const mockEvents = [mockEvent];
      service.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by date range', async () => {
      const query: QueryEventDto = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      };
      const mockEvents = [mockEvent];
      service.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by assignedUserId', async () => {
      const query: QueryEventDto = { assignedUserId: mockUserId };
      const mockEvents = [mockEvent];
      service.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should filter by matchId', async () => {
      const query: QueryEventDto = { matchId: 'match-123' };
      const mockEvents = [mockEvent];
      service.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should handle multiple filters', async () => {
      const query: QueryEventDto = {
        type: EventType.MATCH,
        status: EventStatus.PLANNED,
        startDate: '2025-01-01T00:00:00Z',
        assignedUserId: mockUserId,
      };
      const mockEvents = [mockEvent];
      service.findAll.mockResolvedValue(mockEvents);

      const result = await controller.findAll(query);

      expect(result).toEqual(mockEvents);
      expect(service.findAll).toHaveBeenCalledWith(query);
    });

    it('should return empty array when no events found', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll({});

      expect(result).toEqual([]);
    });
  });

  describe('GET /events/upcoming - findUpcoming', () => {
    it('should return upcoming events with default limit', async () => {
      const mockEvents = [mockEvent];
      service.findUpcoming.mockResolvedValue(mockEvents);

      const result = await controller.findUpcoming();

      expect(result).toEqual(mockEvents);
      expect(service.findUpcoming).toHaveBeenCalledWith(undefined);
    });

    it('should return upcoming events with custom limit', async () => {
      const mockEvents = [mockEvent];
      service.findUpcoming.mockResolvedValue(mockEvents);

      const result = await controller.findUpcoming(5);

      expect(result).toEqual(mockEvents);
      expect(service.findUpcoming).toHaveBeenCalledWith(5);
    });

    it('should handle limit as string', async () => {
      const mockEvents = [mockEvent];
      service.findUpcoming.mockResolvedValue(mockEvents);

      const result = await controller.findUpcoming(10 as any);

      expect(result).toEqual(mockEvents);
      expect(service.findUpcoming).toHaveBeenCalled();
    });

    it('should return empty array when no upcoming events', async () => {
      service.findUpcoming.mockResolvedValue([]);

      const result = await controller.findUpcoming();

      expect(result).toEqual([]);
    });
  });

  describe('GET /events/my-events - findMyEvents', () => {
    it('should return current user events', async () => {
      const mockEvents = [mockEvent];
      service.findUserEvents.mockResolvedValue(mockEvents);

      const result = await controller.findMyEvents(mockRequest as any, {});

      expect(result).toEqual(mockEvents);
      expect(service.findUserEvents).toHaveBeenCalledWith(mockUserId, {});
    });

    it('should extract user id from request', async () => {
      const mockEvents = [mockEvent];
      service.findUserEvents.mockResolvedValue(mockEvents);

      await controller.findMyEvents(mockRequest as any, {});

      expect(service.findUserEvents).toHaveBeenCalledWith(mockRequest.user.sub, {});
    });

    it('should pass query filters', async () => {
      const query: QueryEventDto = {
        type: EventType.MATCH,
        status: EventStatus.PLANNED,
      };
      const mockEvents = [mockEvent];
      service.findUserEvents.mockResolvedValue(mockEvents);

      const result = await controller.findMyEvents(mockRequest as any, query);

      expect(result).toEqual(mockEvents);
      expect(service.findUserEvents).toHaveBeenCalledWith(mockUserId, query);
    });

    it('should return empty array when user has no events', async () => {
      service.findUserEvents.mockResolvedValue([]);

      const result = await controller.findMyEvents(mockRequest as any, {});

      expect(result).toEqual([]);
    });
  });

  describe('GET /events/team-events - findTeamEvents', () => {
    it('should return team events for admin context', async () => {
      const adminRequest = {
        user: {
          sub: 'admin-1',
          role: 'SUPER_ADMIN',
        },
      };
      const query: QueryEventDto = { status: EventStatus.PLANNED };
      const mockEvents = [mockEvent];
      service.findTeamEvents.mockResolvedValue(mockEvents);

      const result = await controller.findTeamEvents(adminRequest as any, query);

      expect(result).toEqual(mockEvents);
      expect(service.findTeamEvents).toHaveBeenCalledWith('admin-1', 'SUPER_ADMIN', query);
    });

    it('should support request.user.id fallback', async () => {
      const adminRequest = {
        user: {
          id: 'admin-id-2',
          role: 'ADMIN',
        },
      };
      service.findTeamEvents.mockResolvedValue([]);

      await controller.findTeamEvents(adminRequest as any, {});

      expect(service.findTeamEvents).toHaveBeenCalledWith('admin-id-2', 'ADMIN', {});
    });
  });

  describe('GET /events/:id - findOne', () => {
    it('should return event by id', async () => {
      service.findOne.mockResolvedValue(mockEvent);

      const result = await controller.findOne(mockEventId);

      expect(result).toEqual(mockEvent);
      expect(service.findOne).toHaveBeenCalledWith(mockEventId);
    });

    it('should handle different event ids', async () => {
      const eventIds = ['event-1', 'event-2', 'event-3'];

      for (const id of eventIds) {
        service.findOne.mockResolvedValue({ ...mockEvent, id });

        const result = await controller.findOne(id);

        expect(result.id).toBe(id);
        expect(service.findOne).toHaveBeenCalledWith(id);
      }
    });
  });

  describe('PATCH /events/:id - update', () => {
    const updateDto: UpdateEventDto = {
      title: 'Updated Title',
      description: 'Updated description',
    };

    it('should update event', async () => {
      const updatedEvent = { ...mockEvent, ...updateDto };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, updateDto);

      expect(result).toEqual(updatedEvent);
      expect(service.update).toHaveBeenCalledWith(mockEventId, updateDto);
    });

    it('should update event title only', async () => {
      const dto = { title: 'New Title' };
      const updatedEvent = { ...mockEvent, title: 'New Title' };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result.title).toBe('New Title');
      expect(service.update).toHaveBeenCalledWith(mockEventId, dto);
    });

    it('should update event description only', async () => {
      const dto = { description: 'New Description' };
      const updatedEvent = { ...mockEvent, description: 'New Description' };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result.description).toBe('New Description');
      expect(service.update).toHaveBeenCalledWith(mockEventId, dto);
    });

    it('should update event type', async () => {
      const dto = { type: EventType.TRAINING };
      const updatedEvent = { ...mockEvent, type: EventType.TRAINING };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result.type).toBe(EventType.TRAINING);
    });

    it('should update event status', async () => {
      const dto = { status: EventStatus.COMPLETED };
      const updatedEvent = { ...mockEvent, status: EventStatus.COMPLETED };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result.status).toBe(EventStatus.COMPLETED);
    });

    it('should update event dates', async () => {
      const dto = {
        startDate: '2025-01-20T10:00:00Z',
        endDate: '2025-01-20T12:00:00Z',
      };
      const updatedEvent = {
        ...mockEvent,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result.startDate).toEqual(new Date(dto.startDate));
      expect(result.endDate).toEqual(new Date(dto.endDate));
    });

    it('should update location', async () => {
      const dto = { location: 'New Stadium' };
      const updatedEvent = { ...mockEvent, location: 'New Stadium' };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result.location).toBe('New Stadium');
    });

    it('should update coordinates', async () => {
      const dto = { latitude: 40.4168, longitude: -3.7038 };
      const updatedEvent = { ...mockEvent, ...dto };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result.latitude).toBe(40.4168);
      expect(result.longitude).toBe(-3.7038);
    });

    it('should update assigned users', async () => {
      const dto = { assignedUserIds: ['user-2', 'user-3'] };
      const updatedEvent = {
        ...mockEvent,
        event_assignments: [
          { id: 'a1', userId: 'user-2', users: { ...mockUser, id: 'user-2' } },
          { id: 'a2', userId: 'user-3', users: { ...mockUser, id: 'user-3' } },
        ],
      };
      service.update.mockResolvedValue(updatedEvent as any);

      const result = await controller.update(mockEventId, dto);

      expect(result.event_assignments).toHaveLength(2);
    });

    it('should update multiple fields at once', async () => {
      const dto = {
        title: 'New Title',
        description: 'New Description',
        type: EventType.TRAINING,
        status: EventStatus.CONFIRMED,
      };
      const updatedEvent = { ...mockEvent, ...dto };
      service.update.mockResolvedValue(updatedEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result.title).toBe(dto.title);
      expect(result.description).toBe(dto.description);
      expect(result.type).toBe(dto.type);
      expect(result.status).toBe(dto.status);
    });

    it('should handle empty update dto', async () => {
      const dto = {};
      service.update.mockResolvedValue(mockEvent);

      const result = await controller.update(mockEventId, dto);

      expect(result).toEqual(mockEvent);
      expect(service.update).toHaveBeenCalledWith(mockEventId, dto);
    });
  });

  describe('DELETE /events/:id - remove', () => {
    it('should delete event', async () => {
      const expectedResponse = { message: 'Événement supprimé avec succès' };
      service.remove.mockResolvedValue(expectedResponse);

      const result = await controller.remove(mockEventId);

      expect(result).toEqual(expectedResponse);
      expect(service.remove).toHaveBeenCalledWith(mockEventId);
    });

    it('should handle different event ids', async () => {
      const eventIds = ['event-1', 'event-2', 'event-3'];
      const expectedResponse = { message: 'Événement supprimé avec succès' };

      for (const id of eventIds) {
        service.remove.mockResolvedValue(expectedResponse);

        const result = await controller.remove(id);

        expect(result).toEqual(expectedResponse);
        expect(service.remove).toHaveBeenCalledWith(id);
      }
    });
  });

  describe('Authentication & Authorization', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', EventsController);
      expect(guards).toBeDefined();
    });

    it('should extract user from request in create', async () => {
      const customRequest = {
        user: {
          sub: 'custom-user-id',
          email: 'custom@example.com',
          role: 'AGENT',
        },
      };

      service.create.mockResolvedValue(mockEvent);

      await controller.create(
        {
          title: 'Event',
          startDate: '2025-01-15T10:00:00Z',
          endDate: '2025-01-15T12:00:00Z',
          location: 'Stadium',
        },
        customRequest as any,
      );

      expect(service.create).toHaveBeenCalledWith(expect.any(Object), 'custom-user-id');
    });

    it('should extract user from request in findMyEvents', async () => {
      const customRequest = {
        user: {
          sub: 'custom-user-id',
          email: 'custom@example.com',
          role: 'AGENT',
        },
      };

      service.findUserEvents.mockResolvedValue([]);

      await controller.findMyEvents(customRequest as any, {});

      expect(service.findUserEvents).toHaveBeenCalledWith('custom-user-id', {});
    });
  });

  describe('Date Format Handling', () => {
    it('should handle ISO 8601 date format', async () => {
      const dto: CreateEventDto = {
        title: 'Event',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T12:00:00Z',
        location: 'Stadium',
      };

      service.create.mockResolvedValue(mockEvent);

      await controller.create(dto, mockRequest as any);

      expect(service.create).toHaveBeenCalledWith(dto, mockUserId);
    });

    it('should handle ISO 8601 date with timezone offset', async () => {
      const dto: CreateEventDto = {
        title: 'Event',
        startDate: '2025-01-15T10:00:00+01:00',
        endDate: '2025-01-15T12:00:00+01:00',
        location: 'Stadium',
      };

      service.create.mockResolvedValue(mockEvent);

      await controller.create(dto, mockRequest as any);

      expect(service.create).toHaveBeenCalledWith(dto, mockUserId);
    });

    it('should handle date strings in query filters', async () => {
      const query: QueryEventDto = {
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-12-31T23:59:59Z',
      };

      service.findAll.mockResolvedValue([]);

      await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
    });
  });

  describe('Request Validation', () => {
    it('should validate CreateEventDto', async () => {
      const validDto: CreateEventDto = {
        title: 'Valid Event',
        startDate: '2025-01-15T10:00:00Z',
        endDate: '2025-01-15T12:00:00Z',
        location: 'Stadium',
      };

      service.create.mockResolvedValue(mockEvent);

      await controller.create(validDto, mockRequest as any);

      expect(service.create).toHaveBeenCalled();
    });

    it('should validate UpdateEventDto', async () => {
      const validDto: UpdateEventDto = {
        title: 'Updated Title',
      };

      service.update.mockResolvedValue(mockEvent);

      await controller.update(mockEventId, validDto);

      expect(service.update).toHaveBeenCalled();
    });

    it('should validate QueryEventDto', async () => {
      const validQuery: QueryEventDto = {
        type: EventType.MATCH,
        status: EventStatus.PLANNED,
      };

      service.findAll.mockResolvedValue([]);

      await controller.findAll(validQuery);

      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should propagate service errors in create', async () => {
      const error = new Error('Service error');
      service.create.mockRejectedValue(error);

      await expect(
        controller.create(
          {
            title: 'Event',
            startDate: '2025-01-15T10:00:00Z',
            endDate: '2025-01-15T12:00:00Z',
            location: 'Stadium',
          },
          mockRequest as any,
        ),
      ).rejects.toThrow('Service error');
    });

    it('should propagate service errors in findOne', async () => {
      const error = new Error('Not found');
      service.findOne.mockRejectedValue(error);

      await expect(controller.findOne(mockEventId)).rejects.toThrow('Not found');
    });

    it('should propagate service errors in update', async () => {
      const error = new Error('Update failed');
      service.update.mockRejectedValue(error);

      await expect(controller.update(mockEventId, { title: 'New Title' })).rejects.toThrow(
        'Update failed',
      );
    });

    it('should propagate service errors in remove', async () => {
      const error = new Error('Delete failed');
      service.remove.mockRejectedValue(error);

      await expect(controller.remove(mockEventId)).rejects.toThrow('Delete failed');
    });
  });

  describe('API Documentation', () => {
    it('should have ApiTags decorator', () => {
      const tags = Reflect.getMetadata('swagger/apiUseTags', EventsController);
      expect(tags).toBeDefined();
    });

    it('should have ApiBearerAuth decorator', () => {
      const bearerAuth = Reflect.getMetadata('swagger/apiSecurity', EventsController);
      expect(bearerAuth).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large limit in findUpcoming', async () => {
      service.findUpcoming.mockResolvedValue([]);

      await controller.findUpcoming(10000);

      expect(service.findUpcoming).toHaveBeenCalledWith(10000);
    });

    it('should handle zero limit in findUpcoming', async () => {
      service.findUpcoming.mockResolvedValue([]);

      await controller.findUpcoming(0);

      expect(service.findUpcoming).toHaveBeenCalledWith(0);
    });

    it('should handle empty query object', async () => {
      service.findAll.mockResolvedValue([]);

      await controller.findAll({});

      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('should handle update with all fields undefined', async () => {
      const dto: UpdateEventDto = {};
      service.update.mockResolvedValue(mockEvent);

      await controller.update(mockEventId, dto);

      expect(service.update).toHaveBeenCalledWith(mockEventId, dto);
    });

    it('should handle event with no assigned users', async () => {
      const eventWithoutUsers = {
        ...mockEvent,
        event_assignments: [],
      };
      service.findOne.mockResolvedValue(eventWithoutUsers as any);

      const result = await controller.findOne(mockEventId);

      expect(result.event_assignments).toEqual([]);
    });

    it('should handle event with no match', async () => {
      const eventWithoutMatch = {
        ...mockEvent,
        matchId: null,
        matches: null,
      };
      service.findOne.mockResolvedValue(eventWithoutMatch as any);

      const result = await controller.findOne(mockEventId);

      expect(result.matchId).toBeNull();
      expect(result.matches).toBeNull();
    });

    it('should handle event with no coordinates', async () => {
      const eventWithoutCoords = {
        ...mockEvent,
        latitude: null,
        longitude: null,
      };
      service.findOne.mockResolvedValue(eventWithoutCoords as any);

      const result = await controller.findOne(mockEventId);

      expect(result.latitude).toBeNull();
      expect(result.longitude).toBeNull();
    });
  });
});
