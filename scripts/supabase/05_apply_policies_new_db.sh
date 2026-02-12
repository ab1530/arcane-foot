#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ -z "${NEW_DATABASE_URL:-}" ]]; then
  echo "Missing NEW_DATABASE_URL"
  echo "Usage: NEW_DATABASE_URL='postgresql://...' $0"
  exit 1
fi

echo "Applying Supabase RLS policies..."
psql "${NEW_DATABASE_URL}" -f "${ROOT_DIR}/supabase/policies.sql"
psql "${NEW_DATABASE_URL}" -f "${ROOT_DIR}/supabase/storage_policies.sql"

echo "Policies applied."
