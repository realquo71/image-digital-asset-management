// Server entry point
// Starts the Express server and connects to databases

import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { connectRedis, disconnectRedis } from './config/redis';

const startServer = async (): Promise<void> => {
  try {
    // Validate configuration
    validateConfig();

    // Connect to databases
    await connectDatabase();
    await connectRedis();

    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(config.port, () => {
      logger.info('=================================');
      logger.info(`🚀 Cultural Heritage DAM API`);
      logger.info(`📝 Environment: ${config.nodeEnv}`);
      logger.info(`🌍 Server running on port ${config.port}`);
      logger.info(`📚 API Documentation: http://localhost:${config.port}/api-docs`);
      logger.info(`🏥 Health check: http://localhost:${config.port}/health`);
      logger.info('=================================');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connections
        await disconnectDatabase();
        await disconnectRedis();

        logger.info('All connections closed. Exiting process.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forcefully shutting down after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
