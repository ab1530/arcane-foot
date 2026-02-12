import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../../components/ui/GlassCard';
import {
  ValuationCard,
  ConfidenceIndicator,
  FactorBar,
  ComparablePlayerCard,
} from '../../components/market-value';
import { Icon } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import { marketValueApi } from '../../services/api/market-value';
import type { AppStackParamList } from '../../types/navigation';
import type { PlayerValuation } from '../../types/market-value';

type Props = NativeStackScreenProps<AppStackParamList, 'MarketValue'>;

export const MarketValueScreen: React.FC<Props> = ({ navigation, route }) => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [valuation, setValuation] = useState<PlayerValuation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [playerId, setPlayerId] = useState(route.params?.playerId || '');

  const fetchValuation = useCallback(async (id: string) => {
    if (!id.trim()) {
      setError('Please enter a player ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await marketValueApi.getValuation(id);
      setValuation(data);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Failed to fetch valuation:', err);
      setError(
        err.response?.status === 404
          ? 'Player not found'
          : err.response?.status === 503
          ? 'AI service is currently unavailable'
          : 'Failed to fetch valuation. Please try again.'
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!valuation) return;
    setRefreshing(true);
    await fetchValuation(valuation.playerId);
    setRefreshing(false);
  }, [valuation, fetchValuation]);

  const handleGetValuation = useCallback(() => {
    fetchValuation(playerId);
  }, [playerId, fetchValuation]);

  const navigateToDetail = useCallback(() => {
    if (valuation) {
      navigation.navigate('MarketValueDetail', { playerId: valuation.playerId });
    }
  }, [valuation, navigation]);

  const factorEntries = valuation
    ? Object.entries(valuation.factors).sort(([, a], [, b]) => b - a)
    : [];

  const maxFactorValue = factorEntries.length > 0
    ? Math.max(...factorEntries.map(([, value]) => value))
    : 10;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrowBack" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Market Value AI</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
      >
        {/* Player Search */}
        <GlassCard variant="elevated" style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Icon name="search" size={20} color={colors.text.secondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Enter Player ID..."
                placeholderTextColor={colors.text.secondary}
                value={playerId}
                onChangeText={setPlayerId}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.searchButton,
                (loading || !playerId.trim()) && styles.searchButtonDisabled,
              ]}
              onPress={handleGetValuation}
              disabled={loading || !playerId.trim()}
            >
              {loading ? (
                <ActivityIndicator color={colors.background.primary} size="small" />
              ) : (
                <Icon name="analytics" size={20} color={colors.background.primary} />
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Error State */}
        {error && !valuation && (
          <GlassCard variant="bordered" style={styles.errorCard}>
            <View style={styles.errorContainer}>
              <Icon name="alertCircle" size={48} color={colors.semantic.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchValuation(playerId)}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Valuation Results */}
        {valuation && (
          <>
            {/* Main Valuation Card */}
            <ValuationCard
              value={valuation.estimatedValue}
              interval={[
                valuation.confidenceInterval.low,
                valuation.confidenceInterval.high,
              ]}
              confidence={valuation.confidenceScore}
              loading={loading}
            />

            {/* Confidence Indicator */}
            <GlassCard variant="elevated" style={styles.confidenceCard}>
              <ConfidenceIndicator confidence={valuation.confidenceScore} />
            </GlassCard>

            {/* Factor Breakdown */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Contributing Factors</Text>
                <Icon name="barChart" size={20} color={colors.brand.primary} />
              </View>
              <GlassCard variant="bordered">
                <View style={styles.factorsContainer}>
                  {factorEntries.map(([name, value], index) => (
                    <FactorBar
                      key={name}
                      name={name}
                      value={value}
                      maxValue={maxFactorValue}
                      index={index}
                    />
                  ))}
                </View>
              </GlassCard>
            </View>

            {/* Comparable Players */}
            {valuation.comparablePlayers.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Similar Players</Text>
                  <Icon name="people" size={20} color={colors.brand.primary} />
                </View>
                {valuation.comparablePlayers.slice(0, 3).map((player, index) => (
                  <ComparablePlayerCard key={index} player={player} />
                ))}
              </View>
            )}

            {/* View Details Button */}
            <TouchableOpacity style={styles.detailButton} onPress={navigateToDetail}>
              <Icon name="trendingUp" size={24} color={colors.background.primary} />
              <Text style={styles.detailButtonText}>View Historical Trend</Text>
              <Icon name="chevronForward" size={20} color={colors.background.primary} />
            </TouchableOpacity>

            {/* Model Info */}
            <GlassCard variant="bordered" style={styles.infoCard}>
              <View style={styles.infoContainer}>
                <Icon name="informationCircle" size={20} color={colors.text.secondary} />
                <Text style={styles.infoText}>
                  Valuation generated by model {valuation.modelVersion} at{' '}
                  {new Date(valuation.timestamp).toLocaleString()}
                </Text>
              </View>
            </GlassCard>
          </>
        )}

        {/* Empty State */}
        {!valuation && !loading && !error && (
          <GlassCard variant="elevated" style={styles.emptyCard}>
            <View style={styles.emptyContainer}>
              <Icon name="analytics" size={64} color={colors.brand.primary} />
              <Text style={styles.emptyTitle}>AI Market Valuation</Text>
              <Text style={styles.emptyText}>
                Enter a player ID to get an AI-powered market value estimation based on
                performance, age, position, and other factors.
              </Text>
            </View>
          </GlassCard>
        )}
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
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  searchCard: {
    marginBottom: spacing.lg,
  },
  searchContainer: {
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    paddingVertical: spacing.md,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: colors.brand.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonDisabled: {
    opacity: 0.6,
  },
  errorCard: {
    marginBottom: spacing.lg,
  },
  errorContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.semantic.error,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  retryText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.brand.primary,
  },
  confidenceCard: {
    marginBottom: spacing.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  factorsContainer: {
    padding: spacing.md,
  },
  detailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  detailButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  infoCard: {
    marginBottom: spacing.lg,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  emptyCard: {
    marginTop: spacing.xl,
  },
  emptyContainer: {
    padding: spacing.xl * 2,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
