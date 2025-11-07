import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import api from '../../services/api';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';

const { width } = Dimensions.get('window');

export const PlayerDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchPlayerDetails();
  }, [id]);

  const fetchPlayerDetails = async () => {
    try {
      const data = await api.getPlayer(id);
      setPlayer(data);
    } catch (error) {
      console.error('Error fetching player:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'stats', label: 'Stats' },
    { id: 'reports', label: 'Reports' },
  ];

  const StatBar = ({ label, value }: any) => (
    <View style={styles.statBar}>
      <View style={styles.statBarHeader}>
        <Text style={styles.statBarLabel}>{label}</Text>
        <Text style={styles.statBarValue}>{value}/100</Text>
      </View>
      <View style={styles.statBarTrack}>
        <View style={[styles.statBarFill, { width: `${value}%` }]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrowBack" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Player Details</Text>
        <TouchableOpacity style={styles.moreButton}>
          <Icon name="ellipsisVertical" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Player Header */}
        <GlassCard variant="elevated" style={styles.playerHeader}>
          <View style={styles.playerAvatar}>
            <Text style={styles.playerInitial}>
              {player?.user?.firstName?.charAt(0) || 'P'}
            </Text>
          </View>
          <Text style={styles.playerName}>
            {player?.user?.firstName} {player?.user?.lastName}
          </Text>
          <View style={styles.playerMeta}>
            <Text style={styles.playerMetaText}>{player?.position}</Text>
            <Text style={styles.playerMetaText}>•</Text>
            <Text style={styles.playerMetaText}>{player?.age} years</Text>
          </View>
          <Text style={styles.playerClub}>{player?.club?.name || 'Free Agent'}</Text>

          {player?.overallRating && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>{player.overallRating}</Text>
              <Text style={styles.ratingLabel}>Overall</Text>
            </View>
          )}
        </GlassCard>

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

        {/* Overview Tab */}
        {selectedTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Physical Info</Text>
              <GlassCard variant="elevated">
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Height</Text>
                    <Text style={styles.infoValue}>{player?.height || 'N/A'} cm</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Weight</Text>
                    <Text style={styles.infoValue}>{player?.weight || 'N/A'} kg</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Foot</Text>
                    <Text style={styles.infoValue}>{player?.preferredFoot || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Nationality</Text>
                    <Text style={styles.infoValue}>{player?.nationality || 'N/A'}</Text>
                  </View>
                </View>
              </GlassCard>
            </View>

            {/* Bio */}
            {player?.bio && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Biography</Text>
                <GlassCard variant="elevated">
                  <View style={styles.bioContainer}>
                    <Text style={styles.bioText}>{player.bio}</Text>
                  </View>
                </GlassCard>
              </View>
            )}
          </>
        )}

        {/* Stats Tab */}
        {selectedTab === 'stats' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Ratings</Text>
            <GlassCard variant="elevated">
              <View style={styles.statsContainer}>
                <StatBar label="Technical" value={player?.technicalRating || 0} />
                <StatBar label="Physical" value={player?.physicalRating || 0} />
                <StatBar label="Mental" value={player?.mentalRating || 0} />
                <StatBar label="Tactical" value={player?.tacticalRating || 0} />
              </View>
            </GlassCard>
          </View>
        )}

        {/* Reports Tab */}
        {selectedTab === 'reports' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scouting Reports</Text>
            <GlassCard variant="elevated">
              <View style={styles.emptyState}>
                <Icon name="analytics" size={48} color={colors.text.secondary} />
                <Text style={styles.emptyText}>No reports available</Text>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('CreateReport', { playerId: id })}
          >
            <Text style={styles.actionButtonText}>Create Report</Text>
          </TouchableOpacity>
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
  moreButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
  },
  playerHeader: {
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  playerAvatar: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  playerInitial: {
    fontSize: typography.sizes.h1,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  playerName: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  playerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  playerMetaText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    marginHorizontal: spacing.xs,
  },
  playerClub: {
    fontSize: typography.sizes.base,
    color: colors.brand.primary,
    marginBottom: spacing.lg,
  },
  ratingBadge: {
    backgroundColor: colors.surface.glassLight,
    borderWidth: 2,
    borderColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  ratingText: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.brand.primary,
  },
  ratingLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
  },
  infoItem: {
    width: '50%',
    padding: spacing.md,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  bioContainer: {
    padding: spacing.lg,
  },
  bioText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: typography.sizes.base * 1.5,
  },
  statsContainer: {
    padding: spacing.lg,
  },
  statBar: {
    marginBottom: spacing.lg,
  },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statBarLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  statBarValue: {
    fontSize: typography.sizes.base,
    color: colors.brand.primary,
    fontWeight: 'bold',
  },
  statBarTrack: {
    height: 8,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
  },
  actionsContainer: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  actionButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
});
