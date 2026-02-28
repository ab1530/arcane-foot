import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
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
      'Scope cible. Ignoré pour les rôles non Catégorie A; utilisé comme surcouche pour ADMIN/SUPER_ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Payload mobile home généré avec succès' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  async getMobileHome(@Request() req: any, @Query('scope') scope?: string) {
    const userId = req?.user?.id ?? req?.user?.sub;
    const role = req?.user?.role ?? 'SCOUT';
    return this.analyticsService.getMobileHomeDashboard(userId, role, scope);
  }

  @Get('scouts')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary: 'Annuaire scouts pour dashboard mobile admin',
    description: 'Retourne la liste paginée des scouts avec métriques de base.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, example: 'antoine' })
  @ApiResponse({ status: 200, description: 'Liste des scouts récupérée' })
  @ApiResponse({ status: 403, description: 'Accès réservé aux admins' })
  async getScoutsDirectory(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const role = req?.user?.role ?? 'SCOUT';
    return this.analyticsService.getScoutsDirectory(role, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      search: search?.trim() || undefined,
    });
  }
}
