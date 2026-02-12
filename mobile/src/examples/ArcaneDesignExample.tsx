/**
 * ARCANE DESIGN SYSTEM 2.0 - USAGE EXAMPLE
 * Demonstrates how to use the Arcane Design System in components
 *
 * @version 2.0.0
 * @date 2025-11-11
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../contexts/ThemeContext';
import { tokens } from '../design/tokens';
import { typographyPresets as typography } from '../design/typography';

export default function ArcaneDesignExample() {
  const { colors, arcane } = useTheme();

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={typography.displayHero}>Arcane 2.0</Text>
        <Text style={[typography.bodyBase, { color: tokens.colors.gray[300] }]}>
          Design System Example
        </Text>
      </View>

      {/* Colors Section */}
      <View style={styles.section}>
        <Text style={typography.heading2}>Colors</Text>

        <View style={styles.colorGrid}>
          <View style={[styles.colorBox, { backgroundColor: tokens.colors.yellow.DEFAULT }]}>
            <Text style={[typography.caption, { color: tokens.colors.arcane.black }]}>
              Yellow
            </Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: tokens.colors.semantic.success }]}>
            <Text style={[typography.caption, { color: tokens.colors.arcane.black }]}>
              Success
            </Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: tokens.colors.semantic.info }]}>
            <Text style={typography.caption}>Info</Text>
          </View>
          <View style={[styles.colorBox, { backgroundColor: tokens.colors.semantic.warning }]}>
            <Text style={[typography.caption, { color: tokens.colors.arcane.black }]}>
              Warning
            </Text>
          </View>
        </View>
      </View>

      {/* Typography Section */}
      <View style={styles.section}>
        <Text style={typography.heading2}>Typography</Text>

        <Text style={typography.heading1}>Heading 1</Text>
        <Text style={typography.heading3}>Heading 3</Text>
        <Text style={typography.bodyLarge}>
          This is large body text with proper line height and spacing.
        </Text>
        <Text style={typography.bodyBase}>
          This is base body text for general content.
        </Text>
        <Text style={typography.bodySmall}>
          Small text for captions and secondary information.
        </Text>
        <Text style={typography.overline}>OVERLINE TEXT</Text>
      </View>

      {/* Buttons Section */}
      <View style={styles.section}>
        <Text style={typography.heading2}>Buttons</Text>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={[typography.buttonText, { color: tokens.colors.arcane.black }]}>
            Primary Button
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={[typography.buttonText, { color: tokens.colors.yellow.DEFAULT }]}>
            Secondary Button
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostButton}>
          <Text style={[typography.buttonText, { color: tokens.colors.gray[200] }]}>
            Ghost Button
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cards Section */}
      <View style={styles.section}>
        <Text style={typography.heading2}>Cards</Text>

        {/* Standard Card */}
        <View style={styles.card}>
          <Text style={typography.heading4}>Standard Card</Text>
          <Text style={[typography.bodyBase, { marginTop: 8 }]}>
            This is a standard card with the Arcane charcoal background.
          </Text>
        </View>

        {/* Glass Card */}
        <BlurView
          tint="dark"
          intensity={12}
          style={styles.glassCard}
        >
          <Text style={typography.heading4}>Glass Card</Text>
          <Text style={[typography.bodyBase, { marginTop: 8 }]}>
            This card uses glassmorphism with blur and transparency.
          </Text>
        </BlurView>

        {/* Feature Card */}
        <View style={styles.featureCard}>
          <View style={styles.featureAccent} />
          <Text style={typography.heading4}>Feature Card</Text>
          <Text style={[typography.bodyBase, { marginTop: 8 }]}>
            Card with yellow accent border for highlighting important content.
          </Text>
        </View>
      </View>

      {/* Spacing Examples */}
      <View style={styles.section}>
        <Text style={typography.heading2}>Spacing Scale</Text>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: 16 }]} />
          <Text style={typography.caption}>4px</Text>
        </View>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: 24 }]} />
          <Text style={typography.caption}>24px</Text>
        </View>
        <View style={styles.spacingDemo}>
          <View style={[styles.spacingBox, { width: 48 }]} />
          <Text style={typography.caption}>48px</Text>
        </View>
      </View>

      {/* Radius Examples */}
      <View style={styles.section}>
        <Text style={typography.heading2}>Border Radius</Text>
        <View style={styles.radiusGrid}>
          <View style={[styles.radiusBox, { borderRadius: 6 }]}>
            <Text style={typography.caption}>sm (6px)</Text>
          </View>
          <View style={[styles.radiusBox, { borderRadius: 8 }]}>
            <Text style={typography.caption}>md (8px)</Text>
          </View>
          <View style={[styles.radiusBox, { borderRadius: 12 }]}>
            <Text style={typography.caption}>lg (12px)</Text>
          </View>
          <View style={[styles.radiusBox, { borderRadius: 16 }]}>
            <Text style={typography.caption}>xl (16px)</Text>
          </View>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.section}>
        <Text style={typography.heading2}>Badges</Text>
        <View style={styles.badgeGrid}>
          <View style={[styles.badge, styles.successBadge]}>
            <Text style={[typography.badge, { color: tokens.colors.semantic.success }]}>
              Success
            </Text>
          </View>
          <View style={[styles.badge, styles.warningBadge]}>
            <Text style={[typography.badge, { color: tokens.colors.semantic.warning }]}>
              Warning
            </Text>
          </View>
          <View style={[styles.badge, styles.premiumBadge]}>
            <Text style={[typography.badge, { color: tokens.colors.yellow.DEFAULT }]}>
              Premium
            </Text>
          </View>
        </View>
      </View>

      {/* Stats Card Example */}
      <View style={styles.section}>
        <Text style={typography.heading2}>Data Visualization</Text>
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={typography.statLabel}>Goals</Text>
            <Text style={typography.statValue}>24</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={typography.statLabel}>Assists</Text>
            <Text style={typography.statValue}>12</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={typography.statLabel}>Rating</Text>
            <Text style={[typography.statValue, { color: tokens.colors.yellow.DEFAULT }]}>
              8.5
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.arcane.black,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.arcane.slate,
  },
  section: {
    padding: 24,
    gap: 16,
  },

  // Colors
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Buttons
  primaryButton: {
    backgroundColor: tokens.colors.yellow.DEFAULT,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    ...tokens.shadows.md,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: tokens.colors.arcane.slate,
    alignItems: 'center',
  },
  ghostButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },

  // Cards
  card: {
    backgroundColor: tokens.colors.arcane.charcoal,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(228, 255, 59, 0.08)',
    ...tokens.shadows.lg,
  },
  glassCard: {
    backgroundColor: 'rgba(27, 27, 31, 0.7)',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(228, 255, 59, 0.1)',
    overflow: 'hidden',
  },
  featureCard: {
    backgroundColor: tokens.colors.arcane.charcoal,
    padding: 24,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: tokens.colors.yellow.DEFAULT,
    ...tokens.shadows.lg,
  },
  featureAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    opacity: 0.5,
  },

  // Spacing
  spacingDemo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  spacingBox: {
    height: 40,
    backgroundColor: tokens.colors.yellow.DEFAULT,
    borderRadius: 6,
  },

  // Radius
  radiusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  radiusBox: {
    width: 80,
    height: 80,
    backgroundColor: tokens.colors.arcane.charcoal,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Badges
  badgeGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 9999,
  },
  successBadge: {
    backgroundColor: tokens.colors.semantic.successBg,
  },
  warningBadge: {
    backgroundColor: tokens.colors.semantic.warningBg,
  },
  premiumBadge: {
    backgroundColor: tokens.colors.yellow.dim,
  },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: tokens.colors.arcane.charcoal,
    padding: 24,
    borderRadius: 16,
    justifyContent: 'space-around',
    ...tokens.shadows.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
});
