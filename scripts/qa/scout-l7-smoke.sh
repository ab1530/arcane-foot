#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
MOBILE_DIR="${ROOT_DIR}/mobile"

RUN_BACKEND_TESTS="${RUN_BACKEND_TESTS:-1}"
RUN_MOBILE_TESTS="${RUN_MOBILE_TESTS:-1}"
RUN_API_SMOKE="${RUN_API_SMOKE:-0}"

API_BASE_URL="${API_BASE_URL:-http://localhost:3000/api}"
SCOUT_CERTIFIED_EMAIL="${SCOUT_CERTIFIED_EMAIL:-}"
SCOUT_UNCERTIFIED_EMAIL="${SCOUT_UNCERTIFIED_EMAIL:-}"
SCOUT_PASSWORD="${SCOUT_PASSWORD:-}"
NON_SCOUT_EMAIL="${NON_SCOUT_EMAIL:-}"
NON_SCOUT_PASSWORD="${NON_SCOUT_PASSWORD:-$SCOUT_PASSWORD}"

log() {
  printf '\n[%s] %s\n' "scout-l7-smoke" "$*"
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

normalize_url() {
  printf '%s' "${1%/}"
}

api_call_code() {
  local token="$1"
  local audio_file="$2"
  curl -sS -o /tmp/scout-l7-voice.out -w '%{http_code}' \
    -X POST "$API_BASE_URL/voice-to-report/process" \
    -H "Authorization: Bearer $token" \
    -F "audio=@${audio_file};type=audio/mpeg" \
    -F "language=fr"
}

get_token() {
  local email="$1"
  local password="$2"

  local response
  response="$(curl -sS -X POST "$API_BASE_URL/auth/login" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${password}\"}")"

  local token
  token="$(printf '%s' "$response" | jq -r '.accessToken // empty')"
  if [[ -z "$token" ]]; then
    echo "Unable to get token for ${email}. Response: ${response}" >&2
    exit 1
  fi
  printf '%s' "$token"
}

run_backend_tests() {
  log "Running backend targeted suites"
  (
    cd "$BACKEND_DIR"
    npm test -- --runInBand \
      src/common/guards/scout-certification.guard.spec.ts \
      src/modules/voice-to-report/voice-to-report.controller.spec.ts \
      src/modules/players/players.controller.spec.ts \
      src/modules/scouting-reports/scouting-reports.controller.spec.ts
  )
}

run_mobile_tests() {
  log "Running mobile targeted suites"
  (
    cd "$MOBILE_DIR"
    npx jest \
      src/constants/__tests__/features.test.ts \
      src/screens/reports/__tests__/CreateReportScreen.test.tsx \
      src/screens/dashboard/__tests__/DashboardScreen.test.tsx \
      src/navigation/__tests__/RootNavigator.test.tsx \
      --runInBand
  )
}

run_api_smoke() {
  require_cmd curl
  require_cmd jq

  if [[ -z "$SCOUT_CERTIFIED_EMAIL" || -z "$SCOUT_UNCERTIFIED_EMAIL" || -z "$SCOUT_PASSWORD" ]]; then
    echo "RUN_API_SMOKE=1 requires SCOUT_CERTIFIED_EMAIL, SCOUT_UNCERTIFIED_EMAIL and SCOUT_PASSWORD" >&2
    exit 1
  fi

  API_BASE_URL="$(normalize_url "$API_BASE_URL")"
  log "Running API smoke on $API_BASE_URL"

  local audio_file
  audio_file="$(mktemp /tmp/scout-l7-audio.XXXXXX.mp3)"
  printf 'ID3' > "$audio_file"
  trap 'rm -f "$audio_file" /tmp/scout-l7-voice.out' EXIT

  local certified_token uncertified_token non_scout_token
  local certified_code uncertified_code non_scout_code

  certified_token="$(get_token "$SCOUT_CERTIFIED_EMAIL" "$SCOUT_PASSWORD")"
  uncertified_token="$(get_token "$SCOUT_UNCERTIFIED_EMAIL" "$SCOUT_PASSWORD")"

  certified_code="$(api_call_code "$certified_token" "$audio_file")"
  uncertified_code="$(api_call_code "$uncertified_token" "$audio_file")"

  log "Voice endpoint status codes:"
  echo "  certified scout:   $certified_code"
  echo "  uncertified scout: $uncertified_code"

  if [[ "$uncertified_code" != "403" ]]; then
    echo "Expected 403 for uncertified scout, got $uncertified_code" >&2
    exit 1
  fi

  case "$certified_code" in
    200|400|413|429|500)
      ;;
    401|403)
      echo "Certified scout should not be blocked by certification guard (got $certified_code)" >&2
      exit 1
      ;;
    *)
      echo "Unexpected response for certified scout: $certified_code" >&2
      exit 1
      ;;
  esac

  if [[ -n "$NON_SCOUT_EMAIL" ]]; then
    non_scout_token="$(get_token "$NON_SCOUT_EMAIL" "$NON_SCOUT_PASSWORD")"
    non_scout_code="$(api_call_code "$non_scout_token" "$audio_file")"
    echo "  non-scout user:    $non_scout_code"
    if [[ "$non_scout_code" != "403" ]]; then
      echo "Expected 403 for non-scout user, got $non_scout_code" >&2
      exit 1
    fi
  fi
}

log "Configuration:"
echo "  RUN_BACKEND_TESTS=$RUN_BACKEND_TESTS"
echo "  RUN_MOBILE_TESTS=$RUN_MOBILE_TESTS"
echo "  RUN_API_SMOKE=$RUN_API_SMOKE"
echo "  API_BASE_URL=$(normalize_url "$API_BASE_URL")"

if [[ "$RUN_BACKEND_TESTS" == "1" ]]; then
  run_backend_tests
fi

if [[ "$RUN_MOBILE_TESTS" == "1" ]]; then
  run_mobile_tests
fi

if [[ "$RUN_API_SMOKE" == "1" ]]; then
  run_api_smoke
fi

log "Done"
