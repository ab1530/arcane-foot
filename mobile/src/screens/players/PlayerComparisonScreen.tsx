import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useComparison } from '../../contexts/ComparisonContext';
import { usePlayers } from '../../hooks/usePlayers';
import { useTheme } from '../../contexts/ThemeContext';
import { GlassCard, GradientText, Icon } from '../../components/ui';
import { spacing, typography, radius } from '../../design/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - spacing.md * 2) / 3;

export const PlayerComparisonScreen = ({ navigation }: any) => {
  const { comparisonPlayerIds, removeFromComparison, clearComparison } = useComparison();
  const { players } = usePlayers();
  const { colors } = useTheme();

  const comparisonPlayers = useMemo(() => {
    return comparisonPlayerIds.map(id =>
      players.find(p => p.id === id)
    ).filter(Boolean);
  }, [comparisonPlayerIds, players]);

  const handleRemovePlayer = (playerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    removeFromComparison(playerId);
    if (comparisonPlayerIds.length === 1) {
      navigation.goBack();
    }
  };

  const getStatComparison = (statName: string) => {
    const values = comparisonPlayers.map(p => {
      switch (statName) {
        case 'goals': return p?.stats?.goals || 0;
        case 'assists': return p?.stats?.assists || 0;
        case 'rating': return p?.stats?.rating || p?.rating || 0;
        case 'appearances': return p?.stats?.appearances || 0;
        case 'yellowCards': return p?.stats?.yellowCards || 0;
        case 'redCards': return p?.stats?.redCards || 0;
        case 'age': return p?.age || 0;
        case 'marketValue': return p?.marketValue || 0;
        default: return 0;
      }
    });
    const maxValue = Math.max(...values);
    return { values, maxValue };
  };

  const formatValue = (value: number, type: string) => {
    if (type === 'marketValue') {
      return `€${(value / 1000000).toFixed(1)}M`;
    }
    if (type === 'rating') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  const StatRow = ({ label, statKey, unit = '' }: { label: string; statKey: string; unit?: string }) => {
    const { values, maxValue } = getStatComparison(statKey);

    return (
      <View style={styles.statRow}>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        <View style={styles.statValues}>
          {values.map((value, index) => {
            const isMax = maxValue > 0 && value === maxValue;
            return (
              <View key={index} style={[styles.statValueContainer, { width: CARD_WIDTH }]}>
                <Text style={[
                  styles.statValue,
                  { color: isMax ? colors.accent : colors.textPrimary },
                  isMax && styles.statValueBest
                ]}>
                  {formatValue(value, statKey)}{unit}
                </Text>
                {isMax && (
                  <Icon name="trophy" size={14} color={colors.accent} style={styles.trophyIcon} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (comparisonPlayers.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]} edges={['top']}>
        <LinearGradient
          colors={[colors.dark, colors.darkBg]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.emptyContainer}>
          <Icon name="compare" size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Aucun joueur à comparer</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.accent }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: colors.textInverse }]}>Retour aux joueurs</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]} edges={['top']}>
      <LinearGradient
        colors={[colors.dark, colors.darkBg]}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrowBack" size="md" color={colors.textPrimary} />
          </TouchableOpacity>

          <GradientText variant="arcane" style={styles.headerTitle}>
            Comparaison
          </GradientText>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              clearComparison();
              navigation.goBack();
            }}
          >
            <Icon name="close" size="md" color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Player Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playersContainer}
        >
          {comparisonPlayers.map((player: any, index) => (
            <GlassCard key={player.id} variant="elevated" style={[styles.playerCard, { width: CARD_WIDTH }]}>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemovePlayer(player.id)}
              >
                <Icon name="closeCircle" size={20} color={colors.error} />
              </TouchableOpacity>

              <View style={styles.playerAvatar}>
                <LinearGradient
                  colors={[colors.accent + '40', colors.accent + '10']}
                  style={styles.avatarGradient}
                >
                  <Text style={[styles.avatarText, { color: colors.accent }]}>
                    {player.firstName?.[0]}{player.lastName?.[0]}
                  </Text>
                </LinearGradient>
              </View>

              <Text style={[styles.playerName, { color: colors.textPrimary }]} numberOfLines={1}>
                {player.firstName} {player.lastName}
              </Text>
              <Text style={[styles.playerPosition, { color: colors.textSecondary }]}>{player.position}</Text>

              <View style={[styles.playerBadge, { backgroundColor: colors.glassLight }]}>
                <Text style={[styles.playerClub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {player.club?.name || 'Sans club'}
                </Text>
              </View>
            </GlassCard>
          ))}

          {comparisonPlayerIds.length < 3 && (
            <TouchableOpacity
              style={[styles.addPlayerCard, { width: CARD_WIDTH, backgroundColor: colors.glass, borderColor: colors.accent + '40' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
            >
              <Icon name="addCircle" size={40} color={colors.accent} />
              <Text style={[styles.addPlayerText, { color: colors.accent }]}>Ajouter</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Stats Comparison */}
        <GlassCard variant="elevated" style={styles.statsCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Statistiques</Text>

          <View style={styles.statsContainer}>
            <StatRow label="Buts" statKey="goals" />
            <StatRow label="Passes" statKey="assists" />
            <StatRow label="Note" statKey="rating" />
            <StatRow label="Matchs" statKey="appearances" />
            <StatRow label="Cartons J" statKey="yellowCards" />
            <StatRow label="Cartons R" statKey="redCards" />
          </View>
        </GlassCard>

        {/* Physical Comparison */}
        <GlassCard variant="elevated" style={styles.statsCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Profil</Text>

          <View style={styles.statsContainer}>
            <StatRow label="Âge" statKey="age" unit=" ans" />
            <StatRow label="Valeur" statKey="marketValue" />
          </View>
        </GlassCard>

        {/* Radar Chart Placeholder */}
        <GlassCard variant="elevated" style={styles.chartCard}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Graphique Radar</Text>
          <View style={styles.chartPlaceholder}>
            <Icon name="analytics" size={60} color={colors.textSecondary} />
            <Text style={[styles.chartPlaceholderText, { color: colors.textSecondary }]}>Bientôt disponible</Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButton: {
    padding: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
  },
  playersContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  playerCard: {
    alignItems: 'center',
    padding: spacing.md,
    marginRight: spacing.md,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    zIndex: 1,
  },
  playerAvatar: {
    marginBottom: spacing.sm,
  },
  avatarGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: typography.sizes.sm,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  playerPosition: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.xs,
  },
  playerBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  playerClub: {
    fontSize: typography.sizes.xs,
  },
  addPlayerCard: {
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    marginRight: spacing.md,
  },
  addPlayerText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  statsContainer: {
    gap: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  statValues: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  statValueBest: {
    fontWeight: 'bold',
  },
  trophyIcon: {
    marginLeft: 2,
  },
  chartCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.xl,
  },
  chartPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing["2xl"],
  },
  chartPlaceholderText: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  backButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
});

export default PlayerComparisonScreen;