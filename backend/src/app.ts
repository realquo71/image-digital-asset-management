// Express application setup
// Configures middleware, routes, and error handling

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { config } from './config';
import { morganStream, logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import routes
import { authRoutes } from './routes/auth.routes';
import { assetRoutes } from './routes/assets.routes';
import { arcoRoutes } from './routes/arco.routes';
// import { collectionRoutes } from './routes/collections.routes';

export const createApp = (): Application => {
  const app = express();

  // ============================================================================
  // SECURITY MIDDLEWARE
  // ============================================================================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    })
  );

  // CORS
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
      },
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(config.apiPrefix, limiter);

  // ============================================================================
  // GENERAL MIDDLEWARE
  // ============================================================================

  // Compression
  app.use(compression());

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // HTTP request logging
  app.use(
    morgan(
      ':method :url :status :res[content-length] - :response-time ms',
      { stream: morganStream }
    )
  );

  // ============================================================================
  // API DOCUMENTATION (Swagger)
  // ============================================================================

  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Cultural Heritage DAM API',
        version: '1.0.0',
        description: 'Digital Asset Management System with ArCo Integration',
        contact: {
          name: 'API Support',
        },
      },
      servers: [
        {
          url: `http://localhost:${config.port}${config.apiPrefix}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ['./src/routes/*.ts'], // Path to route files with JSDoc comments
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
    })
  );

  // ============================================================================
  // HEALTH CHECK
  // ============================================================================

  app.get('/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        version: '1.0.0',
      },
    });
  });

  app.get(`${config.apiPrefix}/health`, (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'connected',
          redis: 'connected',
        },
      },
    });
  });

  // ============================================================================
  // API ROUTES
  // ============================================================================

  // API Routes
  app.use(`${config.apiPrefix}/auth`, authRoutes);
  app.use(`${config.apiPrefix}/assets`, assetRoutes);
  app.use(`${config.apiPrefix}/arco`, arcoRoutes);
  // TODO: Uncomment as routes are implemented
  // app.use(`${config.apiPrefix}/collections`, collectionRoutes);

  // Placeholder route
  app.get(config.apiPrefix, (req, res) => {
    res.json({
      success: true,
      message: 'Cultural Heritage DAM API',
      version: '1.0.0',
      documentation: '/api-docs',
    });
  });

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
};
