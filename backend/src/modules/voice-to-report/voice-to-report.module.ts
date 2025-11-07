import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { VoiceToReportService } from './voice-to-report.service';
import { VoiceToReportController } from './voice-to-report.controller';
import { SupabaseModule } from '../supabase/supabase.module';
import { ScoutingReportsModule } from '../scouting-reports/scouting-reports.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [
    MulterModule.register({
      dest: '/tmp',
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
      },
    }),
    SupabaseModule,
    ScoutingReportsModule,
    PrismaModule,
    SubscriptionsModule,
  ],
  controllers: [VoiceToReportController],
  providers: [VoiceToReportService],
  exports: [VoiceToReportService],
})
export class VoiceToReportModule {}
