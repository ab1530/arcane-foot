#!/bin/bash

# Script to replace console.error with logError in web source files
# Excludes: logger.ts (intentional), sw-register.ts (service worker), test files

WEB_SRC="/Users/lakhdari/Desktop/AppFoot/web/src"

# Files to process (excluding logger.ts and sw-register.ts)
FILES=(
  "$WEB_SRC/app/reports/page.tsx"
  "$WEB_SRC/app/reports/[id]/page.tsx"
  "$WEB_SRC/app/market/page.tsx"
  "$WEB_SRC/app/calendar/page.tsx"
  "$WEB_SRC/app/login/page.tsx"
  "$WEB_SRC/app/signup/page.tsx"
  "$WEB_SRC/app/pricing/page.tsx"
  "$WEB_SRC/app/profile/page.tsx"
  "$WEB_SRC/app/dashboard/page.tsx"
  "$WEB_SRC/app/my-camps/page.tsx"
  "$WEB_SRC/app/camps/page.tsx"
  "$WEB_SRC/app/camps/[id]/page.tsx"
  "$WEB_SRC/app/passport/[token]/page.tsx"
  "$WEB_SRC/app/players/page.tsx"
  "$WEB_SRC/app/players/[id]/page.tsx"
  "$WEB_SRC/app/clubs/[id]/page.tsx"
  "$WEB_SRC/app/ai/arkane-gpt/page.tsx"
  "$WEB_SRC/components/search/GlobalSearch.tsx"
  "$WEB_SRC/components/reports/create-report-modal.tsx"
  "$WEB_SRC/components/calendar/create-match-modal.tsx"
  "$WEB_SRC/components/calendar/assign-scout-modal.tsx"
  "$WEB_SRC/contexts/auth-context.tsx"
  "$WEB_SRC/hooks/useSubscription.ts"
  "$WEB_SRC/lib/api-client.ts"
)

echo "Replacing console.error with logError..."
echo "==========================================="

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    # Count occurrences before
    before_count=$(grep -c "console\.error" "$file" || echo "0")

    if [ "$before_count" -gt 0 ]; then
      echo "Processing: $file ($before_count occurrences)"

      # Check if logError import exists
      if ! grep -q "import.*logError.*from.*@/lib/logger" "$file"; then
        echo "  → Adding logError import"
        # Add import after the last import statement
        sed -i '' '/^import/!b; :a; n; /^import/ba; i\
import { logError } from "@/lib/logger";
' "$file"
      fi

      echo "  → File processed"
    fi
  fi
done

echo ""
echo "Manual replacement still needed for complex cases."
echo "Please review and manually update console.error -> logError where appropriate."
