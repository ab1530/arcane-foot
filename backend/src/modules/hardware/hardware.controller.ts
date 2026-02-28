import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HardwareService } from './hardware.service';
import { CreateHardwareSessionDto } from './dto/create-hardware-session.dto';
import { GetHardwareSessionDto } from './dto/get-hardware-session.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Hardware')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hardware/sessions')
export class HardwareController {
  constructor(private readonly hardwareService: HardwareService) {}

  @Post()
  @Roles('PLAYER')
  @ApiOperation({
    summary: 'Create a hardware GPS session',
    description:
      'Ingest a simulated GPS session. Players can only create sessions for themselves (playerId optional).',
  })
  @ApiResponse({ status: 201, description: 'Session created', type: GetHardwareSessionDto })
  create(@Body() dto: CreateHardwareSessionDto, @Request() req) {
    // For players, playerId will be forced to req.user profile; non-players can supply playerId when allowed.
    return this.hardwareService.createSession(dto, req.user);
  }

  @Get('player/:playerId')
  @Roles('PLAYER', 'ADMIN', 'SCOUT', 'ANALYST', 'AGENT', 'SUPER_ADMIN', 'CLUB_CONTACT')
  @ApiOperation({
    summary: 'List hardware sessions for a player',
    description:
      'Returns all GPS hardware sessions for the given player with attached player snapshot.',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
    type: GetHardwareSessionDto,
    isArray: true,
  })
  findByPlayer(@Param('playerId') playerId: string, @Request() req) {
    return this.hardwareService.getSessionsByPlayer(playerId, req.user);
  }

  @Get(':sessionId')
  @Roles('PLAYER', 'ADMIN', 'SCOUT', 'ANALYST', 'AGENT', 'SUPER_ADMIN', 'CLUB_CONTACT')
  @ApiOperation({
    summary: 'Get hardware session details',
    description: 'Returns the full detail of a specific GPS hardware session',
  })
  @ApiParam({ name: 'sessionId', description: 'Hardware session ID' })
  @ApiResponse({ status: 200, description: 'Session found', type: GetHardwareSessionDto })
  findOne(@Param('sessionId') sessionId: string, @Request() req) {
    return this.hardwareService.getSessionById(sessionId, req.user);
  }

  @Delete(':sessionId')
  @Roles('PLAYER', 'ADMIN', 'SCOUT', 'ANALYST', 'AGENT', 'SUPER_ADMIN', 'CLUB_CONTACT')
  @ApiOperation({
    summary: 'Delete hardware session',
    description: 'Remove a GPS hardware session. Players can only delete their own sessions.',
  })
  @ApiParam({ name: 'sessionId', description: 'Hardware session ID' })
  delete(@Param('sessionId') sessionId: string, @Request() req) {
    return this.hardwareService.deleteSession(sessionId, req.user);
  }
}
