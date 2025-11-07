import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  FadeInDown,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from '../../utils/haptics';
import {
  Card,
  Text,
  Heading,
  Caption,
  Badge,
  Button,
  Avatar,
  theme,
} from '../../design/components';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ProfileScreenNew = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  // Animation values
  const avatarScale = useSharedValue(1);
  const statsAnimation = useSharedValue(0);

  React.useEffect(() => {
    statsAnimation.value = withSpring(1, theme.animations.springs.bouncy);
  }, []);

  const handleLogout = () => {
    Haptics.warningFeedback();
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            Haptics.successFeedback();
            logout();
          },
        },
      ],
    );
  };

  const profileStats = [
    { label: 'Reports', value: '127', icon: 'document-text', color: theme.colors.brand.primary },
    { label: 'Players', value: '3.2K', icon: 'people', color: theme.colors.brand.accent },
    { label: 'Success', value: '94%', icon: 'trophy', color: theme.colors.semantic.success },
    { label: 'Rating', value: '4.9', icon: 'star', color: theme.colors.semantic.warning },
  ];

  const menuItems = [
    {
      title: 'My Passport',
      icon: 'qr-code',
      color: theme.colors.brand.primary,
      onPress: () => {
        Haptics.lightImpact();
        navigation.navigate('Passport');
      },
    },
    {
      title: 'Account Settings',
      icon: 'person-circle',
      color: theme.colors.text.secondary,
      onPress: () => {
        Haptics.lightImpact();
        // navigation.navigate('AccountSettings');
        Alert.alert('Coming Soon', 'Account Settings will be available soon!');
      },
    },
    {
      title: 'Subscription',
      icon: 'card',
      color: theme.colors.brand.accent,
      badge: 'PRO',
      onPress: () => {
        Haptics.lightImpact();
        // navigation.navigate('Subscription');
        Alert.alert('Coming Soon', 'Subscription management will be available soon!');
      },
    },
    {
      title: 'Privacy & Security',
      icon: 'shield-checkmark',
      color: theme.colors.semantic.info,
      onPress: () => {
        Haptics.lightImpact();
        // navigation.navigate('Privacy');
        Alert.alert('Coming Soon', 'Privacy & Security settings will be available soon!');
      },
    },
    {
      title: 'Help & Support',
      icon: 'help-circle',
      color: theme.colors.semantic.warning,
      onPress: () => {
        Haptics.lightImpact();
        // navigation.navigate('Support');
        Alert.alert('Coming Soon', 'Help & Support will be available soon!');
      },
    },
    {
      title: 'About',
      icon: 'information-circle',
      color: theme.colors.text.secondary,
      onPress: () => {
        Haptics.lightImpact();
        // navigation.navigate('About');
        Alert.alert('Arcane Football', 'Version 1.0.0\n© 2025 Arcane GmbH\nAll rights reserved.');
      },
    },
  ];

  const renderProfileHeader = () => (
    <Animated.View
      entering={FadeInDown.springify()}
      style={styles.profileHeader}
    >
      <LinearGradient
        colors={[theme.colors.brand.primary + '20', theme.colors.brand.accent + '10']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.avatarContainer}>
        <Animated.View
          style={useAnimatedStyle(() => ({
            transform: [{ scale: avatarScale.value }],
          }))}
        >
          <Avatar
            size="xl"
            src={user?.avatar}
            fallback={user?.firstName?.charAt(0) || 'U'}
            badge="online"
          />
        </Animated.View>

        <Pressable
          onPress={() => {
            Haptics.lightImpact();
            // navigation.navigate('EditProfile');
            Alert.alert('Coming Soon', 'Profile editing will be available soon!');
          }}
          style={styles.editButton}
        >
          <BlurView intensity={80} style={styles.editButtonBlur}>
            <Ionicons name="pencil" size={16} color={theme.colors.text.inverse} />
          </BlurView>
        </Pressable>
      </View>

      <View style={styles.userInfo}>
        <Heading variant="h2" style={styles.userName}>
          {user?.firstName} {user?.lastName}
        </Heading>
        <Caption color="secondary">@{user?.username || 'username'}</Caption>
        <View style={styles.roleBadge}>
          <Badge variant="gradient" rounded size="sm">
            <Text style={{ color: theme.colors.text.inverse, fontSize: 12 }}>
              {user?.role || 'Scout'}
            </Text>
          </Badge>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {profileStats.map((stat, index) => (
          <Animated.View
            key={index}
            entering={SlideInRight.delay(index * 50).springify()}
            style={styles.statItem}
          >
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Heading variant="h3" style={styles.statValue}>
              {stat.value}
            </Heading>
            <Caption color="tertiary" style={styles.statLabel}>
              {stat.label}
            </Caption>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );

  const renderSettings = () => (
    <Animated.View
      entering={FadeInDown.delay(200).springify()}
      style={styles.settingsSection}
    >
      <Card variant="glass" size="lg" style={styles.settingsCard}>
        <Heading variant="h3" style={styles.sectionTitle}>
          Quick Settings
        </Heading>

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons
              name="notifications"
              size={24}
              color={theme.colors.text.secondary}
            />
            <View style={styles.settingInfo}>
              <Text variant="body">Push Notifications</Text>
              <Caption color="tertiary">Receive alerts for new reports</Caption>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={(value) => {
              Haptics.selectionChanged();
              setNotifications(value);
            }}
            trackColor={{
              false: theme.colors.surface.border,
              true: theme.colors.brand.primary,
            }}
            thumbColor={theme.colors.text.inverse}
          />
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons
              name="moon"
              size={24}
              color={theme.colors.text.secondary}
            />
            <View style={styles.settingInfo}>
              <Text variant="body">Dark Mode</Text>
              <Caption color="tertiary">Easier on the eyes at night</Caption>
            </View>
          </View>
          <Switch
            value={darkMode}
            onValueChange={(value) => {
              Haptics.selectionChanged();
              setDarkMode(value);
            }}
            trackColor={{
              false: theme.colors.surface.border,
              true: theme.colors.brand.primary,
            }}
            thumbColor={theme.colors.text.inverse}
          />
        </View>

        <View style={styles.settingDivider} />

        <View style={styles.settingItem}>
          <View style={styles.settingLeft}>
            <Ionicons
              name="phone-portrait"
              size={24}
              color={theme.colors.text.secondary}
            />
            <View style={styles.settingInfo}>
              <Text variant="body">Haptic Feedback</Text>
              <Caption color="tertiary">Vibration on interactions</Caption>
            </View>
          </View>
          <Switch
            value={hapticFeedback}
            onValueChange={(value) => {
              setHapticFeedback(value);
              if (value) Haptics.selectionChanged();
            }}
            trackColor={{
              false: theme.colors.surface.border,
              true: theme.colors.brand.primary,
            }}
            thumbColor={theme.colors.text.inverse}
          />
        </View>
      </Card>
    </Animated.View>
  );

  const renderMenuItems = () => (
    <Animated.View
      entering={FadeInDown.delay(300).springify()}
      style={styles.menuSection}
    >
      <Card variant="glass" size="lg" style={styles.menuCard}>
        {menuItems.map((item, index) => (
          <Pressable
            key={index}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.menuItem,
              pressed && styles.menuItemPressed,
            ]}
          >
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { backgroundColor: item.color + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color} />
              </View>
              <Text variant="body">{item.title}</Text>
            </View>
            <View style={styles.menuItemRight}>
              {item.badge && (
                <Badge variant="gradient" rounded size="sm" style={styles.menuBadge}>
                  <Text style={{ color: theme.colors.text.inverse, fontSize: 10 }}>
                    {item.badge}
                  </Text>
                </Badge>
              )}
              <Ionicons
                name="chevron-forward"
                size={16}
                color={theme.colors.text.tertiary}
              />
            </View>
          </Pressable>
        ))}
      </Card>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background.primary, theme.colors.background.secondary]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderProfileHeader()}
        {renderSettings()}
        {renderMenuItems()}

        {/* Logout Button */}
        <Animated.View
          entering={FadeInDown.delay(400).springify()}
          style={styles.logoutSection}
        >
          <Button
            variant="destructive"
            size="lg"
            onPress={handleLogout}
            fullWidth
            icon={<Ionicons name="log-out" size={20} color={theme.colors.text.inverse} />}
          >
            Logout
          </Button>
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    paddingTop: theme.layout.safeArea.top,
  },
  profileHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerGradient: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    height: 400,
    opacity: 0.5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: SCREEN_WIDTH / 2 - 60,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  editButtonBlur: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  userName: {
    marginBottom: theme.spacing.xs,
  },
  roleBadge: {
    marginTop: theme.spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 11,
  },
  settingsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  settingsCard: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingDivider: {
    height: 1,
    backgroundColor: theme.colors.surface.border,
    marginVertical: theme.spacing.xs,
  },
  menuSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  menuCard: {
    padding: theme.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.md,
  },
  menuItemPressed: {
    backgroundColor: theme.colors.surface.glass,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuBadge: {
    marginRight: theme.spacing.sm,
  },
  logoutSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
});

export default ProfileScreenNew;