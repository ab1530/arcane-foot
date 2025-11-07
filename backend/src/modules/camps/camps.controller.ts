import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CampsService } from './camps.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateCampDto } from './dto/create-camp.dto';
import { UpdateCampDto } from './dto/update-camp.dto';
import { RegisterCampDto } from './dto/register-camp.dto';
import { EvaluateParticipantDto } from './dto/evaluate-participant.dto';
import { CampType, CampStatus } from '@prisma/client';

@ApiTags('Camps')
@Controller('camps')
export class CampsController {
  constructor(private readonly campsService: CampsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer un nouveau camp',
    description: 'Créer un camp/détection (agents/admins uniquement)',
  })
  @ApiResponse({ status: 201, description: 'Camp créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  createCamp(@Body() dto: CreateCampDto) {
    return this.campsService.createCamp(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer tous les camps',
    description: 'Récupère la liste de tous les camps avec filtres optionnels',
  })
  @ApiQuery({ name: 'type', enum: CampType, required: false })
  @ApiQuery({ name: 'status', enum: CampStatus, required: false })
  @ApiQuery({ name: 'upcoming', type: Boolean, required: false })
  @ApiQuery({ name: 'isPublic', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Liste des camps récupérée avec succès' })
  getAllCamps(
    @Query('type') type?: CampType,
    @Query('status') status?: CampStatus,
    @Query('upcoming') upcoming?: string,
    @Query('isPublic') isPublic?: string,
  ) {
    return this.campsService.getAllCamps({
      type,
      status,
      upcoming: upcoming === 'true',
      isPublic: isPublic !== undefined ? isPublic === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un camp par ID',
    description: 'Récupère les détails complets d\'un camp',
  })
  @ApiResponse({ status: 200, description: 'Camp récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Camp non trouvé' })
  getCampById(@Param('id') id: string) {
    return this.campsService.getCampById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mettre à jour un camp',
    description: 'Mettre à jour les informations d\'un camp (agents/admins uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Camp mis à jour avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Camp non trouvé' })
  updateCamp(@Param('id') id: string, @Body() dto: UpdateCampDto) {
    return this.campsService.updateCamp(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un camp',
    description: 'Supprimer un camp (agents/admins uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Camp supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Camp non trouvé' })
  deleteCamp(@Param('id') id: string) {
    return this.campsService.deleteCamp(id);
  }

  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'S\'inscrire à un camp',
    description: 'Inscription d\'un joueur à un camp/détection',
  })
  @ApiResponse({ status: 201, description: 'Inscription réussie' })
  @ApiResponse({ status: 400, description: 'Inscription impossible (camp complet, déjà inscrit, etc.)' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Tier d\'abonnement insuffisant' })
  @ApiResponse({ status: 404, description: 'Camp non trouvé' })
  registerForCamp(@Req() req, @Param('id') id: string, @Body() dto: RegisterCampDto) {
    return this.campsService.registerForCamp(req.user.id, id, dto);
  }

  @Get('my/registrations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer mes inscriptions',
    description: 'Récupère toutes les inscriptions aux camps de l\'utilisateur connecté',
  })
  @ApiResponse({ status: 200, description: 'Inscriptions récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getMyRegistrations(@Req() req) {
    return this.campsService.getMyRegistrations(req.user.id);
  }

  @Delete('registrations/:participationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Annuler une inscription',
    description: 'Annuler son inscription à un camp',
  })
  @ApiResponse({ status: 200, description: 'Inscription annulée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Non autorisé à annuler cette inscription' })
  @ApiResponse({ status: 404, description: 'Inscription non trouvée' })
  cancelRegistration(@Req() req, @Param('participationId') participationId: string) {
    return this.campsService.cancelRegistration(req.user.id, participationId);
  }

  @Get(':id/participants')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer les participants d\'un camp',
    description: 'Récupère la liste de tous les participants d\'un camp (agents/admins uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Participants récupérés avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Camp non trouvé' })
  getCampParticipants(@Param('id') id: string) {
    return this.campsService.getCampParticipants(id);
  }

  @Put('participants/:participationId/evaluate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Évaluer un participant',
    description: 'Évaluer la performance d\'un participant au camp (scouts/agents uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Participant évalué avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Participation non trouvée' })
  evaluateParticipant(
    @Param('participationId') participationId: string,
    @Body() dto: EvaluateParticipantDto,
  ) {
    return this.campsService.evaluateParticipant(participationId, dto);
  }
}
