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
        setError("Impossible de récupérer l'index pour ce joueur.");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    // Ne pas charger automatiquement au démarrage
    // L'utilisateur doit entrer un ID et cliquer sur "Analyser"
  }, []);

  const handleSearch = useCallback(() => {
    fetchIndex(playerId);
  }, [fetchIndex, playerId]);

  const renderBreakdown = () => {
    if (!data?.breakdown?.length) {
      return (
        <GlassCard variant="bordered" style={styles.emptyBreakdownCard}>
          <Text style={styles.emptyBreakdownTitle}>Aucune donnée détaillée</Text>
          <Text style={styles.emptyBreakdownText}>
            Configure l’IA ArkaneIndex depuis le backend pour afficher les composantes
            techniques, physiques et tactiques d’un joueur.
          </Text>
        </GlassCard>
      );
    }

    return data.breakdown.map((item, index) => (
      <GlassCard key={`${item.name ?? 'metric'}-${index}`} variant="elevated" style={styles.breakdownCard}>
        <View style={styles.breakdownHeader}>
          <Text style={styles.breakdownTitle}>{item.name ?? 'Dimension inconnue'}</Text>
          <Text style={styles.breakdownScore}>
            {item.score ?? 0}
            {typeof item.max === 'number' ? ` / ${item.max}` : ''}
          </Text>
        </View>
        {item.description ? (
          <Text style={styles.breakdownDescription}>{item.description}</Text>
        ) : (
          <Text style={styles.breakdownDescriptionMuted}>
            Description non fournie par le moteur IA.
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
        <Text style={styles.headerTitle}>ArkaneIndex</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard variant="elevated" style={styles.heroCard}>
          <Text style={styles.heroTitle}>Score IA des talents</Text>
          <Text style={styles.heroSubtitle}>
            Analyse en temps réel des joueurs avec les critères Arkane (technique,
            physique, mental, tactique, potentiel…).
          </Text>
        </GlassCard>

        <GlassCard variant="bordered" style={styles.searchCard}>
          <Text style={styles.sectionTitle}>Rechercher un joueur</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Entrez l'ID du joueur"
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
                <Text style={styles.searchButtonText}>Analyser</Text>
              )}
            </TouchableOpacity>
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </GlassCard>

        <GlassCard variant="elevated" style={styles.scoreCard}>
          <View style={styles.scoreRow}>
            <View>
              <Text style={styles.scoreLabel}>Score global</Text>
              <Text style={styles.scoreValue}>{data?.overallScore ?? '—'}</Text>
            </View>
            <View>
              <Text style={styles.scoreLabel}>Dernière mise à jour</Text>
              <Text style={styles.scoreMeta}>
                {data?.updatedAt
                  ? new Date(data.updatedAt).toLocaleString('fr-FR')
                  : 'Non disponible'}
              </Text>
            </View>
          </View>
          <Text style={styles.scoreSource}>
            Source: {data?.source ? data.source : 'ai-service'}
          </Text>
        </GlassCard>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Décomposition du scoring</Text>
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
