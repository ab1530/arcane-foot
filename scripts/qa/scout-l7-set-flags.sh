#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

BACKEND_ENV_FILE="${BACKEND_ENV_FILE:-${ROOT_DIR}/backend/.env.local}"
MOBILE_ENV_FILE="${MOBILE_ENV_FILE:-${ROOT_DIR}/mobile/.env.local}"

VOICE_GUARD="${VOICE_GUARD:-true}"
SCOUT_NEW_FLOW="${SCOUT_NEW_FLOW:-true}"
SCOUT_PROFILE_SCREEN="${SCOUT_PROFILE_SCREEN:-true}"

usage() {
  cat <<'EOF'
Usage:
  VOICE_GUARD=true SCOUT_NEW_FLOW=true SCOUT_PROFILE_SCREEN=true ./scripts/qa/scout-l7-set-flags.sh

Options via env vars:
  BACKEND_ENV_FILE        path to backend env file (default: backend/.env.local)
  MOBILE_ENV_FILE         path to mobile env file (default: mobile/.env.local)
  VOICE_GUARD             true|false -> VOICE_CERTIFIED_GUARD_ENABLED
  SCOUT_NEW_FLOW          true|false -> EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED
  SCOUT_PROFILE_SCREEN    true|false -> EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED
EOF
}

normalize_bool() {
  local raw="${1:-}"
  local lower
  lower="$(printf '%s' "$raw" | tr '[:upper:]' '[:lower:]')"
  case "$lower" in
    true|1|yes|on) printf 'true' ;;
    false|0|no|off) printf 'false' ;;
    *)
      echo "Invalid boolean value: '$raw' (expected true/false)" >&2
      exit 1
      ;;
  esac
}

upsert_env() {
  local file="$1"
  local key="$2"
  local value="$3"

  if [[ ! -f "$file" ]]; then
    mkdir -p "$(dirname "$file")"
    : > "$file"
  fi

  local tmp_file
  tmp_file="$(mktemp)"

  awk -v key="$key" -v value="$value" '
    BEGIN { updated = 0 }
    {
      if ($0 ~ ("^" key "=")) {
        print key "=" value
        updated = 1
      } else {
        print $0
      }
    }
    END {
      if (updated == 0) print key "=" value
    }
  ' "$file" > "$tmp_file"

  mv "$tmp_file" "$file"
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

VOICE_GUARD="$(normalize_bool "$VOICE_GUARD")"
SCOUT_NEW_FLOW="$(normalize_bool "$SCOUT_NEW_FLOW")"
SCOUT_PROFILE_SCREEN="$(normalize_bool "$SCOUT_PROFILE_SCREEN")"

upsert_env "$BACKEND_ENV_FILE" "VOICE_CERTIFIED_GUARD_ENABLED" "$VOICE_GUARD"
upsert_env "$MOBILE_ENV_FILE" "EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED" "$SCOUT_NEW_FLOW"
upsert_env "$MOBILE_ENV_FILE" "EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED" "$SCOUT_PROFILE_SCREEN"

echo "[scout-l7-set-flags] Updated:"
echo "  $BACKEND_ENV_FILE"
grep -E '^VOICE_CERTIFIED_GUARD_ENABLED=' "$BACKEND_ENV_FILE" | tail -n 1
echo "  $MOBILE_ENV_FILE"
grep -E '^EXPO_PUBLIC_SCOUT_NEW_FLOW_ENABLED=' "$MOBILE_ENV_FILE" | tail -n 1
grep -E '^EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED=' "$MOBILE_ENV_FILE" | tail -n 1
