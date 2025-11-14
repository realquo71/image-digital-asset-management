import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/config/database';
import { UserRole, AssetStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';

describe('Assets API Integration Tests', () => {
  let adminToken: string;
  let curatorToken: string;
  let viewerToken: string;
  let adminUser: any;
  let curatorUser: any;
  let viewerUser: any;
  let testAsset: any;

  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();

    // Create test users
    adminUser = await prisma.user.create({
      data: {
        email: 'admin-test@example.com',
        name: 'Admin Test',
        role: UserRole.ADMIN,
        isActive: true,
      },
    });

    curatorUser = await prisma.user.create({
      data: {
        email: 'curator-test@example.com',
        name: 'Curator Test',
        role: UserRole.CURATOR,
        isActive: true,
      },
    });

    viewerUser = await prisma.user.create({
      data: {
        email: 'viewer-test@example.com',
        name: 'Viewer Test',
        role: UserRole.VIEWER,
        isActive: true,
      },
    });

    // Generate JWT tokens
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    curatorToken = jwt.sign(
      { id: curatorUser.id, email: curatorUser.email, role: curatorUser.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );

    viewerToken = jwt.sign(
      { id: viewerUser.id, email: viewerUser.email, role: viewerUser.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.asset.deleteMany({
      where: {
        creatorId: {
          in: [adminUser.id, curatorUser.id, viewerUser.id],
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        id: {
          in: [adminUser.id, curatorUser.id, viewerUser.id],
        },
      },
    });

    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create a test asset before each test
    testAsset = await prisma.asset.create({
      data: {
        title: 'Test Asset',
        description: 'Test description',
        filename: 'test.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        status: AssetStatus.PUBLISHED,
        sharepointUrl: 'https://example.sharepoint.com/test.jpg',
        creatorId: curatorUser.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up test asset after each test
    if (testAsset) {
      await prisma.asset.delete({
        where: { id: testAsset.id },
      }).catch(() => {}); // Ignore if already deleted
    }
  });

  describe('GET /api/v1/assets', () => {
    it('should return list of assets when authenticated', async () => {
      const response = await request(app)
        .get('/api/v1/assets')
        .set('Authorization', `Bearer ${curatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.assets).toBeInstanceOf(Array);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/v1/assets')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should filter assets by status', async () => {
      const response = await request(app)
        .get('/api/v1/assets?status=PUBLISHED')
        .set('Authorization', `Bearer ${curatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      const assets = response.body.data.assets;
      assets.forEach((asset: any) => {
        expect(asset.status).toBe('PUBLISHED');
      });
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/assets?page=1&limit=10')
        .set('Authorization', `Bearer ${curatorToken}`)
        .expect(200);

      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/v1/assets/:id', () => {
    it('should return asset details when found', async () => {
      const response = await request(app)
        .get(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${curatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testAsset.id);
      expect(response.body.data.title).toBe('Test Asset');
    });

    it('should return 404 for nonexistent asset', async () => {
      const response = await request(app)
        .get('/api/v1/assets/nonexistent-id')
        .set('Authorization', `Bearer ${curatorToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });
  });

  describe('POST /api/v1/assets', () => {
    it('should create asset when curator uploads', async () => {
      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${curatorToken}`)
        .field('title', 'New Test Asset')
        .field('description', 'New test description')
        .field('status', 'DRAFT')
        .attach('file', Buffer.from('fake image content'), 'new-test.jpg')
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Test Asset');
      expect(response.body.data.status).toBe('DRAFT');

      // Clean up
      await prisma.asset.delete({ where: { id: response.body.data.id } });
    });

    it('should reject upload from viewer', async () => {
      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${viewerToken}`)
        .field('title', 'Unauthorized Upload')
        .attach('file', Buffer.from('fake content'), 'unauthorized.jpg')
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${curatorToken}`)
        .field('description', 'Missing title')
        .attach('file', Buffer.from('fake content'), 'test.jpg')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('validation');
    });
  });

  describe('PATCH /api/v1/assets/:id', () => {
    it('should update asset when owner edits', async () => {
      const response = await request(app)
        .patch(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${curatorToken}`)
        .send({
          title: 'Updated Title',
          description: 'Updated description',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Title');
    });

    it('should reject update from non-owner curator', async () => {
      // Create another curator
      const otherCurator = await prisma.user.create({
        data: {
          email: 'other-curator@example.com',
          name: 'Other Curator',
          role: UserRole.CURATOR,
          isActive: true,
        },
      });

      const otherCuratorToken = jwt.sign(
        { id: otherCurator.id, email: otherCurator.email, role: otherCurator.role },
        config.jwt.secret,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .patch(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${otherCuratorToken}`)
        .send({ title: 'Unauthorized Update' })
        .expect(403);

      expect(response.body.success).toBe(false);

      // Clean up
      await prisma.user.delete({ where: { id: otherCurator.id } });
    });

    it('should allow admin to update any asset', async () => {
      const response = await request(app)
        .patch(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Updated' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Admin Updated');
    });
  });

  describe('DELETE /api/v1/assets/:id', () => {
    it('should delete asset when owner deletes', async () => {
      const response = await request(app)
        .delete(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${curatorToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion
      const deleted = await prisma.asset.findUnique({
        where: { id: testAsset.id },
      });
      expect(deleted).toBeNull();

      testAsset = null; // Prevent afterEach cleanup attempt
    });

    it('should allow admin to delete any asset', async () => {
      const response = await request(app)
        .delete(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      testAsset = null;
    });

    it('should reject deletion from viewer', async () => {
      const response = await request(app)
        .delete(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/assets/:id/tags', () => {
    it('should add tag to asset', async () => {
      const response = await request(app)
        .post(`/api/v1/assets/${testAsset.id}/tags`)
        .set('Authorization', `Bearer ${curatorToken}`)
        .send({ name: 'Renaissance' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Renaissance');
    });

    it('should reject tag addition from viewer', async () => {
      const response = await request(app)
        .post(`/api/v1/assets/${testAsset.id}/tags`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'Unauthorized Tag' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/assets/:id/arco-tags', () => {
    it('should add ArCo tag to asset', async () => {
      const response = await request(app)
        .post(`/api/v1/assets/${testAsset.id}/arco-tags`)
        .set('Authorization', `Bearer ${curatorToken}`)
        .send({
          arcoUri: 'https://w3id.org/arco/resource/CulturalPropertyType/scultura',
          label: 'Scultura',
          category: 'CULTURAL_PROPERTY_TYPE',
          notation: 'S',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.label).toBe('Scultura');
      expect(response.body.data.category).toBe('CULTURAL_PROPERTY_TYPE');
    });

    it('should validate ArCo tag structure', async () => {
      const response = await request(app)
        .post(`/api/v1/assets/${testAsset.id}/arco-tags`)
        .set('Authorization', `Bearer ${curatorToken}`)
        .send({
          arcoUri: 'invalid-uri',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
