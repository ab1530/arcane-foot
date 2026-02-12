#!/bin/bash
set -euo pipefail

if [[ -z "${LOG_FILE:-}" ]]; then
  LOG_FILE="logs/qa_job_local.log"
fi

if [[ "${LOG_FILE}" != /* ]]; then
  LOG_FILE="$(pwd)/${LOG_FILE}"
fi

mkdir -p "$(dirname "${LOG_FILE}")"

CI_POSTGRES_URL="${CI_POSTGRES_URL:-postgresql://postgres:postgres@postgres:5432/postgres?schema=public}"
CI_POSTGRES_PSQL_URL="${CI_POSTGRES_URL%%\?*}"
export DATABASE_URL="$CI_POSTGRES_URL"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-/cache/ms-playwright}"
mkdir -p "$PLAYWRIGHT_BROWSERS_PATH" /cache/npm

run_with_retry() {
  local max_attempts="$1"
  local base_delay="$2"
  shift 2

  local attempt=1
  while true; do
    if "$@" 2>&1 | tee -a "$LOG_FILE"; then
      return 0
    fi

    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Command failed after ${max_attempts} attempts: $*" | tee -a "$LOG_FILE"
      return 1
    fi

    local wait_seconds=$((base_delay * attempt))
    echo "Command failed (attempt ${attempt}/${max_attempts}): $*" | tee -a "$LOG_FILE"
    echo "Retrying in ${wait_seconds}s..." | tee -a "$LOG_FILE"
    sleep "$wait_seconds"
    attempt=$((attempt + 1))
  done
}

echo "Using CI DB host: postgres:5432" | tee -a $LOG_FILE
echo "Using Playwright cache: $PLAYWRIGHT_BROWSERS_PATH" | tee -a $LOG_FILE

if [ -d backend/node_modules ]; then
  echo "Reusing backend/node_modules from upstream artifacts." | tee -a $LOG_FILE
else
  echo "Installing backend dependencies..." | tee -a $LOG_FILE
  npm ci --prefix backend 2>&1 | tee -a $LOG_FILE
fi

if [ -d web/node_modules ]; then
  echo "Reusing web/node_modules from upstream artifacts." | tee -a $LOG_FILE
else
  echo "Installing web dependencies..." | tee -a $LOG_FILE
  npm ci --prefix web 2>&1 | tee -a $LOG_FILE
fi

if [[ ! -f backend/prisma/schema.prisma ]]; then
  echo "ERROR: Missing Prisma schema at backend/prisma/schema.prisma" | tee -a $LOG_FILE
  exit 1
fi

echo "Deploying Prisma migrations..." | tee -a $LOG_FILE
(cd backend && npx --no-install prisma migrate deploy --schema prisma/schema.prisma) 2>&1 | tee -a $LOG_FILE

echo "Syncing Prisma schema for QA ephemeral database..." | tee -a $LOG_FILE
(cd backend && npx --no-install prisma db push --schema prisma/schema.prisma --skip-generate --accept-data-loss) 2>&1 | tee -a $LOG_FILE

echo "Note: Prisma Client already generated during npm ci postinstall" | tee -a $LOG_FILE

echo "Applying database policies..." | tee -a $LOG_FILE
if psql "$CI_POSTGRES_PSQL_URL" -tAc "SELECT 1 FROM pg_namespace WHERE nspname='auth'" | grep -q 1; then
  psql "$CI_POSTGRES_PSQL_URL" -f supabase/policies.sql 2>&1 | tee -a $LOG_FILE
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
echo "Ensuring Playwright Chromium is available..." | tee -a $LOG_FILE
echo "Installing Playwright system dependencies (retry up to 3 attempts)..." | tee -a $LOG_FILE
run_with_retry 3 15 npx --no-install playwright install-deps chromium
npx --no-install playwright install chromium 2>&1 | tee -a $LOG_FILE

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
