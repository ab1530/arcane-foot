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
import { SubmitPlayerWeeklyUpdateDto } from './dto/submit-player-weekly-update.dto';
import { ResolveObservedPlayerDto } from './dto/resolve-observed-player.dto';
import { GetDiscoveredTreeDto } from './dto/get-discovered-tree.dto';
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

  @Get('me/space')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get space dashboard for connected player',
    description:
      'Returns snapshot, weekly trends, calendar and health/news data for the current player.',
  })
  @ApiResponse({ status: 200, description: 'Player space dashboard retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - PLAYER role required' })
  getMyPlayerSpace(@Request() req) {
    return this.playersService.getMyPlayerSpace(req.user.id, req.user.playerId);
  }

  @Get('space/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Compatibility route for player space dashboard',
    description: 'Backward-compatible alias for player space dashboard for connected player.',
  })
  @ApiResponse({ status: 200, description: 'Player space dashboard retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - PLAYER role required' })
  getMyPlayerSpaceCompatibility(@Request() req) {
    return this.playersService.getMyPlayerSpace(req.user.id, req.user.playerId);
  }

  @Get('me/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Compatibility alias for player space dashboard',
    description:
      'Additional route for legacy clients expecting a /me/dashboard path for player space.',
  })
  @ApiResponse({ status: 200, description: 'Player space dashboard retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - PLAYER role required' })
  getMyPlayerDashboardAlias(@Request() req) {
    return this.playersService.getMyPlayerSpace(req.user.id, req.user.playerId);
  }

  @Get('dashboard/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Compatibility alias for player space dashboard',
    description:
      'Additional route for legacy clients expecting a /dashboard/me path for player space.',
  })
  @ApiResponse({ status: 200, description: 'Player space dashboard retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - PLAYER role required' })
  getPlayerSpaceDashboardAliasReverse(@Request() req) {
    return this.playersService.getMyPlayerSpace(req.user.id, req.user.playerId);
  }

  @Post('me/space/weekly-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Submit weekly update for connected player',
    description: 'Stores weekly match load, stats and health notes for the player view.',
  })
  @ApiResponse({ status: 200, description: 'Weekly update persisted' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - PLAYER role required' })
  submitWeeklyUpdate(@Request() req, @Body() dto: SubmitPlayerWeeklyUpdateDto) {
    return this.playersService.submitMyPlayerWeeklyUpdate(req.user.id, req.user.playerId, dto);
  }

  @Post('space/me/weekly-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Compatibility route to submit weekly update',
    description:
      'Backward-compatible alias for weekly update submission for the current player profile.',
  })
  @ApiResponse({ status: 200, description: 'Weekly update persisted' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - PLAYER role required' })
  submitWeeklyUpdateCompatibility(@Request() req, @Body() dto: SubmitPlayerWeeklyUpdateDto) {
    return this.playersService.submitMyPlayerWeeklyUpdate(req.user.id, req.user.playerId, dto);
  }

  @Post('me/dashboard/weekly-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Compatibility endpoint for weekly update',
    description:
      'Legacy alias to submit weekly updates for connected player via /me/dashboard/weekly-update.',
  })
  @ApiResponse({ status: 200, description: 'Weekly update persisted' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - PLAYER role required' })
  submitWeeklyUpdateDashboardCompatibility(
    @Request() req,
    @Body() dto: SubmitPlayerWeeklyUpdateDto,
  ) {
    return this.playersService.submitMyPlayerWeeklyUpdate(req.user.id, req.user.playerId, dto);
  }

  @Post('dashboard/me/weekly-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('PLAYER')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Compatibility endpoint for weekly update',
    description:
      'Legacy alias to submit weekly updates for connected player via /dashboard/me/weekly-update.',
  })
  @ApiResponse({ status: 200, description: 'Weekly update persisted' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - PLAYER role required' })
  submitWeeklyUpdateReverseDashboardCompatibility(
    @Request() req,
    @Body() dto: SubmitPlayerWeeklyUpdateDto,
  ) {
    return this.playersService.submitMyPlayerWeeklyUpdate(req.user.id, req.user.playerId, dto);
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

  @Post('resolve-observed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCOUT', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Resolve observed player identity',
    description:
      'Resolve a player from observed identity data (exact/probable match) or create a new prospect when no candidate is found.',
  })
  @ApiResponse({
    status: 200,
    description: 'Player successfully resolved from observed identity',
    schema: {
      example: {
        playerId: 'player-uuid',
        resolutionMode: 'exact_match',
        confidence: 0.99,
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid observed identity payload' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - SCOUT, ADMIN or SUPER_ADMIN required' })
  resolveObserved(@Body() dto: ResolveObservedPlayerDto, @Request() req) {
    return this.playersService.resolveObservedPlayer(dto, req.user.id);
  }

  @Get('discovered/tree')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SCOUT', 'ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get discovered players tree for connected scout',
    description:
      'Returns discovered players grouped by country -> competition -> ageCategory, with optional squadType filter (ALL, PRO, RESERVE).',
  })
  @ApiResponse({ status: 200, description: 'Discovered players tree retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  @ApiResponse({ status: 403, description: 'Forbidden - SCOUT, ADMIN or SUPER_ADMIN required' })
  getDiscoveredTree(@Query() query: GetDiscoveredTreeDto, @Request() req) {
    return this.playersService.getDiscoveredTree(req.user.id, query);
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
