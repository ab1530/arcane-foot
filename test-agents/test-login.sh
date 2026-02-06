#!/bin/bash

# Demo password is provided outside the repo.
DEMO_PASSWORD="${ARCANE_DEMO_PASSWORD:-<DEMO_PASSWORD>}"

# Get auth token
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"scout1@arcane.com\",\"password\":\"$DEMO_PASSWORD\"}" \
  -s | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# Test /players endpoint
echo ""
echo "=== Testing /players endpoint ==="
curl http://localhost:5001/api/players?limit=1 \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -m json.tool

# Test /analytics/dashboard
echo ""
echo "=== Testing /analytics/dashboard endpoint ==="
curl http://localhost:5001/api/analytics/dashboard \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -m json.tool

# Test /auto-scout/history
echo ""
echo "=== Testing /auto-scout/history endpoint ==="
curl http://localhost:5001/api/auto-scout/history \
  -H "Authorization: Bearer $TOKEN" \
  -s | python3 -m json.tool
