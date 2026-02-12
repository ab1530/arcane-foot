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
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un nouvel événement' })
  @ApiResponse({ status: 201, description: 'Événement créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  create(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.eventsService.create(createEventDto, req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Obtenir tous les événements avec filtres' })
  @ApiResponse({ status: 200, description: 'Liste des événements' })
  findAll(@Query() query: QueryEventDto) {
    return this.eventsService.findAll(query);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Obtenir les événements à venir' })
  @ApiResponse({ status: 200, description: 'Événements à venir' })
  findUpcoming(@Query('limit') limit?: number) {
    return this.eventsService.findUpcoming(limit);
  }

  @Get('my-events')
  @ApiOperation({ summary: 'Obtenir mes événements (assignés)' })
  @ApiResponse({ status: 200, description: 'Mes événements' })
  findMyEvents(@Request() req, @Query() query: QueryEventDto) {
    return this.eventsService.findUserEvents(req.user.sub, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un événement par ID' })
  @ApiResponse({ status: 200, description: "Détails de l'événement" })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un événement' })
  @ApiResponse({ status: 200, description: 'Événement mis à jour' })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un événement' })
  @ApiResponse({ status: 200, description: 'Événement supprimé' })
  @ApiResponse({ status: 404, description: 'Événement introuvable' })
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
