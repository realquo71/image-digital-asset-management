# Cultural Heritage Digital Asset Management System
## Phase 1 MVP - Detailed Specifications v1.0

**Last Updated:** November 14, 2024  
**Status:** Ready for Implementation  
**Timeline:** 3-4 months (Months 1-4)  
**Team Size:** 2-3 developers + 1 product manager

---

## Table of Contents

1. [Phase 1 Overview](#1-phase-1-overview)
2. [MVP Requirements Summary](#2-mvp-requirements-summary)
3. [User Stories & Acceptance Criteria](#3-user-stories--acceptance-criteria)
4. [Database Schema Detailed](#4-database-schema-detailed)
5. [API Specification Complete](#5-api-specification-complete)
6. [Frontend Components Specification](#6-frontend-components-specification)
7. [Backend Services Specification](#7-backend-services-specification)
8. [ArCo Integration MVP](#8-arco-integration-mvp)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Search & Discovery](#10-search--discovery)
11. [File Upload & Processing](#11-file-upload--processing)
12. [Collections Management](#12-collections-management)
13. [Audit Trail & Logging](#13-audit-trail--logging)
14. [Testing Requirements](#14-testing-requirements)
15. [Deployment Checklist](#15-deployment-checklist)

---

## 1. Phase 1 Overview

### Objective

Deliver a **functional DAM system** that allows curators to:
- Upload and manage digital assets
- Tag assets with ArCo vocabulary terms
- Search assets using semantic filters
- Organize assets into collections
- Download assets in multiple formats

### Success Criteria

- **Functional**: All 25 MVP requirements implemented and tested
- **Performance**: < 2s page load, < 500ms API response (p95)
- **Quality**: 80%+ test coverage, zero critical bugs
- **Adoption**: 5+ curators actively using the system
- **Data**: 1000+ assets uploaded with ArCo tags

### Out of Scope (Phase 2+)

- AI auto-tagging
- Visual similarity search
- Workflow approvals
- Mobile app
- Advanced analytics
- Multi-tenancy
- 3D asset support

---

## 2. MVP Requirements Summary

### 25 Core Requirements

| ID | Requirement | Priority | Complexity | Effort |
|---|---|---|---|---|
| **REQ-MVP-001** | User authentication via Azure AD | P0 | C2 | 1 week |
| **REQ-MVP-002** | Asset upload with metadata | P0 | C3 | 2 weeks |
| **REQ-MVP-003** | EXIF metadata extraction | P0 | C2 | 1 week |
| **REQ-MVP-004** | Asset listing with pagination | P0 | C2 | 1 week |
| **REQ-MVP-005** | Asset detail view | P0 | C1 | 3 days |
| **REQ-MVP-006** | Asset edit metadata | P1 | C2 | 1 week |
| **REQ-MVP-007** | Asset delete | P1 | C2 | 3 days |
| **REQ-MVP-008** | Free-form tagging | P1 | C1 | 3 days |
| **REQ-MVP-009** | ArCo vocabulary cache | P0 | C3 | 2 weeks |
| **REQ-MVP-010** | ArCo tag selector UI | P0 | C3 | 2 weeks |
| **REQ-MVP-011** | ArCo search autocomplete | P0 | C2 | 1 week |
| **REQ-MVP-012** | Basic search (title, description) | P0 | C2 | 1 week |
| **REQ-MVP-013** | Advanced search with ArCo filters | P1 | C3 | 2 weeks |
| **REQ-MVP-014** | Search results relevance | P1 | C2 | 1 week |
| **REQ-MVP-015** | Collection create | P1 | C2 | 1 week |
| **REQ-MVP-016** | Collection add/remove assets | P1 | C2 | 1 week |
| **REQ-MVP-017** | Collection share | P2 | C2 | 1 week |
| **REQ-MVP-018** | Asset download original | P0 | C1 | 3 days |
| **REQ-MVP-019** | Asset download thumbnail | P1 | C2 | 1 week |
| **REQ-MVP-020** | Bulk asset download (ZIP) | P2 | C3 | 1 week |
| **REQ-MVP-021** | User roles (4 levels) | P0 | C2 | 1 week |
| **REQ-MVP-022** | Permission checks | P0 | C2 | 1 week |
| **REQ-MVP-023** | Audit trail logging | P1 | C2 | 1 week |
| **REQ-MVP-024** | Dashboard with stats | P2 | C2 | 1 week |
| **REQ-MVP-025** | Help documentation | P2 | C1 | 3 days |

**Total Effort**: ~26 weeks (~6 months with 2 developers in parallel)  
**Target**: 3-4 months with optimization and parallel work

---

## 3. User Stories & Acceptance Criteria

### Epic 1: Authentication & User Management

#### US-001: Login with Azure AD

**As a** curator  
**I want to** log in using my institutional Microsoft account  
**So that** I can access the DAM system securely

**Acceptance Criteria:**
- [ ] User sees "Login with Microsoft" button on landing page
- [ ] Clicking button redirects to Azure AD login
- [ ] After successful login, user is redirected to dashboard
- [ ] User's name and role are displayed in header
- [ ] JWT token is stored and used for subsequent requests
- [ ] Token expires after 24 hours, requiring re-login
- [ ] MFA is supported if enabled in Azure AD

**Technical Notes:**
- Use @azure/msal-node for backend
- Use @azure/msal-react for frontend
- Store JWT in httpOnly cookie or localStorage
- Implement refresh token mechanism

---

#### US-002: Role-Based Access Control

**As an** administrator  
**I want to** assign different roles to users  
**So that** I can control what actions they can perform

**Acceptance Criteria:**
- [ ] Four roles exist: ADMIN, CURATOR, RESEARCHER, VIEWER
- [ ] ADMIN can manage users and all assets
- [ ] CURATOR can create, edit, delete own assets
- [ ] RESEARCHER can view and create collections
- [ ] VIEWER can only view published assets
- [ ] Unauthorized actions show clear error messages
- [ ] Role changes take effect immediately

**Technical Notes:**
- Roles stored in User table
- Middleware checks role before each protected route
- Frontend disables/hides features based on role

---

### Epic 2: Asset Management

#### US-003: Upload Asset

**As a** curator  
**I want to** upload images with metadata  
**So that** I can add new assets to the collection

**Acceptance Criteria:**
- [ ] Drag-and-drop file upload supported
- [ ] File browser also available
- [ ] Supported formats: JPEG, PNG, TIFF, PDF
- [ ] Max file size: 100MB
- [ ] Required fields: Title
- [ ] Optional fields: Description
- [ ] EXIF data extracted automatically
- [ ] Upload progress shown for large files
- [ ] Success message displayed after upload
- [ ] New asset appears in asset list

**Technical Notes:**
- Use multer for multipart upload
- Use sharp for EXIF extraction
- Store binary in SharePoint
- Store metadata in PostgreSQL
- Generate thumbnail automatically

**UI Mockup:**
```
┌─────────────────────────────────────┐
│ Upload Asset                     [X]│
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │   Drag & Drop File Here     │   │
│  │          or                 │   │
│  │     [Browse Files]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  Title: [_____________________]  *  │
│                                     │
│  Description:                       │
│  [___________________________]      │
│  [___________________________]      │
│  [___________________________]      │
│                                     │
│  [Cancel]            [Upload]      │
└─────────────────────────────────────┘
```

---

#### US-004: View Asset Details

**As a** researcher  
**I want to** view detailed information about an asset  
**So that** I can study it and cite it properly

**Acceptance Criteria:**
- [ ] Full-size image preview displayed
- [ ] Title, description, and all metadata visible
- [ ] EXIF data shown in expandable section
- [ ] All tags (free-form and ArCo) displayed
- [ ] Creator and creation date shown
- [ ] Collections containing this asset listed
- [ ] Download buttons available
- [ ] Edit button visible (if user has permission)
- [ ] Related assets suggested (Phase 2)

**Technical Notes:**
- Fetch asset with all relations (tags, arcoTags, creator)
- Use lazy loading for large images
- Implement zoom functionality

**UI Layout:**
```
┌────────────────────────────────────────────────┐
│ < Back to Assets                               │
├────────────────────────────────────────────────┤
│                          │                     │
│                          │  Venus de Milo      │
│      [Large Image]       │                     │
│                          │  Ancient Greek...   │
│                          │                     │
│                          │  📷 EXIF Data       │
│                          │  📁 Collections (2) │
│                          │  🏷️  Tags           │
│                          │  🏛️  ArCo Tags      │
│                          │                     │
│                          │  [Download] [Edit]  │
└────────────────────────────────────────────────┘
```

---

#### US-005: Edit Asset Metadata

**As a** curator  
**I want to** update asset metadata  
**So that** I can correct errors or add information

**Acceptance Criteria:**
- [ ] Edit button available on asset detail page
- [ ] Form pre-filled with current metadata
- [ ] All editable fields can be modified
- [ ] Changes saved with "Save" button
- [ ] Success message shown after save
- [ ] Audit log records the change
- [ ] Updated asset shown immediately
- [ ] Only authorized users can edit

**Technical Notes:**
- Use PATCH endpoint for partial updates
- Validate changes server-side
- Store previous values in audit log

---

#### US-006: Delete Asset

**As a** curator  
**I want to** delete assets I created  
**So that** I can remove duplicates or mistakes

**Acceptance Criteria:**
- [ ] Delete button available on asset detail page
- [ ] Confirmation dialog shown before deletion
- [ ] Asset removed from database
- [ ] File removed from SharePoint
- [ ] Asset removed from all collections
- [ ] Deletion recorded in audit log
- [ ] User redirected to asset list
- [ ] Deleted assets cannot be recovered (Phase 2: soft delete)

**Technical Notes:**
- Implement hard delete for MVP
- Use database transaction for atomicity
- Queue cleanup job for SharePoint

**Confirmation Dialog:**
```
┌─────────────────────────────────────┐
│ Confirm Deletion               [X]  │
├─────────────────────────────────────┤
│                                     │
│  Are you sure you want to delete    │
│  "Venus de Milo"?                   │
│                                     │
│  This action cannot be undone.      │
│                                     │
│  [Cancel]              [Delete]     │
└─────────────────────────────────────┘
```

---

### Epic 3: ArCo Tagging

#### US-007: Tag Asset with ArCo Terms

**As a** curator  
**I want to** tag assets using standardized cultural heritage vocabulary  
**So that** assets are catalogued according to ICCD standards

**Acceptance Criteria:**
- [ ] ArCo tag selector available on asset edit page
- [ ] 8 ArCo categories available
- [ ] Autocomplete suggests terms as I type
- [ ] Search results show term definition on hover
- [ ] Selected terms displayed as pills
- [ ] Terms can be removed by clicking X
- [ ] Changes saved to database
- [ ] ArCo tags visible on asset detail page

**ArCo Categories:**
1. Tipo di Bene Culturale (Cultural Property Type)
2. Materiali (Materials)
3. Tecnica (Technique)
4. Soggetto (Subject)
5. Autore (Author)
6. Cronologia (Chronology)
7. Localizzazione (Location)
8. Stato di Conservazione (Conservation Status)

**Technical Notes:**
- Use ArCo SPARQL endpoint or local cache
- Implement debounced autocomplete (300ms)
- Store ArCo URIs in arco_tags table

**UI Component:**
```
┌─────────────────────────────────────────┐
│ Tipo di Bene Culturale              *   │
│ [scultura                      ]  [v]   │
│                                         │
│ Suggestions:                            │
│ ┌─────────────────────────────────────┐ │
│ │ scultura                        [+] │ │
│ │ Rappresentazione tridimensionale... │ │
│ │                                     │ │
│ │ scultura a tutto tondo          [+] │ │
│ │ Scultura configurata su...          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Selected:                               │
│ [scultura (OA) x]                       │
└─────────────────────────────────────────┘
```

---

#### US-008: Search by ArCo Tags

**As a** researcher  
**I want to** filter assets by ArCo categories  
**So that** I can find assets of specific types

**Acceptance Criteria:**
- [ ] Advanced search form includes ArCo filters
- [ ] Each ArCo category has a filter dropdown
- [ ] Multiple terms can be selected per category
- [ ] Filters are combined with AND logic
- [ ] Results update as filters are applied
- [ ] Result count shown
- [ ] Clear all filters button available

**Technical Notes:**
- Query arco_tags table with JOIN
- Use Elasticsearch for better performance
- Cache popular filter combinations

---

### Epic 4: Search & Discovery

#### US-009: Basic Search

**As a** researcher  
**I want to** search assets by title and description  
**So that** I can quickly find what I need

**Acceptance Criteria:**
- [ ] Search box visible in header on all pages
- [ ] Search as user types (debounced)
- [ ] Results show title, thumbnail, and snippet
- [ ] Clicking result navigates to asset detail
- [ ] Recent searches shown in dropdown
- [ ] No results message displayed when appropriate

**Technical Notes:**
- Use PostgreSQL full-text search for MVP
- Implement Elasticsearch in Phase 2 for better relevance
- Index title, description, tags

---

#### US-010: Advanced Search

**As a** curator  
**I want to** search with multiple filters  
**So that** I can find specific subsets of assets

**Acceptance Criteria:**
- [ ] Advanced search page accessible from main search
- [ ] Filters available: status, date range, creator, ArCo tags
- [ ] Filter values loaded dynamically
- [ ] Search executes on "Search" button click
- [ ] Results paginated (20 per page)
- [ ] Sort options: relevance, date, title

**Filters:**
- Title (text)
- Description (text)
- Status (dropdown: DRAFT, PUBLISHED, ARCHIVED)
- Date Range (date pickers)
- Creator (dropdown with user list)
- ArCo Type (autocomplete)
- Materials (autocomplete)
- Tags (text, comma-separated)

---

### Epic 5: Collections

#### US-011: Create Collection

**As a** researcher  
**I want to** create a collection  
**So that** I can group related assets

**Acceptance Criteria:**
- [ ] "New Collection" button on collections page
- [ ] Form requires collection name
- [ ] Optional description field
- [ ] Public/private toggle available
- [ ] Collection created with current user as owner
- [ ] Success message displayed
- [ ] User redirected to collection page

**Technical Notes:**
- Store in collections table
- Link to user via creatorId foreign key

---

#### US-012: Add Assets to Collection

**As a** researcher  
**I want to** add assets to my collection  
**So that** I can organize my research materials

**Acceptance Criteria:**
- [ ] "Add to Collection" button on asset detail page
- [ ] Dialog shows list of user's collections
- [ ] User can select multiple collections
- [ ] Asset added to selected collections
- [ ] Duplicate additions prevented
- [ ] Success message shown
- [ ] Collection page updates immediately

**Technical Notes:**
- Use collection_assets junction table
- Allow same asset in multiple collections
- Track order for future sorting

---

#### US-013: View Collection

**As a** researcher  
**I want to** view assets in a collection  
**So that** I can access my organized materials

**Acceptance Criteria:**
- [ ] Collection page shows all assets in grid
- [ ] Collection name and description at top
- [ ] Asset count displayed
- [ ] Clicking asset navigates to detail page
- [ ] Remove from collection button available
- [ ] Empty state shown for empty collections

---

### Epic 6: Download & Export

#### US-014: Download Original Asset

**As a** researcher  
**I want to** download the original asset file  
**So that** I can use it in my work

**Acceptance Criteria:**
- [ ] "Download Original" button on asset detail page
- [ ] Download starts immediately
- [ ] File has original filename
- [ ] Download recorded in audit log
- [ ] EXIF metadata preserved in download

**Technical Notes:**
- Stream file from SharePoint via backend
- Set correct Content-Disposition header
- Track downloads for analytics

---

#### US-015: Download Thumbnail

**As a** curator  
**I want to** download smaller versions of images  
**So that** I can use them in presentations

**Acceptance Criteria:**
- [ ] "Download Thumbnail" option available
- [ ] 300px wide thumbnail generated
- [ ] Download starts immediately
- [ ] Thumbnail cached for reuse

**Technical Notes:**
- Generate thumbnail on first request
- Store in SharePoint or Redis
- Use sharp for resizing

---

### Epic 7: Dashboard & Analytics

#### US-016: View Dashboard

**As a** curator  
**I want to** see overview statistics  
**So that** I can understand system usage

**Acceptance Criteria:**
- [ ] Dashboard accessible from home page
- [ ] Shows total asset count
- [ ] Shows recent uploads (last 10)
- [ ] Shows popular searches
- [ ] Shows assets by status (pie chart)
- [ ] Shows uploads over time (line chart)

**Metrics:**
- Total assets
- Assets by status
- Recent uploads (7 days)
- Popular tags
- Active users
- Storage used

---

## 4. Database Schema Detailed

### Complete PostgreSQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'VIEWER',
    azure_ad_id VARCHAR(255) UNIQUE,
    organization VARCHAR(255),
    department VARCHAR(255),
    phone VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_role CHECK (role IN ('ADMIN', 'CURATOR', 'RESEARCHER', 'VIEWER'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_azure_ad_id ON users(azure_ad_id);
CREATE INDEX idx_users_role ON users(role);

-- Assets table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    sharepoint_url TEXT NOT NULL,
    sharepoint_id VARCHAR(255) NOT NULL UNIQUE,
    thumbnail_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP,
    
    -- EXIF metadata
    width INTEGER,
    height INTEGER,
    capture_date TIMESTAMP,
    camera VARCHAR(255),
    lens VARCHAR(255),
    focal_length VARCHAR(50),
    aperture VARCHAR(50),
    shutter_speed VARCHAR(50),
    iso VARCHAR(50),
    gps_latitude DOUBLE PRECISION,
    gps_longitude DOUBLE PRECISION,
    
    -- Relations
    creator_id UUID NOT NULL REFERENCES users(id),
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    CONSTRAINT chk_file_size CHECK (file_size > 0 AND file_size <= 104857600) -- 100MB
);

CREATE INDEX idx_assets_creator_id ON assets(creator_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_published_at ON assets(published_at);
CREATE INDEX idx_assets_created_at ON assets(created_at DESC);
CREATE INDEX idx_assets_mime_type ON assets(mime_type);

-- Full-text search
CREATE INDEX idx_assets_search ON assets USING GIN (
    to_tsvector('italian', title || ' ' || COALESCE(description, ''))
);

-- Tags table
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_name ON tags(name);

-- Asset tags junction table
CREATE TABLE asset_tags (
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (asset_id, tag_id)
);

CREATE INDEX idx_asset_tags_asset_id ON asset_tags(asset_id);
CREATE INDEX idx_asset_tags_tag_id ON asset_tags(tag_id);

-- ArCo tags table
CREATE TABLE arco_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    arco_uri TEXT NOT NULL,
    label VARCHAR(255) NOT NULL,
    notation VARCHAR(50),
    confidence DOUBLE PRECISION DEFAULT 1.0,
    source VARCHAR(20) DEFAULT 'manual',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_category CHECK (category IN (
        'CULTURAL_PROPERTY_TYPE',
        'MATERIAL',
        'TECHNIQUE',
        'SUBJECT',
        'AUTHOR',
        'CHRONOLOGY',
        'LOCATION',
        'CONSERVATION_STATUS'
    )),
    CONSTRAINT chk_confidence CHECK (confidence >= 0 AND confidence <= 1),
    CONSTRAINT chk_source CHECK (source IN ('manual', 'ai')),
    CONSTRAINT uq_asset_arco_uri UNIQUE (asset_id, arco_uri)
);

CREATE INDEX idx_arco_tags_asset_id ON arco_tags(asset_id);
CREATE INDEX idx_arco_tags_category ON arco_tags(category);
CREATE INDEX idx_arco_tags_arco_uri ON arco_tags(arco_uri);

-- ArCo vocabulary cache table
CREATE TABLE arco_vocabulary_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uri TEXT NOT NULL UNIQUE,
    category VARCHAR(50) NOT NULL,
    label VARCHAR(255) NOT NULL,
    definition TEXT,
    notation VARCHAR(50),
    broader TEXT[],
    narrower TEXT[],
    related TEXT[],
    alt_labels TEXT[],
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_sync TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_vocab_category CHECK (category IN (
        'CULTURAL_PROPERTY_TYPE',
        'MATERIAL',
        'TECHNIQUE',
        'SUBJECT',
        'AUTHOR',
        'CHRONOLOGY',
        'LOCATION',
        'CONSERVATION_STATUS'
    ))
);

CREATE INDEX idx_arco_vocab_category ON arco_vocabulary_cache(category);
CREATE INDEX idx_arco_vocab_label ON arco_vocabulary_cache(label);
CREATE INDEX idx_arco_vocab_uri ON arco_vocabulary_cache(uri);

-- Full-text search on vocabulary
CREATE INDEX idx_arco_vocab_search ON arco_vocabulary_cache USING GIN (
    to_tsvector('italian', label || ' ' || COALESCE(definition, ''))
);

-- Collections table
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    cover_asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    creator_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_collections_creator_id ON collections(creator_id);
CREATE INDEX idx_collections_is_public ON collections(is_public);
CREATE INDEX idx_collections_created_at ON collections(created_at DESC);

-- Collection assets junction table
CREATE TABLE collection_assets (
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (collection_id, asset_id)
);

CREATE INDEX idx_collection_assets_collection_id ON collection_assets(collection_id);
CREATE INDEX idx_collection_assets_asset_id ON collection_assets(asset_id);
CREATE INDEX idx_collection_assets_order ON collection_assets(order_index);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    changes JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_action CHECK (action IN (
        'ASSET_CREATE',
        'ASSET_UPDATE',
        'ASSET_DELETE',
        'ASSET_DOWNLOAD',
        'COLLECTION_CREATE',
        'COLLECTION_UPDATE',
        'COLLECTION_DELETE',
        'TAG_ADD',
        'TAG_REMOVE',
        'ARCO_TAG_ADD',
        'ARCO_TAG_REMOVE',
        'USER_LOGIN',
        'USER_LOGOUT',
        'GDPR_DATA_EXPORT',
        'GDPR_DATA_DELETION'
    ))
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Seed Data for Development

```sql
-- Insert test users
INSERT INTO users (id, email, name, role, azure_ad_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@museum.it', 'Admin User', 'ADMIN', 'azure-admin-id'),
('550e8400-e29b-41d4-a716-446655440002', 'curator@museum.it', 'Maria Rossi', 'CURATOR', 'azure-curator-id'),
('550e8400-e29b-41d4-a716-446655440003', 'researcher@museum.it', 'Giovanni Bianchi', 'RESEARCHER', 'azure-researcher-id'),
('550e8400-e29b-41d4-a716-446655440004', 'viewer@museum.it', 'Laura Verdi', 'VIEWER', 'azure-viewer-id');

-- Insert test tags
INSERT INTO tags (name) VALUES
('painting'),
('sculpture'),
('renaissance'),
('baroque'),
('portrait');
```

---

## 5. API Specification Complete

### Base URL

```
Development: http://localhost:3000/api/v1
Production: https://api.dam.museum.it/api/v1
```

### Authentication

All endpoints require Bearer token authentication except `/auth/*` endpoints.

```http
Authorization: Bearer <jwt_token>
```

### Standard Response Format

**Success (200, 201):**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

**Error (4xx, 5xx):**
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
      }
    ]
  }
}
```

### Endpoints Specification

#### Authentication Endpoints

**POST /auth/azure/callback**

Exchange Azure AD authorization code for JWT token.

```http
POST /api/v1/auth/azure/callback
Content-Type: application/json

{
  "code": "azure_authorization_code",
  "redirectUri": "http://localhost:3000/callback"
}

Response 200:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "curator@museum.it",
      "name": "Maria Rossi",
      "role": "CURATOR"
    }
  }
}
```

**POST /auth/logout**

Invalidate current session.

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Logged out successfully"
}
```

**GET /auth/me**

Get current user information.

```http
GET /api/v1/auth/me
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "curator@museum.it",
    "name": "Maria Rossi",
    "role": "CURATOR",
    "organization": "Museo Nazionale",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Asset Endpoints

**GET /assets**

List assets with pagination and filters.

```http
GET /api/v1/assets?page=1&limit=20&status=PUBLISHED&search=venus

Query Parameters:
- page: integer (default: 1)
- limit: integer (default: 20, max: 100)
- status: enum (DRAFT, PUBLISHED, ARCHIVED)
- search: string (searches title and description)
- creatorId: uuid
- dateFrom: ISO date
- dateTo: ISO date
- arcoType: ArCo URI
- sortBy: enum (createdAt, title, fileSize)
- sortOrder: enum (asc, desc) (default: desc)

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "asset-uuid",
      "title": "Venus de Milo",
      "description": "Ancient Greek sculpture",
      "filename": "venus.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 2048576,
      "thumbnailUrl": "https://...",
      "status": "PUBLISHED",
      "width": 3000,
      "height": 4000,
      "creator": {
        "id": "user-uuid",
        "name": "Maria Rossi"
      },
      "tags": ["sculpture", "greek"],
      "arcoTags": [
        {
          "category": "CULTURAL_PROPERTY_TYPE",
          "label": "scultura",
          "uri": "https://..."
        }
      ],
      "createdAt": "2024-11-01T10:00:00Z",
      "updatedAt": "2024-11-01T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

**GET /assets/:id**

Get single asset with full details.

```http
GET /api/v1/assets/550e8400-e29b-41d4-a716-446655440005

Response 200:
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "title": "Venus de Milo",
    "description": "Ancient Greek sculpture...",
    "filename": "venus.jpg",
    "mimeType": "image/jpeg",
    "fileSize": 2048576,
    "sharepointUrl": "https://sharepoint.com/...",
    "thumbnailUrl": "https://...",
    "status": "PUBLISHED",
    "publishedAt": "2024-11-01T10:00:00Z",
    "width": 3000,
    "height": 4000,
    "captureDate": "2024-10-15T14:30:00Z",
    "camera": "Canon EOS R5",
    "lens": "RF 24-70mm F2.8",
    "creator": {
      "id": "user-uuid",
      "name": "Maria Rossi",
      "email": "maria.rossi@museum.it"
    },
    "tags": [
      { "id": "tag-uuid", "name": "sculpture" }
    ],
    "arcoTags": [
      {
        "id": "arco-tag-uuid",
        "category": "CULTURAL_PROPERTY_TYPE",
        "label": "scultura",
        "notation": "OA",
        "uri": "https://w3id.org/arco/..."
      }
    ],
    "collections": [
      {
        "id": "collection-uuid",
        "name": "Greek Art"
      }
    ],
    "createdAt": "2024-11-01T10:00:00Z",
    "updatedAt": "2024-11-01T10:00:00Z"
  }
}
```

**POST /assets**

Upload new asset.

```http
POST /api/v1/assets
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: binary (required)
- title: string (required, min: 3, max: 200)
- description: string (optional, max: 2000)
- status: enum (DRAFT, PUBLISHED) (default: DRAFT)

Response 201:
{
  "success": true,
  "data": {
    "id": "new-asset-uuid",
    "title": "New Asset",
    ...
  }
}

Response 400 (Validation Error):
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

**PATCH /assets/:id**

Update asset metadata.

```http
PATCH /api/v1/assets/550e8400-e29b-41d4-a716-446655440005
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description",
  "status": "PUBLISHED"
}

Response 200:
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "title": "Updated Title",
    ...
  }
}
```

**DELETE /assets/:id**

Delete asset.

```http
DELETE /api/v1/assets/550e8400-e29b-41d4-a716-446655440005
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Asset deleted successfully"
}

Response 403:
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to delete this asset"
  }
}
```

**GET /assets/:id/download**

Download original asset file.

```http
GET /api/v1/assets/550e8400-e29b-41d4-a716-446655440005/download
Authorization: Bearer <token>

Response 200:
Content-Type: image/jpeg
Content-Disposition: attachment; filename="venus.jpg"
[binary data]
```

**GET /assets/:id/thumbnail**

Download thumbnail (300px wide).

```http
GET /api/v1/assets/550e8400-e29b-41d4-a716-446655440005/thumbnail
Authorization: Bearer <token>

Response 200:
Content-Type: image/jpeg
Content-Disposition: inline
[binary data]
```

#### Tag Endpoints

**POST /assets/:id/tags**

Add tags to asset.

```http
POST /api/v1/assets/550e8400-e29b-41d4-a716-446655440005/tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": ["sculpture", "greek", "classical"]
}

Response 200:
{
  "success": true,
  "data": {
    "added": ["sculpture", "greek", "classical"],
    "asset": { ... }
  }
}
```

**DELETE /assets/:id/tags/:tagId**

Remove tag from asset.

```http
DELETE /api/v1/assets/550e8400-e29b-41d4-a716-446655440005/tags/tag-uuid
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Tag removed successfully"
}
```

#### ArCo Endpoints

**GET /arco/vocabularies/:category**

Get ArCo vocabulary terms for category.

```http
GET /api/v1/arco/vocabularies/CULTURAL_PROPERTY_TYPE?limit=50

Response 200:
{
  "success": true,
  "data": [
    {
      "uri": "https://w3id.org/arco/resource/CulturalPropertyType/dipinto",
      "label": "dipinto",
      "definition": "Opera pittorica realizzata...",
      "notation": "OA",
      "broader": ["https://w3id.org/arco/resource/CulturalPropertyType/opera-arte"],
      "narrower": [],
      "altLabels": ["pittura", "quadro"]
    }
  ]
}
```

**GET /arco/search**

Search ArCo terms across all categories.

```http
GET /api/v1/arco/search?q=scultura&category=CULTURAL_PROPERTY_TYPE&limit=20

Response 200:
{
  "success": true,
  "data": [
    {
      "uri": "https://w3id.org/arco/resource/...",
      "category": "CULTURAL_PROPERTY_TYPE",
      "label": "scultura",
      "definition": "...",
      "notation": "OA"
    }
  ]
}
```

**POST /assets/:id/arco-tags**

Add ArCo tags to asset.

```http
POST /api/v1/assets/550e8400-e29b-41d4-a716-446655440005/arco-tags
Authorization: Bearer <token>
Content-Type: application/json

{
  "tags": [
    {
      "category": "CULTURAL_PROPERTY_TYPE",
      "arcoUri": "https://w3id.org/arco/resource/CulturalPropertyType/scultura",
      "label": "scultura",
      "notation": "OA"
    },
    {
      "category": "MATERIAL",
      "arcoUri": "https://w3id.org/arco/resource/Material/marmo",
      "label": "marmo"
    }
  ]
}

Response 200:
{
  "success": true,
  "data": {
    "added": 2,
    "asset": { ... }
  }
}
```

#### Collection Endpoints

**GET /collections**

List user's collections.

```http
GET /api/v1/collections?page=1&limit=20

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "collection-uuid",
      "name": "Greek Art",
      "description": "Collection of Greek artifacts",
      "isPublic": false,
      "assetCount": 15,
      "coverAsset": {
        "id": "asset-uuid",
        "thumbnailUrl": "https://..."
      },
      "creator": {
        "id": "user-uuid",
        "name": "Maria Rossi"
      },
      "createdAt": "2024-10-01T00:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

**POST /collections**

Create new collection.

```http
POST /api/v1/collections
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Renaissance Art",
  "description": "My collection of Renaissance pieces",
  "isPublic": false
}

Response 201:
{
  "success": true,
  "data": {
    "id": "new-collection-uuid",
    "name": "Renaissance Art",
    ...
  }
}
```

**POST /collections/:id/assets**

Add assets to collection.

```http
POST /api/v1/collections/collection-uuid/assets
Authorization: Bearer <token>
Content-Type: application/json

{
  "assetIds": [
    "asset-uuid-1",
    "asset-uuid-2",
    "asset-uuid-3"
  ]
}

Response 200:
{
  "success": true,
  "data": {
    "added": 3,
    "collection": { ... }
  }
}
```

**DELETE /collections/:id/assets/:assetId**

Remove asset from collection.

```http
DELETE /api/v1/collections/collection-uuid/assets/asset-uuid
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "message": "Asset removed from collection"
}
```

#### Search Endpoints

**POST /search**

Advanced search with multiple filters.

```http
POST /api/v1/search
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "venus",
  "filters": {
    "status": "PUBLISHED",
    "arcoTypes": [
      "https://w3id.org/arco/resource/CulturalPropertyType/scultura"
    ],
    "materials": [
      "https://w3id.org/arco/resource/Material/marmo"
    ],
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "creatorId": "user-uuid"
  },
  "page": 1,
  "limit": 20,
  "sortBy": "createdAt",
  "sortOrder": "desc"
}

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "asset-uuid",
      "title": "Venus de Milo",
      "_score": 0.95,
      ...
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "took": 45
  }
}
```

#### Dashboard Endpoints

**GET /dashboard/stats**

Get dashboard statistics.

```http
GET /api/v1/dashboard/stats
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "totalAssets": 1250,
    "assetsByStatus": {
      "DRAFT": 100,
      "PUBLISHED": 1050,
      "ARCHIVED": 100
    },
    "recentUploads": 45,
    "activeUsers": 12,
    "storageUsed": 52428800000,
    "popularTags": [
      { "name": "sculpture", "count": 250 },
      { "name": "painting", "count": 180 }
    ]
  }
}
```

---

*Due to length constraints, I'll continue with sections 6-15 in a follow-up response. The document will be continued with Frontend Components, Backend Services, Testing, and Deployment specifications.*

**[Document continues in next part...]**
