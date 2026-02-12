// Initialize Expo Log Bridge FIRST (before any other imports)
import { logBridge } from './src/logging/expoLogBridge';

// Initialize with colors and file logging enabled
logBridge.init({
  enableColors: true,
  enableFileLogging: true,
  enableSentry: false, // Will be enabled after Sentry setup
  timestampFormat: 'TIME_ONLY',
});

// Enhanced error tracking AFTER log bridge initialization
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error, isFatal) => {
    // Use log bridge for consistent formatting
    logBridge.error(
      `${isFatal ? 'FATAL' : 'UNHANDLED'} ERROR: ${error.message}`,
      'ERROR',
      error,
      { isFatal, stack: error.stack }
    );

    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
