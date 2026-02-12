/**
 * Notification Integration Example
 *
 * This file demonstrates how to integrate push notifications
 * into your React Native/Expo application.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
} from 'react-native';
import { useNotifications, useNotificationNavigation } from '../hooks/useNotifications';
import { colors, spacing, typography } from '../design/theme';

interface NotificationExampleProps {
  isAuthenticated: boolean;
  userId?: string;
  navigation: any;
}

/**
 * Example component showing notification integration
 */
export const NotificationIntegrationExample: React.FC<NotificationExampleProps> = ({
  isAuthenticated,
  userId,
  navigation,
}) => {
  const [topicsState, setTopicsState] = useState({
    matchUpdates: false,
    reportNotifications: false,
    campAnnouncements: false,
  });

  // Setup notification navigation handler
  const { handleNotificationTap } = useNotificationNavigation(navigation);

  // Initialize notification hook with handlers
  const {
    isRegistered,
    isLoading,
    permissionStatus,
    registerForNotifications,
    subscribeToTopic,
    unsubscribeFromTopic,
    scheduleMatchReminder,
    unregister,
    lastNotification,
  } = useNotifications(
    isAuthenticated,
    userId,
    // Handler for when notification is received while app is open
    (notification) => {
      console.log('Notification received:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data,
      });

      // Optional: Show in-app notification banner
      Alert.alert(
        notification.request.content.title || 'Notification',
        notification.request.content.body || ''
      );
    },
    // Handler for when user taps notification
    handleNotificationTap
  );

  // Log registration status changes
  useEffect(() => {
    if (isRegistered) {
      console.log('Device successfully registered for push notifications');
    }
  }, [isRegistered]);

  // Manual registration handler
  const handleEnableNotifications = async () => {
    const success = await registerForNotifications();
    if (success) {
      Alert.alert('Success', 'Notifications enabled successfully!');
    } else {
      Alert.alert(
        'Error',
        'Failed to enable notifications. Please check permissions in Settings.'
      );
    }
  };

  // Topic subscription handler
  const handleTopicToggle = async (topic: string, enabled: boolean) => {
    try {
      if (enabled) {
        await subscribeToTopic(topic);
        Alert.alert('Success', `Subscribed to ${topic}`);
      } else {
        await unsubscribeFromTopic(topic);
        Alert.alert('Success', `Unsubscribed from ${topic}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to update subscription: ${error.message}`);
    }
  };

  // Match reminder handler
  const handleSetMatchReminder = async () => {
    try {
      // Example match ID - replace with actual match ID
      const matchId = 'match-123';
      await scheduleMatchReminder(matchId);
      Alert.alert('Success', 'Match reminder has been set!');
    } catch (error) {
      Alert.alert('Error', `Failed to set reminder: ${error.message}`);
    }
  };

  // Unregister handler
  const handleDisableNotifications = async () => {
    Alert.alert(
      'Disable Notifications',
      'Are you sure you want to disable push notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable',
          style: 'destructive',
          onPress: async () => {
            try {
              await unregister();
              Alert.alert('Success', 'Notifications disabled');
            } catch (error) {
              Alert.alert('Error', 'Failed to disable notifications');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notification Status</Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Registered:</Text>
          <Text style={[styles.statusValue, isRegistered && styles.statusSuccess]}>
            {isRegistered ? 'Yes' : 'No'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Permission:</Text>
          <Text style={styles.statusValue}>
            {permissionStatus || 'Unknown'}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Loading:</Text>
          <Text style={styles.statusValue}>
            {isLoading ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      {!isAuthenticated && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Please log in to enable push notifications
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        {!isRegistered && isAuthenticated && (
          <TouchableOpacity
            style={styles.button}
            onPress={handleEnableNotifications}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Registering...' : 'Enable Notifications'}
            </Text>
          </TouchableOpacity>
        )}

        {isRegistered && (
          <>
            <TouchableOpacity
              style={[styles.button, styles.dangerButton]}
              onPress={handleDisableNotifications}
            >
              <Text style={styles.buttonText}>Disable Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleSetMatchReminder}
            >
              <Text style={styles.buttonText}>Set Match Reminder</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {isRegistered && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Topic Subscriptions</Text>

          <View style={styles.topicRow}>
            <Text style={styles.topicLabel}>Match Updates</Text>
            <Switch
              value={topicsState.matchUpdates}
              onValueChange={(value) => {
                setTopicsState({ ...topicsState, matchUpdates: value });
                handleTopicToggle('match-updates', value);
              }}
              trackColor={{ false: colors.background.tertiary, true: colors.brand.primary }}
              thumbColor={topicsState.matchUpdates ? colors.text.primary : colors.text.secondary}
            />
          </View>

          <View style={styles.topicRow}>
            <Text style={styles.topicLabel}>Report Notifications</Text>
            <Switch
              value={topicsState.reportNotifications}
              onValueChange={(value) => {
                setTopicsState({ ...topicsState, reportNotifications: value });
                handleTopicToggle('report-notifications', value);
              }}
              trackColor={{ false: colors.background.tertiary, true: colors.brand.primary }}
              thumbColor={topicsState.reportNotifications ? colors.text.primary : colors.text.secondary}
            />
          </View>

          <View style={styles.topicRow}>
            <Text style={styles.topicLabel}>Camp Announcements</Text>
            <Switch
              value={topicsState.campAnnouncements}
              onValueChange={(value) => {
                setTopicsState({ ...topicsState, campAnnouncements: value });
                handleTopicToggle('camp-announcements', value);
              }}
              trackColor={{ false: colors.background.tertiary, true: colors.brand.primary }}
              thumbColor={topicsState.campAnnouncements ? colors.text.primary : colors.text.secondary}
            />
          </View>
        </View>
      )}

      {lastNotification && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Notification</Text>
          <View style={styles.notificationBox}>
            <Text style={styles.notificationTitle}>
              {lastNotification.request.content.title}
            </Text>
            <Text style={styles.notificationBody}>
              {lastNotification.request.content.body}
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  statusLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  statusValue: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  statusSuccess: {
    color: colors.semantic.success,
  },
  warningBox: {
    backgroundColor: colors.semantic.warning + '20',
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.semantic.warning,
  },
  warningText: {
    color: colors.semantic.warning,
    fontSize: typography.sizes.base,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.brand.primary,
    borderRadius: 8,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  dangerButton: {
    backgroundColor: colors.semantic.error,
  },
  buttonText: {
    color: colors.background.primary,
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
  topicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  topicLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  notificationBox: {
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    padding: spacing.md,
  },
  notificationTitle: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  notificationBody: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});

export default NotificationIntegrationExample;
