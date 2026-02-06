import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, spacing, borderRadius, shadows } from '../../../shared/design/tokens';

const { width: screenWidth } = Dimensions.get('window');

interface PremiumCardProps {
  children: ReactNode;
  variant?: 'default' | 'gradient' | 'glass' | 'glow' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onPress?: () => void;
  style?: ViewStyle;
  animated?: boolean;
  delay?: number;
}

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  onPress,
  style,
  animated = true,
  delay = 0,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(animated ? 0 : 1);
  const translateY = useSharedValue(animated ? 20 : 0);

  React.useEffect(() => {
    if (animated) {
      opacity.value = withTiming(1, { duration: 500 });
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 100,
      });
    }
  }, []);

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
    if (onPress) {
      runOnJS(onPress)();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const paddingStyles = {
    none: 0,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
  };

  const renderCardContent = () => {
    const content = (
      <View style={{ padding: paddingStyles[padding] }}>
        {children}
      </View>
    );

    switch (variant) {
      case 'gradient':
        return (
          <LinearGradient
            colors={[colors.primary[500], colors.secondary[500]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, style]}
          >
            {content}
          </LinearGradient>
        );

      case 'glass':
        return (
          <BlurView
            intensity={80}
            tint="light"
            style={[styles.card, styles.glassCard, style]}
          >
            {content}
          </BlurView>
        );

      case 'glow':
        return (
          <View style={[styles.card, styles.glowCard, style]}>
            <View style={styles.glowEffect} />
            {content}
          </View>
        );

      case 'elevated':
        return (
          <View style={[styles.card, styles.elevatedCard, style]}>
            {content}
          </View>
        );

      default:
        return (
          <View style={[styles.card, styles.defaultCard, style]}>
            {content}
          </View>
        );
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View style={animatedStyle}>
          {renderCardContent()}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={animatedStyle}>
      {renderCardContent()}
    </Animated.View>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: ReactNode;
  color?: string;
  loading?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon,
  color = colors.primary[500],
  loading = false,
}) => {
  const animatedValue = useSharedValue(0);

  React.useEffect(() => {
    animatedValue.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          animatedValue.value,
          [0, 1],
          [0.5, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
    opacity: animatedValue.value,
  }));

  const getTrendColor = () => {
    if (!change) return colors.neutral[500];
    switch (change.trend) {
      case 'up':
        return colors.success.main;
      case 'down':
        return colors.error.main;
      default:
        return colors.neutral[500];
    }
  };

  return (
    <PremiumCard variant="elevated" padding="md">
      <View style={styles.statsCardContent}>
        <View style={styles.statsCardHeader}>
          <Text style={styles.statsCardTitle}>{title}</Text>
          {icon && (
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
              {icon}
            </View>
          )}
        </View>

        {loading ? (
          <View style={styles.skeleton} />
        ) : (
          <Animated.View style={animatedStyle}>
            <Text style={styles.statsCardValue}>{value}</Text>
          </Animated.View>
        )}

        {change && !loading && (
          <View style={styles.changeContainer}>
            <Text style={[styles.changeText, { color: getTrendColor() }]}>
              {change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'}
              {' '}
              {change.value}
            </Text>
          </View>
        )}
      </View>
    </PremiumCard>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  gradient?: boolean;
  onPress?: () => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  gradient = false,
  onPress,
}) => {
  return (
    <PremiumCard
      variant={gradient ? 'gradient' : 'default'}
      onPress={onPress}
      padding="md"
    >
      <View style={styles.featureCardContent}>
        <View style={styles.featureIconContainer}>{icon}</View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
        {onPress && (
          <TouchableOpacity style={styles.featureAction} onPress={onPress}>
            <Text style={styles.featureActionText}>Learn More →</Text>
          </TouchableOpacity>
        )}
      </View>
    </PremiumCard>
  );
};

// Player Card Component
interface PlayerCardProps {
  name: string;
  position: string;
  club: string;
  rating: number;
  image?: string;
  onPress?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  position,
  club,
  rating,
  image,
  onPress,
}) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    if (onPress) {
      runOnJS(onPress)();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
      <Animated.View style={animatedStyle}>
        <PremiumCard variant="elevated" padding="md">
          <View style={styles.playerCardContent}>
            <View style={styles.playerImageContainer}>
              {/* Player image placeholder */}
              <View style={styles.playerImagePlaceholder}>
                <Text style={styles.playerInitials}>
                  {name.split(' ').map((n) => n[0]).join('')}
                </Text>
              </View>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>{name}</Text>
              <Text style={styles.playerPosition}>{position} • {club}</Text>
              <View style={styles.ratingContainer}>
                <LinearGradient
                  colors={[colors.primary[500], colors.secondary[500]]}
                  style={styles.ratingBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                </LinearGradient>
              </View>
            </View>
          </View>
        </PremiumCard>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  defaultCard: {
    backgroundColor: colors.neutral[0],
    ...shadows.md,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  glowCard: {
    backgroundColor: colors.neutral[0],
    ...shadows.lg,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary[500],
    opacity: 0.1,
  },
  elevatedCard: {
    backgroundColor: colors.neutral[0],
    ...shadows.xl,
  },

  // Stats Card Styles
  statsCardContent: {
    minHeight: 100,
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  statsCardTitle: {
    fontSize: 14,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  statsCardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral[900],
    marginVertical: spacing.xs,
  },
  iconContainer: {
    padding: spacing.sm,
    borderRadius: borderRadius.base,
  },
  changeContainer: {
    marginTop: spacing.xs,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  skeleton: {
    height: 32,
    width: 80,
    backgroundColor: colors.neutral[200],
    borderRadius: borderRadius.base,
    marginVertical: spacing.xs,
  },

  // Feature Card Styles
  featureCardContent: {
    alignItems: 'flex-start',
  },
  featureIconContainer: {
    padding: spacing.sm,
    backgroundColor: `${colors.primary[500]}15`,
    borderRadius: borderRadius.base,
    marginBottom: spacing.md,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  featureAction: {
    marginTop: spacing.md,
  },
  featureActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary[600],
  },

  // Player Card Styles
  playerCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerImageContainer: {
    marginRight: spacing.md,
  },
  playerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary[500]}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerInitials: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primary[600],
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
    marginBottom: spacing.xxs,
  },
  playerPosition: {
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: spacing.xs,
  },
  ratingContainer: {
    marginTop: spacing.xs,
  },
  ratingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.neutral[0],
  },
});

export default PremiumCard;