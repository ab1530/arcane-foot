#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${OLD_DATABASE_URL:-}" || -z "${NEW_DATABASE_URL:-}" ]]; then
  echo "Missing OLD_DATABASE_URL and/or NEW_DATABASE_URL"
  echo "Usage: OLD_DATABASE_URL='postgresql://...' NEW_DATABASE_URL='postgresql://...' $0"
  exit 1
fi

TABLES_CSV="${TABLES:-users,players,scouting_reports,media,player_passports,passport_share_sets,club_requests,matches,clubs}"
IFS=',' read -r -a TABLES_ARR <<< "${TABLES_CSV}"

echo "Comparing row counts..."
printf "%-30s %-12s %-12s %-12s\n" "table" "old" "new" "diff"
printf "%-30s %-12s %-12s %-12s\n" "------------------------------" "------------" "------------" "------------"

HAS_DIFF=0
for tbl in "${TABLES_ARR[@]}"; do
  t="$(echo "$tbl" | xargs)"
  old_count="$(psql "${OLD_DATABASE_URL}" -tAc "select count(*) from public.\"${t}\"" 2>/dev/null || echo ERR)"
  new_count="$(psql "${NEW_DATABASE_URL}" -tAc "select count(*) from public.\"${t}\"" 2>/dev/null || echo ERR)"

  if [[ "$old_count" == "ERR" || "$new_count" == "ERR" ]]; then
    printf "%-30s %-12s %-12s %-12s\n" "$t" "$old_count" "$new_count" "ERR"
    HAS_DIFF=1
    continue
  fi

  diff=$((new_count - old_count))
  printf "%-30s %-12s %-12s %-12s\n" "$t" "$old_count" "$new_count" "$diff"

  if [[ "$diff" -ne 0 ]]; then
    HAS_DIFF=1
  fi
done

if [[ "$HAS_DIFF" -ne 0 ]]; then
  echo "Count mismatch detected."
  exit 2
fi

echo "All compared table counts match."
