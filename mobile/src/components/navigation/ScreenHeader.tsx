/**
 * SCREEN HEADER COMPONENT
 * Reusable header with iOS-style back button
 *
 * Features:
 * - Elegant back button with haptic feedback
 * - Optional title
 * - Optional right actions
 * - SafeArea compatible
 * - Blur background effect
 * - Arcane design system
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { tokens } from '../../design/tokens';
import { typographyPresets as typography } from '../../design/typography';

interface ScreenHeaderProps {
  /**
   * Title to display in the header
   */
  title?: string;

  /**
   * Optional subtitle below the title
   */
  subtitle?: string;

  /**
   * Show back button (default: true)
   */
  showBackButton?: boolean;

  /**
   * Custom back button handler
   */
  onBackPress?: () => void;

  /**
   * Right side actions
   */
  rightActions?: React.ReactNode;

  /**
   * Use blur background (default: true)
   */
  blur?: boolean;

  /**
   * Background color (if not using blur)
   */
  backgroundColor?: string;

  /**
   * Border bottom (default: true)
   */
  borderBottom?: boolean;

  /**
   * Large title style (default: false)
   */
  largeTitle?: boolean;

  /**
   * Compact height and tighter spacing (default: false)
   */
  compact?: boolean;
  /**
   * Safe area edges for the header container.
   */
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
  /**
   * Optional manual top offset added to safe-area container.
   * Useful to fine-tune iOS header placement.
   */
  safeAreaTopOffset?: number;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBackButton = true,
  onBackPress,
  rightActions,
  blur = true,
  backgroundColor = tokens.colors.arcane.black,
  borderBottom = true,
  largeTitle = false,
  compact = false,
  safeAreaEdges = ['top'],
  safeAreaTopOffset,
}) => {
  const navigation = useNavigation();

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const HeaderContent = (
    <View
      style={[
        styles.container,
        compact ? styles.containerCompact : styles.containerRegular,
        borderBottom && styles.containerWithBorder,
        !blur && { backgroundColor },
      ]}
    >
      {/* Left side - Back button */}
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity
            onPress={handleBackPress}
            style={styles.backButton}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <View style={styles.backButtonContent}>
              <Ionicons
                name="chevron-back"
                size={28}
                color={tokens.colors.yellow.DEFAULT}
              />
              <Text style={styles.backButtonText}>Back</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Center - Title */}
      <View style={styles.centerSection}>
        {title && (
          <View style={styles.centerTextStack}>
            <Text
              style={[
                largeTitle ? styles.titleLarge : styles.title,
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        )}
      </View>

      {/* Right side - Actions */}
      <View style={styles.rightSection}>
        {rightActions}
      </View>
    </View>
  );

  if (blur) {
    const safeAreaStyle = [styles.safeArea];
    if (typeof safeAreaTopOffset === 'number' && !Number.isNaN(safeAreaTopOffset)) {
      safeAreaStyle.push({ paddingTop: safeAreaTopOffset });
    }

  return (
    <SafeAreaView edges={safeAreaEdges} style={safeAreaStyle}>
      <BlurView
        intensity={80}
        tint="dark"
        style={[styles.blurContainer, borderBottom && styles.containerWithBorder]}
      >
        {HeaderContent}
      </BlurView>
    </SafeAreaView>
  );
  }

  const safeAreaStyle = [styles.safeArea];
  if (typeof safeAreaTopOffset === 'number' && !Number.isNaN(safeAreaTopOffset)) {
    safeAreaStyle.push({ paddingTop: safeAreaTopOffset });
  }

  return (
    <SafeAreaView edges={safeAreaEdges} style={safeAreaStyle}>
      {HeaderContent}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  blurContainer: {
    overflow: 'hidden',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  containerRegular: {
    paddingVertical: 12,
    minHeight: 56,
  },
  containerCompact: {
    paddingVertical: 8,
    minHeight: 48,
  },
  containerWithBorder: {
    borderBottomWidth: 0.5,
    borderBottomColor: tokens.colors.arcane.slate + '60',
  },
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  centerSection: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTextStack: {
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginLeft: -8,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButtonText: {
    ...typography.bodyBase,
    color: tokens.colors.yellow.DEFAULT,
    fontWeight: tokens.fontWeight.semibold,
    fontSize: 17,
  },
  title: {
    ...typography.heading4,
    color: tokens.colors.gray[50],
    fontWeight: tokens.fontWeight.bold,
    fontSize: 17,
    letterSpacing: -0.3,
  },
  titleLarge: {
    ...typography.heading2,
    color: tokens.colors.gray[50],
    fontWeight: tokens.fontWeight.black,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 2,
    ...typography.caption,
    color: tokens.colors.gray[400],
    fontWeight: tokens.fontWeight.medium,
    fontSize: 12,
  },
});
