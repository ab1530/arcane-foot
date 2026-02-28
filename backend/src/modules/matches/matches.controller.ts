import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CreateMissionRequestDto } from './dto/create-mission-request.dto';
import { QueryMissionRequestsDto } from './dto/query-mission-requests.dto';
import { DecideMissionRequestDto } from './dto/decide-mission-request.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MatchStatus } from '@prisma/client';

@ApiTags('Matches')
@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new match',
    description: 'Schedule a new match between two clubs',
  })
  @ApiResponse({ status: 201, description: 'Match successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all matches',
    description: 'Retrieve a paginated list of matches with optional filters',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: MatchStatus,
    description: 'Filter by match status',
  })
  @ApiQuery({ name: 'clubId', required: false, description: 'Filter by club ID (home or away)' })
  @ApiQuery({ name: 'scoutId', required: false, description: 'Filter by assigned scout ID' })
  @ApiQuery({ name: 'competition', required: false, description: 'Filter by competition name' })
  @ApiQuery({ name: 'season', required: false, description: 'Filter by season' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date (ISO 8601)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiResponse({ status: 200, description: 'List of matches retrieved successfully' })
  findAll(
    @Query('status') status?: MatchStatus,
    @Query('clubId') clubId?: string,
    @Query('scoutId') scoutId?: string,
    @Query('competition') competition?: string,
    @Query('season') season?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.matchesService.findAll({
      status,
      clubId,
      scoutId,
      competition,
      season,
      from,
      to,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('my-assignments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get matches assigned to me',
    description:
      "Retrieve matches where I'm directly assigned (legacy scout field or assignment table)",
  })
  @ApiResponse({ status: 200, description: 'Assigned matches retrieved successfully' })
  getMyAssignments(
    @Request() req,
    @Query('status') status?: MatchStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    return this.matchesService.findUserAssignments(userId, {
      status,
      from,
      to,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('scout-calendar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get scout shared calendar',
    description:
      'Returns my missions, shared scout missions and discover matches with country/league filters.',
  })
  @ApiQuery({ name: 'country', required: false, description: 'Filter by country' })
  @ApiQuery({ name: 'league', required: false, description: 'Filter by league name' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date (ISO 8601)' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date (ISO 8601)' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by assignment or mobile status',
  })
  getScoutCalendar(
    @Request() req,
    @Query('country') country?: string,
    @Query('league') league?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.getScoutCalendar(userId, role, {
      country,
      league,
      from,
      to,
      status,
    });
  }

  @Post(':id/my-calendar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Add match to my scout calendar',
    description: 'Creates or updates a VOLUNTARY mission assignment for the authenticated scout.',
  })
  addMatchToMyCalendar(@Param('id') id: string, @Request() req) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.addMatchToMyCalendar(id, userId, role);
  }

  @Post(':id/mission-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create mission request on a match',
    description: 'Agent/Admin requests a scout mission assignment workflow.',
  })
  @ApiResponse({ status: 201, description: 'Mission request created successfully' })
  createMissionRequest(
    @Param('id') id: string,
    @Body() payload: CreateMissionRequestDto,
    @Request() req,
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.createMissionRequest(id, payload, userId, role);
  }

  @Get(':id/mission-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List mission requests for one match',
  })
  @ApiResponse({ status: 200, description: 'Mission requests fetched successfully' })
  getMatchMissionRequests(
    @Param('id') id: string,
    @Query() query: QueryMissionRequestsDto,
    @Request() req,
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.listMissionRequests(
      { matchId: id, status: query.status },
      userId,
      role,
    );
  }

  @Get('mission-requests')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List mission requests',
  })
  @ApiResponse({ status: 200, description: 'Mission requests fetched successfully' })
  getMissionRequests(@Query() query: QueryMissionRequestsDto, @Request() req) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.listMissionRequests({ status: query.status }, userId, role);
  }

  @Patch('mission-requests/:requestId/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Approve mission request',
  })
  @ApiResponse({ status: 200, description: 'Mission request approved successfully' })
  approveMissionRequest(
    @Param('requestId') requestId: string,
    @Body() payload: DecideMissionRequestDto,
    @Request() req,
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.approveMissionRequest(requestId, payload, userId, role);
  }

  @Patch('mission-requests/:requestId/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Reject mission request',
  })
  @ApiResponse({ status: 200, description: 'Mission request rejected successfully' })
  rejectMissionRequest(
    @Param('requestId') requestId: string,
    @Body() payload: DecideMissionRequestDto,
    @Request() req,
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.rejectMissionRequest(requestId, payload, userId, role);
  }

  @Patch('mission-requests/:requestId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Cancel mission request',
  })
  @ApiResponse({ status: 200, description: 'Mission request cancelled successfully' })
  cancelMissionRequest(
    @Param('requestId') requestId: string,
    @Body() payload: DecideMissionRequestDto,
    @Request() req,
  ) {
    const userId = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    const role = req?.user?.role;
    return this.matchesService.cancelMissionRequest(requestId, payload, userId, role);
  }

  @Get('upcoming')
  @ApiOperation({
    summary: 'Get upcoming matches',
    description: 'Retrieve upcoming scheduled matches',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of matches to return',
    example: 10,
  })
  @ApiResponse({ status: 200, description: 'Upcoming matches retrieved successfully' })
  getUpcoming(@Query('limit') limit?: string) {
    return this.matchesService.getUpcoming(limit ? parseInt(limit) : undefined);
  }

  @Get('live')
  @ApiOperation({ summary: 'Get live matches', description: 'Retrieve currently live matches' })
  @ApiResponse({ status: 200, description: 'Live matches retrieved successfully' })
  getLive() {
    return this.matchesService.getLive();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get match by ID',
    description: 'Retrieve detailed information about a specific match',
  })
  @ApiParam({ name: 'id', description: 'Match ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Match found' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update match', description: 'Update match information' })
  @ApiParam({ name: 'id', description: 'Match ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Match successfully updated' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete match', description: 'Delete a match' })
  @ApiParam({ name: 'id', description: 'Match ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiResponse({ status: 200, description: 'Match successfully deleted' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }

  @Patch(':id/assign-scout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Assign scout to match',
    description: 'Assign a scout to cover this match',
  })
  @ApiParam({ name: 'id', description: 'Match ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiBody({ schema: { properties: { scoutId: { type: 'string', example: 'clxxxxxxxxxxxxxx' } } } })
  @ApiResponse({ status: 200, description: 'Scout successfully assigned' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  assignScout(@Param('id') id: string, @Body('scoutId') scoutId: string, @Request() req) {
    const assignedById = req?.user?.id ?? req?.user?.sub ?? req?.user?.userId;
    return this.matchesService.assignScout(id, scoutId, assignedById);
  }

  @Patch(':id/score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update match score', description: 'Update the final score of a match' })
  @ApiParam({ name: 'id', description: 'Match ID', example: 'clxxxxxxxxxxxxxx' })
  @ApiBody({
    schema: {
      properties: {
        homeScore: { type: 'number', example: 2 },
        awayScore: { type: 'number', example: 1 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Score successfully updated' })
  @ApiResponse({ status: 404, description: 'Match not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token required' })
  updateScore(
    @Param('id') id: string,
    @Body('homeScore') homeScore: number,
    @Body('awayScore') awayScore: number,
  ) {
    return this.matchesService.updateScore(id, homeScore, awayScore);
  }
}
