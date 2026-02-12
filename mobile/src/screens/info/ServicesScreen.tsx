/**
 * Services Screen
 * Displays available services and features
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';

const SERVICES: Array<{icon: IconName; title: string; description: string; tier: string; features: string[]}> = [
  {
    icon: 'ai',
    title: 'ArkaneIndex™',
    description: 'AI-powered player rating system with comprehensive performance analysis',
    tier: 'GOLD',
    features: ['Real-time player ratings', 'Historical performance tracking', 'Comparative analytics', 'Predictive insights'],
  },
  {
    icon: 'chat',
    title: 'ArkaneGPT',
    description: 'AI assistant for scouting insights and player recommendations',
    tier: 'BASIC',
    features: ['Natural language queries', 'Player comparisons', 'Tactical analysis', 'Market insights'],
  },
  {
    icon: 'analytics',
    title: 'Scouting Reports',
    description: 'Comprehensive player evaluation and reporting system',
    tier: 'BASIC',
    features: ['Detailed player profiles', 'Video analysis integration', 'Custom templates', 'Export & sharing'],
  },
  {
    icon: 'search',
    title: 'AI Matchmaking',
    description: 'Smart player-club matching based on skills, preferences, and opportunities',
    tier: 'PRO',
    features: ['Intelligent matching algorithm', 'Opportunity discovery', 'Success probability scores', 'Automated recommendations'],
  },
  {
    icon: 'calendar',
    title: 'Event Management',
    description: 'Organize and manage football camps, showcases, and tryouts',
    tier: 'FREE',
    features: ['Camp creation & management', 'Registration system', 'Participant tracking', 'Performance monitoring'],
  },
  {
    icon: 'clipboard',
    title: 'Kanban Board',
    description: 'Visual pipeline for managing player recruitment and transfers',
    tier: 'PRO',
    features: ['Drag & drop interface', 'Custom workflows', 'Team collaboration', 'Activity tracking'],
  },
  {
    icon: 'trending',
    title: 'Analytics Dashboard',
    description: 'Comprehensive analytics and insights for scouts and agencies',
    tier: 'BASIC',
    features: ['Performance metrics', 'Trend analysis', 'Custom reports', 'Data visualization'],
  },
  {
    icon: 'trophy',
    title: 'Player Passport',
    description: 'Digital player profiles with verified credentials and achievements',
    tier: 'FREE',
    features: ['Verified profiles', 'Achievement tracking', 'QR code sharing', 'Career timeline'],
  },
];

const TIER_COLORS: Record<string, string> = {
  FREE: colors.text.secondary,
  BASIC: colors.semantic.info,
  PRO: colors.brand.primary,
  GOLD: '#FFD700',
};

export default function ServicesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Our Services</Text>
          <Text style={styles.subtitle}>
            Powerful tools and features to revolutionize your football scouting
          </Text>
        </View>

        <View style={styles.servicesGrid}>
          {SERVICES.map((service, index) => (
            <GlassCard key={index} variant="elevated" style={styles.serviceCard}>
              <View style={styles.serviceHeader}>
                <Icon name={service.icon} size={40} color={colors.brand.primary} />
                <View style={[styles.tierBadge, { backgroundColor: TIER_COLORS[service.tier] + '20', borderColor: TIER_COLORS[service.tier] }]}>
                  <Text style={[styles.tierBadgeText, { color: TIER_COLORS[service.tier] }]}>
                    {service.tier}
                  </Text>
                </View>
              </View>

              <Text style={styles.serviceTitle}>{service.title}</Text>
              <Text style={styles.serviceDescription}>{service.description}</Text>

              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Features:</Text>
                {service.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Icon name="checkmark" size={14} color={colors.semantic.success} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          ))}
        </View>

        <GlassCard variant="elevated" style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Ready to Get Started?</Text>
          <Text style={styles.ctaText}>
            Explore our subscription plans to unlock the full power of ARCANE Football's AI-driven scouting platform.
          </Text>
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('Membership')}
          >
            <Text style={styles.ctaButtonText}>View Pricing Plans</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  servicesGrid: {
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  serviceCard: {
    padding: spacing.lg,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tierBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: 'bold',
  },
  serviceTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  serviceDescription: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  featuresContainer: {
    marginTop: spacing.sm,
  },
  featuresTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  featureText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  ctaCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  ctaText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  ctaButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
});
