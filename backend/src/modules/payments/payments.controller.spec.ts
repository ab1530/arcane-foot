import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ExecutionContext, NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: jest.Mocked<PaymentsService>;

  const mockPaymentIntent = {
    clientSecret: 'pi_123_secret_456',
    paymentIntentId: 'pi_123',
  };

  const mockSubscription = {
    subscription: {
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
    },
    clientSecret: 'pi_123_secret_456',
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: {
            createPaymentIntent: jest.fn(),
            createSubscription: jest.fn(),
            cancelSubscription: jest.fn(),
            getUserSubscription: jest.fn(),
            handleWebhook: jest.fn(),
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

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent successfully', async () => {
      const dto = {
        amount: 1000,
        currency: 'eur',
        userId: 'user-123',
        description: 'Test payment',
      };

      service.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const result = await controller.createPaymentIntent(dto);

      expect(result).toEqual(mockPaymentIntent);
      expect(service.createPaymentIntent).toHaveBeenCalledWith(dto);
      expect(service.createPaymentIntent).toHaveBeenCalledTimes(1);
    });

    it('should create payment intent without optional fields', async () => {
      const dto = {
        amount: 2000,
        currency: 'usd',
      };

      service.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const result = await controller.createPaymentIntent(dto);

      expect(result).toEqual(mockPaymentIntent);
      expect(service.createPaymentIntent).toHaveBeenCalledWith(dto);
    });

    it('should handle service errors when creating payment intent', async () => {
      const dto = {
        amount: 1000,
        currency: 'eur',
        userId: 'user-123',
      };

      service.createPaymentIntent.mockRejectedValue(new Error('Payment intent creation failed'));

      await expect(controller.createPaymentIntent(dto)).rejects.toThrow(
        'Payment intent creation failed',
      );
      expect(service.createPaymentIntent).toHaveBeenCalledWith(dto);
    });

    it('should create payment intent with different currencies', async () => {
      const currencies = ['eur', 'usd', 'gbp', 'jpy'];

      for (const currency of currencies) {
        const dto = {
          amount: 1000,
          currency,
          userId: 'user-123',
        };

        service.createPaymentIntent.mockResolvedValue({
          ...mockPaymentIntent,
          paymentIntentId: `pi_${currency}`,
        });

        const result = await controller.createPaymentIntent(dto);

        expect(result.paymentIntentId).toBe(`pi_${currency}`);
        expect(service.createPaymentIntent).toHaveBeenCalledWith(dto);
      }
    });

    it('should handle NotFoundException from service', async () => {
      const dto = {
        amount: 1000,
        currency: 'eur',
        userId: 'nonexistent-user',
      };

      service.createPaymentIntent.mockRejectedValue(
        new NotFoundException('User with ID nonexistent-user not found'),
      );

      await expect(controller.createPaymentIntent(dto)).rejects.toThrow(NotFoundException);
      await expect(controller.createPaymentIntent(dto)).rejects.toThrow(
        'User with ID nonexistent-user not found',
      );
    });
  });

  describe('createSubscription', () => {
    it('should create subscription successfully', async () => {
      const dto = {
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        priceId: 'price_123',
      };

      service.createSubscription.mockResolvedValue(mockSubscription);

      const result = await controller.createSubscription(dto);

      expect(result).toEqual(mockSubscription);
      expect(service.createSubscription).toHaveBeenCalledWith(dto);
      expect(service.createSubscription).toHaveBeenCalledTimes(1);
    });

    it('should create subscription for different tiers', async () => {
      const tiers = [
        SubscriptionTier.FREE,
        SubscriptionTier.BASIC,
        SubscriptionTier.PRO,
        SubscriptionTier.ENTERPRISE,
      ];

      for (const tier of tiers) {
        const dto = {
          userId: 'user-123',
          tier,
          priceId: `price_${tier.toLowerCase()}`,
        };

        service.createSubscription.mockResolvedValue({
          ...mockSubscription,
          subscription: {
            ...mockSubscription.subscription,
            tier,
          },
        });

        const result = await controller.createSubscription(dto);

        expect(result.subscription.tier).toBe(tier);
        expect(service.createSubscription).toHaveBeenCalledWith(dto);
      }
    });

    it('should handle BadRequestException when user already has active subscription', async () => {
      const dto = {
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        priceId: 'price_123',
      };

      service.createSubscription.mockRejectedValue(
        new BadRequestException('User already has an active subscription'),
      );

      await expect(controller.createSubscription(dto)).rejects.toThrow(BadRequestException);
      await expect(controller.createSubscription(dto)).rejects.toThrow(
        'User already has an active subscription',
      );
    });

    it('should handle NotFoundException when user does not exist', async () => {
      const dto = {
        userId: 'nonexistent-user',
        tier: SubscriptionTier.BASIC,
        priceId: 'price_123',
      };

      service.createSubscription.mockRejectedValue(
        new NotFoundException('User with ID nonexistent-user not found'),
      );

      await expect(controller.createSubscription(dto)).rejects.toThrow(NotFoundException);
      await expect(controller.createSubscription(dto)).rejects.toThrow(
        'User with ID nonexistent-user not found',
      );
    });

    it('should return client secret for payment confirmation', async () => {
      const dto = {
        userId: 'user-123',
        tier: SubscriptionTier.PRO,
        priceId: 'price_pro_123',
      };

      service.createSubscription.mockResolvedValue({
        ...mockSubscription,
        clientSecret: 'pi_pro_secret_789',
      });

      const result = await controller.createSubscription(dto);

      expect(result.clientSecret).toBe('pi_pro_secret_789');
    });

    it('should handle subscription creation with Stripe errors', async () => {
      const dto = {
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        priceId: 'price_123',
      };

      service.createSubscription.mockRejectedValue(new Error('Stripe API error'));

      await expect(controller.createSubscription(dto)).rejects.toThrow('Stripe API error');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription successfully', async () => {
      const cancelledSubscription = {
        ...mockSubscription.subscription,
        status: SubscriptionStatus.CANCELLED,
        cancelAt: new Date(),
      };

      service.cancelSubscription.mockResolvedValue(cancelledSubscription);

      const result = await controller.cancelSubscription('user-123');

      expect(result).toEqual(cancelledSubscription);
      expect(result.status).toBe(SubscriptionStatus.CANCELLED);
      expect(service.cancelSubscription).toHaveBeenCalledWith('user-123');
      expect(service.cancelSubscription).toHaveBeenCalledTimes(1);
    });

    it('should handle NotFoundException when subscription does not exist', async () => {
      service.cancelSubscription.mockRejectedValue(
        new NotFoundException('Subscription for user user-123 not found'),
      );

      await expect(controller.cancelSubscription('user-123')).rejects.toThrow(NotFoundException);
      await expect(controller.cancelSubscription('user-123')).rejects.toThrow(
        'Subscription for user user-123 not found',
      );
    });

    it('should handle BadRequestException when subscription has no Stripe ID', async () => {
      service.cancelSubscription.mockRejectedValue(
        new BadRequestException('No Stripe subscription found'),
      );

      await expect(controller.cancelSubscription('user-123')).rejects.toThrow(BadRequestException);
      await expect(controller.cancelSubscription('user-123')).rejects.toThrow(
        'No Stripe subscription found',
      );
    });

    it('should handle Stripe errors when cancelling subscription', async () => {
      service.cancelSubscription.mockRejectedValue(new Error('Stripe cancellation error'));

      await expect(controller.cancelSubscription('user-123')).rejects.toThrow(
        'Stripe cancellation error',
      );
    });

    it('should cancel subscription for different users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      for (const userId of userIds) {
        const cancelledSub = {
          ...mockSubscription.subscription,
          userId,
          status: SubscriptionStatus.CANCELLED,
        };

        service.cancelSubscription.mockResolvedValue(cancelledSub);

        const result = await controller.cancelSubscription(userId);

        expect(result.userId).toBe(userId);
        expect(service.cancelSubscription).toHaveBeenCalledWith(userId);
      }
    });
  });

  describe('getUserSubscription', () => {
    it('should get user subscription successfully', async () => {
      service.getUserSubscription.mockResolvedValue(mockSubscription.subscription);

      const result = await controller.getUserSubscription('user-123');

      expect(result).toEqual(mockSubscription.subscription);
      expect(service.getUserSubscription).toHaveBeenCalledWith('user-123');
      expect(service.getUserSubscription).toHaveBeenCalledTimes(1);
    });

    it('should return subscription with user details', async () => {
      const subscriptionWithUser = {
        ...mockSubscription.subscription,
        users: mockUser,
      };

      service.getUserSubscription.mockResolvedValue(subscriptionWithUser);

      const result = await controller.getUserSubscription('user-123');

      expect(result.users).toEqual(mockUser);
      expect(result.userId).toBe('user-123');
    });

    it('should handle NotFoundException when subscription does not exist', async () => {
      service.getUserSubscription.mockRejectedValue(
        new NotFoundException('Subscription for user user-123 not found'),
      );

      await expect(controller.getUserSubscription('user-123')).rejects.toThrow(NotFoundException);
      await expect(controller.getUserSubscription('user-123')).rejects.toThrow(
        'Subscription for user user-123 not found',
      );
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
          ...mockSubscription.subscription,
          status,
        };

        service.getUserSubscription.mockResolvedValue(subscription);

        const result = await controller.getUserSubscription('user-123');

        expect(result.status).toBe(status);
      }
    });

    it('should get subscriptions for different users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];

      for (const userId of userIds) {
        const subscription = {
          ...mockSubscription.subscription,
          userId,
        };

        service.getUserSubscription.mockResolvedValue(subscription);

        const result = await controller.getUserSubscription(userId);

        expect(result.userId).toBe(userId);
        expect(service.getUserSubscription).toHaveBeenCalledWith(userId);
      }
    });
  });

  describe('handleWebhook', () => {
    const mockRawBody = Buffer.from(
      JSON.stringify({
        id: 'evt_123',
        type: 'invoice.payment_succeeded',
        data: { object: { subscription: 'sub_123' } },
      }),
    );

    const mockRequest = {
      rawBody: mockRawBody,
    } as any;

    const mockSignature = 'whsec_test_signature_123';

    it('should handle webhook successfully', async () => {
      service.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook(mockRequest, mockSignature);

      expect(result).toEqual({ received: true });
      expect(service.handleWebhook).toHaveBeenCalledWith(
        mockRawBody.toString('utf8'),
        mockSignature,
      );
      expect(service.handleWebhook).toHaveBeenCalledTimes(1);
    });

    it('should handle customer.subscription.updated webhook', async () => {
      const subscriptionUpdatedBody = Buffer.from(
        JSON.stringify({
          id: 'evt_123',
          type: 'customer.subscription.updated',
          data: { object: { id: 'sub_123', status: 'active' } },
        }),
      );

      const request = { rawBody: subscriptionUpdatedBody } as any;
      service.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook(request, mockSignature);

      expect(result.received).toBe(true);
      expect(service.handleWebhook).toHaveBeenCalledWith(
        subscriptionUpdatedBody.toString('utf8'),
        mockSignature,
      );
    });

    it('should handle customer.subscription.deleted webhook', async () => {
      const subscriptionDeletedBody = Buffer.from(
        JSON.stringify({
          id: 'evt_123',
          type: 'customer.subscription.deleted',
          data: { object: { id: 'sub_123', status: 'canceled' } },
        }),
      );

      const request = { rawBody: subscriptionDeletedBody } as any;
      service.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook(request, mockSignature);

      expect(result.received).toBe(true);
      expect(service.handleWebhook).toHaveBeenCalledWith(
        subscriptionDeletedBody.toString('utf8'),
        mockSignature,
      );
    });

    it('should handle invoice.payment_succeeded webhook', async () => {
      const paymentSucceededBody = Buffer.from(
        JSON.stringify({
          id: 'evt_123',
          type: 'invoice.payment_succeeded',
          data: { object: { id: 'in_123', subscription: 'sub_123' } },
        }),
      );

      const request = { rawBody: paymentSucceededBody } as any;
      service.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook(request, mockSignature);

      expect(result.received).toBe(true);
      expect(service.handleWebhook).toHaveBeenCalledWith(
        paymentSucceededBody.toString('utf8'),
        mockSignature,
      );
    });

    it('should handle invoice.payment_failed webhook', async () => {
      const paymentFailedBody = Buffer.from(
        JSON.stringify({
          id: 'evt_123',
          type: 'invoice.payment_failed',
          data: { object: { id: 'in_123', subscription: 'sub_123' } },
        }),
      );

      const request = { rawBody: paymentFailedBody } as any;
      service.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook(request, mockSignature);

      expect(result.received).toBe(true);
      expect(service.handleWebhook).toHaveBeenCalledWith(
        paymentFailedBody.toString('utf8'),
        mockSignature,
      );
    });

    it('should handle webhook signature verification errors', async () => {
      service.handleWebhook.mockRejectedValue(new Error('Invalid signature'));

      await expect(controller.handleWebhook(mockRequest, 'invalid_signature')).rejects.toThrow(
        'Invalid signature',
      );
    });

    it('should handle webhook with missing signature', async () => {
      service.handleWebhook.mockRejectedValue(new Error('Signature header is required'));

      await expect(controller.handleWebhook(mockRequest, '')).rejects.toThrow(
        'Signature header is required',
      );
    });

    it('should handle webhook with malformed payload', async () => {
      const malformedRequest = {
        rawBody: Buffer.from('invalid json'),
      } as any;

      service.handleWebhook.mockRejectedValue(new Error('Invalid payload'));

      await expect(controller.handleWebhook(malformedRequest, mockSignature)).rejects.toThrow(
        'Invalid payload',
      );
    });

    it('should convert raw body to utf8 string correctly', async () => {
      const specialCharsBody = Buffer.from('{"test": "\u00e9\u00e0\u00f9"}');
      const request = { rawBody: specialCharsBody } as any;

      service.handleWebhook.mockResolvedValue({ received: true });

      await controller.handleWebhook(request, mockSignature);

      expect(service.handleWebhook).toHaveBeenCalledWith(
        specialCharsBody.toString('utf8'),
        mockSignature,
      );
    });

    it('should handle multiple webhook events in sequence', async () => {
      const events = [
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
      ];

      for (const eventType of events) {
        const eventBody = Buffer.from(
          JSON.stringify({
            id: `evt_${eventType}`,
            type: eventType,
            data: { object: { id: 'obj_123' } },
          }),
        );

        const request = { rawBody: eventBody } as any;
        service.handleWebhook.mockResolvedValue({ received: true });

        const result = await controller.handleWebhook(request, mockSignature);

        expect(result.received).toBe(true);
        expect(service.handleWebhook).toHaveBeenCalledWith(
          eventBody.toString('utf8'),
          mockSignature,
        );
      }
    });
  });

  describe('authentication and authorization', () => {
    it('should require authentication for createPaymentIntent', async () => {
      const dto = {
        amount: 1000,
        currency: 'eur',
        userId: 'user-123',
      };

      service.createPaymentIntent.mockResolvedValue(mockPaymentIntent);

      const result = await controller.createPaymentIntent(dto);

      expect(result).toBeDefined();
    });

    it('should require authentication for createSubscription', async () => {
      const dto = {
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        priceId: 'price_123',
      };

      service.createSubscription.mockResolvedValue(mockSubscription);

      const result = await controller.createSubscription(dto);

      expect(result).toBeDefined();
    });

    it('should require authentication for cancelSubscription', async () => {
      service.cancelSubscription.mockResolvedValue(mockSubscription.subscription);

      const result = await controller.cancelSubscription('user-123');

      expect(result).toBeDefined();
    });

    it('should require authentication for getUserSubscription', async () => {
      service.getUserSubscription.mockResolvedValue(mockSubscription.subscription);

      const result = await controller.getUserSubscription('user-123');

      expect(result).toBeDefined();
    });

    it('should NOT require authentication for webhook endpoint', async () => {
      const mockRequest = {
        rawBody: Buffer.from(JSON.stringify({ type: 'test.event' })),
      } as any;

      service.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook(mockRequest, 'whsec_signature');

      expect(result).toEqual({ received: true });
    });
  });

  describe('error response handling', () => {
    it('should return proper error for invalid payment intent data', async () => {
      const dto = {
        amount: -1000,
        currency: 'invalid',
        userId: 'user-123',
      };

      service.createPaymentIntent.mockRejectedValue(
        new BadRequestException('Invalid amount or currency'),
      );

      await expect(controller.createPaymentIntent(dto)).rejects.toThrow(BadRequestException);
    });

    it('should return proper error for invalid subscription tier', async () => {
      const dto = {
        userId: 'user-123',
        tier: 'INVALID_TIER' as any,
        priceId: 'price_123',
      };

      service.createSubscription.mockRejectedValue(
        new BadRequestException('Invalid subscription tier'),
      );

      await expect(controller.createSubscription(dto)).rejects.toThrow(BadRequestException);
    });

    it('should handle service timeout errors', async () => {
      const dto = {
        amount: 1000,
        currency: 'eur',
        userId: 'user-123',
      };

      service.createPaymentIntent.mockRejectedValue(new Error('Request timeout'));

      await expect(controller.createPaymentIntent(dto)).rejects.toThrow('Request timeout');
    });

    it('should handle network errors from Stripe', async () => {
      const dto = {
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        priceId: 'price_123',
      };

      service.createSubscription.mockRejectedValue(new Error('Network error'));

      await expect(controller.createSubscription(dto)).rejects.toThrow('Network error');
    });
  });

  describe('payment success and failure flows', () => {
    it('should handle successful payment intent flow', async () => {
      const dto = {
        amount: 5000,
        currency: 'eur',
        userId: 'user-123',
        description: 'Premium subscription',
      };

      service.createPaymentIntent.mockResolvedValue({
        clientSecret: 'pi_success_secret',
        paymentIntentId: 'pi_success',
      });

      const result = await controller.createPaymentIntent(dto);

      expect(result.clientSecret).toBeDefined();
      expect(result.paymentIntentId).toBe('pi_success');
    });

    it('should handle failed payment intent flow', async () => {
      const dto = {
        amount: 1000,
        currency: 'eur',
        userId: 'user-123',
      };

      service.createPaymentIntent.mockRejectedValue(
        new BadRequestException('Payment method declined'),
      );

      await expect(controller.createPaymentIntent(dto)).rejects.toThrow('Payment method declined');
    });

    it('should handle successful subscription creation flow', async () => {
      const dto = {
        userId: 'user-123',
        tier: SubscriptionTier.PRO,
        priceId: 'price_pro',
      };

      service.createSubscription.mockResolvedValue({
        subscription: {
          ...mockSubscription.subscription,
          tier: SubscriptionTier.PRO,
          status: SubscriptionStatus.ACTIVE,
        },
        clientSecret: 'pi_subscription_success',
      });

      const result = await controller.createSubscription(dto);

      expect(result.subscription.status).toBe(SubscriptionStatus.ACTIVE);
      expect(result.clientSecret).toBe('pi_subscription_success');
    });

    it('should handle failed subscription creation due to payment failure', async () => {
      const dto = {
        userId: 'user-123',
        tier: SubscriptionTier.BASIC,
        priceId: 'price_123',
      };

      service.createSubscription.mockRejectedValue(
        new BadRequestException('Payment failed for subscription'),
      );

      await expect(controller.createSubscription(dto)).rejects.toThrow(
        'Payment failed for subscription',
      );
    });

    it('should handle webhook for successful payment after subscription creation', async () => {
      const webhookBody = Buffer.from(
        JSON.stringify({
          id: 'evt_payment_success',
          type: 'invoice.payment_succeeded',
          data: {
            object: {
              id: 'in_123',
              subscription: 'sub_123',
              amount_paid: 1000,
              status: 'paid',
            },
          },
        }),
      );

      const request = { rawBody: webhookBody } as any;
      service.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook(request, 'whsec_signature');

      expect(result.received).toBe(true);
    });

    it('should handle webhook for failed payment', async () => {
      const webhookBody = Buffer.from(
        JSON.stringify({
          id: 'evt_payment_failed',
          type: 'invoice.payment_failed',
          data: {
            object: {
              id: 'in_123',
              subscription: 'sub_123',
              status: 'open',
              attempt_count: 1,
            },
          },
        }),
      );

      const request = { rawBody: webhookBody } as any;
      service.handleWebhook.mockResolvedValue({ received: true });

      const result = await controller.handleWebhook(request, 'whsec_signature');

      expect(result.received).toBe(true);
    });
  });
});
