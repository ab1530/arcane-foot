import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Haptics from 'expo-haptics';
import passportService from '../../services/passportService';
import { colors, spacing, typography, radius } from '../../design/theme';
import { GlassCard, Icon, GradientText } from '../../components/ui';
import { logError } from '../../utils/logger';

export default function PassportPreviewScreen({ navigation, route }: any) {
  const playerId = route?.params?.playerId as string;
  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = await passportService.getPassportByPlayer(playerId, false);
      setPassport(p);
    } catch (e: any) {
      // Create if missing
      if (e?.response?.status === 404 || String(e?.message || '').includes('404')) {
        try {
          await passportService.createPassport({ playerId });
          const p2 = await passportService.getPassportByPlayer(playerId, false);
          setPassport(p2);
        } catch (e2) {
          // If the passport was created by another request between our GET and POST,
          // treat it as non-fatal and just refetch.
          if (e2?.response?.status === 400 && String(e2?.response?.data?.message || '').includes('already has a passport')) {
            const p2 = await passportService.getPassportByPlayer(playerId, false);
            setPassport(p2);
            return;
          }
          logError('Failed to create passport', e2);
          throw e2;
        }
      } else {
        throw e;
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch((e: any) => {
      logError('Failed to load passport preview', e);
      Alert.alert('Erreur', e?.message ?? 'Impossible de charger le passeport');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const player = passport?.player ?? passport?.players ?? null;

  const playerName = useMemo(() => {
    const u = player?.user ?? player?.users ?? null;
    const first = u?.firstName ?? player?.firstName ?? '';
    const last = u?.lastName ?? player?.lastName ?? '';
    return `${first} ${last}`.trim() || 'Passeport joueur';
  }, [player]);

  const qrValue = useMemo(() => {
    const token = passport?.token ?? passport?.publicToken;
    if (!token) return null;
    return passportService.generateQRCodeValue(token);
  }, [passport]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.goBack();
          }}
        >
          <Icon name="arrowBack" size="md" color={colors.text.primary} />
        </TouchableOpacity>
        <GradientText variant="arcane" style={styles.title}>
          Passeport
        </GradientText>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loaderText}>Chargement…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard variant="elevated" style={styles.card}>
            <Text style={styles.name}>{playerName}</Text>
            <Text style={styles.meta}>
              {player?.position ?? '—'} • {player?.nationality ?? '—'} • {player?.clubs?.name ?? player?.club?.name ?? 'Libre'}
            </Text>

            {qrValue ? (
              <View style={styles.qrBox}>
                <QRCode
                  value={qrValue}
                  size={220}
                  color={colors.background.primary}
                  backgroundColor="white"
                />
                <Text style={styles.token}>
                  Token: {(passport?.token ?? passport?.publicToken ?? '').slice(0, 12)}…
                </Text>
              </View>
            ) : (
              <Text style={styles.warning}>Token manquant (impossible d’afficher le QR)</Text>
            )}
          </GlassCard>
        </ScrollView>
      )}
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
  title: { flex: 1, fontSize: typography.sizes.lg, fontWeight: '900' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loaderText: { color: colors.text.secondary },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
  card: { padding: spacing.lg },
  name: { color: colors.text.primary, fontWeight: '900', fontSize: typography.sizes.lg },
  meta: { color: colors.text.secondary, marginTop: 4 },
  qrBox: {
    marginTop: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
  },
  token: { color: colors.text.secondary, fontSize: typography.sizes.xs },
  warning: { marginTop: spacing.lg, color: colors.semantic.warning },
});
