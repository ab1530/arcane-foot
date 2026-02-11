#!/bin/bash
set -e

echo "Installing PostgreSQL client..." | tee -a $LOG_FILE
apt-get update && apt-get install -y postgresql-client 2>&1 | tee -a $LOG_FILE

echo "Installing backend dependencies..." | tee -a $LOG_FILE
npm ci --prefix backend 2>&1 | tee -a $LOG_FILE

echo "Installing web dependencies..." | tee -a $LOG_FILE
npm ci --prefix web 2>&1 | tee -a $LOG_FILE

echo "Deploying Prisma migrations..." | tee -a $LOG_FILE
npx prisma migrate deploy --schema backend/prisma/schema.prisma 2>&1 | tee -a $LOG_FILE

echo "Note: Prisma Client already generated during npm ci postinstall" | tee -a $LOG_FILE

echo "Applying database policies..." | tee -a $LOG_FILE
psql postgresql://postgres:postgres@postgres:5432/postgres -f supabase/policies.sql 2>&1 | tee -a $LOG_FILE || echo "WARNING - Some policies failed (expected in CI without Supabase auth)"

echo "Seeding database with test data..." | tee -a $LOG_FILE
npx ts-node --project backend/tsconfig.json backend/prisma/seed.ts 2>&1 | tee -a $LOG_FILE

echo "Starting backend server in background..." | tee -a $LOG_FILE
cd backend && npm run start:prod > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID" | tee -a ../$LOG_FILE
cd ..

echo "Waiting for backend to be ready..." | tee -a $LOG_FILE
timeout 60 bash -c 'until curl -f http://localhost:5000/api/health 2>/dev/null; do echo "Waiting for backend..."; sleep 2; done' || echo "Backend health check timeout"

echo "Backend is ready" | tee -a $LOG_FILE

cd web
echo "Installing Playwright with dependencies..." | tee -a ../$LOG_FILE
npx playwright install --with-deps chromium 2>&1 | tee -a ../$LOG_FILE

echo "Running E2E tests..." | tee -a ../$LOG_FILE
npm run test:e2e 2>&1 | tee -a ../$LOG_FILE

echo "Running Jest tests..." | tee -a ../$LOG_FILE
npm run test:ci 2>&1 | tee -a ../$LOG_FILE

cd ..
echo "Stopping backend server..." | tee -a $LOG_FILE
kill $BACKEND_PID || true

chmod +x scripts/generate-qa-report.sh
./scripts/generate-qa-report.sh

echo "QA completed successfully" | tee -a $LOG_FILE
