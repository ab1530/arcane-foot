#!/bin/bash

echo "🧹 Replacing console.log with Logger in backend..."

# Replace console.log with logger.log
find src -name "*.ts" -not -path "*/*.spec.ts" -exec sed -i '' 's/console\.log(/logger.log(/g' {} \;

# Replace console.error with logger.error
find src -name "*.ts" -not -path "*/*.spec.ts" -exec sed -i '' 's/console\.error(/logger.error(/g' {} \;

# Replace console.warn with logger.warn
find src -name "*.ts" -not -path "*/*.spec.ts" -exec sed -i '' 's/console\.warn(/logger.warn(/g' {} \;

echo "✅ Console.log replacement complete!"
echo ""
echo "⚠️  Note: You may need to:"
echo "  1. Import Logger from @nestjs/common in some files"
echo "  2. Add 'private readonly logger = new Logger(ClassName.name);' in classes"
echo ""
echo "Checking remaining console statements..."
grep -r "console\.\(log\|error\|warn\)" src/ --include="*.ts" | grep -v "\.spec\.ts" | wc -l