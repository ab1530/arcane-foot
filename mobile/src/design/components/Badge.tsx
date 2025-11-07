import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: boolean;
  pulse?: boolean;
  dot?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = true,
  pulse = false,
  dot = false,
  icon,
  style,
}) => {
  const pulseAnimation = useSharedValue(1);

  React.useEffect(() => {
    if (pulse) {
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1,
        true
      );
    }
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const containerStyle = [
    styles.container,
    styles[`container_${variant}`],
    styles[`size_${size}`],
    rounded && styles.rounded,
    dot && styles.dot,
    pulse && animatedStyle,
    style,
  ];

  const content = (
    <>
      {icon && <View style={styles.icon}>{icon}</View>}
      {!dot && (
        <Text style={[styles.text, styles[`text_${variant}`], styles[`text_${size}`]]}>
          {children}
        </Text>
      )}
    </>
  );

  if (variant === 'gradient') {
    return (
      <Animated.View style={containerStyle}>
        <LinearGradient
          colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, rounded && styles.rounded]}
        >
          {content}
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={containerStyle}>
      {content}
    </Animated.View>
  );
};

export const BadgeGroup: React.FC<{
  children: React.ReactNode;
  spacing?: 'xs' | 'sm' | 'md';
  direction?: 'horizontal' | 'vertical';
}> = ({ children, spacing = 'sm', direction = 'horizontal' }) => {
  return (
    <View style={[
      styles.group,
      direction === 'horizontal' ? styles.groupHorizontal : styles.groupVertical,
      styles[`groupSpacing_${spacing}`],
    ]}>
      {React.Children.map(children, (child, index) => (
        <View
          key={index}
          style={[
            direction === 'horizontal' && index > 0 && { marginLeft: theme.spacing[spacing] },
            direction === 'vertical' && index > 0 && { marginTop: theme.spacing[spacing] },
          ]}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },

  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },

  text: {
    fontFamily: theme.typography.fonts.medium,
    fontWeight: theme.typography.weights.medium,
  },

  icon: {
    marginRight: theme.spacing.xs,
  },

  // Sizes
  size_xs: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    minHeight: 16,
  },
  size_sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    minHeight: 20,
  },
  size_md: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: 24,
  },
  size_lg: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 32,
  },

  text_xs: {
    fontSize: theme.typography.sizes.xxs,
  },
  text_sm: {
    fontSize: theme.typography.sizes.xs,
  },
  text_md: {
    fontSize: theme.typography.sizes.sm,
  },
  text_lg: {
    fontSize: theme.typography.sizes.base,
  },

  // Variants
  container_default: {
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  container_primary: {
    backgroundColor: theme.colors.brand.primary,
  },
  container_success: {
    backgroundColor: theme.colors.semantic.successLight,
    borderWidth: 1,
    borderColor: theme.colors.semantic.success,
  },
  container_warning: {
    backgroundColor: theme.colors.semantic.warningLight,
    borderWidth: 1,
    borderColor: theme.colors.semantic.warning,
  },
  container_error: {
    backgroundColor: theme.colors.semantic.errorLight,
    borderWidth: 1,
    borderColor: theme.colors.semantic.error,
  },
  container_info: {
    backgroundColor: theme.colors.semantic.infoLight,
    borderWidth: 1,
    borderColor: theme.colors.semantic.info,
  },
  container_gradient: {
    overflow: 'hidden',
  },

  text_default: {
    color: theme.colors.text.secondary,
  },
  text_primary: {
    color: theme.colors.text.inverse,
  },
  text_success: {
    color: theme.colors.semantic.success,
  },
  text_warning: {
    color: theme.colors.semantic.warning,
  },
  text_error: {
    color: theme.colors.semantic.error,
  },
  text_info: {
    color: theme.colors.semantic.info,
  },
  text_gradient: {
    color: theme.colors.text.inverse,
  },

  rounded: {
    borderRadius: theme.radius.full,
  },

  dot: {
    width: 8,
    height: 8,
    padding: 0,
    minHeight: 8,
    borderRadius: theme.radius.full,
  },

  // Group
  group: {
    flexWrap: 'wrap',
  },
  groupHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupVertical: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  groupSpacing_xs: {
    gap: theme.spacing.xs,
  },
  groupSpacing_sm: {
    gap: theme.spacing.sm,
  },
  groupSpacing_md: {
    gap: theme.spacing.md,
  },
});

export default Badge;