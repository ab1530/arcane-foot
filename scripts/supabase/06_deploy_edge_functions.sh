#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_PROJECT_REF:-}" ]]; then
  echo "Missing SUPABASE_PROJECT_REF"
  echo "Usage: SUPABASE_PROJECT_REF='<project-ref>' [SERVICE_ROLE_KEY='...'] $0"
  exit 1
fi

echo "Deploying edge functions to ${SUPABASE_PROJECT_REF} ..."
supabase functions deploy health --project-ref "${SUPABASE_PROJECT_REF}"
supabase functions deploy passport --project-ref "${SUPABASE_PROJECT_REF}"
supabase functions deploy shortlist --project-ref "${SUPABASE_PROJECT_REF}"

if [[ -n "${SERVICE_ROLE_KEY:-}" ]]; then
  echo "Syncing SERVICE_ROLE_KEY secret..."
  supabase secrets set SERVICE_ROLE_KEY="${SERVICE_ROLE_KEY}" --project-ref "${SUPABASE_PROJECT_REF}"
else
  echo "SERVICE_ROLE_KEY not provided, skipping secret sync."
fi

echo "Edge deployment done."
