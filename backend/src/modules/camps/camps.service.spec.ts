import { Test, TestingModule } from '@nestjs/testing';
import { CampsService } from './camps.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CampStatus, CampType, ParticipationStatus, SubscriptionTier } from '@prisma/client';

describe('CampsService', () => {
  let service: CampsService;
  let prismaService: PrismaService;
  let stripeService: StripeService;
  let subscriptionsService: SubscriptionsService;

  const mockPrismaService = {
    camps: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    camp_participations: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
    players: {
      findUnique: jest.fn(),
    },
  };

  const mockStripeService = {
    createPaymentIntent: jest.fn(),
  };

  const mockSubscriptionsService = {
    hasMinimumTier: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile();

    service = module.get<CampsService>(CampsService);
    prismaService = module.get<PrismaService>(PrismaService);
    stripeService = module.get<StripeService>(StripeService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCamp', () => {
    it('should create a camp successfully', async () => {
      const createCampDto = {
        name: 'Camp U17',
        type: CampType.DETECTION,
        location: 'Paris',
        startDate: '2025-12-01T09:00:00Z',
        endDate: '2025-12-01T17:00:00Z',
        capacity: 50,
        price: 50,
      };

      const mockCamp = {
        id: 'camp-123',
        ...createCampDto,
        startDate: new Date(createCampDto.startDate),
        endDate: new Date(createCampDto.endDate),
        availableSpots: 50,
        club: null,
      };

      mockPrismaService.camps.create.mockResolvedValue(mockCamp);

      const result = await service.createCamp(createCampDto);

      expect(result).toEqual(mockCamp);
      expect(mockPrismaService.camps.create).toHaveBeenCalled();
    });
  });

  describe('getAllCamps', () => {
    it('should return all camps with filters', async () => {
      const mockCamps = [
        {
          id: 'camp-1',
          name: 'Camp 1',
          type: CampType.DETECTION,
          status: CampStatus.PUBLISHED,
          club: null,
          participants: [],
        },
      ];

      mockPrismaService.camps.findMany.mockResolvedValue(mockCamps);

      const result = await service.getAllCamps({
        type: CampType.DETECTION,
        status: CampStatus.PUBLISHED,
      });

      expect(result).toEqual(mockCamps);
      expect(mockPrismaService.camps.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            type: CampType.DETECTION,
            status: CampStatus.PUBLISHED,
          },
        }),
      );
    });
  });

  describe('getCampById', () => {
    it('should return camp by id', async () => {
      const mockCamp = {
        id: 'camp-123',
        name: 'Camp U17',
        club: null,
        participants: [],
      };

      mockPrismaService.camps.findUnique.mockResolvedValue(mockCamp);

      const result = await service.getCampById('camp-123');

      expect(result).toEqual(mockCamp);
    });

    it('should throw NotFoundException if camp not found', async () => {
      mockPrismaService.camps.findUnique.mockResolvedValue(null);

      await expect(service.getCampById('camp-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('registerForCamp', () => {
    it('should register user for free camp without payment', async () => {
      const mockCamp = {
        id: 'camp-123',
        name: 'Free Camp',
        status: CampStatus.PUBLISHED,
        availableSpots: 10,
        requiresPayment: false,
        price: 0,
        requiredTier: null,
        participants: [],
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockParticipation = {
        id: 'participation-123',
        campId: 'camp-123',
        playerId: 'player-123',
        status: ParticipationStatus.REGISTERED,
        hasPaid: true,
        players: {
          id: 'player-123',
          userId: 'user-123',
        },
      };

      mockPrismaService.camps.findUnique.mockResolvedValue(mockCamp);
      mockPrismaService.camp_participations.findUnique.mockResolvedValue(null);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.camp_participations.create.mockResolvedValue(mockParticipation);
      mockPrismaService.camps.update.mockResolvedValue(mockCamp);

      const result = await service.registerForCamp('user-123', 'camp-123', {
        playerId: 'player-123',
      });

      expect(result.status).toBe(ParticipationStatus.REGISTERED);
      expect(result.hasPaid).toBe(true);
      expect(mockStripeService.createPaymentIntent).not.toHaveBeenCalled();
    });

    it('should create payment intent for paid camp', async () => {
      const mockCamp = {
        id: 'camp-123',
        name: 'Paid Camp',
        status: CampStatus.PUBLISHED,
        availableSpots: 10,
        requiresPayment: true,
        price: 50,
        currency: 'EUR',
        requiredTier: null,
        participants: [],
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockPaymentIntent = {
        id: 'pi-123',
      };

      mockPrismaService.camps.findUnique.mockResolvedValue(mockCamp);
      mockPrismaService.camp_participations.findUnique.mockResolvedValue(null);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockPrismaService.camp_participations.create.mockResolvedValue({
        id: 'participation-123',
        status: ParticipationStatus.PENDING,
        paymentIntentId: 'pi-123',
      });
      mockPrismaService.camps.update.mockResolvedValue(mockCamp);

      const result = await service.registerForCamp('user-123', 'camp-123', {
        playerId: 'player-123',
      });

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        5000, // 50 EUR in cents
        'eur',
        undefined,
        expect.objectContaining({
          campId: 'camp-123',
          playerId: 'player-123',
        }),
      );
      expect(result.paymentIntentId).toBe('pi-123');
    });

    it('should throw BadRequestException if camp is full', async () => {
      const mockCamp = {
        id: 'camp-123',
        status: CampStatus.PUBLISHED,
        availableSpots: 0,
        participants: [],
      };

      mockPrismaService.camps.findUnique.mockResolvedValue(mockCamp);

      await expect(
        service.registerForCamp('user-123', 'camp-123', { playerId: 'player-123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if camp not published', async () => {
      const mockCamp = {
        id: 'camp-123',
        status: CampStatus.DRAFT,
        participants: [],
      };

      mockPrismaService.camps.findUnique.mockResolvedValue(mockCamp);

      await expect(
        service.registerForCamp('user-123', 'camp-123', { playerId: 'player-123' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user does not have required tier', async () => {
      const mockCamp = {
        id: 'camp-123',
        status: CampStatus.PUBLISHED,
        availableSpots: 10,
        requiredTier: SubscriptionTier.GOLD,
        participants: [],
      };

      mockPrismaService.camps.findUnique.mockResolvedValue(mockCamp);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(false);

      await expect(
        service.registerForCamp('user-123', 'camp-123', { playerId: 'player-123' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if already registered', async () => {
      const mockCamp = {
        id: 'camp-123',
        status: CampStatus.PUBLISHED,
        availableSpots: 10,
        participants: [],
      };

      const mockExistingParticipation = {
        id: 'participation-123',
        campId: 'camp-123',
        playerId: 'player-123',
      };

      mockPrismaService.camps.findUnique.mockResolvedValue(mockCamp);
      mockPrismaService.camp_participations.findUnique.mockResolvedValue(mockExistingParticipation);

      await expect(
        service.registerForCamp('user-123', 'camp-123', { playerId: 'player-123' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('evaluateParticipant', () => {
    it('should evaluate participant successfully', async () => {
      const mockParticipation = {
        id: 'participation-123',
        campId: 'camp-123',
        playerId: 'player-123',
      };

      const evaluationDto = {
        performanceRating: 8,
        technicalRating: 7,
        physicalRating: 9,
        mentalRating: 8,
        selectedForShowcase: true,
      };

      mockPrismaService.camp_participations.findUnique.mockResolvedValue(mockParticipation);
      mockPrismaService.camp_participations.update.mockResolvedValue({
        ...mockParticipation,
        ...evaluationDto,
        evaluatedAt: new Date(),
      });

      const result = await service.evaluateParticipant('participation-123', evaluationDto);

      expect(result.performanceRating).toBe(8);
      expect(result.selectedForShowcase).toBe(true);
      expect(mockPrismaService.camp_participations.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if participation not found', async () => {
      mockPrismaService.camp_participations.findUnique.mockResolvedValue(null);

      await expect(
        service.evaluateParticipant('participation-123', {
          performanceRating: 8,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelRegistration', () => {
    it('should cancel registration and free up spot', async () => {
      const mockParticipation = {
        id: 'participation-123',
        campId: 'camp-123',
        playerId: 'player-123',
        players: {
          id: 'player-123',
          userId: 'user-123',
        },
        player: {
          userId: 'user-123',
        },
        camp: {
          id: 'camp-123',
        },
      };

      mockPrismaService.camp_participations.findUnique.mockResolvedValue(mockParticipation);
      mockPrismaService.camp_participations.update.mockResolvedValue({
        ...mockParticipation,
        status: ParticipationStatus.CANCELLED,
      });
      mockPrismaService.camps.update.mockResolvedValue({});

      const result = await service.cancelRegistration('user-123', 'participation-123');

      expect(result.message).toBe('Inscription annulée avec succès');
      expect(mockPrismaService.camps.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'camp-123' },
          data: {
            availableSpots: {
              increment: 1,
            },
          },
        }),
      );
    });

    it('should throw ForbiddenException if user is not the participant', async () => {
      const mockParticipation = {
        id: 'participation-123',
        campId: 'camp-123',
        playerId: 'player-123',
        players: {
          id: 'player-123',
          userId: 'other-user',
        },
        player: {
          userId: 'other-user',
        },
        camp: {
          id: 'camp-123',
        },
      };

      mockPrismaService.camp_participations.findUnique.mockResolvedValue(mockParticipation);

      await expect(service.cancelRegistration('user-123', 'participation-123')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
