# Cultural Heritage Digital Asset Management System
## Master Implementation Guide v2.0 - PART 1

**Last Updated:** November 14, 2024  
**Target Audience:** Development Team, Product Managers, Technical Architects  
**Repository Strategy:** Separated Repositories Architecture  
**Status:** Production Ready

---

## Document Structure

This is **Part 1 of 3** of the Master Implementation Guide:

- **Part 1** (this document): Executive Summary, Vision, Architecture, Tech Stack, Setup, Core Patterns
- **Part 2**: Database, Auth, API, Frontend, MCP Integration, ArCo Strategy
- **Part 3**: Security, Performance, Testing, Deployment, Monitoring, Documentation

**Read all three parts for complete system understanding.**

---

## Table of Contents - Part 1

1. [Executive Summary](#1-executive-summary)
2. [Vision & Strategic Goals](#2-vision--strategic-goals)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Technology Stack](#4-technology-stack)
5. [Repository Structure](#5-repository-structure)
6. [Development Environment Setup](#6-development-environment-setup)
7. [Core Architectural Patterns](#7-core-architectural-patterns)

---

## 1. Executive Summary

### Project Overview

Il **Cultural Heritage Digital Asset Management System** è una piattaforma enterprise-grade progettata specificamente per la gestione del patrimonio culturale digitale italiano. Il sistema integra SharePoint come backend storage con le ontologie ArCo (Architecture of Knowledge) del Ministero della Cultura per fornire:

- **Gestione centralizzata** di asset digitali culturali (immagini, documenti, reperti digitalizzati)
- **Tagging semantico standardizzato** conforme agli standard ICCD (Istituto Centrale per il Catalogo e la Documentazione)
- **Ricerca avanzata** con query semantiche basate su vocabolari controllati nazionali
- **Workflow di catalogazione** professionali per operatori culturali
- **Interoperabilità** con altri sistemi del patrimonio culturale italiano

### Key Differentiators

1. **ArCo Integration**: Unico DAM italiano nativamente integrato con le ontologie culturali nazionali (169M triple RDF, 800k+ schede catalografiche)
2. **SharePoint Backend**: Sfrutta l'infrastruttura Microsoft esistente nelle istituzioni culturali
3. **ICCD Compliance**: Esportazione schede catalografiche conformi agli standard ministeriali
4. **Linked Open Data**: Pubblicazione dati in formato LOD per interoperabilità nazionale

### Project Evolution

Il progetto è evoluto attraverso 11 fasi chiave:

1. **Fase Iniziale**: Riorganizzazione libreria immagini SharePoint con eliminazione duplicati
2. **Autenticazione MFA**: Integrazione Service Principal con certificati per automazione
3. **Visione DAM**: Espansione verso sistema completo tipo Fotoware
4. **Specifiche Tecniche**: Documento 20 sezioni con 10 tool MCP
5. **Raffinamento Funzionale**: Focus su requisiti senza codice implementativo
6. **Roadmap Completa**: 150+ requisiti catalogati in 11 categorie
7. **🔥 SVOLTA ArCo**: Integrazione ontologie culturali (211 menzioni nella conversazione)
8. **Architettura Documenti**: Decisione 3 documenti separati (hybrid approach)
9. **Repository Separati**: Microservizi DAM + MCP Server
10. **Produzione Documenti**: Artifacts markdown operativi
11. **Master Guide**: Questo documento per Claude Code

### Success Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| Asset Management Performance | < 2s load time for 10k assets | MVP |
| ArCo Tagging Accuracy | > 95% standard compliance | Phase 1 |
| User Adoption Rate | > 80% active catalogatori | 6 months |
| Search Precision | > 90% relevance score | Phase 2 |
| System Uptime | 99.5% availability | Production |

### Timeline Overview

- **Phase 0**: Foundation (Completed) - MCP Server riorganizzazione SharePoint
- **Phase 1**: MVP Core DAM (Months 1-4) - 25 requisiti
- **Phase 2**: Enhanced Features (Months 5-7) - 35 requisiti  
- **Phase 3**: AI & Analytics (Months 8-11) - 20 requisiti
- **Phase 4**: Enterprise & Ecosystem (Months 12-15) - 25 requisiti
- **Phase 5**: Advanced & Specialized (Months 16-24+) - 40+ requisiti

**Total Timeline**: 18-24 mesi per sistema enterprise-grade completo

---

## 2. Vision & Strategic Goals

### Long-Term Vision

Diventare la **piattaforma di riferimento per la gestione digitale del patrimonio culturale italiano**, integrando:

- Musei nazionali e regionali
- Archivi storici  
- Biblioteche
- Soprintendenze
- Università e centri di ricerca

### Strategic Objectives

**Business Objectives:**

1. **Efficienza Operativa**: Riduzione 60% tempo catalogazione manuale
2. **Qualità Dati**: 95% conformità standard ICCD
3. **Accessibilità**: 24/7 availability per ricercatori globali
4. **Sostenibilità**: Costi operativi < €50k/anno per istituzione media
5. **Scalabilità**: Supporto 10M+ asset per installazione enterprise

**Technical Objectives:**

1. **Performance**: < 2s response time per operazioni comuni
2. **Reliability**: 99.5% uptime con backup automatico
3. **Security**: Conformità GDPR e standard MiC
4. **Maintainability**: Codebase modulare con 80%+ test coverage
5. **Extensibility**: API pubblica per integrazioni terze parti

### Phase Breakdown

#### Phase 0: Foundation ✅ (Completed)

**Obiettivo**: MCP Server per riorganizzazione SharePoint

**Features Implementate:**
- Scansione libreria SharePoint
- Eliminazione duplicati con hash SHA256
- Tagging automatico basato su struttura cartelle
- Riorganizzazione gerarchica (max 3 livelli)
- Incorporamento tag EXIF per persistenza

**Outcome**: Base tecnica per operazioni SharePoint automation

#### Phase 1: MVP Core DAM (Months 1-4)

**Obiettivo**: Sistema DAM funzionale con ArCo tagging

**Core Features** (25 requisiti):
- Asset upload con metadata extraction (EXIF, IPTC)
- ArCo tagging manuale (8 categorie)
- Search avanzato con filtri ArCo
- Collections/lightbox personali
- Download multipli formati
- Gestione permessi base (4 ruoli)
- Audit trail completo

**ArCo Integration**:
- Vocabulary cache service (PostgreSQL + Redis)
- Autocomplete intelligente
- Hierarchical term selection
- SPARQL query integration
- Weekly vocabulary sync

**Deliverables**:
- Frontend React funzionale
- Backend API Node.js completa
- Database PostgreSQL setup
- ArCo vocabulary cache operativo
- Documentazione API (OpenAPI 3.0)

#### Phase 2: Enhanced Features (Months 5-7)

**Obiettivo**: Potenziamento funzionalità e UX

**Features** (35 requisiti):
- AI auto-tagging (Azure Cognitive Services)
- Visual similarity search
- Workflow approvazione asset
- Bulk operations avanzate
- Versioning asset
- Advanced ArCo browser
- Export formats (ICCD XML, RDF, JSON-LD)

**Performance**:
- Elasticsearch full integration
- CDN per asset delivery
- Image optimization pipeline

#### Phase 3: AI & Analytics (Months 8-11)

**Obiettivo**: Intelligence e insights

**Features** (20 requisiti):
- ML per suggerimenti ArCo automatici
- Predictive tagging
- Quality scoring automatico
- Analytics dashboard avanzata
- Usage statistics
- Trend analysis
- Custom reports

#### Phase 4: Enterprise & Ecosystem (Months 12-15)

**Obiettivo**: Scalabilità enterprise e integrazioni

**Features** (25 requisiti):
- Multi-tenancy per istituzioni multiple
- Integrazioni Teams, Power BI, SharePoint
- API pubblica per terze parti
- Mobile app iOS/Android
- SSO avanzato
- White-labeling

#### Phase 5: Advanced & Specialized (Months 16-24+)

**Obiettivo**: Funzionalità avanzate settore culturale

**Features** (40+ requisiti):
- Export CIDOC-CRM completo
- 3D asset support
- Virtual exhibitions
- Blockchain provenance tracking
- IIIF implementation
- Crowdsourcing tagging
- Advanced conservation tracking

---

## 3. System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LAYER                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile App  │  │  Admin Panel │     │
│  │  (React 18)  │  │ (React Nat.) │  │   (React)    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │ HTTPS/REST
┌─────────────────────────────┼─────────────────────────────────┐
│                    APPLICATION LAYER                          │
│         ┌────────────────────┴──────────────────┐            │
│         │   API Gateway (Node.js + Express)     │            │
│         │   - Authentication middleware          │            │
│         │   - Rate limiting                      │            │
│         │   - Request validation                 │            │
│         └────────┬──────────────────────┬────────┘            │
│                  │                      │                     │
│         ┌────────▼─────────┐   ┌───────▼────────┐           │
│         │  Asset Service   │   │  ArCo Service  │           │
│         │  - Upload        │   │  - Vocabulary  │           │
│         │  - Metadata      │   │  - SPARQL      │           │
│         │  - Collections   │   │  - Tagging     │           │
│         └────────┬─────────┘   └───────┬────────┘           │
│                  │                      │                     │
│         ┌────────▼─────────┐   ┌───────▼────────┐           │
│         │  Search Service  │   │  MCP Client    │           │
│         │  - Elasticsearch │   │  - Job Queue   │           │
│         │  - Semantic      │   │  - Status Poll │           │
│         └──────────────────┘   └───────┬────────┘           │
└────────────────────────────────────────┼──────────────────────┘
                                         │ HTTP/REST
┌────────────────────────────────────────┼──────────────────────┐
│                    MCP SERVER LAYER (Separate Repo)          │
│                  ┌─────────────────────▼─────────────────┐   │
│                  │   MCP Server (Microservice)           │   │
│                  │   - scan_library                       │   │
│                  │   - detect_duplicates                  │   │
│                  │   - tag_images                         │   │
│                  │   - reorganize_structure               │   │
│                  └─────────────┬──────────────────────────┘   │
└────────────────────────────────┼──────────────────────────────┘
                                 │ Graph API
┌────────────────────────────────┼──────────────────────────────┐
│                    STORAGE LAYER                              │
│  ┌─────────────────┴─────────┐   ┌──────────────────────┐    │
│  │  SharePoint Online        │   │  PostgreSQL 14       │    │
│  │  - Binary storage         │   │  - Asset metadata    │    │
│  │  - Document libraries     │   │  - User data         │    │
│  │  - Permission mgmt        │   │  - Collections       │    │
│  └───────────────────────────┘   │  - ArCo cache        │    │
│                                   └──────────────────────┘    │
│  ┌───────────────────────────┐   ┌──────────────────────┐    │
│  │  Redis 7                  │   │  ArCo SPARQL         │    │
│  │  - Session cache          │   │  Endpoint (External) │    │
│  │  - Job queue              │   │  - Vocabulary data   │    │
│  │  - ArCo vocabulary cache  │   │  - Ontologies        │    │
│  └───────────────────────────┘   └──────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns**: DAM e MCP Server sono repository separati
2. **Microservices**: MCP Server è un microservizio autonomo con API REST
3. **API-First**: Comunicazione esclusivamente via REST API documentate
4. **Stateless Services**: Scalabilità orizzontale garantita
5. **Event-Driven**: Code async (Bull + Redis) per operazioni lunghe
6. **Cache-Heavy**: Redis per performance e ArCo vocabulary caching
7. **Security by Design**: Auth layer centralizzato, audit trail completo

### Repository Strategy: Separated Architecture

**Decisione Chiave** (ADR-001): Due repository separati invece di monorepo

**Rationale**:
- ✅ Sviluppo parallelo indipendente
- ✅ Deploy indipendente (DAM può essere aggiornato senza MCP)
- ✅ Scalabilità separata (MCP può avere più istanze)
- ✅ Testing isolato
- ✅ Ownership chiaro dei componenti
- ✅ Cicli di release differenti

**Repository 1**: `cultural-heritage-dam`
- Frontend React
- Backend API Node.js
- Database PostgreSQL
- **MCP Client** (consuma servizi dal MCP server remoto)

**Repository 2**: `cultural-heritage-mcp`
- MCP Server standalone
- Tool per SharePoint (scan, tag, reorganize)
- Servizi immagini
- Database SQLite locale

**Comunicazione**:
```
DAM Backend ──HTTP/REST──> MCP Server ──Graph API──> SharePoint
     ↓              ↑
  Job Queue    Polling
```

### Data Flow Example: Asset Upload with ArCo Tagging

```
1. User uploads image → Frontend React Component
2. POST /api/assets/upload → API Gateway (auth check)
3. Asset Service:
   - Store file → SharePoint via Graph API
   - Extract EXIF → sharp library
   - Insert metadata → PostgreSQL
   - Index → Elasticsearch
4. User applies ArCo tags → Tagging UI Component
5. POST /api/assets/{id}/tags/arco → API Gateway
6. ArCo Service:
   - Validate terms → SPARQL query or cache
   - Resolve URIs → ArCo endpoint
   - Store mappings → PostgreSQL (asset_arco_tags table)
   - Update search index → Elasticsearch
7. Background job updates SharePoint custom columns
8. Return success → Frontend updates UI
```

---

## 4. Technology Stack

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React | 18.2+ | UI components |
| **State Management** | Redux Toolkit | 2.0+ | Global state |
| **Routing** | React Router | 6.x | Navigation |
| **UI Library** | Metronic Theme | 8.x | Professional UI components |
| **Forms** | React Hook Form | 7.x | Form management & validation |
| **HTTP Client** | Axios | 1.6+ | API calls |
| **Date Handling** | date-fns | 2.x | Date utilities |
| **Image Handling** | react-image-crop | 10.x | Crop/resize |
| **Charts** | Chart.js + react-chartjs-2 | 5.x | Analytics dashboards |
| **Rich Text** | TipTap | 2.x | Metadata descriptions |
| **Testing** | Jest + React Testing Library | 29.x | Unit/integration tests |

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | 20 LTS | Server runtime |
| **Framework** | Express.js | 4.18+ | REST API framework |
| **Language** | TypeScript | 5.3+ | Type safety |
| **ORM** | Prisma | 5.x | Database access & migrations |
| **Authentication** | Passport.js | 0.7+ | Auth strategies (Azure AD) |
| **Validation** | Joi | 17.x | Request validation |
| **File Processing** | Sharp | 0.33+ | Image manipulation |
| **PDF Generation** | PDFKit | 0.14+ | Export reports |
| **Job Queue** | Bull | 4.x | Background jobs (Redis-based) |
| **Email** | Nodemailer | 6.x | Notifications |
| **Testing** | Jest + Supertest | 29.x | API testing |

### Database & Storage

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Primary DB** | PostgreSQL | 14+ | Relational data (assets, users, collections) |
| **Cache** | Redis | 7+ | Session, job queue, ArCo vocabulary cache |
| **Search Engine** | Elasticsearch | 8.x | Full-text search, semantic search |
| **File Storage** | SharePoint Online | Latest | Binary assets (images, documents) |
| **Backup** | pg_dump + Azure Blob | - | Daily automated backups |

### External Services & APIs

| Service | Purpose | Documentation |
|---------|---------|---------------|
| **Microsoft Graph API** | SharePoint access | https://docs.microsoft.com/graph |
| **Azure AD** | Authentication (MFA support) | https://docs.microsoft.com/azure/active-directory |
| **ArCo SPARQL Endpoint** | Vocabulary queries | https://dati.beniculturali.it/sparql |
| **Azure Cognitive Services** | AI tagging (Phase 2) | https://azure.microsoft.com/cognitive-services |

### DevOps & Infrastructure

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Containerization** | Docker | Development & production environments |
| **Orchestration** | Docker Compose (dev), Kubernetes (prod) | Container management |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Monitoring** | Prometheus + Grafana | Metrics collection & dashboards |
| **Logging** | Winston + ELK Stack | Centralized logging |
| **Error Tracking** | Sentry | Error monitoring & alerting |
| **API Docs** | Swagger/OpenAPI 3.0 | Interactive API documentation |

### Technology Choices Rationale

**PostgreSQL over MongoDB**:
- ✅ Strong relational integrity (foreign keys, constraints)
- ✅ Superior JSON support (JSONB) for flexible metadata
- ✅ Full-text search capabilities (tsvector)
- ✅ Mature transaction support
- ✅ Better for complex queries with joins

**Redis over Memcached**:
- ✅ Richer data structures (lists, sets, sorted sets)
- ✅ Persistence options
- ✅ Pub/Sub for real-time features
- ✅ Better for job queues (Bull integration)

**Elasticsearch over PostgreSQL Full-Text**:
- ✅ Purpose-built for search
- ✅ Better performance at scale
- ✅ Advanced features (fuzzy search, semantic expansion)
- ✅ Easy horizontal scaling

**React over Vue/Angular**:
- ✅ Larger ecosystem
- ✅ Better TypeScript support
- ✅ More mature component libraries
- ✅ Team expertise

**Prisma over TypeORM**:
- ✅ Better TypeScript integration
- ✅ Superior migration tooling
- ✅ Type-safe queries
- ✅ Better documentation

---

## 5. Repository Structure

### Repository 1: `cultural-heritage-dam` (Main Application)

```
cultural-heritage-dam/
│
├── frontend/                    # React frontend application
│   ├── public/
│   │   ├── index.html
│   │   └── assets/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── atoms/          # Basic elements (Button, Input, Label)
│   │   │   ├── molecules/      # Simple combinations (FormField, SearchBar)
│   │   │   ├── organisms/      # Complex components (AssetCard, ArCoTagSelector)
│   │   │   ├── templates/      # Page layouts
│   │   │   └── pages/          # Full pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── store/              # Redux store configuration
│   │   │   ├── slices/         # Redux slices (assets, collections, arco)
│   │   │   └── index.ts
│   │   ├── services/           # API client services
│   │   │   ├── api.service.ts
│   │   │   ├── asset.service.ts
│   │   │   ├── arco.service.ts
│   │   │   └── mcp-client.service.ts
│   │   ├── utils/              # Helper functions
│   │   ├── types/              # TypeScript type definitions
│   │   ├── App.tsx             # Root component
│   │   └── index.tsx           # Entry point
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # Node.js API server
│   ├── src/
│   │   ├── controllers/        # Route controllers
│   │   │   ├── asset.controller.ts
│   │   │   ├── collection.controller.ts
│   │   │   ├── arco.controller.ts
│   │   │   └── auth.controller.ts
│   │   ├── services/           # Business logic
│   │   │   ├── asset.service.ts
│   │   │   ├── arco.service.ts
│   │   │   ├── arco-sync.service.ts
│   │   │   ├── search.service.ts
│   │   │   ├── mcp-client.service.ts
│   │   │   └── sharepoint.service.ts
│   │   ├── repositories/       # Data access layer
│   │   │   ├── asset.repository.ts
│   │   │   └── user.repository.ts
│   │   ├── models/             # Prisma models
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── rate-limit.middleware.ts
│   │   ├── routes/             # API routes
│   │   │   ├── assets.routes.ts
│   │   │   ├── collections.routes.ts
│   │   │   ├── arco.routes.ts
│   │   │   └── auth.routes.ts
│   │   ├── utils/              # Helper functions
│   │   ├── config/             # Configuration files
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── azure-ad.ts
│   │   └── index.ts            # Entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   ├── tests/                  # Backend tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                      # Shared code between frontend/backend
│   ├── types/
│   │   ├── asset.types.ts
│   │   ├── arco.types.ts
│   │   └── user.types.ts
│   └── constants/
│
├── docker/                      # Docker configurations
│   ├── Dockerfile.frontend
│   ├── Dockerfile.backend
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml
│
├── docs/                        # Documentation
│   ├── api/                    # API documentation
│   ├── architecture/           # Architecture diagrams & ADRs
│   │   └── decisions/          # Architectural Decision Records
│   └── deployment/             # Deployment guides
│
├── scripts/                     # Utility scripts
│   ├── setup-dev.sh
│   ├── seed-db.ts
│   └── migrate-data.ts
│
├── .github/                     # GitHub Actions workflows
│   └── workflows/
│       ├── ci.yml
│       ├── test.yml
│       └── deploy.yml
│
├── .env.example                 # Environment variables template
├── .gitignore
├── README.md                    # Project documentation
└── package.json                 # Root package.json (workspaces)
```

### Repository 2: `cultural-heritage-mcp` (MCP Microservice)

```
cultural-heritage-mcp/
│
├── src/
│   ├── tools/                   # MCP tools implementation
│   │   ├── scan-library.ts
│   │   ├── detect-duplicates.ts
│   │   ├── tag-images.ts
│   │   ├── reorganize-structure.ts
│   │   └── analyze-library.ts
│   ├── services/
│   │   ├── sharepoint.service.ts    # Graph API client
│   │   ├── image.service.ts         # Sharp, ExifTool
│   │   ├── deduplication.service.ts # Hash comparison
│   │   └── metadata.service.ts      # EXIF/IPTC handling
│   ├── database/
│   │   ├── schema.sql          # SQLite schema
│   │   ├── migrations/
│   │   └── operations.db.ts    # Database operations
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── config/
│   │   ├── azure-ad.config.ts
│   │   └── server.config.ts
│   ├── routes/
│   │   ├── operations.routes.ts
│   │   └── health.routes.ts
│   └── index.ts                # MCP server entry point
│
├── tests/                       # Unit & integration tests
│   ├── unit/
│   └── integration/
│
├── docker/
│   └── Dockerfile
│
├── docs/
│   ├── API.md                  # REST API specification
│   └── TOOLS.md                # MCP tools documentation
│
├── .env.example
├── package.json
└── README.md
```

### Key Design Decisions

1. **Separate Repositories**: Sviluppo parallelo, deploy indipendente
2. **Monorepo Frontend/Backend** (Repo 1): Facilita condivisione tipi TypeScript
3. **Shared Package**: Tipi comuni accessibili a frontend e backend
4. **Docker per Tutti**: Consistency ambiente dev/prod
5. **Prisma ORM**: Type-safe database access con migrations automatiche

---

## 6. Development Environment Setup

### Prerequisites

| Software | Minimum Version | Purpose | Installation |
|----------|----------------|---------|--------------|
| Node.js | 20.x LTS | Runtime | https://nodejs.org |
| npm | 10.x | Package manager | Included with Node.js |
| Docker | 24.x | Containerization | https://docker.com |
| Docker Compose | 2.x | Multi-container | Included with Docker Desktop |
| PostgreSQL | 14.x | Database | Via Docker or native |
| Redis | 7.x | Cache & queue | Via Docker or native |
| Git | 2.x | Version control | https://git-scm.com |

### Step 1: Clone Repositories

```bash
# Main DAM repository
git clone https://github.com/your-org/cultural-heritage-dam.git
cd cultural-heritage-dam

# MCP Server repository (separate terminal)
git clone https://github.com/your-org/cultural-heritage-mcp.git
cd cultural-heritage-mcp
```

### Step 2: Environment Configuration

**DAM Repository (`.env`):**

```env
# Database
DATABASE_URL="postgresql://dam_user:password@localhost:5432/dam_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Azure AD Authentication
AZURE_AD_TENANT_ID="your-tenant-id"
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"

# SharePoint
SHAREPOINT_SITE_URL="https://yourtenant.sharepoint.com/sites/DAM"

# MCP Server Connection
MCP_SERVER_URL="http://localhost:3001"
MCP_SERVER_API_KEY="your-secure-api-key-min-32-chars"

# ArCo
ARCO_SPARQL_ENDPOINT="https://dati.beniculturali.it/sparql"
ARCO_CACHE_TTL=604800  # 1 week in seconds

# Server
PORT=3000
NODE_ENV=development
JWT_SECRET="your-jwt-secret-min-32-chars"

# Elasticsearch
ELASTICSEARCH_URL="http://localhost:9200"

# Frontend
REACT_APP_API_URL="http://localhost:3000/api"
```

**MCP Server Repository (`.env`):**

```env
# Database (SQLite)
DATABASE_PATH="./data/mcp.db"

# Azure AD Service Principal (Certificate-Based)
AZURE_TENANT_ID="your-tenant-id"
AZURE_CLIENT_ID="your-sp-client-id"
# Option 1: Client Secret
AZURE_CLIENT_SECRET="your-sp-secret"
# Option 2: Certificate (preferred for production)
AZURE_CERTIFICATE_PATH="/path/to/cert.pem"
AZURE_CERTIFICATE_THUMBPRINT="cert-thumbprint"

# SharePoint
SHAREPOINT_SITE_URL="https://yourtenant.sharepoint.com/sites/DAM"

# Server
PORT=3001
API_KEY="your-secure-api-key-min-32-chars"
LOG_LEVEL="debug"

# Performance Tuning
MAX_CONCURRENT_OPERATIONS=5
BATCH_SIZE=100
```

### Step 3: Install Dependencies

**DAM Repository:**

```bash
cd cultural-heritage-dam

# Install root dependencies (workspace configuration)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Install backend dependencies
cd backend && npm install && cd ..
```

**MCP Server Repository:**

```bash
cd cultural-heritage-mcp
npm install
```

### Step 4: Database Setup

**DAM PostgreSQL:**

```bash
cd cultural-heritage-dam/backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with test data (optional)
npm run seed
```

**MCP SQLite:**

```bash
cd cultural-heritage-mcp

# Initialize database
npm run db:init

# Run migrations
npm run db:migrate
```

### Step 5: Start Services with Docker Compose

**DAM Services (PostgreSQL, Redis, Elasticsearch):**

```bash
cd cultural-heritage-dam
docker-compose -f docker/docker-compose.dev.yml up -d

# Verify services are running
docker-compose ps

# Expected output:
# postgresql       Up      0.0.0.0:5432->5432/tcp
# redis            Up      0.0.0.0:6379->6379/tcp
# elasticsearch    Up      0.0.0.0:9200->9200/tcp
```

### Step 6: Start Development Servers

**Terminal 1 - DAM Backend:**
```bash
cd cultural-heritage-dam/backend
npm run dev

# Expected output:
# Server running on http://localhost:3000
# Database connected
# Redis connected
```

**Terminal 2 - DAM Frontend:**
```bash
cd cultural-heritage-dam/frontend
npm start

# Expected output:
# Compiled successfully!
# Local: http://localhost:3001
```

**Terminal 3 - MCP Server:**
```bash
cd cultural-heritage-mcp
npm run dev

# Expected output:
# MCP Server running on http://localhost:3001
# Database initialized
```

### Step 7: Verify Setup

Check the following endpoints:

1. **Frontend**: http://localhost:3001
2. **Backend API**: http://localhost:3000/api/health
3. **MCP Server**: http://localhost:3001/health
4. **Swagger Docs**: http://localhost:3000/api-docs
5. **PostgreSQL**: `psql -h localhost -p 5432 -U dam_user -d dam_db`
6. **Redis**: `redis-cli ping` (should return "PONG")
7. **Elasticsearch**: http://localhost:9200

### Common Setup Issues & Solutions

**Issue: PostgreSQL connection refused**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart service
docker-compose restart postgres
```

**Issue: Redis connection timeout**
```bash
# Verify Redis is accessible
redis-cli ping

# Should return "PONG"

# Check if running in Docker
docker ps | grep redis
```

**Issue: MCP Server unreachable from DAM Backend**
```bash
# Test MCP Server health endpoint
curl http://localhost:3001/health

# Check MCP server logs
cd cultural-heritage-mcp && npm run dev

# Verify API key matches in both .env files
```

**Issue: ArCo SPARQL endpoint timeout**
```bash
# Test ArCo endpoint directly
curl -X POST https://dati.beniculturali.it/sparql \
  -H "Content-Type: application/sparql-query" \
  -d "SELECT * WHERE { ?s ?p ?o } LIMIT 1"

# If timeout, endpoint might be temporarily down
# ArCo vocabulary cache will handle gracefully
```

### Development Tools Recommendations

| Tool | Purpose | Link |
|------|---------|------|
| **VS Code** | Primary IDE | https://code.visualstudio.com/ |
| **Postman** | API testing | https://www.postman.com/ |
| **DBeaver** | Database GUI | https://dbeaver.io/ |
| **Redis Insight** | Redis GUI | https://redis.com/redis-enterprise/redis-insight/ |
| **Elasticsearch Head** | ES visualization | https://github.com/mobz/elasticsearch-head |

### VS Code Extensions

Add to `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "Prisma.prisma",
    "ms-azuretools.vscode-docker",
    "mikestead.dotenv",
    "humao.rest-client",
    "GraphQL.vscode-graphql",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## 7. Core Architectural Patterns

### Pattern 1: Service Layer Pattern

**Purpose**: Separare business logic dai controller per testabilità e riusabilità.

**Structure**:
```
Controller → Service → Repository → Database
         ↘  External API
```

**Implementation Example**:

```typescript
// backend/src/controllers/asset.controller.ts
export class AssetController {
  constructor(private assetService: AssetService) {}

  async uploadAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const metadata = CreateAssetDto.validate(req.body);
      const userId = req.user!.id;
      
      const asset = await this.assetService.uploadAsset(file, metadata, userId);
      
      res.status(201).json({
        success: true,
        data: asset
      });
    } catch (error) {
      next(error);
    }
  }
}

// backend/src/services/asset.service.ts
export class AssetService {
  constructor(
    private assetRepository: AssetRepository,
    private sharepointService: SharepointService,
    private searchService: SearchService,
    private auditService: AuditService
  ) {}

  async uploadAsset(
    file: Express.Multer.File,
    metadata: CreateAssetDto,
    userId: string
  ): Promise<Asset> {
    // 1. Upload to SharePoint
    const sharepointUrl = await this.sharepointService.uploadFile(
      file.buffer,
      file.originalname
    );
    
    // 2. Extract EXIF metadata
    const exif = await this.extractExifMetadata(file.buffer);
    
    // 3. Save to database
    const asset = await this.assetRepository.create({
      ...metadata,
      filename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      sharepointUrl,
      ...exif,
      creatorId: userId
    });
    
    // 4. Index in Elasticsearch (async)
    await this.searchService.indexAsset(asset);
    
    // 5. Audit trail
    await this.auditService.log({
      action: 'ASSET_CREATE',
      entityType: 'Asset',
      entityId: asset.id,
      userId
    });
    
    return asset;
  }

  private async extractExifMetadata(buffer: Buffer): Promise<ExifData> {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      // Extract more EXIF data as needed
    };
  }
}
```

**Benefits**:
- ✅ Business logic testable in isolation
- ✅ Reusable across multiple controllers
- ✅ Clear separation of concerns
- ✅ Easy to mock dependencies in tests

### Pattern 2: Repository Pattern

**Purpose**: Astrarre accesso ai dati per facilitare testing e cambio di storage.

**Implementation Example**:

```typescript
// backend/src/repositories/asset.repository.ts
export class AssetRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: CreateAssetData): Promise<Asset> {
    return await this.prisma.asset.create({
      data,
      include: {
        tags: true,
        arcoTags: true,
        creator: true
      }
    });
  }

  async findById(id: string): Promise<Asset | null> {
    return await this.prisma.asset.findUnique({
      where: { id },
      include: {
        tags: true,
        arcoTags: true,
        collections: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async search(filters: AssetSearchFilters): Promise<PaginatedResult<Asset>> {
    const where = this.buildWhereClause(filters);
    
    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        include: {
          tags: true,
          arcoTags: true
        },
        orderBy: { createdAt: 'desc' },
        take: filters.limit,
        skip: filters.offset
      }),
      this.prisma.asset.count({ where })
    ]);
    
    return {
      items: assets,
      total,
      page: Math.floor(filters.offset / filters.limit) + 1,
      limit: filters.limit
    };
  }

  private buildWhereClause(filters: AssetSearchFilters): Prisma.AssetWhereInput {
    const where: Prisma.AssetWhereInput = {};
    
    if (filters.title) {
      where.title = { contains: filters.title, mode: 'insensitive' };
    }
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.arcoTypes && filters.arcoTypes.length > 0) {
      where.arcoTags = {
        some: {
          category: 'CULTURAL_PROPERTY_TYPE',
          arcoUri: { in: filters.arcoTypes }
        }
      };
    }
    
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }
    
    return where;
  }
}
```

**Benefits**:
- ✅ Database agnostic (easy to switch from Prisma to another ORM)
- ✅ Testable with mock data
- ✅ Centralized query logic
- ✅ Type-safe with Prisma

### Pattern 3: DTO (Data Transfer Object) Pattern

**Purpose**: Validare e trasformare dati tra layers con type safety.

**Implementation Example**:

```typescript
// backend/src/dto/asset.dto.ts
import Joi from 'joi';

export class CreateAssetDto {
  title!: string;
  description?: string;
  culturalPropertyType?: string;
  materials?: string[];
  technique?: string;
  author?: string;
  datation?: string;
  location?: string;

  static validationSchema = Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(2000).optional(),
    culturalPropertyType: Joi.string().uri().optional(),
    materials: Joi.array().items(Joi.string().uri()).optional(),
    technique: Joi.string().uri().optional(),
    author: Joi.string().uri().optional(),
    datation: Joi.string().uri().optional(),
    location: Joi.string().uri().optional()
  });

  static validate(data: unknown): CreateAssetDto {
    const { error, value } = this.validationSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      throw new ValidationError(error.details.map(d => ({
        field: d.path.join('.'),
        message: d.message
      })));
    }
    
    return value;
  }
}

export class UpdateAssetDto {
  title?: string;
  description?: string;
  status?: AssetStatus;

  static validationSchema = Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').optional()
  });

  static validate(data: unknown): UpdateAssetDto {
    const { error, value } = this.validationSchema.validate(data);
    if (error) throw new ValidationError(error.details);
    return value;
  }
}
```

**Benefits**:
- ✅ Input validation at API boundary
- ✅ Type safety throughout application
- ✅ Clear API contracts
- ✅ Automatic documentation with OpenAPI

### Pattern 4: Middleware Chain Pattern

**Purpose**: Processare requests in modo modulare e riusabile.

**Implementation Example**:

```typescript
// backend/src/middleware/auth.middleware.ts
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// backend/src/middleware/authorize.middleware.ts
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
};

// backend/src/middleware/validate-dto.middleware.ts
export const validateDto = <T>(dtoClass: { validate: (data: any) => T }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = dtoClass.validate(req.body);
      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.details
        });
      }
      next(error);
    }
  };
};

// Usage in routes
router.post(
  '/assets',
  authenticate,
  authorize('CURATOR', 'ADMIN'),
  upload.single('file'),
  validateDto(CreateAssetDto),
  assetController.uploadAsset
);
```

**Benefits**:
- ✅ Modular and reusable
- ✅ Easy to test independently
- ✅ Clear request processing pipeline
- ✅ Composable security layers

### Pattern 5: Error Handling Pattern

**Purpose**: Gestire errori in modo consistente in tutta l'applicazione.

**Implementation Example**:

```typescript
// backend/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(404, `${resource} with id ${id} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(public details: ValidationErrorDetail[]) {
    super(400, 'Validation failed');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

// backend/src/middleware/error.middleware.ts
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    const response: any = {
      success: false,
      error: err.message
    };
    
    if (err instanceof ValidationError) {
      response.details = err.details;
    }
    
    return res.status(err.statusCode).json(response);
  }

  // Log unexpected errors
  logger.error('Unexpected error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't expose internal errors to client
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};
```

### Pattern 6: Async Job Queue Pattern

**Purpose**: Gestire operazioni lunghe in background senza bloccare API.

**Implementation Example**:

```typescript
// backend/src/services/job-queue.service.ts
import Bull from 'bull';

export class JobQueueService {
  private queue: Bull.Queue;

  constructor() {
    this.queue = new Bull('asset-processing', {
      redis: process.env.REDIS_URL
    });

    this.setupProcessors();
  }

  private setupProcessors() {
    // MCP reorganize library job
    this.queue.process('reorganize-library', 3, async (job) => {
      const { libraryId, strategy } = job.data;
      
      job.log(`Starting library reorganization: ${libraryId}`);
      
      try {
        await this.mcpClientService.reorganizeLibrary(libraryId, strategy, {
          onProgress: (progress) => {
            job.progress(progress);
            job.log(`Progress: ${progress}%`);
          }
        });
        
        job.log('Reorganization completed successfully');
      } catch (error) {
        job.log(`Error: ${error.message}`);
        throw error;
      }
    });

    // Bulk tagging job
    this.queue.process('bulk-tag', 5, async (job) => {
      const { assetIds, tags } = job.data;
      
      for (let i = 0; i < assetIds.length; i++) {
        await this.assetService.addTags(assetIds[i], tags);
        job.progress((i + 1) / assetIds.length * 100);
      }
    });
    
    // ArCo vocabulary sync job
    this.queue.process('arco-sync', 1, async (job) => {
      const { category } = job.data;
      
      const count = await this.arcoSyncService.syncVocabulary(category);
      
      return { syncedTerms: count };
    });
  }

  async addJob(name: string, data: any, options?: Bull.JobOptions): Promise<string> {
    const job = await this.queue.add(name, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      },
      removeOnComplete: false,
      ...options
    });
    
    return job.id.toString();
  }

  async getJobStatus(jobId: string): Promise<JobStatus> {
    const job = await this.queue.getJob(jobId);
    
    if (!job) {
      throw new NotFoundError('Job', jobId);
    }
    
    const state = await job.getState();
    const progress = job.progress();
    const logs = await this.queue.getJobLogs(jobId);
    
    return {
      id: job.id.toString(),
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      logs: logs.logs,
      createdAt: new Date(job.timestamp),
      processedAt: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedAt: job.finishedOn ? new Date(job.finishedOn) : undefined
    };
  }
}
```

### Pattern 7: Cache-Aside Pattern

**Purpose**: Migliorare performance con caching strategico.

**Implementation Example**:

```typescript
// backend/src/services/cache.service.ts
import { Redis } from 'ioredis';

export class CacheService {
  constructor(private redis: Redis) {}
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async set(key: string, value: any, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }
  
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }
  
  // Cache wrapper with automatic fetch
  async wrap<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }
    
    // Fetch fresh data
    const fresh = await fetchFn();
    
    // Cache for next time
    await this.set(key, fresh, ttl);
    
    return fresh;
  }
}

// Usage in ArCo Service
export class ArcoService {
  constructor(private cacheService: CacheService) {}
  
  async getTerm(uri: string): Promise<ArCoTerm | null> {
    return await this.cacheService.wrap(
      `arco:term:${uri}`,
      604800, // 1 week
      async () => {
        // Fetch from SPARQL endpoint
        return await this.fetchTermFromSparql(uri);
      }
    );
  }
  
  async searchTerms(query: string, category: string): Promise<ArCoTerm[]> {
    return await this.cacheService.wrap(
      `arco:search:${category}:${query}`,
      3600, // 1 hour
      async () => {
        return await this.executeSparqlSearch(query, category);
      }
    );
  }
}
```

---

## Next Steps

Continue with **Part 2** of the Master Implementation Guide for:
- Database Architecture (Section 8)
- Authentication & Authorization (Section 9)
- API Architecture & Standards (Section 10)
- Frontend Architecture (Section 11)
- MCP Server Integration (Section 12)
- ArCo Integration Strategy (Section 13)
- Multi-Session Development Guidelines (Section 14)

---

**Document Version:** 2.0  
**Part:** 1 of 3  
**Last Updated:** November 14, 2024  
**Next Review:** February 14, 2025
