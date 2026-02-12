import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ImageSourcePropType,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../theme';


interface AvatarProps {
  source?: ImageSourcePropType | string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'circle' | 'rounded' | 'square';
  status?: 'online' | 'offline' | 'busy' | 'away';
  badge?: string | number;
  gradient?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name = '',
  size = 'md',
  variant = 'circle',
  status,
  badge,
  gradient = false,
  style,
}) => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const imageSource = typeof source === 'string' ? { uri: source } : source;

  const containerStyle = [
    styles.container,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    style,
  ];

  const content = imageSource ? (
    <Image
      source={imageSource}
      style={[styles.image, styles[`variant_${variant}`]]}
      resizeMode="cover"
    />
  ) : gradient ? (
    <LinearGradient
      colors={[theme.colors.brand.primary, theme.colors.brand.accent]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, styles[`variant_${variant}`]]}
    >
      <Text style={[styles.initials, styles[`initials_${size}`]]}>
        {initials}
      </Text>
    </LinearGradient>
  ) : (
    <View style={[styles.placeholder, styles[`variant_${variant}`]]}>
      <Text style={[styles.initials, styles[`initials_${size}`]]}>
        {initials}
      </Text>
    </View>
  );

  return (
    <View style={containerStyle}>
      {content}

      {status && (
        <View style={[styles.status, styles[`status_${size}`]]}>
          <View style={[styles.statusDot, styles[`statusDot_${status}`]]} />
        </View>
      )}

      {badge !== undefined && (
        <View style={[styles.badge, styles[`badge_${size}`]]}>
          <Text style={[styles.badgeText, styles[`badgeText_${size}`]]}>
            {typeof badge === 'number' && badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
};

export const AvatarGroup: React.FC<{
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarProps['size'];
  spacing?: number;
}> = ({ avatars, max = 3, size = 'md', spacing = -12 }) => {
  const displayAvatars = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <View style={styles.group}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            {
              marginLeft: index === 0 ? 0 : spacing,
              zIndex: displayAvatars.length - index,
            },
          ]}
        >
          <Avatar {...avatar} size={size} />
        </View>
      ))}
      {remaining > 0 && (
        <View
          style={[
            styles.groupItem,
            {
              marginLeft: spacing,
              zIndex: 0,
            },
          ]}
        >
          <Avatar name={`+${remaining}`} size={size} gradient />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  image: {
    width: '100%',
    height: '100%',
  },

  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },

  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  initials: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.weights.semiBold,
  },

  // Sizes
  size_xs: {
    width: 24,
    height: 24,
  },
  size_sm: {
    width: 32,
    height: 32,
  },
  size_md: {
    width: 40,
    height: 40,
  },
  size_lg: {
    width: 48,
    height: 48,
  },
  size_xl: {
    width: 64,
    height: 64,
  },
  size_2xl: {
    width: 96,
    height: 96,
  },

  initials_xs: {
    fontSize: theme.typography.sizes.xxs,
  },
  initials_sm: {
    fontSize: theme.typography.sizes.xs,
  },
  initials_md: {
    fontSize: theme.typography.sizes.sm,
  },
  initials_lg: {
    fontSize: theme.typography.sizes.base,
  },
  initials_xl: {
    fontSize: theme.typography.sizes.lg,
  },
  initials_2xl: {
    fontSize: theme.typography.sizes.h3,
  },

  // Variants
  variant_circle: {
    borderRadius: 999,
  },
  variant_rounded: {
    borderRadius: 12,
  },
  variant_square: {
    borderRadius: 0,
  },

  // Status
  status: {
    position: 'absolute',
    backgroundColor: theme.colors.background.primary,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
  },
  status_xs: {
    width: 8,
    height: 8,
    bottom: -2,
    right: -2,
  },
  status_sm: {
    width: 10,
    height: 10,
    bottom: 0,
    right: 0,
  },
  status_md: {
    width: 12,
    height: 12,
    bottom: 0,
    right: 0,
  },
  status_lg: {
    width: 14,
    height: 14,
    bottom: 0,
    right: 0,
  },
  status_xl: {
    width: 16,
    height: 16,
    bottom: 2,
    right: 2,
  },
  status_2xl: {
    width: 20,
    height: 20,
    bottom: 4,
    right: 4,
  },

  statusDot: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  statusDot_online: {
    backgroundColor: theme.colors.status.online,
  },
  statusDot_offline: {
    backgroundColor: theme.colors.status.offline,
  },
  statusDot_busy: {
    backgroundColor: theme.colors.status.busy,
  },
  statusDot_away: {
    backgroundColor: theme.colors.status.away,
  },

  // Badge
  badge: {
    position: 'absolute',
    backgroundColor: theme.colors.semantic.error,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
  },
  badge_xs: {
    minWidth: 14,
    height: 14,
    top: -4,
    right: -4,
    paddingHorizontal: 2,
  },
  badge_sm: {
    minWidth: 16,
    height: 16,
    top: -4,
    right: -4,
    paddingHorizontal: 3,
  },
  badge_md: {
    minWidth: 18,
    height: 18,
    top: -4,
    right: -4,
    paddingHorizontal: 4,
  },
  badge_lg: {
    minWidth: 20,
    height: 20,
    top: -4,
    right: -4,
    paddingHorizontal: 4,
  },
  badge_xl: {
    minWidth: 24,
    height: 24,
    top: -4,
    right: -4,
    paddingHorizontal: 5,
  },
  badge_2xl: {
    minWidth: 28,
    height: 28,
    top: -6,
    right: -6,
    paddingHorizontal: 6,
  },

  badgeText: {
    color: theme.colors.text.inverse,
    fontWeight: theme.typography.weights.bold,
  },
  badgeText_xs: {
    fontSize: 8,
  },
  badgeText_sm: {
    fontSize: 9,
  },
  badgeText_md: {
    fontSize: 10,
  },
  badgeText_lg: {
    fontSize: 11,
  },
  badgeText_xl: {
    fontSize: 12,
  },
  badgeText_2xl: {
    fontSize: 14,
  },

  // Avatar Group
  group: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupItem: {
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
    borderRadius: 999,
  },
});

export default Avatar;