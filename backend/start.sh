#!/bin/bash

echo "[START] Starting Arcane Platform Backend..."

echo "[DB] Running Prisma migrations..."

# Capture migration output and exit code
npx prisma migrate deploy 2>&1 | tee /tmp/migrate.log || MIGRATE_EXIT_CODE=$?

# Check if migration failed with P3005 (database not empty)
if [ ! -z "$MIGRATE_EXIT_CODE" ] && grep -q "P3005" /tmp/migrate.log; then
  echo "[DB] Database schema exists but not baselined"
  echo "[DB] Marking initial migration '20251016180531_init' as applied..."

  # Mark the initial migration as applied
  npx prisma migrate resolve --applied "20251016180531_init"

  echo "[DB] Running migrations again..."
  npx prisma migrate deploy
fi

echo "[OK] Migrations completed!"

echo "[APP] Starting application..."
npm run start:prod
