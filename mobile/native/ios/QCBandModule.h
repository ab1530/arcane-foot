#import <React/RCTEventEmitter.h>
#import <React/RCTBridgeModule.h>
#import <CoreBluetooth/CoreBluetooth.h>

@interface QCBandModule : RCTEventEmitter <RCTBridgeModule, CBCentralManagerDelegate, CBPeripheralDelegate>
@end
