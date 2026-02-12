import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { showError, showSuccess } from '../../services/toast';
import { Card } from '../../design/components/Card';
import { theme } from '../../design/theme';
import type { AppStackParamList } from '../../types/navigation';
import type { HardwareSession } from '../../types/hardware';

const formatDate = (date: string) =>
  new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatKm = (meters?: number) => ((meters ?? 0) / 1000).toFixed(1);
const formatKmh = (kmh?: number) => (kmh ?? 0).toFixed(1);
const formatInt = (val?: number | null) => (val === undefined || val === null ? '—' : Math.round(val).toString());
const formatDecimal = (val?: number | null, digits = 1) =>
  val === undefined || val === null ? '—' : (Math.round(val * Math.pow(10, digits)) / Math.pow(10, digits)).toFixed(digits);
const formatMinutes = (minutes?: number | null) => {
  if (minutes === undefined || minutes === null) return '—';
  const rounded = Math.round(minutes * 10) / 10;
  return rounded.toFixed(1);
};

const getDurationMinutes = (session?: HardwareSession | null) => {
  if (!session) return 0;
  if (session.metrics?.totalTimeMin !== undefined && session.metrics.totalTimeMin !== null) {
    return session.metrics.totalTimeMin;
  }
  const start = new Date(session.startedAt).getTime();
  const end = new Date(session.endedAt).getTime();
  return Math.round(((end - start) / 1000 / 60) * 10) / 10;
};

export const PlayerHardwareSessionDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'HardwareSessionDetail'>>();
  const { colors } = useTheme();
  const [session, setSession] = useState<HardwareSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const sessionId = route.params?.sessionId;

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      showError('Session introuvable');
      setLoading(false);
      return;
    }

    try {
      const data = await api.getHardwareSession(sessionId);
      setSession(data);
    } catch (error) {
      console.error('Failed to load session detail', error);
      showError('Erreur lors du chargement de la séance');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleDelete = useCallback(async () => {
    if (!sessionId) {
      showError('Session introuvable');
      return;
    }
    try {
      setDeleting(true);
      await api.deleteHardwareSession(sessionId);
      showSuccess('Séance supprimée');
      navigation.goBack();
    } catch (error) {
      console.error('Failed to delete session', error);
      showError('Suppression impossible');
    } finally {
      setDeleting(false);
    }
  }, [navigation, sessionId]);

  const confirmDelete = useCallback(() => {
    Alert.alert(
      'Supprimer la séance',
      'Cette action est définitive. Confirmer la suppression ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: handleDelete },
      ],
    );
  }, [handleDelete]);

  const metrics = session?.metrics;

  const chartRatios = useMemo(() => {
    const distanceRatio = Math.min(1, (metrics?.movementDistanceM ?? 0) / 12000);
    const sprintRatio = Math.min(1, (metrics?.sprintDistanceM ?? 0) / 2000);
    const speedRatio = Math.min(1, (metrics?.maxSpeedKmh ?? 0) / 40);
    return { distanceRatio, sprintRatio, speedRatio };
  }, [metrics]);

  const styles = useMemo(() => createStyles(colors), [colors]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loaderText}>Chargement...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loaderText}>Séance introuvable</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.darkBg }} edges={['top', 'bottom']}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Détails de la séance</Text>
              <Text style={styles.subtitle}>{formatDate(session.startedAt)}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <Card variant="glass" size="lg" contentStyle={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Distance</Text>
            <Text style={styles.summaryValue}>
              {formatKm(metrics?.movementDistanceM)} km
              </Text>
            </View>
            <View>
            <Text style={styles.summaryLabel}>Sprint</Text>
            <Text style={styles.summaryValue}>
              {formatKm(metrics?.sprintDistanceM)} km
            </Text>
          </View>
            <View>
              <Text style={styles.summaryLabel}>Vitesse max</Text>
              <Text style={styles.summaryValue}>{formatKmh(metrics?.maxSpeedKmh)} km/h</Text>
            </View>
          <View>
            <Text style={styles.summaryLabel}>Durée</Text>
            <Text style={styles.summaryValue}>{formatMinutes(getDurationMinutes(session))} min</Text>
          </View>
        </View>
        <View style={styles.summaryRow}>
          <View>
            <Text style={styles.summaryLabel}>Sprints</Text>
            <Text style={styles.summaryValue}>{formatInt(metrics?.sprintCount)}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Calories</Text>
            <Text style={styles.summaryValue}>
              {formatInt(metrics?.caloriesBurned)} kcal
            </Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Accél.</Text>
            <Text style={styles.summaryValue}>{formatInt(metrics?.accelerationCount)}</Text>
          </View>
          <View>
            <Text style={styles.summaryLabel}>Décél.</Text>
            <Text style={styles.summaryValue}>{formatInt(metrics?.decelerationCount ?? metrics?.reductionStepsCount)}</Text>
          </View>
        </View>
      </Card>

        <Card variant="glass" size="lg" contentStyle={styles.chartCard}>
          <Text style={styles.cardTitle}>Mini graphique</Text>
          <Text style={styles.cardSubtitle}>Charge / Sprint / Vitesse max</Text>
          {[
            { label: 'Charge', ratio: chartRatios.distanceRatio, color: colors.accent },
            { label: 'Sprint', ratio: chartRatios.sprintRatio, color: colors.secondary },
            { label: 'Vitesse', ratio: chartRatios.speedRatio, color: colors.info },
          ].map((item) => (
            <View key={item.label} style={styles.chartRow}>
              <Text style={styles.chartLabel}>{item.label}</Text>
              <View style={styles.chartBar}>
                <View style={[styles.chartFill, { width: `${Math.max(8, item.ratio * 100)}%`, backgroundColor: item.color }]} />
              </View>
            </View>
          ))}
        </Card>

        <Card variant="glass" size="lg" contentStyle={styles.metricsCard}>
          <Text style={styles.cardTitle}>Données détaillées</Text>
          <View style={styles.metricGrid}>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Off/Def</Text>
            <Text style={styles.metricValue}>{metrics?.offenseDefenseRatio ?? '—'}</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Accélération max</Text>
            <Text style={styles.metricValue}>{formatDecimal(metrics?.maxAccelerationG)} g</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Décélération max</Text>
            <Text style={styles.metricValue}>{formatDecimal(metrics?.maxDecelerationG)} g</Text>
          </View>
          <View style={styles.metricBlock}>
            <Text style={styles.metricLabel}>Réductions</Text>
            <Text style={styles.metricValue}>{formatInt(metrics?.reductionStepsCount ?? metrics?.decelerationCount)}</Text>
          </View>
        </View>

        {metrics?.normalizedMetrics && (
          <View style={styles.normalized}>
            <Text style={styles.metricLabel}>Normalisé</Text>
            <Text style={styles.metricValue}>
              Load {formatDecimal(metrics.normalizedMetrics.loadScore)} / Intensité {formatDecimal(metrics.normalizedMetrics.intensityScore)}
            </Text>
          </View>
        )}

        {metrics?.thermalTrajectoryMap?.cells && (
          <View style={styles.normalized}>
            <Text style={styles.metricLabel}>Heatmap</Text>
            <Text style={styles.metricValue}>
              Zones couvertes: {metrics.thermalTrajectoryMap.cells.length}
            </Text>
          </View>
        )}
      </Card>
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
    centered: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loaderText: {
      color: colors.textSecondary,
      fontFamily: theme.typography.fonts.medium,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
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
    deleteButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    summaryCard: {
      gap: 12,
      marginBottom: 12,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    summaryLabel: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      textTransform: 'uppercase',
    },
    summaryValue: {
      color: colors.textPrimary,
      fontFamily: theme.typography.fonts.bold,
      fontSize: theme.typography.sizes.h4,
    },
    chartCard: {
      marginBottom: 12,
      gap: 8,
    },
    cardTitle: {
      color: colors.textPrimary,
      fontFamily: theme.typography.fonts.bold,
      fontSize: theme.typography.sizes.h5,
    },
    cardSubtitle: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
    },
    chartRow: {
      marginTop: 8,
    },
    chartLabel: {
      color: colors.textSecondary,
      marginBottom: 4,
    },
    chartBar: {
      height: 10,
      borderRadius: 999,
      backgroundColor: colors.glass,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    chartFill: {
      height: '100%',
      borderRadius: 999,
    },
    metricsCard: {
      gap: 12,
      marginBottom: 24,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metricBlock: {
      flexBasis: '47%',
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
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
    normalized: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
  });
