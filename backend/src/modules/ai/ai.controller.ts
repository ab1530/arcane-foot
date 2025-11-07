import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import { GenerateSummaryDto, MatchmakingRequestDto } from './dto/ai.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AiThrottlerGuard } from '../../common/guards/ai-throttler.guard';

@ApiTags('AI Intelligence')
@Controller('ai')
@UseGuards(JwtAuthGuard, AiThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 10 } }) // 10 AI requests per minute to prevent excessive OpenAI costs
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('summary')
  @ApiOperation({
    summary: 'Generate AI summary',
    description: 'Generate an AI-powered summary based on the provided prompt',
  })
  @ApiResponse({ status: 201, description: 'Summary generated successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests - Rate limit exceeded (10/min)' })
  generateSummary(@Body() body: GenerateSummaryDto) {
    return this.aiService.generateSummary(body);
  }

  @Get('index/:playerId')
  @ApiOperation({
    summary: 'Get player AI index',
    description: 'Calculate AI-powered performance index for a player',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({ status: 200, description: 'Player index calculated' })
  getPlayerIndex(@Param('playerId') playerId: string) {
    return this.aiService.getPlayerIndex(playerId);
  }

  @Post('matchmaking')
  @ApiOperation({
    summary: 'AI matchmaking',
    description: 'AI-powered matchmaking between players and clubs',
  })
  @ApiResponse({ status: 201, description: 'Matches generated successfully' })
  matchmaking(@Body() body: MatchmakingRequestDto) {
    return this.aiService.matchmaking(body);
  }

  @Get('player-analysis/:playerId')
  @ApiOperation({
    summary: 'Analyze player performance',
    description: 'Get comprehensive AI analysis of player performance',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Player analysis complete',
    schema: {
      type: 'object',
      properties: {
        playerId: { type: 'string' },
        overallRating: { type: 'number', example: 75 },
        strengthWeakness: {
          type: 'object',
          properties: {
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
          },
        },
        potentialScore: { type: 'number', example: 85 },
        marketValue: { type: 'string', example: '€12.5M' },
        performanceTrend: { type: 'string', enum: ['IMPROVING', 'STABLE', 'DECLINING'] },
        recommendations: { type: 'array', items: { type: 'string' } },
        injuryRisk: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'] },
      },
    },
  })
  analyzePlayer(@Param('playerId') playerId: string) {
    return this.aiService.analyzePlayerPerformance(playerId);
  }

  @Get('talent-prediction/:playerId')
  @ApiOperation({
    summary: 'Predict talent potential',
    description: 'AI prediction of player potential and development curve',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Talent prediction complete',
    schema: {
      type: 'object',
      properties: {
        playerId: { type: 'string' },
        currentAbility: { type: 'number', example: 70 },
        potentialAbility: { type: 'number', example: 85 },
        peakAge: { type: 'number', example: 27 },
        developmentCurve: {
          type: 'object',
          properties: {
            current: { type: 'number' },
            peak: { type: 'number' },
            trajectory: { type: 'string', enum: ['ASCENDING', 'DESCENDING'] },
          },
        },
        confidence: { type: 'number', example: 0.85 },
      },
    },
  })
  predictTalent(@Param('playerId') playerId: string) {
    return this.aiService.predictTalentPotential(playerId);
  }

  @Get('match-recommendation/:playerId')
  @ApiOperation({
    summary: 'Get club recommendations',
    description: 'AI-powered club matching recommendations for a player',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Recommendations generated',
    schema: {
      type: 'object',
      properties: {
        playerId: { type: 'string' },
        playerName: { type: 'string' },
        topMatches: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              clubId: { type: 'string' },
              clubName: { type: 'string' },
              compatibilityScore: { type: 'number' },
              tacticalFit: { type: 'string' },
              financialFeasibility: { type: 'boolean' },
              developmentOpportunity: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getClubRecommendations(@Param('playerId') playerId: string) {
    return this.aiService.intelligentMatchmaking(playerId);
  }

  @Get('suspicious-detection/:playerId')
  @ApiOperation({
    summary: 'Detect suspicious profiles',
    description: 'AI-powered detection of potentially fraudulent player profiles',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Suspicion analysis complete',
    schema: {
      type: 'object',
      properties: {
        playerId: { type: 'string' },
        suspicionScore: { type: 'number', example: 25 },
        isSuspicious: { type: 'boolean' },
        factors: { type: 'array', items: { type: 'string' } },
        recommendation: {
          type: 'string',
          enum: ['APPEARS_LEGITIMATE', 'FLAG_FOR_REVIEW', 'REVIEW_IMMEDIATELY']
        },
      },
    },
  })
  detectSuspicious(@Param('playerId') playerId: string) {
    return this.aiService.detectSuspiciousProfile(playerId);
  }
}
