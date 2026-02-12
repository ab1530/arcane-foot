import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClubNeedsController } from './club-needs.controller';
import { ClubNeedsService } from './club-needs.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClubNeedsController],
  providers: [ClubNeedsService],
  exports: [ClubNeedsService],
})
export class ClubNeedsModule {}

