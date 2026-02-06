import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let stripeService: any;
  let prismaService: any;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    subscriptions: null,
  };

  const mockUserWithSubscription = {
    ...mockUser,
    subscriptions: {
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
    },
  };

  const mockStripeCustomer = {
    id: 'cus_123',
    object: 'customer',
    email: 'test@example.com',
    name: 'John Doe',
    created: Date.now() / 1000,
    livemode: false,
    metadata: { userId: 'user-123' },
  } as unknown as Stripe.Customer;

  const mockStripeSubscription = {
    id: 'sub_stripe_123',
    object: 'subscription',
    customer: 'cus_123',
    status: 'active',
    current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
    current_period_start: Math.floor(Date.now() / 1000),
    latest_invoice: {
      id: 'in_123',
      payment_intent: {
        client_secret: 'pi_123_secret_456',
      },
    },
  } as unknown as Stripe.Subscription;

  const mockPaymentIntent = {
    id: 'pi_123',
    object: 'payment_intent',
    amount: 1000,
    currency: 'eur',
    client_secret: 'pi_123_secret_456',
    status: 'requires_payment_method',
  } as unknown as Stripe.PaymentIntent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: StripeService,
          useValue: {
            createCustomer: jest.fn(),
            createPaymentIntent: jest.fn(),
            createSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            verifyWebhookSignature: jest.fn(),
            updateSubscription: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useFactory: () => ({
            users: {
              findUnique: jest.fn(),
            },
            subscriptions: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              upsert: jest.fn(),
            },
          }),
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    stripeService = module.get(StripeService);
    prismaService = module.get(PrismaService);

    // Suppress logger output in tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateStripeCustomer', () => {
    it('should return existing Stripe customer ID if user already has one', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUserWithSubscription as any);

      const result = await service.getOrCreateStripeCustomer('user-123');

      expect(result).toBe('cus_123');
      expect(prismaService.users.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        include: { subscriptions: true },
      });
      expect(stripeService.createCustomer).not.toHaveBeenCalled();
    });

    it('should create new Stripe customer if user does not have one', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUser as any);
      stripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
      prismaService.subscriptions.create.mockResolvedValue({
        id: 'sub-new',
        userId: 'user-123',
        stripeCustomerId: 'cus_123',
      } as any);

      const result = await service.getOrCreateStripeCustomer('user-123');

      expect(result).toBe('cus_123');
      expect(stripeService.createCustomer).toHaveBeenCalledWith('test@example.com', 'John Doe', {
        userId: 'user-123',
      });
      expect(prismaService.subscriptions.create).toHaveBeenCalled();
    });

    it('should update existing subscription record with Stripe customer ID', async () => {
      const userWithSubscriptionNoStripe = {
        ...mockUser,
        subscriptions: {
          id: 'sub-123',
          userId: 'user-123',
          stripeCustomerId: null,
        },
      };

      prismaService.users.findUnique.mockResolvedValue(userWithSubscriptionNoStripe as any);
      stripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
      prismaService.subscriptions.update.mockResolvedValue({
        id: 'sub-123',
        stripeCustomerId: 'cus_123',
      } as any);

      const result = await service.getOrCreateStripeCustomer('user-123');

      expect(result).toBe('cus_123');
      expect(prismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: { stripeCustomerId: 'cus_123' },
      });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.getOrCreateStripeCustomer('nonexistent-user')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.getOrCreateStripeCustomer('nonexistent-user')).rejects.toThrow(
        'User with ID nonexistent-user not found',
      );
    });
  });

  describe('createPaymentIntent', () => {
    const createPaymentIntentDto = {
      amount: 1000,
      currency: 'eur',
      userId: 'user-123',
      description: 'Test payment',
    };

    it('should create payment intent with customer ID', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUserWithSubscription as any);
      stripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(createPaymentIntentDto);

      expect(result).toEqual({
        clientSecret: 'pi_123_secret_456',
        paymentIntentId: 'pi_123',
      });
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(1000, 'eur', 'cus_123', {
        description: 'Test payment',
      });
    });

    it('should create payment intent without customer ID if userId not provided', async () => {
      const dtoWithoutUser = {
        amount: 1000,
        currency: 'eur',
      };

      stripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(dtoWithoutUser);

      expect(result).toEqual({
        clientSecret: 'pi_123_secret_456',
        paymentIntentId: 'pi_123',
      });
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        1000,
        'eur',
        undefined,
        undefined,
      );
    });

    it('should create payment intent without description metadata if not provided', async () => {
      const dtoWithoutDescription = {
        amount: 2000,
        currency: 'usd',
        userId: 'user-123',
      };

      prismaService.users.findUnique.mockResolvedValue(mockUserWithSubscription as any);
      stripeService.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      await service.createPaymentIntent(dtoWithoutDescription);

      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        2000,
        'usd',
        'cus_123',
        undefined,
      );
    });

    it('should propagate Stripe errors when payment intent creation fails', async () => {
      const stripeError = new Error('Stripe API error');
      prismaService.users.findUnique.mockResolvedValue(mockUserWithSubscription as any);
      stripeService.createPaymentIntent.mockRejectedValue(stripeError);

      await expect(service.createPaymentIntent(createPaymentIntentDto)).rejects.toThrow(
        'Stripe API error',
      );
    });
  });

  describe('createSubscription', () => {
    const createSubscriptionDto = {
      userId: 'user-123',
      tier: SubscriptionTier.BASIC,
      priceId: 'price_123',
    };

    it('should create subscription for user without existing subscription', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUser as any);
      stripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
      prismaService.subscriptions.create.mockResolvedValue({} as any);
      stripeService.createSubscription.mockResolvedValue(mockStripeSubscription);
      prismaService.subscriptions.upsert.mockResolvedValue({
        ...mockUserWithSubscription.subscriptions,
        users: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      } as any);

      const result = await service.createSubscription(createSubscriptionDto);

      expect(result.subscription).toBeDefined();
      expect(result.clientSecret).toBe('pi_123_secret_456');
      expect(stripeService.createSubscription).toHaveBeenCalledWith('cus_123', 'price_123', {
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
      });
    });

    it('should throw BadRequestException if user already has active subscription', async () => {
      const userWithActiveSubscription = {
        ...mockUser,
        subscriptions: {
          ...mockUserWithSubscription.subscriptions,
          status: SubscriptionStatus.ACTIVE,
        },
      };

      prismaService.users.findUnique.mockResolvedValue(userWithActiveSubscription as any);

      await expect(service.createSubscription(createSubscriptionDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.createSubscription(createSubscriptionDto)).rejects.toThrow(
        'User already has an active subscription',
      );
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prismaService.users.findUnique.mockResolvedValue(null);

      await expect(service.createSubscription(createSubscriptionDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.createSubscription(createSubscriptionDto)).rejects.toThrow(
        'User with ID user-123 not found',
      );
    });

    it('should create subscription for user with cancelled subscription', async () => {
      const userWithCancelledSubscription = {
        ...mockUser,
        subscriptions: {
          ...mockUserWithSubscription.subscriptions,
          status: SubscriptionStatus.CANCELLED,
        },
      };

      prismaService.users.findUnique.mockResolvedValue(userWithCancelledSubscription as any);
      stripeService.createSubscription.mockResolvedValue(mockStripeSubscription);
      prismaService.subscriptions.upsert.mockResolvedValue({
        ...mockUserWithSubscription.subscriptions,
        users: mockUser,
      } as any);

      const result = await service.createSubscription(createSubscriptionDto);

      expect(result.subscription).toBeDefined();
      expect(stripeService.createSubscription).toHaveBeenCalled();
    });

    it('should handle subscription upgrade correctly', async () => {
      const upgradeDto = {
        userId: 'user-123',
        tier: SubscriptionTier.PRO,
        priceId: 'price_pro_123',
      };

      const userWithBasicSub = {
        ...mockUser,
        subscriptions: {
          ...mockUserWithSubscription.subscriptions,
          tier: SubscriptionTier.BASIC,
          status: SubscriptionStatus.EXPIRED,
        },
      };

      prismaService.users.findUnique.mockResolvedValue(userWithBasicSub as any);
      stripeService.createSubscription.mockResolvedValue({
        ...mockStripeSubscription,
        id: 'sub_pro_123',
      });
      prismaService.subscriptions.upsert.mockResolvedValue({
        ...mockUserWithSubscription.subscriptions,
        tier: SubscriptionTier.PRO,
        users: mockUser,
      } as any);

      const result = await service.createSubscription(upgradeDto);

      expect(result.subscription.tier).toBe(SubscriptionTier.PRO);
      expect(stripeService.createSubscription).toHaveBeenCalledWith('cus_123', 'price_pro_123', {
        userId: 'user-123',
        tier: SubscriptionTier.PRO,
      });
    });

    it('should set correct endDate from Stripe subscription period', async () => {
      const periodEnd = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
      const subscriptionWithPeriod = {
        ...mockStripeSubscription,
        current_period_end: periodEnd,
      };

      prismaService.users.findUnique.mockResolvedValue(mockUser as any);
      stripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
      prismaService.subscriptions.create.mockResolvedValue({} as any);
      stripeService.createSubscription.mockResolvedValue(subscriptionWithPeriod);

      const upsertedSubscription = {
        ...mockUserWithSubscription.subscriptions,
        endDate: new Date(periodEnd * 1000),
        users: mockUser,
      };
      prismaService.subscriptions.upsert.mockResolvedValue(upsertedSubscription as any);

      const result = await service.createSubscription(createSubscriptionDto);

      expect(prismaService.subscriptions.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            endDate: new Date(periodEnd * 1000),
          }),
          update: expect.objectContaining({
            endDate: new Date(periodEnd * 1000),
          }),
        }),
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel active subscription', async () => {
      prismaService.subscriptions.findUnique.mockResolvedValue(
        mockUserWithSubscription.subscriptions as any,
      );
      stripeService.cancelSubscription.mockResolvedValue({} as any);
      prismaService.subscriptions.update.mockResolvedValue({
        ...mockUserWithSubscription.subscriptions,
        status: SubscriptionStatus.CANCELLED,
        cancelAt: new Date(),
      } as any);

      const result = await service.cancelSubscription('user-123');

      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(stripeService.cancelSubscription).toHaveBeenCalledWith('sub_stripe_123');
      expect(prismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: {
          status: SubscriptionStatus.CANCELLED,
          cancelAt: expect.any(Date),
        },
      });
    });

    it('should throw NotFoundException if subscription does not exist', async () => {
      prismaService.subscriptions.findUnique.mockResolvedValue(null);

      await expect(service.cancelSubscription('user-123')).rejects.toThrow(NotFoundException);
      await expect(service.cancelSubscription('user-123')).rejects.toThrow(
        'Subscription for user user-123 not found',
      );
    });

    it('should throw BadRequestException if subscription has no Stripe ID', async () => {
      const subscriptionWithoutStripe = {
        ...mockUserWithSubscription.subscriptions,
        stripeSubscriptionId: null,
      };

      prismaService.subscriptions.findUnique.mockResolvedValue(subscriptionWithoutStripe as any);

      await expect(service.cancelSubscription('user-123')).rejects.toThrow(BadRequestException);
      await expect(service.cancelSubscription('user-123')).rejects.toThrow(
        'No Stripe subscription found',
      );
    });

    it('should handle Stripe API errors when cancelling subscription', async () => {
      prismaService.subscriptions.findUnique.mockResolvedValue(
        mockUserWithSubscription.subscriptions as any,
      );
      stripeService.cancelSubscription.mockRejectedValue(new Error('Stripe error'));

      await expect(service.cancelSubscription('user-123')).rejects.toThrow('Stripe error');
      expect(prismaService.subscriptions.update).not.toHaveBeenCalled();
    });
  });

  describe('getUserSubscription', () => {
    it('should return user subscription with user details', async () => {
      const subscriptionWithUser = {
        ...mockUserWithSubscription.subscriptions,
        users: {
          id: mockUser.id,
          email: mockUser.email,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
      };

      prismaService.subscriptions.findUnique.mockResolvedValue(subscriptionWithUser as any);

      const result = await service.getUserSubscription('user-123');

      expect(result).toEqual(subscriptionWithUser);
      expect(prismaService.subscriptions.findUnique).toHaveBeenCalledWith({
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

    it('should throw NotFoundException if subscription does not exist', async () => {
      prismaService.subscriptions.findUnique.mockResolvedValue(null);

      await expect(service.getUserSubscription('user-123')).rejects.toThrow(NotFoundException);
      await expect(service.getUserSubscription('user-123')).rejects.toThrow(
        'Subscription for user user-123 not found',
      );
    });
  });

  describe('handleWebhook', () => {
    const mockPayload = JSON.stringify({ type: 'test.event' });
    const mockSignature = 'whsec_test_signature';

    it('should handle customer.subscription.updated event', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe_123',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(
        mockUserWithSubscription.subscriptions as any,
      );
      prismaService.subscriptions.update.mockResolvedValue({} as any);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
      expect(prismaService.subscriptions.update).toHaveBeenCalled();
    });

    it('should handle customer.subscription.deleted event', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_stripe_123',
            status: 'canceled',
            current_period_end: Math.floor(Date.now() / 1000),
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(
        mockUserWithSubscription.subscriptions as any,
      );
      prismaService.subscriptions.update.mockResolvedValue({} as any);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
      expect(prismaService.subscriptions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.CANCELLED,
          }),
        }),
      );
    });

    it('should handle invoice.payment_succeeded event', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_123',
            subscription: 'sub_stripe_123',
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(
        mockUserWithSubscription.subscriptions as any,
      );
      prismaService.subscriptions.update.mockResolvedValue({} as any);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
      expect(prismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    });

    it('should handle invoice.payment_failed event', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
            subscription: 'sub_stripe_123',
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(
        mockUserWithSubscription.subscriptions as any,
      );
      prismaService.subscriptions.update.mockResolvedValue({} as any);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
      expect(prismaService.subscriptions.update).toHaveBeenCalledWith({
        where: { id: 'sub-123' },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
    });

    it('should handle unhandled event types gracefully', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'customer.created',
        data: {
          object: {} as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
    });

    it('should handle subscription update when status is past_due', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe_123',
            status: 'past_due',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(
        mockUserWithSubscription.subscriptions as any,
      );
      prismaService.subscriptions.update.mockResolvedValue({} as any);

      await service.handleWebhook(mockPayload, mockSignature);

      expect(prismaService.subscriptions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.PAST_DUE,
          }),
        }),
      );
    });

    it('should handle subscription update when local subscription not found', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_unknown',
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(null);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
      expect(prismaService.subscriptions.update).not.toHaveBeenCalled();
    });

    it('should handle payment succeeded when subscription not found', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_123',
            subscription: 'sub_unknown',
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(null);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
      expect(prismaService.subscriptions.update).not.toHaveBeenCalled();
    });

    it('should handle payment failed when subscription not found', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_123',
            subscription: 'sub_unknown',
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(null);

      const result = await service.handleWebhook(mockPayload, mockSignature);

      expect(result).toEqual({ received: true });
      expect(prismaService.subscriptions.update).not.toHaveBeenCalled();
    });

    it('should propagate webhook verification errors', async () => {
      const error = new Error('Invalid signature');
      stripeService.verifyWebhookSignature.mockImplementation(() => {
        throw error;
      });

      await expect(service.handleWebhook(mockPayload, mockSignature)).rejects.toThrow(
        'Invalid signature',
      );
    });

    it('should handle subscription status unknown/other by defaulting to ACTIVE', async () => {
      const event: Stripe.Event = {
        id: 'evt_123',
        object: 'event',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_stripe_123',
            status: 'incomplete' as any,
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
          } as any,
        },
      } as Stripe.Event;

      stripeService.verifyWebhookSignature.mockReturnValue(event);
      prismaService.subscriptions.findUnique.mockResolvedValue(
        mockUserWithSubscription.subscriptions as any,
      );
      prismaService.subscriptions.update.mockResolvedValue({} as any);

      await service.handleWebhook(mockPayload, mockSignature);

      expect(prismaService.subscriptions.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.ACTIVE,
          }),
        }),
      );
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle database errors when creating customer', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUser as any);
      stripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
      prismaService.subscriptions.create.mockRejectedValue(new Error('Database error'));

      await expect(service.getOrCreateStripeCustomer('user-123')).rejects.toThrow('Database error');
    });

    it('should handle Stripe errors when creating subscription', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUser as any);
      stripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
      prismaService.subscriptions.create.mockResolvedValue({} as any);
      stripeService.createSubscription.mockRejectedValue(new Error('Stripe subscription error'));

      await expect(
        service.createSubscription({
          userId: 'user-123',
          tier: SubscriptionTier.BASIC,
          priceId: 'price_123',
        }),
      ).rejects.toThrow('Stripe subscription error');
    });

    it('should handle multiple concurrent subscription creations', async () => {
      prismaService.users.findUnique.mockResolvedValue(mockUser as any);
      stripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
      prismaService.subscriptions.create.mockResolvedValue({} as any);
      stripeService.createSubscription.mockResolvedValue(mockStripeSubscription);
      prismaService.subscriptions.upsert.mockResolvedValue({
        ...mockUserWithSubscription.subscriptions,
        users: mockUser,
      } as any);

      const promises = [
        service.createSubscription({
          userId: 'user-123',
          tier: SubscriptionTier.BASIC,
          priceId: 'price_123',
        }),
        service.createSubscription({
          userId: 'user-123',
          tier: SubscriptionTier.BASIC,
          priceId: 'price_123',
        }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(2);
      expect(results[0].subscription).toBeDefined();
      expect(results[1].subscription).toBeDefined();
    });

    it('should handle payment intent creation with zero amount', async () => {
      const dtoZeroAmount = {
        amount: 0,
        currency: 'eur',
        userId: 'user-123',
      };

      prismaService.users.findUnique.mockResolvedValue(mockUserWithSubscription as any);
      stripeService.createPaymentIntent.mockResolvedValue({
        ...mockPaymentIntent,
        amount: 0,
      });

      const result = await service.createPaymentIntent(dtoZeroAmount);

      expect(result).toBeDefined();
      expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
        0,
        'eur',
        'cus_123',
        undefined,
      );
    });

    it('should handle subscription with different tiers', async () => {
      const tiers = [
        SubscriptionTier.FREE,
        SubscriptionTier.BASIC,
        SubscriptionTier.PRO,
        SubscriptionTier.ENTERPRISE,
      ];

      for (const tier of tiers) {
        prismaService.users.findUnique.mockResolvedValue(mockUser as any);
        stripeService.createCustomer.mockResolvedValue(mockStripeCustomer);
        prismaService.subscriptions.create.mockResolvedValue({} as any);
        stripeService.createSubscription.mockResolvedValue(mockStripeSubscription);
        prismaService.subscriptions.upsert.mockResolvedValue({
          ...mockUserWithSubscription.subscriptions,
          tier,
          users: mockUser,
        } as any);

        const result = await service.createSubscription({
          userId: 'user-123',
          tier,
          priceId: `price_${tier.toLowerCase()}`,
        });

        expect(result.subscription.tier).toBe(tier);
      }
    });
  });
});
