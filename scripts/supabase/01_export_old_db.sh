#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${OLD_DATABASE_URL:-}" ]]; then
  echo "Missing OLD_DATABASE_URL"
  echo "Usage: OLD_DATABASE_URL='postgresql://...' [BACKUP_FILE=old_prod.dump] $0"
  exit 1
fi

BACKUP_FILE="${BACKUP_FILE:-old_prod.dump}"

echo "Exporting old database to ${BACKUP_FILE} ..."
pg_dump "${OLD_DATABASE_URL}" -Fc -f "${BACKUP_FILE}"

echo "Done: ${BACKUP_FILE}"
