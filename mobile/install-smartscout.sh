#!/bin/bash

echo "========================================="
echo "SmartScout AI - Installation Script"
echo "========================================="
echo ""

# Check if we're in the mobile directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "Please run this script from the mobile directory"
    exit 1
fi

echo "📦 Installing required package: @react-native-picker/picker"
npm install @react-native-picker/picker

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Installation complete!"
    echo ""
    echo "========================================="
    echo "Next Steps:"
    echo "========================================="
    echo ""
    echo "1. For iOS, install pods:"
    echo "   cd ios && pod install && cd .."
    echo ""
    echo "2. Start the app:"
    echo "   npm start"
    echo ""
    echo "3. Navigate to: AI Screen → SmartScout AI"
    echo ""
    echo "========================================="
    echo "Available Features:"
    echo "========================================="
    echo ""
    echo "✨ Suggestions Tab - Find similar reports"
    echo "✨ Autocomplete Tab - Smart text completion"
    echo "✨ Insights Tab - Player AI analysis"
    echo ""
    echo "For full documentation, see:"
    echo "SMARTSCOUT_AI_IMPLEMENTATION.md"
    echo ""
else
    echo ""
    echo "❌ Installation failed"
    echo "Please try manually: npm install @react-native-picker/picker"
    exit 1
fi
