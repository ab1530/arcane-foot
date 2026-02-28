import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchAssignmentsController } from './match-assignments.controller';
import { MatchesService } from './matches.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MatchesController, MatchAssignmentsController],
  providers: [MatchesService],
  exports: [MatchesService],
})
export class MatchesModule {}
