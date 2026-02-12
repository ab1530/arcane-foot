#!/bin/bash

# Script pour télécharger les logs d'un pipeline GitLab
# Usage: ./scripts/download-gitlab-logs.sh <pipeline-id>

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITLAB_URL="${GITLAB_URL:-https://gitlab.com}"
PROJECT_ID="${GITLAB_PROJECT_ID}"
GITLAB_TOKEN="${GITLAB_TOKEN}"

# Fonction d'aide
show_help() {
    echo -e "${BLUE}GitLab CI Logs Downloader${NC}"
    echo ""
    echo "Usage: $0 <pipeline-id> [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -p, --project <id>      GitLab project ID"
    echo "  -t, --token <token>     GitLab access token"
    echo "  -u, --url <url>         GitLab URL (default: https://gitlab.com)"
    echo "  -o, --output <dir>      Output directory (default: ./pipeline-logs-<id>)"
    echo ""
    echo "Environment variables:"
    echo "  GITLAB_PROJECT_ID       GitLab project ID"
    echo "  GITLAB_TOKEN            GitLab access token"
    echo "  GITLAB_URL              GitLab URL"
    echo ""
    echo "Example:"
    echo "  $0 123456"
    echo "  $0 123456 -p 789 -t glpat-xxxx"
    echo "  GITLAB_PROJECT_ID=789 GITLAB_TOKEN=glpat-xxxx $0 123456"
    echo ""
}

# Parse arguments
PIPELINE_ID=""
OUTPUT_DIR=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -p|--project)
            PROJECT_ID="$2"
            shift 2
            ;;
        -t|--token)
            GITLAB_TOKEN="$2"
            shift 2
            ;;
        -u|--url)
            GITLAB_URL="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        *)
            if [ -z "$PIPELINE_ID" ]; then
                PIPELINE_ID="$1"
            else
                echo -e "${RED}Error: Unknown argument: $1${NC}"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Vérifications
if [ -z "$PIPELINE_ID" ]; then
    echo -e "${RED}Error: Pipeline ID is required${NC}"
    show_help
    exit 1
fi

if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: GitLab project ID not set${NC}"
    echo "Set GITLAB_PROJECT_ID environment variable or use -p option"
    exit 1
fi

if [ -z "$GITLAB_TOKEN" ]; then
    echo -e "${RED}Error: GitLab token not set${NC}"
    echo "Set GITLAB_TOKEN environment variable or use -t option"
    exit 1
fi

# Définir le répertoire de sortie
if [ -z "$OUTPUT_DIR" ]; then
    OUTPUT_DIR="pipeline-logs-${PIPELINE_ID}"
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GitLab CI Logs Downloader${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Pipeline ID: $PIPELINE_ID"
echo "Project ID: $PROJECT_ID"
echo "GitLab URL: $GITLAB_URL"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Créer le répertoire de sortie
mkdir -p "$OUTPUT_DIR"

# API endpoints
API_BASE="${GITLAB_URL}/api/v4"
PIPELINE_API="${API_BASE}/projects/${PROJECT_ID}/pipelines/${PIPELINE_ID}"

# Fonction pour faire des requêtes à l'API GitLab
gitlab_api() {
    local endpoint=$1
    curl -s -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" "${endpoint}"
}

echo -e "${GREEN}1. Fetching pipeline information...${NC}"

# Récupérer les informations du pipeline
PIPELINE_INFO=$(gitlab_api "$PIPELINE_API")

if [ -z "$PIPELINE_INFO" ] || [ "$PIPELINE_INFO" == "null" ]; then
    echo -e "${RED}Error: Pipeline not found${NC}"
    exit 1
fi

PIPELINE_STATUS=$(echo "$PIPELINE_INFO" | jq -r '.status')
PIPELINE_REF=$(echo "$PIPELINE_INFO" | jq -r '.ref')
PIPELINE_SHA=$(echo "$PIPELINE_INFO" | jq -r '.sha')

echo "Status: $PIPELINE_STATUS"
echo "Branch: $PIPELINE_REF"
echo "Commit: $PIPELINE_SHA"
echo ""

echo -e "${GREEN}2. Fetching pipeline jobs...${NC}"

# Récupérer les jobs du pipeline
JOBS=$(gitlab_api "${PIPELINE_API}/jobs")

if [ -z "$JOBS" ] || [ "$JOBS" == "[]" ]; then
    echo -e "${RED}Error: No jobs found${NC}"
    exit 1
fi

JOB_COUNT=$(echo "$JOBS" | jq '. | length')
echo "Found $JOB_COUNT jobs"
echo ""

echo -e "${GREEN}3. Downloading job logs...${NC}"

# Télécharger les logs de chaque job
echo "$JOBS" | jq -c '.[]' | while read -r job; do
    JOB_ID=$(echo "$job" | jq -r '.id')
    JOB_NAME=$(echo "$job" | jq -r '.name')
    JOB_STATUS=$(echo "$job" | jq -r '.status')

    echo -e "  ${BLUE}Job: ${JOB_NAME} (${JOB_STATUS})${NC}"

    # Télécharger le log du job
    JOB_LOG=$(gitlab_api "${API_BASE}/projects/${PROJECT_ID}/jobs/${JOB_ID}/trace")

    if [ -n "$JOB_LOG" ]; then
        LOG_FILE="${OUTPUT_DIR}/${JOB_NAME}_${JOB_ID}.log"
        echo "$JOB_LOG" > "$LOG_FILE"
        echo "    ✓ Saved to: $LOG_FILE"
    else
        echo "    ✗ No log available"
    fi
done

echo ""
echo -e "${GREEN}4. Checking for artifacts...${NC}"

# Chercher le job aggregate_logs
AGGREGATE_JOB=$(echo "$JOBS" | jq -r '.[] | select(.name == "aggregate_logs") | .id')

if [ -n "$AGGREGATE_JOB" ] && [ "$AGGREGATE_JOB" != "null" ]; then
    echo "Found aggregate_logs job: $AGGREGATE_JOB"

    # Télécharger les artifacts
    ARTIFACTS_URL="${API_BASE}/projects/${PROJECT_ID}/jobs/${AGGREGATE_JOB}/artifacts"

    echo "Downloading artifacts..."
    curl -s -H "PRIVATE-TOKEN: ${GITLAB_TOKEN}" "${ARTIFACTS_URL}" -o "${OUTPUT_DIR}/artifacts.zip"

    if [ -f "${OUTPUT_DIR}/artifacts.zip" ]; then
        echo "Extracting artifacts..."
        unzip -q -o "${OUTPUT_DIR}/artifacts.zip" -d "${OUTPUT_DIR}"
        rm "${OUTPUT_DIR}/artifacts.zip"
        echo "✓ Artifacts extracted"
    else
        echo "✗ No artifacts available"
    fi
else
    echo "No aggregate_logs job found"
fi

echo ""
echo -e "${GREEN}5. Creating summary...${NC}"

# Créer un fichier de résumé
cat > "${OUTPUT_DIR}/download_summary.md" <<EOF
# Pipeline Logs Summary

## Pipeline Information
- **Pipeline ID**: ${PIPELINE_ID}
- **Status**: ${PIPELINE_STATUS}
- **Branch**: ${PIPELINE_REF}
- **Commit**: ${PIPELINE_SHA}
- **Downloaded**: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

## Jobs
EOF

echo "$JOBS" | jq -r '.[] | "- **\(.name)**: \(.status) (ID: \(.id))"' >> "${OUTPUT_DIR}/download_summary.md"

echo ""
cat >> "${OUTPUT_DIR}/download_summary.md" <<EOF

## Files Downloaded
EOF

find "$OUTPUT_DIR" -name "*.log" -type f | while read -r file; do
    size=$(du -h "$file" | cut -f1)
    echo "- $(basename "$file") ($size)" >> "${OUTPUT_DIR}/download_summary.md"
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Download Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Logs saved to: ${OUTPUT_DIR}"
echo ""
echo "Next steps:"
echo "  1. cd ${OUTPUT_DIR}"
echo "  2. cat download_summary.md"
echo "  3. ../scripts/analyze-ci-logs.sh ."
echo ""

# Afficher le résumé
cat "${OUTPUT_DIR}/download_summary.md"
