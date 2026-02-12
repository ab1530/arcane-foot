const fs = require('fs');
const path = require('path');

// Migration mapping from old theme to new theme
const THEME_MAPPINGS = {
  // Import mappings
  imports: {
    'COLORS': 'colors',
    'SPACING': 'spacing',
    'FONTS': 'typography',
    'BORDER_RADIUS': 'radius',
    'SHADOWS': 'shadows',
    'ANIMATION': 'animations',
  },

  // Color mappings
  colors: {
    'COLORS.dark': 'colors.background.primary',
    'COLORS.darkBg': 'colors.background.secondary',
    'COLORS.darkBorder': 'colors.background.tertiary',
    'COLORS.accent': 'colors.brand.primary',
    'COLORS.accentDark': 'colors.brand.primaryDark',
    'COLORS.grey': 'colors.text.secondary',
    'COLORS.lightGrey': 'colors.surface.borderLight',
    'COLORS.success': 'colors.semantic.success',
    'COLORS.error': 'colors.semantic.error',
    'COLORS.warning': 'colors.semantic.warning',
    'COLORS.info': 'colors.semantic.info',
    'COLORS.glassLight': 'colors.surface.glassLight',
    'COLORS.glass': 'colors.surface.glass',
    'COLORS.glassBorder': 'colors.surface.border',
    'COLORS.glassGlow': 'colors.surface.glassLight',
    'COLORS.cardBg': 'colors.background.elevated',
    'COLORS.danger': 'colors.semantic.error',
    'COLORS.white': 'colors.text.primary',
    'COLORS.textPrimary': 'colors.text.primary',
    'COLORS.textSecondary': 'colors.text.secondary',
    'COLORS.textMuted': 'colors.text.muted',
  },

  // Spacing mappings
  spacing: {
    'SPACING.xs': 'spacing.xs',
    'SPACING.sm': 'spacing.sm',
    'SPACING.md': 'spacing.md',
    'SPACING.lg': 'spacing.lg',
    'SPACING.xl': 'spacing.xl',
    'SPACING.xxl': 'spacing["2xl"]',
  },

  // Typography mappings
  typography: {
    'FONTS.sizes.xs': 'typography.sizes.xs',
    'FONTS.sizes.sm': 'typography.sizes.sm',
    'FONTS.sizes.md': 'typography.sizes.base',
    'FONTS.sizes.lg': 'typography.sizes.lg',
    'FONTS.sizes.xl': 'typography.sizes.xl',
    'FONTS.sizes.xxl': 'typography.sizes.h3',
    'FONTS.sizes.xxxl': 'typography.sizes.h2',
    'FONTS.sizes.title': 'typography.sizes.h1',
    'FONTS.family': 'typography.fonts',
  },

  // Border radius mappings
  radius: {
    'BORDER_RADIUS.xs': 'radius.xs',
    'BORDER_RADIUS.sm': 'radius.sm',
    'BORDER_RADIUS.md': 'radius.md',
    'BORDER_RADIUS.lg': 'radius.lg',
    'BORDER_RADIUS.xl': 'radius.xl',
    'BORDER_RADIUS.full': 'radius.full',
  },

  // Shadow mappings
  shadows: {
    'SHADOWS.sm': 'shadows.sm',
    'SHADOWS.md': 'shadows.md',
    'SHADOWS.lg': 'shadows.lg',
    'SHADOWS.glow': 'shadows.glow',
  },

  // Animation mappings
  animations: {
    'ANIMATION.fast': 'animations.durations.fast',
    'ANIMATION.normal': 'animations.durations.normal',
    'ANIMATION.slow': 'animations.durations.slow',
  },
};

function migrateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Check if file imports from old theme
    if (!content.includes('constants/theme') && !content.includes('@/constants/theme')) {
      return { success: true, modified: false, message: 'No migration needed' };
    }

    // Update import paths
    const importPathsToReplace = [
      { from: /from ['"]\.\.\/\.\.\/constants\/theme['"]/g, to: "from '../../design/theme'" },
      { from: /from ['"]\.\.\/\.\.\/\.\.\/constants\/theme['"]/g, to: "from '../../../design/theme'" },
      { from: /from ['"]@\/constants\/theme['"]/g, to: "from '@/design/theme'" },
    ];

    importPathsToReplace.forEach(({ from, to }) => {
      if (content.match(from)) {
        content = content.replace(from, to);
        modified = true;
      }
    });

    // Replace theme constants in reverse order of length to avoid partial replacements
    const allMappings = [
      ...Object.entries(THEME_MAPPINGS.colors),
      ...Object.entries(THEME_MAPPINGS.spacing),
      ...Object.entries(THEME_MAPPINGS.typography),
      ...Object.entries(THEME_MAPPINGS.radius),
      ...Object.entries(THEME_MAPPINGS.shadows),
      ...Object.entries(THEME_MAPPINGS.animations),
    ].sort((a, b) => b[0].length - a[0].length);

    allMappings.forEach(([oldValue, newValue]) => {
      // Use word boundary to ensure we don't partially replace
      const regex = new RegExp(oldValue.replace(/\./g, '\\.') + '(?![a-zA-Z0-9_])', 'g');
      if (content.match(regex)) {
        content = content.replace(regex, newValue);
        modified = true;
      }
    });

    // Update import names
    Object.entries(THEME_MAPPINGS.imports).forEach(([oldName, newName]) => {
      // Match patterns like: { COLORS, SPACING }
      const patterns = [
        { from: new RegExp(`\\{\\s*${oldName}\\s*,`, 'g'), to: `{ ${newName},` },
        { from: new RegExp(`,\\s*${oldName}\\s*,`, 'g'), to: `, ${newName},` },
        { from: new RegExp(`,\\s*${oldName}\\s*\\}`, 'g'), to: `, ${newName} }` },
        { from: new RegExp(`\\{\\s*${oldName}\\s*\\}`, 'g'), to: `{ ${newName} }` },
      ];

      patterns.forEach(({ from, to }) => {
        if (content.match(from)) {
          content = content.replace(from, to);
          modified = true;
        }
      });
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      return { success: true, modified: true, message: 'Migrated successfully' };
    }

    return { success: true, modified: false, message: 'No changes needed' };
  } catch (error) {
    return { success: false, modified: false, message: error.message };
  }
}

// List of files to migrate
const files = [
  'src/navigation/AppNavigator.tsx',
  'src/navigation/MainTabNavigator.tsx',
  'src/screens/players/PlayerComparisonScreen.tsx',
  'src/screens/scouting/CreateScoutingReportScreen.tsx',
  'src/screens/scouting/ScoutingReportsScreen.tsx',
  'src/screens/settings/SettingsScreen.tsx',
  'src/screens/auth/LoginScreen.tsx',
  'src/screens/auth/SignupScreen.tsx',
  'src/screens/passport/PassportScreen.tsx',
  'src/screens/reports/ReportsScreen.tsx',
  'src/screens/calendar/CalendarScreenNew.tsx',
  'src/screens/clubs/ClubDetailScreen.tsx',
  'src/screens/clubs/ClubsListScreen.tsx',
  'src/screens/ai/ArcaneIndexScreen.tsx',
  'src/screens/ai/AIScreen.tsx',
  'src/screens/ai/ArcaneGPTScreen.tsx',
  'src/screens/dashboard/DashboardScreen.tsx',
  'src/screens/players/PlayerDetailScreen.tsx',
  'src/screens/info/ServicesScreen.tsx',
  'src/screens/info/ContactScreen.tsx',
  'src/screens/info/AboutScreen.tsx',
  'src/screens/camps/CampsScreen.tsx',
  'src/screens/membership/MembershipScreen.tsx',
  'src/components/ui/Skeleton.tsx',
  'src/components/ui/GradientText.tsx',
  'src/components/ui/AnimatedBadge.tsx',
  'src/components/ui/Icon.tsx',
  'src/components/ui/Input.tsx',
  'src/components/ui/EmptyState.tsx',
  'src/components/ui/Avatar.tsx',
  'src/components/ui/Badge.tsx',
  'src/components/ui/LoadingSpinner.tsx',
  'src/components/ui/AnimatedCounter.tsx',
  'src/components/ui/GlassCard.tsx',
  'src/components/search/GlobalSearch.tsx',
  'src/components/charts/BarChart.tsx',
  'src/components/charts/PieChart.tsx',
  'src/components/charts/LineChart.tsx',
  'src/components/notifications/NotificationsCenter.tsx',
];

console.log('🚀 Starting mobile theme migration...\n');

let successCount = 0;
let modifiedCount = 0;
let errorCount = 0;

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  process.stdout.write(`📝 Migrating ${file}... `);

  const result = migrateFile(filePath);

  if (result.success) {
    if (result.modified) {
      console.log('✅ ' + result.message);
      modifiedCount++;
    } else {
      console.log('⏭️  ' + result.message);
    }
    successCount++;
  } else {
    console.log('❌ ' + result.message);
    errorCount++;
  }
});

console.log('\n' + '='.repeat(60));
console.log('📊 Migration Summary:');
console.log('  Total files: ' + files.length);
console.log('  Successfully processed: ' + successCount);
console.log('  Modified: ' + modifiedCount);
console.log('  Errors: ' + errorCount);
console.log('='.repeat(60));

if (modifiedCount > 0) {
  console.log('\n✅ Migration complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Review the changes in each modified file');
  console.log('2. Test the app thoroughly');
  console.log('3. Fix any remaining issues manually');
  console.log('4. Remove or deprecate src/constants/theme.ts');
}
