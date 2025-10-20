import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { SubscriptionStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  constructor(
    private stripeService: StripeService,
    private prisma: PrismaService,
  ) {}

  /**
   * Create or get Stripe customer for user
   */
  async getOrCreateStripeCustomer(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // If user already has a Stripe customer ID, return it
    if (user.subscription?.stripeCustomerId) {
      return user.subscription.stripeCustomerId;
    }

    // Create new Stripe customer
    const stripeCustomer = await this.stripeService.createCustomer(
      user.email,
      `${user.firstName} ${user.lastName}`,
      { userId: user.id },
    );

    // Update or create subscription record with Stripe customer ID
    if (user.subscription) {
      await this.prisma.subscription.update({
        where: { id: user.subscription.id },
        data: { stripeCustomerId: stripeCustomer.id },
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId: user.id,
          stripeCustomerId: stripeCustomer.id,
        },
      });
    }

    return stripeCustomer.id;
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(createPaymentIntentDto: CreatePaymentIntentDto) {
    const { amount, currency, userId, description } = createPaymentIntentDto;

    let customerId: string | undefined;
    if (userId) {
      customerId = await this.getOrCreateStripeCustomer(userId);
    }

    const paymentIntent = await this.stripeService.createPaymentIntent(
      amount,
      currency,
      customerId,
      description ? { description } : undefined,
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Create a subscription
   */
  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    const { userId, tier, priceId } = createSubscriptionDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.subscription?.status === SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('User already has an active subscription');
    }

    // Get or create Stripe customer
    const customerId = await this.getOrCreateStripeCustomer(userId);

    // Create Stripe subscription
    const stripeSubscription = await this.stripeService.createSubscription(customerId, priceId, {
      userId,
      tier,
    });

    // Update local subscription record
    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tier,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId: customerId,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        startDate: new Date(),
        endDate: new Date((stripeSubscription as any).current_period_end * 1000),
      },
      update: {
        tier,
        status: SubscriptionStatus.ACTIVE,
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        startDate: new Date(),
        endDate: new Date((stripeSubscription as any).current_period_end * 1000),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      subscription,
      clientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret,
    };
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription for user ${userId} not found`);
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('No Stripe subscription found');
    }

    // Cancel in Stripe
    await this.stripeService.cancelSubscription(subscription.stripeSubscriptionId);

    // Update local record
    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelAt: new Date(),
      },
    });
  }

  /**
   * Get user subscription
   */
  async getUserSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription for user ${userId} not found`);
    }

    return subscription;
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(payload: string, signature: string) {
    const event = this.stripeService.verifyWebhookSignature(payload, signature);

    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await this.handleSubscriptionUpdate(event.data.object as any);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as any);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as any);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handleSubscriptionUpdate(subscription: any) {
    const localSubscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id },
    });

    if (!localSubscription) {
      return;
    }

    let status: SubscriptionStatus;
    switch (subscription.status) {
      case 'active':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'canceled':
        status = SubscriptionStatus.CANCELLED;
        break;
      case 'past_due':
        status = SubscriptionStatus.PAST_DUE;
        break;
      default:
        status = SubscriptionStatus.ACTIVE;
    }

    await this.prisma.subscription.update({
      where: { id: localSubscription.id },
      data: {
        status,
        endDate: new Date((subscription as any).current_period_end * 1000),
      },
    });
  }

  private async handlePaymentSucceeded(invoice: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.ACTIVE },
      });
    }
  }

  private async handlePaymentFailed(invoice: any) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (subscription) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: SubscriptionStatus.PAST_DUE },
      });
    }
  }
}
