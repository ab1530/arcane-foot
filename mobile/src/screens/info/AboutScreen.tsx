/**
 * About Screen
 * Information about ARCANE Football
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography } from '../../design/theme';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';

export default function AboutScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Icon name="flash" size={64} color={colors.brand.primary} />
          <Text style={styles.title}>ARCANE Football</Text>
          <Text style={styles.subtitle}>AI-Powered Scouting Platform</Text>
        </View>

        <GlassCard variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.text}>
            ARCANE Football revolutionizes football scouting with cutting-edge AI technology.
            We empower scouts, agents, and clubs to discover, analyze, and manage talent more
            efficiently than ever before.
          </Text>
        </GlassCard>

        <GlassCard variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.featuresList}>
            <FeatureItem icon="ai" title="AI-Powered Analytics" description="Advanced player evaluation with ArkaneIndex™" />
            <FeatureItem icon="analytics" title="Comprehensive Reports" description="Detailed scouting reports with video analysis" />
            <FeatureItem icon="search" title="Smart Matchmaking" description="Connect players with the right opportunities" />
            <FeatureItem icon="calendar" title="Event Management" description="Organize camps, showcases, and tryouts" />
          </View>
        </GlassCard>

        <GlassCard variant="elevated" style={styles.section}>
          <Text style={styles.sectionTitle}>Our Values</Text>
          <Text style={styles.text}>
            • Innovation: Pushing boundaries with AI technology{'\n'}
            • Integrity: Fair and transparent talent evaluation{'\n'}
            • Excellence: Highest standards in scouting{'\n'}
            • Community: Supporting football development worldwide
          </Text>
        </GlassCard>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2025 ARCANE Football GmbH</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const FeatureItem = ({ icon, title, description }: { icon: IconName; title: string; description: string }) => (
  <View style={styles.featureItem}>
    <Icon name={icon} size={32} color={colors.brand.primary} />
    <View style={styles.featureContent}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.brand.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  section: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  text: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 24,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  featureDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  version: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  copyright: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
