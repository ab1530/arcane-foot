import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { readDeviceFiles, syncDeviceFileToBackend } from '../../services/ble/actionTracerBle';
import type { DeviceFile } from '../../services/hardware/bleProtocol';
import type { AppStackParamList } from '../../types/navigation';
import { theme } from '../../design/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { showError, showSuccess } from '../../services/toast';

type Navigation = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'ImportGpsSession'>;

const mmddToLabel = (mmdd: number) => {
  const month = Math.floor(mmdd / 100);
  const day = mmdd % 100;
  return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}`;
};

const formatDuration = (startMs: number, endMs: number) => {
  const delta = Math.max(endMs - startMs, 0);
  const minutes = Math.floor(delta / 60000);
  const seconds = Math.floor((delta % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
};

export const ImportGpsSessionScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const playerId = user?.playerId;
  const { deviceId, deviceName } = route.params;

  const [files, setFiles] = useState<DeviceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await readDeviceFiles(deviceId);
      setFiles(result.filter((f) => f.state === 'completed'));
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors du chargement des séances');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleImport = async (file: DeviceFile) => {
    if (!playerId && user?.role !== 'PLAYER') {
      showError('Profil joueur introuvable');
      return;
    }
    try {
      setSyncingId(file.id);
      await syncDeviceFileToBackend(playerId, deviceId, file);
      showSuccess('Séance importée avec succès');
      navigation.navigate('HardwareSessions');
    } catch (err: any) {
      showError(err?.message ?? 'Import impossible');
    } finally {
      setSyncingId(null);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Importer une séance</Text>
      <Text style={styles.subtitle}>{deviceName || deviceId}</Text>

      {loading && (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loaderText}>Récupération des séances…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFiles}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && files.length === 0 && !error && (
        <Text style={styles.emptyText}>Aucune séance disponible.</Text>
      )}

      <FlatList
        data={files}
        keyExtractor={(item) => `${item.id}`}
        style={{ marginTop: 12 }}
        renderItem={({ item }) => (
          <View style={styles.fileCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileTitle}>Séance #{item.id}</Text>
              <Text style={styles.fileSubtitle}>
                {mmddToLabel(item.startDateMmdd)} ({formatDuration(item.startTimeMsUtc, item.endTimeMsUtc)})
              </Text>
              <Text style={styles.fileMeta}>Samples: {item.length}</Text>
            </View>
            <TouchableOpacity
              style={[styles.importButton, syncingId === item.id && styles.importButtonDisabled]}
              onPress={() => handleImport(item)}
              disabled={syncingId === item.id}
            >
              {syncingId === item.id ? (
                <ActivityIndicator color={colors.darkBg} />
              ) : (
                <Text style={styles.importText}>Importer</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: colors.darkBg,
    },
    title: {
      fontSize: theme.typography.sizes.h3,
      fontFamily: theme.typography.fonts.bold,
      color: colors.textPrimary,
    },
    subtitle: {
      color: colors.textSecondary,
      marginBottom: 12,
    },
    loaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: 12,
    },
    loaderText: {
      color: colors.textSecondary,
    },
    errorBox: {
      backgroundColor: colors.error + '22',
      borderColor: colors.error,
      borderWidth: 1,
      padding: 12,
      borderRadius: 12,
      marginVertical: 12,
    },
    errorText: {
      color: colors.error,
      marginBottom: 8,
    },
    retryButton: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.accent,
    },
    retryText: {
      color: colors.darkBg,
      fontFamily: theme.typography.fonts.bold,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    fileCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.glass,
      borderColor: colors.glassBorder,
      borderWidth: 1,
      marginBottom: 10,
      gap: 12,
    },
    fileTitle: {
      color: colors.textPrimary,
      fontFamily: theme.typography.fonts.bold,
    },
    fileSubtitle: {
      color: colors.textSecondary,
    },
    fileMeta: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
    },
    importButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    importButtonDisabled: {
      opacity: 0.7,
    },
    importText: {
      color: colors.darkBg,
      fontFamily: theme.typography.fonts.bold,
    },
  });
