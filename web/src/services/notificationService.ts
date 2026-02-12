/**
 * Notification Service for Firebase Cloud Messaging
 * Handles browser notifications, FCM token management, and foreground messages
 */

import { getToken, onMessage, MessagePayload } from 'firebase/messaging';
import { getFirebaseMessaging, isFirebaseConfigured } from '@/lib/firebase';
import { apiClient } from '@/lib/api-client';

/**
 * VAPID key for FCM web push notifications
 * Should be stored in environment variables
 */
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

/**
 * Check current notification permission state
 */
export const getNotificationPermissionState = (): NotificationPermissionState => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, denied: false, default: true };
  }

  const permission = Notification.permission;
  return {
    granted: permission === 'granted',
    denied: permission === 'denied',
    default: permission === 'default',
  };
};

/**
 * Request notification permission from the browser
 * Returns true if permission was granted, false otherwise
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Notifications are not supported in this browser');
    return false;
  }

  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not properly configured');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get FCM device token for push notifications
 * Returns the token string or null if unable to get token
 */
export const getDeviceToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // Check if notifications are supported and configured
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser');
      return null;
    }

    if (!isFirebaseConfigured()) {
      console.warn('Firebase is not properly configured');
      return null;
    }

    // Get Firebase messaging instance
    const messaging = await getFirebaseMessaging();
    if (!messaging) {
      console.warn('Unable to get Firebase messaging instance');
      return null;
    }

    // Check permission
    const permissionState = getNotificationPermissionState();
    if (!permissionState.granted) {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get FCM token
    if (!VAPID_KEY) {
      console.error('VAPID key is not configured');
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    return token || null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Register device token with backend
 * Calls POST /notifications/register-device
 */
export const registerDevice = async (token: string, userId?: string): Promise<boolean> => {
  try {
    await apiClient.registerDevice({ fcmToken: token, userId });
    return true;
  } catch (error) {
    console.error('Error registering device:', error);
    return false;
  }
};

/**
 * Unregister device token from backend
 * Calls POST /notifications/unregister-device
 */
export const unregisterDevice = async (token: string, userId: string): Promise<boolean> => {
  try {
    await apiClient.unregisterDevice({ userId, fcmToken: token });
    return true;
  } catch (error) {
    console.error('Error unregistering device:', error);
    return false;
  }
};

/**
 * Subscribe to a topic for receiving topic-based notifications
 * Calls POST /notifications/subscribe-topic
 */
export const subscribeToTopic = async (topic: string, userIds: string[]): Promise<boolean> => {
  try {
    await apiClient.subscribeToTopic({ userIds, topic });
    return true;
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return false;
  }
};

/**
 * Unsubscribe from a topic
 * Calls POST /notifications/unsubscribe-topic
 */
export const unsubscribeFromTopic = async (topic: string, userIds: string[]): Promise<boolean> => {
  try {
    await apiClient.unsubscribeFromTopic({ userIds, topic });
    return true;
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return false;
  }
};

/**
 * Listen for foreground messages
 * Returns an unsubscribe function
 */
export const onMessageListener = (
  callback: (payload: MessagePayload) => void
): (() => void) | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  let unsubscribe: (() => void) | null = null;

  getFirebaseMessaging()
    .then((messaging) => {
      if (messaging) {
        unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          callback(payload);
        });
      }
    })
    .catch((error) => {
      console.error('Error setting up message listener:', error);
    });

  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
};

/**
 * Display a browser notification for foreground messages
 */
export const showNotification = (title: string, options?: NotificationOptions): void => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      new Notification(title, options);
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
};

/**
 * Complete notification setup flow:
 * 1. Request permission
 * 2. Get FCM token
 * 3. Register with backend
 */
export const setupNotifications = async (userId?: string): Promise<{
  success: boolean;
  token?: string;
  error?: string;
}> => {
  try {
    // Step 1: Request permission
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      return {
        success: false,
        error: 'Notification permission denied',
      };
    }

    // Step 2: Get FCM token
    const token = await getDeviceToken();
    if (!token) {
      return {
        success: false,
        error: 'Unable to get device token',
      };
    }

    // Step 3: Register with backend
    const registered = await registerDevice(token, userId);
    if (!registered) {
      return {
        success: false,
        token,
        error: 'Failed to register device with backend',
      };
    }

    return {
      success: true,
      token,
    };
  } catch (error) {
    console.error('Error in notification setup:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
