#!/bin/bash
# Script to generate coverage badge data for GitLab

set -e

# Check if coverage-summary.json exists
if [ ! -f "backend/coverage/coverage-summary.json" ]; then
  echo "Coverage summary file not found!"
  exit 1
fi

# Extract total coverage percentage
COVERAGE=$(node -pe "JSON.parse(require('fs').readFileSync('backend/coverage/coverage-summary.json', 'utf8')).total.lines.pct")

echo "Total coverage: ${COVERAGE}%"

# Create coverage badge data
echo "COVERAGE=${COVERAGE}" > backend/coverage/coverage.env

# Determine badge color based on coverage
# Use awk for floating point comparison (bc might not be available)
if awk "BEGIN {exit !($COVERAGE >= 80)}"; then
  COLOR="success"
elif awk "BEGIN {exit !($COVERAGE >= 50)}"; then
  COLOR="warning"
else
  COLOR="critical"
fi

echo "COLOR=${COLOR}" >> backend/coverage/coverage.env

echo "Coverage badge data generated successfully"
cat backend/coverage/coverage.env
