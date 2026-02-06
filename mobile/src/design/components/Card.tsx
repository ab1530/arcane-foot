import React from 'react';
import {
  View,
  ViewProps,
  StyleSheet,
  Pressable,
  PressableProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';


const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface CardProps extends PressableProps {
  variant?: 'default' | 'glass' | 'gradient' | 'outlined' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  glowOnPress?: boolean;
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  size = 'md',
  animated = true,
  glowOnPress = false,
  children,
  style,
  contentStyle,
  onPress,
  ...props
}) => {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);

  const handlePressIn = () => {
    if (animated && onPress) {
      scale.value = withSpring(0.98, theme.animations.springs.stiff);
      if (glowOnPress) {
        glow.value = withSpring(1, theme.animations.springs.gentle);
      }
    }
  };

  const handlePressOut = () => {
    if (animated && onPress) {
      scale.value = withSpring(1, theme.animations.springs.bouncy);
      if (glowOnPress) {
        glow.value = withSpring(0, theme.animations.springs.gentle);
      }
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      glow.value,
      [0, 1],
      [0, 0.6],
      Extrapolate.CLAMP
    ),
    shadowRadius: interpolate(
      glow.value,
      [0, 1],
      [0, 30],
      Extrapolate.CLAMP
    ),
  }));

  const containerStyle = [
    styles.container,
    styles[`size_${size}`],
    variant === 'glass' && styles.glass,
    variant === 'outlined' && styles.outlined,
    variant === 'ghost' && styles.ghost,
    glowOnPress && styles.glowBase,
    animated && animatedStyle,
    glowOnPress && glowStyle,
    style,
  ];

  const innerContent = (
    <View style={[styles.content, contentStyle]}>
      {children}
    </View>
  );

  if (variant === 'gradient') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={containerStyle}
        {...props}
      >
        <AnimatedLinearGradient
          colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, styles[`size_${size}`]]}
        >
          {innerContent}
        </AnimatedLinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={containerStyle}
      {...props}
    >
      {innerContent}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.elevated,
    borderRadius: 16,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  glass: {
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backdropFilter: 'blur(20px)',
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    shadowOpacity: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    shadowOpacity: 0,
  },
  gradient: {
    flex: 1,
    borderRadius: 16,
  },
  glowBase: {
    shadowColor: theme.colors.brand.primary,
  },
  content: {
    flex: 1,
  },
  size_sm: {
    padding: 8,
  },
  size_md: {
    padding: 24,
  },
  size_lg: {
    padding: 32,
  },
});

export default Card;