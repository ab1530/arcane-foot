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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoachingService } from './coaching.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { RateBookingDto } from './dto/rate-booking.dto';
import { CoachingType } from '@prisma/client';

@ApiTags('Coaching')
@Controller('coaching')
export class CoachingController {
  constructor(private readonly coachingService: CoachingService) {}

  // =============== COACHES ENDPOINTS ===============

  @Post('coaches')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer un nouveau coach',
    description: 'Créer un coach (admins uniquement)',
  })
  @ApiResponse({ status: 201, description: 'Coach créé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  createCoach(@Body() dto: CreateCoachDto) {
    return this.coachingService.createCoach(dto);
  }

  @Get('coaches')
  @ApiOperation({
    summary: 'Récupérer tous les coaches',
    description: 'Récupère la liste de tous les coaches disponibles',
  })
  @ApiQuery({ name: 'coachingType', enum: CoachingType, required: false })
  @ApiQuery({ name: 'city', type: String, required: false })
  @ApiQuery({ name: 'isActive', type: Boolean, required: false })
  @ApiQuery({ name: 'canWorkRemote', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Liste des coaches récupérée avec succès' })
  getAllCoaches(
    @Query('coachingType') coachingType?: CoachingType,
    @Query('city') city?: string,
    @Query('isActive') isActive?: string,
    @Query('canWorkRemote') canWorkRemote?: string,
  ) {
    return this.coachingService.getAllCoaches({
      coachingType,
      city,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      canWorkRemote: canWorkRemote !== undefined ? canWorkRemote === 'true' : undefined,
    });
  }

  @Get('coaches/:id')
  @ApiOperation({
    summary: 'Récupérer un coach par ID',
    description: "Récupère les détails complets d'un coach",
  })
  @ApiResponse({ status: 200, description: 'Coach récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Coach non trouvé' })
  getCoachById(@Param('id') id: string) {
    return this.coachingService.getCoachById(id);
  }

  @Put('coaches/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Mettre à jour un coach',
    description: "Mettre à jour les informations d'un coach (admins uniquement)",
  })
  @ApiResponse({ status: 200, description: 'Coach mis à jour avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Coach non trouvé' })
  updateCoach(@Param('id') id: string, @Body() dto: UpdateCoachDto) {
    return this.coachingService.updateCoach(id, dto);
  }

  @Delete('coaches/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Supprimer un coach',
    description: 'Supprimer un coach (admins uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Coach supprimé avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Coach non trouvé' })
  deleteCoach(@Param('id') id: string) {
    return this.coachingService.deleteCoach(id);
  }

  @Get('coaches/:id/bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Récupérer les réservations d'un coach",
    description: "Récupère toutes les réservations d'un coach (coaches/admins uniquement)",
  })
  @ApiResponse({ status: 200, description: 'Réservations récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Coach non trouvé' })
  getCoachBookings(@Param('id') id: string) {
    return this.coachingService.getCoachBookings(id);
  }

  // =============== BOOKINGS ENDPOINTS ===============

  @Post('bookings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Créer une réservation',
    description: 'Réserver une séance avec un coach',
  })
  @ApiResponse({ status: 201, description: 'Réservation créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou coach non disponible' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: "Tier d'abonnement insuffisant" })
  @ApiResponse({ status: 404, description: 'Coach non trouvé' })
  createBooking(@Req() req, @Body() dto: CreateBookingDto) {
    return this.coachingService.createBooking(req.user.id, dto);
  }

  @Get('bookings/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer mes réservations',
    description: "Récupère toutes les réservations de l'utilisateur connecté",
  })
  @ApiResponse({ status: 200, description: 'Réservations récupérées avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  getMyBookings(@Req() req) {
    return this.coachingService.getMyBookings(req.user.id);
  }

  @Get('bookings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Récupérer une réservation par ID',
    description: "Récupère les détails d'une réservation",
  })
  @ApiResponse({ status: 200, description: 'Réservation récupérée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Non autorisé à voir cette réservation' })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  getBookingById(@Req() req, @Param('id') id: string) {
    return this.coachingService.getBookingById(req.user.id, id);
  }

  @Delete('bookings/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Annuler une réservation',
    description: 'Annuler une réservation de coaching',
  })
  @ApiResponse({ status: 200, description: 'Réservation annulée avec succès' })
  @ApiResponse({ status: 400, description: "Impossible d'annuler cette réservation" })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Non autorisé à annuler cette réservation' })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  cancelBooking(@Req() req, @Param('id') id: string) {
    return this.coachingService.cancelBooking(req.user.id, id);
  }

  @Put('bookings/:id/rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Noter une réservation',
    description: 'Donner une note et un avis sur une séance terminée',
  })
  @ApiResponse({ status: 200, description: 'Note enregistrée avec succès' })
  @ApiResponse({ status: 400, description: 'Séance non terminée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Non autorisé à noter cette réservation' })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  rateBooking(@Req() req, @Param('id') id: string, @Body() dto: RateBookingDto) {
    return this.coachingService.rateBooking(req.user.id, id, dto);
  }

  @Put('bookings/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Marquer une séance comme terminée',
    description:
      'Marquer une séance comme terminée avec feedback optionnel (coaches/admins uniquement)',
  })
  @ApiResponse({ status: 200, description: 'Séance marquée comme terminée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 404, description: 'Réservation non trouvée' })
  completeBooking(@Param('id') id: string, @Body('coachFeedback') coachFeedback?: string) {
    return this.coachingService.completeBooking(id, coachFeedback);
  }
}
