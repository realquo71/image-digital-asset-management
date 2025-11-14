// Database configuration with Prisma
// Provides singleton PrismaClient instance

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Singleton instance
let prisma: PrismaClient;

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      prisma.$on('query' as never, (e: any) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
    }
  }

  return prisma;
};

export const connectDatabase = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    const client = getPrismaClient();
    await client.$disconnect();
    logger.info('👋 Database disconnected');
  } catch (error) {
    logger.error('❌ Error disconnecting from database:', error);
  }
};

export { prisma };
