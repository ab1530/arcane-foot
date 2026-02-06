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
  const { View, ScrollView } = require('react-native');

  const createAnimationMock = () => {
    const mock: any = {};
    mock.delay = jest.fn(() => mock);
    mock.duration = jest.fn(() => mock);
    mock.springify = jest.fn(() => mock);
    return mock;
  };

  return {
    __esModule: true,
    default: {
      View: View,
      ScrollView: ScrollView,
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
    interpolateColor: jest.fn(() => '#FFFFFF'),
    runOnJS: jest.fn((fn) => fn),
    Layout: {
      springify: jest.fn(() => ({})),
    },
    FadeIn: createAnimationMock(),
    FadeInDown: createAnimationMock(),
    FadeInUp: createAnimationMock(),
    SlideInRight: createAnimationMock(),
    ZoomIn: createAnimationMock(),
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

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = ({ name = 'icon', ...props }) =>
    React.createElement(Text, props, name);
  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});

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

// Mock expo-file-system (legacy) to avoid native EventEmitter dependency in tests
jest.mock('expo-file-system/legacy', () => {
  const files = new Map();
  const listFiles = () =>
    Array.from(files.keys())
      .map((key) => key.split('/').pop())
      .filter(Boolean);

  return {
    __esModule: true,
    documentDirectory: '/tmp/',
    getInfoAsync: jest.fn(async (path) => ({
      exists: files.has(path),
      size: files.get(path)?.length ?? 0,
      isDirectory: false,
    })),
    makeDirectoryAsync: jest.fn(async () => {}),
    writeAsStringAsync: jest.fn(async (path, content) => {
      files.set(path, String(content));
    }),
    readAsStringAsync: jest.fn(async (path) => files.get(path) ?? ''),
    deleteAsync: jest.fn(async (path) => {
      files.delete(path);
    }),
    moveAsync: jest.fn(async ({ from, to }) => {
      const content = files.get(from);
      if (content) {
        files.set(to, content);
        files.delete(from);
      }
    }),
    readDirectoryAsync: jest.fn(async () => listFiles()),
    EncodingType: { UTF8: 'utf8' },
  };
});

// Alias the non-legacy entry to the same mock for modules importing "expo-file-system"
jest.mock('expo-file-system', () => require('expo-file-system/legacy'));

// Mock expo-notifications to avoid native EventEmitter requirements
jest.mock('expo-notifications', () => {
  const handlers = [];
  return {
    __esModule: true,
    addNotificationReceivedListener: jest.fn((cb) => {
      handlers.push(cb);
      return { remove: jest.fn() };
    }),
    addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
    removeNotificationSubscription: jest.fn(),
    setNotificationHandler: jest.fn(),
    requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
    getExpoPushTokenAsync: jest.fn(async () => ({ data: 'expo-token-mock' })),
    scheduleNotificationAsync: jest.fn(async () => 'notification-id'),
    cancelScheduledNotificationAsync: jest.fn(async () => {}),
    dismissNotificationAsync: jest.fn(async () => {}),
    dismissAllNotificationsAsync: jest.fn(async () => {}),
    getPresentedNotificationsAsync: jest.fn(async () => []),
    setNotificationChannelAsync: jest.fn(async () => {}),
    AndroidImportance: { DEFAULT: 3, HIGH: 4, MAX: 5 },
    Native: {},
  };
});

// Mock expo-device to bypass native getters
jest.mock('expo-device', () => ({
  __esModule: true,
  isDevice: true,
  deviceName: 'Jest Device',
  modelName: 'Jest Model',
  osVersion: '1.0.0',
}));

// Guard TurboModuleRegistry lookups during tests (e.g., DevMenu)
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  getEnforcing: () => ({}),
  get: () => ({}),
}));

// Provide RN device constants for Dimensions/PixelRatio consumers
jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
  getConstants: () => ({
    Dimensions: {
      window: { width: 390, height: 844, scale: 3, fontScale: 3 },
      screen: { width: 390, height: 844, scale: 3, fontScale: 3 },
    },
  }),
}));

// Mock safe area context to avoid native dependency
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const defaultValue = {
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    frame: { x: 0, y: 0, width: 390, height: 844 },
  };
  const SafeAreaContext = React.createContext(defaultValue);
  const SafeAreaView = ({ children, ...props }) => React.createElement(View, props, children);
  const SafeAreaProvider = ({ children }) =>
    React.createElement(SafeAreaContext.Provider, { value: defaultValue }, children);
  const useSafeAreaInsets = () => defaultValue.insets;
  const useSafeAreaFrame = () => defaultValue.frame;
  return {
    __esModule: true,
    SafeAreaContext,
    SafeAreaView,
    SafeAreaProvider,
    useSafeAreaInsets,
    useSafeAreaFrame,
  };
});

// Mock platform constants used by React Native internals
jest.mock('react-native/Libraries/Utilities/NativePlatformConstantsIOS', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      forceTouchAvailable: false,
      interfaceIdiom: 'phone',
      osVersion: '14.0',
      systemName: 'iOS',
      isTesting: true,
      reactNativeVersion: { major: 0, minor: 81, patch: 0 },
    }),
  },
}));

jest.mock('react-native/Libraries/ReactNative/NativeI18nManager', () => ({
  __esModule: true,
  default: {
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: false,
    }),
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
    swapLeftAndRightInRTL: jest.fn(),
  },
}));

jest.mock('react-native/Libraries/ReactNative/I18nManager', () => ({
  __esModule: true,
  default: {
    isRTL: false,
    allowRTL: jest.fn(),
    forceRTL: jest.fn(),
    swapLeftAndRightInRTL: jest.fn(),
    getConstants: () => ({
      isRTL: false,
      doLeftAndRightSwapInRTL: false,
    }),
  },
}));

// Quiet NativeEventEmitter warnings by providing stub implementation
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  return function MockNativeEventEmitter() {
    return {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn(),
      removeListener: jest.fn(),
    };
  };
});

// Mock Alert to avoid native dependency during tests
jest.mock('react-native/Libraries/Alert/Alert', () => {
  const alert = jest.fn();
  const prompt = jest.fn();
  return {
    __esModule: true,
    alert,
    prompt,
    default: { alert, prompt },
  };
});

// Provide frame size context for native-stack navigation
// Simplify react-navigation SafeAreaProviderCompat usage
jest.mock('@react-navigation/elements', () => {
  const actual = jest.requireActual('@react-navigation/elements');
  const React = require('react');
  const { View } = require('react-native');
  const FrameSizeContext = React.createContext({ width: 390, height: 844 });
  return {
    ...actual,
    SafeAreaProviderCompat: ({ children }) => React.createElement(View, null, children),
    FrameSizeProvider: ({ children }) =>
      React.createElement(FrameSizeContext.Provider, { value: { width: 390, height: 844 } }, children),
    useFrameSize: () => React.useContext(FrameSizeContext),
  };
});

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

// Mock masked view
jest.mock('@react-native-masked-view/masked-view', () => 'MaskedView');

// Mock toast message
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));

// Mock expo-blur
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    BlurView: ({ children, ...rest }) => React.createElement(View, rest, children),
  };
});

// Mock QRCode SVG
jest.mock('react-native-qrcode-svg', () => 'QRCode');

// Mock Clipboard
jest.mock('expo-clipboard', () => ({
  __esModule: true,
  setStringAsync: jest.fn(() => Promise.resolve()),
  getStringAsync: jest.fn(() => Promise.resolve('')),
}));

// Simplify native-stack navigator to avoid animated native deps in tests
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const MockStack: any = () => null;
  MockStack.Navigator = ({ children }: any) => React.createElement(React.Fragment, null, children);
  MockStack.Screen = ({ component: Component, children, ...rest }: any) =>
    React.createElement(Component, { ...(rest.initialParams || {}) }, children);
  return { createNativeStackNavigator: () => MockStack };
});

// Ensure Alert is always available as a mock
try {
  const RN = require('react-native');
  const existingAlert = RN.Alert && typeof RN.Alert === 'object' ? RN.Alert : {};
  const alertFn = existingAlert.alert || jest.fn();
  const promptFn = existingAlert.prompt || jest.fn();
  const mockAlert = { ...existingAlert, alert: alertFn, prompt: promptFn };
  RN.Alert = mockAlert;
  global.Alert = mockAlert;
  global.alert = alertFn;
  global.prompt = promptFn;
} catch (_e) {
  // ignore
}
