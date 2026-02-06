/**
 * Notification Service for Expo Push Notifications
 * Handles FCM device registration and notification setup
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api';
import { logError, logInfo } from '../utils/logger';

const DEVICE_TOKEN_KEY = '@arcane/device_token';

/**
 * Configure notification handler for when app is in foreground
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type?: string;
  title?: string;
  body?: string;
  [key: string]: any;
}

export interface RegisterDeviceResponse {
  success: boolean;
  message?: string;
}

/**
 * Request notification permissions and get Expo Push Token
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      logInfo('Push notifications require a physical device');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      logError('Failed to get push notification permissions');
      return null;
    }

    // Get Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Optional: for EAS projects
    });

    const token = tokenData.data;
    logInfo('Expo Push Token obtained', { token });

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E4FF3B',
      });

      // Create additional channels for different notification types
      await Notifications.setNotificationChannelAsync('matches', {
        name: 'Match Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E4FF3B',
      });

      await Notifications.setNotificationChannelAsync('reports', {
        name: 'Report Notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#E4FF3B',
      });
    }

    return token;
  } catch (error) {
    logError('Error registering for push notifications', error);
    return null;
  }
}

/**
 * Register device with backend
 */
export async function registerDevice(
  token: string,
  userId?: string
): Promise<RegisterDeviceResponse> {
  try {
    const platform = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceName = Device.deviceName || 'Unknown Device';
    const modelName = Device.modelName || 'Unknown Model';
    const osVersion = Device.osVersion || 'Unknown';

    const payload: {
      fcmToken: string;
      platform: 'ios' | 'android';
      deviceInfo?: any;
      userId?: string;
    } = {
      fcmToken: token,
      platform,
      deviceInfo: {
        deviceName,
        modelName,
        osVersion,
      },
    };

    if (userId) {
      payload.userId = userId;
    }

    logInfo('Registering device with backend', payload);

    const response = await api.registerDevice(payload);

    // Store token locally
    await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);

    logInfo('Device registered successfully');
    return { success: true, message: 'Device registered successfully' };
  } catch (error) {
    logError('Error registering device with backend', error);
    return { success: false, message: 'Failed to register device' };
  }
}

/**
 * Unregister device from backend
 */
export async function unregisterDevice(userId?: string): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (!token) {
      logInfo('No device token found to unregister');
      return;
    }

    await api.unregisterDevice({ fcmToken: token, userId });

    // Remove token from local storage
    await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);

    logInfo('Device unregistered successfully');
  } catch (error) {
    logError('Error unregistering device', error);
  }
}

/**
 * Subscribe to a topic
 */
export async function subscribeToTopic(topic: string, userId?: string): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (!token) {
      throw new Error('No device token found. Please register device first.');
    }

    await api.subscribeToTopic({ topic, userIds: userId ? [userId] : undefined });
    logInfo('Subscribed to topic', { topic });
  } catch (error) {
    logError('Error subscribing to topic', error, { topic });
    throw error;
  }
}

/**
 * Unsubscribe from a topic
 */
export async function unsubscribeFromTopic(topic: string, userId?: string): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
    if (!token) {
      throw new Error('No device token found. Please register device first.');
    }

    await api.unsubscribeFromTopic({ topic, userIds: userId ? [userId] : undefined });
    logInfo('Unsubscribed from topic', { topic });
  } catch (error) {
    logError('Error unsubscribing from topic', error, { topic });
    throw error;
  }
}

/**
 * Schedule a match reminder notification
 */
export async function scheduleMatchReminder(matchId: string): Promise<void> {
  try {
    await api.scheduleMatchReminder(matchId);
    logInfo('Match reminder scheduled', { matchId });
  } catch (error) {
    logError('Error scheduling match reminder', error, { matchId });
    throw error;
  }
}

/**
 * Get stored device token
 */
export async function getStoredDeviceToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  } catch (error) {
    logError('Error getting stored device token', error);
    return null;
  }
}

/**
 * Setup notification handlers for received and tapped notifications
 */
export function setupNotificationHandlers(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
) {
  // Handler for when a notification is received while app is in foreground
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    (notification) => {
      logInfo('Notification received', {
        title: notification.request.content.title,
        body: notification.request.content.body,
      });

      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    }
  );

  // Handler for when user taps on a notification
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      logInfo('Notification tapped', {
        title: response.notification.request.content.title,
        data: response.notification.request.content.data,
      });

      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    }
  );

  // Return cleanup function
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissionsStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Check if device is registered
 */
export async function isDeviceRegistered(): Promise<boolean> {
  const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  return token !== null;
}

/**
 * Present a local notification (for testing)
 */
export async function presentLocalNotification(
  title: string,
  body: string,
  data?: NotificationData
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // null means show immediately
    });
  } catch (error) {
    logError('Error presenting local notification', error);
    throw error;
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    logInfo('All scheduled notifications cancelled');
  } catch (error) {
    logError('Error cancelling scheduled notifications', error);
    throw error;
  }
}

/**
 * Get badge count
 */
export async function getBadgeCount(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    logError('Error getting badge count', error);
    return 0;
  }
}

/**
 * Set badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    logError('Error setting badge count', error);
    throw error;
  }
}
