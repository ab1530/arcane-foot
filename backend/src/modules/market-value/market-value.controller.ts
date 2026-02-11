import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionTierGuard } from '../../common/guards/subscription-tier.guard';
import { MinTier } from '../../common/decorators/min-tier.decorator';
import { SubscriptionTier } from '@prisma/client';
import { MarketValueService } from './market-value.service';
import {
  PlayerValuationDto,
  ValuationTrendDto,
  ComparePlayersRequestDto,
  ComparePlayersResponseDto,
} from './dto';

@ApiTags('Market Value')
@Controller('market-value')
export class MarketValueController {
  constructor(private readonly marketValueService: MarketValueService) {}

  @Get('player/:playerId')
  @UseGuards(JwtAuthGuard, SubscriptionTierGuard)
  @MinTier(SubscriptionTier.GOLD)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get player market valuation (GOLD+)',
    description:
      'Get AI-powered market value estimation for a player based on their performance, age, position, and other factors. Requires GOLD subscription or higher.',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Player valuation retrieved successfully',
    type: PlayerValuationDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires GOLD subscription tier or higher',
  })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  async getPlayerValuation(@Param('playerId') playerId: string): Promise<PlayerValuationDto> {
    return this.marketValueService.getPlayerValuation(playerId);
  }

  @Get('trend/:playerId')
  @UseGuards(JwtAuthGuard, SubscriptionTierGuard)
  @MinTier(SubscriptionTier.GOLD)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get player valuation trend (GOLD+)',
    description:
      'Get historical valuation trend for a player showing how their market value has changed over time. Requires GOLD subscription or higher.',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Valuation trend retrieved successfully',
    type: ValuationTrendDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires GOLD subscription tier or higher',
  })
  @ApiResponse({ status: 404, description: 'Player not found' })
  async getValuationTrend(@Param('playerId') playerId: string): Promise<ValuationTrendDto> {
    return this.marketValueService.getValuationTrend(playerId);
  }

  @Post('compare')
  @UseGuards(JwtAuthGuard, SubscriptionTierGuard)
  @MinTier(SubscriptionTier.GOLD)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compare multiple players (GOLD+)',
    description:
      'Compare market valuations of multiple players side by side with statistics. Requires GOLD subscription or higher.',
  })
  @ApiResponse({
    status: 200,
    description: 'Player comparison completed successfully',
    type: ComparePlayersResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (max 10 players)',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires GOLD subscription tier or higher',
  })
  async comparePlayers(
    @Body() compareDto: ComparePlayersRequestDto,
  ): Promise<ComparePlayersResponseDto> {
    return this.marketValueService.compareValuations(compareDto.playerIds);
  }

  @Post('retrain')
  @UseGuards(JwtAuthGuard, SubscriptionTierGuard)
  @MinTier(SubscriptionTier.GOLD)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger model retraining (GOLD+)',
    description:
      'Trigger retraining of the ML model with latest data. This is a resource-intensive operation. Requires GOLD subscription or higher.',
  })
  @ApiResponse({
    status: 200,
    description: 'Model retraining triggered successfully',
  })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  async triggerModelRetrain(): Promise<any> {
    return this.marketValueService.triggerModelRetrain();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Check AI service health',
    description: 'Check if the AI market value service is operational',
  })
  @ApiResponse({
    status: 200,
    description: 'Health status retrieved',
  })
  async checkHealth(): Promise<any> {
    return this.marketValueService.checkAIServiceHealth();
  }
}
