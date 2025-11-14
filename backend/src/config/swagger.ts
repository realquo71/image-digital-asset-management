import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cultural Heritage DAM API',
      version,
      description: 'Digital Asset Management System for Italian Cultural Heritage Institutions with ArCo integration',
      contact: {
        name: 'API Support',
        email: 'support@culturalheritage.it',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.culturalheritage.it/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'CURATOR', 'RESEARCHER', 'VIEWER'],
            },
            azureAdId: { type: 'string', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string', nullable: true },
            filename: { type: 'string' },
            mimeType: { type: 'string' },
            fileSize: { type: 'integer' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
            },
            sharepointUrl: { type: 'string', format: 'uri' },
            thumbnailUrl: { type: 'string', format: 'uri', nullable: true },
            width: { type: 'integer', nullable: true },
            height: { type: 'integer', nullable: true },
            camera: { type: 'string', nullable: true },
            captureDate: { type: 'string', format: 'date-time', nullable: true },
            gpsLatitude: { type: 'number', nullable: true },
            gpsLongitude: { type: 'number', nullable: true },
            creatorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Tag: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ArcoTag: {
          type: 'object',
          properties: {
            arcoUri: { type: 'string', format: 'uri' },
            label: { type: 'string' },
            category: {
              type: 'string',
              enum: [
                'CULTURAL_PROPERTY_TYPE',
                'MATERIAL',
                'TECHNIQUE',
                'SUBJECT',
                'DATING',
                'CURRENT_LOCATION',
                'CREATION_PLACE',
                'HISTORICAL_PERIOD',
              ],
            },
            notation: { type: 'string', nullable: true },
          },
        },
        Collection: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            isPublic: { type: 'boolean' },
            creatorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'array', items: { type: 'object' } },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Assets',
        description: 'Digital asset management operations',
      },
      {
        name: 'Tags',
        description: 'Free-form tagging operations',
      },
      {
        name: 'ArCo',
        description: 'ArCo semantic vocabulary integration',
      },
      {
        name: 'Search',
        description: 'Full-text and advanced search',
      },
      {
        name: 'Collections',
        description: 'Collection management operations',
      },
      {
        name: 'Downloads',
        description: 'Asset download operations',
      },
      {
        name: 'Audit',
        description: 'Audit trail and compliance (Admin only)',
      },
      {
        name: 'Users',
        description: 'User management (Admin only)',
      },
      {
        name: 'Export',
        description: 'Export operations (ICCD, RDF, JSON-LD)',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
