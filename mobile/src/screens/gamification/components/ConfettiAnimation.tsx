/**
 * CONFETTI ANIMATION COMPONENT
 * Celebration animation using Lottie or custom implementation
 * Triggers on achievements, level-ups, and challenge completions
 *
 * @version 1.0.0
 * @date 2025-11-11
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { tokens } from '../../../design';

// ============================================================================
// TYPES
// ============================================================================

export interface ConfettiAnimationProps {
  visible: boolean;
  onComplete?: () => void;
  duration?: number;
  colors?: string[];
}

// ============================================================================
// CONFETTI PARTICLE
// ============================================================================

interface ConfettiParticle {
  id: number;
  color: string;
  x: number;
  y: number;
  rotation: number;
  size: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const DEFAULT_COLORS = [
  tokens.colors.yellow.DEFAULT,
  tokens.colors.semantic.success,
  tokens.colors.semantic.info,
  tokens.colors.feature.ai,
  tokens.colors.feature.gamification,
];

// ============================================================================
// COMPONENT
// ============================================================================

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  visible,
  onComplete,
  duration = 3000,
  colors = DEFAULT_COLORS,
}) => {
  const particles = useRef<ConfettiParticle[]>([]);

  useEffect(() => {
    if (visible) {
      // Generate random confetti particles
      particles.current = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        color: colors[Math.floor(Math.random() * colors.length)],
        x: Math.random() * SCREEN_WIDTH,
        y: -20 - Math.random() * 100,
        rotation: Math.random() * 360,
        size: 8 + Math.random() * 8,
      }));

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle) => (
        <ConfettiPiece key={particle.id} particle={particle} duration={duration} />
      ))}
    </View>
  );
};

// ============================================================================
// CONFETTI PIECE SUB-COMPONENT
// ============================================================================

interface ConfettiPieceProps {
  particle: ConfettiParticle;
  duration: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ particle, duration }) => {
  const translateY = useSharedValue(particle.y);
  const translateX = useSharedValue(particle.x);
  const rotate = useSharedValue(particle.rotation);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Falling animation
    translateY.value = withTiming(SCREEN_HEIGHT + 100, {
      duration: duration + Math.random() * 1000,
      easing: Easing.out(Easing.cubic),
    });

    // Horizontal drift
    const drift = (Math.random() - 0.5) * 100;
    translateX.value = withTiming(particle.x + drift, {
      duration: duration,
      easing: Easing.inOut(Easing.ease),
    });

    // Rotation animation
    rotate.value = withRepeat(
      withTiming(particle.rotation + 360, {
        duration: 1000 + Math.random() * 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Fade out near the end
    setTimeout(() => {
      opacity.value = withTiming(0, { duration: 500 });
    }, duration - 500);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate.value}deg` },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          backgroundColor: particle.color,
          width: particle.size,
          height: particle.size,
        },
        animatedStyle,
      ]}
    />
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 2,
  },
});

// ============================================================================
// ALTERNATIVE: LOTTIE IMPLEMENTATION (commented out)
// ============================================================================

/*
import LottieView from 'lottie-react-native';

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  visible,
  onComplete,
  duration = 3000,
}) => {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (visible && lottieRef.current) {
      lottieRef.current.play();

      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, duration);
    }
  }, [visible, duration, onComplete]);

  if (!visible) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <LottieView
        ref={lottieRef}
        source={require('../../../assets/animations/confetti.json')}
        autoPlay={false}
        loop={false}
        style={styles.lottie}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  lottie: {
    width: '100%',
    height: '100%',
  },
});
*/
