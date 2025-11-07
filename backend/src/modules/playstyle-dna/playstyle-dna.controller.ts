import { Controller, Get, Post, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionTierGuard } from '../../common/guards/subscription-tier.guard';
import { MinTier } from '../../common/decorators/min-tier.decorator';
import { SubscriptionTier } from '@prisma/client';
import { PlaystyleDnaService } from './playstyle-dna.service';
import { ClassifyPlayerDto, ComparePlayersDto, FindSimilarPlayersDto } from './dto/playstyle-dna.dto';

@ApiTags('PlayStyle DNA (ML Classification)')
@Controller('playstyle-dna')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
@ApiBearerAuth('JWT-auth')
export class PlaystyleDnaController {
  constructor(private readonly playstyleDnaService: PlaystyleDnaService) {}

  @Post('classify')
  @MinTier(SubscriptionTier.GOLD)
  @ApiOperation({
    summary: 'Classify player playing style (GOLD+)',
    description: 'Use ML to classify a player into one of 12 playing styles based on their attributes. Requires GOLD subscription or higher.',
  })
  @ApiResponse({
    status: 201,
    description: 'Player classified successfully',
    schema: {
      type: 'object',
      properties: {
        primaryStyle: { type: 'string', example: 'PLAYMAKER' },
        secondaryStyle: { type: 'string', example: 'BOX_TO_BOX' },
        confidence: { type: 'number', example: 0.85 },
        styleScores: {
          type: 'object',
          description: 'Scores for all 12 playing styles',
        },
        radarData: {
          type: 'object',
          properties: {
            labels: { type: 'array', items: { type: 'string' } },
            values: { type: 'array', items: { type: 'number' } },
          },
        },
        attributes: {
          type: 'object',
          description: 'Player attributes used for classification',
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires GOLD subscription tier or higher' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  classifyPlayer(@Body() dto: ClassifyPlayerDto) {
    return this.playstyleDnaService.classifyPlayer(dto.playerId);
  }

  @Get('profile/:playerId')
  @MinTier(SubscriptionTier.GOLD)
  @ApiOperation({
    summary: 'Get player DNA profile (GOLD+)',
    description: 'Get complete PlayStyle DNA profile for a player. Requires GOLD subscription or higher.',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'DNA profile retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires GOLD subscription tier or higher' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  getDNAProfile(@Param('playerId') playerId: string) {
    return this.playstyleDnaService.calculateDNAProfile(playerId);
  }

  @Get('similar/:playerId')
  @MinTier(SubscriptionTier.GOLD)
  @ApiOperation({
    summary: 'Find similar players (GOLD+)',
    description: 'Find players with similar playing styles based on DNA profile. Requires GOLD subscription or higher.',
  })
  @ApiParam({ name: 'playerId', description: 'Reference player ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of results (default: 10, max: 50)' })
  @ApiResponse({
    status: 200,
    description: 'Similar players found',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          position: { type: 'string' },
          similarityScore: { type: 'number', example: 85 },
          playingStyle: { type: 'string', example: 'PLAYMAKER' },
          sharedAttributes: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires GOLD subscription tier or higher' })
  @ApiResponse({ status: 404, description: 'Player not found' })
  findSimilarPlayers(
    @Param('playerId') playerId: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.playstyleDnaService.findSimilarPlayers(playerId, limit || 10);
  }

  @Post('compare')
  @MinTier(SubscriptionTier.GOLD)
  @ApiOperation({
    summary: 'Compare two players (GOLD+)',
    description: 'Compare playing styles and attributes of two players. Requires GOLD subscription or higher.',
  })
  @ApiResponse({
    status: 201,
    description: 'Players compared successfully',
    schema: {
      type: 'object',
      properties: {
        player1: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            profile: { type: 'object' },
          },
        },
        player2: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            profile: { type: 'object' },
          },
        },
        similarityScore: { type: 'number', example: 75 },
        styleDifferences: { type: 'array', items: { type: 'string' } },
        attributeDifferences: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Forbidden - Requires GOLD subscription tier or higher' })
  @ApiResponse({ status: 404, description: 'One or both players not found' })
  comparePlayers(@Body() dto: ComparePlayersDto) {
    return this.playstyleDnaService.comparePlayers(dto.player1Id, dto.player2Id);
  }

  @Get('radar/:playerId')
  @MinTier(SubscriptionTier.GOLD)
  @ApiOperation({
    summary: 'Get radar chart data (GOLD+)',
    description: 'Get radar chart data for player visualization. Requires GOLD subscription or higher.',
  })
  @ApiParam({ name: 'playerId', description: 'Player ID' })
  @ApiResponse({
    status: 200,
    description: 'Radar data retrieved',
    schema: {
      type: 'object',
      properties: {
        labels: { type: 'array', items: { type: 'string' } },
        values: { type: 'array', items: { type: 'number' } },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Player not found' })
  async getRadarData(@Param('playerId') playerId: string) {
    const profile = await this.playstyleDnaService.classifyPlayer(playerId);
    return profile.radarData;
  }
}
