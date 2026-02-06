import { Module } from '@nestjs/common';
import { ScoutingReportsService } from './scouting-reports.service';
import { ScoutingReportsController } from './scouting-reports.controller';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, GamificationModule],
  controllers: [ScoutingReportsController],
  providers: [ScoutingReportsService, PdfService],
  exports: [ScoutingReportsService],
})
export class ScoutingReportsModule {}
