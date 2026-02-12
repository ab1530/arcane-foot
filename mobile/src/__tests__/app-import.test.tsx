jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: () => null,
  show: jest.fn(),
  hide: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('@react-native-masked-view/masked-view', () => 'MaskedView');

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: () => null,
}));

jest.mock('expo-blur', () => ({
  BlurView: () => null,
}));

jest.mock('react-native-qrcode-svg', () => 'QRCode');

describe('App module', () => {
  it('imports without throwing runtime errors', () => {
    expect(() => {
      require('../../App');
    }).not.toThrow();
  });
});
