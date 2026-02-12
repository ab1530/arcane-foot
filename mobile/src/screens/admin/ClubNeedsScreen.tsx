import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import api from '../../services/api';
import { colors, radius, spacing, typography } from '../../design/theme';
import { GlassCard, Icon } from '../../components/ui';
import { logError } from '../../utils/logger';

type ParsedAge = { min?: number; max?: number };
type PreferredFoot = 'Left' | 'Right' | 'Both';

type ClubNeedMatchPlayer = {
  playerId: string;
  firstName: string | null;
  lastName: string | null;
  position: string;
  nationality: string;
  club: { id: string; name: string; logo: string | null } | null;
  marketValue: number | null;
  contractUntil: string | null;
  preferredFoot: string | null;
  photoUrl: string | null;
};

type ClubNeedMatchResult = {
  lineNumber: number;
  clubName: string;
  criteria: { positions: string[]; age?: ParsedAge; preferredFoot?: PreferredFoot };
  players: ClubNeedMatchPlayer[];
  warnings: string[];
  errors: string[];
};

type ClubNeedRequestListItem = {
  id: string;
  rawText: string;
  parsed: any;
  createdAt: string;
};

const EXAMPLE = [
  // Keep demo-friendly filters (avoid too strict combos that return 0 results in seeded data)
  'Mallorca, striker, 18-35, right',
  'Rayo vallecano, winger, 18-35',
  'Girona, central back, 6, 18-35',
  'Alaves, central back, winger',
  'Betis, striker',
].join('\n');

export default function ClubNeedsScreen({ navigation }: any) {
  const [rawText, setRawText] = useState(EXAMPLE);
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<ClubNeedMatchResult[] | null>(null);
  const [history, setHistory] = useState<ClubNeedRequestListItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const validCount = useMemo(() => {
    if (!matches) return 0;
    return matches.filter((m) => !m.errors?.length).length;
  }, [matches]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await (api as any).listClubNeedRequests(1, 20);
      setHistory((res?.data ?? []) as ClubNeedRequestListItem[]);
    } catch (e) {
      logError('Failed to load club needs history', e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (showHistory) loadHistory();
  }, [showHistory, loadHistory]);

  const handleGenerate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const res = await (api as any).createClubNeedRequest(rawText, 5);
      setMatches((res?.matches ?? []) as ClubNeedMatchResult[]);
      setShowHistory(false);
    } catch (e: any) {
      logError('Failed to generate club needs', e);
      Alert.alert('Erreur', e?.message ?? "Impossible de générer la shortlist");
    } finally {
      setLoading(false);
    }
  };

  const openHistoryItem = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);
    try {
      const res = await (api as any).getClubNeedRequest(id, 5);
      setMatches((res?.matches ?? []) as ClubNeedMatchResult[]);
      const req = res?.request;
      if (req?.rawText) setRawText(req.rawText);
      setShowHistory(false);
    } catch (e: any) {
      logError('Failed to open club needs request', e);
      Alert.alert('Erreur', e?.message ?? "Impossible d’ouvrir l’historique");
    } finally {
      setLoading(false);
    }
  };

  const formatAge = (age?: ParsedAge) => {
    if (!age) return null;
    if (age.min != null && age.max != null) return `${age.min}-${age.max}`;
    if (age.max != null) return `U${age.max}`;
    if (age.min != null) return `${age.min}+`;
    return null;
  };

  const formatValue = (value: number | null) => {
    if (value == null) return '—';
    if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `€${Math.round(value / 1_000)}k`;
    return `€${value}`;
  };

  const handleViewPassport = (playerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('PassportPreview', { playerId });
  };

  const handleShareClub = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Partage public',
      'Disponible après déploiement web (domaine public).',
      [{ text: 'OK' }],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrowBack" size="md" color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Besoins clubs</Text>
        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => setShowHistory((v) => !v)}
        >
          <Icon name="time" size="md" color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GlassCard variant="elevated" style={styles.card}>
          <Text style={styles.label}>Coller la liste (1 ligne = 1 club)</Text>
          <TextInput
            style={styles.input}
            multiline
            value={rawText}
            onChangeText={setRawText}
            placeholder={EXAMPLE}
            placeholderTextColor={colors.text.secondary}
          />

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryBtn, loading && styles.btnDisabled]}
              onPress={handleGenerate}
              disabled={loading}
              activeOpacity={0.9}
            >
              {loading ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.primaryBtnText}>Générer & sauvegarder</Text>
              )}
            </TouchableOpacity>
          </View>

          {matches ? (
            <Text style={styles.meta}>
              {validCount} besoins valides • Top 5 joueurs / club
            </Text>
          ) : null}
        </GlassCard>

        {showHistory ? (
          <GlassCard variant="bordered" style={styles.card}>
            <Text style={styles.sectionTitle}>Historique</Text>
            {historyLoading ? (
              <ActivityIndicator color={colors.brand.primary} />
            ) : history.length === 0 ? (
              <Text style={styles.empty}>Aucune demande sauvegardée.</Text>
            ) : (
              history.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyItem}
                  onPress={() => openHistoryItem(item.id)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.historyTitle}>#{item.id.slice(0, 8)}</Text>
                  <Text style={styles.historySub}>
                    {new Date(item.createdAt).toLocaleString('fr-FR')}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </GlassCard>
        ) : null}

        {matches ? (
          <View style={styles.results}>
            {matches.map((m) => (
              <GlassCard key={`${m.lineNumber}-${m.clubName}`} variant="bordered" style={styles.card}>
                <View style={styles.resultHeader}>
                  <View style={styles.clubTitleRow}>
                    <Text style={styles.clubName}>{m.clubName || `Ligne ${m.lineNumber}`}</Text>
                    <TouchableOpacity
                      style={[
                        styles.shareBtn,
                        styles.shareBtnDisabled,
                      ]}
                      onPress={handleShareClub}
                      activeOpacity={0.95}
                      accessibilityState={{ disabled: true }}
                    >
                      <Icon name="share" size="sm" color={colors.text.secondary} />
                      <Text style={styles.shareBtnTextDisabled}>Partager (bientôt)</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipsRow}>
                    {m.criteria.positions?.slice(0, 4).map((p) => (
                      <View key={p} style={styles.chip}>
                        <Text style={styles.chipText}>{p}</Text>
                      </View>
                    ))}
                    {formatAge(m.criteria.age) ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{formatAge(m.criteria.age)}</Text>
                      </View>
                    ) : null}
                    {m.criteria.preferredFoot ? (
                      <View style={styles.chip}>
                        <Text style={styles.chipText}>{m.criteria.preferredFoot}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>

                {m.errors?.length ? (
                  <View style={styles.errorBox}>
                    {m.errors.map((e, i) => (
                      <Text key={i} style={styles.errorText}>{e}</Text>
                    ))}
                  </View>
                ) : null}

                {m.players?.length ? (
                  m.players.map((p) => (
                    <View key={p.playerId} style={styles.playerRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.playerName}>
                          {(p.firstName || '') + ' ' + (p.lastName || '')}
                        </Text>
                        <Text style={styles.playerMeta}>
                          {p.position} • {p.club?.name ?? 'Free agent'} • {formatValue(p.marketValue)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.passportBtn}
                        onPress={() => handleViewPassport(p.playerId)}
                        activeOpacity={0.9}
                      >
                        <Text style={styles.passportBtnText}>Voir passeport</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                ) : (
                  <Text style={styles.empty}>Aucun joueur trouvé.</Text>
                )}
              </GlassCard>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.glass,
  },
  historyBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.glass,
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
  },
  label: {
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  input: {
    minHeight: 140,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    color: colors.text.primary,
    padding: spacing.md,
    textAlignVertical: 'top',
    fontSize: typography.sizes.sm,
  },
  actionsRow: { flexDirection: 'row', marginTop: spacing.md },
  primaryBtn: {
    flex: 1,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: colors.background.primary, fontWeight: '800' },
  meta: { marginTop: spacing.sm, color: colors.text.secondary, fontSize: typography.sizes.xs },
  sectionTitle: { color: colors.text.primary, fontWeight: '800', marginBottom: spacing.md },
  empty: { color: colors.text.secondary },
  historyItem: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
    marginBottom: spacing.sm,
  },
  historyTitle: { color: colors.text.primary, fontWeight: '800' },
  historySub: { color: colors.text.secondary, marginTop: 2, fontSize: typography.sizes.xs },
  results: { gap: spacing.lg },
  resultHeader: { gap: spacing.sm, marginBottom: spacing.md },
  clubTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  clubName: { color: colors.text.primary, fontWeight: '900', fontSize: typography.sizes.md },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
  },
  shareBtnText: { color: colors.brand.primary, fontWeight: '900', fontSize: typography.sizes.xs },
  shareBtnDisabled: {
    opacity: 0.55,
  },
  shareBtnTextDisabled: {
    color: colors.text.secondary,
    fontWeight: '900',
    fontSize: typography.sizes.xs,
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surface.glass,
  },
  chipText: { color: colors.text.secondary, fontSize: typography.sizes.xs, fontWeight: '700' },
  errorBox: { backgroundColor: '#EF444420', borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  errorText: { color: '#EF4444', fontWeight: '700', fontSize: typography.sizes.sm },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.surface.border,
  },
  playerName: { color: colors.text.primary, fontWeight: '800' },
  playerMeta: { color: colors.text.secondary, marginTop: 2, fontSize: typography.sizes.xs },
  passportBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
  },
  passportBtnText: { color: colors.brand.primary, fontWeight: '900', fontSize: typography.sizes.xs },
});
