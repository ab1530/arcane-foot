import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import {
  createLabVirtualDeviceFile,
  type LabPresetMinutes,
  readDeviceFiles,
  syncDeviceFileToBackend,
} from '../../services/ble/actionTracerBle';
import type { DeviceFile } from '../../services/hardware/bleProtocol';
import type { HardwareSessionType } from '../../types/hardware';
import type { AppStackParamList } from '../../types/navigation';
import { theme } from '../../design/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { showError, showSuccess } from '../../services/toast';

type Navigation = NativeStackNavigationProp<AppStackParamList>;
type Route = RouteProp<AppStackParamList, 'ImportGpsSession'>;

interface LabGeneratedFile {
  file: DeviceFile;
  presetMinutes: LabPresetMinutes;
}

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

const LAB_PRESETS: LabPresetMinutes[] = [20, 45, 90];

export const ImportGpsSessionScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const playerId = user?.playerId;
  const { deviceId, deviceName } = route.params;

  const [deviceFiles, setDeviceFiles] = useState<DeviceFile[]>([]);
  const [labGeneratedFiles, setLabGeneratedFiles] = useState<LabGeneratedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState<HardwareSessionType>(
    route.params.preselectedSessionType ?? 'match',
  );
  const [simulationMode, setSimulationMode] = useState<'off' | 'protocol'>(
    route.params.initialMode === 'lab' ? 'protocol' : 'off',
  );
  const [labPresetMinutes, setLabPresetMinutes] = useState<LabPresetMinutes>(
    route.params.initialLabPresetMinutes ?? 90,
  );

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await readDeviceFiles(deviceId);
      setDeviceFiles(result.filter((f) => f.state === 'completed'));
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors du chargement des séances');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleGenerateLabFile = useCallback(() => {
    const file = createLabVirtualDeviceFile(labPresetMinutes, 10);
    setLabGeneratedFiles((prev) => [{ file, presetMinutes: labPresetMinutes }, ...prev]);
    showSuccess(`Séance LAB ${labPresetMinutes} min générée`);
  }, [labPresetMinutes]);

  const handleImport = async (
    file: DeviceFile,
    options?: { isLabGenerated?: boolean; presetMinutes?: LabPresetMinutes },
  ) => {
    if (!playerId && user?.role !== 'PLAYER') {
      showError('Profil joueur introuvable');
      return;
    }

    const isLab = options?.isLabGenerated ?? false;
    const key = `${isLab ? 'lab' : 'device'}-${file.id}`;

    try {
      setSyncingKey(key);
      await syncDeviceFileToBackend(playerId, deviceId, file, {
        sessionType,
        simulationMode: isLab ? 'protocol' : 'off',
        labOptions: isLab
          ? {
              presetMinutes: options?.presetMinutes ?? labPresetMinutes,
              hz: 10,
              profile: 'winger',
              sourceLabel: 'ACTION_MARK_LAB',
              isLabGenerated: true,
            }
          : undefined,
        matchContext:
          sessionType === 'match'
            ? {
                matchLabel: isLab
                  ? `LAB Winger ${options?.presetMinutes ?? labPresetMinutes}min`
                  : `ActionTracker file #${file.id}`,
              }
            : undefined,
      });
      showSuccess('Séance importée avec succès');
      navigation.navigate('HardwareSessions');
    } catch (err: any) {
      showError(err?.message ?? 'Import impossible');
    } finally {
      setSyncingKey(null);
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Importer une séance</Text>
      <Text style={styles.subtitle}>{deviceName || deviceId}</Text>

      <View style={styles.selectorGroup}>
        <Text style={styles.selectorLabel}>Catégorie</Text>
        <View style={styles.selectorRow}>
          {(['match', 'training', 'test'] as HardwareSessionType[]).map((type) => {
            const selected = sessionType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[styles.selectorChip, selected && styles.selectorChipActive]}
                onPress={() => setSessionType(type)}
                disabled={loading || syncingKey !== null}
              >
                <Text
                  style={[
                    styles.selectorChipText,
                    selected && styles.selectorChipTextActive,
                  ]}
                >
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.selectorGroup}>
        <Text style={styles.selectorLabel}>Mode import</Text>
        <View style={styles.selectorRow}>
          <TouchableOpacity
            style={[
              styles.selectorChip,
              simulationMode === 'off' && styles.selectorChipActive,
            ]}
            onPress={() => setSimulationMode('off')}
            disabled={loading || syncingKey !== null}
          >
            <Text
              style={[
                styles.selectorChipText,
                simulationMode === 'off' && styles.selectorChipTextActive,
              ]}
            >
              DEVICE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.selectorChip,
              simulationMode === 'protocol' && styles.selectorChipActive,
            ]}
            onPress={() => setSimulationMode('protocol')}
            disabled={loading || syncingKey !== null}
          >
            <Text
              style={[
                styles.selectorChipText,
                simulationMode === 'protocol' && styles.selectorChipTextActive,
              ]}
            >
              LAB (WINGER)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {simulationMode === 'protocol' && (
        <View style={styles.labPanel}>
          <Text style={styles.sectionTitle}>LAB Generator</Text>
          <Text style={styles.sectionHint}>
            Génère une séance ailier crédible (20/45/90 min) via le pipeline protocolaire.
          </Text>
          <View style={styles.selectorRow}>
            {LAB_PRESETS.map((preset) => {
              const selected = preset === labPresetMinutes;
              return (
                <TouchableOpacity
                  key={preset}
                  style={[styles.selectorChip, selected && styles.selectorChipActive]}
                  onPress={() => setLabPresetMinutes(preset)}
                  disabled={loading || syncingKey !== null}
                >
                  <Text
                    style={[
                      styles.selectorChipText,
                      selected && styles.selectorChipTextActive,
                    ]}
                  >
                    {preset} MIN
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateLabFile}
            disabled={loading || syncingKey !== null}
          >
            <Text style={styles.generateButtonText}>Générer séance LAB</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {simulationMode === 'protocol' && (
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Séances LAB prêtes à importer</Text>
          {labGeneratedFiles.length === 0 ? (
            <Text style={styles.emptyText}>Aucune séance LAB générée.</Text>
          ) : (
            labGeneratedFiles.map((entry) => {
              const key = `lab-${entry.file.id}`;
              return (
                <View key={key} style={styles.fileCard}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.fileHeaderRow}>
                      <Text style={styles.fileTitle}>LAB Winger #{entry.file.id}</Text>
                      <View style={styles.labBadge}>
                        <Text style={styles.labBadgeText}>LAB</Text>
                      </View>
                    </View>
                    <Text style={styles.fileSubtitle}>
                      {mmddToLabel(entry.file.startDateMmdd)} (
                      {formatDuration(entry.file.startTimeMsUtc, entry.file.endTimeMsUtc)})
                    </Text>
                    <Text style={styles.fileMeta}>
                      Preset: {entry.presetMinutes} min · Samples: {entry.file.length}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.importButton,
                      syncingKey === key && styles.importButtonDisabled,
                    ]}
                    onPress={() =>
                      handleImport(entry.file, {
                        isLabGenerated: true,
                        presetMinutes: entry.presetMinutes,
                      })
                    }
                    disabled={syncingKey === key}
                  >
                    {syncingKey === key ? (
                      <ActivityIndicator color={colors.darkBg} />
                    ) : (
                      <Text style={styles.importText}>Importer</Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      )}

      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Séances device réelles</Text>
        {!loading && deviceFiles.length === 0 && !error && (
          <Text style={styles.emptyText}>Aucune séance réelle disponible.</Text>
        )}

        <FlatList
          data={deviceFiles}
          keyExtractor={(item) => `device-${item.id}`}
          style={{ marginTop: 8 }}
          renderItem={({ item }) => {
            const key = `device-${item.id}`;
            return (
              <View style={styles.fileCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fileTitle}>Séance #{item.id}</Text>
                  <Text style={styles.fileSubtitle}>
                    {mmddToLabel(item.startDateMmdd)} (
                    {formatDuration(item.startTimeMsUtc, item.endTimeMsUtc)})
                  </Text>
                  <Text style={styles.fileMeta}>Samples: {item.length}</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.importButton,
                    syncingKey === key && styles.importButtonDisabled,
                  ]}
                  onPress={() => handleImport(item, { isLabGenerated: false })}
                  disabled={syncingKey === key}
                >
                  {syncingKey === key ? (
                    <ActivityIndicator color={colors.darkBg} />
                  ) : (
                    <Text style={styles.importText}>Importer</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
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
      marginBottom: 10,
    },
    selectorGroup: {
      marginBottom: 10,
    },
    selectorLabel: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
      marginBottom: 6,
      textTransform: 'uppercase',
    },
    selectorRow: {
      flexDirection: 'row',
      gap: 8,
      flexWrap: 'wrap',
    },
    selectorChip: {
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    selectorChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    selectorChipText: {
      color: colors.textPrimary,
      fontSize: theme.typography.sizes.caption,
      fontFamily: theme.typography.fonts.bold,
    },
    selectorChipTextActive: {
      color: colors.darkBg,
    },
    labPanel: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      borderRadius: 12,
      backgroundColor: colors.glass,
      padding: 12,
      gap: 8,
    },
    sectionTitle: {
      color: colors.textPrimary,
      fontFamily: theme.typography.fonts.bold,
      fontSize: theme.typography.sizes.base,
    },
    sectionHint: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
    },
    generateButton: {
      marginTop: 4,
      alignSelf: 'flex-start',
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    generateButtonText: {
      color: colors.darkBg,
      fontFamily: theme.typography.fonts.bold,
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
    listSection: {
      marginTop: 8,
    },
    emptyText: {
      color: colors.textSecondary,
      marginTop: 8,
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
    fileHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    labBadge: {
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: colors.accent,
    },
    labBadgeText: {
      color: colors.darkBg,
      fontFamily: theme.typography.fonts.bold,
      fontSize: 10,
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
