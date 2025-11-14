# Cultural Heritage Digital Asset Management System
## Master Implementation Guide v2.0 - PART 3

**Last Updated:** November 14, 2024  
**Target Audience:** Development Team, Product Managers, Technical Architects  
**Repository Strategy:** Separated Repositories Architecture  
**Status:** Production Ready

---

## Document Structure

This is **Part 3 of 3** of the Master Implementation Guide:

- **Part 1**: Executive Summary, Vision, Architecture, Tech Stack, Setup, Core Patterns
- **Part 2**: Database, Auth, API, Frontend, MCP Integration, ArCo Strategy
- **Part 3** (this document): Security, Performance, Testing, Deployment, Monitoring, Documentation

**This completes the full Master Implementation Guide.**

---

## Table of Contents - Part 3

15. [Security & Compliance](#15-security--compliance)
16. [Performance & Scalability](#16-performance--scalability)
17. [Testing Strategy](#17-testing-strategy)
18. [Deployment & DevOps](#18-deployment--devops)
19. [Monitoring & Observability](#19-monitoring--observability)
20. [Documentation Standards](#20-documentation-standards)

---

## 15. Security & Compliance

### Security Checklist

**Authentication & Authorization:**
- [x] Azure AD integration with MFA support
- [x] JWT tokens with 24h expiration
- [x] Role-based access control (RBAC) - 4 roles
- [x] API key authentication for MCP Server
- [x] Token refresh mechanism
- [ ] OAuth 2.0 for third-party integrations (Phase 4)

**Data Protection:**
- [x] HTTPS only (TLS 1.3) in production
- [x] Password hashing with bcrypt (12 rounds) - for local accounts
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] XSS protection (Content Security Policy headers)
- [x] CSRF protection (SameSite cookies, tokens)
- [ ] Encryption at rest for sensitive fields (Phase 2)

**API Security:**
- [x] Rate limiting (100/hour anonymous, 1000/hour authenticated)
- [x] Request validation (Joi schemas)
- [x] CORS configuration (whitelist origins)
- [x] API versioning (/api/v1)
- [x] Input sanitization
- [ ] GraphQL rate limiting (if implementing GraphQL)

**File Upload Security:**
- [x] File type validation (MIME type + magic bytes)
- [x] File size limits (100MB per file)
- [x] Filename sanitization
- [x] Content Security Policy for file serving
- [ ] Virus scanning integration (ClamAV - Phase 2)
- [ ] Sandboxed file preview (Phase 3)

**Audit & Logging:**
- [x] Audit trail for all critical operations
- [x] User action logging (CRUD operations)
- [x] Failed authentication tracking
- [x] Security event alerting
- [x] IP address and user agent logging
- [ ] SIEM integration (Phase 4)

### GDPR Compliance

**User Rights Implementation:**

```typescript
// backend/src/controllers/gdpr.controller.ts
export class GdprController {
  constructor(
    private gdprService: GdprService,
    private auditService: AuditService
  ) {}

  /**
   * Right to Access (Art. 15 GDPR)
   * User can request all their personal data
   */
  async exportUserData(req: Request, res: Response) {
    const userId = req.user!.id;

    const userData = await this.gdprService.exportUserData(userId);

    // Audit the export request
    await this.auditService.log({
      action: 'GDPR_DATA_EXPORT',
      userId,
      entityType: 'User',
      entityId: userId
    });

    res.json({
      success: true,
      data: {
        user: userData.user,
        assets: userData.assets,
        collections: userData.collections,
        auditLogs: userData.auditLogs,
        exportedAt: new Date().toISOString()
      }
    });
  }

  /**
   * Right to Erasure (Art. 17 GDPR)
   * User can request deletion of their personal data
   */
  async deleteUserData(req: Request, res: Response) {
    const userId = req.user!.id;

    // Verify user identity (require re-authentication)
    const confirmToken = req.body.confirmToken;
    if (!this.verifyConfirmToken(confirmToken, userId)) {
      return res.status(403).json({
        success: false,
        error: 'Invalid confirmation token'
      });
    }

    // Anonymize user (keep audit trail but remove PII)
    await this.gdprService.anonymizeUser(userId);

    // Transfer asset ownership to designated admin
    const defaultAdmin = await this.userRepository.findDefaultAdmin();
    await this.gdprService.transferAssetOwnership(userId, defaultAdmin.id);

    // Audit the deletion
    await this.auditService.log({
      action: 'GDPR_DATA_DELETION',
      userId: 'ANONYMIZED',
      entityType: 'User',
      entityId: userId,
      details: { previousUserId: userId }
    });

    res.json({
      success: true,
      message: 'User data deleted successfully'
    });
  }

  /**
   * Right to Rectification (Art. 16 GDPR)
   * User can update their personal information
   */
  async updateUserData(req: Request, res: Response) {
    const userId = req.user!.id;
    const updates = UpdateUserDto.validate(req.body);

    const updatedUser = await this.userRepository.update(userId, updates);

    await this.auditService.log({
      action: 'USER_UPDATE',
      userId,
      entityType: 'User',
      entityId: userId,
      changes: { before: req.user, after: updatedUser }
    });

    res.json({
      success: true,
      data: updatedUser
    });
  }

  /**
   * Right to Data Portability (Art. 20 GDPR)
   * User can receive their data in machine-readable format
   */
  async exportUserDataPortable(req: Request, res: Response) {
    const userId = req.user!.id;

    const userData = await this.gdprService.exportUserDataPortable(userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="user-data-${userId}-${Date.now()}.json"`
    );

    res.json(userData);
  }

  private verifyConfirmToken(token: string, userId: string): boolean {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      return decoded.sub === userId && decoded.type === 'delete_confirmation';
    } catch {
      return false;
    }
  }
}
```

**GDPR Service Implementation:**

```typescript
// backend/src/services/gdpr.service.ts
export class GdprService {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  async exportUserData(userId: string): Promise<GdprExport> {
    const [user, assets, collections, auditLogs] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.asset.findMany({
        where: { creatorId: userId },
        include: { tags: true, arcoTags: true }
      }),
      this.prisma.collection.findMany({ where: { creatorId: userId } }),
      this.prisma.auditLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 1000 // Limit to last 1000 entries
      })
    ]);

    return {
      user: this.sanitizeUserData(user!),
      assets: assets.map(a => this.sanitizeAssetData(a)),
      collections: collections.map(c => this.sanitizeCollectionData(c)),
      auditLogs: auditLogs.map(l => this.sanitizeAuditLog(l))
    };
  }

  async anonymizeUser(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `anonymized-${userId}@deleted.local`,
        name: 'Anonymized User',
        azureAdId: null,
        organization: null,
        department: null,
        phone: null,
        isActive: false
      }
    });

    this.logger.info(`User ${userId} anonymized for GDPR compliance`);
  }

  async transferAssetOwnership(
    fromUserId: string,
    toUserId: string
  ): Promise<number> {
    const result = await this.prisma.asset.updateMany({
      where: { creatorId: fromUserId },
      data: { creatorId: toUserId }
    });

    this.logger.info(
      `Transferred ${result.count} assets from ${fromUserId} to ${toUserId}`
    );

    return result.count;
  }

  async exportUserDataPortable(userId: string): Promise<any> {
    const data = await this.exportUserData(userId);

    // Convert to standardized portable format
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      user: {
        identifier: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        createdAt: data.user.createdAt
      },
      assets: data.assets.map(asset => ({
        identifier: asset.id,
        title: asset.title,
        description: asset.description,
        filename: asset.filename,
        createdAt: asset.createdAt,
        tags: asset.tags.map(t => t.name),
        arcoTags: asset.arcoTags.map(t => ({
          category: t.category,
          label: t.label,
          uri: t.arcoUri
        }))
      })),
      collections: data.collections.map(col => ({
        identifier: col.id,
        name: col.name,
        description: col.description,
        createdAt: col.createdAt
      }))
    };
  }

  private sanitizeUserData(user: User): any {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization,
      createdAt: user.createdAt
      // Exclude: azureAdId (internal), lastLoginAt (sensitive)
    };
  }

  private sanitizeAssetData(asset: any): any {
    return {
      id: asset.id,
      title: asset.title,
      description: asset.description,
      filename: asset.filename,
      createdAt: asset.createdAt,
      tags: asset.tags,
      arcoTags: asset.arcoTags
      // Exclude: sharepointUrl (internal), sharepointId (internal)
    };
  }

  private sanitizeCollectionData(collection: Collection): any {
    return {
      id: collection.id,
      name: collection.name,
      description: collection.description,
      createdAt: collection.createdAt
    };
  }

  private sanitizeAuditLog(log: AuditLog): any {
    return {
      action: log.action,
      entityType: log.entityType,
      createdAt: log.createdAt
      // Exclude: ipAddress, userAgent (potentially sensitive)
    };
  }
}
```

**Data Retention Policy:**

```typescript
// backend/src/jobs/data-retention.job.ts
import { CronJob } from 'cron';

export class DataRetentionJob {
  constructor(
    private prisma: PrismaClient,
    private logger: Logger
  ) {}

  start() {
    // Run daily at 2 AM
    const job = new CronJob('0 2 * * *', async () => {
      this.logger.info('Starting data retention cleanup...');

      try {
        // Delete audit logs older than 2 years (GDPR requirement)
        const twoYearsAgo = new Date();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        const deleted = await this.prisma.auditLog.deleteMany({
          where: {
            createdAt: { lt: twoYearsAgo }
          }
        });

        this.logger.info(`Deleted ${deleted.count} old audit logs`);

        // Delete draft assets older than 6 months
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const deletedDrafts = await this.prisma.asset.deleteMany({
          where: {
            status: 'DRAFT',
            createdAt: { lt: sixMonthsAgo }
          }
        });

        this.logger.info(`Deleted ${deletedDrafts.count} old draft assets`);

      } catch (error) {
        this.logger.error('Data retention cleanup failed:', error);
      }
    });

    job.start();
    this.logger.info('Data retention job scheduled');
  }
}
```

### Security Headers

```typescript
// backend/src/middleware/security-headers.middleware.ts
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For React
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.API_URL!],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});
```

---

## 16. Performance & Scalability

### Performance Targets

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **API Response Time** | < 200ms (p95) | New Relic APM |
| **Asset List Load** | < 2s for 10k assets | Frontend performance timing |
| **Image Upload** | < 5s for 10MB file | Upload progress tracking |
| **Search Query** | < 500ms (p95) | Elasticsearch metrics |
| **ArCo Autocomplete** | < 300ms | Frontend network tab |
| **Database Query** | < 50ms (p95) | PostgreSQL slow query log |
| **Concurrent Users** | 500+ simultaneous | Load testing (k6) |
| **Asset Throughput** | 1000+ uploads/hour | System metrics |

### Caching Strategy

**Multi-Layer Caching Architecture:**

```
┌─────────────────────────────────────────┐
│  Browser Cache (Frontend)              │
│  - Static assets: 1 year               │
│  - Thumbnails: 1 week                  │
│  - API responses: ETag validation      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  Redis Cache (Backend)                  │
│  - User sessions: 24 hours             │
│  - ArCo vocabulary: 1 week             │
│  - Search results: 1 hour              │
│  - Asset metadata: 5 minutes           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│  CDN (Production)                       │
│  - Images: CloudFlare/Azure CDN        │
│  - Static files: Aggressive caching    │
└─────────────────────────────────────────┘
```

**Cache Implementation:**

```typescript
// backend/src/services/cache.service.ts
import { Redis } from 'ioredis';

export class CacheService {
  constructor(private redis: Redis, private logger: Logger) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;

      return JSON.parse(cached) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  async invalidate(pattern: string): Promise<number> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) return 0;

      await this.redis.del(...keys);
      return keys.length;
    } catch (error) {
      this.logger.error(`Cache invalidate error for pattern ${pattern}:`, error);
      return 0;
    }
  }

  // Cache-aside pattern with automatic fetch
  async wrap<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    // Force refresh if requested
    if (options?.forceRefresh) {
      const fresh = await fetchFn();
      await this.set(key, fresh, ttl);
      return fresh;
    }

    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch fresh data
    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);

    return fresh;
  }

  // Get or set with lock (prevent cache stampede)
  async getOrSetWithLock<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>,
    lockTtl: number = 10
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;

    // Try to acquire lock
    const lockKey = `lock:${key}`;
    const locked = await this.redis.set(lockKey, '1', 'EX', lockTtl, 'NX');

    if (locked === 'OK') {
      try {
        // We got the lock - fetch and cache
        const fresh = await fetchFn();
        await this.set(key, fresh, ttl);
        return fresh;
      } finally {
        // Release lock
        await this.redis.del(lockKey);
      }
    } else {
      // Someone else is fetching - wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.getOrSetWithLock(key, ttl, fetchFn, lockTtl);
    }
  }
}
```

### Database Optimization

**Connection Pooling:**

```typescript
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection string format:
// postgresql://user:password@host:5432/dbname?schema=public&connection_limit=20&pool_timeout=10
```

**Query Optimization Examples:**

```typescript
// ❌ BAD: N+1 query problem
const assets = await prisma.asset.findMany();
for (const asset of assets) {
  const creator = await prisma.user.findUnique({
    where: { id: asset.creatorId }
  });
  asset.creator = creator;
}

// ✅ GOOD: Use include to fetch relations
const assets = await prisma.asset.findMany({
  include: {
    creator: {
      select: { id: true, name: true, email: true }
    },
    tags: true,
    arcoTags: true
  }
});

// ✅ GOOD: Select only needed fields
const assets = await prisma.asset.findMany({
  select: {
    id: true,
    title: true,
    thumbnailUrl: true,
    status: true,
    createdAt: true
    // Exclude: description, sharepointUrl, etc.
  }
});

// ✅ GOOD: Cursor-based pagination for large datasets
const assets = await prisma.asset.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastAssetId },
  orderBy: { createdAt: 'desc' }
});

// ✅ GOOD: Batch operations with transaction
await prisma.$transaction([
  prisma.asset.update({ where: { id: 'asset1' }, data: { status: 'PUBLISHED' } }),
  prisma.asset.update({ where: { id: 'asset2' }, data: { status: 'PUBLISHED' } }),
  prisma.auditLog.create({ data: { action: 'BULK_PUBLISH', userId: 'user1' } })
]);
```

### Image Processing Optimization

```typescript
// backend/src/services/image-processing.service.ts
import sharp from 'sharp';

export class ImageProcessingService {
  // Generate thumbnail efficiently
  async generateThumbnail(
    inputBuffer: Buffer,
    width: number = 300
  ): Promise<Buffer> {
    return await sharp(inputBuffer)
      .resize(width, null, {
        fit: 'inside',
        withoutEnlargement: true,
        kernel: sharp.kernel.lanczos3 // High quality
      })
      .jpeg({
        quality: 80,
        progressive: true,
        mozjpeg: true // Better compression
      })
      .toBuffer();
  }

  // Optimize image for web
  async optimizeImage(inputBuffer: Buffer): Promise<Buffer> {
    const metadata = await sharp(inputBuffer).metadata();

    let pipeline = sharp(inputBuffer);

    // Resize if too large
    if (metadata.width && metadata.width > 1920) {
      pipeline = pipeline.resize(1920, null, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Optimize based on format
    if (metadata.format === 'jpeg') {
      return await pipeline
        .jpeg({ quality: 85, progressive: true, mozjpeg: true })
        .toBuffer();
    } else if (metadata.format === 'png') {
      return await pipeline
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();
    } else if (metadata.format === 'webp') {
      return await pipeline
        .webp({ quality: 85 })
        .toBuffer();
    }

    return inputBuffer;
  }

  // Generate multiple sizes in parallel
  async generateResponsiveImages(
    inputBuffer: Buffer
  ): Promise<Record<string, Buffer>> {
    const sizes = {
      thumbnail: 300,
      small: 640,
      medium: 1024,
      large: 1920
    };

    const results = await Promise.all(
      Object.entries(sizes).map(async ([name, width]) => {
        const buffer = await this.generateThumbnail(inputBuffer, width);
        return [name, buffer] as [string, Buffer];
      })
    );

    return Object.fromEntries(results);
  }

  // Extract EXIF without loading full image
  async extractExifMetadata(inputBuffer: Buffer): Promise<ExifData> {
    const metadata = await sharp(inputBuffer).metadata();

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      space: metadata.space,
      channels: metadata.channels,
      density: metadata.density,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
      exif: metadata.exif ? this.parseExif(metadata.exif) : undefined
    };
  }

  private parseExif(exifBuffer: Buffer): any {
    // Parse EXIF data from buffer
    // Implementation depends on EXIF library used
    return {};
  }
}
```

### Horizontal Scaling Strategy

**Load Balancer Configuration (Nginx):**

```nginx
# nginx.conf
upstream dam_backend {
    least_conn;  # Route to server with fewest connections
    server backend1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server backend2:3000 weight=1 max_fails=3 fail_timeout=30s;
    server backend3:3000 weight=1 max_fails=3 fail_timeout=30s;
    
    # Health check
    check interval=3000 rise=2 fall=3 timeout=1000 type=http;
    check_http_send "GET /health HTTP/1.0\r\n\r\n";
    check_http_expect_alive http_2xx http_3xx;
}

server {
    listen 443 ssl http2;
    server_name api.dam.museum.it;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.3;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;
    
    location /api {
        proxy_pass http://dam_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Static assets with long cache
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 17. Testing Strategy

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          5%  - End-to-End Tests
                 /------\               (Playwright)
                /        \
               / Integration \    25% - Integration Tests
              /------------\          (API, Database)
             /              \
            /   Unit Tests   \    70% - Unit Tests
           /------------------\        (Jest)
```

### Unit Testing

**Backend Unit Tests (Jest):**

```typescript
// backend/tests/services/asset.service.test.ts
import { AssetService } from '../../src/services/asset.service';
import { AssetRepository } from '../../src/repositories/asset.repository';
import { SharepointService } from '../../src/services/sharepoint.service';
import { SearchService } from '../../src/services/search.service';

describe('AssetService', () => {
  let assetService: AssetService;
  let assetRepository: jest.Mocked<AssetRepository>;
  let sharepointService: jest.Mocked<SharepointService>;
  let searchService: jest.Mocked<SearchService>;

  beforeEach(() => {
    assetRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    } as any;

    sharepointService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn()
    } as any;

    searchService = {
      indexAsset: jest.fn(),
      removeAsset: jest.fn()
    } as any;

    assetService = new AssetService(
      assetRepository,
      sharepointService,
      searchService
    );
  });

  describe('uploadAsset', () => {
    it('should upload file and save metadata', async () => {
      // Arrange
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      } as Express.Multer.File;

      const metadata = {
        title: 'Test Asset',
        description: 'Test description'
      };

      const userId = 'user-123';

      sharepointService.uploadFile.mockResolvedValue(
        'https://sharepoint.com/test.jpg'
      );

      assetRepository.create.mockResolvedValue({
        id: 'asset-123',
        ...metadata,
        filename: mockFile.originalname,
        mimeType: mockFile.mimetype,
        fileSize: mockFile.size,
        sharepointUrl: 'https://sharepoint.com/test.jpg',
        creatorId: userId,
        status: 'DRAFT'
      } as any);

      // Act
      const result = await assetService.uploadAsset(mockFile, metadata, userId);

      // Assert
      expect(sharepointService.uploadFile).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname
      );
      expect(assetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Asset',
          filename: 'test.jpg',
          creatorId: userId
        })
      );
      expect(searchService.indexAsset).toHaveBeenCalledWith(result);
      expect(result.id).toBe('asset-123');
    });

    it('should throw ValidationError for file too large', async () => {
      // Arrange
      const largeFile = {
        buffer: Buffer.alloc(200 * 1024 * 1024), // 200MB
        originalname: 'large.jpg',
        mimetype: 'image/jpeg',
        size: 200 * 1024 * 1024
      } as Express.Multer.File;

      // Act & Assert
      await expect(
        assetService.uploadAsset(largeFile, { title: 'Test' }, 'user-123')
      ).rejects.toThrow(ValidationError);

      expect(sharepointService.uploadFile).not.toHaveBeenCalled();
    });

    it('should throw ValidationError for invalid MIME type', async () => {
      // Arrange
      const invalidFile = {
        buffer: Buffer.from('test'),
        originalname: 'script.exe',
        mimetype: 'application/x-msdownload',
        size: 1024
      } as Express.Multer.File;

      // Act & Assert
      await expect(
        assetService.uploadAsset(invalidFile, { title: 'Test' }, 'user-123')
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteAsset', () => {
    it('should delete asset and cleanup', async () => {
      // Arrange
      const assetId = 'asset-123';
      const mockAsset = {
        id: assetId,
        sharepointUrl: 'https://sharepoint.com/test.jpg',
        sharepointId: 'sp-123'
      };

      assetRepository.findById.mockResolvedValue(mockAsset as any);
      assetRepository.delete.mockResolvedValue(undefined);
      sharepointService.deleteFile.mockResolvedValue(undefined);
      searchService.removeAsset.mockResolvedValue(undefined);

      // Act
      await assetService.deleteAsset(assetId);

      // Assert
      expect(assetRepository.findById).toHaveBeenCalledWith(assetId);
      expect(sharepointService.deleteFile).toHaveBeenCalledWith('sp-123');
      expect(assetRepository.delete).toHaveBeenCalledWith(assetId);
      expect(searchService.removeAsset).toHaveBeenCalledWith(assetId);
    });
  });
});
```

**Frontend Unit Tests (React Testing Library):**

```typescript
// frontend/tests/components/AssetCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { AssetCard } from '../../../src/components/organisms/AssetCard';
import assetsReducer from '../../../src/store/slices/assets.slice';

const mockStore = configureStore({
  reducer: {
    assets: assetsReducer
  }
});

describe('AssetCard', () => {
  const mockAsset = {
    id: 'asset-123',
    title: 'Mona Lisa',
    description: 'Famous Renaissance painting',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    status: 'PUBLISHED',
    tags: [{ id: 'tag1', name: 'painting' }],
    arcoTags: []
  };

  it('should render asset information', () => {
    render(
      <Provider store={mockStore}>
        <AssetCard asset={mockAsset} />
      </Provider>
    );

    expect(screen.getByText('Mona Lisa')).toBeInTheDocument();
    expect(screen.getByText('Famous Renaissance painting')).toBeInTheDocument();
    expect(screen.getByAltText('Mona Lisa')).toHaveAttribute(
      'src',
      'https://example.com/thumb.jpg'
    );
  });

  it('should call onSelect when clicked', () => {
    const onSelect = jest.fn();

    render(
      <Provider store={mockStore}>
        <AssetCard asset={mockAsset} onSelect={onSelect} />
      </Provider>
    );

    fireEvent.click(screen.getByTestId('asset-card'));

    expect(onSelect).toHaveBeenCalledWith(mockAsset);
  });

  it('should show status badge', () => {
    render(
      <Provider store={mockStore}>
        <AssetCard asset={mockAsset} />
      </Provider>
    );

    expect(screen.getByText('PUBLISHED')).toBeInTheDocument();
  });

  it('should render tags', () => {
    render(
      <Provider store={mockStore}>
        <AssetCard asset={mockAsset} />
      </Provider>
    );

    expect(screen.getByText('painting')).toBeInTheDocument();
  });
});
```

### Integration Testing

**API Integration Tests:**

```typescript
// backend/tests/integration/assets.api.test.ts
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/database';

describe('Assets API', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@museum.it',
        name: 'Test User',
        role: 'CURATOR'
      }
    });

    // Get auth token
    authToken = generateTestToken(testUser.id, testUser.role);
  });

  afterAll(async () => {
    // Cleanup
    await prisma.asset.deleteMany({ where: { creatorId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/assets', () => {
    it('should create new asset', async () => {
      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', 'tests/fixtures/test-image.jpg')
        .field('title', 'Test Asset')
        .field('description', 'Test Description');

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Asset');
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .post('/api/v1/assets')
        .attach('file', 'tests/fixtures/test-image.jpg')
        .field('title', 'Test Asset');

      expect(response.status).toBe(401);
    });

    it('should return 400 for invalid file type', async () => {
      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', 'tests/fixtures/test-script.js')
        .field('title', 'Invalid File');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid file type');
    });
  });

  describe('GET /api/v1/assets/:id', () => {
    let testAsset: any;

    beforeEach(async () => {
      testAsset = await prisma.asset.create({
        data: {
          title: 'Test Asset',
          filename: 'test.jpg',
          mimeType: 'image/jpeg',
          fileSize: 1024,
          sharepointUrl: 'https://sharepoint.com/test.jpg',
          sharepointId: 'sp-123',
          creatorId: testUser.id,
          status: 'PUBLISHED'
        }
      });
    });

    afterEach(async () => {
      await prisma.asset.delete({ where: { id: testAsset.id } });
    });

    it('should return asset details', async () => {
      const response = await request(app)
        .get(`/api/v1/assets/${testAsset.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(testAsset.id);
      expect(response.body.data.title).toBe('Test Asset');
    });

    it('should return 404 for non-existent asset', async () => {
      const response = await request(app)
        .get('/api/v1/assets/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});

function generateTestToken(userId: string, role: string): string {
  return jwt.sign(
    { sub: userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}
```

### End-to-End Testing (Playwright)

```typescript
// e2e/tests/asset-upload-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Asset Upload Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login');
    await page.fill('[name="email"]', 'curator@museum.it');
    await page.fill('[name="password"]', 'test123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should upload asset with ArCo tags', async ({ page }) => {
    // Navigate to upload page
    await page.click('text=Upload Asset');
    await expect(page).toHaveURL(/.*\/assets\/upload/);

    // Upload file
    await page.setInputFiles(
      '[data-testid="file-input"]',
      'tests/fixtures/painting.jpg'
    );

    // Fill metadata
    await page.fill('[name="title"]', 'Venus de Milo');
    await page.fill('[name="description"]', 'Ancient Greek sculpture');

    // Select ArCo tags
    await page.click('[data-testid="arco-type-selector"]');
    await page.fill('[placeholder*="Cerca tipo"]', 'scultura');
    await page.waitForSelector('text=scultura');
    await page.click('text=scultura');

    await page.click('[data-testid="arco-material-selector"]');
    await page.fill('[placeholder*="Cerca materiale"]', 'marmo');
    await page.waitForSelector('text=marmo');
    await page.click('text=marmo');

    // Submit form
    await page.click('button:has-text("Upload")');

    // Wait for success notification
    await expect(page.locator('text=Asset uploaded successfully')).toBeVisible({
      timeout: 10000
    });

    // Verify asset appears in list
    await page.goto('http://localhost:3000/assets');
    await expect(page.locator('text=Venus de Milo')).toBeVisible();
  });

  test('should show validation errors for missing fields', async ({ page }) => {
    await page.click('text=Upload Asset');

    // Try to submit without file
    await page.click('button:has-text("Upload")');

    await expect(page.locator('text=File is required')).toBeVisible();
  });

  test('should show upload progress for large files', async ({ page }) => {
    await page.click('text=Upload Asset');

    // Upload large file
    await page.setInputFiles(
      '[data-testid="file-input"]',
      'tests/fixtures/large-image.jpg'
    );

    await page.fill('[name="title"]', 'Large Image');
    await page.click('button:has-text("Upload")');

    // Progress bar should appear
    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();

    // Wait for completion
    await expect(page.locator('text=100%')).toBeVisible({ timeout: 30000 });
  });
});
```

### CI/CD Testing Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run backend unit tests
        run: cd backend && npm test -- --coverage

      - name: Run frontend unit tests
        run: cd frontend && npm test -- --coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: cd backend && npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db

      - name: Run integration tests
        run: cd backend && npm run test:integration
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Start services
        run: docker-compose -f docker/docker-compose.test.yml up -d

      - name: Wait for services
        run: sleep 10

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-screenshots
          path: e2e/test-results/

      - name: Stop services
        if: always()
        run: docker-compose -f docker/docker-compose.test.yml down
```

---

## 18. Deployment & DevOps

### Environment Configuration

**Development (`docker-compose.dev.yml`):**

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: dam_dev
      POSTGRES_USER: dam_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dam_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      DATABASE_URL: postgresql://dam_user:dev_password@postgres:5432/dam_dev
      REDIS_URL: redis://redis:6379
      ELASTICSEARCH_URL: http://elasticsearch:9200
      NODE_ENV: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      REACT_APP_API_URL: http://localhost:3000/api
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
  es_data:
```

**Production (`docker-compose.prod.yml`):**

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/museum/dam-backend:${VERSION}
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      ELASTICSEARCH_URL: ${ELASTICSEARCH_URL}
      AZURE_AD_CLIENT_ID: ${AZURE_AD_CLIENT_ID}
      AZURE_AD_CLIENT_SECRET: ${AZURE_AD_CLIENT_SECRET}
      JWT_SECRET: ${JWT_SECRET}
      MCP_SERVER_URL: ${MCP_SERVER_URL}
      MCP_SERVER_API_KEY: ${MCP_SERVER_API_KEY}
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: ghcr.io/museum/dam-frontend:${VERSION}
    restart: always
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 5s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    restart: always
```

### Dockerfile Examples

**Backend Dockerfile (Multi-stage):**

```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile (Nginx):**

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build React app
ENV NODE_ENV=production
RUN npm run build

# Production stage with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add healthcheck script
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'curl -f http://localhost/health || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD /healthcheck.sh

CMD ["nginx", "-g", "daemon off;"]
```

### CI/CD Deployment Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
    tags: [ 'v*' ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    uses: ./.github/workflows/test.yml

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract version
        id: version
        run: |
          if [[ $GITHUB_REF == refs/tags/* ]]; then
            echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
          else
            echo "VERSION=${GITHUB_SHA::7}" >> $GITHUB_OUTPUT
          fi

      - name: Build and push backend
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:${{ steps.version.outputs.VERSION }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push frontend
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:${{ steps.version.outputs.VERSION }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    environment: staging

    steps:
      - name: Deploy to staging
        run: |
          # SSH into staging server and update containers
          ssh ${{ secrets.STAGING_USER }}@${{ secrets.STAGING_HOST }} << 'EOF'
            cd /opt/dam
            docker-compose pull
            docker-compose up -d
            docker-compose exec backend npx prisma migrate deploy
          EOF

      - name: Run smoke tests
        run: |
          curl -f https://staging.dam.museum.it/health || exit 1

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    if: startsWith(github.ref, 'refs/tags/')

    steps:
      - name: Deploy to production
        uses: azure/webapps-deploy@v2
        with:
          app-name: dam-production
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:${{ steps.version.outputs.VERSION }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-frontend:${{ steps.version.outputs.VERSION }}

      - name: Run database migrations
        run: |
          # Run migrations in production
          az containerapp exec \
            --name dam-backend \
            --resource-group dam-prod \
            --command "npx prisma migrate deploy"

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Deployed version ${{ steps.version.outputs.VERSION }} to production'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Database Migration Strategy

**Migration Checklist:**

```markdown
# Production Migration Checklist

## Pre-Migration (1 day before)
- [ ] Review migration SQL on staging
- [ ] Estimate downtime (target: < 5 minutes)
- [ ] Create full database backup
- [ ] Test rollback procedure on staging
- [ ] Notify users of maintenance window
- [ ] Prepare rollback plan

## Migration Day

### Backup (15 minutes before)
```bash
pg_dump dam_prod > backup_$(date +%Y%m%d_%H%M%S).sql
aws s3 cp backup_*.sql s3://dam-backups/
```

### Apply Migration
```bash
# Set maintenance mode
curl -X POST https://api.dam.museum.it/admin/maintenance -d '{"enabled":true}'

# Run migration
npx prisma migrate deploy

# Verify
psql dam_prod -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### Post-Migration
- [ ] Verify application health
- [ ] Run smoke tests
- [ ] Check error logs
- [ ] Monitor performance metrics
- [ ] Disable maintenance mode
- [ ] Notify users of completion

## Rollback (if needed)
```bash
# Restore backup
psql dam_prod < backup_20241114_120000.sql

# Redeploy previous version
kubectl rollout undo deployment/dam-backend
```
```

---

## 19. Monitoring & Observability

### Metrics Collection with Prometheus

**Prometheus Configuration:**

```yaml
# prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'dam-production'
    environment: 'prod'

scrape_configs:
  - job_name: 'dam-backend'
    static_configs:
      - targets: ['backend-1:3000', 'backend-2:3000', 'backend-3:3000']
    metrics_path: '/metrics'

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

**Application Metrics (Backend):**

```typescript
// backend/src/middleware/metrics.middleware.ts
import client from 'prom-client';

// Create metrics registry
const register = new client.Registry();

// Default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active HTTP connections'
});

const assetUploads = new client.Counter({
  name: 'asset_uploads_total',
  help: 'Total number of asset uploads',
  labelNames: ['status'] // success, failed
});

const arcoSearchDuration = new client.Histogram({
  name: 'arco_search_duration_seconds',
  help: 'Duration of ArCo search queries',
  labelNames: ['category'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5]
});

// Register metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(activeConnections);
register.registerMetric(assetUploads);
register.registerMetric(arcoSearchDuration);

// Metrics middleware
export const metricsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  activeConnections.inc();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
    activeConnections.dec();
  });

  next();
};

// Metrics endpoint
export const metricsHandler = async (req: Request, res: Response) => {
  res.set('Content-Type', register.contentType);
  res.send(await register.metrics());
};

// Export metrics for use in services
export const metrics = {
  assetUploads,
  arcoSearchDuration
};
```

### Logging with Winston

```typescript
// backend/src/config/logger.ts
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const esTransportOpts = {
  level: 'info',
  clientOpts: {
    node: process.env.ELASTICSEARCH_URL,
    auth: {
      username: process.env.ES_USERNAME,
      password: process.env.ES_PASSWORD
    }
  },
  index: 'dam-logs',
  messageType: 'log',
  transformer: (logData: any) => {
    return {
      '@timestamp': new Date().toISOString(),
      message: logData.message,
      severity: logData.level,
      fields: logData.meta
    };
  }
};

const esTransport = new ElasticsearchTransport(esTransportOpts);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'dam-backend',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION
  },
  transports: [
    // Console for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    // File for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // File for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    }),
    // Elasticsearch for production
    ...(process.env.NODE_ENV === 'production' ? [esTransport] : [])
  ]
});

// Structured logging helpers
export const logAssetUpload = (assetId: string, userId: string, fileSize: number) => {
  logger.info('Asset uploaded', {
    assetId,
    userId,
    fileSize,
    event: 'ASSET_UPLOAD'
  });
};

export const logArcoSearch = (category: string, query: string, resultsCount: number, duration: number) => {
  logger.info('ArCo search performed', {
    category,
    query,
    resultsCount,
    duration,
    event: 'ARCO_SEARCH'
  });
};

export const logError = (error: Error, context?: any) => {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};
```

### Grafana Dashboards

**Dashboard Configuration (JSON):**

```json
{
  "dashboard": {
    "title": "DAM System Overview",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "p95"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status_code=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100"
          }
        ],
        "type": "singlestat",
        "format": "percent"
      },
      {
        "title": "Asset Uploads (24h)",
        "targets": [
          {
            "expr": "increase(asset_uploads_total{status=\"success\"}[24h])"
          }
        ],
        "type": "singlestat"
      },
      {
        "title": "Database Connection Pool",
        "targets": [
          {
            "expr": "pg_stat_activity_count / pg_settings_max_connections * 100"
          }
        ],
        "type": "gauge",
        "format": "percent"
      },
      {
        "title": "ArCo Search Performance",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(arco_search_duration_seconds_bucket[5m]))",
            "legendFormat": "{{category}}"
          }
        ],
        "type": "graph"
      }
    ]
  }
}
```

### Alerting Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: dam_alerts
    interval: 30s
    rules:
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status_code=~"5.."}[5m]))
          /
          sum(rate(http_requests_total[5m]))
          > 0.05
        for: 5m
        labels:
          severity: warning
          component: backend
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value | humanizePercentage }} (threshold: 5%)"

      # Slow response time
      - alert: SlowResponseTime
        expr: |
          histogram_quantile(0.95,
            rate(http_request_duration_seconds_bucket[5m])
          ) > 2
        for: 10m
        labels:
          severity: warning
          component: backend
        annotations:
          summary: "Slow API response time"
          description: "P95 response time is {{ $value }}s (threshold: 2s)"

      # Database down
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
          component: database
        annotations:
          summary: "PostgreSQL database is down"
          description: "Database has been unreachable for 1 minute"

      # Redis down
      - alert: RedisDown
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
          component: cache
        annotations:
          summary: "Redis cache is down"
          description: "Redis has been unreachable for 1 minute"

      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes)
          /
          node_memory_MemTotal_bytes
          > 0.9
        for: 5m
        labels:
          severity: warning
          component: infrastructure
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value | humanizePercentage }}"

      # Disk space low
      - alert: DiskSpaceLow
        expr: |
          (node_filesystem_avail_bytes{mountpoint="/"} * 100)
          /
          node_filesystem_size_bytes{mountpoint="/"}
          < 10
        for: 5m
        labels:
          severity: critical
          component: infrastructure
        annotations:
          summary: "Low disk space"
          description: "Only {{ $value }}% disk space remaining"

      # ArCo endpoint slow
      - alert: ArCoEndpointSlow
        expr: |
          histogram_quantile(0.95,
            rate(arco_search_duration_seconds_bucket[5m])
          ) > 5
        for: 10m
        labels:
          severity: warning
          component: arco
        annotations:
          summary: "ArCo searches are slow"
          description: "P95 ArCo search time is {{ $value }}s"
```

### Error Tracking with Sentry

```typescript
// backend/src/config/sentry.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  release: process.env.APP_VERSION,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Profiling
  profilesSampleRate: 0.1,

  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
    new Sentry.Integrations.Prisma({ client: prisma }),
    new ProfilingIntegration()
  ],

  beforeSend(event, hint) {
    // Filter out known non-critical errors
    if (event.exception) {
      const error = hint.originalException;
      if (error instanceof ValidationError) {
        return null; // Don't send validation errors to Sentry
      }
    }
    return event;
  }
});

// Request handler (must be first middleware)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... your routes ...

// Error handler (must be after routes)
app.use(Sentry.Handlers.errorHandler());

// Custom error context
export const captureAssetError = (error: Error, assetId: string, userId: string) => {
  Sentry.captureException(error, {
    tags: {
      operation: 'asset_operation',
      assetId
    },
    user: { id: userId },
    level: 'error'
  });
};
```

---

## 20. Documentation Standards

### API Documentation with OpenAPI

```typescript
// backend/src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cultural Heritage DAM API',
      version: '1.0.0',
      description: `
        API for managing digital assets in cultural heritage institutions.
        
        ## Authentication
        All endpoints require Bearer token authentication.
        
        ## Rate Limiting
        - Anonymous: 100 requests/hour
        - Authenticated: 1000 requests/hour
        - Admin: Unlimited
        
        ## Pagination
        List endpoints support pagination with \`page\` and \`limit\` query parameters.
      `,
      contact: {
        name: 'DAM Support',
        email: 'support@dam.museum.it'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://api.dam.museum.it/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            filename: { type: 'string' },
            mimeType: { type: 'string' },
            fileSize: { type: 'integer' },
            sharepointUrl: { type: 'string', format: 'uri' },
            thumbnailUrl: { type: 'string', format: 'uri' },
            status: {
              type: 'string',
              enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED']
            },
            tags: {
              type: 'array',
              items: { $ref: '#/components/schemas/Tag' }
            },
            arcoTags: {
              type: 'array',
              items: { $ref: '#/components/schemas/ArCoTag' }
            },
            creator: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
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
                details: { type: 'array', items: { type: 'object' } }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'DAM API Documentation'
  }));
};
```

### README Template

```markdown
# Cultural Heritage Digital Asset Management System

> Professional DAM solution for managing cultural heritage digital assets with ArCo ontology integration.

## Features

- 🖼️ **Asset Management**: Upload, organize, and manage digital assets
- 🏛️ **ArCo Integration**: Semantic tagging with Italian cultural heritage ontologies
- 🔍 **Advanced Search**: Full-text and semantic search with Elasticsearch
- 📚 **Collections**: Organize assets into curated collections
- 🔐 **Azure AD Auth**: Enterprise authentication with MFA support
- 📊 **Analytics**: Usage statistics and asset insights
- 🌐 **REST API**: Comprehensive API for integrations

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+

### Installation

```bash
# Clone repository
git clone https://github.com/museum/cultural-heritage-dam.git
cd cultural-heritage-dam

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Start services
docker-compose up -d

# Run migrations
cd backend && npx prisma migrate dev

# Start development servers
npm run dev
```

### Access

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api/v1
- **API Docs**: http://localhost:3000/api-docs

## Project Structure

```
cultural-heritage-dam/
├── frontend/          # React frontend
├── backend/           # Node.js API
├── shared/            # Shared types
├── docker/            # Docker configs
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Documentation

- [Architecture Overview](docs/architecture/README.md)
- [API Documentation](https://api.dam.museum.it/api-docs)
- [Deployment Guide](docs/deployment/README.md)
- [Development Guide](docs/development/README.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- Email: support@dam.museum.it
- Documentation: https://docs.dam.museum.it
- Issues: https://github.com/museum/cultural-heritage-dam/issues
```

---

## Conclusion

This completes the **Master Implementation Guide v2.0** for the Cultural Heritage Digital Asset Management System.

### Quick Reference Guide

**For New Claude Code Sessions:**

1. ✅ Read all 3 parts of this Master Implementation Guide
2. ✅ Check `CURRENT_STATUS.md` for latest progress
3. ✅ Review phase specs (`DAM-Phase1-MVP-Specs.md`, etc.)
4. ✅ Check `CHANGELOG.md` for recent changes

**Key Resources:**
- Part 1: Vision, Architecture, Setup, Patterns
- Part 2: Database, Auth, API, Frontend, MCP, ArCo
- Part 3: Security, Performance, Testing, Deployment

**Important Links:**
- GitHub: https://github.com/museum/cultural-heritage-dam
- ArCo Endpoint: https://dati.beniculturali.it/sparql
- Production: https://dam.museum.it

---

**Document Version:** 2.0  
**Part:** 3 of 3 (Final)  
**Last Updated:** November 14, 2024  
**Next Review:** February 14, 2025

**Total Pages**: ~150 pages across 3 parts  
**Completion**: 100%

---

*This Master Implementation Guide provides comprehensive technical documentation for developing the Cultural Heritage DAM system. All Claude Code sessions should use this as the authoritative reference.*
