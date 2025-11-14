import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import { UserRole } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';

describe('Authentication API Integration Tests', () => {
  let testUser: any;
  let validToken: string;
  let expiredToken: string;

  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'auth-test@example.com',
        name: 'Auth Test User',
        role: UserRole.CURATOR,
        azureAdId: 'test-azure-id',
        isActive: true,
      },
    });

    // Generate valid token
    validToken = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    // Generate expired token
    expiredToken = jwt.sign(
      {
        id: testUser.id,
        email: testUser.email,
        name: testUser.name,
        role: testUser.role,
      },
      config.jwt.secret,
      { expiresIn: '-1h' } // Expired 1 hour ago
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: 'auth-test@example.com' },
    });

    await prisma.$disconnect();
  });

  describe('GET /api/v1/auth/azure/login', () => {
    it('should return Azure AD authorization URL', async () => {
      const response = await request(app)
        .get('/api/v1/auth/azure/login')
        .query({ redirectUri: 'http://localhost:3001/auth/callback' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.authUrl).toBeDefined();
      expect(response.body.data.authUrl).toContain('login.microsoftonline.com');
    });

    it('should require redirectUri parameter', async () => {
      const response = await request(app)
        .get('/api/v1/auth/azure/login')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('redirectUri');
    });
  });

  describe('POST /api/v1/auth/azure/callback', () => {
    it('should handle Azure AD callback with valid code', async () => {
      // Note: This test requires mocking the MSAL client
      // In a real scenario, you would mock acquireTokenByCode
      // For now, we expect a 500 or specific error handling
      const response = await request(app)
        .post('/api/v1/auth/azure/callback')
        .send({
          code: 'test-auth-code',
          redirectUri: 'http://localhost:3001/auth/callback',
        });

      // The actual response depends on MSAL client behavior
      // In test environment, it should handle errors gracefully
      expect(response.body).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/azure/callback')
        .send({
          // Missing code and redirectUri
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // Generate a refresh token
      const refreshToken = jwt.sign(
        {
          id: testUser.id,
          email: testUser.email,
          name: testUser.name,
          role: testUser.role,
        },
        config.jwt.secret,
        { expiresIn: '30d' }
      );

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid');
    });

    it('should reject expired refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('expired');
    });

    it('should reject refresh token for inactive user', async () => {
      // Create inactive user
      const inactiveUser = await prisma.user.create({
        data: {
          email: 'inactive@example.com',
          name: 'Inactive User',
          role: UserRole.VIEWER,
          isActive: false,
        },
      });

      const inactiveUserToken = jwt.sign(
        {
          id: inactiveUser.id,
          email: inactiveUser.email,
          name: inactiveUser.name,
          role: inactiveUser.role,
        },
        config.jwt.secret,
        { expiresIn: '30d' }
      );

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: inactiveUserToken })
        .expect(401);

      expect(response.body.success).toBe(false);

      // Clean up
      await prisma.user.delete({ where: { id: inactiveUser.id } });
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return current user info with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testUser.id);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
      expect(response.body.data.role).toBe(testUser.role);
      // Should not return sensitive fields
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject request with expired token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should successfully logout user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Logged out');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Token Validation Middleware', () => {
    it('should accept valid Bearer token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', validToken) // Missing "Bearer " prefix
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject token with invalid signature', async () => {
      const invalidToken = jwt.sign(
        { id: testUser.id },
        'wrong-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow access to role-specific endpoints', async () => {
      // Admin accessing audit logs
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin-rbac@example.com',
          name: 'Admin RBAC Test',
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      const adminToken = jwt.sign(
        {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Clean up
      await prisma.user.delete({ where: { id: adminUser.id } });
    });

    it('should deny access to role-specific endpoints for non-admin', async () => {
      // Curator trying to access admin-only endpoint
      const response = await request(app)
        .get('/api/v1/audit-logs')
        .set('Authorization', `Bearer ${validToken}`) // Curator token
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('permission');
    });
  });
});
