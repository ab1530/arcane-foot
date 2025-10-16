#!/bin/bash
# =======================================
# ARCANE DEPLOYMENT SCRIPT
# =======================================

set -e

echo "🚀 Starting Arcane deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check environment
if [ -z "$ENVIRONMENT" ]; then
    echo -e "${RED}❌ ENVIRONMENT variable not set${NC}"
    echo "Usage: ENVIRONMENT=production ./deploy.sh"
    exit 1
fi

echo -e "${GREEN}📦 Environment: $ENVIRONMENT${NC}"

# Backend deployment
echo -e "${YELLOW}🔨 Building backend...${NC}"
cd backend
npm ci
npm run build

# Run migrations
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
npx prisma migrate deploy

# Deploy based on platform
if [ "$DEPLOY_PLATFORM" == "railway" ]; then
    echo -e "${YELLOW}🚂 Deploying to Railway...${NC}"
    railway up
elif [ "$DEPLOY_PLATFORM" == "render" ]; then
    echo -e "${YELLOW}🎨 Deploying to Render...${NC}"
    # Render deploys automatically via git push
    echo "Push to git to trigger Render deployment"
elif [ "$DEPLOY_PLATFORM" == "docker" ]; then
    echo -e "${YELLOW}🐳 Building Docker image...${NC}"
    docker build -f ../infra/docker/backend.Dockerfile -t arcane-backend:latest .
    docker push arcane-backend:latest
fi

# Flutter Web deployment
echo -e "${YELLOW}🌐 Building Flutter Web...${NC}"
cd ../mobile
flutter build web --release --web-renderer canvaskit

if [ "$DEPLOY_WEB" == "vercel" ]; then
    echo -e "${YELLOW}▲ Deploying to Vercel...${NC}"
    cd build/web
    vercel --prod
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
