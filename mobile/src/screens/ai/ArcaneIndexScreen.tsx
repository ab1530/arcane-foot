import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import api from '../../services/api';
import { useLocalization } from '../../contexts/LocalizationContext';

type Props = NativeStackScreenProps<AppStackParamList, 'ArcaneIndex'>;

type IndexBreakdown = {
  name?: string;
  score?: number;
  max?: number;
  description?: string;
};

type PlayerIndexResponse = {
  playerId: string;
  overallScore: number;
  breakdown: IndexBreakdown[];
  updatedAt?: string;
  source?: string;
};

const DEFAULT_PLAYER_ID = '';

export const ArcaneIndexScreen: React.FC<Props> = ({ navigation }) => {
  const { dictionary, language } = useLocalization();
  const copy = dictionary.aiTools.index;
  const locale = language === 'en' ? 'en-US' : 'fr-FR';
  const [playerId, setPlayerId] = useState(DEFAULT_PLAYER_ID);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<PlayerIndexResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchIndex = useCallback(
    async (id: string) => {
      if (!id.trim()) {
        return;
      }
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.getArkaneIndex(id.trim());
        setData({
          playerId: response.playerId ?? id.trim(),
          overallScore: response.overallScore ?? 0,
          breakdown: Array.isArray(response.breakdown) ? response.breakdown : [],
          updatedAt: response.updatedAt ?? response.updated_at,
          source: response.source,
        });
      } catch (err) {
        console.error('Failed to load ArkaneIndex:', err);
        setError(copy.search.errors.generic);
      } finally {
        setIsLoading(false);
      }
    },
    [copy.search.errors.generic]
  );

  useEffect(() => {
    let cancelled = false;

    const preloadPlayer = async () => {
      try {
        const response = await api.getPlayers({ limit: 1 });
        const firstPlayer =
          response?.items?.[0] ??
          response?.data?.[0] ??
          response?.players?.[0];
        const resolvedId =
          firstPlayer?.id ||
          firstPlayer?.playerId ||
          firstPlayer?.player?.id;

        if (resolvedId && !cancelled) {
          setPlayerId(resolvedId);
          fetchIndex(resolvedId);
        }
      } catch (err) {
        console.warn('Impossible de précharger un joueur pour ArkaneIndex:', err);
      }
    };

    preloadPlayer();
    return () => {
      cancelled = true;
    };
  }, [fetchIndex]);

  const handleSearch = useCallback(() => {
    fetchIndex(playerId);
  }, [fetchIndex, playerId]);

  const renderBreakdown = () => {
    if (!data?.breakdown?.length) {
      return (
        <GlassCard variant="bordered" style={styles.emptyBreakdownCard}>
          <Text style={styles.emptyBreakdownTitle}>{copy.breakdown.empty.title}</Text>
          <Text style={styles.emptyBreakdownText}>
            {copy.breakdown.empty.description}
          </Text>
        </GlassCard>
      );
    }

    return data.breakdown.map((item, index) => (
      <GlassCard key={`${item.name ?? 'metric'}-${index}`} variant="elevated" style={styles.breakdownCard}>
        <View style={styles.breakdownHeader}>
          <Text style={styles.breakdownTitle}>{item.name ?? copy.breakdown.fallbackName}</Text>
          <Text style={styles.breakdownScore}>
            {item.score ?? 0}
            {typeof item.max === 'number' ? ` / ${item.max}` : ''}
          </Text>
        </View>
        {item.description ? (
          <Text style={styles.breakdownDescription}>{item.description}</Text>
        ) : (
          <Text style={styles.breakdownDescriptionMuted}>
            {copy.breakdown.fallbackDescription}
          </Text>
        )}
      </GlassCard>
    ));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{copy.header.title}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard variant="elevated" style={styles.heroCard}>
          <Text style={styles.heroTitle}>{copy.hero.title}</Text>
          <Text style={styles.heroSubtitle}>
            {copy.hero.subtitle}
          </Text>
        </GlassCard>

        <GlassCard variant="bordered" style={styles.searchCard}>
          <Text style={styles.sectionTitle}>{copy.search.title}</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder={copy.search.placeholder}
              placeholderTextColor={colors.text.secondary}
              value={playerId}
              onChangeText={setPlayerId}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.searchButton, isLoading && styles.searchButtonDisabled]}
              onPress={handleSearch}
              disabled={isLoading || !playerId.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.searchButtonText}>{copy.search.button}</Text>
              )}
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </GlassCard>

        <GlassCard variant="elevated" style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>{copy.scoreCard.globalScore}</Text>
              <Text style={styles.scoreValue}>{data?.overallScore ?? '—'}</Text>
            </View>
            <View>
              <Text style={styles.scoreLabel}>{copy.scoreCard.lastUpdated}</Text>
              <Text style={styles.scoreMeta}>
                {data?.updatedAt
                  ? new Date(data.updatedAt).toLocaleString(locale)
                  : copy.scoreCard.notAvailable}
              </Text>
            </View>
          </View>
          <Text style={styles.scoreSource}>
            {copy.scoreCard.sourceLabel}:{' '}
            {data?.source ? data.source : copy.scoreCard.sourceFallback}
          </Text>
        </GlassCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{copy.breakdown.title}</Text>
          {renderBreakdown()}
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
  backIcon: {
    fontSize: typography.sizes.h3,
    color: colors.text.primary,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  heroCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  heroTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.brand.primary,
    textTransform: 'uppercase',
  },
  heroSubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  searchCard: {
    marginBottom: spacing.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    color: colors.text.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchButton: {
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  searchButtonText: {
    fontWeight: '700',
    color: colors.background.primary,
  },
  errorText: {
    color: colors.semantic.error ?? '#ff6b6b',
    fontSize: typography.sizes.sm,
  },
  scoreCard: {
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  scoreMeta: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'right',
  },
  scoreSource: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  breakdownCard: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  breakdownScore: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  breakdownDescription: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
  },
  breakdownDescriptionMuted: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyBreakdownCard: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyBreakdownTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptyBreakdownText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export default ArcaneIndexScreen;
