/**
 * Enhanced Error Handler
 * Add this at the TOP of index.js before any other imports
 */

// Capture all errors with full stack traces
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Fatal:', isFatal);
  console.error('Error:', error);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  console.error('===========================');
});

// Capture unhandled promise rejections
const originalPromiseRejection = console.warn;
global.addEventListener?.('unhandledrejection', (event) => {
  console.error('=== UNHANDLED PROMISE REJECTION ===');
  console.error('Reason:', event.reason);
  console.error('Promise:', event.promise);
  console.error('===================================');
});

// Override console.error to capture all errors
const originalError = console.error;
console.error = (...args) => {
  originalError('[CAPTURED ERROR]', ...args);
  if (args[0]?.stack) {
    originalError('[STACK TRACE]', args[0].stack);
  }
};

console.log('✅ Enhanced error handler installed');
