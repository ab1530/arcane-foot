import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Gamification')
@Controller('gamification')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get user gamification profile',
    description: 'Retrieve the gamification profile including level, points, and achievements',
  })
  @ApiResponse({
    status: 200,
    description: 'Gamification profile retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        level: { type: 'number', example: 12 },
        currentPoints: { type: 'number', example: 1250 },
        pointsToNextLevel: { type: 'number', example: 250 },
        totalAchievements: { type: 'number', example: 8 },
        totalBadges: { type: 'number', example: 3 },
        rank: { type: 'number', example: 45 },
        streak: { type: 'number', example: 7 },
      },
    },
  })
  async getProfile(@Req() req: any) {
    return this.gamificationService.getUserProfile(req.user.id);
  }

  @Get('achievements')
  @ApiOperation({
    summary: 'Get user achievements',
    description: 'List all achievements with unlock status for the user',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: ['PLAYER_MILESTONE', 'SCOUT_EXPERTISE', 'CLUB_ACHIEVEMENT', 'SOCIAL_ENGAGEMENT', 'PERFORMANCE'],
    description: 'Filter by achievement category',
  })
  @ApiResponse({
    status: 200,
    description: 'Achievements retrieved successfully',
  })
  async getAchievements(@Req() req: any, @Query('category') category?: string) {
    return this.gamificationService.getUserAchievements(req.user.id, category);
  }

  @Get('badges')
  @ApiOperation({
    summary: 'Get user badges',
    description: 'Retrieve all badges earned by the user',
  })
  @ApiResponse({
    status: 200,
    description: 'Badges retrieved successfully',
  })
  async getBadges(@Req() req: any) {
    return this.gamificationService.getUserBadges(req.user.id);
  }

  @Get('leaderboard/:category')
  @ApiOperation({
    summary: 'Get leaderboard',
    description: 'Retrieve leaderboard rankings for a specific category',
  })
  @ApiParam({
    name: 'category',
    enum: ['WEEKLY_OVERALL', 'WEEKLY_SCOUT', 'MONTHLY_PLAYER', 'SEASON_CLUB', 'ALL_TIME'],
    description: 'Leaderboard category',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of top players to show',
    example: 100,
  })
  @ApiResponse({
    status: 200,
    description: 'Leaderboard retrieved successfully',
  })
  async getLeaderboard(
    @Param('category') category: string,
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.gamificationService.getLeaderboard(category, limitNum, req.user.id);
  }

  @Get('daily-challenge')
  @ApiOperation({
    summary: 'Get daily challenge',
    description: 'Retrieve the current daily challenge and user progress',
  })
  @ApiResponse({
    status: 200,
    description: 'Daily challenge retrieved successfully',
  })
  async getDailyChallenge(@Req() req: any) {
    return this.gamificationService.getDailyChallenge(req.user.id);
  }

  @Post('daily-challenge/claim')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Claim daily challenge reward',
    description: 'Claim the reward for completing the daily challenge',
  })
  @ApiResponse({
    status: 200,
    description: 'Reward claimed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Challenge not completed or already claimed',
  })
  async claimDailyChallengeReward(@Req() req: any) {
    return this.gamificationService.claimDailyChallengeReward(req.user.id);
  }

  @Post('achievement/:id/share')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Share achievement',
    description: 'Mark an achievement as shared on profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Achievement ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Achievement shared successfully',
  })
  async shareAchievement(@Param('id') achievementId: string, @Req() req: any) {
    return this.gamificationService.shareAchievement(req.user.id, achievementId);
  }

  @Post('badge/:id/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Pin badge to profile',
    description: 'Pin a badge to be displayed prominently on profile',
  })
  @ApiParam({
    name: 'id',
    description: 'Badge ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Badge pinned successfully',
  })
  async pinBadge(@Param('id') badgeId: string, @Req() req: any) {
    return this.gamificationService.pinBadge(req.user.id, badgeId);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get user statistics',
    description: 'Retrieve detailed user statistics for gamification',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStats(@Req() req: any) {
    return this.gamificationService.getUserStats(req.user.id);
  }

  @Post('track-action/:action')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Track user action',
    description: 'Track a specific user action for achievements and points',
  })
  @ApiParam({
    name: 'action',
    enum: ['GOAL_SCORED', 'MATCH_PLAYED', 'PROFILE_COMPLETED', 'PLAYER_VALIDATED', 'REPORT_SUBMITTED'],
    description: 'Action type to track',
  })
  @ApiResponse({
    status: 200,
    description: 'Action tracked successfully',
  })
  async trackAction(@Param('action') action: string, @Req() req: any) {
    return this.gamificationService.trackUserAction(req.user.id, action);
  }
}