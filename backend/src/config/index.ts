// Application configuration
// Loads and validates environment variables

import dotenv from 'dotenv';
import { AppConfig } from '../types';

// Load environment variables
dotenv.config();

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const getEnvVarOptional = (key: string, defaultValue?: string): string | undefined => {
  return process.env[key] || defaultValue;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
};

export const config: AppConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3000),
  apiPrefix: getEnvVar('API_PREFIX', '/api/v1'),
  corsOrigin: getEnvVar('CORS_ORIGIN', 'http://localhost:3001'),

  database: {
    url: getEnvVar('DATABASE_URL'),
  },

  redis: {
    url: getEnvVar('REDIS_URL'),
    password: getEnvVarOptional('REDIS_PASSWORD'),
  },

  elasticsearch: {
    node: getEnvVar('ELASTICSEARCH_URL', 'http://localhost:9200'),
    username: getEnvVarOptional('ELASTICSEARCH_USERNAME'),
    password: getEnvVarOptional('ELASTICSEARCH_PASSWORD'),
  },

  azure: {
    tenantId: getEnvVar('AZURE_AD_TENANT_ID'),
    clientId: getEnvVar('AZURE_AD_CLIENT_ID'),
    clientSecret: getEnvVar('AZURE_AD_CLIENT_SECRET'),
    redirectUri: getEnvVar('AZURE_AD_REDIRECT_URI'),
  },

  sharepoint: {
    siteUrl: getEnvVar('SHAREPOINT_SITE_URL'),
    libraryName: getEnvVar('SHAREPOINT_LIBRARY_NAME', 'Assets'),
  },

  jwt: {
    secret: getEnvVar('JWT_SECRET'),
    expiresIn: getEnvVar('JWT_EXPIRES_IN', '24h'),
    refreshExpiresIn: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  arco: {
    sparqlEndpoint: getEnvVar('ARCO_SPARQL_ENDPOINT', 'https://dati.beniculturali.it/sparql'),
    cacheTTL: getEnvNumber('ARCO_CACHE_TTL', 604800), // 1 week
  },

  upload: {
    maxFileSize: getEnvNumber('MAX_FILE_SIZE', 104857600), // 100MB
    allowedMimeTypes: getEnvVar('ALLOWED_MIME_TYPES', 'image/jpeg,image/png,image/tiff,application/pdf').split(','),
  },

  rateLimit: {
    windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
    maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  },
};

// Validate configuration on startup
export const validateConfig = (): void => {
  console.log('🔧 Validating configuration...');

  // Check required fields
  const requiredFields = [
    'database.url',
    'redis.url',
    'jwt.secret',
  ];

  for (const field of requiredFields) {
    const keys = field.split('.');
    let value: any = config;
    for (const key of keys) {
      value = value[key];
    }
    if (!value) {
      throw new Error(`Configuration validation failed: ${field} is required`);
    }
  }

  // Validate JWT secret length
  if (config.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  console.log('✅ Configuration validated successfully');
};
