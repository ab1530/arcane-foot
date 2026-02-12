#!/bin/bash

# Get auth token
echo "Getting auth token..."
TOKEN=$(curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d @test-login.json \
  -s | jq -r '.accessToken')

echo "Token: ${TOKEN:0:50}..."
echo ""
echo "Testing /api/players endpoint..."
echo ""

# Call players endpoint
curl -v http://localhost:5001/api/players \
  -H "Authorization: Bearer $TOKEN" \
  2>&1 | tee players-response.log

echo ""
echo "Response saved to players-response.log"
