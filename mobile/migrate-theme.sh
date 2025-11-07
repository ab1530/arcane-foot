#!/bin/bash

# Theme Migration Script
# Migrates from @/constants/theme to @/design/theme

echo "🚀 Starting mobile theme migration..."

# Define the list of files to migrate
FILES=(
  "src/screens/players/PlayerComparisonScreen.tsx"
  "src/navigation/AppNavigator.tsx"
  "src/screens/scouting/CreateScoutingReportScreen.tsx"
  "src/screens/scouting/ScoutingReportsScreen.tsx"
  "src/screens/settings/SettingsScreen.tsx"
  "src/screens/auth/LoginScreen.tsx"
  "src/screens/passport/PassportScreen.tsx"
  "src/navigation/MainTabNavigator.tsx"
  "src/components/ui/Skeleton.tsx"
  "src/components/ui/GradientText.tsx"
  "src/components/ui/AnimatedBadge.tsx"
  "src/screens/reports/ReportsScreen.tsx"
  "src/screens/calendar/CalendarScreenNew.tsx"
  "src/screens/clubs/ClubDetailScreen.tsx"
  "src/screens/ai/ArcaneIndexScreen.tsx"
  "src/screens/dashboard/DashboardScreen.tsx"
  "src/screens/players/PlayerDetailScreen.tsx"
  "src/screens/info/ServicesScreen.tsx"
  "src/screens/info/ContactScreen.tsx"
  "src/screens/info/AboutScreen.tsx"
  "src/screens/clubs/ClubsListScreen.tsx"
  "src/screens/camps/CampsScreen.tsx"
  "src/screens/ai/AIScreen.tsx"
  "src/components/ui/Icon.tsx"
  "src/components/search/GlobalSearch.tsx"
  "src/components/charts/BarChart.tsx"
  "src/components/charts/PieChart.tsx"
  "src/components/charts/LineChart.tsx"
  "src/components/notifications/NotificationsCenter.tsx"
  "src/screens/membership/MembershipScreen.tsx"
  "src/screens/ai/ArcaneGPTScreen.tsx"
  "src/screens/auth/SignupScreen.tsx"
  "src/components/ui/Input.tsx"
  "src/components/ui/EmptyState.tsx"
  "src/components/ui/Avatar.tsx"
  "src/components/ui/Badge.tsx"
  "src/components/ui/LoadingSpinner.tsx"
  "src/components/ui/AnimatedCounter.tsx"
  "src/components/ui/Button.tsx"
  "src/components/ui/GlassCard.tsx"
)

count=0
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Migrating $file..."

    # Update import statement
    sed -i '' "s|from '../../constants/theme'|from '../../design/theme'|g" "$file"
    sed -i '' "s|from '../../../constants/theme'|from '../../../design/theme'|g" "$file"
    sed -i '' "s|from '@/constants/theme'|from '@/design/theme'|g" "$file"

    # Update named imports to new theme structure
    # COLORS -> colors
    sed -i '' 's/COLORS\.dark\b/colors.background.primary/g' "$file"
    sed -i '' 's/COLORS\.darkBg\b/colors.background.secondary/g' "$file"
    sed -i '' 's/COLORS\.darkBorder\b/colors.background.tertiary/g' "$file"
    sed -i '' 's/COLORS\.accent\b/colors.brand.primary/g' "$file"
    sed -i '' 's/COLORS\.accentDark\b/colors.brand.primaryDark/g' "$file"
    sed -i '' 's/COLORS\.grey\b/colors.text.secondary/g' "$file"
    sed -i '' 's/COLORS\.lightGrey\b/colors.surface.borderLight/g' "$file"
    sed -i '' 's/COLORS\.success\b/colors.semantic.success/g' "$file"
    sed -i '' 's/COLORS\.error\b/colors.semantic.error/g' "$file"
    sed -i '' 's/COLORS\.warning\b/colors.semantic.warning/g' "$file"
    sed -i '' 's/COLORS\.info\b/colors.semantic.info/g' "$file"
    sed -i '' 's/COLORS\.glassLight\b/colors.surface.glassLight/g' "$file"
    sed -i '' 's/COLORS\.glass\b/colors.surface.glass/g' "$file"
    sed -i '' 's/COLORS\.glassBorder\b/colors.surface.border/g' "$file"
    sed -i '' 's/COLORS\.glassGlow\b/colors.surface.glassLight/g' "$file"
    sed -i '' 's/COLORS\.cardBg\b/colors.background.elevated/g' "$file"
    sed -i '' 's/COLORS\.danger\b/colors.semantic.error/g' "$file"
    sed -i '' 's/COLORS\.white\b/colors.text.primary/g' "$file"
    sed -i '' 's/COLORS\.textPrimary\b/colors.text.primary/g' "$file"
    sed -i '' 's/COLORS\.textSecondary\b/colors.text.secondary/g' "$file"
    sed -i '' 's/COLORS\.textMuted\b/colors.text.muted/g' "$file"

    # SPACING -> spacing
    sed -i '' 's/SPACING\.xs\b/spacing.xs/g' "$file"
    sed -i '' 's/SPACING\.sm\b/spacing.sm/g' "$file"
    sed -i '' 's/SPACING\.md\b/spacing.md/g' "$file"
    sed -i '' 's/SPACING\.lg\b/spacing.lg/g' "$file"
    sed -i '' 's/SPACING\.xl\b/spacing.xl/g' "$file"
    sed -i '' 's/SPACING\.xxl\b/spacing["2xl"]/g' "$file"

    # FONTS -> typography
    sed -i '' 's/FONTS\.sizes\.xs\b/typography.sizes.xs/g' "$file"
    sed -i '' 's/FONTS\.sizes\.sm\b/typography.sizes.sm/g' "$file"
    sed -i '' 's/FONTS\.sizes\.md\b/typography.sizes.base/g' "$file"
    sed -i '' 's/FONTS\.sizes\.lg\b/typography.sizes.lg/g' "$file"
    sed -i '' 's/FONTS\.sizes\.xl\b/typography.sizes.xl/g' "$file"
    sed -i '' 's/FONTS\.sizes\.xxl\b/typography.sizes.h3/g' "$file"
    sed -i '' 's/FONTS\.sizes\.xxxl\b/typography.sizes.h2/g' "$file"
    sed -i '' 's/FONTS\.sizes\.title\b/typography.sizes.h1/g' "$file"
    sed -i '' 's/FONTS\.family/typography.fonts/g' "$file"

    # BORDER_RADIUS -> radius
    sed -i '' 's/BORDER_RADIUS\.xs\b/radius.xs/g' "$file"
    sed -i '' 's/BORDER_RADIUS\.sm\b/radius.sm/g' "$file"
    sed -i '' 's/BORDER_RADIUS\.md\b/radius.md/g' "$file"
    sed -i '' 's/BORDER_RADIUS\.lg\b/radius.lg/g' "$file"
    sed -i '' 's/BORDER_RADIUS\.xl\b/radius.xl/g' "$file"
    sed -i '' 's/BORDER_RADIUS\.full\b/radius.full/g' "$file"

    # SHADOWS -> shadows
    sed -i '' 's/SHADOWS\.sm\b/shadows.sm/g' "$file"
    sed -i '' 's/SHADOWS\.md\b/shadows.md/g' "$file"
    sed -i '' 's/SHADOWS\.lg\b/shadows.lg/g' "$file"
    sed -i '' 's/SHADOWS\.glow\b/shadows.glow/g' "$file"

    # ANIMATION -> animations.durations
    sed -i '' 's/ANIMATION\.fast\b/animations.durations.fast/g' "$file"
    sed -i '' 's/ANIMATION\.normal\b/animations.durations.normal/g' "$file"
    sed -i '' 's/ANIMATION\.slow\b/animations.durations.slow/g' "$file"

    # Update import names in the import statement
    sed -i '' 's/{ COLORS,/{ colors,/g' "$file"
    sed -i '' 's/, COLORS,/, colors,/g' "$file"
    sed -i '' 's/, COLORS }/, colors }/g' "$file"
    sed -i '' 's/{ COLORS }/{ colors }/g' "$file"

    sed -i '' 's/ SPACING,/ spacing,/g' "$file"
    sed -i '' 's/, SPACING }/, spacing }/g' "$file"
    sed -i '' 's/{ SPACING }/{ spacing }/g' "$file"

    sed -i '' 's/ FONTS,/ typography,/g' "$file"
    sed -i '' 's/, FONTS }/, typography }/g' "$file"
    sed -i '' 's/{ FONTS }/{ typography }/g' "$file"

    sed -i '' 's/ BORDER_RADIUS,/ radius,/g' "$file"
    sed -i '' 's/, BORDER_RADIUS }/, radius }/g' "$file"
    sed -i '' 's/{ BORDER_RADIUS }/{ radius }/g' "$file"

    sed -i '' 's/ SHADOWS,/ shadows,/g' "$file"
    sed -i '' 's/, SHADOWS }/, shadows }/g' "$file"
    sed -i '' 's/{ SHADOWS }/{ shadows }/g' "$file"

    sed -i '' 's/ ANIMATION,/ animations,/g' "$file"
    sed -i '' 's/, ANIMATION }/, animations }/g' "$file"
    sed -i '' 's/{ ANIMATION }/{ animations }/g' "$file"

    count=$((count + 1))
  else
    echo "⚠️  File not found: $file"
  fi
done

echo "✅ Migration complete! Updated $count files."
echo ""
echo "📋 Next steps:"
echo "1. Review the changes in each file"
echo "2. Test the app thoroughly"
echo "3. Fix any remaining issues manually"
echo "4. Remove or deprecate src/constants/theme.ts"
