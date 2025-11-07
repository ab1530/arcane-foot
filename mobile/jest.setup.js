// Minimal React Native / Expo test polyfills

// 1. Jest expect extensions (gesture handler and testing-library)
try {
  require('react-native-gesture-handler/jestSetup');
} catch (error) {
  // ignore if module missing in tree
}

// 2. Global flags expected by Expo/React Native
if (typeof global.XMLHttpRequest === 'undefined') {
  global.XMLHttpRequest = function XMLHttpRequestStub() {};
}

if (typeof global.__DEV__ === 'undefined') {
  global.__DEV__ = true;
}

if (!global.self) {
  global.self = global;
}

const NativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');

if (!NativeModules.UIManager) {
  NativeModules.UIManager = {};
}

if (!NativeModules.NativeUnimoduleProxy || typeof NativeModules.NativeUnimoduleProxy !== 'object') {
  NativeModules.NativeUnimoduleProxy = { viewManagersMetadata: {} };
}

if (!NativeModules.NativeUnimoduleProxy.viewManagersMetadata) {
  NativeModules.NativeUnimoduleProxy.viewManagersMetadata = {};
}

// 4. Neutralise reanimated
jest.mock('react-native-reanimated', () => {
  const View = require('react-native').View;
  return {
    __esModule: true,
    default: {
      View: View,
      createAnimatedComponent: (Component) => Component,
    },
    useSharedValue: jest.fn((value) => ({ value })),
    useAnimatedStyle: jest.fn((cb) => cb()),
    useAnimatedScrollHandler: jest.fn(() => ({})),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withSequence: jest.fn((...values) => values[values.length - 1]),
    withDelay: jest.fn((delay, value) => value),
    interpolate: jest.fn((value, input, output) => output[0]),
    runOnJS: jest.fn((fn) => fn),
    FadeInDown: {
      delay: jest.fn(() => ({
        springify: jest.fn(() => ({})),
      })),
      springify: jest.fn(() => ({})),
    },
    FadeInUp: {
      delay: jest.fn(() => ({
        springify: jest.fn(() => ({})),
      })),
      springify: jest.fn(() => ({})),
    },
    SlideInRight: {
      delay: jest.fn(() => ({
        springify: jest.fn(() => ({})),
      })),
      springify: jest.fn(() => ({})),
    },
    ZoomIn: {
      delay: jest.fn(() => ({
        springify: jest.fn(() => ({})),
      })),
      springify: jest.fn(() => ({})),
    },
    Extrapolate: {
      CLAMP: 'clamp',
      EXTEND: 'extend',
      IDENTITY: 'identity',
    },
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      bezier: jest.fn(),
    },
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...rest }) =>
      React.createElement(View, rest, children),
  };
});

jest.mock('@expo/vector-icons');

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Skia
jest.mock('@shopify/react-native-skia', () => {
  const React = require('react');
  return {
    Canvas: ({ children }) => React.createElement('Canvas', null, children),
    Group: ({ children }) => React.createElement('Group', null, children),
    useFont: () => null,
    Skia: {
      Point: (x, y) => ({ x, y }),
    },
  };
});

// Mock victory-native
jest.mock('victory-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  const VictoryContainer = ({ children, ...props }) =>
    React.createElement(View, props, children);
  return {
    VictoryContainer,
  };
});
