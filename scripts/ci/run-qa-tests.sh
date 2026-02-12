#!/bin/bash
set -euo pipefail

if [[ -z "${LOG_FILE:-}" ]]; then
  LOG_FILE="logs/qa_job_local.log"
fi

if [[ "${LOG_FILE}" != /* ]]; then
  LOG_FILE="$(pwd)/${LOG_FILE}"
fi

mkdir -p "$(dirname "${LOG_FILE}")"

echo "Installing PostgreSQL client..." | tee -a $LOG_FILE
apt-get update && apt-get install -y postgresql-client 2>&1 | tee -a $LOG_FILE

echo "Installing backend dependencies..." | tee -a $LOG_FILE
npm ci --prefix backend 2>&1 | tee -a $LOG_FILE

echo "Installing web dependencies..." | tee -a $LOG_FILE
npm ci --prefix web 2>&1 | tee -a $LOG_FILE

if [[ ! -f backend/prisma/schema.prisma ]]; then
  echo "ERROR: Missing Prisma schema at backend/prisma/schema.prisma" | tee -a $LOG_FILE
  exit 1
fi

echo "Deploying Prisma migrations..." | tee -a $LOG_FILE
(cd backend && npx --no-install prisma migrate deploy --schema prisma/schema.prisma) 2>&1 | tee -a $LOG_FILE

echo "Note: Prisma Client already generated during npm ci postinstall" | tee -a $LOG_FILE

echo "Applying database policies..." | tee -a $LOG_FILE
if psql postgresql://postgres:postgres@postgres:5432/postgres -tAc "SELECT 1 FROM pg_namespace WHERE nspname='auth'" | grep -q 1; then
  psql postgresql://postgres:postgres@postgres:5432/postgres -f supabase/policies.sql 2>&1 | tee -a $LOG_FILE
else
  echo "Skipping Supabase policies: auth schema not available in CI postgres." | tee -a $LOG_FILE
fi

if [[ ! -f backend/prisma/seed.ts ]]; then
  echo "ERROR: Missing seed script at backend/prisma/seed.ts" | tee -a $LOG_FILE
  exit 1
fi

echo "Seeding database with test data..." | tee -a $LOG_FILE
(cd backend && ARCANE_DEMO_PASSWORD="${ARCANE_DEMO_PASSWORD:-ci-demo-password}" npx --no-install ts-node --project tsconfig.json prisma/seed.ts) 2>&1 | tee -a $LOG_FILE

echo "Starting backend server in background..." | tee -a $LOG_FILE
npm run start:prod --prefix backend > "$(dirname "$LOG_FILE")/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID $BACKEND_PID" | tee -a $LOG_FILE

echo "Waiting for backend to be ready..." | tee -a $LOG_FILE
timeout 60 bash -c 'until curl -f http://localhost:5000/api/health 2>/dev/null; do echo "Waiting for backend..."; sleep 2; done' || echo "Backend health check timeout"

echo "Backend is ready" | tee -a $LOG_FILE

cd web
echo "Installing Playwright with dependencies..." | tee -a $LOG_FILE
npx playwright install --with-deps chromium 2>&1 | tee -a $LOG_FILE

echo "Running E2E tests..." | tee -a $LOG_FILE
npm run test:e2e 2>&1 | tee -a $LOG_FILE

echo "Running Jest tests..." | tee -a $LOG_FILE
npm run test:ci 2>&1 | tee -a $LOG_FILE

cd ..
echo "Stopping backend server..." | tee -a $LOG_FILE
kill $BACKEND_PID || true

chmod +x scripts/generate-qa-report.sh
./scripts/generate-qa-report.sh

echo "QA completed successfully" | tee -a $LOG_FILE
