module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js', '<rootDir>/setupJestExpoPolyfill.js'],
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  moduleNameMapper: {
    '^design/(.*)$': '<rootDir>/../design/$1',
    '^@shared/(.*)$': '<rootDir>/../shared/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-native-community|expo(nent)?|expo-.*|@expo(nent)?/.*|@react-navigation/.*|react-native-svg|@testing-library|@unimodules|unimodules-.*|sentry-expo|@sentry/.*|victory|victory-native|@shopify/react-native-skia)/)',
  ],
};
