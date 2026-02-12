#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"

if [[ -z "${NEW_DATABASE_URL:-}" ]]; then
  echo "Missing NEW_DATABASE_URL"
  echo "Usage: NEW_DATABASE_URL='postgresql://...' $0"
  exit 1
fi

echo "Applying Prisma migrations to new database..."
cd "${BACKEND_DIR}"
DATABASE_URL="${NEW_DATABASE_URL}" npx prisma migrate deploy

echo "Schema migration done."
