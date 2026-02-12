import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';

export const CampsScreen = ({ navigation }: any) => {
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const tabs = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'past', label: 'Past' },
  ];

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Open':
        return styles.statusOpen;
      case 'Closed':
        return styles.statusClosed;
      case 'Full':
        return styles.statusFull;
      default:
        return styles.statusDefault;
    }
  };

  const CampCard = ({ camp }: any) => (
    <TouchableOpacity
      style={styles.campCardWrapper}
      onPress={() => navigation.navigate('CampDetail', { id: camp.id })}
    >
      <GlassCard variant="elevated">
        <View style={styles.campCard}>
          <View style={styles.campImage}>
            <Icon name="fitness" size={40} color={colors.brand.primary} />
          </View>
          <View style={styles.campContent}>
            <View style={styles.campHeader}>
              <Text style={styles.campTitle}>{camp.title}</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(camp.status)]}>
                <Text style={styles.statusText}>{camp.status}</Text>
              </View>
            </View>
            <View style={styles.campInfoRow}>
              <Icon name="location" size={16} color={colors.text.secondary} />
              <Text style={styles.campInfoText}>{camp.location}</Text>
            </View>
            <View style={styles.campInfoRow}>
              <Icon name="calendar" size={16} color={colors.text.secondary} />
              <Text style={styles.campInfoText}>{camp.date}</Text>
            </View>
            <View style={styles.campFooter}>
              <View style={styles.participantInfo}>
                <Icon name="people" size={16} color={colors.text.primary} />
                <Text style={styles.participantText}>
                  {camp.participants}/{camp.maxParticipants}
                </Text>
              </View>
              <Text style={styles.campPrice}>{camp.price}</Text>
            </View>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  const mockCamps = [
    {
      id: '1',
      title: 'Summer Training Camp 2024',
      location: 'Barcelona, Spain',
      date: 'Jul 15 - Jul 25, 2024',
      participants: 24,
      maxParticipants: 30,
      price: '€599',
      status: 'Open',
    },
    {
      id: '2',
      title: 'Elite Youth Development',
      location: 'Munich, Germany',
      date: 'Aug 1 - Aug 10, 2024',
      participants: 18,
      maxParticipants: 25,
      price: '€749',
      status: 'Open',
    },
    {
      id: '3',
      title: 'Goalkeeper Intensive',
      location: 'London, UK',
      date: 'Aug 15 - Aug 20, 2024',
      participants: 12,
      maxParticipants: 15,
      price: '€499',
      status: 'Open',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrowBack" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Training Camps</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateCamp')}
        >
          <Icon name="add" size={28} color={colors.background.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabButton,
                selectedTab === tab.id && styles.tabButtonActive,
              ]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  selectedTab === tab.id && styles.tabButtonTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Featured Camp Banner */}
        <GlassCard variant="elevated" style={styles.featuredBanner}>
          <View style={styles.featuredContent}>
            <Text style={styles.featuredLabel}>Featured</Text>
            <Text style={styles.featuredTitle}>Elite Training Camp</Text>
            <Text style={styles.featuredDescription}>
              Join our exclusive training program with professional coaches
            </Text>
            <TouchableOpacity style={styles.featuredButton}>
              <Text style={styles.featuredButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Camps List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Camps</Text>
            <Text style={styles.countBadge}>{mockCamps.length}</Text>
          </View>
          {mockCamps.map((camp) => (
            <CampCard key={camp.id} camp={camp} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.tertiary,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    borderRadius: radius.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  tabButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  tabButtonText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: colors.background.primary,
  },
  featuredBanner: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  featuredContent: {
    padding: spacing.xl,
    backgroundColor: 'rgba(228, 255, 59, 0.1)',
  },
  featuredLabel: {
    fontSize: typography.sizes.xs,
    color: colors.brand.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  featuredTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  featuredDescription: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
  featuredButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
  },
  featuredButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  countBadge: {
    fontSize: typography.sizes.sm,
    color: colors.brand.primary,
    fontWeight: 'bold',
  },
  campCardWrapper: {
    marginBottom: spacing.md,
  },
  campCard: {
    flexDirection: 'row',
    padding: spacing.md,
  },
  campImage: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  campContent: {
    flex: 1,
  },
  campHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  campTitle: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginRight: spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusOpen: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  statusFull: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  statusDefault: {
    backgroundColor: colors.surface.glassLight,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: 'bold',
    color: colors.semantic.success,
  },
  campInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs / 2,
  },
  campInfoText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  campFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface.glassLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  participantText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  campPrice: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
});
