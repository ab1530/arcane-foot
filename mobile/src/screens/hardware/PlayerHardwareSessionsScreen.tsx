import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { showError, showSuccess } from '../../services/toast';
import { Card } from '../../design/components/Card';
import { theme } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import type { HardwareSession } from '../../types/hardware';
import { MatchHeatmap } from '../../components/hardware/MatchHeatmap';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const formatKm = (meters?: number) => ((meters ?? 0) / 1000).toFixed(1);
const formatKmh = (kmh?: number) => (kmh ?? 0).toFixed(1);
const formatMinutes = (minutes?: number | null) => {
  if (minutes === undefined || minutes === null) return '—';
  const rounded = Math.round(minutes * 10) / 10;
  return rounded.toFixed(1);
};

const getDurationMinutes = (session: HardwareSession) => {
  if (session.metrics?.totalTimeMin !== undefined && session.metrics.totalTimeMin !== null) {
    return session.metrics.totalTimeMin;
  }
  const start = new Date(session.startedAt).getTime();
  const end = new Date(session.endedAt).getTime();
  return Math.round(((end - start) / 1000 / 60) * 10) / 10;
};

export const PlayerHardwareSessionsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'HardwareSessions'>>();
  const { user } = useAuth();
  const { colors } = useTheme();

  const targetPlayerId = route.params?.playerId ?? user?.playerId;
  const targetPlayerName = route.params?.playerName;
  const isOwnProfile = user?.role === 'PLAYER' && targetPlayerId === user?.playerId;

  const [sessions, setSessions] = useState<HardwareSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'match' | 'training'>('all');

  const loadSessions = useCallback(async () => {
    if (!targetPlayerId) {
      showError('Impossible de charger les séances (playerId manquant)');
      setLoading(false);
      return;
    }

    try {
      const data = await api.getHardwareSessions(targetPlayerId);
      setSessions(data || []);
    } catch (error) {
      console.error('Failed to load hardware sessions', error);
      showError('Erreur lors du chargement des séances GPS');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetPlayerId]);

  useFocusEffect(
    useCallback(() => {
      loadSessions();
    }, [loadSessions]),
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!targetPlayerId) {
        showError('Impossible de supprimer sans profil joueur');
        return;
      }
      try {
        setDeletingSessionId(sessionId);
        await api.deleteHardwareSession(sessionId);
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        showSuccess('Séance supprimée');
      } catch (error) {
        console.error('Failed to delete hardware session', error);
        showError('Suppression impossible');
      } finally {
        setDeletingSessionId(null);
      }
    },
    [targetPlayerId],
  );

  const confirmDeleteSession = useCallback(
    (sessionId: string) => {
      Alert.alert(
        'Supprimer la séance',
        'Cette action est définitive. Confirmer la suppression ?',
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer', style: 'destructive', onPress: () => deleteSession(sessionId) },
        ],
      );
    },
    [deleteSession],
  );

  const handleStartLabFlow = useCallback(() => {
    navigation.navigate('ConnectGpsTracker', {
      prefillLabMode: true,
      prefillLabPresetMinutes: 90,
      preselectedSessionType: 'match',
    });
  }, [navigation]);

  const handleConnectGps = useCallback(() => {
    navigation.navigate('ConnectGpsTracker');
  }, [navigation]);

  const filteredSessions = useMemo(() => {
    if (typeFilter === 'all') {
      return sessions;
    }
    return sessions.filter((session) => session.type === typeFilter);
  }, [sessions, typeFilter]);

  const summary = useMemo(() => {
    if (filteredSessions.length === 0) {
      return { totalDistance: 0, sprintDistance: 0, maxSpeed: 0, avgDuration: 0 };
    }

    const totalDistance = filteredSessions.reduce(
      (acc, session) => acc + (session.metrics?.movementDistanceM ?? 0),
      0,
    );
    const sprintDistance = filteredSessions.reduce(
      (acc, session) => acc + (session.metrics?.sprintDistanceM ?? 0),
      0,
    );
    const maxSpeed = Math.max(...filteredSessions.map((s) => s.metrics?.maxSpeedKmh ?? 0));
    const avgDuration =
      filteredSessions.reduce((acc, session) => acc + getDurationMinutes(session), 0) /
      filteredSessions.length;

    return {
      totalDistance,
      sprintDistance,
      maxSpeed,
      avgDuration,
    };
  }, [filteredSessions]);

  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerTitle = targetPlayerName ? `Séances GPS · ${targetPlayerName}` : 'Mes séances GPS';
  const headerSubtitle = targetPlayerName
    ? 'Données GPS connectées pour ce joueur'
    : 'Simulation temps réel du gilet connecté';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.darkBg }} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadSessions}
            tintColor={colors.accent}
          />
        }
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{headerTitle}</Text>
            <Text style={styles.subtitle}>{headerSubtitle}</Text>
          </View>
        </View>

        {isOwnProfile && (
          <>
            <TouchableOpacity style={styles.simulateButton} onPress={handleStartLabFlow}>
              <Ionicons name="flash" size={18} color={colors.darkBg} style={{ marginRight: 8 }} />
              <Text style={styles.simulateText}>Importer séance LAB (WINGER)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.simulateButton,
                { backgroundColor: colors.glass, borderWidth: 1, borderColor: colors.glassBorder },
              ]}
              onPress={handleConnectGps}
            >
              <Ionicons name="bluetooth" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Text style={[styles.simulateText, { color: colors.textPrimary }]}>Connecter mon GPS</Text>
            </TouchableOpacity>
          </>
        )}

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loaderText}>Chargement des séances...</Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={36} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune séance pour ce filtre</Text>
            <Text style={styles.emptySubtitle}>
              Connecte le tracker puis génère une séance LAB pour tester le pipeline d’ingestion.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.filterRow}>
              {([
                { key: 'all', label: 'All' },
                { key: 'match', label: 'Match' },
                { key: 'training', label: 'Training' },
              ] as const).map((item) => {
                const selected = typeFilter === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.filterChip,
                      selected && styles.filterChipActive,
                    ]}
                    onPress={() => setTypeFilter(item.key)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selected && styles.filterChipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.statsGrid}>
              <Card variant="glass" size="md" contentStyle={styles.statCard}>
                <View>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{formatKm(summary.totalDistance)} km</Text>
                  <Text style={styles.statHint}>Cumulées</Text>
                </View>
                <Ionicons name="walk-outline" size={24} color={colors.accent} />
              </Card>
              <Card variant="glass" size="md" contentStyle={styles.statCard}>
                <View>
                  <Text style={styles.statLabel}>Sprint</Text>
                  <Text style={styles.statValue}>{formatKm(summary.sprintDistance)} km</Text>
                  <Text style={styles.statHint}>Total</Text>
                </View>
                <Ionicons name="speedometer-outline" size={24} color={colors.accent} />
              </Card>
              <Card variant="glass" size="md" contentStyle={styles.statCard}>
                <View>
                  <Text style={styles.statLabel}>Vitesse max</Text>
                  <Text style={styles.statValue}>{formatKmh(summary.maxSpeed)} km/h</Text>
                  <Text style={styles.statHint}>Peak</Text>
                </View>
                <Ionicons name="rocket-outline" size={24} color={colors.accent} />
              </Card>
              <Card variant="glass" size="md" contentStyle={styles.statCard}>
                <View>
                  <Text style={styles.statLabel}>Durée moy.</Text>
                  <Text style={styles.statValue}>{formatMinutes(summary.avgDuration)} min</Text>
                  <Text style={styles.statHint}>par séance</Text>
                </View>
                <Ionicons name="time-outline" size={24} color={colors.accent} />
              </Card>
            </View>

            <View style={styles.sessionsList}>
              {[...filteredSessions]
                .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
                .map((session) => {
                  const isLabSession = session.source === 'ACTION_MARK_LAB';
                  return (
                    <Card
                      key={session.id}
                      variant="glass"
                      glowOnPress
                      onPress={() =>
                        navigation.navigate('HardwareSessionDetail', { sessionId: session.id })
                      }
                      contentStyle={styles.sessionCard}
                    >
                      <View style={styles.sessionHeader}>
                        <View>
                          <Text style={styles.sessionTitle}>{formatDate(session.startedAt)}</Text>
                          <View style={styles.sessionSubtitleRow}>
                            <Text style={styles.sessionSubtitle}>
                              {session.type} · {session.deviceId}
                            </Text>
                            {isLabSession && (
                              <View style={styles.labBadge}>
                                <Text style={styles.labBadgeText}>LAB</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.sessionHeaderActions}>
                          <View style={styles.sessionBadge}>
                            <Text style={styles.sessionBadgeText}>
                              {formatMinutes(session.metrics?.totalTimeMin ?? getDurationMinutes(session))} min
                            </Text>
                          </View>
                          {isOwnProfile && (
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => confirmDeleteSession(session.id)}
                              disabled={deletingSessionId === session.id}
                            >
                              {deletingSessionId === session.id ? (
                                <ActivityIndicator size="small" color={colors.textSecondary} />
                              ) : (
                                <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
                              )}
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      <View style={styles.sessionMetrics}>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Distance</Text>
                          <Text style={styles.metricValue}>
                            {formatKm(session.metrics?.movementDistanceM)} km
                          </Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Vitesse max</Text>
                          <Text style={styles.metricValue}>{formatKmh(session.metrics?.maxSpeedKmh)} km/h</Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Sprints</Text>
                          <Text style={styles.metricValue}>
                            {session.metrics?.sprintDistanceM !== undefined || session.metrics?.sprintCount !== undefined
                              ? `${formatKm(session.metrics?.sprintDistanceM)} km · ${session.metrics?.sprintCount ?? '—'}`
                              : '—'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.heatmapPreviewWrap}>
                        <MatchHeatmap
                          thermalTrajectoryMap={session.metrics?.thermalTrajectoryMap}
                          width={138}
                          showLegend={false}
                        />
                      </View>
                    </Card>
                  );
                })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.darkBg,
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.glass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    title: {
      fontSize: theme.typography.sizes.h3,
      fontFamily: theme.typography.fonts.bold,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: theme.typography.sizes.caption,
      color: colors.textSecondary,
    },
    simulateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      padding: 14,
      borderRadius: 14,
      marginBottom: 16,
    },
    simulateText: {
      fontFamily: theme.typography.fonts.bold,
      color: colors.darkBg,
    },
    loader: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 12,
    },
    loaderText: {
      color: colors.textSecondary,
      fontFamily: theme.typography.fonts.medium,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
      gap: 8,
    },
    emptyTitle: {
      fontFamily: theme.typography.fonts.bold,
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.h4,
    },
    emptySubtitle: {
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 24,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
      flexWrap: 'wrap',
    },
    filterChip: {
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 999,
      backgroundColor: colors.glass,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    filterChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    filterChipText: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.bold,
    },
    filterChipTextActive: {
      color: colors.darkBg,
    },
    statCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      minWidth: '45%',
    },
    statLabel: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      textTransform: 'uppercase',
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.h4,
      fontFamily: theme.typography.fonts.bold,
    },
    statHint: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
    },
    sessionsList: {
      gap: 12,
    },
    sessionCard: {
      gap: 12,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionHeaderActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    sessionTitle: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.h4,
      fontFamily: theme.typography.fonts.bold,
    },
    sessionSubtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 2,
    },
    sessionSubtitle: {
      color: colors.textSecondary,
    },
    labBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    labBadgeText: {
      color: colors.darkBg,
      fontSize: 10,
      fontFamily: theme.typography.fonts.bold,
    },
    sessionBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    sessionBadgeText: {
      color: colors.textPrimary,
      fontFamily: theme.typography.fonts.medium,
    },
    deleteButton: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    sessionMetrics: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12,
    },
    metricItem: {
      flex: 1,
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      textTransform: 'uppercase',
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.h5,
      fontFamily: theme.typography.fonts.bold,
    },
    heatmapPreviewWrap: {
      marginTop: 8,
      alignItems: 'flex-start',
    },
  });
