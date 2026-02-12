import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { Video, ResizeMode } from 'expo-av';

import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, radius } from '../../design/theme';
import { GlassCard, Icon, GradientText } from '../../components/ui';
import { DEFAULT_ROLE } from '../../lib/roles';
import type { UserRole } from '../../lib/roles';
import { logError } from '../../utils/logger';

type MediaItem = {
  id: string;
  type: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  duration?: number | null;
  uploadedAt?: string;
  playerId?: string | null;
};

const MAX_VIDEOS = 3;
const MAX_DURATION_SEC = 180;
const MAX_UPLOAD_BYTES = 250 * 1024 * 1024; // client-side guard for slow networks

const formatBytes = (bytes?: number | null) => {
  if (!bytes && bytes !== 0) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
};

export default function PlayerHighlightsScreen({ navigation, route }: any) {
  const playerId = route?.params?.playerId as string;
  const mode = (route?.params?.mode as 'owner' | 'adminView' | undefined) ?? 'owner';

  const { user, activeRole } = useAuth();
  const effectiveRole = (activeRole ?? user?.role ?? DEFAULT_ROLE) as UserRole;
  const isAdminRole = effectiveRole === 'ADMIN' || effectiveRole === 'SUPER_ADMIN';
  const isOwner = effectiveRole === 'PLAYER' && user?.playerId && user.playerId === playerId;
  const canEdit = isAdminRole || isOwner;

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);

  const videos = useMemo(
    () => items.filter((m) => String(m.type).toUpperCase() === 'VIDEO'),
    [items],
  );

  const load = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    try {
      const res = await (api as any).getPlayerMedia(playerId);
      const list = Array.isArray(res) ? res : [];
      setItems(list as MediaItem[]);
    } catch (e) {
      logError('Failed to load player media', e);
      Alert.alert('Erreur', "Impossible de charger les vidéos");
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  const pickAndUpload = useCallback(async () => {
    if (!canEdit) return;
    if (videos.length >= MAX_VIDEOS) {
      Alert.alert('Limite atteinte', `Maximum ${MAX_VIDEOS} vidéos.`);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // expo-image-picker is a native module. If you're using a custom dev client,
    // you must rebuild after adding it; otherwise app will crash at startup if imported eagerly.
    // We lazy-load it to keep the app usable for the demo even if the native module isn't present yet.
    let ImagePicker: any;
    try {
      ImagePicker = await import('expo-image-picker');
    } catch (e) {
      logError('expo-image-picker missing', e);
      Alert.alert(
        'Upload vidéo indisponible',
        "Le module natif expo-image-picker n'est pas présent dans cette build iOS. Rebuild le dev-client (ou utilise Expo Go) pour activer l'upload vidéo.",
      );
      return;
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', "Autorise l’accès à la galerie pour sélectionner une vidéo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
    });

    if ((result as any).canceled) return;
    const asset = (result as any).assets?.[0];
    const uri: string | undefined = asset?.uri;
    if (!uri) return;

    const durationRaw: number | undefined = asset?.duration;
    const durationSec =
      typeof durationRaw === 'number'
        ? durationRaw > 1000
          ? Math.round(durationRaw / 1000)
          : Math.round(durationRaw)
        : null;

    if (durationSec != null && durationSec > MAX_DURATION_SEC) {
      Alert.alert(
        'Vidéo trop longue',
        `Durée max ${MAX_DURATION_SEC / 60} min. Ta vidéo fait ${Math.ceil(durationSec / 60)} min.`,
      );
      return;
    }

    try {
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      const size = (info as any)?.size as number | undefined;
      if (typeof size === 'number' && size > MAX_UPLOAD_BYTES) {
        Alert.alert('Fichier trop lourd', `Taille max ${formatBytes(MAX_UPLOAD_BYTES)}.`);
        return;
      }
    } catch {
      // ignore, we can still try upload
    }

    setUploading(true);
    try {
      await (api as any).uploadPlayerHighlightVideo({
        playerId,
        uri,
        mimeType: asset?.mimeType ?? 'video/mp4',
        name: asset?.fileName ?? `highlight-${Date.now()}.mp4`,
      });
      await load();
    } catch (e: any) {
      logError('Failed to upload highlight video', e);
      Alert.alert('Erreur', e?.message ?? "Impossible d’uploader la vidéo");
    } finally {
      setUploading(false);
    }
  }, [canEdit, load, playerId, videos.length]);

  const confirmDelete = useCallback(
    (mediaId: string) => {
      if (!canEdit) return;
      Alert.alert('Supprimer', 'Supprimer cette vidéo ?', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            try {
              await (api as any).deleteMedia(mediaId);
              await load();
            } catch (e: any) {
              logError('Failed to delete media', e);
              Alert.alert('Erreur', e?.message ?? "Impossible de supprimer");
            }
          },
        },
      ]);
    },
    [canEdit, load],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrowBack" size="md" color={colors.text.primary} />
        </TouchableOpacity>
        <GradientText variant="arcane" style={styles.title}>
          Vidéos
        </GradientText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GlassCard variant="elevated" style={styles.card}>
          <Text style={styles.meta}>
            {videos.length}/{MAX_VIDEOS} vidéos • max {MAX_DURATION_SEC / 60} min
          </Text>
          <TouchableOpacity
            style={[
              styles.uploadBtn,
              (!canEdit || uploading || videos.length >= MAX_VIDEOS) && styles.btnDisabled,
            ]}
            onPress={pickAndUpload}
            disabled={!canEdit || uploading || videos.length >= MAX_VIDEOS}
            activeOpacity={0.9}
          >
            {uploading ? (
              <ActivityIndicator color={colors.background.primary} />
            ) : (
              <Text style={styles.uploadBtnText}>
                {canEdit ? 'Uploader une vidéo' : 'Lecture seule'}
              </Text>
            )}
          </TouchableOpacity>
          {mode === 'adminView' && !canEdit ? (
            <Text style={[styles.meta, { marginTop: spacing.sm }]}>
              Accès lecture seule.
            </Text>
          ) : null}
        </GlassCard>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={styles.loaderText}>Chargement…</Text>
          </View>
        ) : videos.length === 0 ? (
          <GlassCard variant="bordered" style={styles.card}>
            <Text style={styles.empty}>Aucune vidéo pour le moment.</Text>
          </GlassCard>
        ) : (
          <View style={styles.list}>
            {videos.slice(0, MAX_VIDEOS).map((v) => (
              <GlassCard key={v.id} variant="bordered" style={styles.card}>
                <View style={styles.videoHeader}>
                  <Text style={styles.videoTitle}>{v.filename || 'Highlight'}</Text>
                  {canEdit ? (
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(v.id)}
                      activeOpacity={0.9}
                    >
                      <Icon name="delete" size="sm" color={colors.semantic.error} />
                      <Text style={styles.deleteText}>Supprimer</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={styles.videoBox}>
                  <Video
                    source={{ uri: v.url }}
                    style={styles.video}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                    isLooping={false}
                  />
                </View>

                <Text style={styles.videoMeta}>
                  {formatBytes(v.size)} • {v.uploadedAt ? new Date(v.uploadedAt).toLocaleString('fr-FR') : '—'}
                </Text>
              </GlassCard>
            ))}
          </View>
        )}
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
  title: { flex: 1, fontSize: typography.sizes.lg, fontWeight: '900' },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg },
  card: { padding: spacing.lg },
  meta: { color: colors.text.secondary, fontSize: typography.sizes.xs, fontWeight: '700' },
  uploadBtn: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnText: { color: colors.background.primary, fontWeight: '900' },
  btnDisabled: { opacity: 0.6 },
  loader: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loaderText: { color: colors.text.secondary },
  empty: { color: colors.text.secondary },
  list: { gap: spacing.lg },
  videoHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  videoTitle: { flex: 1, color: colors.text.primary, fontWeight: '900' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteText: { color: colors.semantic.error, fontWeight: '800', fontSize: typography.sizes.xs },
  videoBox: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surface.glass,
  },
  video: { width: '100%', height: 220 },
  videoMeta: { marginTop: spacing.sm, color: colors.text.secondary, fontSize: typography.sizes.xs },
});
