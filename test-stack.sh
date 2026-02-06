#!/bin/bash

# Script de test complet pour l'API, Web et Mobile
# Usage: ./test-stack.sh [api|web|mobile|all]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_PORT=5001  # Changed to match .env configuration
WEB_PORT=3000
MOBILE_PORT=19000
DEMO_PASSWORD="${ARCANE_DEMO_PASSWORD:-<DEMO_PASSWORD>}"

# Test component (default: all)
COMPONENT="${1:-all}"

# Check if jq is installed
check_dependencies() {
  echo -e "${BLUE}Checking dependencies...${NC}"

  if ! command -v jq &> /dev/null; then
    echo -e "${RED}jq is required but not installed.${NC}"
    echo "Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)"
    exit 1
  fi

  if ! command -v curl &> /dev/null; then
    echo -e "${RED}curl is required but not installed.${NC}"
    exit 1
  fi

  echo -e "${GREEN}✓ Dependencies OK${NC}"
}

# Test API health
test_api() {
  echo -e "\n${BLUE}Testing API...${NC}"

  # Check if API is running
  if ! lsof -i :$API_PORT &> /dev/null; then
    echo -e "${RED}✗ API is not running on port $API_PORT${NC}"
    echo -e "${YELLOW}Start with: cd backend && npm run start:dev${NC}"
    return 1
  fi

  echo -e "${GREEN}✓ API is running on port $API_PORT${NC}"

  # Test health endpoint (with /api prefix)
  echo -e "${BLUE}Testing health endpoint...${NC}"
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$API_PORT/api/health)

  if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
  else
    echo -e "${RED}✗ Health check failed (HTTP $response)${NC}"
    return 1
  fi

  # Test auth endpoints
  echo -e "${BLUE}Testing authentication...${NC}"

  # Try login with test credentials (with /api prefix)
  login_response=$(curl -s -X POST http://localhost:$API_PORT/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"scout1@arcane.com\", \"password\": \"$DEMO_PASSWORD\"}" 2>/dev/null || echo "{}")

  if echo "$login_response" | grep -q "token"; then
    echo -e "${GREEN}✓ Login endpoint working${NC}"
    TOKEN=$(echo "$login_response" | jq -r '.token // .accessToken // empty')

    # Test authenticated endpoint
    if [ ! -z "$TOKEN" ]; then
      auth_response=$(curl -s -o /dev/null -w "%{http_code}" \
        http://localhost:$API_PORT/api/auth/me \
        -H "Authorization: Bearer $TOKEN")

      if [ "$auth_response" = "200" ]; then
        echo -e "${GREEN}✓ Authentication working${NC}"
      else
        echo -e "${YELLOW}⚠ Auth endpoint returned $auth_response${NC}"
      fi
    fi
  else
    echo -e "${YELLOW}⚠ Login endpoint may not be configured with test data${NC}"
  fi

  # Test main endpoints (with /api prefix)
  echo -e "${BLUE}Testing main endpoints...${NC}"

  endpoints=("/api/players" "/api/clubs" "/api/matches/upcoming")
  for endpoint in "${endpoints[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$API_PORT$endpoint)
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
      echo -e "${GREEN}✓ $endpoint OK${NC}"
    else
      echo -e "${YELLOW}⚠ $endpoint returned $response${NC}"
    fi
  done

  echo -e "${GREEN}✓ API tests completed${NC}"
}

# Test Web application
test_web() {
  echo -e "\n${BLUE}Testing Web Application...${NC}"

  # Check if Next.js is running
  if ! lsof -i :$WEB_PORT &> /dev/null; then
    echo -e "${RED}✗ Web app is not running on port $WEB_PORT${NC}"
    echo -e "${YELLOW}Start with: cd web && npm run dev${NC}"
    return 1
  fi

  echo -e "${GREEN}✓ Web app is running on port $WEB_PORT${NC}"

  # Test homepage
  echo -e "${BLUE}Testing web pages...${NC}"

  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$WEB_PORT)
  if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ Homepage loads successfully${NC}"
  else
    echo -e "${RED}✗ Homepage failed (HTTP $response)${NC}"
    return 1
  fi

  # Test static pages
  pages=("/login" "/signup" "/about" "/contact")
  for page in "${pages[@]}"; do
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$WEB_PORT$page)
    if [ "$response" = "200" ] || [ "$response" = "308" ]; then
      echo -e "${GREEN}✓ $page OK${NC}"
    else
      echo -e "${YELLOW}⚠ $page returned $response${NC}"
    fi
  done

  # Check for console errors (basic check)
  echo -e "${BLUE}Checking for JavaScript errors...${NC}"

  # This is a simple check - for real error checking you'd need a headless browser
  html_content=$(curl -s http://localhost:$WEB_PORT)
  if echo "$html_content" | grep -q "__next"; then
    echo -e "${GREEN}✓ Next.js app structure detected${NC}"
  else
    echo -e "${YELLOW}⚠ Unexpected HTML structure${NC}"
  fi

  echo -e "${GREEN}✓ Web tests completed${NC}"
}

# Test Mobile application
test_mobile() {
  echo -e "\n${BLUE}Testing Mobile Application...${NC}"

  # Check if Expo is running
  if ! lsof -i :$MOBILE_PORT &> /dev/null; then
    echo -e "${YELLOW}⚠ Expo is not running on port $MOBILE_PORT${NC}"
    echo -e "${YELLOW}Start with: cd mobile && npx expo start${NC}"

    # Check if Metro bundler is running on alternative port
    if lsof -i :8081 &> /dev/null; then
      echo -e "${GREEN}✓ Metro bundler detected on port 8081${NC}"
      MOBILE_PORT=8081
    else
      return 1
    fi
  else
    echo -e "${GREEN}✓ Expo is running on port $MOBILE_PORT${NC}"
  fi

  # Test Expo status endpoint
  echo -e "${BLUE}Testing Expo/Metro status...${NC}"

  # Try to get Expo manifest
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$MOBILE_PORT/status 2>/dev/null || echo "0")

  if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ Expo/Metro status endpoint OK${NC}"
  else
    echo -e "${YELLOW}⚠ Expo/Metro may be running but status endpoint not accessible${NC}"
  fi

  # Check if mobile app can connect to API
  echo -e "${BLUE}Checking API connectivity from mobile...${NC}"

  # Mobile should be able to reach API (with /api prefix)
  if curl -s http://localhost:$API_PORT/api/health &> /dev/null; then
    echo -e "${GREEN}✓ API is accessible for mobile app${NC}"
  else
    echo -e "${RED}✗ API not accessible - mobile app may have connection issues${NC}"
  fi

  echo -e "${GREEN}✓ Mobile tests completed${NC}"
}

# Integration tests
test_integration() {
  echo -e "\n${BLUE}Running Integration Tests...${NC}"

  # Test data flow: API -> Web
  echo -e "${BLUE}Testing API -> Web integration...${NC}"

  # Get data from API (with /api prefix)
  api_players=$(curl -s http://localhost:$API_PORT/api/players | jq -r '.data // .players // [] | length' 2>/dev/null || echo "0")

  if [ "$api_players" != "0" ]; then
    echo -e "${GREEN}✓ API returns player data${NC}"
  else
    echo -e "${YELLOW}⚠ No player data in API${NC}"
  fi

  # Check if web can reach API
  web_api_check=$(curl -s http://localhost:$WEB_PORT/api/health 2>/dev/null || echo "{}")
  if echo "$web_api_check" | grep -q "ok"; then
    echo -e "${GREEN}✓ Web app can proxy to API${NC}"
  else
    echo -e "${YELLOW}⚠ Web app may not be properly configured for API proxy${NC}"
  fi

  echo -e "${GREEN}✓ Integration tests completed${NC}"
}

# Performance check
test_performance() {
  echo -e "\n${BLUE}Running Performance Checks...${NC}"

  # API response time
  echo -e "${BLUE}API Response Times:${NC}"

  endpoints=("/api/health" "/api/players?limit=10" "/api/clubs?limit=10")
  for endpoint in "${endpoints[@]}"; do
    time_taken=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:$API_PORT$endpoint)
    time_ms=$(echo "$time_taken * 1000" | bc 2>/dev/null || echo "N/A")

    if [ "$time_ms" != "N/A" ]; then
      if (( $(echo "$time_ms < 500" | bc -l) )); then
        echo -e "${GREEN}✓ $endpoint: ${time_ms}ms${NC}"
      elif (( $(echo "$time_ms < 1000" | bc -l) )); then
        echo -e "${YELLOW}⚠ $endpoint: ${time_ms}ms (slow)${NC}"
      else
        echo -e "${RED}✗ $endpoint: ${time_ms}ms (very slow)${NC}"
      fi
    fi
  done

  # Web page load time
  echo -e "${BLUE}Web Page Load Times:${NC}"

  time_taken=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:$WEB_PORT)
  time_ms=$(echo "$time_taken * 1000" | bc 2>/dev/null || echo "N/A")

  if [ "$time_ms" != "N/A" ]; then
    if (( $(echo "$time_ms < 1000" | bc -l) )); then
      echo -e "${GREEN}✓ Homepage: ${time_ms}ms${NC}"
    else
      echo -e "${YELLOW}⚠ Homepage: ${time_ms}ms (slow)${NC}"
    fi
  fi

  echo -e "${GREEN}✓ Performance checks completed${NC}"
}

# Generate report
generate_report() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}         STACK TEST REPORT${NC}"
  echo -e "${BLUE}========================================${NC}"

  # Check each component
  api_status="❌"
  web_status="❌"
  mobile_status="❌"

  if lsof -i :$API_PORT &> /dev/null; then
    if curl -s http://localhost:$API_PORT/api/health &> /dev/null; then
      api_status="✅"
    fi
  fi

  if lsof -i :$WEB_PORT &> /dev/null; then
    if curl -s http://localhost:$WEB_PORT &> /dev/null; then
      web_status="✅"
    fi
  fi

  if lsof -i :$MOBILE_PORT &> /dev/null || lsof -i :8081 &> /dev/null; then
    mobile_status="✅"
  fi

  echo -e "\n${BLUE}Component Status:${NC}"
  echo -e "  API (port $API_PORT):    $api_status"
  echo -e "  Web (port $WEB_PORT):   $web_status"
  echo -e "  Mobile (Expo):  $mobile_status"

  # Recommendations
  echo -e "\n${BLUE}Recommendations:${NC}"

  if [ "$api_status" = "❌" ]; then
    echo -e "  ${YELLOW}• Start API: cd backend && npm run start:dev${NC}"
  fi

  if [ "$web_status" = "❌" ]; then
    echo -e "  ${YELLOW}• Start Web: cd web && npm run dev${NC}"
  fi

  if [ "$mobile_status" = "❌" ]; then
    echo -e "  ${YELLOW}• Start Mobile: cd mobile && npx expo start${NC}"
  fi

  if [ "$api_status" = "✅" ] && [ "$web_status" = "✅" ] && [ "$mobile_status" = "✅" ]; then
    echo -e "  ${GREEN}All services are running! Stack is ready for development.${NC}"
  fi

  echo -e "\n${BLUE}========================================${NC}"
}

# Main execution
main() {
  echo -e "${BLUE}🚀 Arcane Football Stack Tester${NC}"
  echo -e "${BLUE}Testing: $COMPONENT${NC}\n"

  check_dependencies

  case $COMPONENT in
    api)
      test_api
      ;;
    web)
      test_web
      ;;
    mobile)
      test_mobile
      ;;
    all)
      test_api
      test_web
      test_mobile
      test_integration
      test_performance
      ;;
    *)
      echo -e "${RED}Unknown component: $COMPONENT${NC}"
      echo "Usage: $0 [api|web|mobile|all]"
      exit 1
      ;;
  esac

  generate_report
}

# Run main function
main
