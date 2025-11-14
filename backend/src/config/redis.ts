// Redis configuration
// Provides singleton Redis client instance

import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

let redisClient: Redis;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      password: config.redis.password,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('❌ Redis error:', error);
    });

    redisClient.on('close', () => {
      logger.warn('⚠️  Redis connection closed');
    });
  }

  return redisClient;
};

export const connectRedis = async (): Promise<void> => {
  try {
    const client = getRedisClient();
    await client.ping();
    logger.info('✅ Redis ping successful');
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient) {
      await redisClient.quit();
      logger.info('👋 Redis disconnected');
    }
  } catch (error) {
    logger.error('❌ Error disconnecting from Redis:', error);
  }
};

export { redisClient };
