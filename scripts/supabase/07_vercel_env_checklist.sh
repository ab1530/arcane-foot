#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${NEW_PROJECT_REF:-}" ]]; then
  echo "Missing NEW_PROJECT_REF"
  echo "Usage: NEW_PROJECT_REF='<supabase-project-ref>' API_URL='https://api.example.com' $0"
  exit 1
fi

API_URL_VALUE="${API_URL:-https://your-api.example.com}"
SENTRY_DSN_VALUE="${SENTRY_DSN:-https://your-sentry-dsn}"

echo "Set these Vercel Production variables:"
echo "NEXT_PUBLIC_API_URL=${API_URL_VALUE}"
echo "NEXT_PUBLIC_PUBLIC_SHARE_API_URL=https://${NEW_PROJECT_REF}.functions.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_URL=https://${NEW_PROJECT_REF}.supabase.co"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=<new anon key>"
echo "NEXT_PUBLIC_SENTRY_DSN=${SENTRY_DSN_VALUE}"
echo
echo "Also create Vercel secrets expected by web/vercel.json:"
echo "api-url=${API_URL_VALUE}"
echo "sentry-dsn-frontend=${SENTRY_DSN_VALUE}"
