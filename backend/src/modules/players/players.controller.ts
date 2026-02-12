import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { FilterPlayersDto } from './dto/filter-players.dto';
import { RecordPlayerViewDto } from './dto/record-player-view.dto';
import { ScoutQuickImportDto } from './dto/scout-quick-import.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Players')
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCOUT', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new player',
    description: 'Creates a new player profile. Requires SCOUT, ADMIN, or SUPER_ADMIN role.',
  })
  @ApiResponse({ status: 201, description: 'Player successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  create(@Body() createPlayerDto: CreatePlayerDto) {
    return this.playersService.create(createPlayerDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all players',
    description:
      'Retrieve a paginated list of players with advanced filters (age, height, weight, market value, etc.)',
  })
  @ApiResponse({ status: 200, description: 'Liste des joueurs récupérée avec succès' })
  findAll(@Query() filters: FilterPlayersDto) {
    return this.playersService.findAll(filters);
  }

  @Get('views/recent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get recently viewed players',
    description: 'Return a list of players recently viewed by the authenticated user.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Maximum number of recent players to return (default: 12)',
  })
  @ApiResponse({ status: 200, description: 'Recent players retrieved successfully' })
  getRecentViews(@Query('limit') limit: string | undefined, @Request() req) {
    const parsedLimit = limit ? parseInt(limit, 10) : 12;
    const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 12;
    return this.playersService.getRecentViews(req.user.id, safeLimit);
  }

  @Post('scout-import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCOUT', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Quick import players from scout text',
    description:
      'Parse multi-line scout notes and create or update players without requiring linked user accounts.',
  })
  @ApiResponse({ status: 201, description: 'Scout import completed' })
  @ApiResponse({ status: 400, description: 'Invalid request payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  quickImport(@Body() dto: ScoutQuickImportDto, @Request() req) {
    return this.playersService.quickImportFromScoutText(dto, req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get player by ID',
    description: 'Retrieve detailed information about a specific player',
  })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Player found' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCOUT', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update player',
    description: 'Update player information. Requires SCOUT, ADMIN, or SUPER_ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Player successfully updated' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  update(@Param('id') id: string, @Body() updatePlayerDto: UpdatePlayerDto) {
    return this.playersService.update(id, updatePlayerDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete player',
    description: 'Delete a player profile. Requires ADMIN or SUPER_ADMIN role.',
  })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Player successfully deleted' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires ADMIN or SUPER_ADMIN role' })
  remove(@Param('id') id: string) {
    return this.playersService.remove(id);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Record a player view',
    description:
      'Store or update the last viewed timestamp for a player by the authenticated user.',
  })
  @ApiResponse({ status: 200, description: 'Player view recorded successfully' })
  recordView(@Param('id') id: string, @Body() dto: RecordPlayerViewDto, @Request() req) {
    return this.playersService.recordView(id, req.user.id, dto?.source);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Get player statistics',
    description: 'Retrieve detailed statistics for a player',
  })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  getStats(@Param('id') id: string) {
    return this.playersService.getStats(id);
  }

  @Get(':id/reports')
  @ApiOperation({
    summary: 'Get player scouting reports',
    description: 'Retrieve all scouting reports for a player',
  })
  @ApiParam({ name: 'id', description: 'Player ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  getReports(@Param('id') id: string) {
    return this.playersService.getReports(id);
  }
}
