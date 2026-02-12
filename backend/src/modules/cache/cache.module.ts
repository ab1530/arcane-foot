import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';
import { CacheManagerService } from '../../common/interceptors/cache.interceptor';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisService, CacheManagerService],
  exports: [RedisService, CacheManagerService],
})
export class CacheModule {}
