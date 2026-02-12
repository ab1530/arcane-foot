import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionTierGuard } from '../../common/guards/subscription-tier.guard';
import { MinTier } from '../../common/decorators/min-tier.decorator';
import { SubscriptionTier } from '@prisma/client';
import { ArkaneMatchService } from './arkane-match.service';
import { ChatDto, ChatResponseDto } from './dto/chat.dto';
import { Throttle } from '@nestjs/throttler';

/**
 * ArkaneMatch Controller
 *
 * Provides endpoints for AI-powered conversational scout search
 */
@ApiTags('ArkaneMatch')
@Controller('arkane-match')
@UseGuards(JwtAuthGuard, SubscriptionTierGuard)
@ApiBearerAuth()
export class ArkaneMatchController {
  constructor(private readonly arkaneMatchService: ArkaneMatchService) {}

  /**
   * Chat with ArkaneMatch AI to find scouts
   *
   * @description Send a natural language message to find scouts.
   * Examples:
   * - "I need a LaLiga scout who specializes in defenders"
   * - "Find me a Bundesliga specialist under €150/hr"
   * - "Looking for a scout who knows center backs and speaks German"
   */
  @Post('chat')
  @MinTier(SubscriptionTier.GOLD)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute
  @ApiOperation({
    summary: 'Chat with ArkaneMatch AI to find scouts (GOLD+)',
    description:
      'Send natural language queries to find matching scouts. Supports multi-turn conversations. Requires GOLD subscription or higher.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully processed chat message',
    type: ChatResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Requires GOLD subscription tier or higher',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - Rate limit exceeded',
  })
  async chat(@Request() req, @Body() dto: ChatDto): Promise<ChatResponseDto> {
    return this.arkaneMatchService.chat(req.user.userId, dto);
  }

  /**
   * Get conversation history
   */
  @Get('conversations/:id')
  @ApiOperation({
    summary: 'Get conversation history',
    description: 'Retrieve the full message history for a conversation',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation found',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async getConversation(@Request() req, @Param('id') id: string) {
    const conversation = await this.arkaneMatchService.getConversation(id);

    if (!conversation) {
      return {
        message: 'Conversation not found or has expired',
        conversationId: id,
      };
    }

    if (conversation.userId !== req.user.userId) {
      return {
        message: 'Conversation does not belong to this user',
        conversationId: id,
      };
    }

    return {
      conversationId: conversation.id,
      messages: conversation.messages,
      messageCount: conversation.messages.length,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
      currentCriteria: conversation.currentCriteria,
    };
  }

  /**
   * Clear/delete conversation
   */
  @Delete('conversations/:id')
  @ApiOperation({
    summary: 'Clear conversation history',
    description: 'Delete a conversation and all its messages',
  })
  @ApiParam({
    name: 'id',
    description: 'Conversation ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Conversation not found',
  })
  async clearConversation(@Request() req, @Param('id') id: string) {
    await this.arkaneMatchService.clearConversation(id, req.user.userId);

    return {
      message: 'Conversation cleared successfully',
      conversationId: id,
    };
  }

  /**
   * Get ArkaneMatch AI capabilities and info
   */
  @Get('info')
  @ApiOperation({
    summary: 'Get ArkaneMatch AI information',
    description: 'Get information about AI capabilities, supported features, and rate limits',
  })
  @ApiResponse({
    status: 200,
    description: 'AI info retrieved',
  })
  getInfo() {
    return this.arkaneMatchService.getInfo();
  }

  /**
   * Health check endpoint (no auth required)
   */
  @Get('health')
  @ApiOperation({
    summary: 'ArkaneMatch health check',
    description: 'Check if ArkaneMatch service is operational',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  healthCheck() {
    return {
      status: 'ok',
      service: 'ArkaneMatch',
      timestamp: new Date().toISOString(),
    };
  }
}
