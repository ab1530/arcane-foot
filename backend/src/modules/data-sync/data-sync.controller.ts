import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { DataSyncService } from './data-sync.service';

@ApiTags('Data Sync')
@ApiBearerAuth()
@Controller('admin/data-sync')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DataSyncController {
  constructor(private dataSyncService: DataSyncService) {}

  @Post('competitions')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Sync competitions manually' })
  async syncCompetitions(@Body('source') source: string) {
    await this.dataSyncService.syncCompetitions(source);
    return { message: 'Competitions sync started' };
  }

  @Post('clubs')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Sync clubs for a competition' })
  async syncClubs(
    @Body('competitionId') competitionId: string,
    @Body('source') source: string,
  ) {
    await this.dataSyncService.syncClubs(competitionId, source);
    return { message: 'Clubs sync started' };
  }

  @Post('players')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Sync players for a club' })
  async syncPlayers(
    @Body('clubId') clubId: string,
    @Body('source') source: string,
  ) {
    await this.dataSyncService.syncPlayers(clubId, source);
    return { message: 'Players sync started' };
  }

  @Post('matches')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Sync matches for a competition' })
  async syncMatches(
    @Body('competitionId') competitionId: string,
    @Body('source') source: string,
  ) {
    await this.dataSyncService.syncMatches(competitionId, source);
    return { message: 'Matches sync started' };
  }

  @Post('full')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Full sync (competitions + clubs + players + matches)' })
  async fullSync(@Body('competitionIds') competitionIds: string[]) {
    await this.dataSyncService.fullSync(competitionIds);
    return { message: 'Full sync started' };
  }
}
