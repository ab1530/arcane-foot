import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service';
import Stripe from 'stripe';

// Mock Stripe SDK
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    paymentIntents: {
      create: jest.fn(),
    },
    subscriptions: {
      create: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
    },
    transfers: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('StripeService', () => {
  let service: StripeService;
  let configService: ConfigService;
  let stripeMock: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'STRIPE_SECRET_KEY') return 'sk_test_mock_key';
              if (key === 'STRIPE_API_VERSION') return '2024-11-20.acacia';
              if (key === 'STRIPE_WEBHOOK_SECRET') return 'whsec_test_secret';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StripeService>(StripeService);
    configService = module.get<ConfigService>(ConfigService);

    // Get the mocked stripe instance
    stripeMock = (service as any).stripe;
  });

  describe('Constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should throw error if STRIPE_SECRET_KEY is not configured', async () => {
      await expect(
        Test.createTestingModule({
          providers: [
            StripeService,
            {
              provide: ConfigService,
              useValue: {
                get: jest.fn(() => null),
              },
            },
          ],
        }).compile(),
      ).rejects.toThrow(
        '[Stripe] STRIPE_SECRET_KEY is not configured. Please set it in the environment before starting the application.',
      );
    });

    it('should initialize with API version if provided', () => {
      expect(configService.get('STRIPE_API_VERSION')).toBe('2024-11-20.acacia');
    });
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_mock123',
        object: 'customer',
        email: 'test@example.com',
        name: 'John Doe',
        metadata: { userId: '123' },
        created: Date.now(),
        livemode: false,
      } as Partial<Stripe.Customer> as Stripe.Customer;

      stripeMock.customers.create.mockResolvedValue(mockCustomer);

      const result = await service.createCustomer('test@example.com', 'John Doe', {
        userId: '123',
      });

      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        name: 'John Doe',
        metadata: { userId: '123' },
      });
      expect(result).toEqual(mockCustomer);
      expect(result.id).toBe('cus_mock123');
    });

    it('should create a customer without name and metadata', async () => {
      const mockCustomer = {
        id: 'cus_mock456',
        object: 'customer',
        email: 'test2@example.com',
        created: Date.now(),
        livemode: false,
      } as Partial<Stripe.Customer> as Stripe.Customer;

      stripeMock.customers.create.mockResolvedValue(mockCustomer);

      const result = await service.createCustomer('test2@example.com');

      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        email: 'test2@example.com',
        name: undefined,
        metadata: undefined,
      });
      expect(result.id).toBe('cus_mock456');
    });

    it('should handle Stripe API errors', async () => {
      stripeMock.customers.create.mockRejectedValue(new Error('Stripe API error: Invalid email'));

      await expect(service.createCustomer('invalid-email')).rejects.toThrow(
        'Stripe API error: Invalid email',
      );
    });
  });

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_mock123',
        object: 'payment_intent',
        amount: 5000,
        currency: 'eur',
        customer: 'cus_mock123',
        status: 'requires_payment_method',
        client_secret: 'pi_mock123_secret',
        metadata: { orderId: 'order123' },
      } as Partial<Stripe.PaymentIntent> as Stripe.PaymentIntent;

      stripeMock.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(5000, 'eur', 'cus_mock123', {
        orderId: 'order123',
      });

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'eur',
        customer: 'cus_mock123',
        metadata: { orderId: 'order123' },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      expect(result).toEqual(mockPaymentIntent);
      expect(result.amount).toBe(5000);
    });

    it('should create a payment intent without customer ID', async () => {
      const mockPaymentIntent = {
        id: 'pi_mock456',
        object: 'payment_intent',
        amount: 3000,
        currency: 'usd',
        status: 'requires_payment_method',
      } as Partial<Stripe.PaymentIntent> as Stripe.PaymentIntent;

      stripeMock.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

      const result = await service.createPaymentIntent(3000, 'usd');

      expect(stripeMock.paymentIntents.create).toHaveBeenCalledWith({
        amount: 3000,
        currency: 'usd',
        customer: undefined,
        metadata: undefined,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      expect(result.amount).toBe(3000);
    });

    it('should handle amount validation errors', async () => {
      stripeMock.paymentIntents.create.mockRejectedValue(
        new Error('Amount must be at least 50 cents'),
      );

      await expect(service.createPaymentIntent(10, 'eur')).rejects.toThrow(
        'Amount must be at least 50 cents',
      );
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_mock123',
        object: 'subscription',
        customer: 'cus_mock123',
        status: 'incomplete',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_mock123',
              price: {
                id: 'price_gold',
              } as Partial<Stripe.Price>,
            } as Partial<Stripe.SubscriptionItem>,
          ],
        } as Partial<Stripe.ApiList<Stripe.SubscriptionItem>>,
        metadata: { planType: 'gold' },
      } as Partial<Stripe.Subscription> as Stripe.Subscription;

      stripeMock.subscriptions.create.mockResolvedValue(mockSubscription);

      const result = await service.createSubscription('cus_mock123', 'price_gold', {
        planType: 'gold',
      });

      expect(stripeMock.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_mock123',
        items: [{ price: 'price_gold' }],
        metadata: { planType: 'gold' },
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      expect(result).toEqual(mockSubscription);
      expect(result.id).toBe('sub_mock123');
    });

    it('should create a subscription without metadata', async () => {
      const mockSubscription = {
        id: 'sub_mock456',
        object: 'subscription',
        customer: 'cus_mock456',
        status: 'incomplete',
      } as Partial<Stripe.Subscription> as Stripe.Subscription;

      stripeMock.subscriptions.create.mockResolvedValue(mockSubscription);

      const result = await service.createSubscription('cus_mock456', 'price_silver');

      expect(stripeMock.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_mock456',
        items: [{ price: 'price_silver' }],
        metadata: undefined,
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });
      expect(result.id).toBe('sub_mock456');
    });

    it('should handle invalid price ID', async () => {
      stripeMock.subscriptions.create.mockRejectedValue(new Error('No such price: invalid_price'));

      await expect(service.createSubscription('cus_mock123', 'invalid_price')).rejects.toThrow(
        'No such price: invalid_price',
      );
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription immediately', async () => {
      const mockSubscription = {
        id: 'sub_mock123',
        object: 'subscription',
        status: 'canceled',
        canceled_at: Date.now(),
      } as Partial<Stripe.Subscription> as Stripe.Subscription;

      stripeMock.subscriptions.cancel.mockResolvedValue(mockSubscription);

      const result = await service.cancelSubscription('sub_mock123', true);

      expect(stripeMock.subscriptions.cancel).toHaveBeenCalledWith('sub_mock123');
      expect(stripeMock.subscriptions.update).not.toHaveBeenCalled();
      expect(result.status).toBe('canceled');
    });

    it('should cancel subscription at period end', async () => {
      const mockSubscription = {
        id: 'sub_mock456',
        object: 'subscription',
        status: 'active',
        cancel_at_period_end: true,
      } as Partial<Stripe.Subscription> as Stripe.Subscription;

      stripeMock.subscriptions.update.mockResolvedValue(mockSubscription);

      const result = await service.cancelSubscription('sub_mock456', false);

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_mock456', {
        cancel_at_period_end: true,
      });
      expect(stripeMock.subscriptions.cancel).not.toHaveBeenCalled();
      expect(result.cancel_at_period_end).toBe(true);
    });

    it('should cancel at period end by default', async () => {
      const mockSubscription = {
        id: 'sub_mock789',
        object: 'subscription',
        status: 'active',
        cancel_at_period_end: true,
      } as Partial<Stripe.Subscription> as Stripe.Subscription;

      stripeMock.subscriptions.update.mockResolvedValue(mockSubscription);

      await service.cancelSubscription('sub_mock789');

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_mock789', {
        cancel_at_period_end: true,
      });
      expect(stripeMock.subscriptions.cancel).not.toHaveBeenCalled();
    });

    it('should handle cancellation errors', async () => {
      stripeMock.subscriptions.cancel.mockRejectedValue(
        new Error('No such subscription: invalid_sub'),
      );

      await expect(service.cancelSubscription('invalid_sub', true)).rejects.toThrow(
        'No such subscription: invalid_sub',
      );
    });
  });

  describe('getCustomer', () => {
    it('should retrieve a customer successfully', async () => {
      const mockCustomer = {
        id: 'cus_mock123',
        object: 'customer',
        email: 'test@example.com',
        name: 'John Doe',
        created: Date.now(),
      } as Partial<Stripe.Customer> as Stripe.Customer;

      stripeMock.customers.retrieve.mockResolvedValue(mockCustomer);

      const result = await service.getCustomer('cus_mock123');

      expect(stripeMock.customers.retrieve).toHaveBeenCalledWith('cus_mock123');
      expect(result).toEqual(mockCustomer);
      expect(result.id).toBe('cus_mock123');
    });

    it('should handle deleted customer', async () => {
      const mockDeletedCustomer: Stripe.DeletedCustomer = {
        id: 'cus_deleted',
        object: 'customer',
        deleted: true,
      };

      stripeMock.customers.retrieve.mockResolvedValue(mockDeletedCustomer);

      const result = await service.getCustomer('cus_deleted');

      expect(result).toEqual(mockDeletedCustomer);
      expect((result as Stripe.DeletedCustomer).deleted).toBe(true);
    });

    it('should handle non-existent customer', async () => {
      stripeMock.customers.retrieve.mockRejectedValue(
        new Error('No such customer: invalid_customer'),
      );

      await expect(service.getCustomer('invalid_customer')).rejects.toThrow(
        'No such customer: invalid_customer',
      );
    });
  });

  describe('createTransfer', () => {
    it('should create a transfer successfully', async () => {
      const mockTransfer = {
        id: 'tr_mock123',
        object: 'transfer',
        amount: 10000,
        currency: 'eur',
        destination: 'acct_connected123',
        metadata: { commission: 'marketplace' },
      } as Partial<Stripe.Transfer> as Stripe.Transfer;

      stripeMock.transfers.create.mockResolvedValue(mockTransfer);

      const result = await service.createTransfer(10000, 'eur', 'acct_connected123', {
        commission: 'marketplace',
      });

      expect(stripeMock.transfers.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'eur',
        destination: 'acct_connected123',
        metadata: { commission: 'marketplace' },
      });
      expect(result).toEqual(mockTransfer);
      expect(result.amount).toBe(10000);
    });

    it('should create a transfer without metadata', async () => {
      const mockTransfer = {
        id: 'tr_mock456',
        object: 'transfer',
        amount: 5000,
        currency: 'usd',
        destination: 'acct_connected456',
      } as Partial<Stripe.Transfer> as Stripe.Transfer;

      stripeMock.transfers.create.mockResolvedValue(mockTransfer);

      const result = await service.createTransfer(5000, 'usd', 'acct_connected456');

      expect(stripeMock.transfers.create).toHaveBeenCalledWith({
        amount: 5000,
        currency: 'usd',
        destination: 'acct_connected456',
        metadata: undefined,
      });
      expect(result.amount).toBe(5000);
    });

    it('should handle invalid destination account', async () => {
      stripeMock.transfers.create.mockRejectedValue(
        new Error('No such destination: invalid_account'),
      );

      await expect(service.createTransfer(1000, 'eur', 'invalid_account')).rejects.toThrow(
        'No such destination: invalid_account',
      );
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify webhook signature successfully', () => {
      const mockEvent = {
        id: 'evt_mock123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: {} as any,
        },
      } as Partial<Stripe.Event> as Stripe.Event;

      stripeMock.webhooks.constructEvent.mockReturnValue(mockEvent);

      const payload = JSON.stringify({ type: 'payment_intent.succeeded' });
      const signature = 't=1234567890,v1=signature_hash';

      const result = service.verifyWebhookSignature(payload, signature);

      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        payload,
        signature,
        'whsec_test_secret',
      );
      expect(result).toEqual(mockEvent);
      expect(result.type).toBe('payment_intent.succeeded');
    });

    it('should throw error if webhook secret is not configured', () => {
      const serviceWithoutSecret = new StripeService({
        get: jest.fn((key: string) => {
          if (key === 'STRIPE_SECRET_KEY') return 'sk_test_key';
          return null; // No webhook secret
        }),
      } as any);

      expect(() => serviceWithoutSecret.verifyWebhookSignature('payload', 'signature')).toThrow(
        'Stripe webhook secret not configured',
      );
    });

    it('should throw error on invalid signature', () => {
      stripeMock.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      expect(() => service.verifyWebhookSignature('payload', 'invalid_signature')).toThrow(
        'Invalid signature',
      );
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_mock123',
        object: 'subscription',
        status: 'active',
        metadata: { updated: 'true' },
      } as Partial<Stripe.Subscription> as Stripe.Subscription;

      stripeMock.subscriptions.update.mockResolvedValue(mockSubscription);

      const updateParams: Stripe.SubscriptionUpdateParams = {
        metadata: { updated: 'true' },
      };

      const result = await service.updateSubscription('sub_mock123', updateParams);

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_mock123', updateParams);
      expect(result).toEqual(mockSubscription);
      expect(result.metadata?.updated).toBe('true');
    });

    it('should update subscription items', async () => {
      const mockSubscription = {
        id: 'sub_mock456',
        object: 'subscription',
        status: 'active',
        items: {
          object: 'list',
          data: [
            {
              id: 'si_new',
              price: { id: 'price_platinum' } as Partial<Stripe.Price>,
            } as Partial<Stripe.SubscriptionItem>,
          ],
        } as Partial<Stripe.ApiList<Stripe.SubscriptionItem>>,
      } as Partial<Stripe.Subscription> as Stripe.Subscription;

      stripeMock.subscriptions.update.mockResolvedValue(mockSubscription);

      const updateParams: Stripe.SubscriptionUpdateParams = {
        items: [{ price: 'price_platinum' }],
      };

      const result = await service.updateSubscription('sub_mock456', updateParams);

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_mock456', updateParams);
      expect(result.items.data[0].price.id).toBe('price_platinum');
    });

    it('should handle update errors', async () => {
      stripeMock.subscriptions.update.mockRejectedValue(new Error('Invalid subscription update'));

      await expect(service.updateSubscription('sub_invalid', {})).rejects.toThrow(
        'Invalid subscription update',
      );
    });
  });

  describe('reactivateSubscription', () => {
    it('should reactivate a subscription successfully', async () => {
      const mockSubscription = {
        id: 'sub_mock123',
        object: 'subscription',
        status: 'active',
        cancel_at_period_end: false,
      } as Partial<Stripe.Subscription> as Stripe.Subscription;

      stripeMock.subscriptions.update.mockResolvedValue(mockSubscription);

      const result = await service.reactivateSubscription('sub_mock123');

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_mock123', {
        cancel_at_period_end: false,
      });
      expect(result.cancel_at_period_end).toBe(false);
      expect(result.status).toBe('active');
    });

    it('should handle reactivation errors', async () => {
      stripeMock.subscriptions.update.mockRejectedValue(
        new Error('Cannot reactivate canceled subscription'),
      );

      await expect(service.reactivateSubscription('sub_canceled')).rejects.toThrow(
        'Cannot reactivate canceled subscription',
      );
    });
  });

  describe('Error Handling', () => {
    it('should propagate Stripe API errors with proper context', async () => {
      const stripeError = new Error('Rate limit exceeded');
      (stripeError as any).type = 'StripeRateLimitError';

      stripeMock.customers.create.mockRejectedValue(stripeError);

      await expect(service.createCustomer('test@example.com')).rejects.toThrow(
        'Rate limit exceeded',
      );
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network timeout');
      stripeMock.paymentIntents.create.mockRejectedValue(networkError);

      await expect(service.createPaymentIntent(1000, 'eur')).rejects.toThrow('Network timeout');
    });
  });
});
