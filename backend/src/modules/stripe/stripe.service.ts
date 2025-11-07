import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error(
        '[Stripe] STRIPE_SECRET_KEY is not configured. Please set it in the environment before starting the application.',
      );
    }

    const apiVersion = this.configService.get<string>('STRIPE_API_VERSION');
    const stripeConfig: Stripe.StripeConfig = {};

    if (apiVersion) {
      stripeConfig.apiVersion = apiVersion as Stripe.StripeConfig['apiVersion'];
    }

    this.stripe = new Stripe(stripeSecretKey, stripeConfig);

    this.logger.log(
      `Stripe client initialized${apiVersion ? ` (API version: ${apiVersion})` : ''}`,
    );
  }

  /**
   * Create a new customer
   * @param email - Customer email
   * @param name - Customer name
   * @param metadata - Additional metadata
   * @returns Stripe Customer
   */
  async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Customer> {
    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata,
    });

    this.logger.log(`Customer created: ${customer.id}`);
    return customer;
  }

  /**
   * Create a payment intent
   * @param amount - Amount in cents
   * @param currency - Currency code (e.g., 'eur', 'usd')
   * @param customerId - Stripe customer ID
   * @param metadata - Additional metadata
   * @returns Payment Intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string,
    customerId?: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.PaymentIntent> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    this.logger.log(`Payment intent created: ${paymentIntent.id}`);
    return paymentIntent;
  }

  /**
   * Create a subscription
   * @param customerId - Stripe customer ID
   * @param priceId - Stripe price ID
   * @param metadata - Additional metadata
   * @returns Subscription
   */
  async createSubscription(
    customerId: string,
    priceId: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata,
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    });

    this.logger.log(`Subscription created: ${subscription.id}`);
    return subscription;
  }

  /**
   * Cancel a subscription
   * @param subscriptionId - Subscription ID
   * @param immediately - Cancel immediately or at period end
   * @returns Cancelled subscription
   */
  async cancelSubscription(subscriptionId: string, immediately: boolean = false): Promise<Stripe.Subscription> {
    let subscription: Stripe.Subscription;

    if (immediately) {
      subscription = await this.stripe.subscriptions.cancel(subscriptionId);
    } else {
      subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }

    this.logger.log(`Subscription cancelled: ${subscription.id}`);
    return subscription;
  }

  /**
   * Retrieve a customer
   * @param customerId - Customer ID
   * @returns Customer
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
    return await this.stripe.customers.retrieve(customerId);
  }

  /**
   * Create a transfer (for commission/payout)
   * @param amount - Amount in cents
   * @param currency - Currency code
   * @param destination - Connected account ID
   * @param metadata - Additional metadata
   * @returns Transfer
   */
  async createTransfer(
    amount: number,
    currency: string,
    destination: string,
    metadata?: Record<string, string>,
  ): Promise<Stripe.Transfer> {
    const transfer = await this.stripe.transfers.create({
      amount,
      currency,
      destination,
      metadata,
    });

    this.logger.log(`Transfer created: ${transfer.id}`);
    return transfer;
  }

  /**
   * Verify webhook signature
   * @param payload - Raw request body
   * @param signature - Stripe signature header
   * @returns Stripe Event
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }

    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }

  /**
   * Update a subscription
   * @param subscriptionId - Subscription ID
   * @param params - Update parameters
   * @returns Updated subscription
   */
  async updateSubscription(
    subscriptionId: string,
    params: Stripe.SubscriptionUpdateParams,
  ): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, params);

    this.logger.log(`Subscription updated: ${subscription.id}`);
    return subscription;
  }

  /**
   * Reactivate a cancelled subscription
   * @param subscriptionId - Subscription ID
   * @returns Reactivated subscription
   */
  async reactivateSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });

    this.logger.log(`Subscription reactivated: ${subscription.id}`);
    return subscription;
  }
}
