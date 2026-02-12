/**
 * GradientText Component - Text with gradient colors for Arcane branding
 * Provides premium gradient text effects following the Arcane design system
 */

import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography } from '../../design/theme';

interface GradientTextProps {
  /**
   * Text content
   */
  children: React.ReactNode;

  /**
   * Gradient colors
   * @default Arcane gradient (accent to purple)
   */
  colors?: string[];

  /**
   * Gradient start point
   * @default { x: 0, y: 0 }
   */
  start?: { x: number; y: number };

  /**
   * Gradient end point
   * @default { x: 1, y: 0 }
   */
  end?: { x: number; y: number };

  /**
   * Text style
   */
  style?: StyleProp<TextStyle>;

  /**
   * Preset gradient variants
   */
  variant?: 'arcane' | 'gold' | 'fire' | 'ocean' | 'sunset';
}

const GRADIENT_PRESETS = {
  arcane: {
    colors: [colors.brand.primary, '#9333EA', '#7C3AED'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  gold: {
    colors: ['#FFD700', '#FFA500', '#FF8C00'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
  fire: {
    colors: ['#FF6B6B', '#EE5A6F', '#C44569'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  ocean: {
    colors: ['#667EEA', '#764BA2', '#F093FB'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
  sunset: {
    colors: ['#FA709A', '#FEE140', '#30CFD0'],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },
};

/**
 * GradientText component for premium text effects
 *
 * @example
 * <GradientText variant="arcane" style={{ fontSize: 32, fontWeight: 'bold' }}>
 *   Arcane Football
 * </GradientText>
 *
 * @example
 * <GradientText colors={['#FF0000', '#0000FF']}>
 *   Custom Gradient
 * </GradientText>
 */
export const GradientText: React.FC<GradientTextProps> = ({
  children,
  colors,
  start,
  end,
  style,
  variant = 'arcane',
}) => {
  const preset = GRADIENT_PRESETS[variant];

  const gradientColors = colors || preset.colors;
  const gradientStart = start || preset.start;
  const gradientEnd = end || preset.end;

  return (
    <MaskedView
      maskElement={
        <Text
          style={[
            {
              backgroundColor: 'transparent',
              fontFamily: typography.fonts.bold,
            },
            style,
          ]}
        >
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={gradientColors}
        start={gradientStart}
        end={gradientEnd}
        style={{ flex: 1 }}
      >
        <Text
          style={[
            {
              opacity: 0,
              fontFamily: typography.fonts.bold,
            },
            style,
          ]}
        >
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
