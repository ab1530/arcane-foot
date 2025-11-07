import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ArkaneMatchController } from './arkane-match.controller';
import { ArkaneMatchService } from './arkane-match.service';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { CacheModule } from '../cache/cache.module';

/**
 * ArkaneMatch Module
 *
 * Provides AI-powered conversational search for the Scout Marketplace
 *
 * Features:
 * - Natural Language Understanding (NLU)
 * - Intent detection
 * - Multi-turn conversations
 * - Context-aware recommendations
 * - Integration with MarketplaceService
 */
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    MarketplaceModule, // For searching scouts
    CacheModule, // For conversation storage
  ],
  controllers: [ArkaneMatchController],
  providers: [ArkaneMatchService],
  exports: [ArkaneMatchService],
})
export class ArkaneMatchModule {}
