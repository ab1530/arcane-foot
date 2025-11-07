import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for chat message input
 */
export class ChatDto {
  @ApiProperty({
    description: 'User message in natural language',
    example: 'I need a LaLiga scout who specializes in defenders under 150€/hour',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional conversation ID to continue existing conversation',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}

/**
 * Extracted search criteria from NLU
 */
export class SearchCriteriaDto {
  @ApiPropertyOptional({
    description: 'Leagues the scout specializes in',
    type: [String],
    example: ['LaLiga', 'Premier League'],
  })
  @IsOptional()
  @IsArray()
  leagues?: string[];

  @ApiPropertyOptional({
    description: 'Player positions the scout focuses on',
    type: [String],
    example: ['CB', 'LB', 'RB'],
  })
  @IsOptional()
  @IsArray()
  positions?: string[];

  @ApiPropertyOptional({
    description: 'Maximum hourly rate budget',
    example: 150,
  })
  @IsOptional()
  maxBudget?: number;

  @ApiPropertyOptional({
    description: 'Minimum rating required (1-5 stars)',
    example: 4,
  })
  @IsOptional()
  minRating?: number;

  @ApiPropertyOptional({
    description: 'Countries where scout operates',
    type: [String],
    example: ['Spain', 'France'],
  })
  @IsOptional()
  @IsArray()
  countries?: string[];

  @ApiPropertyOptional({
    description: 'Languages scout speaks',
    type: [String],
    example: ['Spanish', 'English'],
  })
  @IsOptional()
  @IsArray()
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Only show verified scouts',
    example: false,
  })
  @IsOptional()
  verifiedOnly?: boolean;

  @ApiPropertyOptional({
    description: 'Currency for budget',
    example: 'EUR',
  })
  @IsOptional()
  currency?: string;
}

/**
 * DTO for chat response
 */
export class ChatResponseDto {
  @ApiProperty({
    description: 'AI-generated response message',
    example: 'I found 2 LaLiga specialists who focus on defenders...',
  })
  response: string;

  @ApiProperty({
    description: 'List of matching scouts (if any)',
    type: Array,
    required: false,
  })
  scouts?: any[];

  @ApiProperty({
    description: 'Extracted search criteria from user message',
    required: false,
  })
  extractedCriteria?: SearchCriteriaDto;

  @ApiProperty({
    description: 'Follow-up questions to help refine search',
    type: [String],
    required: false,
  })
  suggestions?: string[];

  @ApiProperty({
    description: 'Conversation ID for multi-turn dialogues',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  conversationId: string;

  @ApiProperty({
    description: 'Intent detected from user message',
    example: 'SEARCH_SCOUT',
    required: false,
  })
  intent?: string;
}

/**
 * Intent types for conversation
 */
export enum IntentType {
  SEARCH_SCOUT = 'SEARCH_SCOUT',
  REFINE_SEARCH = 'REFINE_SEARCH',
  GET_DETAILS = 'GET_DETAILS',
  COMPARE_SCOUTS = 'COMPARE_SCOUTS',
  GENERAL_QUESTION = 'GENERAL_QUESTION',
  UNCLEAR = 'UNCLEAR',
}
