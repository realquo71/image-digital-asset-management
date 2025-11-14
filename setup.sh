#!/bin/bash

# Cultural Heritage DAM - Automated Setup Script
# This script automates the initial setup process

set -e  # Exit on error

echo "🏛️  Cultural Heritage Digital Asset Management System"
echo "    Setup Script v1.0"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 20 LTS or higher.${NC}"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be 18 or higher. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC} npm $(npm -v)"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker $(docker -v | cut -d' ' -f3 | cut -d',' -f1)"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⚠${NC}  Docker not found (optional)"
    DOCKER_AVAILABLE=false
fi

echo ""

# Ask user if they want to use Docker for infrastructure
if [ "$DOCKER_AVAILABLE" = true ]; then
    read -p "Do you want to use Docker for PostgreSQL, Redis, and Elasticsearch? (recommended) [Y/n]: " USE_DOCKER
    USE_DOCKER=${USE_DOCKER:-Y}
else
    USE_DOCKER="n"
fi

echo ""
echo "📦 Installing dependencies..."

# Install root dependencies
echo "   Installing root dependencies..."
npm install --silent

# Install backend dependencies
echo "   Installing backend dependencies..."
cd backend
npm install --silent
cd ..

# Install frontend dependencies
echo "   Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo -e "${GREEN}✓${NC} All dependencies installed"
echo ""

# Setup environment files
echo "🔧 Setting up environment files..."

# Backend .env
if [ ! -f backend/.env ]; then
    echo "   Creating backend/.env from template..."
    cp backend/.env.example backend/.env

    # Generate JWT secrets
    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)

    # Update .env with generated secrets (macOS and Linux compatible)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
        sed -i '' "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" backend/.env
    else
        # Linux
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" backend/.env
        sed -i "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" backend/.env
    fi

    echo -e "${GREEN}✓${NC} Created backend/.env with generated JWT secrets"
else
    echo -e "${YELLOW}⚠${NC}  backend/.env already exists, skipping"
fi

# Frontend .env
if [ ! -f frontend/.env ]; then
    echo "   Creating frontend/.env from template..."
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✓${NC} Created frontend/.env"
else
    echo -e "${YELLOW}⚠${NC}  frontend/.env already exists, skipping"
fi

echo ""

# Start Docker services if requested
if [[ "$USE_DOCKER" =~ ^[Yy]$ ]]; then
    echo "🐳 Starting Docker services..."

    if [ ! -f docker-compose.yml ]; then
        echo -e "${RED}❌ docker-compose.yml not found${NC}"
        exit 1
    fi

    docker-compose up -d

    echo "   Waiting for services to be ready..."
    sleep 10

    echo -e "${GREEN}✓${NC} Docker services started:"
    echo "   • PostgreSQL: localhost:5432"
    echo "   • Redis: localhost:6379"
    echo "   • Elasticsearch: localhost:9200"
else
    echo -e "${YELLOW}⚠${NC}  Skipping Docker setup. Make sure PostgreSQL, Redis, and Elasticsearch are running manually."
    echo ""
    read -p "Press Enter to continue when services are ready..."
fi

echo ""

# Database setup
echo "🗄️  Setting up database..."

cd backend

echo "   Running Prisma migrations..."
npx prisma migrate dev --name init --skip-seed

echo "   Generating Prisma client..."
npx prisma generate

# Ask if user wants to seed database
read -p "Do you want to seed the database with test data? [Y/n]: " SEED_DB
SEED_DB=${SEED_DB:-Y}

if [[ "$SEED_DB" =~ ^[Yy]$ ]]; then
    echo "   Seeding database with test data..."
    npm run seed
    echo -e "${GREEN}✓${NC} Database seeded with test users and sample data"
fi

cd ..

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📖 Next Steps:"
echo ""
echo "1. Configure Azure AD credentials in backend/.env:"
echo "   • AZURE_AD_CLIENT_ID"
echo "   • AZURE_AD_CLIENT_SECRET"
echo "   • AZURE_AD_TENANT_ID"
echo ""
echo "2. Configure SharePoint credentials in backend/.env:"
echo "   • SHAREPOINT_SITE_URL"
echo "   • SHAREPOINT_LIBRARY_NAME"
echo ""
echo "3. Start the development servers:"
echo ""
echo "   Terminal 1 - Backend:"
echo "   $ cd backend && npm run dev"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   $ cd frontend && npm run dev"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:3001"
echo "   Backend API: http://localhost:3000"
echo "   API Docs: http://localhost:3000/api-docs"
echo ""

if [[ "$SEED_DB" =~ ^[Yy]$ ]]; then
    echo "🔐 Test Credentials:"
    echo "   Email: admin@culturalheritage.test"
    echo "   Email: curator@culturalheritage.test"
    echo "   Email: researcher@culturalheritage.test"
    echo "   Email: viewer@culturalheritage.test"
    echo "   Password (all): password123"
    echo ""
fi

echo "📚 For more information, see README.md"
echo ""
echo "🎉 Happy coding!"
