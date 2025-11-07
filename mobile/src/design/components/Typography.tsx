import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface TextProps extends RNTextProps {
  variant?: 'display1' | 'display2' | 'display3' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    | 'body' | 'body-lg' | 'body-sm' | 'caption' | 'overline';
  color?: keyof typeof theme.colors.text | string;
  weight?: keyof typeof theme.typography.weights;
  align?: 'left' | 'center' | 'right' | 'justify';
  animated?: boolean;
  gradient?: boolean;
  gradientColors?: string[];
  style?: any;
}

export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color = 'primary',
  weight,
  align,
  animated = false,
  gradient = false,
  gradientColors = [theme.colors.brand.primary, theme.colors.brand.accent],
  style,
  children,
  ...props
}) => {
  const getTextColor = () => {
    if (color in theme.colors.text) {
      return theme.colors.text[color as keyof typeof theme.colors.text];
    }
    return color;
  };

  const textStyle = [
    styles.base,
    styles[variant],
    weight && { fontWeight: theme.typography.weights[weight] },
    align && { textAlign: align },
    { color: getTextColor() },
    style,
  ];

  if (gradient) {
    // For gradient text, we'd need a more complex implementation
    // For now, we'll use the primary color
    return (
      <RNText style={[textStyle, { color: theme.colors.brand.primary }]} {...props}>
        {children}
      </RNText>
    );
  }

  if (animated) {
    return (
      <Animated.Text style={textStyle} {...props}>
        {children}
      </Animated.Text>
    );
  }

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

export const Heading: React.FC<TextProps> = (props) => (
  <Text weight="bold" {...props} />
);

export const Display: React.FC<TextProps> = (props) => (
  <Text variant="display1" weight="black" {...props} />
);

export const Caption: React.FC<TextProps> = (props) => (
  <Text variant="caption" color="secondary" {...props} />
);

export const Label: React.FC<TextProps> = (props) => (
  <Text variant="overline" weight="semiBold" color="tertiary" {...props} />
);

const styles = StyleSheet.create({
  base: {
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },

  // Display variants
  display1: {
    fontSize: theme.typography.sizes.display1,
    lineHeight: theme.typography.sizes.display1 * theme.typography.lineHeights.tight,
    fontWeight: theme.typography.weights.black,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  display2: {
    fontSize: theme.typography.sizes.display2,
    lineHeight: theme.typography.sizes.display2 * theme.typography.lineHeights.tight,
    fontWeight: theme.typography.weights.bold,
    letterSpacing: theme.typography.letterSpacing.tight,
  },
  display3: {
    fontSize: theme.typography.sizes.display3,
    lineHeight: theme.typography.sizes.display3 * theme.typography.lineHeights.snug,
    fontWeight: theme.typography.weights.bold,
  },

  // Heading variants
  h1: {
    fontSize: theme.typography.sizes.h1,
    lineHeight: theme.typography.sizes.h1 * theme.typography.lineHeights.snug,
    fontWeight: theme.typography.weights.bold,
  },
  h2: {
    fontSize: theme.typography.sizes.h2,
    lineHeight: theme.typography.sizes.h2 * theme.typography.lineHeights.snug,
    fontWeight: theme.typography.weights.bold,
  },
  h3: {
    fontSize: theme.typography.sizes.h3,
    lineHeight: theme.typography.sizes.h3 * theme.typography.lineHeights.normal,
    fontWeight: theme.typography.weights.semiBold,
  },
  h4: {
    fontSize: theme.typography.sizes.h4,
    lineHeight: theme.typography.sizes.h4 * theme.typography.lineHeights.normal,
    fontWeight: theme.typography.weights.semiBold,
  },
  h5: {
    fontSize: theme.typography.sizes.h5,
    lineHeight: theme.typography.sizes.h5 * theme.typography.lineHeights.normal,
    fontWeight: theme.typography.weights.medium,
  },
  h6: {
    fontSize: theme.typography.sizes.h6,
    lineHeight: theme.typography.sizes.h6 * theme.typography.lineHeights.normal,
    fontWeight: theme.typography.weights.medium,
  },

  // Body variants
  body: {
    fontSize: theme.typography.sizes.base,
    lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.relaxed,
    fontWeight: theme.typography.weights.regular,
  },
  'body-lg': {
    fontSize: theme.typography.sizes.lg,
    lineHeight: theme.typography.sizes.lg * theme.typography.lineHeights.relaxed,
    fontWeight: theme.typography.weights.regular,
  },
  'body-sm': {
    fontSize: theme.typography.sizes.sm,
    lineHeight: theme.typography.sizes.sm * theme.typography.lineHeights.relaxed,
    fontWeight: theme.typography.weights.regular,
  },

  // Utility variants
  caption: {
    fontSize: theme.typography.sizes.caption,
    lineHeight: theme.typography.sizes.caption * theme.typography.lineHeights.normal,
    fontWeight: theme.typography.weights.regular,
  },
  overline: {
    fontSize: theme.typography.sizes.overline,
    lineHeight: theme.typography.sizes.overline * theme.typography.lineHeights.loose,
    fontWeight: theme.typography.weights.semiBold,
    letterSpacing: theme.typography.letterSpacing.wider,
    textTransform: 'uppercase',
  },
});

export default Text;