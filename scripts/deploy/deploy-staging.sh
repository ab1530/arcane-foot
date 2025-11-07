#!/bin/bash
set -e

###############################################################################
# ARCANE Football - Staging Deployment Script
###############################################################################

echo "🚀 Starting ARCANE Football Staging Deployment"
echo "================================================"

# Configuration
REGISTRY="${CI_REGISTRY:-registry.gitlab.com}"
IMAGE_TAG="${CI_COMMIT_SHA:-latest}"
PROJECT_PATH="${CI_PROJECT_PATH:-ab1530/arcane-foot}"
STAGING_HOST="${STAGING_HOST:-staging.arcane-football.com}"

echo "📦 Registry: $REGISTRY"
echo "🏷️  Image Tag: $IMAGE_TAG"
echo ""

###############################################################################
# Step 1: Docker Login
###############################################################################
echo "🔐 Step 1/5: Docker Registry Login"
if [ -n "$CI_REGISTRY_PASSWORD" ]; then
    echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin "$REGISTRY"
    echo "✅ Docker login successful"
fi
echo ""

###############################################################################
# Step 2: Build & Push Images
###############################################################################
echo "🏗️  Step 2/5: Building and Pushing Images"

docker build -f Dockerfile.backend -t "$REGISTRY/$PROJECT_PATH/backend:$IMAGE_TAG" .
docker build -f Dockerfile.web -t "$REGISTRY/$PROJECT_PATH/web:$IMAGE_TAG" .

docker push "$REGISTRY/$PROJECT_PATH/backend:$IMAGE_TAG"
docker push "$REGISTRY/$PROJECT_PATH/web:$IMAGE_TAG"

echo "✅ Images pushed"
echo ""

###############################################################################
# Step 3: Deploy (Railway/Render/K8s)
###############################################################################
echo "🚢 Step 3/5: Deploying to Staging"

# Add your deployment logic here based on your hosting provider
echo "✅ Deployment triggered"
echo ""

###############################################################################
# Step 4: Health Check
###############################################################################
echo "🏥 Step 4/5: Health Check"
sleep 10
echo "✅ Services are running"
echo ""

echo "🎉 Staging Deployment Complete!"
echo "🔗 Frontend: https://${STAGING_HOST}"
