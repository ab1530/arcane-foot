import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { FilterPlayersDto } from './dto/filter-players.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new player', description: 'Creates a new player profile' })
  @ApiResponse({ status: 201, description: 'Player successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  create(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all players',
    description: 'Retrieve a paginated list of players with advanced filters (age, height, weight, market value, etc.)'
  })
  @ApiResponse({ status: 200, description: 'Liste des joueurs récupérée avec succès' })
  findAll(@Query() filters: FilterPlayersDto) {
    return this.playersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get player by ID', description: 'Retrieve detailed information about a specific player' })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Player found' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update player', description: 'Update player information' })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Player successfully updated' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.update(id, updatePlayerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete player', description: 'Delete a player profile' })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Player successfully deleted' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get player statistics', description: 'Retrieve detailed statistics for a player' })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  getStats(@Param('id') id: string) {
    return this.playersService.getStats(id);
  }

  @Get(':id/reports')
  @ApiOperation({ summary: 'Get player scouting reports', description: 'Retrieve all scouting reports for a player' })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  getReports(@Param('id') id: string) {
    return this.playersService.getReports(id);
  }
}
