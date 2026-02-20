import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class DashboardMobileController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('mobile-home')
  @ApiOperation({
    summary: 'Dashboard mobile agrégé',
    description:
      'Retourne les cartes KPI, actions rapides et compteurs pending pour l’accueil mobile.',
  })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'SCOUT'],
    description:
      "Scope cible. Ignoré pour les rôles non Catégorie A; utilisé comme surcouche pour ADMIN/SUPER_ADMIN.",
  })
  @ApiResponse({ status: 200, description: 'Payload mobile home généré avec succès' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async getMobileHome(@Request() req: any, @Query('scope') scope?: string) {
    const userId = req?.user?.id ?? req?.user?.sub;
    const role = req?.user?.role ?? 'SCOUT';
    return this.analyticsService.getMobileHomeDashboard(userId, role, scope);
  }
}
