import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import * as Notifications from 'expo-notifications';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { logNavigation, logError, logInfo } from '../logging/expoLogBridge';
import { logger } from '../utils/logger';
import useNotifications from '../hooks/useNotifications';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import RoleSelectorScreen from '../screens/auth/RoleSelectorScreen';
import { HomeScreen } from '../screens/home/HomeScreen';

// Main App - Use AppNavigator which contains MainTabNavigator and all stack screens
import AppNavigator from './AppNavigator';

export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  Signup: undefined;
  RoleSelector: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isAuthenticated, isLoading, user, activeRole } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  const routeNameRef = useRef<string>();
  const subscribedTopicsRef = useRef<string[]>([]);

  const activeNotificationRole = activeRole ?? user?.role;
  const shouldShowRoleSelector =
    isAuthenticated &&
    !!user &&
    Array.isArray(user.roles) &&
    user.roles.length > 1 &&
    !activeRole;

  const notificationTopics = useMemo(() => {
    const topics: string[] = ['broadcast'];
    if (activeNotificationRole) {
      topics.push(`role-${activeNotificationRole.toLowerCase()}`);
    }
    if (user?.id) {
      topics.push(`user-${user.id}`);
    }
    return topics;
  }, [activeNotificationRole, user?.id]);

  const handleNotificationNavigation = useCallback(
    (response: Notifications.NotificationResponse) => {
      const nav = navigationRef.current;
      const data = (response?.notification?.request?.content?.data as Record<string, any>) || {};

      if (!nav) {
        logError('Notification tap ignored (navigation unavailable)', new Error('NAV_MISSING'), {
          data,
        });
        return;
      }

      try {
        if (data.type === 'match' && data.matchId) {
          nav.navigate('MatchDetail', { matchId: data.matchId });
        } else if (data.type === 'report' && data.reportId) {
          nav.navigate('ReportDetail', { reportId: data.reportId });
        } else if (data.type === 'player' && data.playerId) {
          nav.navigate('PlayerDetail', { playerId: data.playerId });
        } else if (data.type === 'camp' && data.campId) {
          nav.navigate('CampDetail', { campId: data.campId });
        } else if (data.screen) {
          nav.navigate(data.screen as never, (data.params as never) ?? {});
        } else {
          nav.navigate('Main');
        }
      } catch (error) {
        logError('Error handling notification tap', error as Error, { data });
      }
    },
    []
  );

  const {
    isRegistered,
    permissionStatus,
    registerForNotifications,
    unregister,
    subscribeToTopic,
    unsubscribeFromTopic,
  } = useNotifications(
    isAuthenticated,
    user?.id,
    undefined,
    handleNotificationNavigation
  );

  useEffect(() => {
    if (isAuthenticated && permissionStatus !== 'denied' && !isRegistered) {
      logger.info('notifications', 'Registering for notifications', {
        userId: user?.id,
        permissionStatus,
      });
      registerForNotifications().catch((error) => {
        logError('Failed to register for notifications', error as Error);
        logger.error('notifications', 'Registration failed', { error: (error as Error)?.message });
      });
    }
  }, [isAuthenticated, isRegistered, permissionStatus, registerForNotifications]);

  useEffect(() => {
    if (!isAuthenticated && isRegistered) {
      unregister()
        .then(() => {
          subscribedTopicsRef.current = [];
        })
        .catch((error) => logError('Failed to unregister device', error as Error));
    }
  }, [isAuthenticated, isRegistered, unregister]);

  useEffect(() => {
    if (!isAuthenticated || !isRegistered) {
      return;
    }

    const syncTopics = async () => {
      logger.debug('notifications', 'Syncing topics', {
        current: subscribedTopicsRef.current,
        next: notificationTopics,
      });
      const current = subscribedTopicsRef.current;
      const next = [...notificationTopics];

      const toSubscribe = next.filter((topic) => !current.includes(topic));
      const toUnsubscribe = current.filter((topic) => !next.includes(topic));

      for (const topic of toSubscribe) {
        try {
          await subscribeToTopic(topic);
          logInfo('Subscribed to notification topic', { topic });
          logger.info('notifications', 'Subscribed', { topic });
        } catch (error) {
          logError('Failed to subscribe to topic', error as Error, { topic });
          logger.error('notifications', 'Subscribe failed', { topic, error: (error as Error)?.message });
        }
      }

      for (const topic of toUnsubscribe) {
        try {
          await unsubscribeFromTopic(topic);
          logInfo('Unsubscribed from notification topic', { topic });
          logger.info('notifications', 'Unsubscribed', { topic });
        } catch (error) {
          logError('Failed to unsubscribe from topic', error as Error, { topic });
          logger.error('notifications', 'Unsubscribe failed', { topic, error: (error as Error)?.message });
        }
      }

      subscribedTopicsRef.current = next;
    };

    syncTopics();
  }, [
    isAuthenticated,
    isRegistered,
    notificationTopics,
    subscribeToTopic,
    unsubscribeFromTopic,
  ]);

  useEffect(() => {
    if (!isAuthenticated && subscribedTopicsRef.current.length) {
      const cleanup = async () => {
        const topics = [...subscribedTopicsRef.current];
        subscribedTopicsRef.current = [];
        await Promise.all(
          topics.map((topic) =>
            unsubscribeFromTopic(topic).catch((error) =>
              logError('Cleanup unsubscribe failed', error as Error, { topic })
            )
          )
        );
      };
      cleanup();
    }
  }, [isAuthenticated, unsubscribeFromTopic]);

  // Log authentication state changes
  useEffect(() => {
    if (!isLoading) {
      logNavigation(
        'AuthState',
        isAuthenticated ? 'Authenticated' : 'Unauthenticated',
        { isAuthenticated }
      );
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator testID="auth-loading-indicator" size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        // Get initial route name
        routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
        if (routeNameRef.current) {
          logNavigation('App', routeNameRef.current, { initial: true });
        }
      }}
      onStateChange={async () => {
        const previousRouteName = routeNameRef.current;
        const currentRoute = navigationRef.current?.getCurrentRoute();
        const currentRouteName = currentRoute?.name;

        if (previousRouteName !== currentRouteName && currentRouteName) {
          // Log navigation event
          logNavigation(
            previousRouteName || 'Unknown',
            currentRouteName,
            {
              params: currentRoute?.params,
              timestamp: new Date().toISOString(),
            }
          );
        }

        // Save the current route name for next change
        routeNameRef.current = currentRouteName;
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Landing" component={HomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : (
          <>
            {shouldShowRoleSelector ? (
              <Stack.Screen name="RoleSelector" component={RoleSelectorScreen} />
            ) : null}
            <Stack.Screen name="Main" component={AppNavigator} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
