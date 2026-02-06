import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prismaService: PrismaService;
  let stripeService: StripeService;

  const mockPrismaService = {
    subscriptions: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    users: {
      findUnique: jest.fn(),
    },
  };

  const mockStripeService = {
    createCustomer: jest.fn(),
    createSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
    updateSubscription: jest.fn(),
    reactivateSubscription: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('sk_test_mock_key'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: StripeService,
          useValue: mockStripeService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prismaService = module.get<PrismaService>(PrismaService);
    stripeService = module.get<StripeService>(StripeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMySubscription', () => {
    it('should return user subscription', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        status: SubscriptionStatus.ACTIVE,
        users: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);

      const result = await service.getMySubscription('user-123');

      expect(result).toEqual(mockSubscription);
      expect(mockPrismaService.subscriptions.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });

    it('should create FREE subscription if subscription not found', async () => {
      const mockCreatedSubscription = {
        id: 'sub-new',
        userId: 'user-123',
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        users: {
          id: 'user-123',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(null);
      mockPrismaService.subscriptions.create.mockResolvedValue(mockCreatedSubscription);

      const result = await service.getMySubscription('user-123');

      expect(result).toEqual(mockCreatedSubscription);
      expect(mockPrismaService.subscriptions.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
        }),
        include: {
          users: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    });
  });

  describe('createOrUpdateSubscription - FREE tier', () => {
    it('should create FREE subscription without Stripe', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.subscriptions.findUnique.mockResolvedValue(null);
      mockPrismaService.subscriptions.create.mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
      });

      const result = await service.createOrUpdateSubscription('user-123', {
        tier: SubscriptionTier.FREE,
      });

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(mockStripeService.createCustomer).not.toHaveBeenCalled();
      expect(mockStripeService.createSubscription).not.toHaveBeenCalled();
    });

    it('should update existing subscription to FREE and cancel Stripe subscription', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      const mockExistingSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockExistingSubscription);
      mockStripeService.cancelSubscription.mockResolvedValue({});
      mockPrismaService.subscriptions.update.mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: null,
      });

      const result = await service.createOrUpdateSubscription('user-123', {
        tier: SubscriptionTier.FREE,
      });

      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith('stripe-sub-123', true);
      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.stripeSubscriptionId).toBeNull();
    });
  });

  describe('createOrUpdateSubscription - Paid tier', () => {
    it('should create subscription with Stripe for paid tier', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockStripeCustomer = {
        id: 'stripe-cus-123',
      };

      const mockStripeSubscription = {
        id: 'stripe-sub-123',
        current_period_end: 1735689600, // 2025-01-01
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.subscriptions.findUnique.mockResolvedValue(null);
      mockStripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
      mockStripeService.createSubscription.mockResolvedValue(mockStripeSubscription);
      mockPrismaService.subscriptions.create.mockResolvedValue({
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: 'stripe-cus-123',
        stripeSubscriptionId: 'stripe-sub-123',
      });

      const result = await service.createOrUpdateSubscription('user-123', {
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price-123',
      });

      expect(mockStripeService.createCustomer).toHaveBeenCalledWith(
        'test@example.com',
        'John Doe',
        { userId: 'user-123' },
      );
      expect(mockStripeService.createSubscription).toHaveBeenCalledWith(
        'stripe-cus-123',
        'price-123',
        { userId: 'user-123', tier: SubscriptionTier.BASIC },
      );
      expect(result.tier).toBe(SubscriptionTier.BASIC);
    });

    it('should update existing subscription to paid tier', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockExistingSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.FREE,
        stripeCustomerId: 'stripe-cus-123',
      };

      const mockStripeSubscription = {
        id: 'stripe-sub-456',
        current_period_end: 1735689600,
      };

      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockExistingSubscription);
      mockStripeService.createSubscription.mockResolvedValue(mockStripeSubscription);
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockExistingSubscription,
        tier: SubscriptionTier.GOLD,
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: 'stripe-sub-456',
      });

      const result = await service.createOrUpdateSubscription('user-123', {
        tier: SubscriptionTier.GOLD,
        stripePriceId: 'price-gold',
      });

      expect(mockStripeService.createSubscription).toHaveBeenCalled();
      expect(mockPrismaService.subscriptions.update).toHaveBeenCalled();
      expect(result.tier).toBe(SubscriptionTier.GOLD);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.users.findUnique.mockResolvedValue(null);

      await expect(
        service.createOrUpdateSubscription('user-999', {
          tier: SubscriptionTier.BASIC,
          stripePriceId: 'price-123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockStripeService.cancelSubscription.mockResolvedValue({});
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      });

      const result = await service.cancelSubscription('user-123', {
        immediately: true,
      });

      expect(mockStripeService.cancelSubscription).toHaveBeenCalledWith('stripe-sub-123', true);
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });

    it('should throw BadRequestException for FREE tier', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.FREE,
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);

      await expect(service.cancelSubscription('user-123', { immediately: false })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockPrismaService.subscriptions.findUnique.mockResolvedValue(null);

      await expect(service.cancelSubscription('user-999', { immediately: false })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if no Stripe subscription ID', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        stripeSubscriptionId: null,
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);

      await expect(service.cancelSubscription('user-123', { immediately: false })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('hasMinimumTier', () => {
    it('should return true if user has required tier', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.GOLD,
        status: SubscriptionStatus.ACTIVE,
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);

      const result = await service.hasMinimumTier('user-123', SubscriptionTier.BASIC);

      expect(result).toBe(true);
    });

    it('should return false if user tier is below required', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        status: SubscriptionStatus.ACTIVE,
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);

      const result = await service.hasMinimumTier('user-123', SubscriptionTier.GOLD);

      expect(result).toBe(false);
    });

    it('should return false if subscription is not active', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.GOLD,
        status: SubscriptionStatus.CANCELLED,
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);

      const result = await service.hasMinimumTier('user-123', SubscriptionTier.BASIC);

      expect(result).toBe(false);
    });

    it('should return false if no subscription found', async () => {
      mockPrismaService.subscriptions.findUnique.mockResolvedValue(null);

      const result = await service.hasMinimumTier('user-123', SubscriptionTier.BASIC);

      expect(result).toBe(false);
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate cancelled subscription', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        status: SubscriptionStatus.CANCELLED,
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockStripeService.reactivateSubscription.mockResolvedValue({});
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        cancelAt: null,
      });

      const result = await service.reactivateSubscription('user-123');

      expect(mockStripeService.reactivateSubscription).toHaveBeenCalledWith('stripe-sub-123');
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should return subscription unchanged if already active (idempotent)', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);

      const result = await service.reactivateSubscription('user-123');

      expect(result).toEqual(mockSubscription);
      expect(mockStripeService.reactivateSubscription).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockPrismaService.subscriptions.findUnique.mockResolvedValue(null);

      await expect(service.reactivateSubscription('user-999')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no Stripe subscription ID', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        status: SubscriptionStatus.CANCELLED,
        stripeSubscriptionId: null,
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);

      await expect(service.reactivateSubscription('user-123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('changeTier', () => {
    it('should change tier to paid subscription (upgrade)', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        stripeSubscriptionId: 'sub_test_123', // Use mock subscription ID
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.GOLD,
        stripePriceId: 'price-gold',
      });

      const result = await service.changeTier('user-123', {
        tier: SubscriptionTier.GOLD,
        stripePriceId: 'price-gold',
      });

      expect(mockStripeService.updateSubscription).not.toHaveBeenCalled(); // Mock flow doesn't call Stripe
      expect(result.tier).toBe(SubscriptionTier.GOLD);
    });

    it('should change tier to FREE (downgrade and cancel Stripe)', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        stripeSubscriptionId: 'stripe-sub-123',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockStripeService.cancelSubscription.mockResolvedValue({});
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: null,
      });

      const result = await service.changeTier('user-123', {
        tier: SubscriptionTier.FREE,
      });

      expect(result.tier).toBe(SubscriptionTier.FREE);
    });

    it('should throw NotFoundException if subscription not found', async () => {
      mockPrismaService.subscriptions.findUnique.mockResolvedValue(null);

      await expect(
        service.changeTier('user-999', {
          tier: SubscriptionTier.GOLD,
          stripePriceId: 'price-gold',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create new subscription if no Stripe subscription ID exists (upgrade from FREE)', async () => {
      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        tier: SubscriptionTier.FREE,
        stripeSubscriptionId: null,
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockUpdatedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.GOLD,
        stripeSubscriptionId: 'sub_test_gold',
        stripePriceId: 'price-gold',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaService.users.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.subscriptions.update.mockResolvedValue(mockUpdatedSubscription);

      const result = await service.changeTier('user-123', {
        tier: SubscriptionTier.GOLD,
        stripePriceId: 'price-gold',
      });

      expect(result.tier).toBe(SubscriptionTier.GOLD);
    });
  });

  describe('handleStripeWebhook', () => {
    it('should handle customer.subscription.updated event', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'stripe-sub-123',
            status: 'active',
            current_period_end: 1735689600,
          },
        },
      };

      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      });

      await service.handleStripeWebhook(mockEvent);

      expect(mockPrismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: {
          status: SubscriptionStatus.ACTIVE,
          endDate: expect.any(Date),
        },
      });
    });

    it('should handle customer.subscription.updated with past_due status', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'stripe-sub-123',
            status: 'past_due',
            current_period_end: 1735689600,
          },
        },
      };

      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.PAST_DUE,
      });

      await service.handleStripeWebhook(mockEvent);

      expect(mockPrismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: {
          status: SubscriptionStatus.PAST_DUE,
          endDate: expect.any(Date),
        },
      });
    });

    it('should handle customer.subscription.deleted event', async () => {
      const mockEvent = {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'stripe-sub-123',
          },
        },
      };

      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        tier: SubscriptionTier.FREE,
      });

      await service.handleStripeWebhook(mockEvent);

      expect(mockPrismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: {
          status: SubscriptionStatus.CANCELLED,
          tier: SubscriptionTier.FREE,
          stripeSubscriptionId: null,
          stripePriceId: null,
        },
      });
    });

    it('should handle invoice.payment_succeeded event', async () => {
      const mockEvent = {
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            subscription: 'stripe-sub-123',
          },
        },
      };

      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      });

      await service.handleStripeWebhook(mockEvent);

      expect(mockPrismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: {
          status: SubscriptionStatus.ACTIVE,
        },
      });
    });

    it('should handle invoice.payment_failed event', async () => {
      const mockEvent = {
        type: 'invoice.payment_failed',
        data: {
          object: {
            subscription: 'stripe-sub-123',
          },
        },
      };

      const mockSubscription = {
        id: 'sub-123',
        userId: 'user-123',
        stripeSubscriptionId: 'stripe-sub-123',
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(mockSubscription);
      mockPrismaService.subscriptions.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.PAST_DUE,
      });

      await service.handleStripeWebhook(mockEvent);

      expect(mockPrismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: {
          status: SubscriptionStatus.PAST_DUE,
        },
      });
    });

    it('should handle webhook events when subscription not found in database', async () => {
      const mockEvent = {
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'stripe-sub-unknown',
            status: 'active',
            current_period_end: 1735689600,
          },
        },
      };

      mockPrismaService.subscriptions.findUnique.mockResolvedValue(null);

      await service.handleStripeWebhook(mockEvent);

      expect(mockPrismaService.subscriptions.update).not.toHaveBeenCalled();
    });

    it('should log unhandled event types', async () => {
      const mockEvent = {
        type: 'customer.created',
        data: { object: {} },
      };

      await service.handleStripeWebhook(mockEvent);

      // Should not throw error, just log
    });
  });
});
