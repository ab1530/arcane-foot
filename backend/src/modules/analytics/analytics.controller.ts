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
}
