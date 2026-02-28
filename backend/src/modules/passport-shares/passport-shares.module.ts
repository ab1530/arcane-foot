import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportModule } from '../../passport/passport.module';
import { PassportSharesController } from './passport-shares.controller';
import { PassportSharesService } from './passport-shares.service';

@Module({
  imports: [PrismaModule, PassportModule],
  controllers: [PassportSharesController],
  providers: [PassportSharesService],
  exports: [PassportSharesService],
})
export class PassportSharesModule {}
