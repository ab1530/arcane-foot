#!/bin/bash

echo "[START] Starting Arcane Platform Backend..."

echo "[DB] Running Prisma migrations..."

# Try migration silently, capture output and exit code
set +e
npx prisma migrate deploy > /tmp/migrate.log 2>&1
MIGRATE_EXIT_CODE=$?
set -e

# Check if migration failed
if [ $MIGRATE_EXIT_CODE -ne 0 ]; then
  # Check if it's P3005 error (database not baselined)
  if grep -q "P3005" /tmp/migrate.log; then
    echo "[DB] Database schema exists but not baselined"
    echo "[DB] Marking initial migration '20251016180531_init' as applied..."

    # Mark the initial migration as applied
    npx prisma migrate resolve --applied "20251016180531_init"

    echo "[DB] Running migrations again..."
    npx prisma migrate deploy
  else
    # Some other error occurred, show it and exit
    echo "[ERROR] Migration failed:"
    cat /tmp/migrate.log
    exit 1
  fi
fi

echo "[OK] Migrations completed!"

echo "[APP] Starting application..."
npm run start:prod
