/**
 * Style Badge Component
 * Color-coded badge for playing styles
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlayStyleName } from '../../types/playstyle-dna';
import { getStyleColor, getStyleIcon, getStyleEmoji } from '../../utils/playStyleColors';

interface StyleBadgeProps {
  style: PlayStyleName;
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  showEmoji?: boolean;
  variant?: 'filled' | 'outlined' | 'ghost';
  containerStyle?: ViewStyle;
}

export const StyleBadge: React.FC<StyleBadgeProps> = ({
  style,
  size = 'medium',
  showIcon = true,
  showEmoji = false,
  variant = 'filled',
  containerStyle,
}) => {
  const styleColor = getStyleColor(style);
  const iconName = getStyleIcon(style);
  const emoji = getStyleEmoji(style);

  const sizeConfig = {
    small: {
      container: styles.containerSmall,
      text: styles.textSmall,
      icon: 12,
      padding: 6,
    },
    medium: {
      container: styles.containerMedium,
      text: styles.textMedium,
      icon: 16,
      padding: 10,
    },
    large: {
      container: styles.containerLarge,
      text: styles.textLarge,
      icon: 20,
      padding: 14,
    },
  };

  const config = sizeConfig[size];

  const variantStyle =
    variant === 'filled'
      ? {
          backgroundColor: styleColor,
          borderColor: styleColor,
          borderWidth: 0,
        }
      : variant === 'outlined'
      ? {
          backgroundColor: 'transparent',
          borderColor: styleColor,
          borderWidth: 2,
        }
      : {
          backgroundColor: `${styleColor}15`,
          borderColor: 'transparent',
          borderWidth: 0,
        };

  const textColor =
    variant === 'filled' && styleColor !== '#F3F4F6' ? '#FFFFFF' : styleColor;

  return (
    <View
      style={[
        styles.container,
        config.container,
        variantStyle,
        { paddingHorizontal: config.padding, paddingVertical: config.padding / 2 },
        containerStyle,
      ]}
    >
      {showEmoji && (
        <Text style={[config.text, { marginRight: 4 }]}>{emoji}</Text>
      )}
      {showIcon && !showEmoji && (
        <Ionicons
          name={iconName as any}
          size={config.icon}
          color={textColor}
          style={{ marginRight: 4 }}
        />
      )}
      <Text style={[config.text, { color: textColor, fontWeight: '600' }]}>
        {style}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  containerSmall: {
    borderRadius: 12,
  },
  containerMedium: {
    borderRadius: 16,
  },
  containerLarge: {
    borderRadius: 20,
  },
  textSmall: {
    fontSize: 11,
  },
  textMedium: {
    fontSize: 13,
  },
  textLarge: {
    fontSize: 15,
  },
});

export default StyleBadge;
