/**
 * React Hook for Firebase Cloud Messaging Integration
 * Manages device registration, topic subscriptions, and foreground notifications
 */

import { useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessagePayload } from 'firebase/messaging';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/lib/api-client';
import {
  requestNotificationPermission,
  getDeviceToken,
  registerDevice,
  unregisterDevice,
  subscribeToTopic as subscribeToTopicService,
  unsubscribeFromTopic as unsubscribeFromTopicService,
  onMessageListener,
  showNotification,
  getNotificationPermissionState,
  setupNotifications,
} from '@/services/notificationService';

export interface UseNotificationsOptions {
  autoRegister?: boolean;
  showForegroundNotifications?: boolean;
  onForegroundMessage?: (payload: MessagePayload) => void;
}

export interface UseNotificationsReturn {
  // State
  token: string | null;
  isRegistered: boolean;
  permissionState: ReturnType<typeof getNotificationPermissionState>;
  isLoading: boolean;
  error: string | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  register: () => Promise<void>;
  unregister: () => Promise<void>;
  subscribeToTopic: (topic: string) => Promise<void>;
  unsubscribeFromTopic: (topic: string) => Promise<void>;
  sendNotification: (data: {
    userId: string;
    title: string;
    body: string;
    type?: string;
    data?: Record<string, any>;
  }) => Promise<void>;
  sendToMultiple: (data: {
    userIds: string[];
    title: string;
    body: string;
    type?: string;
    data?: Record<string, any>;
  }) => Promise<void>;
  sendMatchReminder: (matchId: string) => Promise<void>;
  sendReportNotification: (reportId: string) => Promise<void>;
}

const NOTIFICATION_TOKEN_KEY = 'fcm_device_token';
const NOTIFICATION_REGISTERED_KEY = 'fcm_registered';

/**
 * Hook for managing push notifications with FCM
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsReturn {
  const {
    autoRegister = true,
    showForegroundNotifications = true,
    onForegroundMessage,
  } = options;

  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const [token, setToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState(getNotificationPermissionState());

  // Load persisted token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem(NOTIFICATION_TOKEN_KEY);
      const storedRegistered = localStorage.getItem(NOTIFICATION_REGISTERED_KEY) === 'true';
      if (storedToken) {
        setToken(storedToken);
        setIsRegistered(storedRegistered);
      }
    }
  }, []);

  // Auto-register on authentication if enabled
  useEffect(() => {
    if (autoRegister && isAuthenticated && user && !isRegistered) {
      handleRegister();
    }
  }, [autoRegister, isAuthenticated, user, isRegistered]);

  // Setup foreground message listener
  useEffect(() => {
    const unsubscribe = onMessageListener((payload) => {
      console.log('Received foreground message:', payload);

      // Call custom handler if provided
      if (onForegroundMessage) {
        onForegroundMessage(payload);
      }

      // Show browser notification if enabled
      if (showForegroundNotifications && payload.notification) {
        showNotification(payload.notification.title || 'New notification', {
          body: payload.notification.body,
          icon: payload.notification.icon || '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: payload.data,
        });

        // Also show toast
        toast.info(payload.notification.title || 'New notification', {
          description: payload.notification.body,
        });
      }

      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [onForegroundMessage, showForegroundNotifications, queryClient]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestNotificationPermission();
      setPermissionState(getNotificationPermissionState());
      return granted;
    } catch (err) {
      console.error('Error requesting permission:', err);
      setError('Failed to request notification permission');
      return false;
    }
  }, []);

  // Register device for push notifications
  const handleRegister = useCallback(async (): Promise<void> => {
    if (!isAuthenticated || !user) {
      toast.error('You must be logged in to enable notifications');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await setupNotifications(user.id);

      if (result.success && result.token) {
        setToken(result.token);
        setIsRegistered(true);

        // Persist to localStorage
        localStorage.setItem(NOTIFICATION_TOKEN_KEY, result.token);
        localStorage.setItem(NOTIFICATION_REGISTERED_KEY, 'true');

        toast.success('Notifications enabled successfully');
      } else {
        setError(result.error || 'Failed to enable notifications');
        toast.error(result.error || 'Failed to enable notifications');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error('Failed to enable notifications');
      console.error('Error registering device:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // Unregister device
  const handleUnregister = useCallback(async (): Promise<void> => {
    if (!user || !token) {
      toast.error('No device registered');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await unregisterDevice(token, user.id);
      setToken(null);
      setIsRegistered(false);

      // Remove from localStorage
      localStorage.removeItem(NOTIFICATION_TOKEN_KEY);
      localStorage.removeItem(NOTIFICATION_REGISTERED_KEY);

      toast.success('Notifications disabled successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast.error('Failed to disable notifications');
      console.error('Error unregistering device:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]);

  // Mutation for subscribing to topic
  const subscribeToTopicMutation = useMutation({
    mutationFn: async (topic: string) => {
      if (!user) throw new Error('User not authenticated');
      await subscribeToTopicService(topic, [user.id]);
    },
    onSuccess: (_, topic) => {
      toast.success(`Subscribed to ${topic} notifications`);
    },
    onError: (err: Error) => {
      toast.error(`Failed to subscribe: ${err.message}`);
    },
  });

  // Mutation for unsubscribing from topic
  const unsubscribeFromTopicMutation = useMutation({
    mutationFn: async (topic: string) => {
      if (!user) throw new Error('User not authenticated');
      await unsubscribeFromTopicService(topic, [user.id]);
    },
    onSuccess: (_, topic) => {
      toast.success(`Unsubscribed from ${topic} notifications`);
    },
    onError: (err: Error) => {
      toast.error(`Failed to unsubscribe: ${err.message}`);
    },
  });

  // Mutation for sending notification
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      title: string;
      body: string;
      type?: string;
      data?: Record<string, any>;
    }) => {
      await apiClient.sendNotification(data);
    },
    onSuccess: () => {
      toast.success('Notification sent successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to send notification: ${err.message}`);
    },
  });

  // Mutation for sending to multiple users
  const sendToMultipleMutation = useMutation({
    mutationFn: async (data: {
      userIds: string[];
      title: string;
      body: string;
      type?: string;
      data?: Record<string, any>;
    }) => {
      await apiClient.sendNotificationToMultiple(data);
    },
    onSuccess: () => {
      toast.success('Notifications sent successfully');
    },
    onError: (err: Error) => {
      toast.error(`Failed to send notifications: ${err.message}`);
    },
  });

  // Mutation for match reminder
  const sendMatchReminderMutation = useMutation({
    mutationFn: async (matchId: string) => {
      await apiClient.sendMatchReminder(matchId);
    },
    onSuccess: () => {
      toast.success('Match reminder sent');
    },
    onError: (err: Error) => {
      toast.error(`Failed to send reminder: ${err.message}`);
    },
  });

  // Mutation for report notification
  const sendReportNotificationMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await apiClient.sendReportNotification(reportId);
    },
    onSuccess: () => {
      toast.success('Report notification sent');
    },
    onError: (err: Error) => {
      toast.error(`Failed to send notification: ${err.message}`);
    },
  });

  return {
    // State
    token,
    isRegistered,
    permissionState,
    isLoading,
    error,

    // Actions
    requestPermission,
    register: handleRegister,
    unregister: handleUnregister,
    subscribeToTopic: subscribeToTopicMutation.mutateAsync,
    unsubscribeFromTopic: unsubscribeFromTopicMutation.mutateAsync,
    sendNotification: sendNotificationMutation.mutateAsync,
    sendToMultiple: sendToMultipleMutation.mutateAsync,
    sendMatchReminder: sendMatchReminderMutation.mutateAsync,
    sendReportNotification: sendReportNotificationMutation.mutateAsync,
  };
}

export default useNotifications;
