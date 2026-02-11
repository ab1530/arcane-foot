#!/bin/bash

# Script pour analyser les logs GitLab CI
# Usage: ./scripts/analyze-ci-logs.sh [log-directory]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

LOG_DIR="${1:-aggregated_logs}"

if [ ! -d "$LOG_DIR" ]; then
    echo -e "${RED}Error: Log directory '$LOG_DIR' not found${NC}"
    echo "Usage: $0 [log-directory]"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GitLab CI Logs Analysis${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Fonction pour compter les occurrences
count_pattern() {
    local pattern=$1
    local file=$2
    grep -c "$pattern" "$file" 2>/dev/null || echo "0"
}

# Analyse globale
echo -e "${GREEN}1. Global Summary${NC}"
echo "-------------------"

total_logs=$(find "$LOG_DIR" -name "*.log" -type f | wc -l)
echo "Total log files: $total_logs"

if [ -f "$LOG_DIR/pipeline_summary.md" ]; then
    echo -e "\n${BLUE}Pipeline Summary:${NC}"
    cat "$LOG_DIR/pipeline_summary.md"
fi

echo ""
echo -e "${GREEN}2. Error Analysis${NC}"
echo "-------------------"

# Chercher les erreurs dans tous les logs
errors_found=0
for log_file in "$LOG_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        error_count=$(count_pattern -i "error" "$log_file")
        if [ "$error_count" -gt 0 ]; then
            echo -e "${RED}Found $error_count errors in $(basename "$log_file")${NC}"
            errors_found=$((errors_found + error_count))
        fi
    fi
done

if [ $errors_found -eq 0 ]; then
    echo -e "${GREEN}No errors found!${NC}"
else
    echo -e "${RED}Total errors: $errors_found${NC}"
fi

echo ""
echo -e "${GREEN}3. Warning Analysis${NC}"
echo "-------------------"

warnings_found=0
for log_file in "$LOG_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        warning_count=$(count_pattern -i "warn" "$log_file")
        if [ "$warning_count" -gt 0 ]; then
            echo -e "${YELLOW}Found $warning_count warnings in $(basename "$log_file")${NC}"
            warnings_found=$((warnings_found + warning_count))
        fi
    fi
done

if [ $warnings_found -eq 0 ]; then
    echo -e "${GREEN}No warnings found!${NC}"
else
    echo -e "${YELLOW}Total warnings: $warnings_found${NC}"
fi

echo ""
echo -e "${GREEN}4. Performance Metrics${NC}"
echo "-------------------"

# Analyser les temps d'exécution
for log_file in "$LOG_DIR"/*.log; do
    if [ -f "$log_file" ]; then
        start_time=$(grep "started at" "$log_file" | head -1 | awk '{print $NF}')
        end_time=$(grep "finished at" "$log_file" | head -1 | awk '{print $NF}')

        if [ -n "$start_time" ] && [ -n "$end_time" ]; then
            echo "$(basename "$log_file"): $start_time - $end_time"
        fi
    fi
done

echo ""
echo -e "${GREEN}5. Test Results${NC}"
echo "-------------------"

# Chercher les résultats de tests
if [ -f "$LOG_DIR/qa_report.md" ]; then
    cat "$LOG_DIR/qa_report.md"
fi

# Chercher dans les logs de tests
for log_file in "$LOG_DIR"/unit_test_*.log "$LOG_DIR"/qa_*.log; do
    if [ -f "$log_file" ]; then
        passed=$(count_pattern "PASS" "$log_file")
        failed=$(count_pattern "FAIL" "$log_file")

        if [ "$passed" -gt 0 ] || [ "$failed" -gt 0 ]; then
            echo "$(basename "$log_file"): ${GREEN}$passed passed${NC}, ${RED}$failed failed${NC}"
        fi
    fi
done

echo ""
echo -e "${GREEN}6. Coverage Reports${NC}"
echo "-------------------"

if [ -d "$LOG_DIR/coverage" ]; then
    echo "Coverage reports available in: $LOG_DIR/coverage"
    find "$LOG_DIR/coverage" -name "*.html" -o -name "*.xml" | head -5
else
    echo "No coverage reports found"
fi

echo ""
echo -e "${GREEN}7. Top Issues${NC}"
echo "-------------------"

# Extraire les erreurs les plus fréquentes
echo "Most common error patterns:"
grep -rhi "error" "$LOG_DIR"/*.log 2>/dev/null | \
    grep -v "0 errors" | \
    sort | uniq -c | sort -rn | head -5 | \
    sed 's/^/  /'

echo ""
echo -e "${GREEN}8. Log File Sizes${NC}"
echo "-------------------"

du -h "$LOG_DIR"/*.log 2>/dev/null | sort -rh | head -10

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Analysis Complete${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Detailed logs available in: $LOG_DIR"
echo ""

# Créer un rapport JSON pour l'automatisation
cat > "$LOG_DIR/analysis_report.json" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_logs": $total_logs,
  "errors": $errors_found,
  "warnings": $warnings_found,
  "status": "$([ $errors_found -eq 0 ] && echo "success" || echo "failure")"
}
EOF

echo -e "${GREEN}JSON report created: $LOG_DIR/analysis_report.json${NC}"
