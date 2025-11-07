import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Vue d\'ensemble de la plateforme',
    description: 'Statistiques globales et activité récente de la plateforme',
  })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getPlatformOverview() {
    return this.analyticsService.getPlatformOverview();
  }

  @Get('players')
  @ApiOperation({
    summary: 'Statistiques des joueurs',
    description: 'Analyses détaillées sur les joueurs (répartition, notes, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Statistiques des joueurs récupérées avec succès' })
  getPlayersAnalytics() {
    return this.analyticsService.getPlayersAnalytics();
  }

  @Get('clubs')
  @ApiOperation({
    summary: 'Statistiques des clubs',
    description: 'Analyses sur les clubs (répartition géographique, activité, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Statistiques des clubs récupérées avec succès' })
  getClubsAnalytics() {
    return this.analyticsService.getClubsAnalytics();
  }

  @Get('scouting-reports')
  @ApiOperation({
    summary: 'Statistiques des rapports de scouting',
    description: 'Analyses sur les rapports de scouting et scouts actifs',
  })
  @ApiResponse({ status: 200, description: 'Statistiques des rapports récupérées avec succès' })
  getScoutingReportsAnalytics() {
    return this.analyticsService.getScoutingReportsAnalytics();
  }

  @Get('club-requests')
  @ApiOperation({
    summary: 'Statistiques des demandes de clubs',
    description: 'Analyses sur les demandes de clubs (taux de succès, temps de réponse, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Statistiques des demandes récupérées avec succès' })
  getClubRequestsAnalytics() {
    return this.analyticsService.getClubRequestsAnalytics();
  }

  @Get('events')
  @ApiOperation({
    summary: 'Statistiques des événements',
    description: 'Analyses sur les événements (types, popularité, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Statistiques des événements récupérées avec succès' })
  getEventsAnalytics() {
    return this.analyticsService.getEventsAnalytics();
  }

  @Get('activity-trends')
  @ApiOperation({
    summary: 'Tendances d\'activité',
    description: 'Évolution de l\'activité de la plateforme sur une période donnée',
  })
  @ApiQuery({ name: 'days', required: false, description: 'Nombre de jours (défaut: 30)', example: 30 })
  @ApiResponse({ status: 200, description: 'Tendances récupérées avec succès' })
  getActivityTrends(@Query('days') days?: string) {
    return this.analyticsService.getActivityTrends(days ? parseInt(days) : 30);
  }

  // ==========================================
  // RBAC MONITORING ENDPOINTS
  // ==========================================

  @Get('rbac-metrics')
  @ApiOperation({
    summary: 'RBAC Monitoring Dashboard',
    description: 'Comprehensive metrics for 403 errors, subscription conversions, and feature blocking analytics',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    description: 'Number of days to analyze (default: 7)',
    example: 7,
  })
  @ApiResponse({
    status: 200,
    description: 'RBAC metrics retrieved successfully',
    schema: {
      example: {
        period: 'last_7_days',
        dateRange: {
          start: '2025-11-01T00:00:00.000Z',
          end: '2025-11-07T23:59:59.999Z',
        },
        total_403_errors: 450,
        '403_rate': 4.2,
        most_blocked_features: [
          { feature: 'AI Analysis', count: 120 },
          { feature: 'ArkaneMatch Chat', count: 85 },
          { feature: 'AutoScout', count: 67 },
        ],
        conversions: {
          free_to_gold: 12,
          total: 15,
          conversion_rate: 14.5,
          revenue_generated: 749.85,
          by_tier: {
            'FREE_to_GOLD': 12,
            'FREE_to_PRO': 2,
            'BASIC_to_GOLD': 1,
          },
          by_source: [
            { source: 'ai_features_403', count: 10, revenue: 499.90 },
            { source: 'upgrade_modal', count: 5, revenue: 249.95 },
          ],
        },
        upgrade_modal: {
          shown: 83,
          dismissed: 71,
          cta_clicked: 15,
          ctr: 18.1,
          dismiss_rate: 85.5,
        },
        recommendations: [
          'MODERATE PERFORMANCE: Metrics are within acceptable ranges but there is room for improvement.',
        ],
      },
    },
  })
  getRbacMetrics(@Query('days') days?: string) {
    return this.analyticsService.getRbacMetrics(days ? parseInt(days) : 7);
  }

  @Get('rbac-metrics/403-rate')
  @ApiOperation({
    summary: 'Get 403 Error Rate',
    description: 'Calculate the percentage of requests that result in 403 errors',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiResponse({ status: 200, description: '403 rate calculated successfully' })
  get403Rate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.analyticsService.get403Rate(start, end);
  }

  @Get('rbac-metrics/conversion-rate')
  @ApiOperation({
    summary: 'Get Conversion Rate',
    description: 'Calculate the percentage of blocked users who upgraded their subscription',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiResponse({ status: 200, description: 'Conversion rate calculated successfully' })
  getConversionRate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.analyticsService.getConversionRate(start, end);
  }
}
