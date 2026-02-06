import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { DataSyncService } from './data-sync.service';
import { DataSyncController } from './data-sync.controller';
import { ApiFootballService } from './services/api-football.service';
import { ClubMapper } from './mappers/club.mapper';
import { PlayerMapper } from './mappers/player.mapper';
import { CompetitionMapper } from './mappers/competition.mapper';
import { NormalizerUtil } from './mappers/normalizer.util';
import { DataSyncCron } from './cron/data-sync.cron';

@Module({
  imports: [PrismaModule, ConfigModule, ScheduleModule.forRoot()],
  providers: [
    DataSyncService,
    ApiFootballService,
    ClubMapper,
    PlayerMapper,
    CompetitionMapper,
    NormalizerUtil,
    DataSyncCron,
  ],
  controllers: [DataSyncController],
  exports: [DataSyncService],
})
export class DataSyncModule {}
