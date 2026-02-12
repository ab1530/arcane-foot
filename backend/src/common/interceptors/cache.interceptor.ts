import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../modules/cache/redis.service';
import { Reflector } from '@nestjs/core';

export const CACHE_KEY_METADATA = 'cache_key';
export const CACHE_TTL_METADATA = 'cache_ttl';

/**
 * Decorator to enable caching for a route
 */
export const Cacheable = (key?: string, ttl: number = 300) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(CACHE_KEY_METADATA, key || propertyKey, descriptor.value);
    Reflect.defineMetadata(CACHE_TTL_METADATA, ttl, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    // Get cache metadata
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, handler);
    const cacheTTL = this.reflector.get<number>(CACHE_TTL_METADATA, handler);

    // Skip caching if no metadata
    if (!cacheKey) {
      return next.handle();
    }

    // Generate full cache key with request params
    const fullCacheKey = this.generateCacheKey(cacheKey, request);

    // Try to get from cache
    const cachedData = await this.redisService.get(fullCacheKey);

    if (cachedData) {
      this.logger.debug(`Cache hit for key: ${fullCacheKey}`);
      return of(cachedData);
    }

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (data) => {
        await this.redisService.set(fullCacheKey, data, cacheTTL);
        this.logger.debug(`Cache set for key: ${fullCacheKey}, TTL: ${cacheTTL}s`);
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const userId = request.user?.id || 'anonymous';
    const method = request.method;
    const url = request.url;
    const params = JSON.stringify(request.params || {});
    const query = JSON.stringify(request.query || {});

    return `cache:${baseKey}:${userId}:${method}:${url}:${params}:${query}`;
  }
}

/**
 * Cache manager service for complex caching strategies
 */
@Injectable()
export class CacheManagerService {
  private readonly logger = new Logger(CacheManagerService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Cache with tags for invalidation
   */
  async cacheWithTags(key: string, value: any, tags: string[], ttl?: number): Promise<void> {
    // Set the cached value
    await this.redisService.set(key, value, ttl);

    // Add key to tag sets
    for (const tag of tags) {
      await this.redisService.sadd(`tag:${tag}`, key);
      if (ttl) {
        await this.redisService.expire(`tag:${tag}`, ttl);
      }
    }
  }

  /**
   * Invalidate all cache entries with a specific tag
   */
  async invalidateByTag(tag: string): Promise<number> {
    // Get all keys with this tag
    const keys = await this.redisService.smembers(`tag:${tag}`);

    if (keys.length === 0) {
      return 0;
    }

    // Delete all keys
    const deleted = await this.redisService.del(keys);

    // Delete the tag set
    await this.redisService.del(`tag:${tag}`);

    this.logger.debug(`Invalidated ${deleted} cache entries with tag: ${tag}`);
    return deleted;
  }

  /**
   * Invalidate all cache entries with multiple tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalDeleted = 0;

    for (const tag of tags) {
      totalDeleted += await this.invalidateByTag(tag);
    }

    return totalDeleted;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmUpCache(dataProvider: () => Promise<any>, key: string, ttl?: number): Promise<void> {
    try {
      const data = await dataProvider();
      await this.redisService.set(key, data, ttl);
      this.logger.log(`Cache warmed up for key: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to warm up cache for key ${key}: ${error.message}`);
    }
  }

  /**
   * Get or set cache (cache-aside pattern)
   */
  async getOrSet<T>(key: string, dataProvider: () => Promise<T>, ttl?: number): Promise<T> {
    // Try to get from cache
    const cached = await this.redisService.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    // Get fresh data
    const data = await dataProvider();

    // Cache the data
    await this.redisService.set(key, data, ttl);

    return data;
  }

  /**
   * Batch get multiple cache keys
   */
  async batchGet<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>();

    await Promise.all(
      keys.map(async (key) => {
        const value = await this.redisService.get<T>(key);
        results.set(key, value);
      }),
    );

    return results;
  }

  /**
   * Batch set multiple cache keys
   */
  async batchSet(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<void> {
    await Promise.all(entries.map(({ key, value, ttl }) => this.redisService.set(key, value, ttl)));
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAllCache(): Promise<number> {
    return await this.redisService.clearPattern('cache:*');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate: number;
  }> {
    // This is a simplified version
    // In production, you'd track hits/misses properly
    return {
      totalKeys: 0,
      memoryUsage: '0 MB',
      hitRate: 0,
    };
  }
}
