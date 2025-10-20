#!/bin/bash
set -e

echo "🚀 Starting Arcane Platform Backend..."

echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Migrations completed!"

echo "🎯 Starting application..."
npm run start:prod
