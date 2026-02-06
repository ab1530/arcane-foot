import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { scanForActionTracerDevices, connectToActionTracer } from '../../services/ble/actionTracerBle';
import type { AppStackParamList } from '../../types/navigation';
import { theme } from '../../design/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { showError, showSuccess } from '../../services/toast';
import { logBridge } from '../../logging/expoLogBridge';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export const ConnectGpsTrackerScreen: React.FC = () => {
  const navigation = useNavigation<Navigation>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<{ id: string; name?: string }[]>([]);

  const handleScan = async () => {
    try {
      setLoading(true);
      const result = await scanForActionTracerDevices();
      setDevices(result);
      logBridge.info(`[GPS][ACTION_TRACER] scan UI success (${result.length})`, 'DATA');
      showSuccess(`Scan réussi (${result.length} appareil${result.length > 1 ? 's' : ''})`);
    } catch (err: any) {
      logBridge.error(`[GPS][ACTION_TRACER] scan UI error ${err?.message ?? err}`, 'DATA');
      showError(err?.message ?? 'Scan échoué');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (deviceId: string, deviceName?: string) => {
    try {
      setLoading(true);
      await connectToActionTracer(deviceId);
      logBridge.info(`[GPS][ACTION_TRACER] connect UI success ${deviceId}`, 'DATA');
      showSuccess('GPS connecté');
      navigation.navigate('ImportGpsSession', { deviceId, deviceName });
    } catch (err: any) {
      logBridge.error(`[GPS][ACTION_TRACER] connect UI error ${err?.message ?? err}`, 'DATA');
      showError(err?.message ?? 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connecter mon GPS</Text>
      <Text style={styles.subtitle}>Scannez votre capteur ActionMark pour importer une séance.</Text>

      <TouchableOpacity style={styles.primaryButton} onPress={handleScan} disabled={loading}>
        {loading ? (
          <ActivityIndicator color={colors.darkBg} />
        ) : (
          <Text style={styles.primaryButtonText}>Scanner mon GPS</Text>
        )}
      </TouchableOpacity>

      {loading && devices.length === 0 && (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={colors.accent} />
          <Text style={styles.loaderText}>Scan en cours…</Text>
        </View>
      )}

      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 16 }}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>Aucun appareil détecté pour l'instant.</Text> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.deviceRow} onPress={() => handleConnect(item.id, item.name)} disabled={loading}>
            <View>
              <Text style={styles.deviceName}>{item.name ?? 'ActionMark'}</Text>
              <Text style={styles.deviceId}>{item.id}</Text>
            </View>
            <Text style={styles.connectText}>Se connecter</Text>
          </TouchableOpacity>
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
      marginTop: 4,
      color: colors.textSecondary,
    },
    primaryButton: {
      marginTop: 16,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
      fontFamily: theme.typography.fonts.bold,
      color: colors.darkBg,
    },
    loaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },
    loaderText: {
      color: colors.textSecondary,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 12,
    },
    deviceRow: {
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.glass,
      borderColor: colors.glassBorder,
      borderWidth: 1,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    deviceName: {
      color: colors.textPrimary,
      fontFamily: theme.typography.fonts.bold,
    },
    deviceId: {
      color: colors.textSecondary,
      fontSize: theme.typography.sizes.caption,
    },
    connectText: {
      color: colors.accent,
      fontFamily: theme.typography.fonts.bold,
    },
  });
