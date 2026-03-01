import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/navigation';
import { theme } from '../../design/theme';
import api from '../../services/api';

type ImportRow = {
  line: number;
  raw: string;
  action: 'CREATED' | 'UPDATED' | 'FAILED';
  playerId?: string;
  reason?: string;
};

type ImportResult = {
  created: number;
  updated: number;
  failed: number;
  rows: ImportRow[];
};

const EXAMPLE_TEXT = `Alidini Jasmin 2010 Saint Brice - ailier - droitier
Tenda mayeye Josue 2011 Issy - ailier - droitier
Walid Regragui Torcy - 2010 - Attaquant`;

export default function ScoutQuickImportScreen() {
  const [rawText, setRawText] = useState('');
  const [defaultNationality, setDefaultNationality] = useState('FR');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const summaryLabel = useMemo(() => {
    if (!result) return null;
    return `Crees: ${result.created} | Mis a jour: ${result.updated} | Erreurs: ${result.failed}`;
  }, [result]);

  const runImport = async (dryRun: boolean) => {
    const payloadText = rawText.trim();
    if (!payloadText) {
      Alert.alert('Import rapide', 'Colle au moins une ligne de joueur.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.importScoutPlayers({
        rawText: payloadText,
        dryRun,
        defaultNationality: defaultNationality.trim().toUpperCase() || 'FR',
      });
      setResult(response);

      if (!dryRun) {
        Alert.alert(
          'Import termine',
          `Crees: ${response.created}\nMis a jour: ${response.updated}\nErreurs: ${response.failed}`,
        );
      }
    } catch (error: any) {
      const message = error?.response?.data?.message;
      const fallback = Array.isArray(message) ? message.join('\n') : message || 'Import impossible';
      Alert.alert('Import rapide', fallback);
    } finally {
      setLoading(false);
    }
  };

  const getRowColor = (action: ImportRow['action']) => {
    if (action === 'CREATED') return '#1FD8A4';
    if (action === 'UPDATED') return '#b3afb2';
    return '#FF6B6B';
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScreenHeader title="Import rapide" showBackButton />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Ajout scout depuis texte</Text>
          <Text style={styles.subtitle}>
            Colle une liste multi-lignes. Le parser cree ou met a jour les joueurs automatiquement.
          </Text>

          <View style={styles.card}>
            <Text style={styles.label}>Nationalite par defaut (ISO2)</Text>
            <TextInput
              value={defaultNationality}
              onChangeText={setDefaultNationality}
              autoCapitalize="characters"
              maxLength={2}
              style={styles.inlineInput}
              placeholder="FR"
              placeholderTextColor={theme.colors.text.tertiary}
            />

            <Text style={styles.label}>Bloc texte joueurs</Text>
            <TextInput
              multiline
              value={rawText}
              onChangeText={setRawText}
              style={styles.textArea}
              placeholder={EXAMPLE_TEXT}
              placeholderTextColor={theme.colors.text.tertiary}
              textAlignVertical="top"
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => runImport(true)}
                disabled={loading}
              >
                <Text style={styles.secondaryButtonText}>Previsualiser</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={() => runImport(false)}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>Importer</Text>
              </TouchableOpacity>
            </View>
            {loading && <ActivityIndicator size="small" color={theme.colors.brand.primary} />}
          </View>

          {result && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Resultat</Text>
              {summaryLabel && <Text style={styles.summary}>{summaryLabel}</Text>}

              {result.rows.map((row, index) => (
                <View key={`${row.line}-${index}`} style={styles.rowItem}>
                  <View style={styles.rowHeader}>
                    <Text style={styles.rowLine}>Ligne {row.line}</Text>
                    <Text style={[styles.rowAction, { color: getRowColor(row.action) }]}> 
                      {row.action}
                    </Text>
                  </View>
                  <Text style={styles.rowRaw}>{row.raw}</Text>
                  {row.reason ? <Text style={styles.rowReason}>{row.reason}</Text> : null}
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 12,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: theme.colors.surface.glass,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  label: {
    color: theme.colors.text.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  inlineInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glassLight,
    color: theme.colors.text.primary,
    paddingHorizontal: 12,
    fontWeight: '600',
    maxWidth: 84,
  },
  textArea: {
    minHeight: 180,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glassLight,
    color: theme.colors.text.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.brand.primary,
  },
  primaryButtonText: {
    color: theme.colors.background.primary,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
    backgroundColor: theme.colors.surface.glassLight,
  },
  secondaryButtonText: {
    color: theme.colors.text.primary,
    fontWeight: '600',
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  summary: {
    color: theme.colors.text.secondary,
    fontSize: 13,
  },
  rowItem: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.borderLight,
    paddingTop: 10,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLine: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  rowAction: {
    fontSize: 12,
    fontWeight: '700',
  },
  rowRaw: {
    color: theme.colors.text.primary,
    fontSize: 13,
  },
  rowReason: {
    color: '#FF6B6B',
    fontSize: 12,
  },
});
