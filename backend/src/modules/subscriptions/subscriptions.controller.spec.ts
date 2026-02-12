import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExecutionContext, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

describe('SubscriptionsController', () => {
  let controller: SubscriptionsController;
  let service: jest.Mocked<SubscriptionsService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  const mockSubscription = {
    id: 'sub-123',
    userId: 'user-123',
    tier: SubscriptionTier.BASIC,
    status: SubscriptionStatus.ACTIVE,
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_stripe_123',
    stripePriceId: 'price_123',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    cancelAt: null,
    trialEndsAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    users: {
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  };

  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionsController],
      providers: [
        {
          provide: SubscriptionsService,
          useValue: {
            getMySubscription: jest.fn(),
            createOrUpdateSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            reactivateSubscription: jest.fn(),
            changeTier: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .compile();

    controller = module.get<SubscriptionsController>(SubscriptionsController);
    service = module.get(SubscriptionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPricing', () => {
    it('should return pricing plans successfully', () => {
      const result = controller.getPricing();

      expect(result).toBeDefined();
      expect(result.plans).toBeDefined();
      expect(Array.isArray(result.plans)).toBe(true);
      expect(result.currency).toBe('EUR');
      expect(result.billingCycle).toEqual(['monthly', 'yearly']);
      expect(result.updatedAt).toBe('2025-11-06');
      expect(result.notes).toBeDefined();
      expect(Array.isArray(result.notes)).toBe(true);
    });

    it('should return pricing plans without authentication', () => {
      const result = controller.getPricing();

      expect(result).toBeDefined();
      expect(result.plans).toBeDefined();
    });

    it('should include all tier information in pricing plans', () => {
      const result = controller.getPricing();

      expect(result.plans.length).toBeGreaterThan(0);
      result.plans.forEach((plan) => {
        expect(plan).toHaveProperty('tier');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('description');
        expect(plan).toHaveProperty('features');
      });
    });

    it('should include pricing notes', () => {
      const result = controller.getPricing();

      expect(result.notes).toContain('Prices increased by +150% based on market analysis');
      expect(result.notes.length).toBe(4);
    });
  });

  describe('getMySubscription', () => {
    it('should get user subscription successfully', async () => {
      service.getMySubscription.mockResolvedValue(mockSubscription);

      const result = await controller.getMySubscription(mockRequest);

      expect(result).toEqual(mockSubscription);
      expect(service.getMySubscription).toHaveBeenCalledWith('user-123');
      expect(service.getMySubscription).toHaveBeenCalledTimes(1);
    });

    it('should extract userId from request user object', async () => {
      service.getMySubscription.mockResolvedValue(mockSubscription);

      await controller.getMySubscription(mockRequest);

      expect(service.getMySubscription).toHaveBeenCalledWith(mockRequest.user.id);
    });

    it('should return subscription with user details', async () => {
      const subscriptionWithUser = {
        ...mockSubscription,
        users: mockUser,
      };

      service.getMySubscription.mockResolvedValue(subscriptionWithUser);

      const result = await controller.getMySubscription(mockRequest);

      expect(result.users).toEqual(mockUser);
      expect(result.userId).toBe('user-123');
    });

    it('should create FREE subscription if none exists', async () => {
      const freeSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.FREE,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
        endDate: null,
      };

      service.getMySubscription.mockResolvedValue(freeSubscription);

      const result = await controller.getMySubscription(mockRequest);

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.stripeSubscriptionId).toBeNull();
    });

    it('should handle NotFoundException when user not found', async () => {
      service.getMySubscription.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.getMySubscription(mockRequest)).rejects.toThrow(NotFoundException);
      await expect(controller.getMySubscription(mockRequest)).rejects.toThrow('User not found');
    });

    it('should get subscriptions with different statuses', async () => {
      const statuses = [
        SubscriptionStatus.ACTIVE,
        SubscriptionStatus.CANCELLED,
        SubscriptionStatus.PAST_DUE,
        SubscriptionStatus.TRIAL,
        SubscriptionStatus.EXPIRED,
      ];

      for (const status of statuses) {
        const subscription = {
          ...mockSubscription,
          status,
        };

        service.getMySubscription.mockResolvedValue(subscription);

        const result = await controller.getMySubscription(mockRequest);

        expect(result.status).toBe(status);
      }
    });

    it('should get subscriptions for different tiers', async () => {
      const tiers = [
        SubscriptionTier.FREE,
        SubscriptionTier.BASIC,
        SubscriptionTier.GOLD,
        SubscriptionTier.PRO,
        SubscriptionTier.ENTERPRISE,
      ];

      for (const tier of tiers) {
        const subscription = {
          ...mockSubscription,
          tier,
        };

        service.getMySubscription.mockResolvedValue(subscription);

        const result = await controller.getMySubscription(mockRequest);

        expect(result.tier).toBe(tier);
      }
    });
  });

  describe('createOrUpdateSubscription', () => {
    it('should create subscription successfully', async () => {
      const dto = {
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_123',
      };

      service.createOrUpdateSubscription.mockResolvedValue(mockSubscription);

      const result = await controller.createOrUpdateSubscription(mockRequest, dto);

      expect(result).toEqual(mockSubscription);
      expect(service.createOrUpdateSubscription).toHaveBeenCalledWith('user-123', dto);
      expect(service.createOrUpdateSubscription).toHaveBeenCalledTimes(1);
    });

    it('should extract userId from request user object', async () => {
      const dto = {
        tier: SubscriptionTier.GOLD,
      };

      service.createOrUpdateSubscription.mockResolvedValue(mockSubscription);

      await controller.createOrUpdateSubscription(mockRequest, dto);

      expect(service.createOrUpdateSubscription).toHaveBeenCalledWith(mockRequest.user.id, dto);
    });

    it('should create subscription for different tiers', async () => {
      const tiers = [
        SubscriptionTier.FREE,
        SubscriptionTier.BASIC,
        SubscriptionTier.GOLD,
        SubscriptionTier.PRO,
        SubscriptionTier.ENTERPRISE,
      ];

      for (const tier of tiers) {
        const dto = {
          tier,
          stripePriceId: `price_${tier.toLowerCase()}`,
        };

        service.createOrUpdateSubscription.mockResolvedValue({
          ...mockSubscription,
          tier,
        });

        const result = await controller.createOrUpdateSubscription(mockRequest, dto);

        expect(result.tier).toBe(tier);
        expect(service.createOrUpdateSubscription).toHaveBeenCalledWith('user-123', dto);
      }
    });

    it('should create FREE subscription without stripePriceId', async () => {
      const dto = {
        tier: SubscriptionTier.FREE,
      };

      const freeSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.FREE,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripePriceId: null,
      };

      service.createOrUpdateSubscription.mockResolvedValue(freeSubscription);

      const result = await controller.createOrUpdateSubscription(mockRequest, dto);

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.stripePriceId).toBeNull();
    });

    it('should create subscription with optional stripePriceId', async () => {
      const dto = {
        tier: SubscriptionTier.PRO,
      };

      service.createOrUpdateSubscription.mockResolvedValue(mockSubscription);

      const result = await controller.createOrUpdateSubscription(mockRequest, dto);

      expect(result).toBeDefined();
      expect(service.createOrUpdateSubscription).toHaveBeenCalledWith('user-123', dto);
    });

    it('should update existing subscription', async () => {
      const dto = {
        tier: SubscriptionTier.GOLD,
        stripePriceId: 'price_gold_123',
      };

      const updatedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.GOLD,
        stripePriceId: 'price_gold_123',
      };

      service.createOrUpdateSubscription.mockResolvedValue(updatedSubscription);

      const result = await controller.createOrUpdateSubscription(mockRequest, dto);

      expect(result.tier).toBe(SubscriptionTier.GOLD);
      expect(result.stripePriceId).toBe('price_gold_123');
    });

    it('should handle NotFoundException when user not found', async () => {
      const dto = {
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_123',
      };

      service.createOrUpdateSubscription.mockRejectedValue(
        new NotFoundException('Utilisateur non trouvé'),
      );

      await expect(controller.createOrUpdateSubscription(mockRequest, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.createOrUpdateSubscription(mockRequest, dto)).rejects.toThrow(
        'Utilisateur non trouvé',
      );
    });

    it('should handle BadRequestException for invalid tier', async () => {
      const dto = {
        tier: 'INVALID_TIER' as any,
      };

      service.createOrUpdateSubscription.mockRejectedValue(
        new BadRequestException('Invalid subscription tier'),
      );

      await expect(controller.createOrUpdateSubscription(mockRequest, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle Stripe errors', async () => {
      const dto = {
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_123',
      };

      service.createOrUpdateSubscription.mockRejectedValue(new Error('Stripe API error'));

      await expect(controller.createOrUpdateSubscription(mockRequest, dto)).rejects.toThrow(
        'Stripe API error',
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const dto = {
        immediately: false,
        reason: 'No longer needed',
      };

      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        cancelAt: new Date(),
      };

      service.cancelSubscription.mockResolvedValue(cancelledSubscription);

      const result = await controller.cancelSubscription(mockRequest, dto);

      expect(result).toEqual(cancelledSubscription);
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(service.cancelSubscription).toHaveBeenCalledWith('user-123', dto);
      expect(service.cancelSubscription).toHaveBeenCalledTimes(1);
    });

    it('should extract userId from request user object', async () => {
      const dto = {
        immediately: true,
      };

      service.cancelSubscription.mockResolvedValue(mockSubscription);

      await controller.cancelSubscription(mockRequest, dto);

      expect(service.cancelSubscription).toHaveBeenCalledWith(mockRequest.user.id, dto);
    });

    it('should cancel subscription immediately', async () => {
      const dto = {
        immediately: true,
        reason: 'Immediate cancellation',
      };

      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
        cancelAt: new Date(),
      };

      service.cancelSubscription.mockResolvedValue(cancelledSubscription);

      const result = await controller.cancelSubscription(mockRequest, dto);

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(result.cancelAt).toBeDefined();
    });

    it('should cancel subscription at end of period', async () => {
      const dto = {
        immediately: false,
      };

      const cancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        cancelAt: mockSubscription.endDate,
      };

      service.cancelSubscription.mockResolvedValue(cancelledSubscription);

      const result = await controller.cancelSubscription(mockRequest, dto);

      expect(result.cancelAt).toEqual(mockSubscription.endDate);
    });

    it('should cancel subscription with reason', async () => {
      const dto = {
        immediately: false,
        reason: 'Found better alternative',
      };

      service.cancelSubscription.mockResolvedValue(mockSubscription);

      await controller.cancelSubscription(mockRequest, dto);

      expect(service.cancelSubscription).toHaveBeenCalledWith('user-123', dto);
    });

    it('should cancel subscription without reason', async () => {
      const dto = {
        immediately: true,
      };

      service.cancelSubscription.mockResolvedValue(mockSubscription);

      await controller.cancelSubscription(mockRequest, dto);

      expect(service.cancelSubscription).toHaveBeenCalledWith('user-123', dto);
    });

    it('should handle NotFoundException when subscription not found', async () => {
      const dto = {
        immediately: false,
      };

      service.cancelSubscription.mockRejectedValue(
        new NotFoundException('Aucun abonnement trouvé'),
      );

      await expect(controller.cancelSubscription(mockRequest, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.cancelSubscription(mockRequest, dto)).rejects.toThrow(
        'Aucun abonnement trouvé',
      );
    });

    it('should handle BadRequestException when cancelling FREE tier', async () => {
      const dto = {
        immediately: false,
      };

      service.cancelSubscription.mockRejectedValue(
        new BadRequestException("Impossible d'annuler un abonnement gratuit"),
      );

      await expect(controller.cancelSubscription(mockRequest, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.cancelSubscription(mockRequest, dto)).rejects.toThrow(
        "Impossible d'annuler un abonnement gratuit",
      );
    });

    it('should handle BadRequestException when no Stripe subscription found', async () => {
      const dto = {
        immediately: false,
      };

      service.cancelSubscription.mockRejectedValue(
        new BadRequestException('Aucun abonnement Stripe trouvé'),
      );

      await expect(controller.cancelSubscription(mockRequest, dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.cancelSubscription(mockRequest, dto)).rejects.toThrow(
        'Aucun abonnement Stripe trouvé',
      );
    });

    it('should be idempotent when subscription already cancelled', async () => {
      const dto = {
        immediately: false,
      };

      const alreadyCancelledSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.CANCELLED,
      };

      service.cancelSubscription.mockResolvedValue(alreadyCancelledSubscription);

      const result = await controller.cancelSubscription(mockRequest, dto);

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate subscription successfully', async () => {
      const reactivatedSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        cancelAt: null,
      };

      service.reactivateSubscription.mockResolvedValue(reactivatedSubscription);

      const result = await controller.reactivateSubscription(mockRequest);

      expect(result).toEqual(reactivatedSubscription);
      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.cancelAt).toBeNull();
      expect(service.reactivateSubscription).toHaveBeenCalledWith('user-123');
      expect(service.reactivateSubscription).toHaveBeenCalledTimes(1);
    });

    it('should extract userId from request user object', async () => {
      service.reactivateSubscription.mockResolvedValue(mockSubscription);

      await controller.reactivateSubscription(mockRequest);

      expect(service.reactivateSubscription).toHaveBeenCalledWith(mockRequest.user.id);
    });

    it('should clear cancelAt date when reactivating', async () => {
      const reactivatedSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
        cancelAt: null,
      };

      service.reactivateSubscription.mockResolvedValue(reactivatedSubscription);

      const result = await controller.reactivateSubscription(mockRequest);

      expect(result.cancelAt).toBeNull();
    });

    it('should handle NotFoundException when subscription not found', async () => {
      service.reactivateSubscription.mockRejectedValue(
        new NotFoundException('Aucun abonnement trouvé'),
      );

      await expect(controller.reactivateSubscription(mockRequest)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.reactivateSubscription(mockRequest)).rejects.toThrow(
        'Aucun abonnement trouvé',
      );
    });

    it('should handle BadRequestException when subscription not cancelled', async () => {
      service.reactivateSubscription.mockRejectedValue(
        new BadRequestException("L'abonnement n'est pas annulé"),
      );

      await expect(controller.reactivateSubscription(mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.reactivateSubscription(mockRequest)).rejects.toThrow(
        "L'abonnement n'est pas annulé",
      );
    });

    it('should handle BadRequestException when no Stripe subscription found', async () => {
      service.reactivateSubscription.mockRejectedValue(
        new BadRequestException('Aucun abonnement Stripe trouvé'),
      );

      await expect(controller.reactivateSubscription(mockRequest)).rejects.toThrow(
        BadRequestException,
      );
      await expect(controller.reactivateSubscription(mockRequest)).rejects.toThrow(
        'Aucun abonnement Stripe trouvé',
      );
    });

    it('should be idempotent when subscription already active', async () => {
      const activeSubscription = {
        ...mockSubscription,
        status: SubscriptionStatus.ACTIVE,
      };

      service.reactivateSubscription.mockResolvedValue(activeSubscription);

      const result = await controller.reactivateSubscription(mockRequest);

      expect(result.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should handle Stripe errors', async () => {
      service.reactivateSubscription.mockRejectedValue(new Error('Stripe API error'));

      await expect(controller.reactivateSubscription(mockRequest)).rejects.toThrow(
        'Stripe API error',
      );
    });
  });

  describe('changeTier', () => {
    it('should change tier successfully (upgrade)', async () => {
      const dto = {
        tier: SubscriptionTier.PRO,
        stripePriceId: 'price_pro_123',
      };

      const updatedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.PRO,
        stripePriceId: 'price_pro_123',
      };

      service.changeTier.mockResolvedValue(updatedSubscription);

      const result = await controller.changeTier(mockRequest, dto);

      expect(result).toEqual(updatedSubscription);
      expect(result.tier).toBe(SubscriptionTier.PRO);
      expect(service.changeTier).toHaveBeenCalledWith('user-123', dto);
      expect(service.changeTier).toHaveBeenCalledTimes(1);
    });

    it('should extract userId from request user object', async () => {
      const dto = {
        tier: SubscriptionTier.GOLD,
      };

      service.changeTier.mockResolvedValue(mockSubscription);

      await controller.changeTier(mockRequest, dto);

      expect(service.changeTier).toHaveBeenCalledWith(mockRequest.user.id, dto);
    });

    it('should upgrade from BASIC to GOLD', async () => {
      const dto = {
        tier: SubscriptionTier.GOLD,
        stripePriceId: 'price_gold_123',
      };

      const updatedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.GOLD,
        stripePriceId: 'price_gold_123',
      };

      service.changeTier.mockResolvedValue(updatedSubscription);

      const result = await controller.changeTier(mockRequest, dto);

      expect(result.tier).toBe(SubscriptionTier.GOLD);
    });

    it('should upgrade from BASIC to PRO', async () => {
      const dto = {
        tier: SubscriptionTier.PRO,
        stripePriceId: 'price_pro_123',
      };

      const updatedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.PRO,
      };

      service.changeTier.mockResolvedValue(updatedSubscription);

      const result = await controller.changeTier(mockRequest, dto);

      expect(result.tier).toBe(SubscriptionTier.PRO);
    });

    it('should downgrade from PRO to BASIC', async () => {
      const dto = {
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_basic_123',
      };

      const currentSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.PRO,
      };

      const downgradedSubscription = {
        ...currentSubscription,
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_basic_123',
      };

      service.changeTier.mockResolvedValue(downgradedSubscription);

      const result = await controller.changeTier(mockRequest, dto);

      expect(result.tier).toBe(SubscriptionTier.BASIC);
    });

    it('should change to FREE tier', async () => {
      const dto = {
        tier: SubscriptionTier.FREE,
      };

      const freeSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.FREE,
        stripeSubscriptionId: null,
        stripePriceId: null,
        endDate: null,
      };

      service.changeTier.mockResolvedValue(freeSubscription);

      const result = await controller.changeTier(mockRequest, dto);

      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.stripePriceId).toBeNull();
    });

    it('should upgrade from FREE to paid tier', async () => {
      const dto = {
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_basic_123',
      };

      const upgradedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_basic_123',
      };

      service.changeTier.mockResolvedValue(upgradedSubscription);

      const result = await controller.changeTier(mockRequest, dto);

      expect(result.tier).toBe(SubscriptionTier.BASIC);
      expect(result.stripePriceId).toBe('price_basic_123');
    });

    it('should change tier without stripePriceId (auto-detect)', async () => {
      const dto = {
        tier: SubscriptionTier.GOLD,
      };

      service.changeTier.mockResolvedValue(mockSubscription);

      await controller.changeTier(mockRequest, dto);

      expect(service.changeTier).toHaveBeenCalledWith('user-123', dto);
    });

    it('should handle NotFoundException when subscription not found', async () => {
      const dto = {
        tier: SubscriptionTier.PRO,
      };

      service.changeTier.mockRejectedValue(new NotFoundException('Aucun abonnement trouvé'));

      await expect(controller.changeTier(mockRequest, dto)).rejects.toThrow(NotFoundException);
      await expect(controller.changeTier(mockRequest, dto)).rejects.toThrow(
        'Aucun abonnement trouvé',
      );
    });

    it('should handle BadRequestException for invalid tier change', async () => {
      const dto = {
        tier: 'INVALID_TIER' as any,
      };

      service.changeTier.mockRejectedValue(new BadRequestException('Invalid subscription tier'));

      await expect(controller.changeTier(mockRequest, dto)).rejects.toThrow(BadRequestException);
    });

    it('should handle Stripe errors when changing tier', async () => {
      const dto = {
        tier: SubscriptionTier.PRO,
        stripePriceId: 'price_pro_123',
      };

      service.changeTier.mockRejectedValue(new Error('Stripe API error'));

      await expect(controller.changeTier(mockRequest, dto)).rejects.toThrow('Stripe API error');
    });

    it('should update endDate when changing tier', async () => {
      const dto = {
        tier: SubscriptionTier.PRO,
        stripePriceId: 'price_pro_123',
      };

      const newEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const updatedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.PRO,
        endDate: newEndDate,
      };

      service.changeTier.mockResolvedValue(updatedSubscription);

      const result = await controller.changeTier(mockRequest, dto);

      expect(result.endDate).toEqual(newEndDate);
    });
  });

  describe('authentication and authorization', () => {
    it('should NOT require authentication for getPricing', () => {
      const result = controller.getPricing();

      expect(result).toBeDefined();
    });

    it('should require authentication for getMySubscription', async () => {
      service.getMySubscription.mockResolvedValue(mockSubscription);

      const result = await controller.getMySubscription(mockRequest);

      expect(result).toBeDefined();
      expect(mockRequest.user).toBeDefined();
    });

    it('should require authentication for createOrUpdateSubscription', async () => {
      const dto = {
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_123',
      };

      service.createOrUpdateSubscription.mockResolvedValue(mockSubscription);

      const result = await controller.createOrUpdateSubscription(mockRequest, dto);

      expect(result).toBeDefined();
      expect(mockRequest.user).toBeDefined();
    });

    it('should require authentication for cancelSubscription', async () => {
      const dto = {
        immediately: false,
      };

      service.cancelSubscription.mockResolvedValue(mockSubscription);

      const result = await controller.cancelSubscription(mockRequest, dto);

      expect(result).toBeDefined();
      expect(mockRequest.user).toBeDefined();
    });

    it('should require authentication for reactivateSubscription', async () => {
      service.reactivateSubscription.mockResolvedValue(mockSubscription);

      const result = await controller.reactivateSubscription(mockRequest);

      expect(result).toBeDefined();
      expect(mockRequest.user).toBeDefined();
    });

    it('should require authentication for changeTier', async () => {
      const dto = {
        tier: SubscriptionTier.PRO,
      };

      service.changeTier.mockResolvedValue(mockSubscription);

      const result = await controller.changeTier(mockRequest, dto);

      expect(result).toBeDefined();
      expect(mockRequest.user).toBeDefined();
    });

    it('should use userId from authenticated user', async () => {
      service.getMySubscription.mockResolvedValue(mockSubscription);

      await controller.getMySubscription(mockRequest);

      expect(service.getMySubscription).toHaveBeenCalledWith('user-123');
    });
  });

  describe('error handling', () => {
    it('should handle service timeout errors', async () => {
      const dto = {
        tier: SubscriptionTier.BASIC,
      };

      service.createOrUpdateSubscription.mockRejectedValue(new Error('Request timeout'));

      await expect(controller.createOrUpdateSubscription(mockRequest, dto)).rejects.toThrow(
        'Request timeout',
      );
    });

    it('should handle network errors', async () => {
      service.getMySubscription.mockRejectedValue(new Error('Network error'));

      await expect(controller.getMySubscription(mockRequest)).rejects.toThrow('Network error');
    });

    it('should handle database errors', async () => {
      const dto = {
        tier: SubscriptionTier.BASIC,
      };

      service.createOrUpdateSubscription.mockRejectedValue(new Error('Database connection error'));

      await expect(controller.createOrUpdateSubscription(mockRequest, dto)).rejects.toThrow(
        'Database connection error',
      );
    });

    it('should handle Stripe service unavailable', async () => {
      const dto = {
        immediately: false,
      };

      service.cancelSubscription.mockRejectedValue(new Error('Stripe service unavailable'));

      await expect(controller.cancelSubscription(mockRequest, dto)).rejects.toThrow(
        'Stripe service unavailable',
      );
    });

    it('should handle invalid DTO validation errors', async () => {
      const invalidDto = {
        tier: null as any,
      };

      service.createOrUpdateSubscription.mockRejectedValue(
        new BadRequestException('Validation failed'),
      );

      await expect(controller.createOrUpdateSubscription(mockRequest, invalidDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('subscription lifecycle', () => {
    it('should handle complete subscription lifecycle', async () => {
      // Create subscription
      const createDto = {
        tier: SubscriptionTier.BASIC,
        stripePriceId: 'price_123',
      };

      service.createOrUpdateSubscription.mockResolvedValue(mockSubscription);

      const created = await controller.createOrUpdateSubscription(mockRequest, createDto);

      expect(created.tier).toBe(SubscriptionTier.BASIC);

      // Get subscription
      service.getMySubscription.mockResolvedValue(mockSubscription);

      const fetched = await controller.getMySubscription(mockRequest);

      expect(fetched).toEqual(mockSubscription);

      // Change tier
      const changeTierDto = {
        tier: SubscriptionTier.PRO,
        stripePriceId: 'price_pro_123',
      };

      const upgradedSubscription = {
        ...mockSubscription,
        tier: SubscriptionTier.PRO,
      };

      service.changeTier.mockResolvedValue(upgradedSubscription);

      const upgraded = await controller.changeTier(mockRequest, changeTierDto);

      expect(upgraded.tier).toBe(SubscriptionTier.PRO);

      // Cancel subscription
      const cancelDto = {
        immediately: false,
        reason: 'Testing lifecycle',
      };

      const cancelledSubscription = {
        ...upgradedSubscription,
        status: SubscriptionStatus.CANCELLED,
        cancelAt: new Date(),
      };

      service.cancelSubscription.mockResolvedValue(cancelledSubscription);

      const cancelled = await controller.cancelSubscription(mockRequest, cancelDto);

      expect(cancelled.status).toBe(SubscriptionStatus.CANCELLED);

      // Reactivate subscription
      service.reactivateSubscription.mockResolvedValue(upgradedSubscription);

      const reactivated = await controller.reactivateSubscription(mockRequest);

      expect(reactivated.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });
});
