import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PlayersService } from './players.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('players')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @Roles('ADMIN', 'AGENT', 'SCOUT', 'ANALYST')
  async findAll(
    @Query('position') position?: string,
    @Query('status') status?: string,
    @Query('nationality') nationality?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.playersService.findAll({
      position,
      status,
      nationality,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get(':id')
  @Roles('ADMIN', 'AGENT', 'SCOUT', 'ANALYST', 'PLAYER')
  async findOne(@Param('id') id: string) {
    return this.playersService.findOne(id);
  }
}
