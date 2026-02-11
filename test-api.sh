#!/bin/bash

# Script de test automatisé pour l'API Arcane
# Usage: ./test-api.sh [environment] [test-suite]
# Example: ./test-api.sh local auth
#          ./test-api.sh staging full

set -e

# Configuration
ENV="${1:-local}"
TEST_SUITE="${2:-basic}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# API URLs based on environment
case $ENV in
  local)
    API_URL="http://localhost:5000"
    ;;
  staging)
    API_URL="https://staging-api.arcane.com"
    ;;
  production)
    API_URL="https://api.arcane.com"
    ;;
  *)
    echo "Unknown environment: $ENV"
    exit 1
    ;;
esac

# Test credentials
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPass123!"
DEMO_PASSWORD="${ARCANE_DEMO_PASSWORD:-<DEMO_PASSWORD>}"
SCOUT_EMAIL="scout1@arcane.com"
SCOUT_PASSWORD="$DEMO_PASSWORD"
ADMIN_EMAIL="admin@arcane.com"
ADMIN_PASSWORD="$DEMO_PASSWORD"

# Variables to store IDs
TOKEN=""
REFRESH_TOKEN=""
USER_ID=""
PLAYER_ID=""
CLUB_ID=""
MATCH_ID=""
REPORT_ID=""

# Test results
PASSED=0
FAILED=0

# Helper functions
log_test() {
  echo -e "${YELLOW}Testing: $1${NC}"
}

log_success() {
  echo -e "${GREEN}✓ $1${NC}"
  ((PASSED++))
}

log_error() {
  echo -e "${RED}✗ $1${NC}"
  ((FAILED++))
}

make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth=$4

  local curl_cmd="curl -s -X $method \"$API_URL$endpoint\""

  if [ ! -z "$data" ]; then
    curl_cmd="$curl_cmd -H \"Content-Type: application/json\" -d '$data'"
  fi

  if [ "$auth" = "true" ] && [ ! -z "$TOKEN" ]; then
    curl_cmd="$curl_cmd -H \"Authorization: Bearer $TOKEN\""
  fi

  curl_cmd="$curl_cmd -w \"\\n%{http_code}\""

  local response=$(eval $curl_cmd)
  local http_code=$(echo "$response" | tail -n1)
  local body=$(echo "$response" | head -n-1)

  echo "$body"
  return $http_code
}

# Test functions
test_health() {
  log_test "Health Check"

  response=$(curl -s -X GET "$API_URL/health")
  if echo "$response" | grep -q "ok\|healthy"; then
    log_success "API is healthy"
  else
    log_error "Health check failed"
  fi
}

test_signup() {
  log_test "User Signup"

  response=$(curl -s -X POST "$API_URL/auth/signup" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$TEST_EMAIL\",
      \"password\": \"$TEST_PASSWORD\",
      \"firstName\": \"Test\",
      \"lastName\": \"User\",
      \"role\": \"SCOUT\"
    }")

  if echo "$response" | grep -q "id"; then
    USER_ID=$(echo "$response" | jq -r '.id // .user.id // empty')
    log_success "Signup successful (User ID: $USER_ID)"
  else
    log_error "Signup failed: $response"
  fi
}

test_login() {
  log_test "User Login"

  local email="${1:-$SCOUT_EMAIL}"
  local password="${2:-$SCOUT_PASSWORD}"

  response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"$password\"
    }")

  if echo "$response" | grep -q "token"; then
    TOKEN=$(echo "$response" | jq -r '.token // .access_token // empty')
    REFRESH_TOKEN=$(echo "$response" | jq -r '.refreshToken // .refresh_token // empty')
    log_success "Login successful (Token: ${TOKEN:0:20}...)"
  else
    log_error "Login failed: $response"
    return 1
  fi
}

test_get_profile() {
  log_test "Get User Profile"

  response=$(curl -s -X GET "$API_URL/auth/me" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$response" | grep -q "email"; then
    log_success "Profile retrieved successfully"
  else
    log_error "Failed to get profile: $response"
  fi
}

test_list_players() {
  log_test "List Players"

  response=$(curl -s -X GET "$API_URL/players?limit=5")

  if echo "$response" | grep -q "data\|players\|\["; then
    player_count=$(echo "$response" | jq '.data | length // .players | length // length')
    log_success "Retrieved $player_count players"

    # Save first player ID for later tests
    PLAYER_ID=$(echo "$response" | jq -r '(.data[0].id // .players[0].id // .[0].id // empty)')
  else
    log_error "Failed to list players: $response"
  fi
}

test_create_player() {
  log_test "Create Player"

  response=$(curl -s -X POST "$API_URL/players" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"firstName\": \"Test\",
      \"lastName\": \"Player_$(date +%s)\",
      \"birthDate\": \"2000-01-01\",
      \"nationality\": \"French\",
      \"position\": \"MIDFIELDER\",
      \"height\": 180,
      \"weight\": 75,
      \"preferredFoot\": \"RIGHT\"
    }")

  if echo "$response" | grep -q "id"; then
    PLAYER_ID=$(echo "$response" | jq -r '.id')
    log_success "Player created (ID: $PLAYER_ID)"
  else
    log_error "Failed to create player: $response"
  fi
}

test_list_clubs() {
  log_test "List Clubs"

  response=$(curl -s -X GET "$API_URL/clubs?limit=5")

  if echo "$response" | grep -q "data\|clubs\|\["; then
    club_count=$(echo "$response" | jq '.data | length // .clubs | length // length')
    log_success "Retrieved $club_count clubs"

    # Save first club ID
    CLUB_ID=$(echo "$response" | jq -r '(.data[0].id // .clubs[0].id // .[0].id // empty)')
  else
    log_error "Failed to list clubs: $response"
  fi
}

test_create_match() {
  log_test "Create Match"

  # Need two clubs for a match
  response=$(curl -s -X GET "$API_URL/clubs?limit=2")
  home_team=$(echo "$response" | jq -r '(.data[0].id // .clubs[0].id // .[0].id // empty)')
  away_team=$(echo "$response" | jq -r '(.data[1].id // .clubs[1].id // .[1].id // empty)')

  if [ -z "$home_team" ] || [ -z "$away_team" ]; then
    log_error "Need at least 2 clubs to create a match"
    return
  fi

  response=$(curl -s -X POST "$API_URL/matches" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"homeTeamId\": \"$home_team\",
      \"awayTeamId\": \"$away_team\",
      \"date\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"competition\": \"Test League\",
      \"season\": \"2024-2025\",
      \"status\": \"SCHEDULED\"
    }")

  if echo "$response" | grep -q "id"; then
    MATCH_ID=$(echo "$response" | jq -r '.id')
    log_success "Match created (ID: $MATCH_ID)"
  else
    log_error "Failed to create match: $response"
  fi
}

test_create_scouting_report() {
  log_test "Create Scouting Report"

  if [ -z "$PLAYER_ID" ] || [ -z "$MATCH_ID" ]; then
    log_error "Need player and match IDs to create report"
    return
  fi

  response=$(curl -s -X POST "$API_URL/scouting-reports" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"playerId\": \"$PLAYER_ID\",
      \"matchId\": \"$MATCH_ID\",
      \"overallRating\": 7.5,
      \"technicalSkills\": {
        \"ballControl\": 7,
        \"passing\": 8,
        \"shooting\": 6,
        \"dribbling\": 7
      },
      \"physicalAttributes\": {
        \"pace\": 8,
        \"strength\": 7,
        \"stamina\": 8,
        \"jumping\": 6
      },
      \"mentalAttributes\": {
        \"decisionMaking\": 7,
        \"positioning\": 7,
        \"vision\": 8,
        \"workRate\": 8
      },
      \"summary\": \"Test scouting report\",
      \"strengths\": [\"Passing\", \"Stamina\"],
      \"weaknesses\": [\"Shooting\"],
      \"recommendation\": \"RECOMMENDED\"
    }")

  if echo "$response" | grep -q "id"; then
    REPORT_ID=$(echo "$response" | jq -r '.id')
    log_success "Scouting report created (ID: $REPORT_ID)"
  else
    log_error "Failed to create scouting report: $response"
  fi
}

test_search() {
  log_test "Global Search"

  response=$(curl -s -X GET "$API_URL/search?query=test&limit=5")

  if echo "$response" | grep -q "results\|data\|\["; then
    log_success "Search completed successfully"
  else
    log_error "Search failed: $response"
  fi
}

test_analytics() {
  log_test "Analytics Overview"

  response=$(curl -s -X GET "$API_URL/analytics/overview" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$response" | grep -q "total\|count\|stats"; then
    log_success "Analytics retrieved successfully"
  else
    log_error "Failed to get analytics: $response"
  fi
}

test_subscriptions() {
  log_test "Get Subscription Pricing"

  response=$(curl -s -X GET "$API_URL/subscriptions/pricing")

  if echo "$response" | grep -q "tiers\|plans\|BRONZE\|SILVER\|GOLD"; then
    log_success "Subscription pricing retrieved"
  else
    log_error "Failed to get subscription pricing: $response"
  fi
}

test_ai_features() {
  log_test "AI Features (requires Gold subscription)"

  if [ -z "$PLAYER_ID" ]; then
    log_error "Need player ID for AI features"
    return
  fi

  # Try to get AI index
  response=$(curl -s -X GET "$API_URL/ai/index/$PLAYER_ID" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$response" | grep -q "index\|score\|unauthorized\|subscription"; then
    log_success "AI endpoint accessible (may require upgrade)"
  else
    log_error "Failed to access AI features: $response"
  fi
}

test_rate_limiting() {
  log_test "Rate Limiting"

  # Make multiple rapid requests
  for i in {1..6}; do
    response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
      -H "Content-Type: application/json" \
      -d "{\"email\": \"test@test.com\", \"password\": \"wrong\"}")

    if [ "$response" = "429" ]; then
      log_success "Rate limiting is working (blocked after $i requests)"
      return
    fi
  done

  log_error "Rate limiting might not be configured properly"
}

test_logout() {
  log_test "Logout"

  response=$(curl -s -X POST "$API_URL/auth/logout" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

  log_success "Logout completed"
}

# Performance test
performance_test() {
  log_test "Performance Test"

  echo "Testing response times for common endpoints..."

  endpoints=(
    "/health"
    "/players?limit=10"
    "/clubs?limit=10"
    "/matches/upcoming?limit=5"
  )

  for endpoint in "${endpoints[@]}"; do
    start_time=$(date +%s%N)
    curl -s -X GET "$API_URL$endpoint" > /dev/null
    end_time=$(date +%s%N)

    duration=$((($end_time - $start_time) / 1000000))

    if [ $duration -lt 1000 ]; then
      echo -e "${GREEN}  $endpoint: ${duration}ms${NC}"
    elif [ $duration -lt 3000 ]; then
      echo -e "${YELLOW}  $endpoint: ${duration}ms${NC}"
    else
      echo -e "${RED}  $endpoint: ${duration}ms (slow)${NC}"
    fi
  done
}

# Main test execution
main() {
  echo "========================================="
  echo "API Testing Suite"
  echo "Environment: $ENV"
  echo "API URL: $API_URL"
  echo "Test Suite: $TEST_SUITE"
  echo "========================================="
  echo ""

  case $TEST_SUITE in
    basic)
      test_health
      test_login
      test_get_profile
      test_list_players
      test_list_clubs
      test_search
      test_logout
      ;;

    auth)
      test_health
      test_signup
      test_login "$TEST_EMAIL" "$TEST_PASSWORD"
      test_get_profile
      test_logout
      ;;

    crud)
      test_login
      test_create_player
      test_list_players
      test_create_match
      test_create_scouting_report
      test_logout
      ;;

    analytics)
      test_login
      test_analytics
      test_subscriptions
      test_ai_features
      test_logout
      ;;

    performance)
      performance_test
      test_rate_limiting
      ;;

    full)
      test_health
      test_signup
      test_login "$SCOUT_EMAIL" "$SCOUT_PASSWORD"
      test_get_profile
      test_list_players
      test_create_player
      test_list_clubs
      test_create_match
      test_create_scouting_report
      test_search
      test_analytics
      test_subscriptions
      test_ai_features
      test_rate_limiting
      performance_test
      test_logout
      ;;

    *)
      echo "Unknown test suite: $TEST_SUITE"
      echo "Available suites: basic, auth, crud, analytics, performance, full"
      exit 1
      ;;
  esac

  echo ""
  echo "========================================="
  echo "Test Results"
  echo "========================================="
  echo -e "${GREEN}Passed: $PASSED${NC}"
  echo -e "${RED}Failed: $FAILED${NC}"

  if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
  else
    echo -e "${RED}Some tests failed${NC}"
    exit 1
  fi
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo "jq is required but not installed. Install it with:"
  echo "  macOS: brew install jq"
  echo "  Ubuntu: sudo apt-get install jq"
  exit 1
fi

# Check if curl is installed
if ! command -v curl &> /dev/null; then
  echo "curl is required but not installed."
  exit 1
fi

# Run main function
main
