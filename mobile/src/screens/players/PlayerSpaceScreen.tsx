import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../design/theme';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import type { PlayerSpacePayload, PlayerSpaceSubmitPayload, UserRole } from '../../types';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Jamais';
  try {
    return new Date(value).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const parseNumber = (value: string) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const initialForm: PlayerSpaceSubmitPayload = {
  minutesPlayed: 0,
  goals: 0,
  assists: 0,
  matchesPlayed: 0,
  matchesNotPlayed: 0,
  isInjured: false,
};
const healthStatusOptions: Array<{
  label: string;
  value: NonNullable<PlayerSpaceSubmitPayload['healthStatus']>;
}> = [
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Fatigue', value: 'FATIGUE' },
  { label: 'Blessé', value: 'INJURY' },
];

export const PlayerSpaceScreen = () => {
  const { user, activeRole, isLoading: isAuthLoading } = useAuth();
  const role = activeRole ?? user?.role;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [space, setSpace] = useState<PlayerSpacePayload | null>(null);
  const [form, setForm] = useState<PlayerSpaceSubmitPayload>(initialForm);
  const [remarks, setRemarks] = useState('');
  const roleSet = useMemo(() => {
    const roles: UserRole[] = [];
    if (role) {
      roles.push(role);
    }
    if (Array.isArray(user?.roles)) {
      for (const candidate of user.roles) {
        if (!roles.includes(candidate as UserRole)) {
          roles.push(candidate as UserRole);
        }
      }
    }
    return new Set<UserRole>(roles);
  }, [role, user?.roles]);

  const playerName = useMemo(() => {
    if (space?.player?.fullName) {
      return space.player.fullName;
    }
    const first = user?.firstName ?? '';
    const last = user?.lastName ?? '';
    return `${first} ${last}`.trim() || 'Joueur';
  }, [space, user?.firstName, user?.lastName]);

  const isPlayerAccess = useMemo(() => roleSet.has('PLAYER'), [roleSet]);

  const loadSpace = useCallback(async () => {
    if (isAuthLoading) {
      return;
    }

    if (!isPlayerAccess) {
      setError('Accès réservé aux comptes joueur.');
      setLoading(false);
      setSpace(null);
      return;
    }

    let resolvedPlayerId = user?.playerId;
    if (!resolvedPlayerId) {
      try {
        const currentUser = await api.getCurrentUser();
        resolvedPlayerId = currentUser?.playerId ?? null;
      } catch {
        resolvedPlayerId = null;
      }
    }

    if (!resolvedPlayerId) {
      setError("Votre compte n'est pas encore lié à un profil joueur.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Production-safe loading: source from player profile directly to avoid
      // hard dependency on legacy /players/me/* endpoints.
      const data = await api.getPlayerSpaceFromProfile(resolvedPlayerId);
      setSpace(data);
      setError(null);
    } catch (e: any) {
      setError(
        e?.message || "Impossible de charger l'espace joueur.",
      );
    } finally {
      setLoading(false);
    }
  }, [isAuthLoading, isPlayerAccess, user?.playerId, user]);

  useEffect(() => {
    void loadSpace();
  }, [loadSpace]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSpace();
    setRefreshing(false);
  }, [loadSpace]);

  const submitUpdate = async () => {
    setSubmitting(true);
    try {
      const payload: PlayerSpaceSubmitPayload = {
        ...form,
        remarks: remarks?.trim() ? remarks.trim() : undefined,
      };
      await api.submitMyPlayerWeeklyUpdate(payload);
      await loadSpace();
      setRemarks('');
      setForm(initialForm);
      Alert.alert('Mise à jour envoyée', 'Votre mise à jour hebdomadaire a été enregistrée.');
    } catch (e: any) {
      Alert.alert("Échec de l'envoi", e?.message || "Impossible d'envoyer la mise à jour.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text style={styles.loadingText}>Chargement de votre espace…</Text>
      </SafeAreaView>
    );
  }

  if (error || !space) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={44} color={theme.colors.semantic.error} />
        <Text style={styles.errorText}>{error ?? "Aucune donnée disponible"}</Text>
        <TouchableOpacity onPress={loadSpace} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <View style={styles.header}>
            <Text style={styles.playerName}>{playerName}</Text>
            <Text style={styles.subtitle}>
              {space.player.position} • {space.player.clubName || 'Sans club'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Snapshot du joueur</Text>
            <View style={styles.snapshotGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.minutesPlayed}</Text>
                <Text style={styles.statLabel}>Minutes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.matchesPlayed}</Text>
                <Text style={styles.statLabel}>Matchs joués</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.matchesNotPlayed}</Text>
                <Text style={styles.statLabel}>Matchs non joués</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.goals}</Text>
                <Text style={styles.statLabel}>Buts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.assists}</Text>
                <Text style={styles.statLabel}>Passes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{space.snapshot.isInjured ? 'Oui' : 'Non'}</Text>
                <Text style={styles.statLabel}>Blessé</Text>
              </View>
            </View>
            <View style={styles.healthRow}>
              <Text style={styles.healthLabel}>État santé</Text>
              <Text style={styles.healthValue}>{space.health.status}</Text>
            </View>
            <Text style={styles.healthMeta}>Sync: {formatDateTime(space.health.lastDeviceSync)}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tendance performance</Text>
            {space.performanceTrend.length === 0 ? (
              <Text style={styles.emptyText}>Aucune donnée de performance récente</Text>
            ) : (
              <FlatList
                data={space.performanceTrend}
                keyExtractor={(item, index) => `${item.period}-${index}`}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.trendRow}>
                    <Text style={styles.trendDate}>{item.period}</Text>
                    <Text style={styles.trendValue}>Note: {item.rating ?? '—'}</Text>
                    <Text style={styles.trendValue}>Temps: {item.minutes ?? '—'} min</Text>
                  </View>
                )}
              />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calendrier personnel</Text>
            {space.upcomingCalendar.length === 0 ? (
              <Text style={styles.emptyText}>Aucun match à venir</Text>
            ) : (
              <FlatList
                data={space.upcomingCalendar}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.calendarRow}>
                    <View style={styles.calendarMeta}>
                      <Text style={styles.calendarTitle}>{item.opponent}</Text>
                      <Text style={styles.calendarMetaText}>
                        {item.isHome ? 'Domicile' : 'Extérieur'} • {formatDate(item.scheduledAt)}
                      </Text>
                    </View>
                    <Text style={styles.calendarMetaText}>
                      {item.competition || 'Compétition'}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mise à jour hebdomadaire</Text>
            <View style={styles.inputGrid}>
              <TextInput
                style={styles.input}
                placeholder="Minutes"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.tertiary}
                value={String(form.minutesPlayed)}
                onChangeText={(value) => setForm({ ...form, minutesPlayed: parseNumber(value) })}
              />
              <TextInput
                style={styles.input}
                placeholder="Buts"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.tertiary}
                value={String(form.goals)}
                onChangeText={(value) => setForm({ ...form, goals: parseNumber(value) })}
              />
            </View>
            <View style={styles.inputGrid}>
              <TextInput
                style={styles.input}
                placeholder="Passes"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.tertiary}
                value={String(form.assists)}
                onChangeText={(value) => setForm({ ...form, assists: parseNumber(value) })}
              />
              <TextInput
                style={styles.input}
                placeholder="Matchs joués"
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.tertiary}
                value={String(form.matchesPlayed)}
                onChangeText={(value) => setForm({ ...form, matchesPlayed: parseNumber(value) })}
              />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Matchs non joués"
              keyboardType="numeric"
              placeholderTextColor={theme.colors.text.tertiary}
              value={String(form.matchesNotPlayed)}
              onChangeText={(value) => setForm({ ...form, matchesNotPlayed: parseNumber(value) })}
            />

            <View style={styles.inlineChoice}>
              <TouchableOpacity
                style={[
                  styles.choiceChip,
                  form.isInjured && styles.choiceChipActive,
                  { marginRight: 8 },
                ]}
                onPress={() => setForm((prev) => ({ ...prev, isInjured: true }))}
              >
                <Text style={[styles.choiceChipText, form.isInjured && styles.choiceChipTextActive]}>
                  Blessé
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceChip, !form.isInjured && styles.choiceChipActive]}
                onPress={() => setForm((prev) => ({ ...prev, isInjured: false }))}
              >
                <Text style={[styles.choiceChipText, !form.isInjured && styles.choiceChipTextActive]}>
                  En forme
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Statut santé</Text>
            <View style={styles.inlineChoice}>
              {healthStatusOptions.map((entry) => (
                <TouchableOpacity
                  key={entry.value}
                  style={[
                    styles.choiceChip,
                    form.healthStatus === entry.value && styles.choiceChipActive,
                    { marginRight: 8 },
                  ]}
                  onPress={() => setForm((prev) => ({ ...prev, healthStatus: entry.value }))}
                >
                  <Text
                    style={[
                      styles.choiceChipText,
                      form.healthStatus === entry.value && styles.choiceChipTextActive,
                    ]}
                  >
                    {entry.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Remarques (optionnel)"
              placeholderTextColor={theme.colors.text.tertiary}
              value={remarks}
              onChangeText={setRemarks}
              multiline
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={submitUpdate}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={theme.colors.text.inverse} />
              ) : (
                <Text style={styles.submitButtonText}>Enregistrer la semaine</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Historique santé</Text>
            <Text style={styles.inputLabel}>Dernière sync appareil: {formatDateTime(space.health.lastDeviceSync)}</Text>
            <Text style={styles.inputLabel}>Total updates: {space.weekly.totalUpdates}</Text>
            {space.weekly.latest && (
              <Text style={styles.inputLabel}>
                Dernière semaine: {formatDate(space.weekly.latest.weekStartDate)} –{' '}
                {space.weekly.latest.healthStatus}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>News</Text>
            {space.news.length === 0 ? (
              <Text style={styles.emptyText}>Aucune actualité pour le moment</Text>
            ) : (
              <FlatList
                data={space.news}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.newsRow}>
                    <Text style={styles.newsTitle}>{item.headline}</Text>
                    {!!item.summary && <Text style={styles.newsSummary}>{item.summary}</Text>}
                    <Text style={styles.newsMeta}>
                      {item.sourceName} • {formatDate(item.publishedAt)}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 14,
  },
  playerName: {
    color: theme.colors.text.primary,
    fontSize: 26,
    fontFamily: theme.typography.fonts.bold,
  },
  subtitle: {
    marginTop: 4,
    color: theme.colors.text.secondary,
    fontSize: 14,
  },
  card: {
    borderRadius: 16,
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    padding: 14,
    marginBottom: 16,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    marginBottom: 12,
    fontFamily: theme.typography.fonts.bold,
  },
  snapshotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  statCard: {
    width: '33.333%',
    padding: 6,
  },
  statValue: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.bold,
    fontSize: 20,
  },
  statLabel: {
    color: theme.colors.text.tertiary,
    marginTop: 4,
    fontSize: 12,
  },
  healthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  healthLabel: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  healthValue: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
  },
  healthMeta: {
    marginTop: 6,
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  trendDate: {
    color: theme.colors.text.secondary,
    width: 90,
    fontSize: 12,
  },
  trendValue: {
    color: theme.colors.text.primary,
    flex: 1,
    textAlign: 'right',
    fontSize: 12,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    marginTop: 4,
  },
  calendarRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 10,
    paddingBottom: 10,
  },
  calendarMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarTitle: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  calendarMetaText: {
    marginTop: 4,
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 10,
    color: theme.colors.text.primary,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface.glassLight,
    fontSize: 14,
    marginBottom: 10,
  },
  textarea: {
    height: 88,
    textAlignVertical: 'top',
  },
  inlineChoice: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  choiceChip: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.surface.glassLight,
  },
  choiceChipActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}22`,
  },
  choiceChipText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  choiceChipTextActive: {
    color: theme.colors.brand.primary,
    fontFamily: theme.typography.fonts.medium,
  },
  inputLabel: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 8,
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.brand.primary,
  },
  submitButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fonts.bold,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  newsRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.border,
    paddingTop: 12,
    marginTop: 12,
  },
  newsTitle: {
    color: theme.colors.text.primary,
    fontFamily: theme.typography.fonts.medium,
    marginBottom: 4,
  },
  newsSummary: {
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  newsMeta: {
    color: theme.colors.text.tertiary,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    color: theme.colors.text.secondary,
    marginTop: 10,
  },
  errorText: {
    color: theme.colors.text.secondary,
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: theme.colors.brand.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: theme.colors.text.inverse,
    fontFamily: theme.typography.fonts.bold,
  },
});
