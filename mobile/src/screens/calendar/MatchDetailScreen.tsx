import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ScreenHeader } from '../../components/navigation';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { Icon } from '../../components/ui';
import type { IconName } from '../../constants/icons';
import type { AppStackParamList } from '../../types/navigation';
import type { CalendarMatch } from '../../types/calendar';

type MatchDetailRouteProp = RouteProp<AppStackParamList, 'MatchDetail'>;

const DetailRow = ({
  icon,
  label,
  value,
}: {
  icon: IconName;
  label: string;
  value: string;
}) => (
  <View style={styles.detailRow}>
    <View style={styles.detailIcon}>
      <Icon name={icon} size={18} color={colors.brand.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  </View>
);

const AssignmentRow = ({ assignment }: { assignment: NonNullable<CalendarMatch['assignments']>[number] }) => {
  const initials = `${assignment.scout?.firstName?.[0] ?? ''}${assignment.scout?.lastName?.[0] ?? ''}`.toUpperCase() || 'SC';

  return (
    <View style={styles.assignmentRow}>
      <View style={styles.assignmentAvatar}>
        <Text style={styles.assignmentAvatarText}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.assignmentName}>
          {assignment.scout?.firstName} {assignment.scout?.lastName}
        </Text>
        <Text style={styles.assignmentMeta}>Scout assigné</Text>
      </View>
      <Icon name="chevronForward" size={16} color={colors.text.secondary} />
    </View>
  );
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const renderLargeBadge = (logo?: string | null) => {
  if (!logo) {
    return (
      <View style={styles.largeBadgePlaceholder}>
        <Icon name='football' size={20} color={colors.text.secondary} />
      </View>
    );
  }

  return <Image source={{ uri: logo }} style={styles.largeBadgeImage} />;
};

export const MatchDetailScreen = () => {
  const { params } = useRoute<MatchDetailRouteProp>();
  const match = params?.match as CalendarMatch | undefined;

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Match" />
        <View style={styles.fallbackContainer}>
          <Icon name="alert" size={48} color={colors.text.secondary} />
          <Text style={styles.fallbackText}>Aucune donnée de match disponible.</Text>
          <Text style={styles.fallbackSubtext}>
            Veuillez revenir en arrière et sélectionner une rencontre.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const dateLabel = formatDate(match.date);
  const timeLabel = formatTime(match.date);
  const venueLabel = match.venue
    ? `${match.venue.name}${match.venue.city ? ` • ${match.venue.city}` : ''}`
    : 'À confirmer';
  const statusLabel = (match.status ?? 'SCHEDULED').replace(/_/g, ' ');
  const assignments = match.assignments ?? [];

  const detailRows: Array<{ icon: IconName; label: string; value: string }> = [
    { icon: 'calendar', label: 'Date', value: dateLabel },
    { icon: 'time', label: 'Heure', value: timeLabel },
    { icon: 'trophy', label: 'Compétition', value: match.competition?.name ?? 'À confirmer' },
    { icon: 'location', label: 'Stade', value: venueLabel },
    { icon: 'shield', label: 'Statut', value: statusLabel },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Détails du match" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#1E1B4B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <Text style={styles.heroEyebrow}>Rencontre programmée</Text>

          {match.competition && (
            <View style={styles.leagueChip}>
              {renderLargeBadge(match.competition.logo)}
              <Text style={styles.leagueChipText} numberOfLines={1}>
                {match.competition.name}
              </Text>
            </View>
          )}

          <View style={styles.heroTeamsRow}>
            <View style={styles.teamColumn}>
              {renderLargeBadge(match.homeClub?.logo)}
              <Text style={styles.teamName} numberOfLines={1}>
                {match.homeClub?.name ?? 'À déterminer'}
              </Text>
            </View>

            <View style={styles.scoreColumn}>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>{match.homeScore ?? '-'}</Text>
                <Text style={styles.scoreDivider}>:</Text>
                <Text style={styles.scoreText}>{match.awayScore ?? '-'}</Text>
              </View>
              <Text style={styles.scoreStatus}>{statusLabel}</Text>
            </View>

            <View style={styles.teamColumn}>
              {renderLargeBadge(match.awayClub?.logo)}
              <Text style={styles.teamName} numberOfLines={1}>
                {match.awayClub?.name ?? 'À déterminer'}
              </Text>
            </View>
          </View>

          <Text style={styles.heroDate}>{dateLabel}</Text>
          <Text style={styles.heroTime}>{timeLabel}</Text>
        </LinearGradient>

        <GlassCard variant="elevated" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Informations</Text>
          {detailRows.map((row) => (
            <DetailRow key={row.label} icon={row.icon} label={row.label} value={row.value} />
          ))}
        </GlassCard>

        <GlassCard variant="elevated" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Scouts assignés</Text>
          {assignments.length === 0 && (
            <Text style={styles.emptyState}>Aucun scout n'est assigné pour ce match.</Text>
          )}
          {assignments.map((assignment) => (
            <AssignmentRow key={assignment.scoutId} assignment={assignment} />
          ))}
        </GlassCard>

        {match.notes && (
          <GlassCard variant="elevated" style={styles.infoCard}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{match.notes}</Text>
          </GlassCard>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default MatchDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: 32,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  heroEyebrow: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTeamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  teamColumn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  scoreColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  scoreText: {
    fontSize: 32,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  scoreDivider: {
    fontSize: 24,
    color: colors.text.secondary,
  },
  scoreStatus: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  teamName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  heroDate: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  heroTime: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  leagueChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    backgroundColor: 'rgba(15,23,42,0.6)',
  },
  leagueChipText: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  infoCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  detailIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailValue: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  assignmentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assignmentAvatarText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  assignmentName: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  assignmentMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyState: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  notesText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    lineHeight: 22,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  fallbackText: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  fallbackSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  largeBadgePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface.glass,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBadgeImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
});
