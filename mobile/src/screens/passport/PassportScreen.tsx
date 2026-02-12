/**
 * PassportScreen - Digital Player Passport with QR Code
 * Professional digital ID card for players.
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { Icon, GlassCard, GradientText, AnimatedBadge } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import { showError } from '../../services/toast';
import { useMyPassport } from '../../hooks/usePassport';
import passportService from '../../services/passportService';
import { PassportVerificationStatus } from '../../types/passport';

export const PassportScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { passport, loading, error, refreshing, refresh } = useMyPassport();
  const [showQR, setShowQR] = useState(true);
  const canGoBack = navigation?.canGoBack?.() ?? false;

  const player = passport?.player;

  const playerName = useMemo(() => {
    if (player?.user) {
      return `${player.user.firstName ?? ''} ${player.user.lastName ?? ''}`.trim();
    }
    return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Mon passeport Arcane';
  }, [player?.user, user?.firstName, user?.lastName]);

  const initials = useMemo(() => {
    if (!playerName) return 'AR';
    const parts = playerName.split(' ').filter(Boolean);
    if (!parts.length) {
      return playerName.slice(0, 2).toUpperCase();
    }
    return parts
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [playerName]);

  const contactEmail = player?.user?.email ?? user?.email ?? 'N/A';
  const phoneNumber = user?.phone ?? player?.user?.phone ?? 'N/A';
  const joinedAt = passport?.createdAt ?? user?.createdAt ?? null;
  const formattedJoinDate = joinedAt
    ? new Date(joinedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const qrValue = useMemo(() => {
    if (passport) {
      return passportService.generateQRCodeValue(passport.token);
    }
    return JSON.stringify({
      id: user?.id,
      name: playerName,
      role: user?.role,
      timestamp: Date.now(),
    });
  }, [passport, playerName, user?.id, user?.role]);

  const verificationInfo = useMemo(() => {
    if (passport) {
      return passportService.getVerificationStatusInfo(passport.verificationStatus);
    }
    return {
      label: 'Statut inconnu',
      color: colors.semantic.warning,
      icon: 'shield' as const,
    };
  }, [passport]);

  const passportIdDisplay =
    passport?.id?.slice(0, 8) ?? user?.id?.slice(0, 8) ?? 'N/A';
  const tokenSnippet = passport?.token?.slice(0, 10);
  const hasPassport = Boolean(passport);

  const infoItems = useMemo(
    () => [
      { icon: 'person', label: 'Rôle', value: user?.role ?? 'N/A' },
      { icon: 'mail', label: 'Email', value: contactEmail, small: true },
      { icon: 'call', label: 'Téléphone', value: phoneNumber },
      { icon: 'shield', label: 'Club', value: player?.club?.name ?? 'Libre' },
      { icon: 'football', label: 'Position', value: player?.position ?? 'N/A' },
      { icon: 'location', label: 'Nationalité', value: player?.nationality ?? 'N/A' },
      { icon: 'calendar', label: 'Création', value: formattedJoinDate },
    ],
    [
      user?.role,
      contactEmail,
      phoneNumber,
      player?.club?.name,
      player?.position,
      player?.nationality,
      formattedJoinDate,
    ]
  );

  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!hasPassport) {
      showError('Aucun passeport à télécharger');
      return;
    }
    Alert.alert(
      'Téléchargement',
      'Le téléchargement du passeport sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const handleRefresh = () => {
    refresh();
  };

  const handleMyVideos = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const pid = player?.id ?? (user as any)?.playerId;
    if (!pid) {
      showError('Profil joueur introuvable');
      return;
    }
    navigation.navigate('PlayerHighlights', { playerId: pid, mode: 'owner' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
          />
        }
      >
        <View style={styles.header}>
          {canGoBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrowBack" size="md" color={colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
          <GradientText variant="arcane" style={styles.headerTitle}>
            Passeport Joueur
          </GradientText>
          <View style={styles.backButtonPlaceholder} />
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Text style={styles.errorRetry}>Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !hasPassport ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.brand.primary} size="large" />
          </View>
        ) : null}

        {hasPassport ? (
          <>
            <GlassCard variant="elevated" style={styles.passportCard}>
              <LinearGradient
                colors={[colors.brand.primary + '20', colors.surface.glass]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientOverlay}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                    <View style={styles.badgeContainer}>
                      <AnimatedBadge
                        variant="dot"
                        color={verificationInfo.color}
                        animation="pulse"
                        size="md"
                      />
                    </View>
                  </View>

                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.playerName}>{playerName}</Text>
                    <View style={styles.verificationBadge}>
                      <Icon
                        name={verificationInfo.icon}
                        size={14}
                        color={verificationInfo.color}
                      />
                      <Text
                        style={[
                          styles.verificationText,
                          { color: verificationInfo.color },
                        ]}
                      >
                        {verificationInfo.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  {infoItems.map((item) => (
                    <InfoItem
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      value={item.value}
                      small={item.small}
                    />
                  ))}
                </View>

                {showQR && (
                  <View style={styles.qrSection}>
                    <Text style={styles.qrLabel}>Scannez pour voir le profil</Text>
                    <View style={styles.qrContainer}>
                      <QRCode
                        value={qrValue}
                        size={180}
                        color={colors.background.primary}
                        backgroundColor="white"
                        logo={require('../../../assets/icon.png')}
                        logoSize={40}
                        logoBackgroundColor="white"
                        logoBorderRadius={8}
                      />
                    </View>
                    <Text style={styles.qrId}>
                      Passeport #{passportIdDisplay}
                      {tokenSnippet ? ` • ${tokenSnippet}…` : ''}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.toggleButton}
                  onPress={() => setShowQR((prev) => !prev)}
                >
                  <Icon
                    name={showQR ? 'eyeOff' : 'eye'}
                    size="sm"
                    color={colors.text.secondary}
                  />
                  <Text style={styles.toggleText}>
                    {showQR ? 'Masquer le QR Code' : 'Afficher le QR Code'}
                  </Text>
                </TouchableOpacity>
              </LinearGradient>
            </GlassCard>

            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Actions Rapides</Text>

              <GlassCard variant="elevated">
                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleDownload}
                >
                  <View style={styles.actionLeft}>
                    <View style={styles.actionIcon}>
                      <Icon name="download" size="md" color={colors.semantic.info} />
                    </View>
                    <Text style={styles.actionText}>Télécharger en PDF</Text>
                  </View>
                  <Icon name="chevronForward" size={20} color={colors.text.secondary} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={handleMyVideos}
                >
                  <View style={styles.actionLeft}>
                    <View style={styles.actionIcon}>
                      <Icon name="videocam" size="md" color={colors.brand.primary} />
                    </View>
                    <Text style={styles.actionText}>Mes vidéos</Text>
                  </View>
                  <Icon name="chevronForward" size={20} color={colors.text.secondary} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.actionItem}
                  onPress={() => setShowQR((prev) => !prev)}
                >
                  <View style={styles.actionLeft}>
                    <View style={styles.actionIcon}>
                      <Icon name={showQR ? 'eyeOff' : 'eye'} size="md" color={colors.semantic.success} />
                    </View>
                    <Text style={styles.actionText}>
                      {showQR ? 'Masquer le QR code' : 'Afficher le QR code'}
                    </Text>
                  </View>
                  <Icon name="chevronForward" size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </GlassCard>
            </View>
          </>
        ) : (
          !loading && (
            <GlassCard variant="elevated" style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Aucun passeport trouvé</Text>
              <Text style={styles.emptySubtitle}>
                Connectez-vous avec un compte joueur vérifié ou contactez un administrateur
                pour générer votre passeport numérique.
              </Text>
              <TouchableOpacity style={styles.primaryButton} onPress={handleRefresh}>
                <Text style={styles.primaryButtonText}>Recharger</Text>
              </TouchableOpacity>
            </GlassCard>
          )
        )}

        <View style={styles.infoSection}>
          <GlassCard variant="subtle">
            <View style={styles.infoBox}>
              <Icon name="info" size="md" color={colors.brand.primary} />
              <Text style={styles.infoBoxText}>
                Votre passeport numérique vous aide à présenter vos informations
                sportives de manière claire et professionnelle.
              </Text>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoItem = ({
  icon,
  label,
  value,
  small = false,
}: {
  icon: any;
  label: string;
  value: string;
  small?: boolean;
}) => (
  <View style={styles.infoItem}>
    <View style={styles.infoItemHeader}>
      <Icon name={icon} size={16} color={colors.brand.primary} />
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
    <Text style={[styles.infoValue, small && styles.infoValueSmall]} numberOfLines={1}>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonPlaceholder: {
    width: 44,
  },
  headerTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
  },
  errorBanner: {
    backgroundColor: colors.semantic.warning + '20',
    borderColor: colors.semantic.warning + '40',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.semantic.warning,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  errorRetry: {
    color: colors.brand.primary,
    fontWeight: '600',
  },
  loader: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passportCard: {
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  gradientOverlay: {
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.brand.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.surface.glass,
  },
  avatarText: {
    fontSize: typography.sizes.h2,
    fontWeight: 'bold',
    color: colors.background.primary,
  },
  badgeContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.surface.glass,
    borderRadius: radius.full,
    padding: 4,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface.glassLight,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  verificationText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface.glassLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  infoItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '600',
  },
  infoValueSmall: {
    fontSize: typography.sizes.sm,
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  qrLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: spacing.lg,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  qrId: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.md,
    fontFamily: 'monospace',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  toggleText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  actionsSection: {
    marginBottom: spacing.lg,
  },
  emptyCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySubtitle: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.background.primary,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface.glassLight,
    borderWidth: 1,
    borderColor: colors.surface.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surface.border,
    marginHorizontal: spacing.sm,
  },
  infoSection: {
    marginBottom: spacing.xl,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
  },
  infoBoxText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export default PassportScreen;
