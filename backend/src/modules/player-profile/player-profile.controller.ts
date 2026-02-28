import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import {
  BulkUpsertPlayerProfileDto,
  CreateAchievementEntryDto,
  CreateCareerEntryDto,
  CreateNationalTeamEntryDto,
  CreateNewsEntryDto,
  CreatePerformanceRowDto,
  CreateRumourEntryDto,
  CreateTransferEventDto,
  GetPlayerProfileQueryDto,
  UpdateAchievementEntryDto,
  UpdateCareerEntryDto,
  UpdateNationalTeamEntryDto,
  UpdateNewsEntryDto,
  UpdatePerformanceRowDto,
  UpdatePlayerProfileMetaDto,
  UpdateProfileContentStatusDto,
  UpdateRumourEntryDto,
  UpdateTransferEventDto,
} from './dto';
import { PlayerProfileService } from './player-profile.service';

@ApiTags('Player Profile')
@Controller('player-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PlayerProfileController {
  constructor(private readonly playerProfileService: PlayerProfileService) {}

  @Get(':playerId')
  @Roles('PLAYER', 'SCOUT', 'ANALYST', 'AGENT', 'CLUB_CONTACT', 'ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get rich internal player profile view' })
  @ApiResponse({ status: 200, description: 'Profile view' })
  async getPlayerProfile(
    @Param('playerId') playerId: string,
    @Query() query: GetPlayerProfileQueryDto,
    @Request() req: any,
  ) {
    return this.playerProfileService.getPlayerProfileView(
      playerId,
      req.user?.role,
      query.includeUnpublished,
    );
  }

  @Get(':playerId/audit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get profile section audit trail (admin only)' })
  @ApiResponse({ status: 200, description: 'Audit data by section' })
  async getAuditTrail(@Param('playerId') playerId: string) {
    return this.playerProfileService.getAuditTrail(playerId);
  }

  @Patch(':playerId/meta')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Upsert player profile meta (admin only)' })
  async updateMeta(
    @Param('playerId') playerId: string,
    @Body() dto: UpdatePlayerProfileMetaDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.upsertMeta(playerId, dto, actorId);
  }

  @Post(':playerId/performance-rows')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createPerformanceRow(
    @Param('playerId') playerId: string,
    @Body() dto: CreatePerformanceRowDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.createPerformanceRow(playerId, dto, actorId);
  }

  @Patch(':playerId/performance-rows/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updatePerformanceRow(
    @Param('playerId') playerId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdatePerformanceRowDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.updatePerformanceRow(playerId, itemId, dto, actorId);
  }

  @Delete(':playerId/performance-rows/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deletePerformanceRow(@Param('playerId') playerId: string, @Param('itemId') itemId: string) {
    return this.playerProfileService.deletePerformanceRow(playerId, itemId);
  }

  @Post(':playerId/transfers')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createTransfer(
    @Param('playerId') playerId: string,
    @Body() dto: CreateTransferEventDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.createTransfer(playerId, dto, actorId);
  }

  @Patch(':playerId/transfers/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateTransfer(
    @Param('playerId') playerId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateTransferEventDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.updateTransfer(playerId, itemId, dto, actorId);
  }

  @Delete(':playerId/transfers/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteTransfer(@Param('playerId') playerId: string, @Param('itemId') itemId: string) {
    return this.playerProfileService.deleteTransfer(playerId, itemId);
  }

  @Post(':playerId/career')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createCareerEntry(
    @Param('playerId') playerId: string,
    @Body() dto: CreateCareerEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.createCareerEntry(playerId, dto, actorId);
  }

  @Patch(':playerId/career/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateCareerEntry(
    @Param('playerId') playerId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCareerEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.updateCareerEntry(playerId, itemId, dto, actorId);
  }

  @Delete(':playerId/career/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteCareerEntry(@Param('playerId') playerId: string, @Param('itemId') itemId: string) {
    return this.playerProfileService.deleteCareerEntry(playerId, itemId);
  }

  @Post(':playerId/achievements')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createAchievement(
    @Param('playerId') playerId: string,
    @Body() dto: CreateAchievementEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.createAchievement(playerId, dto, actorId);
  }

  @Patch(':playerId/achievements/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateAchievement(
    @Param('playerId') playerId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateAchievementEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.updateAchievement(playerId, itemId, dto, actorId);
  }

  @Delete(':playerId/achievements/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteAchievement(@Param('playerId') playerId: string, @Param('itemId') itemId: string) {
    return this.playerProfileService.deleteAchievement(playerId, itemId);
  }

  @Post(':playerId/national-team')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createNationalTeamEntry(
    @Param('playerId') playerId: string,
    @Body() dto: CreateNationalTeamEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.createNationalTeamEntry(playerId, dto, actorId);
  }

  @Patch(':playerId/national-team/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateNationalTeamEntry(
    @Param('playerId') playerId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateNationalTeamEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.updateNationalTeamEntry(playerId, itemId, dto, actorId);
  }

  @Delete(':playerId/national-team/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteNationalTeamEntry(
    @Param('playerId') playerId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.playerProfileService.deleteNationalTeamEntry(playerId, itemId);
  }

  @Post(':playerId/news')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createNewsEntry(
    @Param('playerId') playerId: string,
    @Body() dto: CreateNewsEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.createNewsEntry(playerId, dto, actorId);
  }

  @Patch(':playerId/news/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateNewsEntry(
    @Param('playerId') playerId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateNewsEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.updateNewsEntry(playerId, itemId, dto, actorId);
  }

  @Delete(':playerId/news/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteNewsEntry(@Param('playerId') playerId: string, @Param('itemId') itemId: string) {
    return this.playerProfileService.deleteNewsEntry(playerId, itemId);
  }

  @Post(':playerId/rumours')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createRumourEntry(
    @Param('playerId') playerId: string,
    @Body() dto: CreateRumourEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.createRumourEntry(playerId, dto, actorId);
  }

  @Patch(':playerId/rumours/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateRumourEntry(
    @Param('playerId') playerId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateRumourEntryDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.updateRumourEntry(playerId, itemId, dto, actorId);
  }

  @Delete(':playerId/rumours/:itemId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteRumourEntry(@Param('playerId') playerId: string, @Param('itemId') itemId: string) {
    return this.playerProfileService.deleteRumourEntry(playerId, itemId);
  }

  @Patch(':playerId/:section/:itemId/status')
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateStatus(
    @Param('playerId') playerId: string,
    @Param('section') section: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateProfileContentStatusDto,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.updateSectionStatus(
      section,
      playerId,
      itemId,
      dto.status,
      actorId,
    );
  }
}

@ApiTags('Player Profile Internal')
@Controller('internal/player-profiles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class InternalPlayerProfileController {
  constructor(private readonly playerProfileService: PlayerProfileService) {}

  @Post('bulk-upsert')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Bulk upsert profile sections through internal sync pipeline' })
  async bulkUpsert(
    @Body() dto: BulkUpsertPlayerProfileDto,
    @Headers('x-internal-sync-key') syncKey: string | undefined,
    @Request() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.playerProfileService.bulkUpsert(dto, actorId, req.user?.role, syncKey);
  }
}
