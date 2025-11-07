import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AutoScoutService } from './auto-scout.service';
import {
  GenerateReportDto,
  BulkGenerateDto,
  EnhanceReportDto,
  CustomGenerateDto,
} from './dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auto-scout')
@Controller('auto-scout')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AutoScoutController {
  constructor(private readonly autoScoutService: AutoScoutService) {}

  @Post('generate')
  @Roles('SCOUT', 'ADMIN', 'DIRECTOR')
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 reports per hour
  @ApiOperation({
    summary: 'Generate AI scouting report',
    description: 'Generate a comprehensive scouting report using GPT-4 based on player statistics and performance data.',
  })
  @ApiResponse({
    status: 201,
    description: 'Report generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or insufficient data',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded (max 10 reports per hour)',
  })
  async generateReport(
    @Body() dto: GenerateReportDto,
    @Request() req: any,
  ) {
    const report = await this.autoScoutService.generateReport(
      dto.playerId,
      dto.matchId,
      {
        reportType: dto.reportType,
        customContext: dto.customContext,
        temperature: dto.temperature,
        includeComparisons: dto.includeComparisons,
      },
      req.user.userId,
    );

    return {
      success: true,
      data: report,
      message: 'Report generated successfully',
      costWarning: 'AI-generated report. Please review before using officially.',
      qualityGrade: report.qualityScore.grade,
    };
  }

  @Post('bulk-generate')
  @Roles('ADMIN', 'DIRECTOR')
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 bulk operations per hour
  @ApiOperation({
    summary: 'Generate multiple AI scouting reports',
    description: 'Generate reports for multiple players at once (max 50 players). Admin/Director only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk generation completed',
  })
  @ApiResponse({
    status: 403,
    description: 'Insufficient permissions',
  })
  async bulkGenerate(
    @Body() dto: BulkGenerateDto,
    @Request() req: any,
  ) {
    const result = await this.autoScoutService.generateBulkReports(
      dto.playerIds,
      dto.matchId,
      req.user.userId,
    );

    return {
      success: true,
      data: result,
      message: `Generated ${result.successful} reports successfully, ${result.failed} failed`,
      estimatedCost: `$${result.totalCost.toFixed(4)}`,
    };
  }

  @Post('enhance/:reportId')
  @Roles('SCOUT', 'ADMIN', 'DIRECTOR')
  @Throttle({ default: { limit: 15, ttl: 3600000 } }) // 15 enhancements per hour
  @ApiOperation({
    summary: 'Enhance existing scouting report',
    description: 'Add AI-generated insights and improvements to an existing scouting report.',
  })
  @ApiResponse({
    status: 200,
    description: 'Report enhanced successfully',
  })
  async enhanceReport(
    @Param('reportId') reportId: string,
    @Body() dto: EnhanceReportDto,
  ) {
    const enhancedReport = await this.autoScoutService.enhanceReport(reportId);

    return {
      success: true,
      data: enhancedReport,
      message: 'Report enhanced with AI insights',
    };
  }

  @Get('templates')
  @Roles('SCOUT', 'ADMIN', 'DIRECTOR')
  @ApiOperation({
    summary: 'Get available report templates',
    description: 'Retrieve list of predefined report templates for different use cases.',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async getTemplates() {
    const templates = this.autoScoutService.getReportTemplates();

    return {
      success: true,
      data: templates,
      count: templates.length,
    };
  }

  @Post('custom')
  @Roles('ADMIN', 'DIRECTOR')
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 custom reports per hour
  @ApiOperation({
    summary: 'Generate report with custom template',
    description: 'Generate a report using a custom template. Admin/Director only.',
  })
  @ApiResponse({
    status: 201,
    description: 'Custom report generated successfully',
  })
  async customGenerate(
    @Body() dto: CustomGenerateDto,
    @Request() req: any,
  ) {
    const report = await this.autoScoutService.customGenerate(
      dto.playerId,
      dto.template,
      dto.customPrompt,
      req.user.userId,
    );

    return {
      success: true,
      data: report,
      message: 'Custom report generated successfully',
    };
  }

  @Get('preview/:playerId')
  @Roles('SCOUT', 'ADMIN', 'DIRECTOR')
  @Throttle({ default: { limit: 20, ttl: 3600000 } }) // 20 previews per hour
  @ApiOperation({
    summary: 'Preview report without saving',
    description: 'Generate a quick preview report without saving to database or consuming API quota.',
  })
  @ApiResponse({
    status: 200,
    description: 'Preview generated successfully',
  })
  async previewReport(
    @Param('playerId') playerId: string,
    @Query('matchId') matchId?: string,
  ) {
    // Generate report without saving
    const report = await this.autoScoutService.generateReport(
      playerId,
      matchId,
      { reportType: undefined },
      undefined, // No scout ID = won't save
    );

    return {
      success: true,
      data: report,
      message: 'Preview generated (not saved)',
      note: 'This is a preview only. Use /generate endpoint to save report.',
    };
  }

  @Get('analytics')
  @Roles('ADMIN', 'DIRECTOR')
  @ApiOperation({
    summary: 'Get AutoScout analytics',
    description: 'Retrieve analytics about AI report generation usage, costs, and quality metrics.',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Analytics retrieved successfully',
  })
  async getAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    const analytics = await this.autoScoutService.getAnalytics(start, end);

    return {
      success: true,
      data: analytics,
      period: {
        start: start?.toISOString() || 'All time',
        end: end?.toISOString() || 'Present',
      },
    };
  }

  @Get('player/:playerId/history')
  @Roles('SCOUT', 'ADMIN', 'DIRECTOR')
  @ApiOperation({
    summary: 'Get AI report history for player',
    description: 'Retrieve all AI-generated reports for a specific player.',
  })
  @ApiResponse({
    status: 200,
    description: 'Report history retrieved successfully',
  })
  async getPlayerReportHistory(@Param('playerId') playerId: string) {
    // This would need implementation in service
    return {
      success: true,
      message: 'Feature coming soon',
    };
  }

  @Get('cost-estimate')
  @Roles('SCOUT', 'ADMIN', 'DIRECTOR')
  @ApiOperation({
    summary: 'Estimate cost for report generation',
    description: 'Get cost estimate before generating a report.',
  })
  @ApiQuery({ name: 'reportType', required: false, enum: ['MATCH_PERFORMANCE', 'SEASON_OVERVIEW', 'TRANSFER_TARGET', 'YOUTH_PROSPECT', 'QUICK_SCAN'] })
  @ApiResponse({
    status: 200,
    description: 'Cost estimate provided',
  })
  async getCostEstimate(@Query('reportType') reportType?: string) {
    // Rough estimates based on typical token usage
    const estimates = {
      MATCH_PERFORMANCE: { tokens: 3000, cost: 0.024 },
      SEASON_OVERVIEW: { tokens: 3500, cost: 0.028 },
      TRANSFER_TARGET: { tokens: 4000, cost: 0.032 },
      YOUTH_PROSPECT: { tokens: 3200, cost: 0.026 },
      QUICK_SCAN: { tokens: 2000, cost: 0.016 },
      default: { tokens: 3500, cost: 0.028 },
    };

    const estimate = estimates[reportType as keyof typeof estimates] || estimates.default;

    return {
      success: true,
      data: {
        reportType: reportType || 'SEASON_OVERVIEW (default)',
        estimatedTokens: estimate.tokens,
        estimatedCost: `$${estimate.cost.toFixed(4)}`,
        note: 'This is an estimate. Actual cost may vary based on complexity.',
      },
    };
  }

  @Post('regenerate/:reportId')
  @Roles('SCOUT', 'ADMIN', 'DIRECTOR')
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @ApiOperation({
    summary: 'Regenerate existing report',
    description: 'Regenerate an AI report with different parameters (e.g., different temperature).',
  })
  @ApiResponse({
    status: 201,
    description: 'Report regenerated successfully',
  })
  async regenerateReport(
    @Param('reportId') reportId: string,
    @Query('temperature') temperature?: number,
  ) {
    return {
      success: false,
      message: 'Feature coming soon',
    };
  }
}
