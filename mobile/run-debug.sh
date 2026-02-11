#!/bin/bash
echo "🔍 Starting Enhanced Debug Mode..."
echo ""
echo "1. Clearing all caches..."
rm -rf node_modules/.cache .expo 2>/dev/null
echo "   ✅ Caches cleared"
echo ""
echo "2. Starting Metro bundler with verbose logging..."
EXPO_DEBUG=true npx expo start --clear 2>&1 | tee metro-debug.log &
METRO_PID=$!
echo "   Metro PID: $METRO_PID"
echo ""
echo "3. Logs will be saved to: metro-debug.log"
echo "4. Press Ctrl+C to stop"
echo ""
wait $METRO_PID
