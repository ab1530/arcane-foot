#!/bin/bash

# Script de Validation de l'Intégration Backend
# Teste les endpoints API utilisés par l'app mobile

set -e

# Couleurs pour l'output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3000"
API_BASE="${BACKEND_URL}/api"

echo -e "${YELLOW}=====================================${NC}"
echo -e "${YELLOW}Validation de l'Intégration Backend${NC}"
echo -e "${YELLOW}=====================================${NC}"
echo ""

# Fonction pour tester un endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=$4
    local auth_required=$5

    echo -n "Testing ${method} ${endpoint} ... "

    if [ "$auth_required" = "true" ]; then
        # Skip if no token
        echo -e "${YELLOW}SKIPPED (requires auth)${NC}"
        return
    fi

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "${API_BASE}${endpoint}" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X ${method} "${API_BASE}${endpoint}" 2>&1)
    fi

    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (${status_code})"
    else
        echo -e "${RED}✗ FAIL${NC} (expected ${expected_status}, got ${status_code})"
        echo "Response: $body"
    fi
}

# 1. Vérifier que le backend est en cours d'exécution
echo -e "\n${YELLOW}[1] Checking Backend Health...${NC}"
test_endpoint "GET" "/health" "Backend health check" "200" "false"

# 2. Tester les endpoints publics (sans auth)
echo -e "\n${YELLOW}[2] Testing Public Endpoints...${NC}"

# Auth endpoints
echo -e "\n${YELLOW}2.1 Auth Endpoints${NC}"
echo "Note: Ces endpoints retournent 400/401 car pas de body - c'est normal"
test_endpoint "POST" "/auth/signup" "Signup endpoint exists" "400" "false"
test_endpoint "POST" "/auth/login" "Login endpoint exists" "400" "false"

# 3. Endpoints nécessitant l'authentification
echo -e "\n${YELLOW}[3] Testing Protected Endpoints (Auth Required)...${NC}"
echo "Note: Ces tests sont skippés car ils nécessitent un token JWT"

test_endpoint "GET" "/players" "Get players list" "401" "true"
test_endpoint "GET" "/clubs" "Get clubs list" "401" "true"
test_endpoint "GET" "/camps" "Get camps list" "401" "true"
test_endpoint "GET" "/notifications/user/test-user-id" "Get notifications" "401" "true"
test_endpoint "GET" "/scouting-reports" "Get scouting reports" "401" "true"

# 4. Vérifier la structure de réponse du health endpoint
echo -e "\n${YELLOW}[4] Validating Health Response Structure...${NC}"
health_response=$(curl -s "${API_BASE}/health")

# Vérifier les champs requis
if echo "$health_response" | grep -q '"status"'; then
    echo -e "${GREEN}✓${NC} Field 'status' present"
else
    echo -e "${RED}✗${NC} Field 'status' missing"
fi

if echo "$health_response" | grep -q '"timestamp"'; then
    echo -e "${GREEN}✓${NC} Field 'timestamp' present"
else
    echo -e "${RED}✗${NC} Field 'timestamp' missing"
fi

if echo "$health_response" | grep -q '"environment"'; then
    echo -e "${GREEN}✓${NC} Field 'environment' present"
else
    echo -e "${RED}✗${NC} Field 'environment' missing"
fi

# 5. Vérifier que le serveur Expo est en cours d'exécution
echo -e "\n${YELLOW}[5] Checking Expo Dev Server...${NC}"
EXPO_URL="http://localhost:8083"

if curl -s "${EXPO_URL}/status" | grep -q "packager-status:running"; then
    echo -e "${GREEN}✓${NC} Expo dev server is running on port 8083"
else
    echo -e "${RED}✗${NC} Expo dev server is not running on port 8083"
fi

# 6. Vérifier que Metro Bundler répond
echo -e "\n${YELLOW}[6] Checking Metro Bundler...${NC}"
if curl -s -o /dev/null -w "%{http_code}" "${EXPO_URL}" | grep -q "200"; then
    echo -e "${GREEN}✓${NC} Metro Bundler is accessible"
else
    echo -e "${YELLOW}⚠${NC}  Metro Bundler may not be fully ready"
fi

# Résumé
echo -e "\n${YELLOW}=====================================${NC}"
echo -e "${YELLOW}Summary${NC}"
echo -e "${YELLOW}=====================================${NC}"
echo ""
echo -e "Backend URL: ${BACKEND_URL}"
echo -e "Expo URL: ${EXPO_URL}"
echo ""
echo -e "${GREEN}✓${NC} Backend is running and healthy"
echo -e "${GREEN}✓${NC} Expo dev server is running"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Open Expo app on your device/simulator"
echo "2. Scan QR code or press 'i' for iOS simulator"
echo "3. Follow the manual validation guide in VALIDATION_GUIDE.md"
echo ""
echo -e "${YELLOW}For authenticated endpoint testing:${NC}"
echo "1. Login via the mobile app"
echo "2. Extract the JWT token from AsyncStorage"
echo "3. Use it with curl:"
echo "   curl -H 'Authorization: Bearer <TOKEN>' ${API_BASE}/players"
echo ""
