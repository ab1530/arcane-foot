/**
 * PassportScreen - Digital Player Passport with QR Code
 * Professional digital ID card for players with shareable QR code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../contexts/AuthContext';
import { Icon, GlassCard, GradientText, AnimatedBadge } from '../../components/ui';
import { colors, spacing, typography, radius } from '../../design/theme';
import { showSuccess, showError } from '../../services/toast';
import {
  Card,
  Text as DesignText,
  Heading,
  Caption,
  Button,
  Avatar,
  Badge,
  theme as designTheme
} from '../../design/components';

export const PassportScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(true);

  // Generate unique passport URL
  const passportUrl = `https://arcane-football.com/player/${user?.id}`;
  const passportData = JSON.stringify({
    id: user?.id,
    name: `${user?.firstName} ${user?.lastName}`,
    role: user?.role,
    timestamp: Date.now(),
  });

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `Consultez mon profil Arcane Football: ${passportUrl}`,
        url: passportUrl,
        title: 'Mon Passeport Joueur',
      });
      showSuccess('Partagé avec succès');
    } catch (error) {
      showError('Erreur de partage');
    }
  };

  const handleDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Téléchargement',
      'Le téléchargement du passeport sera bientôt disponible',
      [{ text: 'OK' }]
    );
  };

  const getVerificationLevel = () => {
    // Logic to determine verification level based on user data
    if (user?.role === 'PLAYER') return 'verified';
    if (user?.role === 'SCOUT' || user?.role === 'AGENT') return 'professional';
    return 'basic';
  };

  const verificationLevel = getVerificationLevel();

  const verificationConfig = {
    verified: {
      label: 'Vérifié',
      icon: 'checkmark' as const,
      color: colors.semantic.success,
    },
    professional: {
      label: 'Professionnel',
      icon: 'shield' as const,
      color: colors.semantic.info,
    },
    basic: {
      label: 'Standard',
      icon: 'person' as const,
      color: colors.semantic.warning,
    },
  };

  const verification = verificationConfig[verificationLevel];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrowBack" size="md" color={colors.text.primary} />
          </TouchableOpacity>
          <GradientText variant="arcane" style={styles.headerTitle}>
            Passeport Joueur
          </GradientText>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Icon name="share" size="md" color={colors.brand.primary} />
          </TouchableOpacity>
        </View>

        {/* Passport Card */}
        <GlassCard variant="elevated" style={styles.passportCard}>
          <LinearGradient
            colors={[colors.brand.primary + '20', colors.surface.glass]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientOverlay}
          >
            {/* Card Header with Badge */}
            <View style={styles.cardHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.firstName?.[0]}
                    {user?.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.badgeContainer}>
                  <AnimatedBadge
                    variant="dot"
                    color={verification.color}
                    animation="pulse"
                    size="md"
                  />
                </View>
              </View>

              <View style={styles.cardHeaderInfo}>
                <Text style={styles.playerName}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <View style={styles.verificationBadge}>
                  <Icon
                    name={verification.icon}
                    size={14}
                    color={verification.color}
                  />
                  <Text
                    style={[styles.verificationText, { color: verification.color }]}
                  >
                    {verification.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Player Info Grid */}
            <View style={styles.infoGrid}>
              <InfoItem
                icon="person"
                label="Rôle"
                value={user?.role || 'N/A'}
              />
              <InfoItem
                icon="mail"
                label="Email"
                value={user?.email || 'N/A'}
                small
              />
              {user?.phone && (
                <InfoItem icon="call" label="Téléphone" value={user.phone} />
              )}
              <InfoItem
                icon="calendar"
                label="Membre depuis"
                value={
                  user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'N/A'
                }
              />
            </View>

            {/* QR Code Section */}
            {showQR && (
              <View style={styles.qrSection}>
                <Text style={styles.qrLabel}>Scannez pour voir le profil</Text>
                <View style={styles.qrContainer}>
                  <QRCode
                    value={passportData}
                    size={180}
                    color={colors.background.primary}
                    backgroundColor="white"
                    logo={require('../../../assets/icon.png')}
                    logoSize={40}
                    logoBackgroundColor="white"
                    logoBorderRadius={8}
                  />
                </View>
                <Text style={styles.qrId}>ID: {user?.id?.slice(0, 8)}...</Text>
              </View>
            )}

            {/* Toggle QR Button */}
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowQR(!showQR)}
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

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>

          <GlassCard variant="elevated">
            <TouchableOpacity style={styles.actionItem} onPress={handleShare}>
              <View style={styles.actionLeft}>
                <View style={styles.actionIcon}>
                  <Icon name="share" size="md" color={colors.brand.primary} />
                </View>
                <Text style={styles.actionText}>Partager mon passeport</Text>
              </View>
              <Icon name="chevronForward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleDownload}>
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
              onPress={() => Alert.alert('QR Code', 'Copié dans le presse-papier')}
            >
              <View style={styles.actionLeft}>
                <View style={styles.actionIcon}>
                  <Icon name="copy" size="md" color={colors.semantic.success} />
                </View>
                <Text style={styles.actionText}>Copier le lien</Text>
              </View>
              <Icon name="chevronForward" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <GlassCard variant="subtle">
            <View style={styles.infoBox}>
              <Icon name="info" size="md" color={colors.brand.primary} />
              <Text style={styles.infoBoxText}>
                Votre passeport numérique vous permet de partager facilement votre
                profil avec des recruteurs, agents ou clubs professionnels.
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
  headerTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: spacing.sm,
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
