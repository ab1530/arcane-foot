/**
 * RATING STARS COMPONENT
 * Displays or allows input of star ratings
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../../design';

// ============================================================================
// TYPES
// ============================================================================

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  style?: ViewStyle;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxRating = 5,
  size = 20,
  interactive = false,
  onChange,
  style,
}) => {
  const handlePress = (index: number) => {
    if (!interactive || !onChange) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(index + 1);
  };

  const renderStar = (index: number) => {
    const starValue = index + 1;
    const isFilled = rating >= starValue;
    const isHalf = rating >= starValue - 0.5 && rating < starValue;

    const StarComponent = interactive ? TouchableOpacity : View;

    return (
      <StarComponent
        key={index}
        onPress={() => handlePress(index)}
        disabled={!interactive}
        activeOpacity={0.7}
        style={styles.starButton}
      >
        {isFilled ? (
          <Star
            size={size}
            color={tokens.colors.yellow.DEFAULT}
            fill={tokens.colors.yellow.DEFAULT}
          />
        ) : isHalf ? (
          <View style={styles.halfStar}>
            <Star
              size={size}
              color={tokens.colors.yellow.DEFAULT}
              fill={tokens.colors.yellow.DEFAULT}
              style={{ position: 'absolute', left: 0 }}
            />
            <View style={[styles.halfCover, { width: size / 2, height: size }]} />
          </View>
        ) : (
          <Star
            size={size}
            color={tokens.colors.gray[500]}
            fill="transparent"
          />
        )}
      </StarComponent>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  halfStar: {
    position: 'relative',
    overflow: 'hidden',
  },
  halfCover: {
    position: 'absolute',
    right: 0,
    backgroundColor: tokens.colors.arcane.charcoal,
  },
});
