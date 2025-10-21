#!/bin/bash
set -e

echo "[START] Starting Arcane Platform Backend..."

echo "[DB] Syncing database schema..."
npx prisma db push --accept-data-loss

echo "[OK] Database schema synced!"

echo "[APP] Starting application..."
npm run start:prod
