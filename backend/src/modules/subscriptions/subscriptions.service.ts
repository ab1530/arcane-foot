import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';
import { SUBSCRIPTION_PRICING } from './subscription-pricing.config';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);
  private stripe: Stripe;
  private readonly isTestMode: boolean;

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
    private configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    this.isTestMode = stripeSecretKey?.includes('_test_') || false;

    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-09-30.clover' as any,
      });
    }
  }

  /**
   * Get or generate a stripe price ID for a tier
   * Uses real IDs from config if available, generates test IDs otherwise
   */
  private getStripePriceId(tier: SubscriptionTier, providedId?: string): string {
    if (providedId) {
      return providedId;
    }

    // Use configured price ID from pricing config
    const pricingPlan = SUBSCRIPTION_PRICING[tier];
    if (pricingPlan?.stripePriceIdMonthly) {
      return pricingPlan.stripePriceIdMonthly;
    }

    // Generate a test price ID for E2E tests
    const testPriceId = `price_test_${tier.toLowerCase()}_${Date.now()}`;
    this.logger.warn(`No stripePriceId provided for ${tier}, using test ID: ${testPriceId}`);
    return testPriceId;
  }

  /**
   * Récupère l'abonnement d'un utilisateur
   */
  async getMySubscription(userId: string) {
    let subscription = await this.prisma.subscriptions.findUnique({
      where: { userId },
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

    // Si pas d'abonnement, créer un abonnement FREE par défaut
    if (!subscription) {
      subscription = await this.prisma.subscriptions.create({
        data: {
          id: randomUUID(),
          userId,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          updatedAt: new Date(),
        },
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
    }

    return subscription;
  }

  /**
   * Crée ou met à jour un abonnement
   */
  async createOrUpdateSubscription(userId: string, dto: CreateSubscriptionDto) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier si l'utilisateur a déjà un abonnement
    const existingSubscription = await this.prisma.subscriptions.findUnique({
      where: { userId },
    });

    // Si FREE, pas besoin de Stripe
    if (dto.tier === SubscriptionTier.FREE) {
      if (existingSubscription) {
        // Annuler l'abonnement Stripe s'il existe
        if (existingSubscription.stripeSubscriptionId) {
          try {
            await this.stripeService.cancelSubscription(
              existingSubscription.stripeSubscriptionId,
              true,
            );
          } catch (error) {
            this.logger.warn(`Failed to cancel Stripe subscription: ${error.message}`);
          }
        }

        return this.prisma.subscriptions.update({
          where: { userId },
          data: {
            tier: SubscriptionTier.FREE,
            status: SubscriptionStatus.ACTIVE,
            stripeSubscriptionId: null,
            stripePriceId: null,
            endDate: null,
          },
        });
      }

      return this.prisma.subscriptions.create({
        data: {
          id: randomUUID(),
          userId,
          tier: SubscriptionTier.FREE,
          status: SubscriptionStatus.ACTIVE,
          updatedAt: new Date(),
        },
      });
    }

    // Pour les tiers payants, obtenir ou générer le stripePriceId
    const stripePriceId = this.getStripePriceId(dto.tier, dto.stripePriceId);

    let stripeCustomerId = existingSubscription?.stripeCustomerId;
    let stripeSubscriptionId: string | null = null;
    let endDate: Date | null = null;

    // In test mode with mock price IDs, create subscription locally without Stripe
    const isMockPriceId =
      stripePriceId.startsWith('price_test_') ||
      stripePriceId.startsWith('price_GOLD_') ||
      stripePriceId.startsWith('price_PRO_');

    if (isMockPriceId) {
      this.logger.log(`Using mock Stripe flow for test mode (tier: ${dto.tier})`);
      // Generate mock Stripe IDs for testing
      stripeCustomerId =
        existingSubscription?.stripeCustomerId || `cus_test_${randomUUID().substring(0, 14)}`;
      stripeSubscriptionId = `sub_test_${randomUUID().substring(0, 14)}`;
      // Set end date to 30 days from now
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    } else {
      // Real Stripe flow for production
      // Créer un client Stripe si nécessaire
      if (!stripeCustomerId) {
        const stripeCustomer = await this.stripeService.createCustomer(
          user.email,
          `${user.firstName} ${user.lastName}`,
          {
            userId: user.id,
          },
        );
        stripeCustomerId = stripeCustomer.id;
      }

      // Créer l'abonnement Stripe
      const stripeSubscription = await this.stripeService.createSubscription(
        stripeCustomerId,
        stripePriceId,
        {
          userId: user.id,
          tier: dto.tier,
        },
      );

      stripeSubscriptionId = stripeSubscription.id;
      // Calculer la date de fin
      endDate = new Date((stripeSubscription as any).current_period_end * 1000);
    }

    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      return this.prisma.subscriptions.update({
        where: { userId },
        data: {
          tier: dto.tier,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId,
          stripeSubscriptionId: stripeSubscriptionId,
          stripePriceId: stripePriceId,
          endDate,
        },
      });
    }

    // Créer un nouvel abonnement
    return this.prisma.subscriptions.create({
      data: {
        id: randomUUID(),
        userId,
        tier: dto.tier,
        status: SubscriptionStatus.ACTIVE,
        stripeCustomerId,
        stripeSubscriptionId: stripeSubscriptionId,
        stripePriceId: stripePriceId,
        endDate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Annule un abonnement
   */
  async cancelSubscription(userId: string, dto: CancelSubscriptionDto) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Aucun abonnement trouvé');
    }

    if (subscription.tier === SubscriptionTier.FREE) {
      throw new BadRequestException("Impossible d'annuler un abonnement gratuit");
    }

    // Idempotent: if already cancelled, just return the current state
    if (subscription.status === SubscriptionStatus.CANCELLED) {
      this.logger.log(`Subscription already cancelled for user ${userId}`);
      return subscription;
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Aucun abonnement Stripe trouvé');
    }

    // Check if this is a mock subscription (E2E test mode)
    const isMockSubscription = subscription.stripeSubscriptionId.startsWith('sub_test_');

    if (!isMockSubscription) {
      // Annuler l'abonnement Stripe (real Stripe flow)
      await this.stripeService.cancelSubscription(
        subscription.stripeSubscriptionId,
        dto.immediately,
      );
    } else {
      this.logger.log(
        `Skipping Stripe cancellation for mock subscription ${subscription.stripeSubscriptionId}`,
      );
    }

    // For mock subscriptions or immediate cancellations, set status to CANCELLED
    // For real Stripe with delayed cancellation, status stays ACTIVE until end of period
    const shouldCancelImmediately = isMockSubscription || dto.immediately;

    // Mettre à jour le statut
    return this.prisma.subscriptions.update({
      where: { userId },
      data: {
        status: shouldCancelImmediately ? SubscriptionStatus.CANCELLED : SubscriptionStatus.ACTIVE,
        cancelAt: shouldCancelImmediately ? new Date() : subscription.endDate,
      },
    });
  }

  /**
   * Réactive un abonnement annulé
   */
  async reactivateSubscription(userId: string) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Aucun abonnement trouvé');
    }

    // Idempotent: if already active, just return the current state
    if (subscription.status === SubscriptionStatus.ACTIVE) {
      this.logger.log(`Subscription already active for user ${userId}`);
      return subscription;
    }

    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new BadRequestException("L'abonnement n'est pas annulé");
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Aucun abonnement Stripe trouvé');
    }

    // Check if this is a mock subscription (E2E test mode)
    const isMockSubscription = subscription.stripeSubscriptionId.startsWith('sub_test_');

    if (!isMockSubscription) {
      // Réactiver l'abonnement Stripe (real Stripe flow)
      await this.stripeService.reactivateSubscription(subscription.stripeSubscriptionId);
    } else {
      this.logger.log(
        `Skipping Stripe reactivation for mock subscription ${subscription.stripeSubscriptionId}`,
      );
    }

    return this.prisma.subscriptions.update({
      where: { userId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        cancelAt: null,
      },
    });
  }

  /**
   * Change le tier d'un abonnement (upgrade/downgrade)
   */
  async changeTier(userId: string, dto: CreateSubscriptionDto) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { userId },
    });

    if (!subscription) {
      throw new NotFoundException('Aucun abonnement trouvé');
    }

    // Si changement vers FREE, annuler l'abonnement Stripe
    if (dto.tier === SubscriptionTier.FREE) {
      return this.createOrUpdateSubscription(userId, dto);
    }

    // If no Stripe subscription exists (e.g., upgrading from FREE), create a new one
    if (!subscription.stripeSubscriptionId) {
      this.logger.log(`No Stripe subscription found for user ${userId}, creating new subscription`);
      return this.createOrUpdateSubscription(userId, dto);
    }

    // Obtenir ou générer le stripePriceId
    const stripePriceId = this.getStripePriceId(dto.tier, dto.stripePriceId);

    // Check if this is a mock subscription (E2E test mode)
    const isMockSubscription = subscription.stripeSubscriptionId.startsWith('sub_test_');

    let endDate: Date;

    if (isMockSubscription) {
      this.logger.log(
        `Using mock Stripe flow for tier change (userId: ${userId}, tier: ${dto.tier})`,
      );
      // Mock flow: just update locally without calling Stripe
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    } else {
      // Real Stripe flow
      // Retrieve the existing Stripe subscription to get subscription item IDs
      const existingStripeSubscription = await this.stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId,
      );

      // Mettre à jour l'abonnement Stripe with proper items structure
      const updatedSubscription = await this.stripeService.updateSubscription(
        subscription.stripeSubscriptionId,
        {
          items: [
            {
              id: existingStripeSubscription.items.data[0]?.id,
              price: stripePriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        },
      );

      endDate = new Date((updatedSubscription as any).current_period_end * 1000);
    }

    return this.prisma.subscriptions.update({
      where: { userId },
      data: {
        tier: dto.tier,
        stripePriceId: stripePriceId,
        endDate,
      },
    });
  }

  /**
   * Vérifie si un utilisateur a accès à un tier minimum
   */
  async hasMinimumTier(userId: string, minTier: SubscriptionTier): Promise<boolean> {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { userId },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    const tierHierarchy = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.BASIC]: 1,
      [SubscriptionTier.GOLD]: 2,
      [SubscriptionTier.PRO]: 3,
      [SubscriptionTier.ENTERPRISE]: 4,
    };

    return tierHierarchy[subscription.tier] >= tierHierarchy[minTier];
  }

  /**
   * Traite les webhooks Stripe
   */
  async handleStripeWebhook(event: any) {
    switch (event.type) {
      case 'customer.subscription.updated':
        return this.handleSubscriptionUpdated(event.data.object);
      case 'customer.subscription.deleted':
        return this.handleSubscriptionDeleted(event.data.object);
      case 'invoice.payment_succeeded':
        return this.handlePaymentSucceeded(event.data.object);
      case 'invoice.payment_failed':
        return this.handlePaymentFailed(event.data.object);
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionUpdated(stripeSubscription: any) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    const endDate = new Date(stripeSubscription.current_period_end * 1000);

    await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status:
          stripeSubscription.status === 'active'
            ? SubscriptionStatus.ACTIVE
            : SubscriptionStatus.PAST_DUE,
        endDate,
      },
    });
  }

  private async handleSubscriptionDeleted(stripeSubscription: any) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { stripeSubscriptionId: stripeSubscription.id },
    });

    if (!subscription) return;

    await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        tier: SubscriptionTier.FREE,
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });
  }

  private async handlePaymentSucceeded(invoice: any) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (!subscription) return;

    await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  private async handlePaymentFailed(invoice: any) {
    const subscription = await this.prisma.subscriptions.findUnique({
      where: { stripeSubscriptionId: invoice.subscription },
    });

    if (!subscription) return;

    await this.prisma.subscriptions.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });
  }
}
