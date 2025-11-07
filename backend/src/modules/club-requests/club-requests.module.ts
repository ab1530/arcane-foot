import { Module } from '@nestjs/common';
import { ClubRequestsService } from './club-requests.service';
import { ClubRequestsController } from './club-requests.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClubRequestsController],
  providers: [ClubRequestsService],
  exports: [ClubRequestsService],
})
export class ClubRequestsModule {}
