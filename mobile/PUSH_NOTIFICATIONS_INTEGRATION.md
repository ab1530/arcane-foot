# Push Notifications Integration - Firebase Cloud Messaging (FCM)

## Overview

This document describes the complete Firebase Cloud Messaging (FCM) integration for push notifications in the Arcane Football mobile app. The implementation uses Expo's notification API to provide a seamless notification experience across iOS and Android.

## Architecture

The notification system consists of three main components:

1. **Notification Service** (`src/services/notificationService.ts`) - Core FCM functionality
2. **API Integration** (`src/services/api.ts`) - Backend communication
3. **React Hook** (`src/hooks/useNotifications.ts`) - React integration

## Files Created/Modified

### Created Files

1. `/Users/lakhdari/Desktop/AppFoot/mobile/src/services/notificationService.ts`
   - Core notification service with FCM integration
   - Device registration and permission handling
   - Notification handlers and topic subscriptions

2. `/Users/lakhdari/Desktop/AppFoot/mobile/src/hooks/useNotifications.ts`
   - React hook for notification management
   - Auto-registration when user authenticates
   - Navigation helper for notification taps

3. `/Users/lakhdari/Desktop/AppFoot/mobile/src/types/notifications.ts`
   - TypeScript type definitions for notifications
   - Device registration, notification payload, and data types

### Modified Files

1. `/Users/lakhdari/Desktop/AppFoot/mobile/src/services/api.ts`
   - Added 9 new notification API methods:
     - `registerDevice()` - Register FCM device token
     - `unregisterDevice()` - Unregister device token
     - `sendNotification()` - Send single notification
     - `sendMultipleNotifications()` - Send to multiple users
     - `sendTopicNotification()` - Send to topic subscribers
     - `subscribeToTopic()` - Subscribe to topic
     - `unsubscribeFromTopic()` - Unsubscribe from topic
     - `scheduleMatchReminder()` - Set match reminder
     - `sendReportNotification()` - Notify about report

2. `/Users/lakhdari/Desktop/AppFoot/mobile/app.json`
   - Added notification configuration
   - Configured Android notification channels
   - Added expo-notifications plugin configuration
   - Set notification icon and color

3. `/Users/lakhdari/Desktop/AppFoot/mobile/src/types/index.ts`
   - Exported notification types

## Required Packages

The following Expo packages must be installed:

```bash
npx expo install expo-notifications expo-device
```

### Package Versions
- `expo-notifications` - For push notification handling
- `expo-device` - For device information

## Configuration

### App Configuration (app.json)

The following configuration has been added:

```json
{
  "notification": {
    "icon": "./assets/notification-icon.png",
    "color": "#E4FF3B",
    "androidMode": "default",
    "androidCollapsedTitle": "Arcane Football"
  },
  "plugins": [
    [
      "expo-notifications",
      {
        "icon": "./assets/notification-icon.png",
        "color": "#E4FF3B",
        "sounds": ["./assets/notification-sound.wav"]
      }
    ]
  ],
  "ios": {
    "googleServicesFile": "./GoogleService-Info.plist"
  },
  "android": {
    "googleServicesFile": "./google-services.json",
    "package": "com.anonymous.mobile"
  }
}
```

### Firebase Setup Required

1. **Create Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select existing one

2. **Add iOS App**
   - Add iOS app with bundle ID: `com.anonymous.mobile`
   - Download `GoogleService-Info.plist`
   - Place in `/Users/lakhdari/Desktop/AppFoot/mobile/GoogleService-Info.plist`

3. **Add Android App**
   - Add Android app with package name: `com.anonymous.mobile`
   - Download `google-services.json`
   - Place in `/Users/lakhdari/Desktop/AppFoot/mobile/google-services.json`

4. **Enable Firebase Cloud Messaging**
   - In Firebase Console, enable Cloud Messaging API
   - Note down the Server Key (for backend)

### Assets Required

Create the following notification assets:

1. **Notification Icon** (Android)
   - Path: `/Users/lakhdari/Desktop/AppFoot/mobile/assets/notification-icon.png`
   - Size: 96x96px (mdpi), transparent background
   - Should be white icon on transparent background

2. **Notification Sound** (Optional)
   - Path: `/Users/lakhdari/Desktop/AppFoot/mobile/assets/notification-sound.wav`
   - Format: WAV, MP3, or M4A

## Usage

### Basic Usage in App Component

```typescript
import { useNotifications } from './src/hooks/useNotifications';
import { useAuth } from './src/contexts/AuthContext';

function App() {
  const { isAuthenticated, user } = useAuth();

  const {
    isRegistered,
    isLoading,
    registerForNotifications,
    subscribeToTopic,
    scheduleMatchReminder,
  } = useNotifications(
    isAuthenticated,
    user?.id,
    (notification) => {
      // Handle notification received while app is open
      console.log('Notification received:', notification);
    },
    (response) => {
      // Handle notification tapped
      console.log('Notification tapped:', response);
    }
  );

  return (
    <View>
      {/* Your app UI */}
    </View>
  );
}
```

### With Navigation

```typescript
import { useNotifications, useNotificationNavigation } from './src/hooks/useNotifications';

function App() {
  const navigation = useNavigation();
  const { handleNotificationTap } = useNotificationNavigation(navigation);

  const notifications = useNotifications(
    isAuthenticated,
    user?.id,
    undefined,
    handleNotificationTap // Auto-navigate on tap
  );

  // Rest of app
}
```

### Manual Registration

```typescript
const { registerForNotifications, isRegistered } = useNotifications();

// Manually trigger registration
const handleEnableNotifications = async () => {
  const success = await registerForNotifications();
  if (success) {
    Alert.alert('Success', 'Notifications enabled!');
  } else {
    Alert.alert('Error', 'Failed to enable notifications');
  }
};
```

### Topic Subscriptions

```typescript
const { subscribeToTopic, unsubscribeFromTopic } = useNotifications();

// Subscribe to match updates
await subscribeToTopic('match-updates');

// Subscribe to report notifications
await subscribeToTopic('report-notifications');

// Unsubscribe
await unsubscribeFromTopic('match-updates');
```

### Match Reminders

```typescript
const { scheduleMatchReminder } = useNotifications();

// Schedule a reminder for a specific match
const handleSetReminder = async (matchId: string) => {
  try {
    await scheduleMatchReminder(matchId);
    Alert.alert('Success', 'Reminder set!');
  } catch (error) {
    Alert.alert('Error', 'Failed to set reminder');
  }
};
```

## API Integration

All backend API methods are available through the `api` service:

```typescript
import { api } from './src/services/api';

// Send notification to specific user
await api.sendNotification({
  userId: 'user-123',
  title: 'New Match',
  body: 'Your team has a match tomorrow!',
  type: 'match',
  data: { matchId: 'match-456' },
});

// Send to multiple users
await api.sendMultipleNotifications({
  userIds: ['user-1', 'user-2', 'user-3'],
  title: 'Tournament Update',
  body: 'New tournament starting soon!',
});

// Send to topic
await api.sendTopicNotification({
  topic: 'match-updates',
  title: 'Live Match',
  body: 'Match is now live!',
});
```

## Notification Data Structure

Notifications can include custom data for navigation:

```typescript
{
  type: 'match' | 'report' | 'player' | 'camp' | 'system',
  matchId?: string,
  reportId?: string,
  playerId?: string,
  campId?: string,
  screen?: string,  // For custom navigation
  params?: object   // Screen parameters
}
```

## Testing

### Test Local Notifications

```typescript
import { presentLocalNotification } from './src/services/notificationService';

// Show a test notification
await presentLocalNotification(
  'Test Notification',
  'This is a test notification',
  { type: 'test' }
);
```

### Test with Physical Device

1. Build development client:
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

2. Accept notification permissions

3. Check device registration in app logs

4. Send test notification from Firebase Console or backend

## Backend Integration

The backend must implement these endpoints (already done):

- `POST /notifications/register-device`
- `POST /notifications/unregister-device`
- `POST /notifications/send`
- `POST /notifications/send-multiple`
- `POST /notifications/send-topic`
- `POST /notifications/subscribe-topic`
- `POST /notifications/unsubscribe-topic`
- `POST /notifications/match/:matchId/reminder`
- `POST /notifications/report/:reportId/notify`

Backend repository: `/Users/lakhdari/Desktop/AppFoot/backend`

## Notification Channels (Android)

The service automatically creates the following channels:

1. **default** - Default notifications (MAX importance)
2. **matches** - Match-related notifications (HIGH importance)
3. **reports** - Report notifications (DEFAULT importance)

## Security Considerations

1. **Device Tokens**: Stored locally in AsyncStorage with key `@arcane/device_token`
2. **Authentication**: All API calls use JWT Bearer token authentication
3. **Topic Subscriptions**: Only authenticated users can subscribe to topics
4. **Unregistration**: Device automatically unregisters on logout

## Cleanup on Logout

The hook should be integrated with your auth context to cleanup on logout:

```typescript
// In your AuthContext or logout handler
import { unregisterDevice } from './src/services/notificationService';

const logout = async () => {
  await unregisterDevice();
  // ... rest of logout logic
};
```

## Troubleshooting

### Notifications Not Received

1. Check device registration: `isRegistered` should be `true`
2. Verify Firebase configuration files are present
3. Check notification permissions: Use `getNotificationPermissionsStatus()`
4. Review device logs for errors
5. Test with local notification first

### Permission Denied

1. User must explicitly grant permission
2. Show explanation before requesting permission
3. Guide user to Settings if permission was denied

### Token Issues

1. Token might expire - implement token refresh logic
2. Unregister and re-register if token seems invalid
3. Check AsyncStorage for stored token

## Performance Considerations

1. **Auto-Registration**: Happens once per session on authentication
2. **Handler Setup**: Notification handlers are set up once on mount
3. **Cleanup**: Proper cleanup on unmount prevents memory leaks
4. **Debouncing**: Registration attempts are debounced to prevent duplicates

## Next Steps for UI Integration

1. **Settings Screen**: Add notification preferences toggle
2. **Match Details**: Add "Set Reminder" button
3. **Notification Badge**: Show unread count on tab bar
4. **Notification List**: Integrate with `NotificationsCenter` component
5. **In-App Notifications**: Show toast/banner for foreground notifications
6. **Topic Management**: UI for subscribing/unsubscribing from topics

## Additional Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)

## TypeScript Support

All services and hooks are fully typed. Import types from:

```typescript
import type {
  DeviceRegistration,
  NotificationPayload,
  NotificationData,
  NotificationType,
} from './src/types/notifications';
```

## License

Internal - Arcane Football Platform
