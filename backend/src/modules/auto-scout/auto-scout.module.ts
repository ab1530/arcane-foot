import { Module } from '@nestjs/common';
import { AutoScoutService } from './auto-scout.service';
import { AutoScoutController } from './auto-scout.controller';
import { StatsAggregatorService } from './stats-aggregator.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    PrismaModule,
    SubscriptionsModule,
    CacheModule.register({
      ttl: 3600, // 1 hour cache
      max: 100, // max items in cache
    }),
  ],
  controllers: [AutoScoutController],
  providers: [AutoScoutService, StatsAggregatorService],
  exports: [AutoScoutService],
})
export class AutoScoutModule {}
