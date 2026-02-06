import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

const commonGlobals = {
  ...globals.browser,
  ...globals.node,
  __DEV__: 'readonly',
  ErrorUtils: 'readonly',
  NodeJS: 'readonly',
};

const ignores = [
  'node_modules/**',
  'android/**',
  'ios/**',
  '.expo/**',
  'dist/**',
  'coverage/**',
  '__mocks__/**',
  'scripts/**',
  '*.config.js',
  '*.config.cjs',
  '*.config.mjs',
  'babel.config.js',
  'metro.config.js',
  'jest.config.js',
  'jest.setup.js',
  'debug-imports.js',
  'error-handler.js',
  'test-api.js',
  'src/**/__tests__/**',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/*.test.ts',
  '**/*.test.tsx',
];

export default [
  {
    ignores,
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        ...commonGlobals,
      },
    },
  },
  {
    ...js.configs.recommended,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...commonGlobals,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': 'off',
      'no-useless-catch': 'off',
    },
  },
];
