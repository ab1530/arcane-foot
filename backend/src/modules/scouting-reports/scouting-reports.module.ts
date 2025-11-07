import { Module } from '@nestjs/common';
import { ScoutingReportsService } from './scouting-reports.service';
import { ScoutingReportsController } from './scouting-reports.controller';
// import { PdfService } from './pdf.service'; // Temporarily disabled - needs fixing
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScoutingReportsController],
  providers: [ScoutingReportsService], // PdfService temporarily removed
  exports: [ScoutingReportsService],
})
export class ScoutingReportsModule {}
