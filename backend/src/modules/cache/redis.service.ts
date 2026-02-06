import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Connect to Redis
   */
  private async connect() {
    // Skip Redis connection if not configured or in development
    const skipRedis = this.configService.get<string>('SKIP_REDIS', 'true') === 'true';
    if (skipRedis) {
      this.logger.log('Redis disabled - using in-memory cache');
      this.isConnected = false;
      return;
    }

    try {
      const redisConfig = {
        host: this.configService.get<string>('REDIS_HOST', 'localhost'),
        port: this.configService.get<number>('REDIS_PORT', 6379),
        password: this.configService.get<string>('REDIS_PASSWORD'),
        db: this.configService.get<number>('REDIS_DB', 0),
        retryStrategy: (times: number) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed - using in-memory cache');
            return null;
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
        enableOfflineQueue: false,
      };

      // Create Redis clients
      this.client = new Redis(redisConfig);
      this.subscriber = new Redis(redisConfig);
      this.publisher = new Redis(redisConfig);

      // Handle connection events silently
      this.client.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', () => {
        // Silently handle errors - already logged as warning
        this.isConnected = false;
      });

      // Try to connect
      await this.client.connect();
      await this.client.ping();
      this.isConnected = true;
    } catch (error) {
      this.logger.warn('Redis not available - using in-memory cache', (error as Error)?.message);
      this.isConnected = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  private async disconnect() {
    if (this.isConnected) {
      await Promise.all([this.client?.quit(), this.subscriber?.quit(), this.publisher?.quit()]);
      this.logger.log('Redis disconnected');
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) return null;

    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Redis get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await this.client.set(key, serialized, 'EX', ttl);
      } else {
        await this.client.set(key, serialized);
      }

      return true;
    } catch (error) {
      this.logger.error(`Redis set error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string | string[]): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const keys = Array.isArray(key) ? key : [key];
      return await this.client.del(...keys);
    } catch (error) {
      this.logger.error(`Redis del error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Clear all keys matching pattern
   */
  async clearPattern(pattern: string): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        return await this.client.del(...keys);
      }
      return 0;
    } catch (error) {
      this.logger.error(`Redis clear pattern error: ${error.message}`);
      return 0;
    }
  }

  /**
   * List keys matching pattern (use cautiously)
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.isConnected) return [];

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      this.logger.error(`Redis keys error: ${error.message}`);
      return [];
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis exists error: ${error.message}`);
      return false;
    }
  }

  /**
   * Set expiration on key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const result = await this.client.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis expire error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get TTL of key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) return -1;

    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.error(`Redis ttl error: ${error.message}`);
      return -1;
    }
  }

  /**
   * Increment counter
   */
  async incr(key: string): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      return await this.client.incr(key);
    } catch (error) {
      this.logger.error(`Redis incr error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Decrement counter
   */
  async decr(key: string): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      return await this.client.decr(key);
    } catch (error) {
      this.logger.error(`Redis decr error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Add to set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      return await this.client.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Redis sadd error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Get set members
   */
  async smembers(key: string): Promise<string[]> {
    if (!this.isConnected) return [];

    try {
      return await this.client.smembers(key);
    } catch (error) {
      this.logger.error(`Redis smembers error: ${error.message}`);
      return [];
    }
  }

  /**
   * Remove from set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      return await this.client.srem(key, ...members);
    } catch (error) {
      this.logger.error(`Redis srem error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Publish message to channel
   */
  async publish(channel: string, message: any): Promise<number> {
    if (!this.isConnected) return 0;

    try {
      const serialized = JSON.stringify(message);
      return await this.publisher.publish(channel, serialized);
    } catch (error) {
      this.logger.error(`Redis publish error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Subscribe to channel
   */
  async subscribe(channel: string, callback: (message: any) => void): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.subscriber.subscribe(channel);

      this.subscriber.on('message', (ch, message) => {
        if (ch === channel) {
          try {
            const parsed = JSON.parse(message);
            callback(parsed);
          } catch {
            callback(message);
          }
        }
      });
    } catch (error) {
      this.logger.error(`Redis subscribe error: ${error.message}`);
    }
  }

  /**
   * Unsubscribe from channel
   */
  async unsubscribe(channel: string): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.subscriber.unsubscribe(channel);
    } catch (error) {
      this.logger.error(`Redis unsubscribe error: ${error.message}`);
    }
  }

  /**
   * Cache decorator for methods
   */
  static Cache(keyPrefix: string, ttl: number = 3600) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const redisService: RedisService = this.redisService || this.redis;

        if (!redisService) {
          return originalMethod.apply(this, args);
        }

        // Generate cache key
        const cacheKey = `${keyPrefix}:${propertyKey}:${JSON.stringify(args)}`;

        // Try to get from cache
        const cached = await redisService.get(cacheKey);
        if (cached) {
          return cached;
        }

        // Execute method and cache result
        const result = await originalMethod.apply(this, args);
        await redisService.set(cacheKey, result, ttl);

        return result;
      };

      return descriptor;
    };
  }

  /**
   * Invalidate cache decorator
   */
  static InvalidateCache(patterns: string[]) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const redisService: RedisService = this.redisService || this.redis;

        // Execute method
        const result = await originalMethod.apply(this, args);

        // Invalidate cache patterns
        if (redisService) {
          for (const pattern of patterns) {
            await redisService.clearPattern(pattern);
          }
        }

        return result;
      };

      return descriptor;
    };
  }
}
