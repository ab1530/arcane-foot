#import "QCBandModule.h"

#if !__has_include(<QCBandSDK/QCSDKManager.h>)
#error "QCBandSDK not found. Ensure mobile/vendor/qcband/QCBandSDK.framework is present and embedded."
#endif

#import <QCBandSDK/QCSDKManager.h>
#import <QCBandSDK/QCSDKCmdCreator.h>
#import <QCBandSDK/QCExerciseModel.h>
#import <QCBandSDK/QCSportModel.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTUtils.h>

static NSString *const kEventHeartRate = @"qcband_hr";
static NSTimeInterval const kCommandTimeout = 12.0;

@interface QCBandModule ()
@property(nonatomic, strong) CBCentralManager *centralManager;
@property(nonatomic, strong) NSMutableDictionary<NSUUID *, CBPeripheral *> *discoveredPeripherals;
@property(nonatomic, strong) NSMutableDictionary<NSUUID *, NSNumber *> *peripheralRSSI;
@property(nonatomic, strong) CBPeripheral *connectedPeripheral;
@property(nonatomic, assign) BOOL connecting;
@property(nonatomic, strong) NSMutableArray<void (^)(void (^)(void))> *commandQueue;
@property(nonatomic, assign) BOOL commandRunning;
@property(nonatomic, strong) RCTPromiseResolveBlock connectResolver;
@property(nonatomic, strong) RCTPromiseRejectBlock connectRejecter;
@property(nonatomic, strong) dispatch_queue_t queue;
@property(nonatomic, assign) BOOL hasListeners;
@end

@implementation QCBandModule

RCT_EXPORT_MODULE(QCBandModule);

- (NSArray<NSString *> *)supportedEvents {
  return @[kEventHeartRate];
}

- (void)startObserving {
  self.hasListeners = YES;
}

- (void)stopObserving {
  self.hasListeners = NO;
}

- (dispatch_queue_t)methodQueue {
  return dispatch_get_main_queue();
}

- (instancetype)init {
  if (self = [super init]) {
    _discoveredPeripherals = [NSMutableDictionary dictionary];
    _peripheralRSSI = [NSMutableDictionary dictionary];
    _commandQueue = [NSMutableArray array];
    _queue = dispatch_queue_create("qcband.command.queue", DISPATCH_QUEUE_SERIAL);
    _centralManager = [[CBCentralManager alloc] initWithDelegate:self queue:nil options:@{CBCentralManagerOptionShowPowerAlertKey:@YES}];
    QCSDKManager *manager = [QCSDKManager shareInstance];
    __weak typeof(self) weakSelf = self;
    manager.realTimeHeartRate = ^(NSInteger hr) {
      if (weakSelf.hasListeners) {
        [weakSelf sendEventWithName:kEventHeartRate body:@{@"bpm": @(hr)}];
      }
    };
  }
  return self;
}

#pragma mark - Helpers (command queue)

- (void)enqueueCommand:(void (^)(void (^done)(void)))block rejecter:(RCTPromiseRejectBlock)reject {
  @synchronized(self.commandQueue) {
    [self.commandQueue addObject:block];
  }
  [self tryDequeueWithRejecter:reject];
}

- (void)tryDequeueWithRejecter:(RCTPromiseRejectBlock)reject {
  @synchronized(self.commandQueue) {
    if (self.commandRunning || self.commandQueue.count == 0) return;
    self.commandRunning = YES;
    void (^task)(void (^)(void)) = [self.commandQueue firstObject];
    [self.commandQueue removeObjectAtIndex:0];
    dispatch_async(self.queue, ^{
      __block BOOL finished = NO;
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(kCommandTimeout * NSEC_PER_SEC)), self.queue, ^{
        if (!finished && reject) {
          reject(@"timeout", @"La commande QC Band a expiré", nil);
          finished = YES;
          @synchronized(self.commandQueue) { self.commandRunning = NO; }
          [self tryDequeueWithRejecter:nil];
        }
      });
      task(^{
        if (finished) return;
        finished = YES;
        @synchronized(self.commandQueue) { self.commandRunning = NO; }
        [self tryDequeueWithRejecter:nil];
      });
    });
  }
}

#pragma mark - Scanning

RCT_EXPORT_METHOD(scan:(nonnull NSNumber *)timeoutMs
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  if (self.centralManager.state != CBManagerStatePoweredOn) {
    reject(@"bluetooth_off", @"Bluetooth désactivé", nil);
    return;
  }
  if (@available(iOS 13.0, *)) {
    CBManagerAuthorization auth = CBCentralManager.authorization;
    if (auth == CBManagerAuthorizationDenied || auth == CBManagerAuthorizationRestricted) {
      reject(@"bluetooth_denied", @"Accès Bluetooth refusé", nil);
      return;
    }
  }
  [self.discoveredPeripherals removeAllObjects];
  [self.peripheralRSSI removeAllObjects];
  NSArray *services = @[];
  if (QCBANDSDKSERVERUUID1 && QCBANDSDKSERVERUUID2) {
    services = @[[CBUUID UUIDWithString:QCBANDSDKSERVERUUID1], [CBUUID UUIDWithString:QCBANDSDKSERVERUUID2]];
  }
  [self.centralManager scanForPeripheralsWithServices:services options:@{CBCentralManagerScanOptionAllowDuplicatesKey:@NO}];
  NSTimeInterval delay = timeoutMs ? timeoutMs.doubleValue / 1000.0 : 5.0;
  dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delay * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
    [self.centralManager stopScan];
    NSMutableArray *devices = [NSMutableArray array];
    [self.discoveredPeripherals enumerateKeysAndObjectsUsingBlock:^(NSUUID * _Nonnull key, CBPeripheral * _Nonnull obj, BOOL * _Nonnull stop) {
      if (!obj.name || obj.name.length == 0) return;
      NSString *name = obj.name ?: @"QC Band";
      NSNumber *rssi = self.peripheralRSSI[key];
      NSMutableDictionary *dev = [@{@"id": key.UUIDString, @"name": name} mutableCopy];
      if (rssi) dev[@"rssi"] = rssi;
      [devices addObject:dev];
    }];
    resolve(devices);
  });
}

RCT_EXPORT_METHOD(stopScan) {
  [self.centralManager stopScan];
}

#pragma mark - Connect / Disconnect

RCT_EXPORT_METHOD(connect:(NSString *)deviceId resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (self.connectedPeripheral && [self.connectedPeripheral.identifier.UUIDString isEqualToString:deviceId]) {
    resolve(nil);
    return;
  }
  if (self.connecting) {
    reject(@"connecting", @"Connexion déjà en cours", nil);
    return;
  }
  CBPeripheral *target = self.discoveredPeripherals[[[NSUUID alloc] initWithUUIDString:deviceId]];
  if (!target) {
    reject(@"not_found", @"Périphérique introuvable. Lancez un scan avant.", nil);
    return;
  }
  self.connecting = YES;
  self.connectResolver = resolve;
  self.connectRejecter = reject;
  [self.centralManager connectPeripheral:target options:nil];
}

RCT_EXPORT_METHOD(disconnect:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (self.connectedPeripheral) {
    [[QCSDKManager shareInstance] removePeripheral:self.connectedPeripheral];
    [self.centralManager cancelPeripheralConnection:self.connectedPeripheral];
    self.connectedPeripheral = nil;
    self.connecting = NO;
  }
  resolve(nil);
}

#pragma mark - Commands (queued)

RCT_EXPORT_METHOD(getBattery:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (!self.connectedPeripheral) {
    reject(@"not_connected", @"Bracelet non connecté", nil);
    return;
  }
  [self enqueueCommand:^(void (^done)(void)) {
    [QCSDKCmdCreator readBatterySuccess:^(int battery, BOOL charging) {
      double percent = ((double)battery / 8.0) * 100.0;
      resolve(@{@"level": @(battery), @"percent": @(percent), @"charging": @(charging)});
      done();
    } failed:^{
      reject(@"battery_failed", @"Lecture batterie impossible", nil);
      done();
    }];
  } rejecter:reject];
}

RCT_EXPORT_METHOD(getCurrentSteps:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (!self.connectedPeripheral) {
    reject(@"not_connected", @"Bracelet non connecté", nil);
    return;
  }
  [self enqueueCommand:^(void (^done)(void)) {
    [QCSDKCmdCreator getCurrentSportSucess:^(QCSportModel *sport) {
      resolve(@{
        @"steps": @(sport.totalStepCount),
        @"calories": @(sport.calories),
        @"distanceM": @(sport.distance),
        @"timeMin": @(sport.activeTime)
      });
      done();
    } failed:^{
      reject(@"steps_failed", @"Lecture des pas impossible", nil);
      done();
    }];
  } rejecter:reject];
}

RCT_EXPORT_METHOD(getTodayStats:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (!self.connectedPeripheral) {
    reject(@"not_connected", @"Bracelet non connecté", nil);
    return;
  }
  [self enqueueCommand:^(void (^done)(void)) {
    [QCSDKCmdCreator getOneDaySportBy:0 success:^(QCSportModel *model) {
      resolve(@{
        @"steps": @(model.totalStepCount),
        @"calories": @(model.calories),
        @"distanceM": @(model.distance),
        @"timeMin": @(model.activeTime)
      });
      done();
    } fail:^{
      reject(@"today_failed", @"Lecture des stats du jour impossible", nil);
      done();
    }];
  } rejecter:reject];
}

RCT_EXPORT_METHOD(getExerciseHistory:(nonnull NSNumber *)lastUnixSeconds resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (!self.connectedPeripheral) {
    reject(@"not_connected", @"Bracelet non connecté", nil);
    return;
  }
  [self enqueueCommand:^(void (^done)(void)) {
    [QCSDKCmdCreator getExerciseDataWithLastUnixSeconds:lastUnixSeconds.unsignedIntegerValue getData:^(NSArray<QCExerciseModel *> * _Nonnull models) {
      NSMutableArray *mapped = [NSMutableArray arrayWithCapacity:models.count];
      for (QCExerciseModel *m in models) {
        [mapped addObject:@{
          @"startAtUnix": @((NSInteger)(m.startTime / 1000)),
          @"durationS": @(m.lastSeconds),
          @"steps": @(m.steps),
          @"calories": @(m.calories),
          @"distanceM": @(m.meters)
        }];
      }
      resolve(mapped);
      done();
    } fail:^{
      reject(@"history_failed", @"Lecture de l'historique impossible", nil);
      done();
    }];
  } rejecter:reject];
}

RCT_EXPORT_METHOD(startRealtimeHeartRate:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (!self.connectedPeripheral) {
    reject(@"not_connected", @"Bracelet non connecté", nil);
    return;
  }
  [self enqueueCommand:^(void (^done)(void)) {
    QCSDKManager *manager = [QCSDKManager shareInstance];
    [manager startToMeasuringWithOperateType:QCMeasuringTypeHeartRate timeout:60 measuringHandle:^(id  _Nullable result) {
      // streaming via realTimeHeartRate
    } completedHandle:^(BOOL isSuccess, id  _Nullable result, NSError * _Nullable error) {
      if (isSuccess) {
        resolve(nil);
      } else {
        reject(@"hr_failed", error.localizedDescription ?: @"Mesure HR échouée", error);
      }
      done();
    }];
  } rejecter:reject];
}

RCT_EXPORT_METHOD(stopRealtimeHeartRate:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject) {
  if (!self.connectedPeripheral) {
    reject(@"not_connected", @"Bracelet non connecté", nil);
    return;
  }
  [self enqueueCommand:^(void (^done)(void)) {
    [[QCSDKManager shareInstance] stopToMeasuringWithOperateType:QCMeasuringTypeHeartRate completedHandle:^(BOOL isSuccess, NSError * _Nullable error) {
      if (isSuccess) {
        resolve(nil);
      } else {
        reject(@"hr_stop_failed", error.localizedDescription ?: @"Arrêt HR échoué", error);
      }
      done();
    }];
  } rejecter:reject];
}

#pragma mark - CBCentralManagerDelegate

- (void)centralManagerDidUpdateState:(CBCentralManager *)central {
  // handled in scan
}

- (void)centralManager:(CBCentralManager *)central
 didDiscoverPeripheral:(CBPeripheral *)peripheral
     advertisementData:(NSDictionary<NSString *,id> *)advertisementData
                  RSSI:(NSNumber *)RSSI {
  if (!peripheral.identifier) return;
  self.discoveredPeripherals[peripheral.identifier] = peripheral;
  if (RSSI) self.peripheralRSSI[peripheral.identifier] = RSSI;
}

- (void)centralManager:(CBCentralManager *)central didConnectPeripheral:(CBPeripheral *)peripheral {
  self.connectedPeripheral = peripheral;
  self.connecting = NO;
  __weak typeof(self) weakSelf = self;
  [[QCSDKManager shareInstance] addPeripheral:peripheral finished:^(BOOL ok) {
    if (ok) {
      if (weakSelf.connectResolver) weakSelf.connectResolver(nil);
    } else {
      if (weakSelf.connectRejecter) weakSelf.connectRejecter(@"add_failed", @"Echec d'association au SDK", nil);
    }
    weakSelf.connectResolver = nil;
    weakSelf.connectRejecter = nil;
  }];
}

- (void)centralManager:(CBCentralManager *)central didFailToConnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
  self.connecting = NO;
  if (self.connectRejecter) {
    self.connectRejecter(@"connect_failed", error.localizedDescription ?: @"Connexion échouée", error);
  }
  self.connectResolver = nil;
  self.connectRejecter = nil;
}

- (void)centralManager:(CBCentralManager *)central didDisconnectPeripheral:(CBPeripheral *)peripheral error:(NSError *)error {
  if ([self.connectedPeripheral.identifier isEqual:peripheral.identifier]) {
    [[QCSDKManager shareInstance] removePeripheral:peripheral];
    self.connectedPeripheral = nil;
    self.connecting = NO;
  }
}

@end
