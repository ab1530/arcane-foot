import { Module } from '@nestjs/common';
import { PlayerValidationController } from './player-validation.controller';
import { PlayerValidationService } from './player-validation.service';
import { BulkImportService } from './bulk-import.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PlayerValidationController],
  providers: [PlayerValidationService, BulkImportService],
  exports: [PlayerValidationService, BulkImportService],
})
export class PlayerValidationModule {}
