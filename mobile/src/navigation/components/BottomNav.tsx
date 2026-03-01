/**
 * ARCANE BOTTOM NAVIGATION
 * Premium bottom navigation with 5 tabs, animated indicators, and glassmorphism
 *
 * Features:
 * - 5 navigation tabs with icons and labels
 * - Active state with yellow indicator
 * - Badge support for notifications
 * - Floating variant with glassmorphism
 * - Safe area insets for iOS
 * - Smooth animations
 *
 * @version 1.0.0
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../design/tokens';
import { typographyPresets as typography } from '../../design/typography';


// ============================================================================
// TYPES
// ============================================================================

export type TabRoute = 'home' | 'search' | 'ai-studio' | 'stats' | 'profile';

export interface TabItem {
  route: TabRoute;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconOutline: keyof typeof Ionicons.glyphMap;
  badge?: number;
}

export interface BottomNavProps {
  activeRoute: TabRoute;
  onTabPress: (route: TabRoute) => void;
  variant?: 'solid' | 'floating';
  showLabels?: boolean;
  tabs?: TabItem[];
}

// ============================================================================
// DEFAULT TABS CONFIGURATION
// ============================================================================

const DEFAULT_TABS: TabItem[] = [
  {
    route: 'home',
    label: 'Home',
    icon: 'home',
    iconOutline: 'home-outline',
  },
  {
    route: 'search',
    label: 'Search',
    icon: 'search',
    iconOutline: 'search-outline',
  },
  {
    route: 'ai-studio',
    label: 'AI Studio',
    icon: 'sparkles',
    iconOutline: 'sparkles-outline',
  },
  {
    route: 'stats',
    label: 'Stats',
    icon: 'bar-chart',
    iconOutline: 'bar-chart-outline',
  },
  {
    route: 'profile',
    label: 'Profile',
    icon: 'person',
    iconOutline: 'person-outline',
  },
];

// ============================================================================
// BOTTOM NAV COMPONENT
// ============================================================================

export const BottomNav: React.FC<BottomNavProps> = ({
  activeRoute,
  onTabPress,
  variant = 'solid',
  showLabels = true,
  tabs = DEFAULT_TABS,
}) => {
  const insets = useSafeAreaInsets();
  const [indicatorAnim] = React.useState(new Animated.Value(0));

  // Calculate indicator position based on active route
  const activeIndex = tabs.findIndex((tab) => tab.route === activeRoute);

  React.useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      damping: tokens.easing.spring.damping,
      stiffness: tokens.easing.spring.stiffness,
    }).start();
  }, [activeIndex]);

  const handleTabPress = (route: TabRoute) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTabPress(route);
  };

  // Calculate indicator transform
  const tabWidth = 100 / tabs.length;
  const indicatorTranslateX = indicatorAnim.interpolate({
    inputRange: tabs.map((_, index) => index),
    outputRange: tabs.map((_, index) => index * tabWidth),
  });

  const containerStyle = [
    styles.container,
    variant === 'floating' && styles.floatingContainer,
    {
      paddingBottom: Math.max(insets.bottom, 16),
    },
  ];

  const content = (
    <>
      {/* Animated Yellow Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${tabWidth}%`,
            transform: [
              {
                translateX: indicatorTranslateX.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ],
          },
        ]}
      />

      {/* Tab Items */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = tab.route === activeRoute;
          return (
            <TouchableOpacity
              key={tab.route}
              style={styles.tab}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${tab.label} tab`}
              accessibilityState={{ selected: isActive }}
            >
              <View style={styles.tabContent}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                  <Ionicons
                    name={isActive ? tab.icon : tab.iconOutline}
                    size={tokens.iconSize.md}
                    color={
                      isActive
                        ? tokens.colors.yellow.DEFAULT
                        : tokens.colors.gray[400]
                    }
                  />
                  {/* Badge */}
                  {tab.badge && tab.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Label */}
                {showLabels && (
                  <Text
                    style={[
                      styles.tabLabel,
                      isActive && styles.tabLabelActive,
                    ]}
                    numberOfLines={1}
                  >
                    {tab.label}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );

  // Render with or without blur based on variant
  if (variant === 'floating') {
    return (
      <View style={[styles.floatingWrapper, { bottom: insets.bottom + 16 }]}>
        <BlurView
          intensity={tokens.glass.card.intensity}
          tint={tokens.glass.card.tint}
          style={containerStyle}
        >
          {content}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {content}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#353439', // tokens.colors.arcane.anthracite
    borderTopWidth: 1,
    borderTopColor: '#b3afb240', // tokens.colors.arcane.slate + '40'
    paddingTop: 12, // 12
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  floatingWrapper: {
    position: 'absolute',
    left: 16, // 16
    right: 16,
    zIndex: 30, // tokens.zIndex.fixed
  },
  floatingContainer: {
    backgroundColor: 'rgba(27, 27, 31, 0.7)', // tokens.glass.card.backgroundColor
    borderRadius: 24, // 24
    borderWidth: 1, // tokens.glass.card.borderWidth
    borderColor: 'rgba(228, 255, 59, 0.1)', // tokens.glass.card.borderColor
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    backgroundColor: '#e6ff3c', // tokens.colors.yellow.DEFAULT
    borderRadius: 6, // 6
    shadowColor: '#e6ff3c',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 8, // 8
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8, // 8
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4, // 4
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444', // tokens.colors.semantic.error
    borderRadius: 9999, // 9999
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#353439', // tokens.colors.arcane.anthracite
  },
  badgeText: {
    fontFamily: 'Inter',
    fontSize: 10, // tokens.fontSize.xs - 2
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#FAFAFA', // tokens.colors.gray[50]
  },
  tabLabel: {
    fontFamily: 'Manrope',
    fontSize: 12, // tokens.fontSize.xs
    fontWeight: '400',
    lineHeight: 18,
    color: '#A1A1AA', // tokens.colors.gray[400]
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#e6ff3c', // tokens.colors.yellow.DEFAULT
    fontWeight: '600', // tokens.fontWeight.semibold
  },
});

export default BottomNav;
