import {
  Req,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AgentRequestsService } from './agent-requests.service';
import { CreateAgentRequestDto } from './dto/create-agent-request.dto';
import { ListAgentRequestsQueryDto } from './dto/list-agent-requests.dto';
import { UpdateAgentRequestStatusDto } from './dto/update-agent-request-status.dto';
import { MarketProfileRuleDto } from './dto/market-profile-rule.dto';

@ApiTags('Demandes à l\'agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agent-requests')
export class AgentRequestsController {
  constructor(private readonly agentRequestsService: AgentRequestsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('PLAYER', 'SCOUT', 'AGENT', 'ADMIN', 'SUPER_ADMIN', 'CLUB_CONTACT')
  @ApiOperation({ summary: 'Créer une demande à l\'agent' })
  @ApiResponse({ status: 201, description: 'Demande créée avec succès' })
  @ApiResponse({ status: 400, description: 'Requête invalide' })
  create(@Body() dto: CreateAgentRequestDto, @Req() req: any) {
    return this.agentRequestsService.createRequest(dto, {
      id: req?.user?.id,
      role: req?.user?.role,
      playerId: req?.user?.playerId,
    });
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('PLAYER', 'SCOUT', 'AGENT', 'ADMIN', 'SUPER_ADMIN', 'CLUB_CONTACT')
  @ApiOperation({ summary: 'Lister les demandes à l\'agent' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'myOnly', required: false })
  getList(@Query() query: ListAgentRequestsQueryDto, @Req() req: any) {
    const isAdmin = req?.user?.role === 'ADMIN' || req?.user?.role === 'SUPER_ADMIN';
    const includeMineOnly = req?.user?.role === 'PLAYER' ? true : query.myOnly === 'true';

    return this.agentRequestsService.listRequests({
      status: query.status || null,
      category: query.category || null,
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      includeMineOnly: isAdmin ? false : includeMineOnly,
      actorId: req?.user?.id,
    });
  }

  @Get('market-rules')
  @UseGuards(RolesGuard)
  @Roles('PLAYER', 'SCOUT', 'AGENT', 'ADMIN', 'SUPER_ADMIN', 'CLUB_CONTACT')
  @ApiOperation({ summary: 'Obtenir les règles marché/profil configurables' })
  getMarketRules() {
    return this.agentRequestsService.getMarketRules();
  }

  @Post('market-rules')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN', 'AGENT')
  @ApiOperation({ summary: 'Mettre à jour les règles marché/profil' })
  @ApiBody({ type: MarketProfileRuleDto, isArray: true })
  updateMarketRules(@Body() rules: MarketProfileRuleDto[]) {
    return this.agentRequestsService.setMarketRules(rules);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles('PLAYER', 'SCOUT', 'AGENT', 'ADMIN', 'SUPER_ADMIN', 'CLUB_CONTACT')
  @ApiOperation({ summary: 'Détail d\'une demande' })
  @ApiResponse({ status: 200, description: 'Demande récupérée' })
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.agentRequestsService.getRequest(id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('AGENT', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Mettre à jour le statut de la demande' })
  @ApiResponse({ status: 200, description: 'Statut mis à jour' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateAgentRequestStatusDto, @Req() req: any) {
    return this.agentRequestsService.updateStatus(id, dto.status, req?.user?.id);
  }
}
