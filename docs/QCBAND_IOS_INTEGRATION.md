# QC Band iOS Integration (QCBandSDK.framework)

## Prerequisites
- Vendor framework present at `mobile/vendor/qcband/QCBandSDK.framework` (committed or copied locally).
- Expo prebuild / bare React Native iOS app.

## Automatic config (config plugin)
The app uses `mobile/plugins/withQCBand.js` and is referenced in `mobile/app.json`.
The plugin:
- Adds `QCBandSDK.framework` (embedded & signed).
- Adds `-ObjC` to `OTHER_LDFLAGS`.
- Excludes `arm64` for simulator builds.
- Adds `$(PROJECT_DIR)/../vendor/qcband` to `FRAMEWORK_SEARCH_PATHS`.
- Ensures Bluetooth permission strings are present (`NSBluetoothAlwaysUsageDescription`, `NSBluetoothPeripheralUsageDescription`).
- Scans with service UUID filters defined in `QCSDKManager.h` (`QCBANDSDKSERVERUUID1/2`).

If the framework is missing, the plugin throws during `prebuild`.

## iOS native module
- `ios/QCBandModule.{h,m}` wraps `QCSDKManager`/`QCSDKCmdCreator`.
- Provides scan (with service UUIDs)/connect/disconnect, battery, steps/day totals, exercise history, realtime HR (events `qcband_hr`).
- Implements a serial command queue (vendor requires sequential commands).
- Uses CoreBluetooth for scan/connect; calls `addPeripheral:` after connect.

## JS service
- `mobile/src/services/wearables/qcBand.ts` exposes typed helpers and logging `[WEARABLE][QCBAND]`.
- Heart rate events via `qcband_hr`.
- Android gracefully reports “not supported”.

## UI
- Minimal screen at `mobile/src/screens/hardware/QCBandScreen.tsx` to scan, connect, read battery/steps, and start/stop realtime HR.
- Navigation route `QCBand` is registered; entry button added in the Hardware Sessions screen.

## Build steps
1. Ensure framework exists at `mobile/vendor/qcband/QCBandSDK.framework`.
2. Run `cd mobile && npx expo prebuild -p ios` (or run pods if bare).
3. Build on a physical iOS device (not simulator for Bluetooth).

## Manual test checklist
- Scan: device appears.
- Connect: succeeds; vendor manager adds peripheral.
- Battery: returns value (0–8).
- Steps/day totals: returns sensible values.
- Realtime HR: `qcband_hr` events arrive; stop command works.
- Android: screen shows “Not supported yet”/service throws gracefully; build not broken.
