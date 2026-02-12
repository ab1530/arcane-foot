#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${NEW_DATABASE_URL:-}" ]]; then
  echo "Missing NEW_DATABASE_URL"
  echo "Usage: NEW_DATABASE_URL='postgresql://...' [BACKUP_FILE=old_prod.dump] $0"
  exit 1
fi

BACKUP_FILE="${BACKUP_FILE:-old_prod.dump}"
if [[ ! -f "${BACKUP_FILE}" ]]; then
  echo "Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Restoring ${BACKUP_FILE} into new database..."
pg_restore --no-owner --no-privileges --clean --if-exists -d "${NEW_DATABASE_URL}" "${BACKUP_FILE}"

echo "Restore done."
