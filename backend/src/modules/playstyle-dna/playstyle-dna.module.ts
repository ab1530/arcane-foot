import { Module } from '@nestjs/common';
import { PlaystyleDnaService } from './playstyle-dna.service';
import { PlaystyleDnaController } from './playstyle-dna.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    PrismaModule,
    SubscriptionsModule,
    CacheModule.register({
      ttl: 3600, // 1 hour default TTL
      max: 100, // Maximum number of items in cache
    }),
  ],
  controllers: [PlaystyleDnaController],
  providers: [PlaystyleDnaService],
  exports: [PlaystyleDnaService],
})
export class PlaystyleDnaModule {}
