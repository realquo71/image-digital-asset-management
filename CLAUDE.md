# CLAUDE.md - AI Assistant Guide

**Project:** Cultural Heritage Digital Asset Management System
**Last Updated:** November 14, 2024
**Repository:** image-digital-asset-management
**Status:** Specification Phase → Implementation Starting

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Repository State](#2-current-repository-state)
3. [Architecture & Technology Stack](#3-architecture--technology-stack)
4. [Development Workflow](#4-development-workflow)
5. [Key Conventions](#5-key-conventions)
6. [Implementation Phases](#6-implementation-phases)
7. [ArCo Integration Specifics](#7-arco-integration-specifics)
8. [Common Tasks & Patterns](#8-common-tasks--patterns)
9. [Testing Strategy](#9-testing-strategy)
10. [Security & Compliance](#10-security--compliance)
11. [Useful Commands](#11-useful-commands)
12. [Important Files & Directories](#12-important-files--directories)

---

## 1. Project Overview

### What This Is

A specialized **Digital Asset Management (DAM) system** for Italian cultural heritage institutions that:

- Manages digital assets (images, documents, 3D models of cultural artifacts)
- Integrates with **SharePoint Online** for binary storage
- Uses **ArCo ontologies** (Architecture of Knowledge) for semantic tagging
- Complies with Italian **ICCD standards** for cultural heritage cataloging
- Provides enterprise-grade search, collections, and workflow management

### Key Differentiators

1. **ArCo Integration**: Native integration with Italy's 169M triple RDF cultural heritage ontology
2. **ICCD Compliance**: Export catalog sheets conforming to ministerial standards
3. **SharePoint Backend**: Leverages existing Microsoft infrastructure in cultural institutions
4. **Linked Open Data**: Publishes data in LOD format for national interoperability

### Strategic Goals

- **Efficiency**: Reduce manual cataloging time by 60%
- **Quality**: 95%+ ICCD standard compliance
- **Performance**: <2s page load, <500ms API response (p95)
- **Scale**: Support 10M+ assets per installation
- **Availability**: 99.5% uptime with automated backup

---

## 2. Current Repository State

### What Exists Now

This repository currently contains **only specification documents**:

```
.
├── DAM-Phase1-MVP-Specs-Part1.md          # MVP requirements (25 core features)
├── DAM-Phase1-MVP-Specs-Part2.md          # Frontend components, backend services
├── DAM-Master-Implementation-Guide-Part1.md  # Architecture, tech stack, setup
├── DAM-Master-Implementation-Guide-Part2.md  # Database, auth, API, ArCo
├── DAM-Master-Implementation-Guide-Part3.md  # Security, testing, deployment
├── DAM-ArCo-Integration-Guide.md          # ArCo-specific integration details
└── CLAUDE.md                              # This file
```

### What Needs to Be Built

**Everything.** This is a greenfield project ready for implementation:

- [ ] Backend Node.js/Express API
- [ ] Frontend React application
- [ ] Database schema (PostgreSQL via Prisma)
- [ ] MCP Server microservice (separate repo)
- [ ] ArCo vocabulary cache
- [ ] Authentication (Azure AD)
- [ ] SharePoint integration
- [ ] Search (Elasticsearch)
- [ ] Testing suite
- [ ] Deployment infrastructure

### Repository Strategy

**Two separate repositories** (ADR-001):

1. **`cultural-heritage-dam`** (this repo) - Main DAM application
   - Frontend (React 18)
   - Backend API (Node.js + Express + TypeScript)
   - Database (PostgreSQL + Prisma)
   - MCP Client (consumes remote MCP server)

2. **`cultural-heritage-mcp`** (separate repo) - MCP microservice
   - MCP Server (SharePoint operations)
   - Image processing tools
   - Deduplication service
   - Local SQLite database

**Communication**: DAM Backend ↔ HTTP/REST ↔ MCP Server ↔ Graph API ↔ SharePoint

---

## 3. Architecture & Technology Stack

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React 18 + Redux Toolkit + TypeScript)          │
└─────────────────┬───────────────────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────────────────┐
│  Backend API (Node.js + Express + TypeScript)               │
│  - Asset Service, ArCo Service, Search Service              │
│  - MCP Client (calls remote MCP server)                     │
└────┬──────┬──────┬──────┬─────────────────┬────────────────┘
     │      │      │      │                 │
     v      v      v      v                 v
  PostgreSQL Redis  ES   SharePoint    MCP Server (separate repo)
  (metadata) (cache)(search)(binaries)  (operations)
                                            │
                                            v
                                     ArCo SPARQL Endpoint
                                     (external - dati.beniculturali.it)
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.2+ | UI framework |
| | Redux Toolkit | 2.0+ | State management |
| | TypeScript | 5.3+ | Type safety |
| | React Router | 6.x | Navigation |
| | Metronic Theme | 8.x | Professional UI |
| **Backend** | Node.js | 20 LTS | Runtime |
| | Express.js | 4.18+ | REST API |
| | TypeScript | 5.3+ | Type safety |
| | Prisma | 5.x | ORM + migrations |
| | Passport.js | 0.7+ | Azure AD auth |
| | Sharp | 0.33+ | Image processing |
| | Bull | 4.x | Job queue |
| **Database** | PostgreSQL | 14+ | Primary data store |
| | Redis | 7+ | Cache + queue |
| | Elasticsearch | 8.x | Full-text search |
| **Storage** | SharePoint Online | Latest | Binary assets |
| **External** | Azure AD | - | Authentication |
| | Microsoft Graph API | - | SharePoint access |
| | ArCo SPARQL | - | Vocabulary queries |

### Why These Choices?

- **PostgreSQL over MongoDB**: Strong relational integrity + excellent JSON support (JSONB)
- **Redis over Memcached**: Richer data structures, persistence, pub/sub
- **Elasticsearch**: Purpose-built search engine with semantic capabilities
- **Prisma over TypeORM**: Better TypeScript integration, superior migrations
- **SharePoint**: Already deployed in Italian cultural institutions

---

## 4. Development Workflow

### Initial Setup (First Time)

```bash
# 1. Clone repository
git clone <repo-url>
cd cultural-heritage-dam

# 2. Create .env file (copy from .env.example when it exists)
cp .env.example .env
# Edit .env with your Azure AD credentials, SharePoint URLs, etc.

# 3. Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 4. Start infrastructure services (Docker Compose)
docker-compose -f docker/docker-compose.dev.yml up -d

# 5. Run database migrations
cd backend
npx prisma migrate dev --name init
npx prisma generate

# 6. Seed test data (optional)
npm run seed

# 7. Start development servers (separate terminals)
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### Daily Development

```bash
# Pull latest changes
git pull origin main

# Install new dependencies if package.json changed
npm install

# Run database migrations if schema changed
cd backend && npx prisma migrate dev

# Start services
docker-compose -f docker/docker-compose.dev.yml up -d
cd backend && npm run dev  # Terminal 1
cd frontend && npm start   # Terminal 2
```

### Before Committing

```bash
# Run linter
npm run lint

# Run tests
npm run test

# Type check
npm run type-check

# Format code
npm run format

# Git workflow
git add .
git commit -m "feat: descriptive commit message"
git push origin feature-branch-name
```

### Commit Message Convention

Use **Conventional Commits** format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
- `feat(asset): add ArCo tag selector component`
- `fix(search): resolve Elasticsearch timeout issue`
- `docs(api): update asset upload endpoint documentation`
- `test(collection): add integration tests for collection service`

---

## 5. Key Conventions

### Code Organization

Follow **layered architecture** pattern:

```
Controllers → Services → Repositories → Database
           ↘ External APIs
```

**Never skip layers.** Controllers should not directly access repositories.

### TypeScript Conventions

```typescript
// ✅ DO: Use strict typing
interface Asset {
  id: string;
  title: string;
  description?: string; // Optional with ?
  status: AssetStatus;  // Enum type
}

// ✅ DO: Use type guards
function isAsset(obj: unknown): obj is Asset {
  return typeof obj === 'object' && obj !== null && 'id' in obj;
}

// ❌ DON'T: Use 'any'
function badFunction(data: any) { // Avoid!
  // ...
}

// ✅ DO: Use unknown for untyped data, then validate
function goodFunction(data: unknown) {
  if (isAsset(data)) {
    // TypeScript knows data is Asset here
  }
}
```

### File Naming

- **Components**: `PascalCase.tsx` (e.g., `AssetCard.tsx`)
- **Services**: `kebab-case.service.ts` (e.g., `asset.service.ts`)
- **Utils**: `kebab-case.util.ts` (e.g., `date-formatter.util.ts`)
- **Types**: `kebab-case.types.ts` (e.g., `asset.types.ts`)
- **Tests**: `*.test.ts` or `*.spec.ts` (e.g., `asset.service.test.ts`)

### Import Order

```typescript
// 1. External dependencies
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal modules (absolute imports)
import { Asset } from '@/types';
import { assetService } from '@/services';

// 3. Relative imports
import { AssetCard } from './AssetCard';
import './AssetList.css';
```

### Error Handling

**Always use custom error classes**:

```typescript
// ✅ DO: Throw typed errors
throw new NotFoundError('Asset', assetId);
throw new ValidationError([{ field: 'title', message: 'Required' }]);
throw new UnauthorizedError();

// ❌ DON'T: Throw generic errors
throw new Error('Asset not found'); // Too generic
```

### Async/Await

```typescript
// ✅ DO: Use async/await with proper error handling
async function fetchAsset(id: string): Promise<Asset> {
  try {
    const asset = await assetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset', id);
    }
    return asset;
  } catch (error) {
    logger.error('Failed to fetch asset:', error);
    throw error; // Re-throw after logging
  }
}

// ❌ DON'T: Swallow errors
async function badFetch(id: string) {
  try {
    return await assetRepository.findById(id);
  } catch (error) {
    console.log(error); // Don't just log and continue!
    return null; // Silent failure is bad
  }
}
```

### Environment Variables

**Never hardcode secrets or environment-specific values**:

```typescript
// ✅ DO: Use environment variables
const config = {
  database: process.env.DATABASE_URL,
  azureAD: {
    tenantId: process.env.AZURE_AD_TENANT_ID,
    clientId: process.env.AZURE_AD_CLIENT_ID,
    clientSecret: process.env.AZURE_AD_CLIENT_SECRET
  }
};

// ❌ DON'T: Hardcode
const config = {
  database: 'postgresql://user:pass@localhost:5432/db', // Never!
  azureAD: {
    tenantId: '12345-67890-abcde' // Never!
  }
};
```

---

## 6. Implementation Phases

### Phase 0: Foundation ✅ (Completed)

**Status**: Completed via MCP Server (separate project)

**What was built**:
- MCP server for SharePoint library reorganization
- Duplicate detection using SHA256 hashing
- EXIF metadata extraction
- Automatic folder-based tagging

**Outcome**: Technical foundation for SharePoint automation

---

### Phase 1: MVP Core DAM (Months 1-4) 🔄 CURRENT PHASE

**Objective**: Functional DAM with ArCo tagging

**Priority**: P0 (Critical)

**25 Core Requirements**:

| ID | Requirement | Complexity | Effort | Status |
|----|-------------|-----------|--------|--------|
| REQ-MVP-001 | Azure AD authentication | C2 | 1 week | ⏳ Not started |
| REQ-MVP-002 | Asset upload with metadata | C3 | 2 weeks | ⏳ Not started |
| REQ-MVP-003 | EXIF extraction | C2 | 1 week | ⏳ Not started |
| REQ-MVP-004 | Asset listing with pagination | C2 | 1 week | ⏳ Not started |
| REQ-MVP-005 | Asset detail view | C1 | 3 days | ⏳ Not started |
| REQ-MVP-006 | Asset edit metadata | C2 | 1 week | ⏳ Not started |
| REQ-MVP-007 | Asset delete | C2 | 3 days | ⏳ Not started |
| REQ-MVP-008 | Free-form tagging | C1 | 3 days | ⏳ Not started |
| REQ-MVP-009 | ArCo vocabulary cache | C3 | 2 weeks | ⏳ Not started |
| REQ-MVP-010 | ArCo tag selector UI | C3 | 2 weeks | ⏳ Not started |
| REQ-MVP-011 | ArCo search autocomplete | C2 | 1 week | ⏳ Not started |
| REQ-MVP-012 | Basic search | C2 | 1 week | ⏳ Not started |
| REQ-MVP-013 | Advanced search with ArCo | C3 | 2 weeks | ⏳ Not started |
| REQ-MVP-014 | Search relevance ranking | C2 | 1 week | ⏳ Not started |
| REQ-MVP-015 | Collection create | C2 | 1 week | ⏳ Not started |
| REQ-MVP-016 | Collection add/remove assets | C2 | 1 week | ⏳ Not started |
| REQ-MVP-017 | Collection share | C2 | 1 week | ⏳ Not started |
| REQ-MVP-018 | Download original | C1 | 3 days | ⏳ Not started |
| REQ-MVP-019 | Download thumbnail | C2 | 1 week | ⏳ Not started |
| REQ-MVP-020 | Bulk download (ZIP) | C3 | 1 week | ⏳ Not started |
| REQ-MVP-021 | User roles (4 levels) | C2 | 1 week | ⏳ Not started |
| REQ-MVP-022 | Permission checks | C2 | 1 week | ⏳ Not started |
| REQ-MVP-023 | Audit trail | C2 | 1 week | ⏳ Not started |
| REQ-MVP-024 | Dashboard stats | C2 | 1 week | ⏳ Not started |
| REQ-MVP-025 | Help documentation | C1 | 3 days | ⏳ Not started |

**Recommended Implementation Order**:

1. **Week 1-2**: Foundation
   - Database schema setup (Prisma)
   - Basic Express API structure
   - React app scaffolding
   - Docker Compose configuration

2. **Week 3-4**: Authentication
   - Azure AD integration (REQ-MVP-001)
   - JWT token handling
   - Auth middleware
   - User roles (REQ-MVP-021)
   - Permission system (REQ-MVP-022)

3. **Week 5-7**: Asset Management
   - Asset upload (REQ-MVP-002)
   - EXIF extraction (REQ-MVP-003)
   - SharePoint integration
   - Asset listing (REQ-MVP-004)
   - Asset detail view (REQ-MVP-005)
   - Edit/Delete (REQ-MVP-006, REQ-MVP-007)

4. **Week 8-11**: ArCo Integration
   - ArCo vocabulary cache service (REQ-MVP-009)
   - SPARQL client
   - ArCo tag selector UI (REQ-MVP-010)
   - Autocomplete (REQ-MVP-011)
   - Free-form tagging (REQ-MVP-008)

5. **Week 12-14**: Search
   - Basic search (REQ-MVP-012)
   - Advanced search (REQ-MVP-013)
   - Elasticsearch integration
   - Search relevance (REQ-MVP-014)

6. **Week 15-16**: Collections & Downloads
   - Collections CRUD (REQ-MVP-015, REQ-MVP-016)
   - Sharing (REQ-MVP-017)
   - Downloads (REQ-MVP-018, REQ-MVP-019, REQ-MVP-020)

7. **Week 17**: Audit & Analytics
   - Audit trail (REQ-MVP-023)
   - Dashboard (REQ-MVP-024)

8. **Week 18**: Documentation & Testing
   - Help docs (REQ-MVP-025)
   - Integration tests
   - Bug fixes

**Success Criteria**:
- [ ] All 25 requirements implemented
- [ ] 80%+ test coverage
- [ ] <2s page load time
- [ ] 5+ curators actively using system
- [ ] 1000+ assets uploaded with ArCo tags

---

### Phase 2: Enhanced Features (Months 5-7)

**Status**: Future

**Key Features** (35 requirements):
- AI auto-tagging via Azure Cognitive Services
- Visual similarity search
- Workflow approvals
- Asset versioning
- Bulk operations
- Advanced ArCo browser
- Export formats (ICCD XML, RDF, JSON-LD)
- Elasticsearch full integration
- CDN for assets

---

### Phase 3-5: Advanced Features (Months 8-24+)

See specification documents for full details on:
- AI & Analytics (Phase 3)
- Enterprise & Ecosystem (Phase 4)
- Advanced & Specialized (Phase 5)

---

## 7. ArCo Integration Specifics

### What is ArCo?

**ArCo** (Architecture of Knowledge) is Italy's official cultural heritage ontology:

- **169M RDF triples** describing Italian cultural assets
- **800k+ catalog sheets** from national databases
- **SPARQL endpoint**: https://dati.beniculturali.it/sparql
- **8 main categories** for asset classification

### ArCo Categories

When tagging assets, use these 8 standardized categories:

1. **CULTURAL_PROPERTY_TYPE** (Tipo di Bene Culturale)
   - Examples: `scultura`, `dipinto`, `monumento`, `fotografia`
   - **Required** for all assets

2. **MATERIAL** (Materiali)
   - Examples: `marmo`, `bronzo`, `legno`, `tela`

3. **TECHNIQUE** (Tecnica)
   - Examples: `olio su tela`, `scultura a tutto tondo`, `affresco`

4. **SUBJECT** (Soggetto)
   - Examples: `ritratto`, `paesaggio`, `natura morta`

5. **AUTHOR** (Autore)
   - Examples: URIs for Michelangelo, Caravaggio, etc.

6. **CHRONOLOGY** (Cronologia)
   - Examples: `rinascimento`, `barocco`, `XVII secolo`

7. **LOCATION** (Localizzazione)
   - Examples: `Roma`, `Firenze`, `Museo degli Uffizi`

8. **CONSERVATION_STATUS** (Stato di Conservazione)
   - Examples: `ottimo`, `buono`, `mediocre`, `cattivo`

### ArCo Vocabulary Cache Strategy

**Problem**: SPARQL queries to external endpoint are slow (2-5s)

**Solution**: Multi-layer caching

```
1. Redis (Hot cache)
   └─ 1 hour TTL for search results
   └─ 1 week TTL for individual terms

2. PostgreSQL (Warm cache)
   └─ arco_vocabulary_cache table
   └─ Stores most common ~1000 terms per category
   └─ Updated weekly via cron job

3. SPARQL Endpoint (Cold fallback)
   └─ Only called for rare terms
   └─ Results cached immediately
```

### ArCo SPARQL Query Examples

**Get term by URI**:
```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?label ?definition ?notation ?broader
WHERE {
  <https://w3id.org/arco/resource/CulturalPropertyType/scultura>
    skos:prefLabel ?label .
  OPTIONAL {
    <https://w3id.org/arco/resource/CulturalPropertyType/scultura>
    skos:definition ?definition
  }
  OPTIONAL {
    <https://w3id.org/arco/resource/CulturalPropertyType/scultura>
    skos:broader ?broader
  }
  FILTER (LANG(?label) = "it" || LANG(?label) = "")
}
```

**Search terms by text**:
```sparql
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>

SELECT ?uri ?label ?definition
WHERE {
  ?uri a skos:Concept .
  ?uri skos:prefLabel ?label .
  OPTIONAL { ?uri skos:definition ?definition }

  FILTER (
    REGEX(?label, "scultura", "i") ||
    REGEX(?definition, "scultura", "i")
  )
  FILTER (LANG(?label) = "it" || LANG(?label) = "")
}
LIMIT 20
```

### ArCo Service Implementation Pattern

```typescript
export class ArcoService {
  constructor(
    private cacheService: CacheService,
    private prisma: PrismaClient,
    private sparqlClient: SparqlClient
  ) {}

  async searchTerms(category: ArCoCat, query: string): Promise<ArCoTerm[]> {
    // 1. Try Redis cache first (1 hour TTL)
    const cacheKey = `arco:search:${category}:${query}`;
    const cached = await this.cacheService.get<ArCoTerm[]>(cacheKey);
    if (cached) return cached;

    // 2. Search PostgreSQL cache (local vocabulary)
    const results = await this.prisma.arCoVocabularyCache.findMany({
      where: {
        category,
        OR: [
          { label: { contains: query, mode: 'insensitive' } },
          { altLabels: { has: query } }
        ]
      },
      orderBy: { usageCount: 'desc' }, // Popular first
      take: 20
    });

    if (results.length > 0) {
      const terms = results.map(this.mapToArCoTerm);
      await this.cacheService.set(cacheKey, terms, 3600); // Cache 1h
      return terms;
    }

    // 3. Fallback to SPARQL (rare terms only)
    const sparqlResults = await this.querySparql(category, query);

    // Cache results for next time
    await this.cacheService.set(cacheKey, sparqlResults, 3600);

    // Optionally add to PostgreSQL cache if frequently used

    return sparqlResults;
  }
}
```

### ArCo Weekly Sync Job

```typescript
// Runs every Sunday at 2 AM
import { CronJob } from 'cron';

export class ArcoSyncJob {
  async execute() {
    const categories = Object.values(ArCoCat);

    for (const category of categories) {
      // Fetch top 1000 most common terms for this category
      const terms = await this.fetchTopTerms(category, 1000);

      // Upsert to PostgreSQL cache
      await this.prisma.arCoVocabularyCache.createMany({
        data: terms,
        skipDuplicates: true
      });

      // Update lastSync timestamp
      await this.updateSyncTimestamp(category);
    }
  }
}
```

---

## 8. Common Tasks & Patterns

### Task: Add a New API Endpoint

1. **Define DTO** (Data Transfer Object):
```typescript
// backend/src/dto/asset.dto.ts
export class CreateAssetDto {
  title: string;
  description?: string;

  static validationSchema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(2000).optional()
  });

  static validate(data: unknown): CreateAssetDto {
    const { error, value } = this.validationSchema.validate(data);
    if (error) throw new ValidationError(error.details);
    return value;
  }
}
```

2. **Add Repository Method**:
```typescript
// backend/src/repositories/asset.repository.ts
export class AssetRepository {
  async create(data: CreateAssetData): Promise<Asset> {
    return await this.prisma.asset.create({
      data,
      include: { tags: true, creator: true }
    });
  }
}
```

3. **Add Service Method**:
```typescript
// backend/src/services/asset.service.ts
export class AssetService {
  async createAsset(dto: CreateAssetDto, userId: string): Promise<Asset> {
    // Business logic here
    const asset = await this.assetRepository.create({
      ...dto,
      creatorId: userId
    });

    await this.auditService.log({
      action: 'ASSET_CREATE',
      entityId: asset.id,
      userId
    });

    return asset;
  }
}
```

4. **Add Controller**:
```typescript
// backend/src/controllers/asset.controller.ts
export class AssetController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CreateAssetDto.validate(req.body);
      const asset = await this.assetService.createAsset(dto, req.user!.id);

      res.status(201).json({
        success: true,
        data: asset
      });
    } catch (error) {
      next(error);
    }
  }
}
```

5. **Add Route**:
```typescript
// backend/src/routes/assets.routes.ts
router.post(
  '/assets',
  authenticate,
  authorize('CURATOR', 'ADMIN'),
  validateDto(CreateAssetDto),
  assetController.create
);
```

6. **Add Test**:
```typescript
// backend/tests/integration/assets.test.ts
describe('POST /api/assets', () => {
  it('should create asset when valid data provided', async () => {
    const response = await request(app)
      .post('/api/assets')
      .set('Authorization', `Bearer ${curatorToken}`)
      .send({
        title: 'Test Asset',
        description: 'Test description'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Test Asset');
  });
});
```

---

### Task: Add a New React Component

1. **Create Component File**:
```typescript
// frontend/src/components/organisms/AssetCard/AssetCard.tsx
import React from 'react';
import { Asset } from '@/types';
import './AssetCard.css';

interface AssetCardProps {
  asset: Asset;
  onSelect?: (asset: Asset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onSelect }) => {
  return (
    <div className="asset-card" onClick={() => onSelect?.(asset)}>
      <img
        src={asset.thumbnailUrl}
        alt={asset.title}
        loading="lazy"
      />
      <div className="asset-card__content">
        <h3>{asset.title}</h3>
        <p>{asset.description}</p>
      </div>
    </div>
  );
};
```

2. **Add Styles**:
```css
/* frontend/src/components/organisms/AssetCard/AssetCard.css */
.asset-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s;
}

.asset-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
```

3. **Export from Index**:
```typescript
// frontend/src/components/organisms/index.ts
export { AssetCard } from './AssetCard/AssetCard';
```

4. **Add Test**:
```typescript
// frontend/src/components/organisms/AssetCard/AssetCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetCard } from './AssetCard';

describe('AssetCard', () => {
  const mockAsset = {
    id: '1',
    title: 'Test Asset',
    description: 'Description',
    thumbnailUrl: 'https://example.com/thumb.jpg'
  };

  it('renders asset title', () => {
    render(<AssetCard asset={mockAsset} />);
    expect(screen.getByText('Test Asset')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<AssetCard asset={mockAsset} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('Test Asset'));
    expect(onSelect).toHaveBeenCalledWith(mockAsset);
  });
});
```

---

### Task: Add Database Migration

1. **Modify Prisma Schema**:
```prisma
// backend/prisma/schema.prisma
model Asset {
  id          String   @id @default(uuid())
  title       String
  description String?
  newField    String?  // Add new field

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

2. **Create Migration**:
```bash
cd backend
npx prisma migrate dev --name add_new_field_to_asset
```

3. **Review Generated SQL**:
```sql
-- backend/prisma/migrations/xxx_add_new_field_to_asset/migration.sql
ALTER TABLE "assets" ADD COLUMN "newField" TEXT;
```

4. **Regenerate Prisma Client**:
```bash
npx prisma generate
```

---

### Task: Add Background Job

1. **Define Job Type**:
```typescript
// backend/src/types/jobs.types.ts
export enum JobType {
  REORGANIZE_LIBRARY = 'reorganize-library',
  BULK_TAG = 'bulk-tag',
  ARCO_SYNC = 'arco-sync'
}

export interface ReorganizeLibraryJobData {
  libraryId: string;
  strategy: 'by-date' | 'by-type';
}
```

2. **Register Job Processor**:
```typescript
// backend/src/services/job-queue.service.ts
this.queue.process(JobType.REORGANIZE_LIBRARY, 3, async (job) => {
  const { libraryId, strategy } = job.data;

  job.log(`Starting reorganization: ${libraryId}`);

  try {
    await this.mcpClient.reorganizeLibrary(libraryId, strategy, {
      onProgress: (progress) => {
        job.progress(progress);
      }
    });

    job.log('Completed successfully');
  } catch (error) {
    job.log(`Error: ${error.message}`);
    throw error; // Will trigger retry
  }
});
```

3. **Add Job to Queue**:
```typescript
// In controller or service
const jobId = await this.jobQueueService.addJob(
  JobType.REORGANIZE_LIBRARY,
  {
    libraryId: 'lib-123',
    strategy: 'by-date'
  },
  {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 }
  }
);

return { jobId };
```

4. **Check Job Status**:
```typescript
const status = await this.jobQueueService.getJobStatus(jobId);
// Returns: { id, state, progress, logs, result, ... }
```

---

## 9. Testing Strategy

### Test Coverage Targets

- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows

### Unit Tests

**When**: Test individual functions/classes in isolation

**Tools**: Jest + ts-jest

**Example**:
```typescript
// backend/tests/unit/services/asset.service.test.ts
import { AssetService } from '@/services/asset.service';
import { AssetRepository } from '@/repositories/asset.repository';

describe('AssetService', () => {
  let service: AssetService;
  let mockRepository: jest.Mocked<AssetRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn()
    } as any;

    service = new AssetService(mockRepository, ...);
  });

  describe('createAsset', () => {
    it('should create asset and log audit trail', async () => {
      const dto = { title: 'Test', description: 'Desc' };
      const expected = { id: '1', ...dto };

      mockRepository.create.mockResolvedValue(expected);

      const result = await service.createAsset(dto, 'user-1');

      expect(result).toEqual(expected);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        creatorId: 'user-1'
      });
    });
  });
});
```

### Integration Tests

**When**: Test API endpoints end-to-end

**Tools**: Jest + Supertest

**Example**:
```typescript
// backend/tests/integration/assets.test.ts
import request from 'supertest';
import { app } from '@/app';
import { prisma } from '@/config/database';

describe('Asset API', () => {
  let curatorToken: string;

  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();

    // Get auth token
    curatorToken = await getTestToken('curator@test.com');
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/assets', () => {
    it('should create asset when authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/assets')
        .set('Authorization', `Bearer ${curatorToken}`)
        .field('title', 'Test Asset')
        .attach('file', 'tests/fixtures/test-image.jpg');

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Test Asset');
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/v1/assets')
        .send({ title: 'Test' });

      expect(response.status).toBe(401);
    });
  });
});
```

### E2E Tests (Cypress)

**When**: Test complete user workflows

**Example**:
```typescript
// frontend/cypress/e2e/asset-upload.cy.ts
describe('Asset Upload Flow', () => {
  beforeEach(() => {
    cy.login('curator@test.com', 'password');
  });

  it('should upload asset with ArCo tags', () => {
    // Navigate to upload page
    cy.visit('/assets/upload');

    // Upload file
    cy.get('[data-testid="file-dropzone"]')
      .attachFile('test-image.jpg');

    // Fill metadata
    cy.get('#title').type('Venus de Milo');
    cy.get('#description').type('Ancient Greek sculpture');

    // Add ArCo tag
    cy.get('[data-testid="arco-selector-cultural-property"]')
      .type('scultura');
    cy.get('[data-testid="arco-suggestion-0"]').click();

    // Submit
    cy.get('[data-testid="upload-button"]').click();

    // Verify success
    cy.url().should('include', '/assets/');
    cy.contains('Venus de Milo');
    cy.contains('scultura');
  });
});
```

### Test Data Management

**Fixtures**:
```typescript
// tests/fixtures/assets.fixtures.ts
export const testAsset = {
  id: 'test-asset-1',
  title: 'Test Asset',
  description: 'Test description',
  filename: 'test.jpg',
  mimeType: 'image/jpeg',
  fileSize: 1024000,
  status: 'PUBLISHED'
};

export const testUser = {
  id: 'test-user-1',
  email: 'curator@test.com',
  name: 'Test Curator',
  role: 'CURATOR'
};
```

---

## 10. Security & Compliance

### Authentication Flow

```
1. User clicks "Login with Microsoft"
2. Redirect to Azure AD
3. User authenticates (MFA if enabled)
4. Azure AD redirects back with auth code
5. Backend exchanges code for tokens
6. Backend generates JWT
7. Frontend stores JWT (httpOnly cookie or localStorage)
8. Subsequent requests include JWT in Authorization header
```

### Authorization Rules

| Resource | Action | ADMIN | CURATOR | RESEARCHER | VIEWER |
|----------|--------|-------|---------|------------|--------|
| Asset (published) | View | ✅ | ✅ | ✅ | ✅ |
| Asset (draft) | View | ✅ | ✅ | ❌ | ❌ |
| Asset | Create | ✅ | ✅ | ❌ | ❌ |
| Asset (own) | Edit | ✅ | ✅ | ❌ | ❌ |
| Asset (any) | Edit | ✅ | ❌ | ❌ | ❌ |
| Asset (own) | Delete | ✅ | ✅ | ❌ | ❌ |
| Asset (any) | Delete | ✅ | ❌ | ❌ | ❌ |
| ArCo Tag | Add/Remove | ✅ | ✅ | ❌ | ❌ |
| Collection | Create | ✅ | ✅ | ✅ | ❌ |
| Collection (own) | Edit | ✅ | ✅ | ✅ | ❌ |
| User | Manage | ✅ | ❌ | ❌ | ❌ |

### GDPR Compliance

**User Rights**:
- **Right to Access**: API endpoint to export user's data
- **Right to Deletion**: Anonymize or delete user data
- **Right to Rectification**: Allow users to update their info
- **Data Portability**: Export in machine-readable format

**Implementation**:
```typescript
// backend/src/services/gdpr.service.ts
export class GdprService {
  async exportUserData(userId: string): Promise<UserDataExport> {
    const [user, assets, collections, auditLogs] = await Promise.all([
      this.userRepository.findById(userId),
      this.assetRepository.findByCreator(userId),
      this.collectionRepository.findByCreator(userId),
      this.auditLogRepository.findByUser(userId)
    ]);

    return {
      user,
      assets,
      collections,
      auditLogs,
      exportedAt: new Date()
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    // Anonymize audit logs (keep for compliance)
    await this.auditLogRepository.anonymize(userId);

    // Delete or transfer assets based on policy
    await this.assetRepository.deleteByCreator(userId);

    // Delete user account
    await this.userRepository.delete(userId);
  }
}
```

### Security Checklist

- [ ] All passwords hashed with bcrypt (rounds ≥ 12)
- [ ] JWT secrets are strong (≥ 32 characters)
- [ ] Environment variables never committed to Git
- [ ] HTTPS enforced in production
- [ ] CORS configured properly (whitelist origins)
- [ ] SQL injection prevented (use parameterized queries via Prisma)
- [ ] XSS prevented (sanitize user input, use Content Security Policy)
- [ ] CSRF tokens on state-changing operations
- [ ] Rate limiting on API endpoints (express-rate-limit)
- [ ] File upload validation (type, size, malware scan)
- [ ] Audit trail for sensitive operations
- [ ] Regular dependency updates (npm audit)
- [ ] SharePoint permissions properly scoped

---

## 11. Useful Commands

### Development

```bash
# Start all services
docker-compose -f docker/docker-compose.dev.yml up -d

# Backend development server (hot reload)
cd backend && npm run dev

# Frontend development server (hot reload)
cd frontend && npm start

# Run tests
npm run test                    # All tests
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:e2e               # E2E tests (Cypress)
npm run test:watch             # Watch mode

# Linting & formatting
npm run lint                   # ESLint
npm run lint:fix               # Auto-fix issues
npm run format                 # Prettier
npm run type-check             # TypeScript check

# Database
cd backend
npx prisma studio              # Database GUI
npx prisma migrate dev         # Create migration
npx prisma migrate reset       # Reset database
npx prisma generate            # Regenerate client
npm run seed                   # Seed test data

# Build
npm run build                  # Build all
cd frontend && npm run build   # Build frontend only
cd backend && npm run build    # Build backend only

# Docker
docker-compose ps              # List running containers
docker-compose logs -f         # Follow logs
docker-compose restart         # Restart all services
docker-compose down            # Stop all services
```

### Production

```bash
# Build production images
docker build -t dam-backend:latest -f docker/Dockerfile.backend .
docker build -t dam-frontend:latest -f docker/Dockerfile.frontend .

# Run migrations
cd backend && npx prisma migrate deploy

# Start production
docker-compose -f docker/docker-compose.prod.yml up -d

# Health checks
curl http://localhost:3000/api/health      # Backend
curl http://localhost:9200/_cluster/health # Elasticsearch
redis-cli ping                             # Redis
```

### Troubleshooting

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
docker-compose logs redis

# Restart specific service
docker-compose restart backend

# Clear Redis cache
redis-cli FLUSHALL

# Reset Elasticsearch index
curl -X DELETE http://localhost:9200/assets

# Database connection test
cd backend && npx prisma db pull
```

---

## 12. Important Files & Directories

### Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Environment variables (never commit!) |
| `.env.example` | Template for environment variables |
| `docker-compose.dev.yml` | Development services |
| `docker-compose.prod.yml` | Production services |
| `backend/prisma/schema.prisma` | Database schema |
| `backend/tsconfig.json` | TypeScript config (backend) |
| `frontend/tsconfig.json` | TypeScript config (frontend) |
| `jest.config.js` | Jest test configuration |
| `.eslintrc.js` | ESLint rules |
| `.prettierrc` | Prettier formatting rules |

### Documentation

| File | Description |
|------|-------------|
| `CLAUDE.md` | This file - AI assistant guide |
| `DAM-Phase1-MVP-Specs-Part1.md` | MVP requirements (25 features) |
| `DAM-Phase1-MVP-Specs-Part2.md` | Frontend/backend specs |
| `DAM-Master-Implementation-Guide-Part1.md` | Architecture & setup |
| `DAM-Master-Implementation-Guide-Part2.md` | Database, auth, API |
| `DAM-Master-Implementation-Guide-Part3.md` | Security, testing, deployment |
| `DAM-ArCo-Integration-Guide.md` | ArCo-specific details |
| `README.md` | Project overview (when created) |
| `docs/api/` | API documentation (Swagger/OpenAPI) |
| `docs/architecture/decisions/` | Architectural Decision Records (ADRs) |

### Key Source Directories

| Directory | Contents |
|-----------|----------|
| `backend/src/controllers/` | API route handlers |
| `backend/src/services/` | Business logic |
| `backend/src/repositories/` | Data access layer |
| `backend/src/middleware/` | Express middleware |
| `backend/src/dto/` | Data transfer objects |
| `backend/src/types/` | TypeScript type definitions |
| `backend/prisma/migrations/` | Database migrations |
| `frontend/src/components/` | React components |
| `frontend/src/pages/` | Page components |
| `frontend/src/store/` | Redux store & slices |
| `frontend/src/services/` | API client services |
| `frontend/src/hooks/` | Custom React hooks |
| `shared/types/` | Shared TypeScript types |

---

## Quick Reference

### When Starting a New Task

1. **Read specifications** - Check relevant spec document
2. **Check existing code** - See if similar patterns exist
3. **Plan approach** - Identify files to create/modify
4. **Write tests first** - TDD recommended
5. **Implement** - Follow patterns in this guide
6. **Test** - Unit + integration tests
7. **Document** - Update API docs if needed
8. **Commit** - Use conventional commit format

### When Stuck

1. **Check specs** - Answer might be in specification documents
2. **Look for patterns** - Find similar implementation in codebase
3. **Check logs** - `docker-compose logs -f`
4. **Test in isolation** - Write unit test to understand behavior
5. **Ask for clarification** - Better to ask than assume

### Important Reminders

- ⚠️ **Never commit `.env` files**
- ⚠️ **Always validate user input**
- ⚠️ **Check permissions before operations**
- ⚠️ **Log errors, don't swallow them**
- ⚠️ **Write tests for new features**
- ⚠️ **Use TypeScript strictly** (no `any`)
- ⚠️ **Cache ArCo queries aggressively**
- ⚠️ **Handle SharePoint rate limits**

---

## Additional Resources

### External Documentation

- **ArCo SPARQL Endpoint**: https://dati.beniculturali.it/sparql
- **Microsoft Graph API**: https://docs.microsoft.com/en-us/graph
- **Azure AD Authentication**: https://docs.microsoft.com/en-us/azure/active-directory
- **Prisma Docs**: https://www.prisma.io/docs
- **React 18 Docs**: https://react.dev
- **Redux Toolkit**: https://redux-toolkit.js.org

### Project-Specific

- **Specification Documents**: All `DAM-*.md` files in repository root
- **API Documentation**: `http://localhost:3000/api-docs` (when running)
- **Database Schema**: `backend/prisma/schema.prisma`

---

**Last Updated**: November 14, 2024
**Version**: 1.0
**Maintainer**: Development Team

**For questions or clarifications, refer to the specification documents or ask the project lead.**
