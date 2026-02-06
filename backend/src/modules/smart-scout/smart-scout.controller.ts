import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SubscriptionTierGuard } from '../../common/guards/subscription-tier.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { MinTier } from '../../common/decorators/min-tier.decorator';
import { SubscriptionTier } from '@prisma/client';
import { SmartScoutService } from './smart-scout.service';
import { PartialReportDto } from './dto/partial-report.dto';
import { ReportContextDto } from './dto/report-context.dto';
import { SuggestionResponseDto } from './dto/suggestion-response.dto';
import { AutocompleteRequestDto, AutocompleteResponseDto } from './dto/autocomplete-request.dto';

@ApiTags('SmartScout AI')
@Controller('smart-scout')
@UseGuards(JwtAuthGuard, RolesGuard, SubscriptionTierGuard)
@ApiBearerAuth()
export class SmartScoutController {
  constructor(private readonly smartScoutService: SmartScoutService) {}

  @Post('suggestions')
  @Roles('SCOUT', 'ANALYST', 'ADMIN', 'SUPER_ADMIN')
  @MinTier(SubscriptionTier.GOLD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get intelligent suggestions for report completion (GOLD+)',
    description:
      'Analyzes partial report data and returns similar reports with AI-powered suggestions to help complete the report. Uses vector embeddings when available, falls back to rule-based matching. Requires GOLD subscription or higher.',
  })
  @ApiBody({
    description: 'Partial report data and context',
    schema: {
      type: 'object',
      properties: {
        partialReport: {
          type: 'object',
          description: 'Partial report data entered so far',
        },
        context: {
          type: 'object',
          description: 'Additional context (match, player, scout)',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Suggestions generated successfully',
    type: SuggestionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async getSuggestions(
    @Body('partialReport') partialReport: PartialReportDto,
    @Body('context') context: ReportContextDto,
  ): Promise<SuggestionResponseDto> {
    return this.smartScoutService.getSuggestions(partialReport, context || {});
  }

  @Post('autocomplete')
  @Roles('SCOUT', 'ANALYST', 'ADMIN', 'SUPER_ADMIN')
  @MinTier(SubscriptionTier.GOLD)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Smart autocomplete for report fields (GOLD+)',
    description:
      'Provides intelligent autocomplete suggestions for report fields based on historical data and context. Supports both structured fields (position, foot) and text fields (strengths, weaknesses). Requires GOLD subscription or higher.',
  })
  @ApiBody({ type: AutocompleteRequestDto })
  @ApiResponse({
    status: 200,
    description: 'Autocomplete suggestions generated',
    type: AutocompleteResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid field name' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async autocomplete(@Body() dto: AutocompleteRequestDto): Promise<AutocompleteResponseDto> {
    return this.smartScoutService.autocomplete(dto.fieldName, dto.partialValue, dto.context || {});
  }

  @Get('insights/:playerId')
  @Roles('SCOUT', 'ANALYST', 'ADMIN', 'SUPER_ADMIN', 'AGENT', 'CLUB_CONTACT')
  @MinTier(SubscriptionTier.GOLD)
  @ApiOperation({
    summary: 'Generate AI insights for player (GOLD+)',
    description:
      'Analyzes all historical scouting reports for a player and generates AI-powered insights about performance trends, scout consensus, and development recommendations. Uses GPT-4 when available. Requires GOLD subscription or higher.',
  })
  @ApiResponse({
    status: 200,
    description: 'Insights generated successfully',
    schema: {
      type: 'object',
      properties: {
        playerId: { type: 'string' },
        insights: { type: 'string' },
        reportCount: { type: 'number' },
        usingAI: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No reports found for player' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInsights(@Param('playerId') playerId: string) {
    const insights = await this.smartScoutService.generateInsights(playerId);

    return {
      playerId,
      insights,
      usingAI: !!process.env.OPENAI_API_KEY,
    };
  }

  @Post('index/:reportId')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Index a specific report (Admin only)',
    description:
      'Generates and stores vector embeddings for a specific scouting report. This allows the report to be used in similarity searches. Automatically skips if already indexed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Report indexed successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        reportId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Report not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async indexReport(@Param('reportId') reportId: string) {
    await this.smartScoutService.indexReport(reportId);

    return {
      message: 'Report indexed successfully',
      reportId,
    };
  }

  @Post('reindex-all')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reindex all approved reports (Admin only)',
    description:
      'Generates and stores vector embeddings for ALL approved scouting reports in the database. This is a heavy operation and should be used sparingly. Use for initial setup or after major changes.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reindexing completed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        indexed: { type: 'number', description: 'Number of reports successfully indexed' },
        failed: { type: 'number', description: 'Number of reports that failed to index' },
        totalProcessed: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async reindexAll() {
    const result = await this.smartScoutService.reindexAll();

    return {
      message: 'Reindexing completed',
      indexed: result.indexed,
      failed: result.failed,
      totalProcessed: result.indexed + result.failed,
    };
  }
}
