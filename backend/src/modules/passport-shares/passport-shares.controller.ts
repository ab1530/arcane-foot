import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PassportSharesService } from './passport-shares.service';
import { CreatePassportShareSetDto } from './dto/create-passport-share-set.dto';
import { ListPassportShareSetsDto } from './dto/list-passport-share-sets.dto';

@ApiTags('Passport Shares')
@Controller('passport-shares')
export class PassportSharesController {
  constructor(private readonly passportSharesService: PassportSharesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a public shortlist link for multiple passports (Admin only)' })
  @ApiResponse({ status: 201, description: 'Share set created' })
  async create(@Body() dto: CreatePassportShareSetDto, @Request() req: any) {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    return this.passportSharesService.createShareSet({
      createdById: userId,
      playerIds: dto.playerIds,
      title: dto.title,
      clubName: dto.clubName,
      sourceFeature: dto.sourceFeature,
      sourceRequestId: dto.sourceRequestId,
      sourceRequestLineNumber: dto.sourceRequestLineNumber,
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List share sets (Admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated share set list' })
  async list(@Query() query: ListPassportShareSetsDto) {
    return this.passportSharesService.listShareSets({
      sourceRequestId: query.sourceRequestId,
      sourceRequestLineNumber: query.sourceRequestLineNumber,
      includeRevoked: query.includeRevoked,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':token')
  @ApiOperation({ summary: 'Get a public shortlist by token (Public)' })
  @ApiResponse({ status: 200, description: 'Share set' })
  async getByToken(@Param('token') token: string) {
    return this.passportSharesService.getShareSetByToken(token);
  }

  @Post(':token/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a shortlist token (Admin only)' })
  @ApiResponse({ status: 200, description: 'Revoked' })
  async revoke(@Param('token') token: string) {
    return this.passportSharesService.revoke(token);
  }
}
