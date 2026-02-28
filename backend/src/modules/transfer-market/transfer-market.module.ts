import { Module } from '@nestjs/common';
import { TransferMarketController } from './transfer-market.controller';
import { TransferMarketService } from './transfer-market.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PassportSharesModule } from '../passport-shares/passport-shares.module';

@Module({
  imports: [PrismaModule, PassportSharesModule],
  controllers: [TransferMarketController],
  providers: [TransferMarketService],
})
export class TransferMarketModule {}
