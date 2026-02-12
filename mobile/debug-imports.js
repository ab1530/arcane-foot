/**
 * DEBUG SCRIPT - Test theme imports
 * Run this to see the exact state of theme exports
 */

console.log('\n=== TESTING THEME IMPORTS ===\n');

try {
  console.log('1. Importing tokens...');
  const tokens = require('./src/design/tokens.ts');
  console.log('   ✅ tokens.spacing:', Object.keys(tokens.spacing || {}));

  console.log('\n2. Importing theme...');
  const themeModule = require('./src/design/theme.ts');
  console.log('   ✅ theme.spacing:', Object.keys(themeModule.spacing || {}));
  console.log('   ✅ theme.spacing.sm:', themeModule.spacing?.sm);

  console.log('\n3. Importing from barrel (index.ts)...');
  const designIndex = require('./src/design/index.ts');
  console.log('   ✅ spacing from index:', Object.keys(designIndex.spacing || {}));
  console.log('   ✅ spacing.sm from index:', designIndex.spacing?.sm);

  console.log('\n4. Testing Button component import...');
  const Button = require('./src/design/components/Button.tsx');
  console.log('   ✅ Button imported');

  console.log('\n=== ALL IMPORTS SUCCESSFUL ===\n');
} catch (error) {
  console.error('\n❌ ERROR:', error.message);
  console.error('Stack:', error.stack);
}
