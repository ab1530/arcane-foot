import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  qcBand,
  QCBandDevice,
  QCBandBattery,
  QCBandSteps,
  QCBandExercise,
  formatBatteryPercent,
  formatDistanceKm,
  formatActiveMinutes,
} from '../../services/wearables/qcBand';
import { useTheme } from '../../contexts/ThemeContext';
import { Card } from '../../design/components/Card';
import { theme } from '../../design/theme';
import { showError, showSuccess } from '../../services/toast';
import type { AppStackParamList } from '../../types/navigation';

export const QCBandScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (Platform.OS !== 'ios') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.darkBg }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>QC Band</Text>
        </View>
        <View style={[styles.empty, { padding: 24 }]}>
          <Text style={styles.emptyText}>QC Band n’est pas encore pris en charge sur Android.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [devices, setDevices] = useState<QCBandDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedDevice, setConnectedDevice] = useState<QCBandDevice | null>(null);
  const [lastSeenDevice, setLastSeenDevice] = useState<{ id: string; name?: string } | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [battery, setBattery] = useState<QCBandBattery | null>(null);
  const [steps, setSteps] = useState<QCBandSteps | null>(null);
  const [hr, setHr] = useState<number | null>(null);
  const [hrRunning, setHrRunning] = useState(false);
  const [todayStats, setTodayStats] = useState<QCBandSteps | null>(null);
  const [history, setHistory] = useState<
    Array<QCBandExercise>
  >([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const sub = qcBand.addHeartRateListener((bpm) => setHr(bpm));
    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    qcBand
      .getLastSeenDevice()
      .then((saved) => {
        if (saved && saved.id) setLastSeenDevice(saved);
      })
      .catch(() => {});
  }, []);

  const refreshData = useCallback(async (device?: QCBandDevice) => {
    const target = device || connectedDevice;
    if (!target) {
      showError('Aucun bracelet connecté');
      return;
    }
    try {
      setDataLoading(true);
      const b = await qcBand.getBattery();
      setBattery(b);
      const s = await qcBand.getCurrentSteps();
      setSteps(s);
      const t = await qcBand.getTodayStats();
      setTodayStats(t);
    } catch (err: any) {
      showError(err?.message ?? 'Impossible de rafraîchir les données');
    } finally {
      setDataLoading(false);
    }
  }, [connectedDevice]);

  const scan = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      showError('QC Band non pris en charge sur Android');
      return;
    }
    try {
      setScanning(true);
      const attempt = async (durationMs: number) => {
        const res = await qcBand.scan(durationMs);
        setDevices(res);
        return res;
      };

      let found = await attempt(8000);
      if (!found.length) {
        // Un deuxième passage aide parfois les bandeaux qui annoncent tard
        found = await attempt(8000);
      }

      if (found.length) {
        showSuccess(`Scan terminé (${found.length} appareil(s))`);
      } else {
        showError(
          "Aucun appareil détecté. Mettez le bracelet en mode appairage / redémarrez le bracelet / fermez l'app constructeur si elle est connectée.",
        );
      }
    } catch (err: any) {
      showError(err?.message ?? 'Scan impossible');
    } finally {
      setScanning(false);
    }
  }, []);

  const connect = useCallback(
    async (device: QCBandDevice) => {
      try {
        setConnectingId(device.id);
        await qcBand.connect(device.id);
        setConnectedDevice(device);
        setLastSeenDevice({ id: device.id, name: device.name });
        showSuccess('Bracelet connecté');
        await refreshData(device);
      } catch (err: any) {
        showError(err?.message ?? 'Connexion impossible');
      } finally {
        setConnectingId(null);
      }
    },
    [refreshData],
  );

  const connectLastSeen = useCallback(async () => {
    if (!lastSeenDevice) {
      showError('Aucun bracelet mémorisé');
      return;
    }
    try {
      setConnectingId(lastSeenDevice.id);
      await qcBand.connectLastSeen();
      setConnectedDevice(lastSeenDevice);
      showSuccess(`Connecté à ${lastSeenDevice.name ?? 'QC Band'}`);
      await refreshData(lastSeenDevice);
    } catch (err: any) {
      showError(err?.message ?? 'Connexion impossible');
    } finally {
      setConnectingId(null);
    }
  }, [lastSeenDevice, refreshData]);

  const disconnect = useCallback(async () => {
    try {
      await qcBand.disconnect();
      setConnectedDevice(null);
      setBattery(null);
      setSteps(null);
      setHr(null);
      setTodayStats(null);
      showSuccess('Bracelet déconnecté');
    } catch (err: any) {
      showError(err?.message ?? 'Déconnexion impossible');
    }
  }, []);

  const toggleHr = useCallback(async () => {
    try {
      if (hrRunning) {
        await qcBand.stopRealtimeHeartRate();
        setHrRunning(false);
      } else {
        await qcBand.startRealtimeHeartRate();
        setHrRunning(true);
      }
    } catch (err: any) {
      showError(err?.message ?? 'Action HR impossible');
    }
  }, [hrRunning]);

  const fetchToday = useCallback(async () => {
    try {
      const res = await qcBand.getTodayStats();
      setTodayStats(res);
    } catch (err: any) {
      showError(err?.message ?? 'Lecture stats jour impossible');
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const res = await qcBand.getExerciseHistory(now - 7 * 24 * 3600, 20); // last 7 days
      setHistory(res);
    } catch (err: any) {
      showError(err?.message ?? 'Historique indisponible');
    }
  }, []);

  const renderDevice = ({ item }: { item: QCBandDevice }) => (
    <Card variant="glass" size="md" contentStyle={styles.deviceCard}>
      <View>
        <Text style={styles.deviceName}>{item.name ?? 'QC Band'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
        <Text style={styles.rssi}>{item.rssi !== undefined ? `${item.rssi} dBm` : 'RSSI —'}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.connectButton,
          connectedDevice?.id === item.id && { backgroundColor: colors.glass, borderColor: colors.accent, borderWidth: 1 },
        ]}
        onPress={() => (connectedDevice?.id === item.id ? disconnect() : connect(item))}
        disabled={!!connectingId && connectingId !== item.id}
      >
        {connectingId === item.id ? (
          <ActivityIndicator color={colors.darkBg} />
        ) : (
          <Text style={[styles.connectText, connectedDevice?.id === item.id && { color: colors.accent }]}>
            {connectedDevice?.id === item.id ? 'Déconnecter' : 'Connecter'}
          </Text>
        )}
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.darkBg }} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>QC Band</Text>
          <Text style={styles.subtitle}>Scanner et connecter votre bague/bracelet</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={scan} disabled={scanning}>
          {scanning ? (
            <ActivityIndicator color={colors.darkBg} />
          ) : (
            <>
              <Ionicons name="search" size={18} color={colors.darkBg} style={{ marginRight: 8 }} />
              <Text style={styles.primaryText}>Scanner / Rescanner</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryButton, !connectedDevice && styles.secondaryDisabled]}
          onPress={refreshData}
          disabled={!connectedDevice || dataLoading}
        >
          {dataLoading ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <Ionicons name="refresh" size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
              <Text style={[styles.secondaryText]}>Rafraîchir données</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton]} onPress={disconnect}>
          <Ionicons name="close-circle-outline" size={18} color={colors.textPrimary} style={{ marginRight: 8 }} />
          <Text style={[styles.secondaryText]}>Déconnecter</Text>
        </TouchableOpacity>
      </View>

      <Card variant="glass" size="md" contentStyle={styles.statusCard}>
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={styles.metricLabel}>Etat du bracelet</Text>
          <Text style={styles.statusValue}>
            {connectedDevice ? `Connecté à ${connectedDevice.name ?? 'QC Band'}` : 'Non connecté'}
          </Text>
          <Text style={styles.deviceId}>{connectedDevice?.id}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={styles.metricLabel}>Batterie</Text>
          <Text style={styles.metricValue}>
            {battery
              ? `${formatBatteryPercent(battery.level) ?? '?'}% ${battery.charging ? '⚡️' : ''}`
              : '—'}
          </Text>
        </View>
      </Card>

      {lastSeenDevice && (
        <Card variant="glass" size="md" contentStyle={styles.lastSeenCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.metricLabel}>Dernier appareil</Text>
            <Text style={styles.statusValue}>{lastSeenDevice.name ?? 'QC Band'}</Text>
            <Text style={styles.deviceId}>{lastSeenDevice.id}</Text>
          </View>
          <TouchableOpacity
            style={[styles.secondaryButton, { flex: 0 }]}
            onPress={connectLastSeen}
            disabled={!!connectingId}
          >
            {connectingId === lastSeenDevice.id ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={styles.secondaryText}>Connecter</Text>
            )}
          </TouchableOpacity>
        </Card>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun appareil détecté pour l’instant.</Text>
            <Text style={styles.emptyTextSmall}>
              Mettez le bracelet en mode appairage / redémarrez le bracelet / fermez l’app constructeur si elle est connectée.
            </Text>
          </View>
        }
      />

      <View style={styles.metrics}>
        <Card variant="glass" size="md" contentStyle={styles.metricCard}>
          <Text style={styles.metricLabel}>Batterie</Text>
          <Text style={styles.metricValue}>
            {battery
              ? `${formatBatteryPercent(battery.level) ?? '?'}% ${battery.charging ? '⚡️' : ''}`
              : '—'}
          </Text>
        </Card>
        <Card variant="glass" size="md" contentStyle={styles.metricCard}>
          <Text style={styles.metricLabel}>Pas (actuel)</Text>
          <Text style={styles.metricValue}>
            {steps ? `${steps.steps} pas · ${formatDistanceKm(steps.distanceM)} km` : '—'}
          </Text>
        </Card>
        <Card variant="glass" size="md" contentStyle={styles.metricCard}>
          <Text style={styles.metricLabel}>Fréquence cardiaque</Text>
          <Text style={styles.metricValue}>{hr ? `${hr} bpm` : '—'}</Text>
          <TouchableOpacity onPress={toggleHr} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>{hrRunning ? 'Arrêter' : 'Démarrer'}</Text>
          </TouchableOpacity>
        </Card>
      </View>

      <View style={styles.metrics}>
        <Card variant="glass" size="md" contentStyle={styles.metricCard}>
          <Text style={styles.metricLabel}>Stats du jour</Text>
          <Text style={styles.metricValue}>
            {todayStats
              ? `${todayStats.steps} pas · ${formatDistanceKm(todayStats.distanceM)} km · ${Math.round(
                  todayStats.calories,
                )} kcal · ${formatActiveMinutes(todayStats.timeMin)}`
              : '—'}
          </Text>
          <Text style={styles.disclaimer}>peut avoir jusqu’à 15min de décalage (SDK)</Text>
        </Card>
        <Card variant="glass" size="md" contentStyle={styles.metricCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.metricLabel}>Historique</Text>
            <TouchableOpacity onPress={() => setShowHistory((prev) => !prev)}>
              <Text style={styles.smallButtonText}>{showHistory ? 'Masquer' : 'Afficher'}</Text>
            </TouchableOpacity>
          </View>
          {showHistory ? (
            history.length === 0 ? (
              <Text style={styles.metricValue}>—</Text>
            ) : (
              history.slice(0, 5).map((h) => (
                <Text key={h.startAtUnix} style={styles.historyLine}>
                  {new Date(h.startAtUnix * 1000).toLocaleString()} · {formatDistanceKm(h.distanceM)} km ·{' '}
                  {h.calories ?? 0} kcal · {formatActiveMinutes((h.durationS ?? 0) / 60)}
                </Text>
              ))
            )
          ) : (
            <Text style={styles.metricValue}>—</Text>
          )}
          <TouchableOpacity onPress={fetchHistory} style={styles.smallButton}>
            <Text style={styles.smallButtonText}>Rafraîchir historique</Text>
          </TouchableOpacity>
        </Card>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
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
      fontSize: theme.typography.sizes.h5,
      fontFamily: theme.typography.fonts.bold,
      color: colors.textPrimary,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.regular,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      gap: 8,
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      padding: 12,
      borderRadius: 12,
    },
    primaryText: {
      color: colors.darkBg,
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fonts.bold,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    secondaryDisabled: {
      opacity: 0.6,
    },
    secondaryText: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fonts.medium,
    },
    list: {
      padding: 16,
      gap: 8,
    },
    empty: {
      padding: 16,
      alignItems: 'center',
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fonts.medium,
    },
    deviceCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    deviceName: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fonts.bold,
      marginBottom: 4,
    },
    deviceId: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.regular,
    },
    rssi: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.regular,
    },
    connectButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
    },
    connectText: {
      color: colors.darkBg,
      fontSize: theme.typography.sizes.base,
      fontFamily: theme.typography.fonts.bold,
    },
    metrics: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    metricCard: {
      flex: 1,
      gap: 6,
      minWidth: '45%',
    },
    metricLabel: {
      color: colors.textSecondary,
      textTransform: 'uppercase',
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.medium,
    },
    metricValue: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.h5,
      fontFamily: theme.typography.fonts.bold,
    },
    disclaimer: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.regular,
    },
    smallButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.glass,
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    smallButtonText: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.medium,
    },
    statusCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 8,
    },
    lastSeenCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 8,
      gap: 12,
    },
    statusValue: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.lg,
      fontFamily: theme.typography.fonts.bold,
    },
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    historyLine: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.regular,
    },
    emptyTextSmall: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.regular,
      marginTop: 4,
    },
  });
