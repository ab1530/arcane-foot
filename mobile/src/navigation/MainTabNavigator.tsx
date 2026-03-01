import React, { useMemo, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Platform,
  Modal,
  TouchableWithoutFeedback,
  Text,
  Pressable,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import type { AppStackParamList, MainTabParamList } from '../types/navigation';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { AIScreen } from '../screens/ai/AIScreen';
import MarketplaceScreen from '../screens/marketplace/MarketplaceScreen';
import CoachingHubScreen from '../screens/coaching/CoachingHubScreen';
import { PlayerSpaceScreen } from '../screens/players/PlayerSpaceScreen';
import { PassportScreen } from '../screens/passport/PassportScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CampsListScreen from '../screens/camps/CampsListScreen';
import { NewsScreen } from '../screens/news/NewsScreen';
import { GlobalSearch } from '../components/search/GlobalSearch';
import { NotificationsCenter } from '../components/notifications/NotificationsCenter';
import { Icon, TabIcon } from '../components/ui';
import { lightImpact } from '../utils/haptics';
import type { IconName } from '../constants/icons';
import { FEATURE_FLAGS, isFeatureEnabled } from '../constants/features';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_ROLE, ROLE_CONFIG } from '../lib/roles';
import type { UserRole } from '../lib/roles';

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabName = keyof MainTabParamList;

interface TabDefinition {
  name: TabName;
  component: React.ComponentType<any>;
  title: string;
  icon: IconName;
  headerShown?: boolean;
  featureFlag?: keyof typeof FEATURE_FLAGS;
}

const TAB_DEFINITIONS: Record<TabName, TabDefinition> = {
  Home: {
    name: 'Home',
    component: DashboardScreen,
    title: 'Dashboard',
    icon: 'grid',
    headerShown: false,
  },
  Camps: {
    name: 'Camps',
    component: CampsListScreen,
    title: 'Camps',
    icon: 'football',
  },
  AIHub: {
    name: 'AIHub',
    component: AIScreen,
    title: 'AI',
    icon: 'ai',
    featureFlag: 'aiHubTab',
  },
  Marketplace: {
    name: 'Marketplace',
    component: MarketplaceScreen,
    title: 'Marketplace',
    icon: 'pricetag',
    headerShown: false,
    featureFlag: 'marketplaceTab',
  },
  Coaching: {
    name: 'Coaching',
    component: CoachingHubScreen,
    title: 'Coaching',
    icon: 'fitness',
    featureFlag: 'coachingTab',
  },
  Passport: {
    name: 'Passport',
    component: PassportScreen,
    title: 'Passport',
    icon: 'qrCode',
    featureFlag: 'passportTab',
  },
  Profile: {
    name: 'Profile',
    component: ProfileScreen,
    title: 'Profil',
    icon: 'personCircle',
    headerShown: false,
    featureFlag: 'profileTab',
  },
  News: {
    name: 'News',
    component: NewsScreen,
    title: 'News',
    icon: 'newspaper',
    headerShown: false,
  },
};

type RoleTabMap = Record<UserRole | 'DEFAULT', TabName[]>;

const ROLE_TABS: RoleTabMap = {
  SUPER_ADMIN: ['Home', 'AIHub', 'Marketplace', 'News', 'Profile'],
  ADMIN: ['Home', 'AIHub', 'Marketplace', 'News', 'Profile'],
  AGENT: ['Home', 'Marketplace', 'News', 'Profile'],
  SCOUT: ['Home', 'AIHub', 'Marketplace', 'News', 'Profile'],
  ANALYST: ['Home', 'AIHub', 'News', 'Profile'],
  PLAYER: ['Home', 'Camps', 'Coaching', 'Passport', 'News', 'Profile'],
  CLUB_CONTACT: ['Home', 'Marketplace', 'News', 'Profile'],
  PUBLIC: ['Home', 'News', 'Profile'],
  DEFAULT: ['Home', 'News', 'Profile'],
};

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
const HeaderButtons = ({
  onSearchPress,
  onNotificationsPress,
  onCommandCenterPress,
}: {
  onSearchPress: () => void;
  onNotificationsPress: () => void;
  onCommandCenterPress: () => void;
}) => (
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
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onCommandCenterPress();
      }}
      style={{
        padding: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.surface.glass + '50',
      }}
    >
      <Icon name="grid" size="md" color={theme.colors.text.secondary} />
    </TouchableOpacity>
  </View>
);

interface CommandShortcut {
  label: string;
  icon: IconName;
  action: () => void;
}

const CommandCenterModal = ({
  visible,
  onClose,
  shortcuts,
}: {
  visible: boolean;
  onClose: () => void;
  shortcuts: CommandShortcut[];
}) => (
  <Modal visible={visible} transparent animationType="fade">
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <TouchableWithoutFeedback>
        <View style={styles.commandCenterCard}>
          <Text style={styles.commandCenterTitle}>Command Center</Text>
          <View style={styles.shortcutsGrid}>
            {shortcuts.map((shortcut) => (
              <TouchableOpacity
                key={shortcut.label}
                style={styles.shortcutItem}
                onPress={() => {
                  shortcut.action();
                  onClose();
                }}
              >
                <View style={styles.shortcutIcon}>
                  <Icon name={shortcut.icon} size="lg" color={theme.colors.brand.primary} />
                </View>
                <Text style={styles.shortcutLabel}>{shortcut.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Pressable>
  </Modal>
);

export default function MainTabNavigator() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [commandCenterVisible, setCommandCenterVisible] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user, activeRole } = useAuth();
  const role = (activeRole ?? user?.role ?? DEFAULT_ROLE) as UserRole;
  const roleConfig = ROLE_CONFIG[role] ?? ROLE_CONFIG[DEFAULT_ROLE];
  const requestedTabs = ROLE_TABS[role] ?? ROLE_TABS.DEFAULT;
  const scoutNewFlowEnabled = isFeatureEnabled('scoutNewFlow');
  const missionRequestHubEnabled = isFeatureEnabled('missionRequestHub');

  const availableTabs = useMemo(() => {
    return requestedTabs
      .map((tabName) => {
        const tabDefinition = TAB_DEFINITIONS[tabName];
        if (!tabDefinition) {
          return null;
        }
        if (tabDefinition.name === 'Home' && role === 'PLAYER') {
          return {
            ...tabDefinition,
            component: PlayerSpaceScreen,
            title: 'Espace',
            icon: 'stats',
          };
        }
        return tabDefinition;
      })
      .filter((tabDef) => {
        if (!tabDef) return false;
        if (tabDef.featureFlag && !isFeatureEnabled(tabDef.featureFlag)) {
          return false;
        }
        return true;
      });
  }, [requestedTabs]);

  const openSearch = () => setSearchVisible(true);
  const closeSearch = () => setSearchVisible(false);

  const openNotifications = () => setNotificationsVisible(true);
  const closeNotifications = () => setNotificationsVisible(false);

  const openCommandCenter = () => setCommandCenterVisible(true);
  const closeCommandCenter = () => setCommandCenterVisible(false);

  const commandShortcuts = useMemo<CommandShortcut[]>(() => {
    const shortcuts: CommandShortcut[] = [];
    const permissions = roleConfig.permissions;

    if (permissions.canAccessScouting && isFeatureEnabled('shortcuts.players')) {
      shortcuts.push({
        label: 'Joueurs',
        icon: 'people',
        action: () => navigation.navigate('Players'),
      });
    }
    if ((permissions.canAccessAdmin || permissions.canAccessAI) && isFeatureEnabled('shortcuts.analytics')) {
      shortcuts.push({
        label: 'Analytique',
        icon: 'analytics',
        action: () => navigation.navigate('Analytics'),
      });
    }
    if (scoutNewFlowEnabled && permissions.canAccessScouting && isFeatureEnabled('shortcuts.matches')) {
      shortcuts.push({
        label: 'Matches',
        icon: 'football',
        action: () => navigation.navigate('Calendar'),
      });
    }
    if (
      missionRequestHubEnabled &&
      ['SUPER_ADMIN', 'ADMIN', 'AGENT', 'SCOUT'].includes(role) &&
      isFeatureEnabled('shortcuts.missionRequests')
    ) {
      shortcuts.push({
        label: 'Missions',
        icon: 'clipboard',
        action: () => navigation.navigate('MissionRequests'),
      });
    }
    if (scoutNewFlowEnabled && permissions.canAccessScouting && isFeatureEnabled('shortcuts.reports')) {
      shortcuts.push({
        label: 'Rapports',
        icon: 'document',
        action: () => navigation.navigate('Reports'),
      });
    }
    if (scoutNewFlowEnabled && permissions.canAccessAI && isFeatureEnabled('shortcuts.voiceToReport')) {
      shortcuts.push({
        label: 'Voice Report',
        icon: 'mic',
        action: () => navigation.navigate('VoiceToReport'),
      });
    }
    if (permissions.canManageMarketplace && isFeatureEnabled('shortcuts.marketplace')) {
      shortcuts.push({
        label: 'Marketplace',
        icon: 'pricetag',
        action: () => navigation.navigate('Marketplace'),
      });
    }
    return shortcuts;
  }, [missionRequestHubEnabled, navigation, role, roleConfig, scoutNewFlowEnabled]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background.primary }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.brand.primary,
          tabBarInactiveTintColor: theme.colors.text.secondary,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'rgba(16, 22, 47, 0.92)',
            borderTopColor: theme.colors.border.subtle,
            borderTopWidth: 1,
            paddingBottom: Platform.OS === 'ios' ? 20 : 10,
            paddingTop: 10,
            paddingHorizontal: 10,
            height: Platform.OS === 'ios' ? 90 : 72,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 12,
          },
          tabBarItemStyle: {
            borderRadius: 14,
            marginHorizontal: 2,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
            marginTop: 4,
            fontFamily: theme.typography.fonts.bold,
            letterSpacing: 0.3,
          },
          tabBarButton: (props) => <AnimatedTabButton {...props} />,
        }}
      >
        {availableTabs.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            listeners={
              tab.name === 'AIHub'
                ? {
                    tabPress: (event) => {
                      event.preventDefault();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      Alert.alert(
                        'Fonctionnalité prochaine',
                        'Le Hub AI sera disponible dans une prochaine version.',
                      );
                    },
                  }
                : undefined
            }
            options={{
              title: tab.title,
              headerShown: tab.headerShown ?? true,
              tabBarIcon: ({ color, focused }) => (
                <TabIcon name={tab.icon} focused={focused} color={color} size={24} />
              ),
            }}
          />
        ))}
      </Tab.Navigator>

      {/* Floating Command Center button */}
      {commandShortcuts.length > 0 && (
        <TouchableOpacity
          style={styles.commandCenterFab}
          onPress={() => {
            lightImpact();
            openCommandCenter();
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[theme.colors.brand.primary, theme.colors.brand.primaryDark || theme.colors.brand.primary]}
            style={styles.commandCenterFabGradient}
          >
            <Icon name="grid" size="lg" color={theme.colors.background.primary} />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Global Search Modal */}
      <GlobalSearch visible={searchVisible} onClose={closeSearch} navigation={navigation} />

      {/* Notifications Center Modal */}
      <NotificationsCenter visible={notificationsVisible} onClose={closeNotifications} />

      <CommandCenterModal
        visible={commandCenterVisible}
        onClose={closeCommandCenter}
        shortcuts={commandShortcuts}
      />
    </View>
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
    borderRadius: 14,
    overflow: 'hidden',
  },
  commandCenterFab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'ios' ? 110 : 90,
    shadowColor: theme.colors.brand.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  commandCenterFabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 24,
  },
  commandCenterCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  commandCenterTitle: {
    fontSize: theme.typography.sizes.h4,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 16,
  },
  shortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  shortcutItem: {
    width: '48%',
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surface.glassLight,
    borderWidth: 1,
    borderColor: theme.colors.surface.borderLight,
  },
  shortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.brand.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  shortcutLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
});
