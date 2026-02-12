import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ClubRequestsService } from './club-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PrismaClient, ClubRequestStatus } from '@prisma/client';
import { CreateClubRequestDto } from './dto/create-club-request.dto';
import { UpdateClubRequestDto } from './dto/update-club-request.dto';

describe('ClubRequestsService', () => {
  let service: ClubRequestsService;
  let prisma: DeepMockProxy<PrismaClient>;

  beforeEach(async () => {
    prisma = mockDeep<PrismaClient>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClubRequestsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ClubRequestsService>(ClubRequestsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createClubRequestDto: CreateClubRequestDto = {
      clubId: 'club-123',
      playerId: 'player-123',
      requestType: 'TRIAL',
      message: 'I would like to join your club',
      offerAmount: 50000,
    };

    const mockClub = {
      id: 'club-123',
      name: 'FC Test',
      logo: 'logo.png',
      country: 'FR',
      city: 'Paris',
    };

    const mockPlayer = {
      id: 'player-123',
      userId: 'user-123',
      position: 'Forward',
    };

    const mockCreatedRequest = {
      id: 'request-123',
      clubId: 'club-123',
      playerId: 'player-123',
      requestType: 'TRIAL',
      status: ClubRequestStatus.PENDING,
      message: 'I would like to join your club',
      offerAmount: 50000,
      createdAt: new Date(),
      updatedAt: new Date(),
      respondedAt: null,
      clubs: mockClub,
      players: {
        ...mockPlayer,
        users: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          phone: '+1234567890',
        },
      },
    };

    it('should create a club request successfully', async () => {
      prisma.clubs.findUnique.mockResolvedValue(mockClub as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.club_requests.findFirst.mockResolvedValue(null);
      prisma.club_requests.create.mockResolvedValue(mockCreatedRequest as any);

      const result = await service.create(createClubRequestDto);

      expect(prisma.clubs.findUnique).toHaveBeenCalledWith({
        where: { id: 'club-123' },
      });
      expect(prisma.players.findUnique).toHaveBeenCalledWith({
        where: { id: 'player-123' },
      });
      expect(prisma.club_requests.findFirst).toHaveBeenCalledWith({
        where: {
          clubId: 'club-123',
          playerId: 'player-123',
          status: ClubRequestStatus.PENDING,
        },
      });
      expect(prisma.club_requests.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: expect.any(String),
          requestType: 'TRIAL',
          message: 'I would like to join your club',
          offerAmount: 50000,
          updatedAt: expect.any(Date),
        }),
        include: expect.objectContaining({
          clubs: true,
          players: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockCreatedRequest);
    });

    it('should throw NotFoundException if club not found', async () => {
      prisma.clubs.findUnique.mockResolvedValue(null);

      await expect(service.create(createClubRequestDto)).rejects.toThrow(
        new NotFoundException("Club avec l'ID club-123 introuvable"),
      );
      expect(prisma.players.findUnique).not.toHaveBeenCalled();
      expect(prisma.club_requests.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if player not found', async () => {
      prisma.clubs.findUnique.mockResolvedValue(mockClub as any);
      prisma.players.findUnique.mockResolvedValue(null);

      await expect(service.create(createClubRequestDto)).rejects.toThrow(
        new NotFoundException("Joueur avec l'ID player-123 introuvable"),
      );
      expect(prisma.club_requests.findFirst).not.toHaveBeenCalled();
      expect(prisma.club_requests.create).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if pending request already exists', async () => {
      const existingRequest = {
        id: 'existing-123',
        clubId: 'club-123',
        playerId: 'player-123',
        status: ClubRequestStatus.PENDING,
      };

      prisma.clubs.findUnique.mockResolvedValue(mockClub as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.club_requests.findFirst.mockResolvedValue(existingRequest as any);

      await expect(service.create(createClubRequestDto)).rejects.toThrow(
        new BadRequestException('Une demande en attente existe déjà pour ce joueur et ce club'),
      );
      expect(prisma.club_requests.create).not.toHaveBeenCalled();
    });

    it('should create request without optional fields', async () => {
      const minimalDto: CreateClubRequestDto = {
        clubId: 'club-123',
        playerId: 'player-123',
        requestType: 'SCOUTING',
      };

      prisma.clubs.findUnique.mockResolvedValue(mockClub as any);
      prisma.players.findUnique.mockResolvedValue(mockPlayer as any);
      prisma.club_requests.findFirst.mockResolvedValue(null);
      prisma.club_requests.create.mockResolvedValue(mockCreatedRequest as any);

      await service.create(minimalDto);

      expect(prisma.club_requests.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          requestType: 'SCOUTING',
        }),
        include: expect.any(Object),
      });
    });
  });

  describe('findAll', () => {
    const mockRequests = [
      {
        id: 'request-1',
        clubId: 'club-1',
        playerId: 'player-1',
        status: ClubRequestStatus.PENDING,
        requestType: 'TRIAL',
        createdAt: new Date('2025-01-01'),
        clubs: {
          id: 'club-1',
          name: 'FC Test',
          logo: 'logo1.png',
          country: 'FR',
          city: 'Paris',
        },
        players: {
          id: 'player-1',
          users: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@test.com',
            avatar: 'avatar1.png',
          },
        },
      },
      {
        id: 'request-2',
        clubId: 'club-2',
        playerId: 'player-2',
        status: ClubRequestStatus.ACCEPTED,
        requestType: 'TRANSFER',
        createdAt: new Date('2025-01-02'),
        clubs: {
          id: 'club-2',
          name: 'FC Demo',
          logo: 'logo2.png',
          country: 'FR',
          city: 'Lyon',
        },
        players: {
          id: 'player-2',
          users: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@test.com',
            avatar: 'avatar2.png',
          },
        },
      },
    ];

    it('should return all requests without filters', async () => {
      prisma.club_requests.findMany.mockResolvedValue(mockRequests as any);

      const result = await service.findAll();

      expect(prisma.club_requests.findMany).toHaveBeenCalledWith({
        where: {
          clubId: undefined,
          playerId: undefined,
          status: undefined,
        },
        include: expect.objectContaining({
          clubs: expect.any(Object),
          players: expect.any(Object),
        }),
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockRequests);
      expect(result).toHaveLength(2);
    });

    it('should filter by clubId', async () => {
      const filtered = [mockRequests[0]];
      prisma.club_requests.findMany.mockResolvedValue(filtered as any);

      const result = await service.findAll({ clubId: 'club-1' });

      expect(prisma.club_requests.findMany).toHaveBeenCalledWith({
        where: {
          clubId: 'club-1',
          playerId: undefined,
          status: undefined,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(filtered);
    });

    it('should filter by playerId', async () => {
      const filtered = [mockRequests[1]];
      prisma.club_requests.findMany.mockResolvedValue(filtered as any);

      const result = await service.findAll({ playerId: 'player-2' });

      expect(prisma.club_requests.findMany).toHaveBeenCalledWith({
        where: {
          clubId: undefined,
          playerId: 'player-2',
          status: undefined,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(filtered);
    });

    it('should filter by status', async () => {
      const filtered = [mockRequests[0]];
      prisma.club_requests.findMany.mockResolvedValue(filtered as any);

      const result = await service.findAll({ status: ClubRequestStatus.PENDING });

      expect(prisma.club_requests.findMany).toHaveBeenCalledWith({
        where: {
          clubId: undefined,
          playerId: undefined,
          status: ClubRequestStatus.PENDING,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(filtered);
    });

    it('should filter by multiple criteria', async () => {
      const filtered = [mockRequests[0]];
      prisma.club_requests.findMany.mockResolvedValue(filtered as any);

      const result = await service.findAll({
        clubId: 'club-1',
        playerId: 'player-1',
        status: ClubRequestStatus.PENDING,
      });

      expect(prisma.club_requests.findMany).toHaveBeenCalledWith({
        where: {
          clubId: 'club-1',
          playerId: 'player-1',
          status: ClubRequestStatus.PENDING,
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(filtered);
    });

    it('should return empty array when no requests found', async () => {
      prisma.club_requests.findMany.mockResolvedValue([]);

      const result = await service.findAll({ clubId: 'non-existent' });

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    const mockRequest = {
      id: 'request-123',
      clubId: 'club-123',
      playerId: 'player-123',
      status: ClubRequestStatus.PENDING,
      requestType: 'TRIAL',
      clubs: {
        id: 'club-123',
        name: 'FC Test',
        users: {
          firstName: 'Club',
          lastName: 'Owner',
          email: 'owner@club.com',
          phone: '+1234567890',
        },
      },
      players: {
        id: 'player-123',
        users: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
          phone: '+0987654321',
          avatar: 'avatar.png',
        },
        clubs: {
          name: 'Current Club',
          logo: 'current.png',
        },
      },
    };

    it('should return a request by ID', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);

      const result = await service.findOne('request-123');

      expect(prisma.club_requests.findUnique).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        include: expect.objectContaining({
          clubs: expect.any(Object),
          players: expect.any(Object),
        }),
      });
      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundException if request not found', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        new NotFoundException("Demande avec l'ID invalid-id introuvable"),
      );
    });
  });

  describe('update', () => {
    const mockRequest = {
      id: 'request-123',
      clubId: 'club-123',
      playerId: 'player-123',
      status: ClubRequestStatus.PENDING,
      requestType: 'TRIAL',
      message: 'Original message',
    };

    const mockUpdatedRequest = {
      ...mockRequest,
      status: ClubRequestStatus.ACCEPTED,
      message: 'Updated message',
      respondedAt: new Date(),
      clubs: { id: 'club-123', name: 'FC Test' },
      players: {
        id: 'player-123',
        users: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@test.com',
        },
      },
    };

    it('should update a request successfully', async () => {
      const updateDto: UpdateClubRequestDto = {
        message: 'Updated message',
        offerAmount: 75000,
      };

      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      const result = await service.update('request-123', updateDto);

      expect(prisma.club_requests.findUnique).toHaveBeenCalled();
      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          message: 'Updated message',
          offerAmount: 75000,
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockUpdatedRequest);
    });

    it('should add respondedAt when status changes to ACCEPTED', async () => {
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.ACCEPTED,
        message: 'Accepted',
      };

      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      const callArgs = (prisma.club_requests.update as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.respondedAt).toBeInstanceOf(Date);
    });

    it('should add respondedAt when status changes to REJECTED', async () => {
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.REJECTED,
        message: 'Rejected',
      };

      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      const callArgs = (prisma.club_requests.update as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.respondedAt).toBeInstanceOf(Date);
    });

    it('should add respondedAt when status changes to COMPLETED', async () => {
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.COMPLETED,
      };

      const acceptedRequest = { ...mockRequest, status: ClubRequestStatus.ACCEPTED };
      prisma.club_requests.findUnique.mockResolvedValue(acceptedRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      const callArgs = (prisma.club_requests.update as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.respondedAt).toBeInstanceOf(Date);
    });

    it('should not add respondedAt when status changes to NEGOTIATING', async () => {
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.NEGOTIATING,
      };

      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      const callArgs = (prisma.club_requests.update as jest.Mock).mock.calls[0][0];
      expect(callArgs.data.respondedAt).toBeUndefined();
    });

    it('should throw NotFoundException if request not found', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', {})).rejects.toThrow(
        new NotFoundException("Demande avec l'ID invalid-id introuvable"),
      );
      expect(prisma.club_requests.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition from PENDING', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);

      await expect(
        service.update('request-123', { status: ClubRequestStatus.COMPLETED }),
      ).rejects.toThrow(
        new BadRequestException('Transition de statut invalide: PENDING -> COMPLETED'),
      );
      expect(prisma.club_requests.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition from REJECTED', async () => {
      const rejectedRequest = { ...mockRequest, status: ClubRequestStatus.REJECTED };
      prisma.club_requests.findUnique.mockResolvedValue(rejectedRequest as any);

      await expect(
        service.update('request-123', { status: ClubRequestStatus.ACCEPTED }),
      ).rejects.toThrow(
        new BadRequestException('Transition de statut invalide: REJECTED -> ACCEPTED'),
      );
    });

    it('should throw BadRequestException for invalid status transition from COMPLETED', async () => {
      const completedRequest = { ...mockRequest, status: ClubRequestStatus.COMPLETED };
      prisma.club_requests.findUnique.mockResolvedValue(completedRequest as any);

      await expect(
        service.update('request-123', { status: ClubRequestStatus.NEGOTIATING }),
      ).rejects.toThrow(
        new BadRequestException('Transition de statut invalide: COMPLETED -> NEGOTIATING'),
      );
    });

    it('should allow valid transition from PENDING to ACCEPTED', async () => {
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.ACCEPTED,
      };

      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      expect(prisma.club_requests.update).toHaveBeenCalled();
    });

    it('should allow valid transition from PENDING to REJECTED', async () => {
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.REJECTED,
      };

      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      expect(prisma.club_requests.update).toHaveBeenCalled();
    });

    it('should allow valid transition from PENDING to NEGOTIATING', async () => {
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.NEGOTIATING,
      };

      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      expect(prisma.club_requests.update).toHaveBeenCalled();
    });

    it('should allow valid transition from NEGOTIATING to ACCEPTED', async () => {
      const negotiatingRequest = { ...mockRequest, status: ClubRequestStatus.NEGOTIATING };
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.ACCEPTED,
      };

      prisma.club_requests.findUnique.mockResolvedValue(negotiatingRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      expect(prisma.club_requests.update).toHaveBeenCalled();
    });

    it('should allow valid transition from NEGOTIATING to REJECTED', async () => {
      const negotiatingRequest = { ...mockRequest, status: ClubRequestStatus.NEGOTIATING };
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.REJECTED,
      };

      prisma.club_requests.findUnique.mockResolvedValue(negotiatingRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      expect(prisma.club_requests.update).toHaveBeenCalled();
    });

    it('should allow valid transition from NEGOTIATING to PENDING', async () => {
      const negotiatingRequest = { ...mockRequest, status: ClubRequestStatus.NEGOTIATING };
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.PENDING,
      };

      prisma.club_requests.findUnique.mockResolvedValue(negotiatingRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      expect(prisma.club_requests.update).toHaveBeenCalled();
    });

    it('should allow valid transition from ACCEPTED to COMPLETED', async () => {
      const acceptedRequest = { ...mockRequest, status: ClubRequestStatus.ACCEPTED };
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.COMPLETED,
      };

      prisma.club_requests.findUnique.mockResolvedValue(acceptedRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      expect(prisma.club_requests.update).toHaveBeenCalled();
    });

    it('should allow valid transition from ACCEPTED to NEGOTIATING', async () => {
      const acceptedRequest = { ...mockRequest, status: ClubRequestStatus.ACCEPTED };
      const updateDto: UpdateClubRequestDto = {
        status: ClubRequestStatus.NEGOTIATING,
      };

      prisma.club_requests.findUnique.mockResolvedValue(acceptedRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockUpdatedRequest as any);

      await service.update('request-123', updateDto);

      expect(prisma.club_requests.update).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const mockRequest = {
      id: 'request-123',
      clubId: 'club-123',
      playerId: 'player-123',
      status: ClubRequestStatus.PENDING,
    };

    it('should delete a request successfully', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.delete.mockResolvedValue(mockRequest as any);

      const result = await service.delete('request-123');

      expect(prisma.club_requests.findUnique).toHaveBeenCalled();
      expect(prisma.club_requests.delete).toHaveBeenCalledWith({
        where: { id: 'request-123' },
      });
      expect(result).toEqual(mockRequest);
    });

    it('should throw NotFoundException if request not found', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(null);

      await expect(service.delete('invalid-id')).rejects.toThrow(
        new NotFoundException("Demande avec l'ID invalid-id introuvable"),
      );
      expect(prisma.club_requests.delete).not.toHaveBeenCalled();
    });
  });

  describe('accept', () => {
    const mockRequest = {
      id: 'request-123',
      status: ClubRequestStatus.PENDING,
    };

    const mockAcceptedRequest = {
      ...mockRequest,
      status: ClubRequestStatus.ACCEPTED,
      message: 'Welcome to the club!',
      respondedAt: new Date(),
    };

    it('should accept a request with message', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockAcceptedRequest as any);

      const result = await service.accept('request-123', 'Welcome to the club!');

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.ACCEPTED,
          message: 'Welcome to the club!',
          respondedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockAcceptedRequest);
    });

    it('should accept a request without message', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockAcceptedRequest as any);

      await service.accept('request-123');

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.ACCEPTED,
          message: undefined,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if request not found', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(null);

      await expect(service.accept('invalid-id')).rejects.toThrow(
        new NotFoundException("Demande avec l'ID invalid-id introuvable"),
      );
    });
  });

  describe('reject', () => {
    const mockRequest = {
      id: 'request-123',
      status: ClubRequestStatus.PENDING,
    };

    const mockRejectedRequest = {
      ...mockRequest,
      status: ClubRequestStatus.REJECTED,
      message: 'Not suitable',
      respondedAt: new Date(),
    };

    it('should reject a request with message', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockRejectedRequest as any);

      const result = await service.reject('request-123', 'Not suitable');

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.REJECTED,
          message: 'Not suitable',
          respondedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockRejectedRequest);
    });

    it('should reject a request without message', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockRejectedRequest as any);

      await service.reject('request-123');

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.REJECTED,
          message: undefined,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if request not found', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(null);

      await expect(service.reject('invalid-id')).rejects.toThrow(
        new NotFoundException("Demande avec l'ID invalid-id introuvable"),
      );
    });
  });

  describe('negotiate', () => {
    const mockRequest = {
      id: 'request-123',
      status: ClubRequestStatus.PENDING,
    };

    const mockNegotiatingRequest = {
      ...mockRequest,
      status: ClubRequestStatus.NEGOTIATING,
      offerAmount: 100000,
      message: 'Counter offer',
    };

    it('should negotiate a request with offer amount and message', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockNegotiatingRequest as any);

      const result = await service.negotiate('request-123', 100000, 'Counter offer');

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.NEGOTIATING,
          offerAmount: 100000,
          message: 'Counter offer',
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockNegotiatingRequest);
    });

    it('should negotiate a request with only offer amount', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockNegotiatingRequest as any);

      await service.negotiate('request-123', 100000);

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.NEGOTIATING,
          offerAmount: 100000,
          message: undefined,
        }),
        include: expect.any(Object),
      });
    });

    it('should negotiate a request without offer amount or message', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockNegotiatingRequest as any);

      await service.negotiate('request-123');

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.NEGOTIATING,
          offerAmount: undefined,
          message: undefined,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if request not found', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(null);

      await expect(service.negotiate('invalid-id')).rejects.toThrow(
        new NotFoundException("Demande avec l'ID invalid-id introuvable"),
      );
    });
  });

  describe('complete', () => {
    const mockRequest = {
      id: 'request-123',
      status: ClubRequestStatus.ACCEPTED,
    };

    const mockCompletedRequest = {
      ...mockRequest,
      status: ClubRequestStatus.COMPLETED,
      message: 'Transfer completed',
      respondedAt: new Date(),
    };

    it('should complete a request with message', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockCompletedRequest as any);

      const result = await service.complete('request-123', 'Transfer completed');

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.COMPLETED,
          message: 'Transfer completed',
          respondedAt: expect.any(Date),
        }),
        include: expect.any(Object),
      });
      expect(result).toEqual(mockCompletedRequest);
    });

    it('should complete a request without message', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(mockRequest as any);
      prisma.club_requests.update.mockResolvedValue(mockCompletedRequest as any);

      await service.complete('request-123');

      expect(prisma.club_requests.update).toHaveBeenCalledWith({
        where: { id: 'request-123' },
        data: expect.objectContaining({
          status: ClubRequestStatus.COMPLETED,
          message: undefined,
        }),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if request not found', async () => {
      prisma.club_requests.findUnique.mockResolvedValue(null);

      await expect(service.complete('invalid-id')).rejects.toThrow(
        new NotFoundException("Demande avec l'ID invalid-id introuvable"),
      );
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for all clubs', async () => {
      prisma.club_requests.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(30) // pending
        .mockResolvedValueOnce(40) // accepted
        .mockResolvedValueOnce(20) // rejected
        .mockResolvedValueOnce(5) // negotiating
        .mockResolvedValueOnce(5); // completed

      const result = await service.getStatistics();

      expect(prisma.club_requests.count).toHaveBeenCalledTimes(6);
      expect(result).toEqual({
        total: 100,
        pending: 30,
        accepted: 40,
        rejected: 20,
        negotiating: 5,
        completed: 5,
        successRate: 45, // (40 + 5) / 100 * 100
      });
    });

    it('should return statistics for specific club', async () => {
      prisma.club_requests.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(15) // pending
        .mockResolvedValueOnce(20) // accepted
        .mockResolvedValueOnce(10) // rejected
        .mockResolvedValueOnce(3) // negotiating
        .mockResolvedValueOnce(2); // completed

      const result = await service.getStatistics('club-123');

      expect(prisma.club_requests.count).toHaveBeenCalledWith({
        where: { clubId: 'club-123' },
      });
      expect(result).toEqual({
        total: 50,
        pending: 15,
        accepted: 20,
        rejected: 10,
        negotiating: 3,
        completed: 2,
        successRate: 44, // (20 + 2) / 50 * 100
      });
    });

    it('should return zero statistics when no requests exist', async () => {
      prisma.club_requests.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(0) // accepted
        .mockResolvedValueOnce(0) // rejected
        .mockResolvedValueOnce(0) // negotiating
        .mockResolvedValueOnce(0); // completed

      const result = await service.getStatistics();

      expect(result).toEqual({
        total: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        negotiating: 0,
        completed: 0,
        successRate: 0,
      });
    });

    it('should calculate success rate correctly with all accepted', async () => {
      prisma.club_requests.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(0) // pending
        .mockResolvedValueOnce(80) // accepted
        .mockResolvedValueOnce(0) // rejected
        .mockResolvedValueOnce(0) // negotiating
        .mockResolvedValueOnce(20); // completed

      const result = await service.getStatistics();

      expect(result.successRate).toBe(100); // (80 + 20) / 100 * 100
    });

    it('should calculate success rate correctly with no accepted', async () => {
      prisma.club_requests.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(25) // pending
        .mockResolvedValueOnce(0) // accepted
        .mockResolvedValueOnce(25) // rejected
        .mockResolvedValueOnce(0) // negotiating
        .mockResolvedValueOnce(0); // completed

      const result = await service.getStatistics();

      expect(result.successRate).toBe(0); // (0 + 0) / 50 * 100
    });
  });

  describe('validateStatusTransition - edge cases', () => {
    const mockRequest = {
      id: 'request-123',
      clubId: 'club-123',
      playerId: 'player-123',
      status: ClubRequestStatus.PENDING,
      requestType: 'TRIAL',
    };

    it('should throw error when transitioning from REJECTED to PENDING', async () => {
      const rejectedRequest = { ...mockRequest, status: ClubRequestStatus.REJECTED };
      prisma.club_requests.findUnique.mockResolvedValue(rejectedRequest as any);

      await expect(
        service.update('request-123', { status: ClubRequestStatus.PENDING }),
      ).rejects.toThrow(
        new BadRequestException('Transition de statut invalide: REJECTED -> PENDING'),
      );
    });

    it('should throw error when transitioning from REJECTED to NEGOTIATING', async () => {
      const rejectedRequest = { ...mockRequest, status: ClubRequestStatus.REJECTED };
      prisma.club_requests.findUnique.mockResolvedValue(rejectedRequest as any);

      await expect(
        service.update('request-123', { status: ClubRequestStatus.NEGOTIATING }),
      ).rejects.toThrow(
        new BadRequestException('Transition de statut invalide: REJECTED -> NEGOTIATING'),
      );
    });

    it('should throw error when transitioning from COMPLETED to PENDING', async () => {
      const completedRequest = { ...mockRequest, status: ClubRequestStatus.COMPLETED };
      prisma.club_requests.findUnique.mockResolvedValue(completedRequest as any);

      await expect(
        service.update('request-123', { status: ClubRequestStatus.PENDING }),
      ).rejects.toThrow(
        new BadRequestException('Transition de statut invalide: COMPLETED -> PENDING'),
      );
    });

    it('should throw error when transitioning from ACCEPTED to PENDING', async () => {
      const acceptedRequest = { ...mockRequest, status: ClubRequestStatus.ACCEPTED };
      prisma.club_requests.findUnique.mockResolvedValue(acceptedRequest as any);

      await expect(
        service.update('request-123', { status: ClubRequestStatus.PENDING }),
      ).rejects.toThrow(
        new BadRequestException('Transition de statut invalide: ACCEPTED -> PENDING'),
      );
    });

    it('should throw error when transitioning from ACCEPTED to REJECTED', async () => {
      const acceptedRequest = { ...mockRequest, status: ClubRequestStatus.ACCEPTED };
      prisma.club_requests.findUnique.mockResolvedValue(acceptedRequest as any);

      await expect(
        service.update('request-123', { status: ClubRequestStatus.REJECTED }),
      ).rejects.toThrow(
        new BadRequestException('Transition de statut invalide: ACCEPTED -> REJECTED'),
      );
    });
  });
});
