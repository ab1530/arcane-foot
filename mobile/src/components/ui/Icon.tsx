/**
 * Icon Component - Type-safe wrapper for Ionicons
 * Provides consistent icon usage across the app
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleProp, ViewStyle } from 'react-native';
import { ICONS, IconName, ICON_SIZES, IconSize } from '../../constants/icons';
import { colors } from '../../design/theme';

interface IconProps {
  /**
   * Semantic icon name from ICONS constant
   */
  name: IconName;

  /**
   * Icon size - follows iOS HIG
   * @default 'md'
   */
  size?: IconSize | number;

  /**
   * Icon color
   * @default colors.text.primary
   */
  color?: string;

  /**
   * Additional styles
   */
  style?: StyleProp<ViewStyle>;
}

/**
 * Type-safe Icon component using Ionicons
 *
 * @example
 * <Icon name="home" size="lg" color={colors.brand.primary} />
 * <Icon name="search" size={24} />
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = colors.text.primary,
  style,
}) => {
  const iconName = ICONS[name];
  const iconSize = typeof size === 'number' ? size : ICON_SIZES[size];

  return (
    <Ionicons
      // @ts-ignore - Ionicons types are complex
      name={iconName}
      size={iconSize}
      color={color}
      style={style}
    />
  );
};

/**
 * Convenience component for tab bar icons
 */
interface TabIconProps {
  name: IconName;
  focused: boolean;
  color: string;
  size?: number;
}

export const TabIcon: React.FC<TabIconProps> = ({
  name,
  focused,
  color,
  size = 24,
}) => {
  // Use outline version when not focused, solid when focused
  const iconName = focused ? ICONS[name] : ICONS[`${name}Outline` as IconName] || ICONS[name];

  return (
    <Ionicons
      // @ts-ignore
      name={iconName}
      size={size}
      color={color}
    />
  );
};

export default Icon;
