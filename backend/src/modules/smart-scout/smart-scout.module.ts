import { Module } from '@nestjs/common';
import { SmartScoutService } from './smart-scout.service';
import { SmartScoutController } from './smart-scout.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, SubscriptionsModule],
  controllers: [SmartScoutController],
  providers: [SmartScoutService],
  exports: [SmartScoutService],
})
export class SmartScoutModule {}
