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
  Patch,
} from '@nestjs/common';
import { MatchesService } from './matches.service';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MatchStatus } from '@prisma/client';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Get()
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

  @Get('upcoming')
  getUpcoming(@Query('limit') limit?: string) {
    return this.matchesService.getUpcoming(limit ? parseInt(limit) : undefined);
  }

  @Get('live')
  getLive() {
    return this.matchesService.getLive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto) {
    return this.matchesService.update(id, updateMatchDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.matchesService.remove(id);
  }

  @Patch(':id/assign-scout')
  @UseGuards(JwtAuthGuard)
  assignScout(@Param('id') id: string, @Body('scoutId') scoutId: string) {
    return this.matchesService.assignScout(id, scoutId);
  }

  @Patch(':id/score')
  @UseGuards(JwtAuthGuard)
  updateScore(
    @Param('id') id: string,
    @Body('homeScore') homeScore: number,
    @Body('awayScore') awayScore: number,
  ) {
    return this.matchesService.updateScore(id, homeScore, awayScore);
  }
}
