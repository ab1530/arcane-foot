import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PerformancePredictorController } from './performance-predictor.controller';
import { PerformancePredictorService } from './performance-predictor.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30000, // 30 seconds for ML predictions
      maxRedirects: 5,
    }),
    PrismaModule,
  ],
  controllers: [PerformancePredictorController],
  providers: [PerformancePredictorService],
  exports: [PerformancePredictorService],
})
export class PerformancePredictorModule {}
