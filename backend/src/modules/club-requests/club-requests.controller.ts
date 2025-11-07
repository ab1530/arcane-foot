import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClubRequestsService } from './club-requests.service';
import { CreateClubRequestDto } from './dto/create-club-request.dto';
import { UpdateClubRequestDto } from './dto/update-club-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ClubRequestStatus } from '@prisma/client';

@ApiTags('Club Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('club-requests')
export class ClubRequestsController {
  constructor(private readonly clubRequestsService: ClubRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle demande de club' })
  @ApiResponse({ status: 201, description: 'Demande créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou demande déjà existante' })
  @ApiResponse({ status: 404, description: 'Club ou joueur introuvable' })
  create(@Body() createClubRequestDto: CreateClubRequestDto) {
    return this.clubRequestsService.create(createClubRequestDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les demandes de clubs' })
  @ApiQuery({ name: 'clubId', required: false, description: 'Filtrer par club' })
  @ApiQuery({ name: 'playerId', required: false, description: 'Filtrer par joueur' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ClubRequestStatus,
    description: 'Filtrer par statut'
  })
  @ApiResponse({ status: 200, description: 'Liste des demandes récupérée avec succès' })
  findAll(
    @Query('clubId') clubId?: string,
    @Query('playerId') playerId?: string,
    @Query('status') status?: ClubRequestStatus,
  ) {
    return this.clubRequestsService.findAll({ clubId, playerId, status });
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Récupérer les statistiques des demandes' })
  @ApiQuery({ name: 'clubId', required: false, description: 'Statistiques pour un club spécifique' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  getStatistics(@Query('clubId') clubId?: string) {
    return this.clubRequestsService.getStatistics(clubId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une demande par son ID' })
  @ApiResponse({ status: 200, description: 'Demande récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  findOne(@Param('id') id: string) {
    return this.clubRequestsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une demande' })
  @ApiResponse({ status: 200, description: 'Demande mise à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Transition de statut invalide' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  update(@Param('id') id: string, @Body() updateClubRequestDto: UpdateClubRequestDto) {
    return this.clubRequestsService.update(id, updateClubRequestDto);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accepter une demande' })
  @ApiResponse({ status: 200, description: 'Demande acceptée avec succès' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  accept(@Param('id') id: string, @Body('message') message?: string) {
    return this.clubRequestsService.accept(id, message);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rejeter une demande' })
  @ApiResponse({ status: 200, description: 'Demande rejetée avec succès' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  reject(@Param('id') id: string, @Body('message') message?: string) {
    return this.clubRequestsService.reject(id, message);
  }

  @Post(':id/negotiate')
  @ApiOperation({ summary: 'Passer une demande en négociation' })
  @ApiResponse({ status: 200, description: 'Demande en négociation' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  negotiate(
    @Param('id') id: string,
    @Body('offerAmount') offerAmount?: number,
    @Body('message') message?: string,
  ) {
    return this.clubRequestsService.negotiate(id, offerAmount, message);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Marquer une demande comme complétée' })
  @ApiResponse({ status: 200, description: 'Demande complétée avec succès' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  complete(@Param('id') id: string, @Body('message') message?: string) {
    return this.clubRequestsService.complete(id, message);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une demande' })
  @ApiResponse({ status: 200, description: 'Demande supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Demande introuvable' })
  remove(@Param('id') id: string) {
    return this.clubRequestsService.delete(id);
  }
}
