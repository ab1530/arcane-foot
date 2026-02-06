# Push Notifications Quick Start Guide

## Setup (5 minutes)

### 1. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Cloud Messaging in Firebase Console
3. Copy your Firebase configuration to `.env.local`:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BN... (from Cloud Messaging > Web Push certificates)
```

### 2. Update Service Worker

Edit `/public/firebase-messaging-sw.js` and replace placeholder values with your actual Firebase config.

### 3. Basic Usage

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    isRegistered,
    register,
    unregister,
    subscribeToTopic,
    sendNotification
  } = useNotifications();

  return (
    <div>
      {!isRegistered ? (
        <button onClick={register}>Enable Notifications</button>
      ) : (
        <button onClick={unregister}>Disable Notifications</button>
      )}
    </div>
  );
}
```

## Common Use Cases

### Enable Notifications for User

```typescript
const { register, requestPermission } = useNotifications();

const enableNotifications = async () => {
  // Request browser permission
  const granted = await requestPermission();
  if (granted) {
    // Register with backend
    await register();
  }
};
```

### Subscribe to Topics

```typescript
const { subscribeToTopic } = useNotifications();

// Subscribe user to match updates
await subscribeToTopic('match-updates');
```

### Send Notification to User

```typescript
const { sendNotification } = useNotifications();

await sendNotification({
  userId: 'user-123',
  title: 'New Message',
  body: 'You have a new message from John',
  type: 'MESSAGE',
  data: { messageId: '456' }
});
```

### Send Match Reminder

```typescript
const { sendMatchReminder } = useNotifications();

await sendMatchReminder('match-id-123');
```

### Handle Foreground Messages

```typescript
const notifications = useNotifications({
  showForegroundNotifications: true,
  onForegroundMessage: (payload) => {
    console.log('Received:', payload);
    // Custom logic here
  }
});
```

## API Endpoints Available

All endpoints are available through the `useNotifications` hook:

- `register()` - Register device for notifications
- `unregister()` - Unregister device
- `subscribeToTopic(topic)` - Subscribe to topic
- `unsubscribeFromTopic(topic)` - Unsubscribe from topic
- `sendNotification(data)` - Send to single user
- `sendToMultiple(data)` - Send to multiple users
- `sendMatchReminder(matchId)` - Send match reminder
- `sendReportNotification(reportId)` - Send report notification

## Troubleshooting

### Notifications not working?

1. Check if Firebase is configured in `.env.local`
2. Check browser console for errors
3. Verify notification permission is granted
4. Check if service worker is registered (DevTools > Application > Service Workers)
5. Ensure backend has Firebase Admin SDK configured

### Permission denied?

User must manually reset permission in browser settings. Cannot be done programmatically.

### Service worker not updating?

1. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. Unregister service worker in DevTools
3. Clear browser cache

## Best Practices

1. **Request permission only when needed** - Don't prompt on first page load
2. **Explain benefits** - Tell users why they should enable notifications
3. **Respect user choice** - Don't repeatedly ask if denied
4. **Test on multiple browsers** - Firefox, Chrome, Safari have different implementations
5. **Handle errors gracefully** - Always provide fallback UI

## Support

- Firebase Docs: https://firebase.google.com/docs/cloud-messaging/js/client
- FCM Web Push: https://firebase.google.com/docs/cloud-messaging/js/receive
- Service Workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
