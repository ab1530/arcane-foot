import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import passportService from '../../services/passportService';
import { colors, spacing, typography, radius } from '../../design/theme';
import { GlassCard, Icon, GradientText } from '../../components/ui';
import { logError } from '../../utils/logger';
import { showError, showInfo, showSuccess } from '../../services/toast';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { PublicProfileView } from '../../types/passport';

type ClubNeedsSourceContext = {
  requestId?: string;
  lineNumber?: number;
  clubName?: string;
};

type ProfileStat = {
  key: string;
  value: string | number | boolean | null;
};

const parseDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const computeAge = (dateOfBirth: unknown): number | null => {
  const parsed = parseDate(dateOfBirth);
  if (!parsed) return null;

  const now = new Date();
  let age = now.getFullYear() - parsed.getFullYear();
  const monthDiff = now.getMonth() - parsed.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < parsed.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const formatStatFallbackLabel = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\\-]+/g, ' ')
    .trim();

const formatMoney = (value: number | null, locale: 'fr' | 'en') => {
  if (value == null) return '—';
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value: string | null, locale: 'fr' | 'en') => {
  if (!value) return '—';
  const parsed = parseDate(value);
  if (!parsed) return '—';

  return parsed.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (value: string | null, locale: 'fr' | 'en') => {
  if (!value) return '—';
  const parsed = parseDate(value);
  if (!parsed) return '—';

  return parsed.toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const buildFallbackProfileView = (passport: any, player: any): PublicProfileView => {
  const user = player?.user ?? player?.users ?? null;
  const firstName = user?.firstName ?? player?.firstName ?? passport?.passportData?.firstName ?? null;
  const lastName = user?.lastName ?? player?.lastName ?? passport?.passportData?.lastName ?? null;
  const fullName = `${firstName ?? ''} ${lastName ?? ''}`.trim() || 'Player';

  const rawStats = passport?.passportData?.statsSnapshot;
  const statsSnapshot =
    rawStats && typeof rawStats === 'object' && !Array.isArray(rawStats)
      ? (rawStats as Record<string, string | number | boolean | null>)
      : {};

  const keyStats: ProfileStat[] = Object.entries(statsSnapshot)
    .slice(0, 8)
    .map(([key, value]) => ({ key, value }));

  return {
    identity: {
      playerId: String(player?.id ?? passport?.playerId ?? ''),
      firstName,
      lastName,
      fullName,
      position: player?.position ?? passport?.passportData?.position ?? null,
      nationality: player?.nationality ?? passport?.passportData?.nationality ?? null,
      club: player?.clubs
        ? {
            name: player.clubs.name ?? '—',
            logo: player.clubs.logo ?? null,
          }
        : player?.club
          ? {
              name: player.club.name ?? '—',
              logo: player.club.logo ?? null,
            }
          : passport?.passportData?.club
            ? {
                name: passport.passportData.club.name ?? '—',
                logo: passport.passportData.club.logo ?? null,
              }
            : null,
      avatarUrl:
        player?.photoUrl ??
        user?.avatar ??
        player?.avatarUrl ??
        passport?.passportData?.avatar ??
        null,
    },
    market: {
      marketValue:
        normalizeNumber(player?.marketValue) ?? normalizeNumber(passport?.passportData?.marketValue),
      contractUntil:
        typeof player?.contractUntil === 'string'
          ? player.contractUntil
          : typeof passport?.passportData?.contractUntil === 'string'
            ? passport.passportData.contractUntil
            : null,
      externalMarketUrl: null,
    },
    physical: {
      age: computeAge(player?.dateOfBirth ?? passport?.passportData?.dateOfBirth),
      height: normalizeNumber(player?.height) ?? normalizeNumber(passport?.passportData?.height),
      weight: normalizeNumber(player?.weight) ?? normalizeNumber(passport?.passportData?.weight),
      preferredFoot: player?.preferredFoot ?? passport?.passportData?.preferredFoot ?? null,
    },
    scouting: {
      averageRating: normalizeNumber(passport?.passportData?.averageRating),
      totalReports: normalizeNumber(passport?.passportData?.totalReports) ?? 0,
      lastReportAt: null,
      recommendation: null,
      strengthsTop: [],
      weaknessesTop: [],
    },
    stats: {
      snapshot: statsSnapshot,
      keyStats,
    },
    mediaHighlights: [],
    lastUpdatedAt: passport?.updatedAt ?? new Date().toISOString(),
  };
};

export default function PassportPreviewScreen({ navigation, route }: any) {
  const { t, language } = useLocalization();
  const playerId = route?.params?.playerId as string;
  const source = route?.params?.source as ClubNeedsSourceContext | undefined;

  const [loading, setLoading] = useState(true);
  const [passport, setPassport] = useState<any>(null);
  const [showQR, setShowQR] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const passportData = await passportService.getPassportByPlayer(playerId, false);
      setPassport(passportData);
    } catch (error: any) {
      if (error?.response?.status === 404 || String(error?.message || '').includes('404')) {
        try {
          await passportService.createPassport({ playerId });
          const generatedPassport = await passportService.getPassportByPlayer(playerId, false);
          setPassport(generatedPassport);
          return;
        } catch (createError: any) {
          const message = String(createError?.response?.data?.message || createError?.message || '');
          if (createError?.response?.status === 400 && message.includes('already has a passport')) {
            const generatedPassport = await passportService.getPassportByPlayer(playerId, false);
            setPassport(generatedPassport);
            return;
          }
          logError('Failed to create passport', createError);
          throw createError;
        }
      }

      throw error;
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    load().catch((error: any) => {
      logError('Failed to load passport preview', error);
      Alert.alert(t('passportPreview.errors.title'), t('passportPreview.errors.load'));
    });
  }, [load, t]);

  const player = passport?.player ?? passport?.players ?? null;
  const token = passport?.token ?? passport?.publicToken;
  const profile = useMemo<PublicProfileView>(
    () => passport?.profileView ?? buildFallbackProfileView(passport, player),
    [passport, player],
  );

  const playerName = profile.identity.fullName;

  const initials = useMemo(() => {
    const parts = playerName.split(' ').filter(Boolean);
    if (parts.length === 0) return 'AR';
    return parts
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  }, [playerName]);

  const publicLink = useMemo(() => {
    if (!token) return null;
    return passportService.generateQRCodeValue(token);
  }, [token]);

  const qrValue = publicLink;
  const playerPhoto = profile.identity.avatarUrl;
  const canAddToShare = Boolean(source?.lineNumber);

  const locale = language === 'en' ? 'en' : 'fr';

  const stats = useMemo(
    () => (profile.stats?.keyStats ?? []).slice(0, 8),
    [profile.stats?.keyStats],
  );

  const resolveStatLabel = useCallback(
    (key: string) => {
      const translated = t(`passportPreview.stats.${key}`);
      if (translated === `passportPreview.stats.${key}`) {
        return formatStatFallbackLabel(key);
      }
      return translated;
    },
    [t],
  );

  const handleCopyLink = async () => {
    if (!publicLink) {
      showError(t('passportPreview.errors.linkTitle'), t('passportPreview.errors.linkUnavailable'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(publicLink);
    showSuccess(t('passportPreview.toasts.linkCopiedTitle'), t('passportPreview.toasts.linkCopiedBody'));
  };

  const handleOpenLink = async () => {
    if (!publicLink) {
      showError(t('passportPreview.errors.linkTitle'), t('passportPreview.errors.linkUnavailable'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const supported = await Linking.canOpenURL(publicLink);
      if (!supported) {
        showError(t('passportPreview.errors.openTitle'), t('passportPreview.errors.openBody'));
        return;
      }

      await Linking.openURL(publicLink);
    } catch (error) {
      logError('Failed to open passport public link', error);
      showError(t('passportPreview.errors.openTitle'), t('passportPreview.errors.openBody'));
    }
  };

  const handleShareLink = async () => {
    if (!publicLink) {
      showError(t('passportPreview.errors.linkTitle'), t('passportPreview.errors.linkUnavailable'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await Clipboard.setStringAsync(publicLink);
      await Share.share({
        title: `${t('passportPreview.labels.passport')} ${playerName}`,
        message: `${t('passportPreview.labels.passport')} ${playerName}: ${publicLink}`,
        url: publicLink,
      });
      showSuccess(t('passportPreview.toasts.shareReadyTitle'), t('passportPreview.toasts.shareReadyBody'));
    } catch (error) {
      logError('Failed to share passport public link', error);
      showError(t('passportPreview.errors.shareTitle'), t('passportPreview.errors.shareBody'));
    }
  };

  const handleOpenExternalMarket = async () => {
    const marketUrl = profile.market.externalMarketUrl;
    if (!marketUrl) {
      showInfo(t('passportPreview.labels.marketLink'), t('passportPreview.empty.marketLink'));
      return;
    }

    try {
      await Linking.openURL(marketUrl);
    } catch (error) {
      logError('Failed to open external market link', error);
      showError(t('passportPreview.errors.openTitle'), t('passportPreview.errors.openBody'));
    }
  };

  const handleOpenMedia = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      logError('Failed to open media highlight', error);
      showError(t('passportPreview.errors.openTitle'), t('passportPreview.errors.openBody'));
    }
  };

  const handleAddToShareGroup = () => {
    if (!canAddToShare || !source?.lineNumber) {
      showInfo(t('passportPreview.toasts.missingContextTitle'), t('passportPreview.toasts.missingContextBody'));
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    navigation.navigate('ClubNeeds', {
      addToShare: {
        requestId: source.requestId,
        lineNumber: source.lineNumber,
        player: {
          playerId: profile.identity.playerId || player?.id || playerId,
          firstName: profile.identity.firstName,
          lastName: profile.identity.lastName,
          position: profile.identity.position,
          nationality: profile.identity.nationality,
          marketValue: profile.market.marketValue,
          club: profile.identity.club
            ? {
                name: profile.identity.club.name,
                logo: profile.identity.club.logo ?? null,
              }
            : null,
          photoUrl: playerPhoto,
        },
      },
    });

    showSuccess(t('passportPreview.toasts.addReadyTitle'), t('passportPreview.toasts.addReadyBody'));
  };

  const scoutingCardItems = [
    {
      label: t('passportPreview.labels.averageRating'),
      value: profile.scouting.averageRating == null ? '—' : profile.scouting.averageRating.toFixed(1),
    },
    {
      label: t('passportPreview.labels.totalReports'),
      value: String(profile.scouting.totalReports ?? 0),
    },
    {
      label: t('passportPreview.labels.recommendation'),
      value: profile.scouting.recommendation ?? '—',
    },
  ];

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
          {t('passportPreview.title')}
        </GradientText>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loaderText}>{t('passportPreview.loading')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard variant="elevated" style={styles.card}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarWrap}>
                {playerPhoto ? (
                  <Image source={{ uri: playerPhoto }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarInitials}>{initials}</Text>
                )}
              </View>

              <View style={styles.profileTextWrap}>
                <Text style={styles.name}>{playerName}</Text>
                <Text style={styles.metaLine}>
                  {profile.identity.position ?? '—'} • {profile.identity.nationality ?? '—'}
                </Text>
                <Text style={styles.metaLine}>{profile.identity.club?.name ?? t('passportPreview.empty.freeAgent')}</Text>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('passportPreview.labels.age')}</Text>
                <Text style={styles.infoValue}>
                  {profile.physical.age == null
                    ? '—'
                    : `${profile.physical.age} ${t('passportPreview.units.years')}`}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('passportPreview.labels.marketValue')}</Text>
                <Text style={styles.infoValue}>{formatMoney(profile.market.marketValue, locale)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('passportPreview.labels.contractUntil')}</Text>
                <Text style={styles.infoValue}>{formatDate(profile.market.contractUntil, locale)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('passportPreview.labels.preferredFoot')}</Text>
                <Text style={styles.infoValue}>{profile.physical.preferredFoot ?? '—'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('passportPreview.labels.height')}</Text>
                <Text style={styles.infoValue}>
                  {profile.physical.height == null
                    ? '—'
                    : `${profile.physical.height} ${t('passportPreview.units.centimeters')}`}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>{t('passportPreview.labels.weight')}</Text>
                <Text style={styles.infoValue}>
                  {profile.physical.weight == null
                    ? '—'
                    : `${profile.physical.weight} ${t('passportPreview.units.kilograms')}`}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('passportPreview.sections.scouting')}</Text>
            <View style={styles.scoutingGrid}>
              {scoutingCardItems.map((item) => (
                <View key={item.label} style={styles.scoutingItem}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            <View style={styles.pointsRow}>
              <View style={styles.pointsBox}>
                <Text style={styles.pointsTitle}>{t('passportPreview.sections.strengths')}</Text>
                {profile.scouting.strengthsTop.length > 0 ? (
                  profile.scouting.strengthsTop.map((item) => (
                    <Text key={item} style={styles.pointItem}>
                      • {item}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.pointItem}>—</Text>
                )}
              </View>

              <View style={styles.pointsBox}>
                <Text style={styles.pointsTitle}>{t('passportPreview.sections.weaknesses')}</Text>
                {profile.scouting.weaknessesTop.length > 0 ? (
                  profile.scouting.weaknessesTop.map((item) => (
                    <Text key={item} style={styles.pointItem}>
                      • {item}
                    </Text>
                  ))
                ) : (
                  <Text style={styles.pointItem}>—</Text>
                )}
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('passportPreview.sections.stats')}</Text>
            {stats.length > 0 ? (
              <View style={styles.statsGrid}>
                {stats.map((stat) => (
                  <View key={stat.key} style={styles.statCard}>
                    <Text style={styles.infoLabel}>{resolveStatLabel(stat.key)}</Text>
                    <Text style={styles.infoValue}>{String(stat.value ?? '—')}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>{t('passportPreview.empty.stats')}</Text>
            )}

            <Text style={styles.sectionTitle}>{t('passportPreview.sections.media')}</Text>
            {profile.mediaHighlights.length > 0 ? (
              <View style={styles.mediaList}>
                {profile.mediaHighlights.slice(0, 3).map((item) => (
                  <TouchableOpacity key={item.id} style={styles.mediaItem} onPress={() => handleOpenMedia(item.url)}>
                    <View style={styles.mediaMeta}>
                      <Icon name={item.type === 'VIDEO' ? 'videocam' : 'image'} size="sm" color={colors.brand.primary} />
                      <View style={styles.mediaTextWrap}>
                        <Text style={styles.mediaTitle} numberOfLines={1}>
                          {item.filename || t('passportPreview.media.untitled')}
                        </Text>
                        <Text style={styles.mediaSubline}>
                          {item.type === 'VIDEO' ? t('passportPreview.media.video') : t('passportPreview.media.image')}
                          {item.duration ? ` • ${item.duration}s` : ''}
                        </Text>
                      </View>
                    </View>
                    <Icon name="arrowForward" size="sm" color={colors.text.secondary} />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>{t('passportPreview.empty.media')}</Text>
            )}

            <View style={styles.linkBox}>
              <Icon name="link" size="sm" color={colors.brand.primary} />
              <Text style={styles.linkText} numberOfLines={1}>
                {publicLink ?? t('passportPreview.empty.link')}
              </Text>
            </View>

            <View style={styles.actionsGrid}>
              <TouchableOpacity testID="passport-preview-open-link" style={styles.actionBtn} onPress={handleOpenLink}>
                <Icon name="arrowForward" size="sm" color={colors.brand.primary} />
                <Text style={styles.actionText}>{t('passportPreview.actions.openLink')}</Text>
              </TouchableOpacity>

              <TouchableOpacity testID="passport-preview-copy-link" style={styles.actionBtn} onPress={handleCopyLink}>
                <Icon name="copy" size="sm" color={colors.brand.primary} />
                <Text style={styles.actionText}>{t('passportPreview.actions.copyLink')}</Text>
              </TouchableOpacity>

              <TouchableOpacity testID="passport-preview-share-link" style={styles.actionBtn} onPress={handleShareLink}>
                <Icon name="share" size="sm" color={colors.brand.primary} />
                <Text style={styles.actionText}>{t('passportPreview.actions.shareLink')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleOpenExternalMarket}>
                <Icon name="trending" size="sm" color={colors.brand.primary} />
                <Text style={styles.actionText}>{t('passportPreview.actions.openMarket')}</Text>
              </TouchableOpacity>

              {canAddToShare ? (
                <TouchableOpacity
                  testID="passport-preview-add-to-share"
                  style={styles.actionBtn}
                  onPress={handleAddToShareGroup}
                >
                  <Icon name="add" size="sm" color={colors.brand.primary} />
                  <Text style={styles.actionText}>{t('passportPreview.actions.addToGroup')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <TouchableOpacity
              testID="passport-preview-toggle-qr"
              style={styles.toggleQrBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowQR((value) => !value);
              }}
            >
              <Icon name={showQR ? 'eyeOff' : 'qrCode'} size="sm" color={colors.text.secondary} />
              <Text style={styles.toggleQrText}>
                {showQR ? t('passportPreview.actions.hideQr') : t('passportPreview.actions.showQr')}
              </Text>
            </TouchableOpacity>

            {showQR ? (
              qrValue ? (
                <View style={styles.qrBox}>
                  <QRCode value={qrValue} size={200} color={colors.background.primary} backgroundColor="white" />
                  <Text style={styles.qrCaption}>{t('passportPreview.labels.qrFallback')}</Text>
                </View>
              ) : (
                <Text style={styles.warning}>{t('passportPreview.errors.qrMissing')}</Text>
              )
            ) : null}

            <Text style={styles.footerMeta}>
              {t('passportPreview.labels.lastUpdated')}: {formatDateTime(profile.lastUpdatedAt, locale)}
            </Text>
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
  card: { padding: spacing.lg, gap: spacing.md },
  sectionTitle: {
    color: colors.text.primary,
    fontWeight: '900',
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.glass,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: colors.text.primary,
    fontWeight: '900',
    fontSize: typography.sizes.lg,
  },
  profileTextWrap: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text.primary,
    fontWeight: '900',
    fontSize: typography.sizes.lg,
  },
  metaLine: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoItem: {
    width: '48%',
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface.glass,
    gap: 4,
  },
  infoLabel: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  scoutingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scoutingItem: {
    width: '31%',
    minWidth: 100,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface.glass,
    gap: 4,
  },
  pointsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  pointsBox: {
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface.glass,
    gap: 4,
  },
  pointsTitle: {
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
  },
  pointItem: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: '48%',
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface.glass,
    gap: 4,
  },
  mediaList: {
    gap: spacing.sm,
  },
  mediaItem: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface.glass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  mediaMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  mediaTextWrap: {
    flex: 1,
  },
  mediaTitle: {
    color: colors.text.primary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  mediaSubline: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.sizes.sm,
  },
  linkBox: {
    borderRadius: radius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface.glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  linkText: {
    flex: 1,
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionBtn: {
    minWidth: '47%',
    borderRadius: radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surface.glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: colors.brand.primary,
    fontWeight: '800',
    fontSize: typography.sizes.xs,
  },
  toggleQrBtn: {
    borderRadius: radius.lg,
    padding: spacing.sm,
    backgroundColor: colors.surface.glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  toggleQrText: {
    color: colors.text.secondary,
    fontWeight: '700',
    fontSize: typography.sizes.sm,
  },
  qrBox: {
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.glass,
  },
  qrCaption: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
  },
  warning: {
    marginTop: spacing.md,
    color: colors.semantic.warning,
  },
  footerMeta: {
    color: colors.text.secondary,
    fontSize: typography.sizes.xs,
    textAlign: 'right',
  },
});
