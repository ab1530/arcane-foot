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
      this.logger.warn('Stripe secret key not configured');
      return;
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-09-30.clover',
    });

    this.logger.log('Stripe client initialized');
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
   * @returns Cancelled subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    const subscription = await this.stripe.subscriptions.cancel(subscriptionId);

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
}
