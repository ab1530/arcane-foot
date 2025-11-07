const nativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');

if (!nativeModules.UIManager) {
  nativeModules.UIManager = {};
}

if (!nativeModules.NativeUnimoduleProxy || typeof nativeModules.NativeUnimoduleProxy !== 'object') {
  nativeModules.NativeUnimoduleProxy = { viewManagersMetadata: {} };
}

if (!nativeModules.NativeUnimoduleProxy.viewManagersMetadata) {
  nativeModules.NativeUnimoduleProxy.viewManagersMetadata = {};
}
