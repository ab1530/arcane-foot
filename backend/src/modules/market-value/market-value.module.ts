import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MarketValueService } from './market-value.service';
import { MarketValueController } from './market-value.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    PrismaModule,
    SubscriptionsModule,
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
    CacheModule.register({
      ttl: 86400000, // 24 hours in milliseconds
    }),
  ],
  controllers: [MarketValueController],
  providers: [MarketValueService],
  exports: [MarketValueService],
})
export class MarketValueModule {}
