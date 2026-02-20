import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DashboardMobileController } from './dashboard-mobile.controller';
import { AlertService } from './alert.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AnalyticsController, DashboardMobileController],
  providers: [AnalyticsService, AlertService],
  exports: [AnalyticsService, AlertService],
})
export class AnalyticsModule {}
