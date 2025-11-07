import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private stripeService: StripeService,
  ) {}

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
          await this.stripeService.cancelSubscription(
            existingSubscription.stripeSubscriptionId,
          );
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

    // Pour les tiers payants, créer ou mettre à jour via Stripe
    let stripeCustomerId = existingSubscription?.stripeCustomerId;

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
      dto.stripePriceId,
      {
        userId: user.id,
        tier: dto.tier,
      },
    );

    // Calculer la date de fin
    const endDate = new Date((stripeSubscription as any).current_period_end * 1000);

    if (existingSubscription) {
      // Mettre à jour l'abonnement existant
      return this.prisma.subscriptions.update({
        where: { userId },
        data: {
          tier: dto.tier,
          status: SubscriptionStatus.ACTIVE,
          stripeCustomerId,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: dto.stripePriceId,
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
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: dto.stripePriceId,
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
      throw new BadRequestException('Impossible d\'annuler un abonnement gratuit');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Aucun abonnement Stripe trouvé');
    }

    // Annuler l'abonnement Stripe
    await this.stripeService.cancelSubscription(
      subscription.stripeSubscriptionId,
      dto.immediately,
    );

    // Mettre à jour le statut
    return this.prisma.subscriptions.update({
      where: { userId },
      data: {
        status: dto.immediately ? SubscriptionStatus.CANCELLED : SubscriptionStatus.ACTIVE,
        cancelAt: dto.immediately ? new Date() : subscription.endDate,
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

    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('L\'abonnement n\'est pas annulé');
    }

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Aucun abonnement Stripe trouvé');
    }

    // Réactiver l'abonnement Stripe
    await this.stripeService.reactivateSubscription(subscription.stripeSubscriptionId);

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

    if (!subscription.stripeSubscriptionId) {
      throw new BadRequestException('Aucun abonnement Stripe trouvé');
    }

    // Mettre à jour l'abonnement Stripe
    const updatedSubscription = await this.stripeService.updateSubscription(
      subscription.stripeSubscriptionId,
      { items: [{ price: dto.stripePriceId }] },
    );

    const endDate = new Date((updatedSubscription as any).current_period_end * 1000);

    return this.prisma.subscriptions.update({
      where: { userId },
      data: {
        tier: dto.tier,
        stripePriceId: dto.stripePriceId,
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
        status: stripeSubscription.status === 'active'
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
