import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { getPublicPricingPlans } from './subscription-pricing.config';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('pricing')
  @ApiOperation({
    summary: 'Get subscription pricing plans',
    description:
      'Returns all available subscription tiers with pricing and features (public endpoint)',
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing plans retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tier: { type: 'string', example: 'GOLD' },
          name: { type: 'string', example: 'Gold' },
          description: { type: 'string' },
          priceMonthly: { type: 'number', example: 49.99 },
          priceYearly: { type: 'number', example: 499.99 },
          currency: { type: 'string', example: 'EUR' },
          features: { type: 'array', items: { type: 'string' } },
          isPopular: { type: 'boolean' },
        },
      },
    },
  })
  getPricing() {
    return {
      plans: getPublicPricingPlans(),
      currency: 'EUR',
      billingCycle: ['monthly', 'yearly'],
      updatedAt: '2025-11-06',
      notes: [
        'Prices increased by +150% based on market analysis',
        'Still 10x cheaper than Wyscout (€3K-20K/year)',
        'Annual plans include 17% discount',
        'All prices in EUR excluding VAT',
      ],
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer mon abonnement',
    description: "Récupère les détails de l'abonnement de l'utilisateur connecté",
  })
  @ApiResponse({ status: 200, description: 'Abonnement récupéré avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  getMySubscription(@Req() req) {
    return this.subscriptionsService.getMySubscription(req.user.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer ou mettre à jour un abonnement',
    description: "Crée un nouvel abonnement ou met à jour l'abonnement existant",
  })
  @ApiResponse({ status: 201, description: 'Abonnement créé/mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  createOrUpdateSubscription(@Req() req, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.createOrUpdateSubscription(req.user.id, dto);
  }

  @Put('cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Annuler mon abonnement',
    description: "Annule l'abonnement actif de l'utilisateur",
  })
  @ApiResponse({ status: 200, description: 'Abonnement annulé avec succès' })
  @ApiResponse({ status: 400, description: "Impossible d'annuler l'abonnement" })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  cancelSubscription(@Req() req, @Body() dto: CancelSubscriptionDto) {
    return this.subscriptionsService.cancelSubscription(req.user.id, dto);
  }

  @Put('reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réactiver mon abonnement',
    description: 'Réactive un abonnement précédemment annulé',
  })
  @ApiResponse({ status: 200, description: 'Abonnement réactivé avec succès' })
  @ApiResponse({ status: 400, description: "Impossible de réactiver l'abonnement" })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  reactivateSubscription(@Req() req) {
    return this.subscriptionsService.reactivateSubscription(req.user.id);
  }

  @Put('change-tier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Changer de niveau d'abonnement",
    description: "Upgrade ou downgrade le niveau d'abonnement",
  })
  @ApiResponse({ status: 200, description: "Niveau d'abonnement changé avec succès" })
  @ApiResponse({ status: 400, description: 'Impossible de changer le niveau' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Abonnement non trouvé' })
  changeTier(@Req() req, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.changeTier(req.user.id, dto);
  }
}
