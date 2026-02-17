import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, typography, radius } from '../../design/theme';
import { GlassCard, Icon, GradientText } from '../../components/ui';
import { DEFAULT_ROLE } from '../../lib/roles';
import type { UserRole } from '../../lib/roles';
import { logError, logInfo, logWarn } from '../../utils/logger';

type MediaItem = {
  id: string;
  type: string;
  url: string;
  playbackUrl?: string;
  playbackExpiresAt?: string;
  filename: string;
  mimeType: string;
  size: number;
  duration?: number | null;
  uploadedAt?: string;
  playerId?: string | null;
};

const MAX_VIDEOS = 3;
const MAX_DURATION_SEC = 180;
const MAX_UPLOAD_BYTES = 250 * 1024 * 1024;

const formatBytes = (bytes?: number | null) => {
  if (!bytes && bytes !== 0) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb.toFixed(0)} MB`;
};

const formatDuration = (seconds?: number | null) => {
  if (!seconds || seconds <= 0) return null;
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const decodeFileName = (filename?: string | null) => {
  if (!filename) return 'Highlight';
  const plusReplaced = filename.replace(/\+/g, ' ');
  try {
    return decodeURIComponent(plusReplaced);
  } catch {
    return plusReplaced;
  }
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
  const [refreshingPlayback, setRefreshingPlayback] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [videoErrors, setVideoErrors] = useState<Record<string, string>>({});

  const retryByMediaRef = useRef<Record<string, boolean>>({});

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
      setVideoErrors((prev) => {
        const validIds = new Set((list as MediaItem[]).map((item) => item.id));
        return Object.fromEntries(Object.entries(prev).filter(([mediaId]) => validIds.has(mediaId)));
      });
    } catch (e) {
      logError('Failed to load player media', e);
      Alert.alert('Erreur', 'Impossible de charger les vidéos');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshPlaybackUrls = useCallback(() => {
    setRefreshingPlayback(true);
    void load().finally(() => setRefreshingPlayback(false));
  }, [load]);

  const handleVideoError = useCallback(
    (media: MediaItem, rawError: unknown) => {
      const errorMessage =
        typeof rawError === 'string'
          ? rawError
          : rawError instanceof Error
          ? rawError.message
          : JSON.stringify(rawError ?? 'unknown');

      setVideoErrors((prev) => ({
        ...prev,
        [media.id]: 'Lecture indisponible. Le lien a expiré, actualisation en cours…',
      }));

      logWarn('Player highlight playback failed', {
        mediaId: media.id,
        playerId,
        error: errorMessage,
      });

      if (retryByMediaRef.current[media.id]) {
        return;
      }

      retryByMediaRef.current[media.id] = true;
      refreshPlaybackUrls();
    },
    [playerId, refreshPlaybackUrls],
  );

  const pickAndUpload = useCallback(async () => {
    if (!canEdit) return;
    if (videos.length >= MAX_VIDEOS) {
      Alert.alert('Limite atteinte', `Maximum ${MAX_VIDEOS} vidéos.`);
      return;
    }

    logInfo('Player highlight upload started', { playerId, videosCount: videos.length });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

    logInfo('Player highlight image picker module loaded');

    let perm: { granted: boolean; accessPrivileges?: 'all' | 'limited' | 'none' } = { granted: false };
    try {
      if (typeof ImagePicker.getMediaLibraryPermissionsAsync === 'function') {
        perm = await ImagePicker.getMediaLibraryPermissionsAsync();
      }
      logInfo('Media library permission state', {
        granted: perm.granted,
        accessPrivileges: perm.accessPrivileges ?? 'unknown',
      });
      if (!perm.granted) {
        logWarn('Media permission not granted yet, requesting permission');
        perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        logInfo('Media library permission request result', {
          granted: perm.granted,
          accessPrivileges: perm.accessPrivileges ?? 'unknown',
        });
      }
    } catch (permissionError) {
      logError('Failed to request media library permission', permissionError);
      Alert.alert(
        'Permission impossible',
        "Impossible d'accéder aux permissions de galerie. Vérifie les réglages de l'application.",
      );
      return;
    }

    if (!perm.granted) {
      logWarn('Media library permission denied by user');
      Alert.alert('Permission requise', 'Autorise l’accès à la galerie pour sélectionner une vidéo.', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ouvrir réglages',
          onPress: () => {
            Linking.openSettings().catch((settingsError) => {
              logError('Failed to open app settings', settingsError);
            });
          },
        },
      ]);
      return;
    }

    logInfo('Media library permission granted');

    let result: any;
    try {
      const compatibleMode =
        ImagePicker.UIImagePickerPreferredAssetRepresentationMode?.Compatible ?? 'compatible';
      const mediumVideoPreset = ImagePicker.VideoExportPreset?.MediumQuality ?? 2;
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        preferredAssetRepresentationMode: compatibleMode,
        videoExportPreset: mediumVideoPreset,
        quality: 1,
      });
      logInfo('Video picker returned result', {
        canceled: !!result?.canceled,
        assetsCount: Array.isArray(result?.assets) ? result.assets.length : 0,
      });
    } catch (pickerError) {
      logError('Failed to open video picker', pickerError);
      const pickerMessage =
        pickerError instanceof Error
          ? pickerError.message
          : typeof pickerError === 'string'
          ? pickerError
          : JSON.stringify(pickerError);
      const isIos3164 =
        pickerMessage.includes('PHPhotosErrorDomain') && pickerMessage.includes('3164');

      if (isIos3164) {
        Alert.alert(
          'Conversion vidéo',
          'Vidéo non lisible en mode original, conversion compatible appliquée. Réessaie la sélection.',
        );
      } else {
        Alert.alert('Erreur', "Impossible d'ouvrir la galerie vidéo.");
      }
      return;
    }

    if ((result as any).canceled) {
      logInfo('Player highlight picker canceled by user');
      return;
    }

    const asset = (result as any).assets?.[0];
    const uri: string | undefined = asset?.uri;
    if (!uri) {
      logWarn('Video picker returned no URI');
      Alert.alert('Erreur', 'Aucune vidéo sélectionnée.');
      return;
    }

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
      // Ignore local file size check failure and continue upload attempt.
    }

    setUploading(true);
    try {
      logInfo('Uploading player highlight video', {
        playerId,
        fileName: asset?.fileName ?? null,
        mimeType: asset?.mimeType ?? null,
        durationSec,
      });
      await (api as any).uploadPlayerHighlightVideo({
        playerId,
        uri,
        mimeType: asset?.mimeType ?? 'video/mp4',
        name: asset?.fileName ?? `highlight-${Date.now()}.mp4`,
      });
      await load();
      logInfo('Player highlight upload completed', { playerId });
    } catch (e: any) {
      logError('Failed to upload highlight video', e);
      Alert.alert('Erreur', e?.message ?? 'Impossible d’uploader la vidéo');
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
              Alert.alert('Erreur', e?.message ?? 'Impossible de supprimer');
            }
          },
        },
      ]);
    },
    [canEdit, load],
  );

  const openVideo = useCallback(async (media: MediaItem) => {
    const targetUrl = media.playbackUrl ?? media.url;
    try {
      await Linking.openURL(targetUrl);
    } catch (error) {
      logError('Failed to open highlight video URL', error);
      Alert.alert('Erreur', 'Impossible d’ouvrir cette vidéo.');
    }
  }, []);

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
          <View style={styles.uploadHeaderRow}>
            <View>
              <Text style={styles.meta}>{`${videos.length}/${MAX_VIDEOS} vidéos`}</Text>
              <Text style={styles.subMeta}>{`Durée max ${MAX_DURATION_SEC / 60} min`}</Text>
            </View>
            {refreshingPlayback ? (
              <View style={styles.refreshBadge}>
                <ActivityIndicator size="small" color={colors.brand.primary} />
                <Text style={styles.refreshBadgeText}>Actualisation lien…</Text>
              </View>
            ) : null}
          </View>

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
              <View style={styles.uploadBtnInner}>
                <Ionicons name="cloud-upload-outline" size={18} color={colors.background.primary} />
                <Text style={styles.uploadBtnText}>{canEdit ? 'Uploader une vidéo' : 'Lecture seule'}</Text>
              </View>
            )}
          </TouchableOpacity>

          {mode === 'adminView' && !canEdit ? (
            <Text style={[styles.subMeta, { marginTop: spacing.sm }]}>Accès lecture seule.</Text>
          ) : null}
        </GlassCard>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={colors.brand.primary} />
            <Text style={styles.loaderText}>Chargement…</Text>
          </View>
        ) : videos.length === 0 ? (
          <GlassCard variant="bordered" style={styles.card}>
            <View style={styles.emptyStateWrap}>
              <Ionicons name="videocam-outline" size={28} color={colors.text.secondary} />
              <Text style={styles.emptyStateTitle}>Aucune vidéo highlight</Text>
              <Text style={styles.empty}>Ajoute une vidéo pour commencer la review scout.</Text>
              {canEdit ? (
                <TouchableOpacity style={styles.emptyCtaBtn} onPress={pickAndUpload}>
                  <Text style={styles.emptyCtaText}>Uploader maintenant</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </GlassCard>
        ) : (
          <View style={styles.list}>
            {videos.slice(0, MAX_VIDEOS).map((v) => {
              const sourceUri = v.playbackUrl ?? v.url;
              const playbackError = videoErrors[v.id];
              const duration = formatDuration(v.duration);
              return (
                <GlassCard key={v.id} variant="bordered" style={styles.videoCard}>
                  <View style={styles.videoHeader}>
                    <View style={styles.videoTitleWrap}>
                      <Text style={styles.videoTitle} numberOfLines={1}>
                        {decodeFileName(v.filename)}
                      </Text>
                      <View style={styles.badgeRow}>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>VIDEO</Text>
                        </View>
                        {duration ? (
                          <View style={styles.durationBadge}>
                            <Text style={styles.durationBadgeText}>{duration}</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  <View style={styles.videoBox}>
                    <Video
                      source={{ uri: sourceUri }}
                      style={styles.video}
                      resizeMode={ResizeMode.CONTAIN}
                      useNativeControls
                      isLooping={false}
                      onError={(error) => handleVideoError(v, error)}
                    />
                  </View>

                  {playbackError ? <Text style={styles.playbackError}>{playbackError}</Text> : null}

                  <View style={styles.videoFooter}>
                    <Text style={styles.videoMeta}>
                      {`${formatBytes(v.size)} • ${v.uploadedAt ? new Date(v.uploadedAt).toLocaleString('fr-FR') : '—'}`}
                    </Text>

                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.openBtn} onPress={() => openVideo(v)} activeOpacity={0.85}>
                        <Ionicons name="play-circle-outline" size={15} color={colors.text.primary} />
                        <Text style={styles.openBtnText}>Lire</Text>
                      </TouchableOpacity>

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
                  </View>
                </GlassCard>
              );
            })}
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
  uploadHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  meta: { color: colors.text.primary, fontSize: typography.sizes.base, fontWeight: '800' },
  subMeta: { color: colors.text.secondary, fontSize: typography.sizes.xs, fontWeight: '600', marginTop: 2 },
  refreshBadge: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    backgroundColor: colors.surface.glass,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshBadgeText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  uploadBtn: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  uploadBtnText: { color: colors.background.primary, fontWeight: '900', fontSize: typography.sizes.base },
  btnDisabled: { opacity: 0.6 },
  loader: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  loaderText: { color: colors.text.secondary },
  emptyStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  emptyStateTitle: {
    color: colors.text.primary,
    fontSize: typography.sizes.base,
    fontWeight: '800',
  },
  empty: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyCtaBtn: {
    marginTop: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.glass,
  },
  emptyCtaText: {
    color: colors.brand.primary,
    fontWeight: '800',
  },
  list: { gap: spacing.lg },
  videoCard: {
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.surface.borderLight,
    backgroundColor: colors.surface.glass,
    gap: spacing.sm,
  },
  videoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  videoTitleWrap: { flex: 1, gap: 8 },
  videoTitle: {
    color: colors.text.primary,
    fontWeight: '900',
    fontSize: typography.sizes.base,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(210, 248, 38, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(210, 248, 38, 0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  typeBadgeText: {
    color: colors.brand.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  durationBadge: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  durationBadgeText: {
    color: colors.text.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  videoBox: {
    marginTop: 2,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  video: { width: '100%', height: 220 },
  playbackError: {
    marginTop: 2,
    color: '#FDBA74',
    fontSize: typography.sizes.xs,
    fontWeight: '700',
  },
  videoFooter: {
    gap: spacing.xs,
  },
  videoMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.surface.borderLight,
    backgroundColor: colors.surface.glassLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  openBtnText: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: typography.sizes.xs,
  },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteText: { color: colors.semantic.error, fontWeight: '800', fontSize: typography.sizes.xs },
});
