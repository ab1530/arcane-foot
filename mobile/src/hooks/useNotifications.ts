/**
 * useNotifications Hook
 * Manages push notification registration, handlers, and API interactions
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  registerForPushNotifications,
  registerDevice,
  unregisterDevice,
  subscribeToTopic,
  unsubscribeFromTopic,
  scheduleMatchReminder,
  setupNotificationHandlers,
  getStoredDeviceToken,
  isDeviceRegistered,
  getNotificationPermissionsStatus,
} from '../services/notificationService';
import { logInfo, logError } from '../utils/logger';

const REGISTRATION_ATTEMPTED_KEY = '@arcane/notification_registration_attempted';

export interface UseNotificationsReturn {
  isRegistered: boolean;
  isLoading: boolean;
  permissionStatus: Notifications.PermissionStatus | null;
  registerForNotifications: () => Promise<boolean>;
  subscribeToTopic: (topic: string) => Promise<void>;
  unsubscribeFromTopic: (topic: string) => Promise<void>;
  scheduleMatchReminder: (matchId: string) => Promise<void>;
  unregister: () => Promise<void>;
  lastNotification: Notifications.Notification | null;
}

/**
 * Hook to manage push notifications
 * Automatically registers device when user is authenticated
 */
export function useNotifications(
  isAuthenticated: boolean = false,
  userId?: string,
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void
): UseNotificationsReturn {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null);
  const registrationAttempted = useRef(false);
  const handlersSetup = useRef(false);

  /**
   * Check registration status on mount
   */
  useEffect(() => {
    const checkRegistration = async () => {
      const registered = await isDeviceRegistered();
      setIsRegistered(registered);

      const status = await getNotificationPermissionsStatus();
      setPermissionStatus(status);
    };

    checkRegistration();
  }, []);

  /**
   * Setup notification handlers
   */
  useEffect(() => {
    if (handlersSetup.current) return;

    const cleanup = setupNotificationHandlers(
      (notification) => {
        setLastNotification(notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      },
      (response) => {
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );

    handlersSetup.current = true;

   return () => {
      cleanup();
      handlersSetup.current = false;
    };
  }, [onNotificationReceived, onNotificationTapped]);

  /**
   * Register device for push notifications
   */
  const registerForNotifications = useCallback(async (): Promise<boolean> => {
    if (isLoading || registrationAttempted.current) {
      logInfo('Notification registration already in progress or attempted');
      return isRegistered;
    }

    setIsLoading(true);
    registrationAttempted.current = true;

    try {
      logInfo('Starting notification registration');

      // Get push token
      const token = await registerForPushNotifications();
      if (!token) {
        logInfo('Push notifications unavailable (no token). Skipping registration.');
        await AsyncStorage.setItem(REGISTRATION_ATTEMPTED_KEY, 'true');
        setIsRegistered(false);
        return false;
      }

      // Register with backend
      const result = await registerDevice(token, userId);
      if (result.success) {
        setIsRegistered(true);
        await AsyncStorage.setItem(REGISTRATION_ATTEMPTED_KEY, 'true');
        logInfo('Device registered successfully for push notifications');

        // Update permission status
        const status = await getNotificationPermissionsStatus();
        setPermissionStatus(status);

        return true;
      } else {
        logError('Failed to register device with backend', result.message);
        return false;
      }
    } catch (error) {
      logError('Error during notification registration', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, isRegistered, userId]);

  /**
   * Auto-register when user is authenticated
   */
  useEffect(() => {
    const attemptAutoRegistration = async () => {
      if (!isAuthenticated || isRegistered || registrationAttempted.current) {
        return;
      }

      // Check if registration was already attempted in this session
      const attempted = await AsyncStorage.getItem(REGISTRATION_ATTEMPTED_KEY);
      if (attempted === 'true') {
        registrationAttempted.current = true;
        return;
      }

      logInfo('User authenticated, attempting auto-registration for push notifications');
      await registerForNotifications();
    };

    attemptAutoRegistration();
  }, [isAuthenticated, isRegistered, registerForNotifications]);

  /**
   * Subscribe to a notification topic
   */
  const handleSubscribeToTopic = useCallback(async (topic: string): Promise<void> => {
    if (!isRegistered) {
      throw new Error('Device not registered for push notifications');
    }

    try {
      await subscribeToTopic(topic, userId);
      logInfo('Subscribed to topic successfully', { topic });
    } catch (error) {
      logError('Failed to subscribe to topic', error, { topic });
      throw error;
    }
  }, [isRegistered, userId]);

  /**
   * Unsubscribe from a notification topic
   */
  const handleUnsubscribeFromTopic = useCallback(async (topic: string): Promise<void> => {
    if (!isRegistered) {
      throw new Error('Device not registered for push notifications');
    }

    try {
      await unsubscribeFromTopic(topic, userId);
      logInfo('Unsubscribed from topic successfully', { topic });
    } catch (error) {
      logError('Failed to unsubscribe from topic', error, { topic });
      throw error;
    }
  }, [isRegistered, userId]);

  /**
   * Schedule a match reminder
   */
  const handleScheduleMatchReminder = useCallback(async (matchId: string): Promise<void> => {
    if (!isRegistered) {
      throw new Error('Device not registered for push notifications');
    }

    try {
      await scheduleMatchReminder(matchId);
      logInfo('Match reminder scheduled successfully', { matchId });
    } catch (error) {
      logError('Failed to schedule match reminder', error, { matchId });
      throw error;
    }
  }, [isRegistered]);

  /**
   * Unregister device from push notifications
   */
  const handleUnregister = useCallback(async (): Promise<void> => {
    try {
      await unregisterDevice(userId);
      setIsRegistered(false);
      registrationAttempted.current = false;
      await AsyncStorage.removeItem(REGISTRATION_ATTEMPTED_KEY);
      logInfo('Device unregistered successfully');
    } catch (error) {
      logError('Failed to unregister device', error);
      throw error;
    }
  }, [userId]);

  /**
   * Clean up on unmount
   */
  useEffect(() => {
    return () => {
      // Cleanup is handled by setupNotificationHandlers
    };
  }, []);

  return {
    isRegistered,
    isLoading,
    permissionStatus,
    registerForNotifications,
    subscribeToTopic: handleSubscribeToTopic,
    unsubscribeFromTopic: handleUnsubscribeFromTopic,
    scheduleMatchReminder: handleScheduleMatchReminder,
    unregister: handleUnregister,
    lastNotification,
  };
}

/**
 * Hook to handle navigation based on notification data
 */
export function useNotificationNavigation(navigation: any) {
  const handleNotificationTap = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data;

      try {
        // Route based on notification type
        if (data.type === 'match' && data.matchId) {
          navigation.navigate('MatchDetail', { matchId: data.matchId });
        } else if (data.type === 'report' && data.reportId) {
          navigation.navigate('ReportDetail', { reportId: data.reportId });
        } else if (data.type === 'player' && data.playerId) {
          navigation.navigate('PlayerDetail', { playerId: data.playerId });
        } else if (data.type === 'camp' && data.campId) {
          navigation.navigate('CampDetail', { campId: data.campId });
        } else if (data.screen) {
          // Generic screen navigation
          navigation.navigate(data.screen, data.params || {});
        }
      } catch (error) {
        logError('Error handling notification navigation', error, { data });
      }
    },
    [navigation]
  );

  return { handleNotificationTap };
}

export default useNotifications;
