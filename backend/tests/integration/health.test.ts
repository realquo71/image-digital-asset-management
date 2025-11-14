// Health check endpoint integration tests

import request from 'supertest';
import { createApp } from '../../src/app';

describe('Health Check Endpoints', () => {
  const app = createApp();

  describe('GET /health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          environment: expect.any(String),
          version: expect.any(String),
        },
      });
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 and detailed health status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: 'healthy',
          services: {
            database: expect.any(String),
            redis: expect.any(String),
          },
        },
      });
      expect(response.body.data.timestamp).toBeDefined();
    });
  });

  describe('GET /api/v1', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/api/v1');

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Cultural Heritage DAM API',
        version: '1.0.0',
        documentation: '/api-docs',
      });
    });
  });

  describe('GET /unknown-route', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: expect.stringContaining('not found'),
        },
      });
    });
  });
});
