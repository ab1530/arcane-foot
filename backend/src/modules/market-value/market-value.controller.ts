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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get player market valuation',
    description:
      'Get AI-powered market value estimation for a player based on their performance, age, position, and other factors',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Player valuation retrieved successfully',
    type: PlayerValuationDto,
  })
  @ApiResponse({ status: 404, description: 'Player not found' })
  @ApiResponse({ status: 503, description: 'AI service unavailable' })
  async getPlayerValuation(
    @Param('playerId') playerId: string,
  ): Promise<PlayerValuationDto> {
    return this.marketValueService.getPlayerValuation(playerId);
  }

  @Get('trend/:playerId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get player valuation trend',
    description:
      'Get historical valuation trend for a player showing how their market value has changed over time',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Valuation trend retrieved successfully',
    type: ValuationTrendDto,
  })
  @ApiResponse({ status: 404, description: 'Player not found' })
  async getValuationTrend(
    @Param('playerId') playerId: string,
  ): Promise<ValuationTrendDto> {
    return this.marketValueService.getValuationTrend(playerId);
  }

  @Post('compare')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Compare multiple players',
    description:
      'Compare market valuations of multiple players side by side with statistics',
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
  async comparePlayers(
    @Body() compareDto: ComparePlayersRequestDto,
  ): Promise<ComparePlayersResponseDto> {
    return this.marketValueService.compareValuations(compareDto.playerIds);
  }

  @Post('retrain')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Trigger model retraining (Admin only)',
    description:
      'Trigger retraining of the ML model with latest data. This is a resource-intensive operation.',
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
