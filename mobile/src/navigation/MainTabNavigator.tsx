import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { theme } from '../design/theme';
import type { MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/home/HomeScreen';
import PlayersScreen from '../screens/players/PlayersScreen';
import { AnalyticsScreen } from '../screens/analytics/AnalyticsScreen';
import { MarketScreen } from '../screens/market/MarketScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { GlobalSearch } from '../components/search/GlobalSearch';
import { NotificationsCenter } from '../components/notifications/NotificationsCenter';
import { Icon, TabIcon } from '../components/ui';
import { lightImpact } from '../utils/haptics';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Animated Tab Button Component with enhanced effects
const AnimatedTabButton = ({ children, onPress, accessibilityState }: any) => {
  const focused = accessibilityState?.selected || false;
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.05 : 1, {
      damping: 15,
      stiffness: 150,
    });
    glowOpacity.value = withTiming(focused ? 1 : 0, {
      duration: 300,
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePress = (e: any) => {
    scale.value = withSpring(0.92, { damping: 10, stiffness: 400 }, () => {
      scale.value = withSpring(focused ? 1.05 : 1, { damping: 10, stiffness: 400 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(e);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={styles.tabButton}
    >
      <Animated.View style={[styles.tabButtonContent, animatedStyle]}>
        {/* Gradient background for active state */}
        {focused && (
          <Animated.View style={[StyleSheet.absoluteFillObject, glowStyle]}>
            <LinearGradient
              colors={[theme.colors.brand.primary + '25', theme.colors.brand.accent + '15']}
              style={StyleSheet.absoluteFillObject}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            {/* Glass effect */}
            <BlurView
              intensity={20}
              style={[StyleSheet.absoluteFillObject, { borderRadius: 12 }]}
            />
          </Animated.View>
        )}
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Header buttons component with modern effects
const HeaderButtons = ({ onSearchPress, onNotificationsPress }: { onSearchPress: () => void; onNotificationsPress: () => void }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 12, gap: 8 }}>
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSearchPress();
      }}
      style={{
        padding: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.surface.glass + '50'
      }}
    >
      <Icon name="search" size="md" color={theme.colors.text.secondary} />
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onNotificationsPress();
      }}
      style={{
        padding: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.surface.glass + '50'
      }}
    >
      <Icon name="notifications" size="md" color={theme.colors.text.secondary} />
    </TouchableOpacity>
  </View>
);

export default function MainTabNavigator() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const navigation = useNavigation();

  const openSearch = () => setSearchVisible(true);
  const closeSearch = () => setSearchVisible(false);

  const openNotifications = () => setNotificationsVisible(true);
  const closeNotifications = () => setNotificationsVisible(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: theme.colors.brand.primary,
          tabBarInactiveTintColor: theme.colors.text.tertiary,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: theme.colors.surface.glass,
            borderTopColor: theme.colors.brand.primary + '20',
            borderTopWidth: 0.5,
            paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            paddingTop: 12,
            height: Platform.OS === 'ios' ? 88 : 68,
            shadowColor: theme.colors.brand.primary,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 12,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 4,
            fontFamily: theme.typography.fonts.bold,
            letterSpacing: 0.3,
          },
          headerStyle: {
            backgroundColor: theme.colors.background.primary,
            borderBottomColor: theme.colors.surface.border,
            borderBottomWidth: 0.5,
            shadowColor: theme.colors.brand.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 4,
          },
          headerTintColor: theme.colors.text.primary,
          headerTitleStyle: {
            fontWeight: '800',
            fontFamily: theme.typography.fonts.bold,
            fontSize: 18,
            letterSpacing: -0.5,
          },
          headerRight: () => <HeaderButtons onSearchPress={openSearch} onNotificationsPress={openNotifications} />,
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" focused={focused} color={color} size={24} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Players"
        component={PlayersScreen}
        options={{
          title: 'Players',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="people" focused={focused} color={color} size={24} />
          ),
        }}
      />
      <Tab.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="stats" focused={focused} color={color} size={24} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Market"
        component={MarketScreen}
        options={{
          title: 'Market',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="trending" focused={focused} color={color} size={24} />
          ),
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings" focused={focused} color={color} size={24} />
          ),
        }}
      />
    </Tab.Navigator>

    {/* Global Search Modal */}
    <GlobalSearch visible={searchVisible} onClose={closeSearch} navigation={navigation} />

    {/* Notifications Center Modal */}
    <NotificationsCenter visible={notificationsVisible} onClose={closeNotifications} />
  </>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
