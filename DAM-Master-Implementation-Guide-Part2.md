# Cultural Heritage Digital Asset Management System
## Master Implementation Guide v2.0 - PART 2

**Last Updated:** November 14, 2024  
**Target Audience:** Development Team, Product Managers, Technical Architects  
**Repository Strategy:** Separated Repositories Architecture  
**Status:** Production Ready

---

## Document Structure

This is **Part 2 of 3** of the Master Implementation Guide:

- **Part 1**: Executive Summary, Vision, Architecture, Tech Stack, Setup, Core Patterns
- **Part 2** (this document): Database, Auth, API, Frontend, MCP Integration, ArCo Strategy
- **Part 3**: Security, Performance, Testing, Deployment, Monitoring, Documentation

**Read all three parts for complete system understanding.**

---

## Table of Contents - Part 2

8. [Database Architecture](#8-database-architecture)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [API Architecture & Standards](#10-api-architecture--standards)
11. [Frontend Architecture](#11-frontend-architecture)
12. [MCP Server Integration](#12-mcp-server-integration)
13. [ArCo Integration Strategy](#13-arco-integration-strategy)
14. [Multi-Session Development Guidelines](#14-multi-session-development-guidelines)

---

## 8. Database Architecture

### PostgreSQL Schema Overview

**Core Tables:**
1. `users` - User accounts and roles
2. `assets` - Digital assets metadata
3. `collections` - User-created collections
4. `tags` - Free-form tags
5. `arco_tags` - ArCo vocabulary tags
6. `arco_vocabulary_cache` - Cached ArCo terms
7. `audit_logs` - Activity tracking
8. `jobs` - Background job tracking

### Complete Prisma Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== ENUMS ====================

enum UserRole {
  ADMIN
  CURATOR
  RESEARCHER
  VIEWER
}

enum AssetStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum ArCoCat {
  CULTURAL_PROPERTY_TYPE
  MATERIAL
  TECHNIQUE
  SUBJECT
  AUTHOR
  CHRONOLOGY
  LOCATION
  CONSERVATION_STATUS
}

enum AuditAction {
  ASSET_CREATE
  ASSET_UPDATE
  ASSET_DELETE
  ASSET_DOWNLOAD
  COLLECTION_CREATE
  COLLECTION_UPDATE
  COLLECTION_DELETE
  TAG_ADD
  TAG_REMOVE
  ARCO_TAG_ADD
  ARCO_TAG_REMOVE
  USER_LOGIN
  USER_LOGOUT
}

// ==================== MODELS ====================

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  role          UserRole @default(VIEWER)
  azureAdId     String?  @unique
  
  // Profile
  organization  String?
  department    String?
  phone         String?
  
  // Status
  isActive      Boolean  @default(true)
  lastLoginAt   DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relationships
  assets        Asset[]  @relation("CreatedBy")
  collections   Collection[]
  auditLogs     AuditLog[]
  
  @@index([email])
  @@index([azureAdId])
  @@index([role])
  @@map("users")
}

model Asset {
  id                  String      @id @default(uuid())
  
  // Basic Info
  title               String
  description         String?     @db.Text
  filename            String
  mimeType            String
  fileSize            Int
  
  // Storage
  sharepointUrl       String
  sharepointId        String      @unique
  thumbnailUrl        String?
  
  // Status
  status              AssetStatus @default(DRAFT)
  publishedAt         DateTime?
  
  // EXIF Metadata
  width               Int?
  height              Int?
  captureDate         DateTime?
  camera              String?
  lens                String?
  focalLength         String?
  aperture            String?
  shutterSpeed        String?
  iso                 String?
  gpsLatitude         Float?
  gpsLongitude        Float?
  
  // Relationships
  creatorId           String
  creator             User        @relation("CreatedBy", fields: [creatorId], references: [id])
  
  tags                Tag[]
  arcoTags            ArCoTag[]
  collections         CollectionAsset[]
  
  // Timestamps
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  
  @@index([creatorId])
  @@index([status])
  @@index([publishedAt])
  @@index([createdAt])
  @@index([mimeType])
  @@fulltext([title, description])
  @@map("assets")
}

model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  assets    Asset[]
  createdAt DateTime @default(now())
  
  @@index([name])
  @@map("tags")
}

model ArCoTag {
  id          String   @id @default(uuid())
  
  // Asset reference
  assetId     String
  asset       Asset    @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  // ArCo term
  category    ArCoCat
  arcoUri     String   // e.g., https://w3id.org/arco/resource/CulturalPropertyType/dipinto
  label       String   // e.g., "dipinto"
  notation    String?  // e.g., "OA" for Opera d'Arte
  
  // Metadata
  confidence  Float?   @default(1.0)  // For AI-suggested tags
  source      String   @default("manual") // "manual" or "ai"
  
  createdAt   DateTime @default(now())
  
  @@unique([assetId, arcoUri])
  @@index([assetId])
  @@index([category])
  @@index([arcoUri])
  @@map("arco_tags")
}

model ArCoVocabularyCache {
  id          String   @id @default(uuid())
  
  // ArCo Term
  uri         String   @unique
  category    ArCoCat
  label       String
  definition  String?  @db.Text
  notation    String?
  
  // Hierarchy & Relationships
  broader     String[] // URIs of broader terms
  narrower    String[] // URIs of narrower terms
  related     String[] // URIs of related terms
  altLabels   String[] // Synonyms and alternative labels
  
  // Metadata
  lastSync    DateTime @default(now())
  usageCount  Int      @default(0) // Track popularity
  
  @@index([category])
  @@index([label])
  @@index([uri])
  @@fulltext([label, definition])
  @@map("arco_vocabulary_cache")
}

model Collection {
  id          String   @id @default(uuid())
  
  // Basic Info
  name        String
  description String?  @db.Text
  isPublic    Boolean  @default(false)
  
  // Appearance
  coverAssetId String?
  color       String?  @default("#3B82F6")
  
  // Creator
  creatorId   String
  creator     User     @relation(fields: [creatorId], references: [id])
  
  // Assets
  assets      CollectionAsset[]
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([creatorId])
  @@index([isPublic])
  @@index([createdAt])
  @@map("collections")
}

model CollectionAsset {
  collectionId String
  assetId      String
  order        Int      @default(0)
  addedAt      DateTime @default(now())
  
  collection   Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  asset        Asset      @relation(fields: [assetId], references: [id], onDelete: Cascade)
  
  @@id([collectionId, assetId])
  @@index([collectionId])
  @@index([assetId])
  @@index([order])
  @@map("collection_assets")
}

model AuditLog {
  id          String      @id @default(uuid())
  
  // User
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  
  // Action
  action      AuditAction
  entityType  String      // 'Asset', 'Collection', 'User', etc.
  entityId    String
  
  // Details
  details     Json?
  changes     Json?       // Before/after for updates
  
  // Request Context
  ipAddress   String?
  userAgent   String?
  
  createdAt   DateTime    @default(now())
  
  @@index([userId])
  @@index([action])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### Database Indexes Strategy

**Performance-Critical Indexes:**

```sql
-- Asset search by status and date
CREATE INDEX idx_assets_status_created ON assets(status, created_at DESC);

-- ArCo tag filtering
CREATE INDEX idx_arco_tags_category_uri ON arco_tags(category, arco_uri);

-- Collection membership lookup
CREATE INDEX idx_collection_assets_both ON collection_assets(collection_id, asset_id);

-- Audit trail queries
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);

-- Full-text search (PostgreSQL)
CREATE INDEX idx_assets_fulltext ON assets USING GIN (to_tsvector('italian', title || ' ' || COALESCE(description, '')));

-- ArCo vocabulary search
CREATE INDEX idx_arco_vocab_fulltext ON arco_vocabulary_cache USING GIN (to_tsvector('italian', label || ' ' || COALESCE(definition, '')));
```

### Migration Strategy

**Development Workflow:**

```bash
# Create new migration
npx prisma migrate dev --name add_arco_confidence_field

# Generate Prisma client
npx prisma generate

# Seed database
npm run seed
```

**Production Deployment:**

```bash
# 1. Backup database
pg_dump dam_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Review migration SQL
npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script

# 3. Apply migration
npx prisma migrate deploy

# 4. Verify
psql dam_prod -c "SELECT * FROM _prisma_migrations ORDER BY finished_at DESC LIMIT 5;"
```

### Backup & Recovery

**Automated Daily Backups:**

```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="dam_db"
RETENTION_DAYS=30

# Create backup
pg_dump -h localhost -U dam_user -F c -b -v \
  -f "${BACKUP_DIR}/${DB_NAME}_${DATE}.backup" \
  ${DB_NAME}

# Compress
gzip "${BACKUP_DIR}/${DB_NAME}_${DATE}.backup"

# Clean old backups
find ${BACKUP_DIR} -name "*.backup.gz" -mtime +${RETENTION_DAYS} -delete

# Upload to Azure Blob Storage
az storage blob upload \
  --account-name dambackups \
  --container-name postgresql \
  --file "${BACKUP_DIR}/${DB_NAME}_${DATE}.backup.gz" \
  --name "${DB_NAME}_${DATE}.backup.gz"

echo "Backup completed: ${DB_NAME}_${DATE}.backup.gz"
```

**Recovery Procedure:**

```bash
# 1. Download backup from Azure
az storage blob download \
  --account-name dambackups \
  --container-name postgresql \
  --name dam_db_20241114_120000.backup.gz \
  --file /tmp/restore.backup.gz

# 2. Decompress
gunzip /tmp/restore.backup.gz

# 3. Stop application
docker-compose stop backend

# 4. Drop and recreate database
dropdb dam_db
createdb dam_db

# 5. Restore
pg_restore -h localhost -U dam_user -d dam_db -v /tmp/restore.backup

# 6. Verify
psql dam_db -c "SELECT COUNT(*) FROM assets;"

# 7. Restart application
docker-compose start backend
```

---

## 9. Authentication & Authorization

### Azure AD Integration Architecture

**Flow Overview:**

```
User → Frontend → Azure AD Login → Authorization Code
                                         ↓
Frontend ← JWT Token ← Backend ← Exchange Code for Token
                                         ↓
                                    Validate & Create Session
```

### Backend Configuration

```typescript
// backend/src/config/azure-ad.config.ts
import { ConfidentialClientApplication } from '@azure/msal-node';

export const msalConfig = {
  auth: {
    clientId: process.env.AZURE_AD_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}`,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii) {
          logger.debug(message);
        }
      },
      piiLoggingEnabled: false,
      logLevel: 'Info'
    }
  }
};

export const msalClient = new ConfidentialClientApplication(msalConfig);

// Scopes for Microsoft Graph API
export const graphScopes = [
  'User.Read',
  'Files.ReadWrite.All'  // For SharePoint access
];
```

### Authentication Flow Implementation

```typescript
// backend/src/services/auth.service.ts
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private auditService: AuditService
  ) {}

  async handleAzureCallback(code: string, redirectUri: string): Promise<AuthResponse> {
    // 1. Exchange authorization code for access token
    const tokenResponse = await msalClient.acquireTokenByCode({
      code,
      scopes: graphScopes,
      redirectUri
    });

    // 2. Get user info from Microsoft Graph
    const userInfo = await this.getUserInfoFromGraph(tokenResponse.accessToken);

    // 3. Find or create user in database
    const user = await this.findOrCreateUser(userInfo);

    // 4. Generate JWT token
    const jwtToken = this.generateJwtToken(user);

    // 5. Audit login
    await this.auditService.log({
      action: 'USER_LOGIN',
      userId: user.id,
      entityType: 'User',
      entityId: user.id
    });

    return {
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    };
  }

  private async getUserInfoFromGraph(accessToken: string): Promise<GraphUser> {
    const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    return response.data;
  }

  private async findOrCreateUser(graphUser: GraphUser): Promise<User> {
    let user = await this.userRepository.findByAzureAdId(graphUser.id);

    if (!user) {
      // Create new user
      user = await this.userRepository.create({
        email: graphUser.mail || graphUser.userPrincipalName,
        name: graphUser.displayName,
        azureAdId: graphUser.id,
        role: 'VIEWER' // Default role
      });
    } else {
      // Update last login
      user = await this.userRepository.update(user.id, {
        lastLoginAt: new Date()
      });
    }

    return user;
  }

  private generateJwtToken(user: User): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        azureAdId: user.azureAdId
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: '24h',
        issuer: 'dam-backend',
        audience: 'dam-frontend'
      }
    );
  }

  verifyJwtToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}
```

### Authentication Middleware

```typescript
// backend/src/middleware/auth.middleware.ts
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // Attach user to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      azureAdId: decoded.azureAdId
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
};
```

### Role-Based Access Control (RBAC)

**Role Hierarchy:**

```
ADMIN > CURATOR > RESEARCHER > VIEWER
```

**Permission Matrix:**

| Action | ADMIN | CURATOR | RESEARCHER | VIEWER |
|--------|-------|---------|------------|--------|
| View published assets | ✅ | ✅ | ✅ | ✅ |
| View draft assets | ✅ | ✅ | ❌ | ❌ |
| Create assets | ✅ | ✅ | ❌ | ❌ |
| Edit own assets | ✅ | ✅ | ❌ | ❌ |
| Edit any assets | ✅ | ❌ | ❌ | ❌ |
| Delete assets | ✅ | ✅* | ❌ | ❌ |
| Manage ArCo tags | ✅ | ✅ | ❌ | ❌ |
| Create collections | ✅ | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| Access analytics | ✅ | ✅ | ❌ | ❌ |

*Only own assets

**RBAC Middleware:**

```typescript
// backend/src/middleware/rbac.middleware.ts
export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Insufficient permissions'
      });
    }

    next();
  };
};

// Resource-based permissions
export const canModifyAsset = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const assetId = req.params.id;
  const user = req.user!;

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { creatorId: true }
  });

  if (!asset) {
    return res.status(404).json({
      success: false,
      error: 'Asset not found'
    });
  }

  // Admins can modify any asset
  if (user.role === 'ADMIN') {
    return next();
  }

  // Curators can only modify their own assets
  if (user.role === 'CURATOR' && asset.creatorId === user.id) {
    return next();
  }

  return res.status(403).json({
    success: false,
    error: 'Forbidden: Cannot modify this asset'
  });
};

// Usage in routes
router.put(
  '/assets/:id',
  authenticate,
  canModifyAsset,
  assetController.updateAsset
);

router.delete(
  '/assets/:id',
  authenticate,
  requireRole('ADMIN', 'CURATOR'),
  canModifyAsset,
  assetController.deleteAsset
);
```

---

## 10. API Architecture & Standards

### REST API Conventions

**Base URL**: `/api/v1`

**HTTP Methods:**
- `GET` - Retrieve resources (idempotent, cacheable)
- `POST` - Create new resources
- `PUT` - Replace entire resource
- `PATCH` - Partial update
- `DELETE` - Remove resource

### Standard Response Format

**Success Response (2xx):**

```json
{
  "success": true,
  "data": {
    "id": "asset-123",
    "title": "Mona Lisa",
    ...
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**Error Response (4xx, 5xx):**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title is required"
      },
      {
        "field": "file",
        "message": "File size must be less than 100MB"
      }
    ]
  }
}
```

### API Endpoints Specification

#### Assets API

```typescript
// GET /api/v1/assets - List assets
// Query params: page, limit, status, arcoType, search, sortBy, sortOrder
router.get('/assets', authenticate, assetController.listAssets);

// GET /api/v1/assets/:id - Get single asset
router.get('/assets/:id', authenticate, assetController.getAsset);

// POST /api/v1/assets - Create asset (multipart/form-data)
router.post(
  '/assets',
  authenticate,
  requireRole('CURATOR', 'ADMIN'),
  upload.single('file'),
  validateDto(CreateAssetDto),
  assetController.createAsset
);

// PATCH /api/v1/assets/:id - Update asset
router.patch(
  '/assets/:id',
  authenticate,
  canModifyAsset,
  validateDto(UpdateAssetDto),
  assetController.updateAsset
);

// DELETE /api/v1/assets/:id - Delete asset
router.delete(
  '/assets/:id',
  authenticate,
  requireRole('ADMIN', 'CURATOR'),
  canModifyAsset,
  assetController.deleteAsset
);

// POST /api/v1/assets/:id/tags - Add free-form tags
router.post(
  '/assets/:id/tags',
  authenticate,
  requireRole('CURATOR', 'ADMIN'),
  validateDto(AddTagsDto),
  assetController.addTags
);

// DELETE /api/v1/assets/:id/tags/:tagId - Remove tag
router.delete(
  '/assets/:id/tags/:tagId',
  authenticate,
  requireRole('CURATOR', 'ADMIN'),
  assetController.removeTag
);

// POST /api/v1/assets/:id/arco-tags - Add ArCo tags
router.post(
  '/assets/:id/arco-tags',
  authenticate,
  requireRole('CURATOR', 'ADMIN'),
  validateDto(AddArCoTagsDto),
  assetController.addArCoTags
);

// GET /api/v1/assets/:id/download - Download asset
router.get(
  '/assets/:id/download',
  authenticate,
  assetController.downloadAsset
);
```

#### Collections API

```typescript
// GET /api/v1/collections - List collections
router.get('/collections', authenticate, collectionController.listCollections);

// POST /api/v1/collections - Create collection
router.post(
  '/collections',
  authenticate,
  validateDto(CreateCollectionDto),
  collectionController.createCollection
);

// GET /api/v1/collections/:id - Get collection
router.get('/collections/:id', authenticate, collectionController.getCollection);

// PATCH /api/v1/collections/:id - Update collection
router.patch(
  '/collections/:id',
  authenticate,
  validateDto(UpdateCollectionDto),
  collectionController.updateCollection
);

// POST /api/v1/collections/:id/assets - Add assets to collection
router.post(
  '/collections/:id/assets',
  authenticate,
  validateDto(AddAssetsToCollectionDto),
  collectionController.addAssets
);

// DELETE /api/v1/collections/:id/assets/:assetId - Remove from collection
router.delete(
  '/collections/:id/assets/:assetId',
  authenticate,
  collectionController.removeAsset
);
```

#### ArCo API

```typescript
// GET /api/v1/arco/vocabularies/:category - Get vocabulary terms
router.get('/arco/vocabularies/:category', authenticate, arcoController.getVocabulary);

// GET /api/v1/arco/search - Search ArCo terms
// Query params: q (query), category, limit
router.get('/arco/search', authenticate, arcoController.searchTerms);

// GET /api/v1/arco/term/:uri - Get term details (URI encoded)
router.get('/arco/term/:uri', authenticate, arcoController.getTermDetails);

// POST /api/v1/arco/sync - Trigger vocabulary sync (admin only)
router.post(
  '/arco/sync',
  authenticate,
  requireRole('ADMIN'),
  arcoController.triggerSync
);
```

#### Search API

```typescript
// POST /api/v1/search - Advanced search
router.post(
  '/search',
  authenticate,
  validateDto(SearchDto),
  searchController.search
);

// GET /api/v1/search/suggestions - Autocomplete
router.get('/search/suggestions', authenticate, searchController.suggestions);
```

#### MCP Operations API

```typescript
// POST /api/v1/mcp/scan-library - Start library scan
router.post(
  '/mcp/scan-library',
  authenticate,
  requireRole('ADMIN'),
  validateDto(ScanLibraryDto),
  mcpController.scanLibrary
);

// POST /api/v1/mcp/detect-duplicates - Detect duplicates
router.post(
  '/mcp/detect-duplicates',
  authenticate,
  requireRole('ADMIN'),
  mcpController.detectDuplicates
);

// POST /api/v1/mcp/reorganize - Reorganize structure
router.post(
  '/mcp/reorganize',
  authenticate,
  requireRole('ADMIN'),
  validateDto(ReorganizeDto),
  mcpController.reorganize
);

// GET /api/v1/mcp/operations/:id - Get operation status
router.get(
  '/mcp/operations/:id',
  authenticate,
  requireRole('ADMIN'),
  mcpController.getOperationStatus
);
```

### Rate Limiting

```typescript
// backend/src/middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';

// General API limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: (req) => {
    if (!req.user) return 100;  // Anonymous
    if (req.user.role === 'ADMIN') return 0;  // Unlimited
    return 1000;  // Authenticated
  },
  message: {
    success: false,
    error: 'Too many requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Strict limiter for expensive operations
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    error: 'Rate limit exceeded for this operation'
  }
});

// Usage
app.use('/api', apiLimiter);
router.post('/search', strictLimiter, searchController.search);
```

### API Versioning Strategy

**Current**: URL-based versioning (`/api/v1`)

**Future Versions**:
- `/api/v2` - Breaking changes
- Old versions maintained for 12 months after deprecation

**Deprecation Headers**:
```typescript
res.setHeader('Deprecation', 'true');
res.setHeader('Sunset', 'Sat, 1 Jan 2025 00:00:00 GMT');
res.setHeader('Link', '</api/v2/assets>; rel="successor-version"');
```

---

## 11. Frontend Architecture

### Component Structure (Atomic Design)

```
src/components/
├── atoms/           # Basic building blocks
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── Button.styles.ts
│   ├── Input/
│   ├── Label/
│   ├── Icon/
│   └── Badge/
│
├── molecules/       # Simple combinations
│   ├── FormField/
│   ├── SearchBar/
│   ├── TagPill/
│   ├── AssetThumbnail/
│   └── Pagination/
│
├── organisms/       # Complex components
│   ├── AssetCard/
│   ├── AssetGrid/
│   ├── CollectionCard/
│   ├── ArCoTagSelector/
│   ├── AssetUploadModal/
│   └── FilterPanel/
│
├── templates/       # Page layouts
│   ├── DashboardLayout/
│   ├── AssetDetailLayout/
│   └── AuthLayout/
│
└── pages/           # Full pages
    ├── AssetsPage/
    ├── AssetDetailPage/
    ├── CollectionsPage/
    ├── ArCoVocabularyBrowser/
    └── DashboardPage/
```

### Redux Store Architecture

```typescript
// frontend/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/auth.slice';
import assetsReducer from './slices/assets.slice';
import collectionsReducer from './slices/collections.slice';
import arcoReducer from './slices/arco.slice';
import uiReducer from './slices/ui.slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assets: assetsReducer,
    collections: collectionsReducer,
    arco: arcoReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in specific actions
        ignoredActions: ['assets/upload/pending'],
        ignoredPaths: ['assets.uploadProgress']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Redux Slice Example: Assets

```typescript
// frontend/src/store/slices/assets.slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { assetService } from '../../services/asset.service';
import type { Asset, AssetFilters, PaginatedResponse } from '../../types';

interface AssetsState {
  items: Asset[];
  selectedAsset: Asset | null;
  loading: boolean;
  error: string | null;
  filters: AssetFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  uploadProgress: number;
}

const initialState: AssetsState = {
  items: [],
  selectedAsset: null,
  loading: false,
  error: null,
  filters: {
    status: 'PUBLISHED',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0
  },
  uploadProgress: 0
};

// Async thunks
export const fetchAssets = createAsyncThunk(
  'assets/fetchAll',
  async (filters: AssetFilters) => {
    const response = await assetService.getAssets(filters);
    return response.data;
  }
);

export const fetchAssetById = createAsyncThunk(
  'assets/fetchById',
  async (id: string) => {
    const response = await assetService.getAssetById(id);
    return response.data;
  }
);

export const uploadAsset = createAsyncThunk(
  'assets/upload',
  async (
    { file, metadata }: { file: File; metadata: Partial<Asset> },
    { dispatch }
  ) => {
    const response = await assetService.uploadAsset(file, metadata, (progress) => {
      dispatch(setUploadProgress(progress));
    });
    return response.data;
  }
);

export const updateAsset = createAsyncThunk(
  'assets/update',
  async ({ id, data }: { id: string; data: Partial<Asset> }) => {
    const response = await assetService.updateAsset(id, data);
    return response.data;
  }
);

export const deleteAsset = createAsyncThunk(
  'assets/delete',
  async (id: string) => {
    await assetService.deleteAsset(id);
    return id;
  }
);

// Slice
const assetsSlice = createSlice({
  name: 'assets',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<AssetFilters>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    selectAsset: (state, action: PayloadAction<Asset | null>) => {
      state.selectedAsset = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Fetch assets
    builder
      .addCase(fetchAssets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = {
          page: action.payload.meta.page,
          limit: action.payload.meta.limit,
          total: action.payload.meta.total
        };
      })
      .addCase(fetchAssets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch assets';
      });

    // Fetch single asset
    builder
      .addCase(fetchAssetById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAssetById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAsset = action.payload;
      })
      .addCase(fetchAssetById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch asset';
      });

    // Upload asset
    builder
      .addCase(uploadAsset.pending, (state) => {
        state.loading = true;
        state.uploadProgress = 0;
      })
      .addCase(uploadAsset.fulfilled, (state, action) => {
        state.loading = false;
        state.uploadProgress = 100;
        state.items.unshift(action.payload);
      })
      .addCase(uploadAsset.rejected, (state, action) => {
        state.loading = false;
        state.uploadProgress = 0;
        state.error = action.error.message || 'Failed to upload asset';
      });

    // Update asset
    builder
      .addCase(updateAsset.fulfilled, (state, action) => {
        const index = state.items.findIndex(a => a.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedAsset?.id === action.payload.id) {
          state.selectedAsset = action.payload;
        }
      });

    // Delete asset
    builder
      .addCase(deleteAsset.fulfilled, (state, action) => {
        state.items = state.items.filter(a => a.id !== action.payload);
        if (state.selectedAsset?.id === action.payload) {
          state.selectedAsset = null;
        }
      });
  }
});

export const {
  setFilters,
  setPage,
  selectAsset,
  setUploadProgress,
  clearError
} = assetsSlice.actions;

export default assetsSlice.reducer;
```

### Custom Hooks

```typescript
// frontend/src/hooks/useAssets.ts
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './redux';
import { fetchAssets, setFilters } from '../store/slices/assets.slice';
import type { AssetFilters } from '../types';

export const useAssets = (initialFilters?: Partial<AssetFilters>) => {
  const dispatch = useAppDispatch();
  const { items, loading, error, filters, pagination } = useAppSelector(
    state => state.assets
  );

  useEffect(() => {
    if (initialFilters) {
      dispatch(setFilters(initialFilters));
    }
  }, []);

  useEffect(() => {
    dispatch(fetchAssets(filters));
  }, [filters, pagination.page, dispatch]);

  const refetch = () => {
    dispatch(fetchAssets(filters));
  };

  return {
    assets: items,
    loading,
    error,
    filters,
    pagination,
    refetch
  };
};

// frontend/src/hooks/useArCoAutocomplete.ts
import { useState, useEffect } from 'react';
import { arcoService } from '../services/arco.service';
import type { ArCoCat, ArCoTerm } from '../types';

export const useArCoAutocomplete = (category: ArCoCat, query: string) => {
  const [suggestions, setSuggestions] = useState<ArCoTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const results = await arcoService.searchTerms(category, query);
        setSuggestions(results);
      } catch (err) {
        setError('Failed to fetch suggestions');
        console.error('ArCo autocomplete error:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [category, query]);

  return { suggestions, loading, error };
};
```

### Component Example: ArCo Tag Selector

```typescript
// frontend/src/components/organisms/ArCoTagSelector/ArCoTagSelector.tsx
import React, { useState } from 'react';
import { useArCoAutocomplete } from '../../../hooks/useArCoAutocomplete';
import type { ArCoCat, ArCoTerm } from '../../../types';
import './ArCoTagSelector.css';

interface ArCoTagSelectorProps {
  category: ArCoCat;
  selectedTags: ArCoTerm[];
  onTagsChange: (tags: ArCoTerm[]) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ArCoTagSelector: React.FC<ArCoTagSelectorProps> = ({
  category,
  selectedTags,
  onTagsChange,
  label,
  required = false,
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading } = useArCoAutocomplete(category, query);

  const handleAddTag = (term: ArCoTerm) => {
    if (!selectedTags.find(t => t.uri === term.uri)) {
      onTagsChange([...selectedTags, term]);
    }
    setQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveTag = (uri: string) => {
    onTagsChange(selectedTags.filter(t => t.uri !== uri));
  };

  return (
    <div className="arco-tag-selector">
      {label && (
        <label className="arco-tag-selector__label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}

      {/* Selected Tags */}
      <div className="arco-tag-selector__selected">
        {selectedTags.map(tag => (
          <span key={tag.uri} className="tag-pill">
            {tag.label}
            {tag.notation && (
              <span className="tag-pill__notation">{tag.notation}</span>
            )}
            {!disabled && (
              <button
                type="button"
                className="tag-pill__remove"
                onClick={() => handleRemoveTag(tag.uri)}
                aria-label={`Remove ${tag.label}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>

      {/* Autocomplete Input */}
      {!disabled && (
        <div className="arco-tag-selector__input-wrapper">
          <input
            type="text"
            className="arco-tag-selector__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={`Cerca termini ArCo per ${getCategoryLabel(category)}...`}
          />

          {loading && (
            <span className="arco-tag-selector__spinner">⟳</span>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="arco-tag-selector__suggestions">
              {suggestions.map(term => (
                <li
                  key={term.uri}
                  className="arco-tag-selector__suggestion"
                  onClick={() => handleAddTag(term)}
                >
                  <div className="suggestion__main">
                    <strong>{term.label}</strong>
                    {term.notation && (
                      <span className="suggestion__notation">
                        {term.notation}
                      </span>
                    )}
                  </div>
                  {term.definition && (
                    <p className="suggestion__definition">
                      {term.definition.slice(0, 100)}
                      {term.definition.length > 100 && '...'}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const getCategoryLabel = (category: ArCoCat): string => {
  const labels: Record<ArCoCat, string> = {
    CULTURAL_PROPERTY_TYPE: 'Tipo di Bene Culturale',
    MATERIAL: 'Materiali',
    TECHNIQUE: 'Tecnica',
    SUBJECT: 'Soggetto',
    AUTHOR: 'Autore',
    CHRONOLOGY: 'Cronologia',
    LOCATION: 'Localizzazione',
    CONSERVATION_STATUS: 'Stato di Conservazione'
  };
  return labels[category];
};
```

---

## 12. MCP Server Integration

### Communication Architecture

```
DAM Backend  →  HTTP/REST  →  MCP Server  →  Graph API  →  SharePoint
     ↓              ↑
  Job Queue    Status Polling
```

### MCP Server API Contract

#### 1. Scan Library

```http
POST /api/scan-library
Authorization: Bearer {MCP_API_KEY}
Content-Type: application/json

{
  "libraryUrl": "https://tenant.sharepoint.com/sites/DAM/Shared%20Documents",
  "includeSubfolders": true,
  "options": {
    "extractExif": true,
    "calculateHashes": true
  }
}

Response 202 Accepted:
{
  "success": true,
  "data": {
    "operationId": "scan-20241114-123456",
    "status": "RUNNING",
    "startedAt": "2024-11-14T12:34:56Z",
    "estimatedDuration": 300
  }
}
```

#### 2. Detect Duplicates

```http
POST /api/detect-duplicates
Authorization: Bearer {MCP_API_KEY}

{
  "libraryUrl": "https://tenant.sharepoint.com/sites/DAM/Shared%20Documents",
  "algorithm": "sha256",
  "threshold": 1.0
}

Response 202 Accepted:
{
  "success": true,
  "data": {
    "operationId": "dup-20241114-123500",
    "status": "RUNNING"
  }
}
```

#### 3. Get Operation Status

```http
GET /api/operations/{operationId}
Authorization: Bearer {MCP_API_KEY}

Response 200 OK:
{
  "success": true,
  "data": {
    "operationId": "scan-20241114-123456",
    "status": "RUNNING",  // PENDING, RUNNING, COMPLETED, FAILED
    "progress": 45,
    "totalFiles": 1250,
    "processedFiles": 563,
    "startedAt": "2024-11-14T12:34:56Z",
    "estimatedCompletion": "2024-11-14T12:45:00Z",
    "logs": [
      "Scanning folder: /2024",
      "Found 563 files",
      "Progress: 45%"
    ]
  }
}
```

#### 4. Reorganize Structure

```http
POST /api/reorganize
Authorization: Bearer {MCP_API_KEY}

{
  "libraryUrl": "https://tenant.sharepoint.com/sites/DAM/Shared%20Documents",
  "strategy": "BY_ARCO_TYPE",
  "maxDepth": 3,
  "preserveMetadata": true,
  "dryRun": false
}

Response 202 Accepted:
{
  "success": true,
  "data": {
    "operationId": "reorg-20241114-123600",
    "status": "PENDING"
  }
}
```

### MCP Client Service (DAM Backend)

```typescript
// backend/src/services/mcp-client.service.ts
import axios, { AxiosInstance } from 'axios';

export class McpClientService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.MCP_SERVER_URL,
      headers: {
        'Authorization': `Bearer ${process.env.MCP_SERVER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  async scanLibrary(libraryUrl: string): Promise<McpOperation> {
    const response = await this.client.post('/api/scan-library', {
      libraryUrl,
      includeSubfolders: true,
      options: {
        extractExif: true,
        calculateHashes: true
      }
    });

    return response.data.data;
  }

  async detectDuplicates(libraryUrl: string): Promise<McpOperation> {
    const response = await this.client.post('/api/detect-duplicates', {
      libraryUrl,
      algorithm: 'sha256',
      threshold: 1.0
    });

    return response.data.data;
  }

  async reorganizeStructure(
    libraryUrl: string,
    strategy: ReorganizationStrategy,
    options: ReorganizationOptions
  ): Promise<McpOperation> {
    const response = await this.client.post('/api/reorganize', {
      libraryUrl,
      strategy,
      maxDepth: options.maxDepth || 3,
      preserveMetadata: options.preserveMetadata !== false,
      dryRun: options.dryRun || false
    });

    return response.data.data;
  }

  async getOperationStatus(operationId: string): Promise<McpOperationStatus> {
    const response = await this.client.get(`/api/operations/${operationId}`);
    return response.data.data;
  }

  // Poll operation until completion
  async waitForOperation(
    operationId: string,
    onProgress?: (status: McpOperationStatus) => void,
    pollInterval: number = 2000
  ): Promise<McpOperationStatus> {
    while (true) {
      const status = await this.getOperationStatus(operationId);

      if (onProgress) {
        onProgress(status);
      }

      if (status.status === 'COMPLETED' || status.status === 'FAILED') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

// Types
export interface McpOperation {
  operationId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  estimatedDuration?: number;
}

export interface McpOperationStatus extends McpOperation {
  progress: number;
  totalFiles?: number;
  processedFiles?: number;
  estimatedCompletion?: string;
  logs: string[];
  result?: any;
  error?: string;
}

export type ReorganizationStrategy =
  | 'BY_ARCO_TYPE'
  | 'BY_DATE'
  | 'BY_CREATOR'
  | 'BY_COLLECTION';

export interface ReorganizationOptions {
  maxDepth?: number;
  preserveMetadata?: boolean;
  dryRun?: boolean;
}
```

### Background Job Integration

```typescript
// backend/src/services/mcp-job.service.ts
import Bull from 'bull';

export class McpJobService {
  private queue: Bull.Queue;

  constructor(
    private mcpClient: McpClientService,
    private notificationService: NotificationService
  ) {
    this.queue = new Bull('mcp-operations', {
      redis: process.env.REDIS_URL
    });

    this.setupProcessors();
  }

  private setupProcessors() {
    this.queue.process('scan-library', async (job) => {
      const { libraryUrl, userId } = job.data;

      try {
        job.log('Starting library scan...');

        // Start MCP operation
        const operation = await this.mcpClient.scanLibrary(libraryUrl);

        job.log(`Operation started: ${operation.operationId}`);

        // Wait for completion with progress updates
        const result = await this.mcpClient.waitForOperation(
          operation.operationId,
          (status) => {
            job.progress(status.progress);
            job.log(`Progress: ${status.progress}% - ${status.processedFiles}/${status.totalFiles} files`);
          }
        );

        if (result.status === 'FAILED') {
          throw new Error(result.error || 'Operation failed');
        }

        job.log('Library scan completed successfully');

        // Notify user
        await this.notificationService.sendEmail(userId, {
          subject: 'Library Scan Completed',
          body: `Scan completed successfully. ${result.totalFiles} files processed.`
        });

        return result;
      } catch (error) {
        job.log(`Error: ${error.message}`);

        await this.notificationService.sendEmail(userId, {
          subject: 'Library Scan Failed',
          body: `Scan failed: ${error.message}`
        });

        throw error;
      }
    });
  }

  async queueScanLibrary(libraryUrl: string, userId: string): Promise<string> {
    const job = await this.queue.add('scan-library', {
      libraryUrl,
      userId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      },
      removeOnComplete: false
    });

    return job.id.toString();
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      throw new NotFoundError('Job', jobId);
    }

    return {
      id: job.id.toString(),
      state: await job.getState(),
      progress: job.progress(),
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      logs: (await this.queue.getJobLogs(jobId)).logs
    };
  }
}
```

---

## 13. ArCo Integration Strategy

### ArCo Overview

**ArCo (Architecture of Knowledge)** è il knowledge graph del patrimonio culturale italiano:

- **13 ontologie interconnesse** (v2.0)
- **169 milioni di triple RDF**
- **800,000+ schede catalografiche** dal Catalogo Generale ICCD-MIC
- **30 tipologie di beni culturali**
- **SPARQL endpoint pubblico**: https://dati.beniculturali.it/sparql

### Vocabulary Categories

```typescript
export enum ArCoCat {
  CULTURAL_PROPERTY_TYPE = 'cultural-property-type',  // Tipo di bene
  MATERIAL = 'material',                               // Materiali
  TECHNIQUE = 'technique',                             // Tecnica esecutiva
  SUBJECT = 'subject',                                 // Soggetto/iconografia
  AUTHOR = 'author',                                   // Autore/attribuzione
  CHRONOLOGY = 'chronology',                           // Cronologia/datazione
  LOCATION = 'location',                               // Localizzazione geografica
  CONSERVATION_STATUS = 'conservation-status'          // Stato di conservazione
}
```

### ArCo Vocabulary Synchronization

```typescript
// backend/src/services/arco-sync.service.ts
import { SparqlClient } from 'sparql-http-client';

export class ArcoSyncService {
  private sparqlClient: SparqlClient;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis,
    private logger: Logger
  ) {
    this.sparqlClient = new SparqlClient({
      endpointUrl: process.env.ARCO_SPARQL_ENDPOINT!
    });
  }

  async syncVocabulary(category: ArCoCat): Promise<number> {
    this.logger.info(`Starting vocabulary sync for ${category}`);

    const query = this.buildSyncQuery(category);
    let count = 0;

    try {
      const stream = await this.sparqlClient.query.select(query);

      for await (const row of stream) {
        const term: ArCoVocabularyCache = {
          uri: row.uri.value,
          category,
          label: row.label.value,
          definition: row.definition?.value,
          notation: row.notation?.value,
          broader: row.broader ? [row.broader.value] : [],
          narrower: [],
          related: [],
          altLabels: row.altLabel ? [row.altLabel.value] : []
        };

        // Upsert to database
        await this.prisma.arCoVocabularyCache.upsert({
          where: { uri: term.uri },
          update: {
            ...term,
            lastSync: new Date()
          },
          create: term
        });

        // Cache in Redis (1 week TTL)
        await this.redis.setex(
          `arco:term:${term.uri}`,
          604800,
          JSON.stringify(term)
        );

        count++;

        if (count % 100 === 0) {
          this.logger.info(`Synced ${count} terms for ${category}`);
        }
      }

      this.logger.info(`Completed sync for ${category}: ${count} terms`);
      return count;

    } catch (error) {
      this.logger.error(`Failed to sync ${category}:`, error);
      throw error;
    }
  }

  private buildSyncQuery(category: ArCoCat): string {
    const ontologyClass = this.getOntologyClass(category);

    return `
      PREFIX arco: <https://w3id.org/arco/ontology/>
      PREFIX arco-dd: <https://w3id.org/arco/ontology/denotative-description/>
      PREFIX arco-cd: <https://w3id.org/arco/ontology/context-description/>
      PREFIX arco-location: <https://w3id.org/arco/ontology/location/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?definition ?notation ?broader ?altLabel
      WHERE {
        ?uri a ${ontologyClass} ;
             skos:prefLabel ?label .

        OPTIONAL { ?uri skos:definition ?definition }
        OPTIONAL { ?uri skos:notation ?notation }
        OPTIONAL { ?uri skos:broader ?broader }
        OPTIONAL { ?uri skos:altLabel ?altLabel }

        FILTER (LANG(?label) = "it" || LANG(?label) = "")
        FILTER (!isBlank(?uri))
      }
      ORDER BY ?label
      LIMIT 1000
    `;
  }

  private getOntologyClass(category: ArCoCat): string {
    const mapping: Record<ArCoCat, string> = {
      [ArCoCat.CULTURAL_PROPERTY_TYPE]: 'arco-dd:CulturalPropertyDefinition',
      [ArCoCat.MATERIAL]: 'arco-dd:Material',
      [ArCoCat.TECHNIQUE]: 'arco-dd:TechnicalCharacteristic',
      [ArCoCat.SUBJECT]: 'arco-cd:Subject',
      [ArCoCat.AUTHOR]: 'arco-cd:Author',
      [ArCoCat.CHRONOLOGY]: 'arco-cd:Dating',
      [ArCoCat.LOCATION]: 'arco-location:GeographicLocation',
      [ArCoCat.CONSERVATION_STATUS]: 'arco-dd:ConservationStatus'
    };

    return mapping[category];
  }

  // Scheduled sync (weekly via cron job)
  async scheduledSync(): Promise<void> {
    this.logger.info('Starting scheduled ArCo vocabulary sync...');

    const categories = Object.values(ArCoCat);
    const results: Record<string, number> = {};

    for (const category of categories) {
      try {
        const count = await this.syncVocabulary(category);
        results[category] = count;
      } catch (error) {
        this.logger.error(`Failed to sync ${category}:`, error);
        results[category] = 0;
      }
    }

    this.logger.info('ArCo vocabulary sync completed:', results);
  }
}
```

### SPARQL Query Library

```typescript
// backend/src/services/arco-query.service.ts

export class ArcoQueryService {
  // Search terms by label
  static searchTermsByLabel(category: ArCoCat, query: string): string {
    const ontologyClass = this.getOntologyClass(category);

    return `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?uri ?label ?definition ?notation
      WHERE {
        ?uri a ${ontologyClass} ;
             skos:prefLabel ?label .

        OPTIONAL { ?uri skos:definition ?definition }
        OPTIONAL { ?uri skos:notation ?notation }

        FILTER (
          REGEX(?label, "${query}", "i") &&
          (LANG(?label) = "it" || LANG(?label) = "")
        )
      }
      ORDER BY ?label
      LIMIT 20
    `;
  }

  // Get term hierarchy (broader/narrower)
  static getTermHierarchy(uri: string): string {
    return `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT ?broader ?narrower ?related ?altLabel
      WHERE {
        <${uri}> skos:broader* ?broader .
        OPTIONAL { <${uri}> skos:narrower ?narrower }
        OPTIONAL { <${uri}> skos:related ?related }
        OPTIONAL { <${uri}> skos:altLabel ?altLabel }
      }
    `;
  }

  // Find materials commonly used with specific cultural property type
  static findMaterialsForType(typeUri: string): string {
    return `
      PREFIX arco: <https://w3id.org/arco/ontology/>
      PREFIX arco-dd: <https://w3id.org/arco/ontology/denotative-description/>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

      SELECT DISTINCT ?material ?materialLabel (COUNT(?cp) as ?usage)
      WHERE {
        ?cp a <${typeUri}> ;
            arco-dd:hasMaterial ?material .

        ?material skos:prefLabel ?materialLabel .

        FILTER (LANG(?materialLabel) = "it")
      }
      GROUP BY ?material ?materialLabel
      ORDER BY DESC(?usage)
      LIMIT 50
    `;
  }

  private static getOntologyClass(category: ArCoCat): string {
    // Same mapping as in ArcoSyncService
    const mapping: Record<ArCoCat, string> = {
      [ArCoCat.CULTURAL_PROPERTY_TYPE]: 'arco-dd:CulturalPropertyDefinition',
      [ArCoCat.MATERIAL]: 'arco-dd:Material',
      [ArCoCat.TECHNIQUE]: 'arco-dd:TechnicalCharacteristic',
      [ArCoCat.SUBJECT]: 'arco-cd:Subject',
      [ArCoCat.AUTHOR]: 'arco-cd:Author',
      [ArCoCat.CHRONOLOGY]: 'arco-cd:Dating',
      [ArCoCat.LOCATION]: 'arco-location:GeographicLocation',
      [ArCoCat.CONSERVATION_STATUS]: 'arco-dd:ConservationStatus'
    };

    return mapping[category];
  }
}
```

### Semantic Search Enhancement

```typescript
// backend/src/services/semantic-search.service.ts

export class SemanticSearchService {
  constructor(
    private arcoService: ArcoService,
    private elasticsearchClient: Client
  ) {}

  async search(
    query: string,
    filters: SearchFilters
  ): Promise<SearchResult[]> {
    // 1. Expand query with ArCo semantics
    const expandedTerms = await this.expandQueryTerms(query);

    // 2. Build Elasticsearch query with semantic expansion
    const esQuery = {
      bool: {
        should: [
          // Original query (highest weight)
          {
            multi_match: {
              query,
              fields: ['title^3', 'description^2', 'tags'],
              boost: 5
            }
          },
          // Expanded terms (medium weight)
          ...expandedTerms.map(term => ({
            multi_match: {
              query: term.label,
              fields: ['title^2', 'description', 'tags'],
              boost: 2
            }
          })),
          // ArCo URI exact matches (exact match bonus)
          {
            terms: {
              'arcoTags.arcoUri': expandedTerms.map(t => t.uri),
              boost: 10
            }
          }
        ],
        filter: this.buildFilters(filters),
        minimum_should_match: 1
      }
    };

    const response = await this.elasticsearchClient.search({
      index: 'assets',
      body: {
        query: esQuery,
        size: filters.limit || 20,
        from: filters.offset || 0,
        sort: [{ _score: 'desc' }, { createdAt: 'desc' }]
      }
    });

    return response.body.hits.hits.map(hit => ({
      ...hit._source,
      _score: hit._score
    }));
  }

  private async expandQueryTerms(query: string): Promise<ArCoTerm[]> {
    // Search ArCo for matching terms
    const matches = await this.arcoService.searchAllCategories(query);

    const expanded: ArCoTerm[] = [];
    const seenUris = new Set<string>();

    for (const term of matches) {
      if (seenUris.has(term.uri)) continue;

      expanded.push(term);
      seenUris.add(term.uri);

      // Add broader terms for generalization
      if (term.broader && term.broader.length > 0) {
        for (const broaderUri of term.broader.slice(0, 2)) { // Limit to 2
          if (seenUris.has(broaderUri)) continue;

          const broaderTerm = await this.arcoService.getTerm(broaderUri);
          if (broaderTerm) {
            expanded.push(broaderTerm);
            seenUris.add(broaderUri);
          }
        }
      }

      // Add narrower terms for specialization
      if (term.narrower && term.narrower.length > 0) {
        for (const narrowerUri of term.narrower.slice(0, 3)) { // Limit to 3
          if (seenUris.has(narrowerUri)) continue;

          const narrowerTerm = await this.arcoService.getTerm(narrowerUri);
          if (narrowerTerm) {
            expanded.push(narrowerTerm);
            seenUris.add(narrowerUri);
          }
        }
      }
    }

    return expanded;
  }

  private buildFilters(filters: SearchFilters): any[] {
    const must: any[] = [];

    if (filters.status) {
      must.push({ term: { status: filters.status } });
    }

    if (filters.arcoTypes && filters.arcoTypes.length > 0) {
      must.push({
        terms: { 'arcoTags.arcoUri': filters.arcoTypes }
      });
    }

    if (filters.dateFrom || filters.dateTo) {
      const range: any = {};
      if (filters.dateFrom) range.gte = filters.dateFrom;
      if (filters.dateTo) range.lte = filters.dateTo;
      must.push({ range: { createdAt: range } });
    }

    return must;
  }
}
```

---

## 14. Multi-Session Development Guidelines

### Session Handoff Protocol

**At Session Start (First 5 minutes):**

1. ✅ Read `DAM-Master-Implementation-Guide-Part1.md`
2. ✅ Read `DAM-Master-Implementation-Guide-Part2.md` (this document)
3. ✅ Read `DAM-Master-Implementation-Guide-Part3.md`
4. ✅ Check `CURRENT_STATUS.md` for latest progress
5. ✅ Review relevant phase specs (e.g., `DAM-Phase1-MVP-Specs.md`)
6. ✅ Check `CHANGELOG.md` for recent changes

**During Development:**

1. ✅ Update `CURRENT_STATUS.md` regularly (every major milestone)
2. ✅ Document architectural decisions in `ADR/` folder
3. ✅ Add entries to `CHANGELOG.md` for significant changes
4. ✅ Update spec documents if requirements evolve
5. ✅ Commit frequently with descriptive messages

**At Session End (Last 10 minutes):**

1. ✅ Update `CURRENT_STATUS.md` with:
   - Completed tasks
   - In-progress tasks (with full context)
   - Blockers/issues encountered
   - Next steps (prioritized)
2. ✅ Commit all changes with clear messages
3. ✅ Push to feature branch
4. ✅ Leave session notes if needed

### CURRENT_STATUS.md Template

```markdown
# Current Development Status

**Last Updated:** 2024-11-14 15:30 UTC  
**Updated By:** Claude Code Session #42  
**Current Phase:** Phase 1 MVP  
**Feature Branch:** `feature/asset-upload-component`

## Completed Today ✅

- [x] Implemented AssetUploadModal component with drag-drop
- [x] Added file validation (size, type, EXIF extraction)
- [x] Integrated with Redux store (upload action)
- [x] Unit tests written (85% coverage)
- [x] Updated API service for multipart upload

## In Progress 🔄

### ArCo Tag Selector Integration
- **Context**: Adding ArCo tagging UI to upload modal
- **Files**: `src/components/organisms/ArCoTagSelector/ArCoTagSelector.tsx`
- **Status**: Component structure complete, working on autocomplete integration
- **Blockers**: None
- **Next**: Wire up to ArCo service API calls

### EXIF Metadata Display
- **Context**: Showing extracted EXIF data in upload preview
- **Files**: `src/components/molecules/ExifMetadataDisplay/`
- **Status**: 40% complete - basic display working
- **Blockers**: Need to handle HEIC format (iOS photos)
- **Next**: Research sharp library HEIC support or alternative

## Blocked ⚠️

### SharePoint Upload Permissions
- **Issue**: Backend receiving 403 from SharePoint Graph API
- **Root Cause**: Service Principal missing `Files.ReadWrite.All` permission
- **Ticket**: #123
- **Workaround**: Using mock API responses in development
- **Required Action**: Admin needs to grant permission in Azure AD
- **ETA**: Waiting on IT department

## Next Steps (Priority Order) 📋

1. **HIGH**: Complete ArCo tag selector autocomplete integration
   - Estimated: 2 hours
   - Dependencies: None
2. **HIGH**: Research HEIC format support
   - Estimated: 1 hour
   - Dependencies: None
3. **MEDIUM**: Implement upload progress bar for large files
   - Estimated: 3 hours
   - Dependencies: Backend chunked upload support
4. **MEDIUM**: Add validation error messages UI
   - Estimated: 1 hour
   - Dependencies: None
5. **LOW**: Integration tests for upload flow
   - Estimated: 2 hours
   - Dependencies: SharePoint permissions resolved

## Technical Debt & Notes 📝

- **Performance**: Upload of 100MB+ files is slow - consider chunked upload
- **UX**: Discuss with product team: should ArCo tagging be required or optional during upload?
- **Testing**: Need to add E2E tests for complete upload flow once SharePoint access is fixed
- **Documentation**: Update API docs with new upload endpoint parameters

## Environment Info 🔧

- Node version: 20.10.0
- npm version: 10.2.3
- Database: PostgreSQL 14.10 on localhost
- Redis: 7.2.3 on localhost
- Backend running: http://localhost:3000
- Frontend running: http://localhost:3001
- MCP Server: http://localhost:3001 (not actively used today)

## Files Modified Today 📄

```
frontend/src/
├── components/
│   ├── organisms/AssetUploadModal/
│   │   ├── AssetUploadModal.tsx [CREATED]
│   │   ├── AssetUploadModal.test.tsx [CREATED]
│   │   └── AssetUploadModal.css [CREATED]
│   └── molecules/ExifMetadataDisplay/
│       └── ExifMetadataDisplay.tsx [IN PROGRESS]
├── services/
│   └── asset.service.ts [MODIFIED - added uploadAsset method]
└── store/slices/
    └── assets.slice.ts [MODIFIED - added upload action]

backend/src/
├── controllers/
│   └── asset.controller.ts [MODIFIED - uploadAsset endpoint]
└── services/
    └── asset.service.ts [MODIFIED - EXIF extraction logic]
```

## Questions for Next Session ❓

1. Should we implement client-side image compression before upload?
2. What's the max file size we want to support? (currently 100MB)
3. Do we need virus scanning integration? (mentioned in specs)
```

### Code Documentation Standards

**File Header Template:**

```typescript
/**
 * @file asset.service.ts
 * @description Service for managing digital asset operations including
 *              upload, metadata extraction, SharePoint integration, and
 *              ArCo tagging.
 * 
 * @author Claude Code Session 2024-11-14
 * @lastModified 2024-11-14
 * 
 * @dependencies
 *   - @microsoft/microsoft-graph-client - SharePoint API client
 *   - sharp - Image processing and EXIF extraction
 *   - prisma - Database ORM
 * 
 * @relatedFiles
 *   - asset.repository.ts - Data access layer
 *   - sharepoint.service.ts - SharePoint integration
 *   - arco.service.ts - ArCo vocabulary integration
 */
```

**Function Documentation Template:**

```typescript
/**
 * Uploads an asset file to SharePoint and stores metadata in database.
 * 
 * This method performs the following operations:
 * 1. Validates file size and MIME type
 * 2. Uploads file buffer to SharePoint via Graph API
 * 3. Extracts EXIF metadata using sharp library
 * 4. Saves asset metadata to PostgreSQL
 * 5. Indexes asset in Elasticsearch for search
 * 6. Creates audit log entry
 * 
 * @param file - Express multer file object containing buffer and metadata
 * @param metadata - Asset metadata from request body (title, description, etc.)
 * @param userId - UUID of the authenticated user performing the upload
 * 
 * @returns Promise<Asset> - The created asset object with generated ID,
 *                           SharePoint URL, and extracted EXIF data
 * 
 * @throws {ValidationError} If file size exceeds 100MB or MIME type is invalid
 * @throws {SharePointError} If SharePoint upload fails after 3 retry attempts
 * @throws {DatabaseError} If database insert fails due to constraint violation
 * 
 * @example
 * ```typescript
 * const asset = await assetService.uploadAsset(
 *   req.file,
 *   { title: 'Mona Lisa', description: 'Famous Renaissance painting' },
 *   'user-uuid-123'
 * );
 * console.log(`Asset created with ID: ${asset.id}`);
 * ```
 * 
 * @see {@link SharepointService.uploadFile} for SharePoint integration details
 * @see {@link AssetRepository.create} for database persistence
 * 
 * @remarks
 * - Large files (>10MB) show upload progress via job queue
 * - EXIF extraction may fail for non-image files (handled gracefully)
 * - Elasticsearch indexing happens asynchronously
 * 
 * @since 1.0.0
 */
async uploadAsset(
  file: Express.Multer.File,
  metadata: CreateAssetDto,
  userId: string
): Promise<Asset> {
  // Implementation
}
```

### Architectural Decision Records (ADR)

**ADR Template:**

```markdown
# ADR-XXX: [Short Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded by ADR-YYY]  
**Date:** YYYY-MM-DD  
**Authors:** [Names]  
**Deciders:** [Names]  
**Technical Story:** [Ticket/Issue Reference]

## Context

[Describe the issue, constraint, or requirement that motivated this decision.
Include relevant background information, current situation, and why a
decision is needed now.]

## Decision

[State the decision clearly and concisely. Use active voice.
Example: "We will use PostgreSQL as the primary database."]

## Rationale

[Explain why this decision was made. Include:]
- Key factors that influenced the decision
- Trade-offs considered
- Technical/business requirements addressed
- Comparison with alternatives

## Consequences

### Positive

- [Positive consequence 1]
- [Positive consequence 2]

### Negative

- [Negative consequence 1 / Trade-off]
- [Negative consequence 2 / Limitation]

### Neutral

- [Neutral impact 1]

## Alternatives Considered

### Alternative 1: [Name]

**Description:** [Brief description]

**Pros:**
- [Pro 1]
- [Pro 2]

**Cons:**
- [Con 1]
- [Con 2]

**Reason for rejection:** [Why this wasn't chosen]

### Alternative 2: [Name]

[Same structure as Alternative 1]

## Implementation Notes

[Specific technical details about implementing this decision:]
- Configuration requirements
- Migration strategy (if applicable)
- Team training needs
- Timeline estimates

## Validation

[How will we know if this decision was correct?]
- Metrics to track
- Success criteria
- Review date

## Related Decisions

- [ADR-XXX: Related decision title]
- [ADR-YYY: Another related decision]

## References

- [Link to research/documentation]
- [Link to discussion/meeting notes]
- [Link to proof of concept]
```

### Git Commit Convention

**Format:** `<type>(<scope>): <subject>`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(assets): add ArCo tag selector component
fix(auth): resolve token expiration handling
docs(api): update OpenAPI specs for upload endpoint
refactor(search): extract semantic search to separate service
test(assets): add unit tests for upload validation
```

---

## Next Steps

Continue with **Part 3** of the Master Implementation Guide for:
- Security & Compliance (Section 15)
- Performance & Scalability (Section 16)
- Testing Strategy (Section 17)
- Deployment & DevOps (Section 18)
- Monitoring & Observability (Section 19)
- Documentation Standards (Section 20)

---

**Document Version:** 2.0  
**Part:** 2 of 3  
**Last Updated:** November 14, 2024  
**Next Review:** February 14, 2025
