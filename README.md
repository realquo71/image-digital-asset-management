# Cultural Heritage Digital Asset Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20_LTS-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.2-61dafb)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-336791)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A specialized **Digital Asset Management (DAM) system** for Italian cultural heritage institutions with native integration of **ArCo ontologies** (Architecture of Knowledge) and **ICCD standards** compliance.

## 🎯 Key Features

- **ArCo Integration**: Native support for Italy's 169M triple RDF cultural heritage ontology
- **SharePoint Backend**: Leverages existing Microsoft infrastructure
- **ICCD Compliance**: Export catalog sheets conforming to ministerial standards
- **Semantic Search**: Advanced search with cultural heritage vocabulary
- **Azure-Ready**: Built for Microsoft Azure deployment
- **Enterprise-Grade**: Role-based access control, audit trails, automated backups

## 📋 Prerequisites

- **Node.js** 20 LTS or higher
- **npm** 10 or higher
- **Docker** 24 or higher
- **Docker Compose** 2 or higher
- **Git** 2 or higher

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd cultural-heritage-dam
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies (when created)
cd frontend && npm install && cd ..
```

### 3. Configure Environment

```bash
# Copy environment template
cp backend/.env.example backend/.env

# Edit .env with your configuration
nano backend/.env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `AZURE_AD_TENANT_ID`: Azure AD tenant ID
- `AZURE_AD_CLIENT_ID`: Azure AD client ID
- `AZURE_AD_CLIENT_SECRET`: Azure AD client secret
- `JWT_SECRET`: Strong secret key (min 32 characters)

### 4. Start Infrastructure Services

```bash
docker-compose -f docker/docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Elasticsearch (port 9200)
- pgAdmin (port 5050)
- Redis Commander (port 8081)

### 5. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 6. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend (when created)
cd frontend && npm start
```

## 📚 API Documentation

Once the backend is running, access interactive API documentation at:

**Swagger UI**: http://localhost:3000/api-docs

## 🧪 Testing

```bash
# Run all tests
npm test

# Run backend tests only
cd backend && npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test -- --coverage
```

## 📁 Project Structure

```
cultural-heritage-dam/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── config/         # Configuration
│   │   ├── utils/          # Utilities
│   │   └── types/          # TypeScript types
│   ├── prisma/             # Database schema & migrations
│   └── tests/              # Backend tests
│
├── frontend/               # React frontend
│   └── src/
│       ├── components/     # React components
│       ├── pages/          # Page components
│       ├── store/          # Redux store
│       └── services/       # API clients
│
├── docker/                 # Docker configurations
├── docs/                   # Documentation
└── scripts/                # Utility scripts
```

## 🔑 Authentication

The system uses **Azure AD** for authentication with MSAL (Microsoft Authentication Library).

### User Roles

- **ADMIN**: Full system access, user management
- **CURATOR**: Create, edit, delete own assets
- **RESEARCHER**: View assets, create collections
- **VIEWER**: Read-only access to published assets

## 🏛️ ArCo Integration

ArCo (Architecture of Knowledge) is Italy's official cultural heritage ontology with 8 main categories:

1. **Cultural Property Type** (Tipo di Bene Culturale)
2. **Material** (Materiali)
3. **Technique** (Tecnica)
4. **Subject** (Soggetto)
5. **Author** (Autore)
6. **Chronology** (Cronologia)
7. **Location** (Localizzazione)
8. **Conservation Status** (Stato di Conservazione)

SPARQL endpoint: https://dati.beniculturali.it/sparql

## 🛠️ Available Scripts

### Root Level

```bash
npm run dev              # Start both backend and frontend
npm run build            # Build all projects
npm test                 # Run all tests
npm run lint             # Lint all code
npm run format           # Format code with Prettier
```

### Backend

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm test                 # Run tests with coverage
npm run lint             # Lint TypeScript code
npm run prisma:studio    # Open Prisma Studio (database GUI)
npm run prisma:migrate   # Create database migration
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose -f docker/docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker/docker-compose.dev.yml down

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Restart a specific service
docker-compose -f docker/docker-compose.dev.yml restart postgres
```

## 📊 Database Management

Access database GUIs:

- **pgAdmin**: http://localhost:5050 (PostgreSQL)
  - Email: admin@dam.local
  - Password: admin

- **Redis Commander**: http://localhost:8081 (Redis)

- **Prisma Studio**: Run `npm run prisma:studio` in backend directory

## 🔒 Security

- All API endpoints require JWT authentication (except `/auth/*`)
- Passwords hashed with bcrypt (12 rounds minimum)
- HTTPS enforced in production
- CORS configured with whitelist
- Rate limiting on all endpoints
- SQL injection prevention via Prisma ORM
- XSS protection with Helmet.js
- CSRF tokens on state-changing operations

## 📈 Performance

- PostgreSQL with indexing on frequently queried fields
- Redis caching for:
  - User sessions
  - ArCo vocabulary (1 week TTL)
  - Search results (1 hour TTL)
- Elasticsearch for full-text search
- CDN for static assets (production)
- Image optimization with Sharp

## 🌍 Deployment (Azure)

See [docs/deployment/azure.md](docs/deployment/azure.md) for Azure deployment guide.

Recommended Azure services:
- **Azure App Service**: API hosting
- **Azure Database for PostgreSQL**: Managed database
- **Azure Cache for Redis**: Managed cache
- **Azure Blob Storage**: Asset storage (alternative to SharePoint)
- **Azure Application Insights**: Monitoring & analytics
- **Azure AD**: Authentication

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](../../issues)
- Documentation: [docs/](docs/)
- API Docs: http://localhost:3000/api-docs

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- [x] Project setup
- [x] Database schema
- [x] Backend foundation
- [ ] Azure AD authentication
- [ ] Asset upload with EXIF extraction
- [ ] ArCo tagging
- [ ] Search functionality
- [ ] Collections management

### Phase 2: Enhanced Features
- [ ] AI auto-tagging
- [ ] Visual similarity search
- [ ] Workflow approvals
- [ ] Asset versioning
- [ ] Advanced exports (ICCD XML, RDF, JSON-LD)

### Phase 3: AI & Analytics
- [ ] ML-powered tag suggestions
- [ ] Quality scoring
- [ ] Usage analytics
- [ ] Trend analysis

See [ROADMAP.md](ROADMAP.md) for full roadmap.

---

**Made with ❤️ for Italian Cultural Heritage**
