import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClubNeedsService } from './club-needs.service';
import { CreateClubNeedRequestDto } from './dto/create-club-need-request.dto';
import { ListClubNeedRequestsDto } from './dto/list-club-need-requests.dto';

@ApiTags('Club Needs')
@ApiBearerAuth()
@Controller('club-needs')
export class ClubNeedsController {
  constructor(private readonly clubNeedsService: ClubNeedsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a club needs request (Admin only)' })
  @ApiResponse({ status: 201, description: 'Request created' })
  async create(@Body() dto: CreateClubNeedRequestDto, @Request() req: any) {
    const userId = req.user?.id ?? req.user?.userId ?? req.user?.sub;
    const topN = dto.topN ?? 5;
    return this.clubNeedsService.createRequest(userId, dto.rawText, topN);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List club needs requests (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of requests' })
  async list(@Query() query: ListClubNeedRequestsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    return this.clubNeedsService.listRequests({ page, limit });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get a club needs request (Admin only)' })
  @ApiResponse({ status: 200, description: 'Request' })
  async get(@Param('id') id: string, @Query('topN') topNRaw?: string) {
    const request = await this.clubNeedsService.getRequest(id);
    const includeMatches = true;
    if (!includeMatches) return request;

    const topN = topNRaw ? Math.max(1, Math.min(parseInt(topNRaw, 10) || 5, 20)) : 5;
    const parsed = (request.parsed as any) as any[];
    const matches = await this.clubNeedsService.computeMatches(parsed as any, topN);
    return { request, matches };
  }

  @Post('preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Preview parsing + matches without saving (Admin only)' })
  @ApiResponse({ status: 200, description: 'Preview result' })
  async preview(@Body() dto: CreateClubNeedRequestDto) {
    const topN = dto.topN ?? 5;
    return this.clubNeedsService.preview(dto.rawText, topN);
  }
}

