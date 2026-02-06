import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  LayoutChangeEvent,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'segmented';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  scrollable?: boolean;
  style?: ViewStyle;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  scrollable = false,
  style,
}) => {
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  const indicatorPosition = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleTabLayout = (key: string, event: LayoutChangeEvent) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({
      ...prev,
      [key]: { x, width },
    }));

    if (key === activeTab) {
      indicatorPosition.value = withSpring(x, theme.animations.springs.stiff);
      indicatorWidth.value = withSpring(width, theme.animations.springs.stiff);
    }
  };

  const handleTabPress = (key: string) => {
    Haptics.selectionAsync();
    onTabChange(key);

    const layout = tabLayouts[key];
    if (layout) {
      indicatorPosition.value = withSpring(layout.x, theme.animations.springs.bouncy);
      indicatorWidth.value = withSpring(layout.width, theme.animations.springs.bouncy);

      if (scrollable && scrollRef.current) {
        scrollRef.current.scrollTo({
          x: layout.x - 20,
          animated: true,
        });
      }
    }
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: indicatorWidth.value,
  }));

  const containerContent = (
    <>
      {variant !== 'underline' && (
        <Animated.View
          style={[
            styles.indicator,
            styles[`indicator_${variant}`],
            styles[`indicator_${size}`],
            indicatorStyle,
          ]}
        />
      )}
      {tabs.map((tab, index) => (
        <TabButton
          key={tab.key}
          tab={tab}
          isActive={tab.key === activeTab}
          onPress={() => handleTabPress(tab.key)}
          onLayout={(event) => handleTabLayout(tab.key, event)}
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          tabCount={tabs.length}
        />
      ))}
      {variant === 'underline' && (
        <Animated.View
          style={[
            styles.underlineIndicator,
            styles[`underlineIndicator_${size}`],
            indicatorStyle,
          ]}
        />
      )}
    </>
  );

  if (scrollable) {
    return (
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.container, style]}
        contentContainerStyle={styles.scrollContent}
      >
        {containerContent}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.container, styles[`container_${variant}`], style]}>
      {containerContent}
    </View>
  );
};

interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  onLayout: (event: LayoutChangeEvent) => void;
  variant: TabsProps['variant'];
  size: TabsProps['size'];
  fullWidth?: boolean;
  tabCount: number;
}

const TabButton: React.FC<TabButtonProps> = ({
  tab,
  isActive,
  onPress,
  onLayout,
  variant,
  size,
  fullWidth,
  tabCount,
}) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, theme.animations.springs.stiff);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, theme.animations.springs.bouncy);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLayout={onLayout}
      style={[
        styles.tab,
        styles[`tab_${size}`],
        variant === 'segmented' && styles.tab_segmented,
        fullWidth && { flex: 1 / tabCount },
        animatedStyle,
      ]}
    >
      <View style={styles.tabContent}>
        {tab.icon && <View style={styles.tabIcon}>{tab.icon}</View>}
        <Text
          style={[
            styles.tabLabel,
            styles[`tabLabel_${size}`],
            isActive && styles.tabLabelActive,
          ]}
        >
          {tab.label}
        </Text>
        {tab.badge !== undefined && (
          <View style={[styles.badge, styles[`badge_${size}`]]}>
            <Text style={styles.badgeText}>
              {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
            </Text>
          </View>
        )}
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  container_default: {
    backgroundColor: theme.colors.surface.glass,
    padding: 4,
  },
  container_pills: {
    backgroundColor: theme.colors.surface.glass,
    padding: 4,
  },
  container_underline: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surface.border,
  },
  container_segmented: {
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    padding: 2,
  },

  scrollContent: {
    paddingHorizontal: 24,
  },

  // Indicator
  indicator: {
    position: 'absolute',
    backgroundColor: theme.colors.brand.primary,
    borderRadius: 8,
  },
  indicator_default: {
    top: 4,
    bottom: 4,
    left: 4,
  },
  indicator_pills: {
    top: 4,
    bottom: 4,
    left: 4,
  },
  indicator_segmented: {
    top: 2,
    bottom: 2,
    left: 2,
    backgroundColor: theme.colors.background.elevated,
  },
  indicator_underline: {
    display: 'none',
  },

  indicator_sm: {
    height: 32,
  },
  indicator_md: {
    height: 40,
  },
  indicator_lg: {
    height: 48,
  },

  underlineIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: theme.colors.brand.primary,
  },
  underlineIndicator_sm: {
    height: 2,
  },
  underlineIndicator_md: {
    height: 3,
  },
  underlineIndicator_lg: {
    height: 4,
  },

  // Tab
  tab: {
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tab_segmented: {
    flex: 1,
  },
  tab_sm: {
    minHeight: 32,
    paddingHorizontal: 16,
  },
  tab_md: {
    minHeight: 40,
    paddingHorizontal: 24,
  },
  tab_lg: {
    minHeight: 48,
    paddingHorizontal: 32,
  },

  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  tabIcon: {
    marginRight: 4,
  },

  tabLabel: {
    fontFamily: theme.typography.fonts.medium,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text.secondary,
  },
  tabLabel_sm: {
    fontSize: theme.typography.sizes.xs,
  },
  tabLabel_md: {
    fontSize: theme.typography.sizes.sm,
  },
  tabLabel_lg: {
    fontSize: theme.typography.sizes.base,
  },
  tabLabelActive: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semiBold,
  },

  badge: {
    marginLeft: 4,
    backgroundColor: theme.colors.semantic.error,
    borderRadius: 9999,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge_sm: {
    minWidth: 14,
    height: 14,
  },
  badge_md: {
    minWidth: 16,
    height: 16,
  },
  badge_lg: {
    minWidth: 18,
    height: 18,
  },
  badgeText: {
    fontSize: 10,
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.weights.bold,
  },
});

export default Tabs;