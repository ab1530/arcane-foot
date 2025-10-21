#!/bin/bash
set -e

echo "[START] Starting Arcane Platform Backend..."

echo "[DB] Running Prisma migrations..."

# Check if _prisma_migrations table exists
if npx prisma migrate status 2>&1 | grep -q "not been created"; then
  echo "[DB] Baselining existing database..."
  # Mark the initial migration as applied without running it
  npx prisma migrate resolve --applied "20251016180531_init"
fi

# Apply any pending migrations
npx prisma migrate deploy

echo "[OK] Migrations completed!"

echo "[APP] Starting application..."
npm run start:prod
