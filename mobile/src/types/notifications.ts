/**
 * Notification Types
 * Type definitions for push notifications and FCM integration
 */

export interface DeviceRegistration {
  fcmToken: string;
  platform: 'ios' | 'android';
  deviceInfo?: {
    deviceName?: string;
    modelName?: string;
    osVersion?: string;
  };
}

export interface NotificationPayload {
  userId?: string;
  userIds?: string[];
  title: string;
  body: string;
  type?: NotificationType;
  data?: Record<string, any>;
}

export interface TopicSubscription {
  topic: string;
  userIds?: string[];
}

export enum NotificationType {
  MATCH = 'match',
  REPORT = 'report',
  PLAYER = 'player',
  CAMP = 'camp',
  SYSTEM = 'system',
  INFO = 'info',
  WARNING = 'warning',
  SUCCESS = 'success',
  ERROR = 'error',
}

export interface NotificationData {
  type?: NotificationType | string;
  matchId?: string;
  reportId?: string;
  playerId?: string;
  campId?: string;
  screen?: string;
  params?: Record<string, any>;
  [key: string]: any;
}

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  data: NotificationData;
  timestamp: number;
  read: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  matchReminders: boolean;
  reportUpdates: boolean;
  campNotifications: boolean;
  systemNotifications: boolean;
}
