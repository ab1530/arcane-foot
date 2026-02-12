import { Test, TestingModule } from '@nestjs/testing';
import { CoachingService } from './coaching.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CoachingType, CoachingBookingStatus, SubscriptionTier } from '@prisma/client';

describe('CoachingService', () => {
  let service: CoachingService;
  let prismaService: PrismaService;
  let stripeService: StripeService;
  let subscriptionsService: SubscriptionsService;

  const mockPrismaService = {
    coaches: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    coaching_bookings: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    users: {
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
        CoachingService,
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

    service = module.get<CoachingService>(CoachingService);
    prismaService = module.get<PrismaService>(PrismaService);
    stripeService = module.get<StripeService>(StripeService);
    subscriptionsService = module.get<SubscriptionsService>(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCoach', () => {
    it('should create a coach successfully', async () => {
      const createCoachDto = {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'coach@example.com',
        coachingType: CoachingType.MENTAL_COACHING,
        hourlyRate: 80,
      };

      const mockCoach = {
        id: 'coach-123',
        ...createCoachDto,
        currency: 'EUR',
        isActive: true,
      };

      mockPrismaService.coaches.create.mockResolvedValue(mockCoach);

      const result = await service.createCoach(createCoachDto);

      expect(result).toEqual(mockCoach);
      expect(mockPrismaService.coaches.create).toHaveBeenCalled();
    });
  });

  describe('getAllCoaches', () => {
    it('should return coaches with average ratings', async () => {
      const mockCoaches = [
        {
          id: 'coach-1',
          firstName: 'Jean',
          coachingType: CoachingType.MENTAL_COACHING,
          coaching_bookings: [
            { id: 'b1', userRating: 5 },
            { id: 'b2', userRating: 4 },
          ],
          _count: {
            coaching_bookings: 2,
          },
        },
      ];

      mockPrismaService.coaches.findMany.mockResolvedValue(mockCoaches);

      const result = await service.getAllCoaches();

      expect(result[0].averageRating).toBe(4.5);
      expect(result[0].totalBookings).toBe(2);
    });

    it('should filter coaches by type and city', async () => {
      mockPrismaService.coaches.findMany.mockResolvedValue([]);

      await service.getAllCoaches({
        coachingType: CoachingType.MENTAL_COACHING,
        city: 'Paris',
      });

      expect(mockPrismaService.coaches.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            coachingType: CoachingType.MENTAL_COACHING,
            city: {
              contains: 'Paris',
              mode: 'insensitive',
            },
          },
        }),
      );
    });
  });

  describe('getCoachById', () => {
    it('should return coach with average rating', async () => {
      const mockCoach = {
        id: 'coach-123',
        firstName: 'Jean',
        coaching_bookings: [
          { id: 'b1', userRating: 5 },
          { id: 'b2', userRating: 3 },
        ],
        _count: {
          coaching_bookings: 2,
        },
      };

      mockPrismaService.coaches.findUnique.mockResolvedValue(mockCoach);

      const result = await service.getCoachById('coach-123');

      expect(result.averageRating).toBe(4); // (5+3)/2
      expect(result.totalBookings).toBe(2);
    });

    it('should throw NotFoundException if coach not found', async () => {
      mockPrismaService.coaches.findUnique.mockResolvedValue(null);

      await expect(service.getCoachById('coach-123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBooking', () => {
    it('should create booking with payment intent', async () => {
      const mockCoach = {
        id: 'coach-123',
        firstName: 'Jean',
        isActive: true,
        hourlyRate: 80,
        currency: 'EUR',
        minTierRequired: SubscriptionTier.BASIC,
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
      };

      const mockPaymentIntent = {
        id: 'pi-123',
      };

      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        coachId: 'coach-123',
        price: 80,
        paymentIntentId: 'pi-123',
        status: CoachingBookingStatus.PENDING,
      };

      mockPrismaService.coaches.findUnique.mockResolvedValue(mockCoach);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(true);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);
      mockPrismaService.coaching_bookings.create.mockResolvedValue(mockBooking);

      const result = await service.createBooking('user-123', {
        coachId: 'coach-123',
        sessionDate: '2025-12-15T14:00:00Z',
        duration: 60,
      });

      expect(result.price).toBe(80);
      expect(result.paymentIntentId).toBe('pi-123');
      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        8000, // 80 EUR in cents
        'eur',
        undefined,
        expect.objectContaining({
          coachId: 'coach-123',
          userId: 'user-123',
        }),
      );
    });

    it('should calculate price for custom duration', async () => {
      const mockCoach = {
        id: 'coach-123',
        isActive: true,
        hourlyRate: 80,
        currency: 'EUR',
        minTierRequired: null,
      };

      const mockUser = { id: 'user-123', email: 'user@example.com' };
      mockPrismaService.coaches.findUnique.mockResolvedValue(mockCoach);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockStripeService.createPaymentIntent.mockResolvedValue({ id: 'pi-123' });
      mockPrismaService.coaching_bookings.create.mockResolvedValue({
        id: 'booking-123',
        price: 40, // 30 minutes = half price
      });

      const result = await service.createBooking('user-123', {
        coachId: 'coach-123',
        sessionDate: '2025-12-15T14:00:00Z',
        duration: 30,
      });

      expect(mockStripeService.createPaymentIntent).toHaveBeenCalledWith(
        4000, // (80/60)*30 = 40 EUR = 4000 cents
        'eur',
        undefined,
        expect.any(Object),
      );
    });

    it('should throw BadRequestException if coach is not active', async () => {
      const mockCoach = {
        id: 'coach-123',
        isActive: false,
      };

      mockPrismaService.coaches.findUnique.mockResolvedValue(mockCoach);

      await expect(
        service.createBooking('user-123', {
          coachId: 'coach-123',
          sessionDate: '2025-12-15T14:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if user does not have required tier', async () => {
      const mockCoach = {
        id: 'coach-123',
        isActive: true,
        minTierRequired: SubscriptionTier.GOLD,
      };

      mockPrismaService.coaches.findUnique.mockResolvedValue(mockCoach);
      mockSubscriptionsService.hasMinimumTier.mockResolvedValue(false);

      await expect(
        service.createBooking('user-123', {
          coachId: 'coach-123',
          sessionDate: '2025-12-15T14:00:00Z',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel booking successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        status: CoachingBookingStatus.CONFIRMED,
      };

      mockPrismaService.coaching_bookings.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.coaching_bookings.update.mockResolvedValue({
        ...mockBooking,
        status: CoachingBookingStatus.CANCELLED,
      });

      const result = await service.cancelBooking('user-123', 'booking-123');

      expect(result.message).toBe('Réservation annulée avec succès');
    });

    it('should throw ForbiddenException if user is not the booking owner', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'other-user',
      };

      mockPrismaService.coaching_bookings.findUnique.mockResolvedValue(mockBooking);

      await expect(service.cancelBooking('user-123', 'booking-123')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw BadRequestException if booking is already completed', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        status: CoachingBookingStatus.COMPLETED,
      };

      mockPrismaService.coaching_bookings.findUnique.mockResolvedValue(mockBooking);

      await expect(service.cancelBooking('user-123', 'booking-123')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('rateBooking', () => {
    it('should rate booking successfully', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        status: CoachingBookingStatus.COMPLETED,
      };

      const ratingDto = {
        userRating: 5,
        userFeedback: 'Excellente séance!',
      };

      mockPrismaService.coaching_bookings.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.coaching_bookings.update.mockResolvedValue({
        ...mockBooking,
        ...ratingDto,
      });

      const result = await service.rateBooking('user-123', 'booking-123', ratingDto);

      expect(result.userRating).toBe(5);
      expect(result.userFeedback).toBe('Excellente séance!');
    });

    it('should throw BadRequestException if booking is not completed', async () => {
      const mockBooking = {
        id: 'booking-123',
        userId: 'user-123',
        status: CoachingBookingStatus.CONFIRMED,
      };

      mockPrismaService.coaching_bookings.findUnique.mockResolvedValue(mockBooking);

      await expect(
        service.rateBooking('user-123', 'booking-123', {
          userRating: 5,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('completeBooking', () => {
    it('should mark booking as completed', async () => {
      const mockBooking = {
        id: 'booking-123',
        status: CoachingBookingStatus.CONFIRMED,
      };

      mockPrismaService.coaching_bookings.findUnique.mockResolvedValue(mockBooking);
      mockPrismaService.coaching_bookings.update.mockResolvedValue({
        ...mockBooking,
        status: CoachingBookingStatus.COMPLETED,
        completedAt: new Date(),
      });

      const result = await service.completeBooking('booking-123', 'Excellent session');

      expect(result.message).toBe('Séance marquée comme terminée');
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment and update booking status', async () => {
      const mockBooking = {
        id: 'booking-123',
        paymentIntentId: 'pi-123',
        status: CoachingBookingStatus.PENDING,
      };

      mockPrismaService.coaching_bookings.findFirst.mockResolvedValue(mockBooking);
      mockPrismaService.coaching_bookings.update.mockResolvedValue({
        ...mockBooking,
        hasPaid: true,
        status: CoachingBookingStatus.CONFIRMED,
      });

      const result = await service.confirmPayment('pi-123');

      expect(result.message).toBe('Paiement confirmé');
      expect(mockPrismaService.coaching_bookings.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            hasPaid: true,
            status: CoachingBookingStatus.CONFIRMED,
          }),
        }),
      );
    });
  });
});
