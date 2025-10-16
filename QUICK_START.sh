#!/bin/bash
# =======================================
# ARCANE PLATFORM - QUICK START SCRIPT
# =======================================
# This script helps you quickly initialize the Arcane platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════╗"
echo "║    ARCANE PLATFORM - QUICK START     ║"
echo "╔═══════════════════════════════════════╗"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Install from https://nodejs.org${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node --version)${NC}"

if ! command_exists flutter; then
    echo -e "${RED}❌ Flutter not found. Install from https://flutter.dev${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Flutter $(flutter --version | head -n 1)${NC}"

if ! command_exists docker; then
    echo -e "${YELLOW}⚠️  Docker not found. Install from https://docker.com${NC}"
    echo -e "${YELLOW}   You can still continue, but will need to provide your own PostgreSQL${NC}"
else
    echo -e "${GREEN}✅ Docker $(docker --version)${NC}"
fi

if ! command_exists git; then
    echo -e "${RED}❌ Git not found. Install git first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Git $(git --version)${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${YELLOW}What would you like to do?${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo "1) Initialize Backend (NestJS)"
echo "2) Initialize Mobile (Flutter)"
echo "3) Start Database (Docker)"
echo "4) Run Full Setup (Backend + Mobile + DB)"
echo "5) Push to GitHub"
echo "6) Exit"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔨 Initializing Backend...${NC}"

        # Create backend directory
        mkdir -p backend
        cd backend

        # Initialize NestJS
        echo -e "${YELLOW}📦 Installing NestJS CLI...${NC}"
        npm i -g @nestjs/cli

        echo -e "${YELLOW}🏗️  Creating NestJS project...${NC}"
        nest new . --package-manager npm --skip-git

        echo -e "${YELLOW}📦 Installing dependencies...${NC}"
        npm install @prisma/client prisma
        npm install @nestjs/jwt @nestjs/passport passport passport-jwt
        npm install bcrypt class-validator class-transformer
        npm install -D @types/bcrypt @types/passport-jwt

        # Copy .env
        cp ../.env.example .env
        echo -e "${GREEN}✅ Created .env file. Please edit it with your credentials!${NC}"

        # Initialize Prisma
        npx prisma init

        echo -e "${GREEN}✅ Backend initialized!${NC}"
        echo -e "${YELLOW}Next steps:${NC}"
        echo "  1. Edit backend/.env with your database credentials"
        echo "  2. Copy Prisma schema to backend/prisma/schema.prisma"
        echo "  3. Run: npx prisma migrate dev --name init"
        echo "  4. Run: npm run start:dev"
        ;;

    2)
        echo -e "${YELLOW}📱 Initializing Mobile App...${NC}"

        # Create Flutter app
        flutter create mobile --org com.arcane --platforms=ios,android,web
        cd mobile

        echo -e "${YELLOW}📦 Adding dependencies...${NC}"
        flutter pub add dio flutter_riverpod go_router flutter_secure_storage
        flutter pub add shared_preferences freezed_annotation json_annotation
        flutter pub add --dev freezed json_serializable build_runner

        # Create structure
        echo -e "${YELLOW}📁 Creating Clean Architecture structure...${NC}"
        mkdir -p lib/{core,features,shared}
        mkdir -p lib/core/{constants,network,storage,theme,utils,error}
        mkdir -p lib/features/auth/{data,domain,presentation}

        # Create .env
        cat > .env << EOF
API_BASE_URL=http://localhost:3000
EOF

        echo -e "${GREEN}✅ Mobile app initialized!${NC}"
        echo -e "${YELLOW}Next steps:${NC}"
        echo "  1. cd mobile"
        echo "  2. flutter pub run build_runner build --delete-conflicting-outputs"
        echo "  3. flutter run -d ios (or android, or chrome)"
        ;;

    3)
        echo -e "${YELLOW}🐳 Starting Database with Docker...${NC}"

        if ! command_exists docker; then
            echo -e "${RED}❌ Docker not installed!${NC}"
            exit 1
        fi

        docker-compose up -d postgres redis

        echo -e "${GREEN}✅ Database started!${NC}"
        echo "PostgreSQL: localhost:5432"
        echo "  User: arcane_user"
        echo "  Password: arcane_pass"
        echo "  Database: arcane_db"
        echo ""
        echo "Redis: localhost:6379"
        echo ""
        echo "Check status: docker-compose ps"
        echo "View logs: docker-compose logs -f postgres"
        ;;

    4)
        echo -e "${YELLOW}🚀 Running full setup...${NC}"

        # Start database
        echo -e "${YELLOW}🐳 Starting database...${NC}"
        docker-compose up -d postgres redis
        sleep 5

        # Backend
        echo -e "${YELLOW}🔨 Setting up backend...${NC}"
        mkdir -p backend
        cd backend
        npm i -g @nestjs/cli
        nest new . --package-manager npm --skip-git
        npm install @prisma/client prisma @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt class-validator class-transformer
        npm install -D @types/bcrypt @types/passport-jwt
        cp ../.env.example .env
        npx prisma init
        cd ..

        # Mobile
        echo -e "${YELLOW}📱 Setting up mobile...${NC}"
        flutter create mobile --org com.arcane --platforms=ios,android,web
        cd mobile
        flutter pub add dio flutter_riverpod go_router flutter_secure_storage shared_preferences freezed_annotation json_annotation
        flutter pub add --dev freezed json_serializable build_runner
        mkdir -p lib/{core,features,shared}
        cat > .env << EOF
API_BASE_URL=http://localhost:3000
EOF
        cd ..

        echo -e "${GREEN}✅ Full setup completed!${NC}"
        echo -e "${YELLOW}Next steps:${NC}"
        echo "  1. Edit backend/.env"
        echo "  2. Copy Prisma schema"
        echo "  3. cd backend && npx prisma migrate dev"
        echo "  4. cd backend && npm run start:dev"
        echo "  5. In new terminal: cd mobile && flutter run"
        ;;

    5)
        echo -e "${YELLOW}🚀 Pushing to GitHub...${NC}"

        if command_exists gh; then
            echo -e "${YELLOW}Using GitHub CLI...${NC}"
            gh auth status || gh auth login
            gh repo create arcane-platform --public --source=. --remote=origin --description="⚽ Football Agency Management Platform"
            git push -u origin main
            echo -e "${GREEN}✅ Pushed to GitHub!${NC}"
        else
            echo -e "${YELLOW}GitHub CLI not found. Manual steps:${NC}"
            echo "1. Create repo on https://github.com/new"
            echo "2. Run: git remote add origin https://github.com/YOUR_USERNAME/arcane-platform.git"
            echo "3. Run: git push -u origin main"
        fi
        ;;

    6)
        echo -e "${BLUE}👋 Goodbye!${NC}"
        exit 0
        ;;

    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Done! Check NEXT_STEPS.md for details${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
