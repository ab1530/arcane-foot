/**
 * Notifications Center Component
 * Modal for displaying and managing user notifications
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import { logError, logInfo } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationsCenterProps {
  visible: boolean;
  onClose: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({ visible, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (visible && user?.id) {
      fetchNotifications();
    }
  }, [visible, user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    setLoading(true);
    try {
      logInfo('Fetching notifications');
      const data = await api.getNotifications(user.id);

      // Handle different response formats
      const notificationsList = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];

      setNotifications(notificationsList);
      logInfo('Notifications loaded', { count: notificationsList.length });
    } catch (error) {
      logError('Error fetching notifications', error);
      // Set empty array on error
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await api.markNotificationAsRead(notificationId);

      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      logInfo('Notification marked as read', { notificationId });
    } catch (error) {
      logError('Error marking notification as read', error, { notificationId });
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);

      if (unreadNotifications.length === 0) {
        Alert.alert('Info', 'All notifications are already read');
        return;
      }

      await Promise.all(
        unreadNotifications.map((notif) => api.markNotificationAsRead(notif.id))
      );

      // Update local state
      setNotifications((prev) => prev.map((notif) => ({ ...notif, isRead: true })));

      logInfo('All notifications marked as read', { count: unreadNotifications.length });
      Alert.alert('Success', `${unreadNotifications.length} notifications marked as read`);
    } catch (error) {
      logError('Error marking all notifications as read', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteNotification(notificationId);

              // Update local state
              setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));

              logInfo('Notification deleted', { notificationId });
            } catch (error) {
              logError('Error deleting notification', error, { notificationId });
              Alert.alert('Error', 'Failed to delete notification');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to delete all notifications? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(notifications.map((notif) => api.deleteNotification(notif.id)));

              setNotifications([]);
              logInfo('All notifications cleared');
              Alert.alert('Success', 'All notifications have been cleared');
            } catch (error) {
              logError('Error clearing all notifications', error);
              Alert.alert('Error', 'Failed to clear all notifications');
            }
          },
        },
      ]
    );
  };

  const getNotificationIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'report':
      case 'scouting':
        return '📊';
      case 'match':
        return '⚽';
      case 'player':
        return '👤';
      case 'camp':
        return '🏕️';
      case 'system':
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '🔔';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={styles.unreadCount}>{unreadCount} unread</Text>
              )}
            </View>
          </View>

          {notifications.length > 0 && (
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
                  <Text style={styles.headerButtonText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, styles.clearAllText]}>Clear all</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Notifications List */}
        <ScrollView
          testID="notifications-scroll-view"
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.brand.primary} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.brand.primary} />
            </View>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItem}
                onPress={() => !notification.isRead && handleMarkAsRead(notification.id)}
                activeOpacity={notification.isRead ? 1 : 0.7}
              >
                <GlassCard variant={notification.isRead ? 'default' : 'elevated'}>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationIcon}>
                      {getNotificationIcon(notification.type)}
                    </Text>

                    <View style={styles.notificationBody}>
                      <View style={styles.notificationHeader}>
                        <Text
                          style={[
                            styles.notificationTitle,
                            !notification.isRead && styles.unreadTitle,
                          ]}
                        >
                          {notification.title}
                        </Text>
                        {!notification.isRead && <View style={styles.unreadDot} />}
                      </View>

                      <Text style={styles.notificationMessage}>{notification.message}</Text>

                      <Text style={styles.notificationTime}>
                        {formatTimestamp(notification.createdAt)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteNotification(notification.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyText}>No notifications</Text>
              <Text style={styles.emptySubtext}>You're all caught up!</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
    marginRight: spacing.md,
  },
  closeButtonText: {
    fontSize: 24,
    color: colors.brand.primary,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  unreadCount: {
    fontSize: typography.sizes.xs,
    color: colors.brand.primary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  clearAllText: {
    color: colors.semantic.error,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing["2xl"],
    alignItems: 'center',
  },
  notificationItem: {
    marginBottom: spacing.sm,
  },
  notificationContent: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  notificationIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand.primary,
    marginLeft: spacing.xs,
  },
  notificationMessage: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  notificationTime: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  deleteButtonText: {
    fontSize: 18,
    opacity: 0.6,
  },
  emptyContainer: {
    paddingVertical: spacing["2xl"] * 2,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
});
