import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AgentRequestsController } from './agent-requests.controller';
import { AgentRequestsService } from './agent-requests.service';

@Module({
  imports: [PrismaModule],
  controllers: [AgentRequestsController],
  providers: [AgentRequestsService],
  exports: [AgentRequestsService],
})
export class AgentRequestsModule {}
