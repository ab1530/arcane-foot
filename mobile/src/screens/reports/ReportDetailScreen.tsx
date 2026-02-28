import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenHeader } from '../../components/navigation';
import { Icon } from '../../components/ui';
import { GlassCard } from '../../components/ui/GlassCard';
import { colors, spacing, typography, radius } from '../../design/theme';
import { scoutingReportsApi, ScoutingReport, ReportStatus } from '../../services/api/scouting-reports';

type ReportDetailRouteProp = RouteProp<{ params: { reportId: string } }, 'params'>;

const statusGradients: Record<ReportStatus, [string, string]> = {
  DRAFT: [colors.surface.border, colors.surface.glass],
  SUBMITTED: [colors.semantic.info, colors.semantic.infoBg],
  APPROVED: [colors.semantic.success, colors.semantic.successBg],
  REJECTED: [colors.semantic.error, colors.semantic.errorBg],
};

const getRatingColor = (rating?: number) => {
  if (!rating) return colors.text.secondary;
  if (rating >= 80) return colors.semantic.success;
  if (rating >= 60) return colors.brand.primary;
  if (rating >= 40) return colors.semantic.warning;
  return colors.semantic.error;
};

const getCompletenessBadge = (score?: number | null) => {
  if (typeof score !== 'number') {
    return null;
  }
  if (score >= 80) return { label: 'Complet', color: colors.semantic.success };
  if (score >= 40) return { label: 'Partiel', color: colors.semantic.warning };
  return { label: 'Minimal', color: colors.text.secondary };
};

const formatOptionalText = (value?: string | null) => {
  if (!value || !value.trim()) {
    return 'Non renseigné';
  }
  return value;
};

const formatOptionalNumber = (value?: number | null, suffix = '') => {
  if (value === undefined || value === null) {
    return 'Non renseigné';
  }
  return `${value}${suffix}`;
};

const getMissionTypeLabel = (value?: 'PRIORITY' | 'VOLUNTARY' | null) => {
  if (value === 'PRIORITY') return 'Prioritaire';
  if (value === 'VOLUNTARY') return 'Volontaire';
  return 'Non renseigné';
};

const getResolutionModeLabel = (value?: string | null) => {
  if (value === 'exact_match') return 'Correspondance exacte';
  if (value === 'probable_match') return 'Correspondance probable';
  if (value === 'created_new') return 'Nouveau joueur créé';
  return 'Non renseigné';
};

const ReportDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ReportDetailRouteProp>();
  const { reportId } = route.params;

  const [report, setReport] = useState<ScoutingReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      const data = await scoutingReportsApi.getById(reportId);
      setReport(data);
    } catch (error) {
      console.error('Erreur lors du chargement du rapport:', error);
      Alert.alert('Erreur', 'Impossible de charger le rapport');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!report) return;

    Alert.alert(
      'Soumettre le rapport',
      'Êtes-vous sûr de vouloir soumettre ce rapport pour revue?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: async () => {
            try {
              const updated = await scoutingReportsApi.submit(report.id);
              setReport(updated);
              Alert.alert('Succès', 'Rapport soumis avec succès');
            } catch (error) {
              console.error('Erreur lors de la soumission:', error);
              Alert.alert('Erreur', 'Impossible de soumettre le rapport');
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!report) return;

    Alert.alert(
      'Supprimer le rapport',
      'Êtes-vous sûr de vouloir supprimer ce rapport? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await scoutingReportsApi.delete(report.id);
              Alert.alert('Succès', 'Rapport supprimé');
              navigation.goBack();
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le rapport');
            }
          },
        },
      ]
    );
  };

  const getStatusLabel = (status: ReportStatus) => {
    switch (status) {
      case 'DRAFT': return 'Brouillon';
      case 'SUBMITTED': return 'Soumis';
      case 'APPROVED': return 'Approuvé';
      case 'REJECTED': return 'Rejeté';
      default: return status;
    }
  };

  const getRecommendationLabel = (recommendation?: string) => {
    switch (recommendation) {
      case 'BUY_NOW': return 'Recruter maintenant';
      case 'MONITOR': return 'Surveiller';
      case 'FOLLOW_UP': return 'Suivre';
      case 'NOT_INTERESTED': return 'Pas intéressé';
      case 'NEEDS_MORE_DATA': return 'Plus de données nécessaires';
      default: return 'Non défini';
    }
  };

  const getRecommendationColor = (recommendation?: string) => {
    switch (recommendation) {
      case 'BUY_NOW': return colors.semantic.error;
      case 'MONITOR': return colors.semantic.warning;
      case 'FOLLOW_UP': return colors.semantic.info;
      case 'NOT_INTERESTED': return colors.surface.border;
      case 'NEEDS_MORE_DATA': return colors.brand.accent;
      default: return colors.brand.primary;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Rapport" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator testID="report-detail-loading-indicator" size="large" color={colors.brand.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Rapport" />
        <View style={styles.errorContainer}>
          <Text testID="report-detail-empty" style={styles.errorText}>Rapport introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  const playerName = report.player?.user
    ? `${report.player.user.firstName || ''} ${report.player.user.lastName || ''}`.trim()
    : 'Joueur inconnu';

  const scoutName = report.scout
    ? `${report.scout.firstName || ''} ${report.scout.lastName || ''}`.trim()
    : 'Scout inconnu';

  const matchInfo = report.match
    ? `${report.match.homeClub?.name || 'Home'} vs ${report.match.awayClub?.name || 'Away'}`
    : 'Match inconnu';
  const completenessBadge = getCompletenessBadge(report.analysis?.identityCompletenessScore);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Détails du rapport"
        blur={false}
        borderBottom={false}
        rightActions={
          <TouchableOpacity testID="report-detail-delete" onPress={handleDelete} style={styles.iconButton}>
            <Icon name="trash" size={18} color={colors.semantic.error} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <LinearGradient
          colors={[colors.background.secondary, colors.background.tertiary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <LinearGradient
            colors={statusGradients[report.status]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statusBadge}
          >
            <Text style={styles.statusText}>{getStatusLabel(report.status)}</Text>
          </LinearGradient>

          <Text style={styles.heroPlayer}>{playerName}</Text>
          <Text style={styles.heroSubtitle}>{matchInfo}</Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Scout</Text>
              <Text style={styles.metaValue}>{scoutName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Créé le</Text>
              <Text style={styles.metaValue}>
                {new Date(report.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>

          {report.overallRating !== undefined && (
            <View style={styles.ratingBubbleRow}>
              <Text style={styles.ratingBubbleLabel}>Overall</Text>
              <View style={styles.ratingBubble}>
                <Text
                  style={[
                    styles.ratingBubbleValue,
                    { color: getRatingColor(report.overallRating) },
                  ]}
                >
                  {report.overallRating}
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        <GlassCard variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Joueur</Text>
          <InfoRow label="Nom" value={playerName} />
          {report.player?.position && <InfoRow label="Position" value={report.player.position} />}
          {report.playerPosition && <InfoRow label="Poste dans le match" value={report.playerPosition} />}
          {report.playerMinutesPlayed !== undefined && (
            <InfoRow label="Minutes jouées" value={`${report.playerMinutesPlayed}'`} />
          )}
        </GlassCard>

        <GlassCard variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Match</Text>
          <Text style={styles.matchTitle}>{matchInfo}</Text>
          {report.match?.date && (
            <Text style={styles.matchDate}>
              {new Date(report.match.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          )}
          {(report.match?.homeScore !== undefined && report.match?.awayScore !== undefined) && (
            <Text style={styles.matchScore}>
              Score: {report.match.homeScore} - {report.match.awayScore}
            </Text>
          )}
        </GlassCard>

        <GlassCard variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Évaluations</Text>
          {renderRatingRow('Note globale', report.overallRating)}
          {renderRatingRow('Technique', report.technicalRating)}
          {renderRatingRow('Physique', report.physicalRating)}
          {renderRatingRow('Mental', report.mentalRating)}
          {renderRatingRow('Tactique', report.tacticalRating)}
        </GlassCard>

        <GlassCard variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Identité observée</Text>
          {completenessBadge && (
            <View
              style={[
                styles.identityBadge,
                {
                  borderColor: completenessBadge.color,
                  backgroundColor: `${completenessBadge.color}22`,
                },
              ]}
            >
              <Text style={[styles.identityBadgeText, { color: completenessBadge.color }]}>
                {completenessBadge.label} ({Math.round(report.analysis?.identityCompletenessScore || 0)}%)
              </Text>
            </View>
          )}
          <InfoRow label="Prénom observé" value={formatOptionalText(report.observedFirstName)} />
          <InfoRow label="Nom observé" value={formatOptionalText(report.observedLastName)} />
          <InfoRow label="Nationalité observée" value={formatOptionalText(report.observedNationality)} />
          <InfoRow label="Téléphone observé" value={formatOptionalText(report.observedPhone)} />
          <InfoRow label="Email observé" value={formatOptionalText(report.observedEmail)} />
          <InfoRow
            label="Pied fort"
            value={formatOptionalText(report.observedDominantFoot || report.player?.preferredFoot)}
          />
          <InfoRow
            label="Taille"
            value={formatOptionalNumber(report.observedHeightCm ?? report.player?.height, ' cm')}
          />
          <InfoRow
            label="Poids"
            value={formatOptionalNumber(report.observedWeightKg ?? report.player?.weight, ' kg')}
          />
          <InfoRow label="Club observé" value={formatOptionalText(report.observedClubName)} />
        </GlassCard>

        <GlassCard variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Mission & envoi</Text>
          <InfoRow label="Type mission" value={getMissionTypeLabel(report.analysis?.missionType)} />
          <InfoRow
            label="Mode de rattachement"
            value={getResolutionModeLabel(report.analysis?.resolutionMode)}
          />
          <InfoRow
            label="Assignment"
            value={formatOptionalText(report.analysis?.assignmentId)}
          />
          <InfoRow label="Statut" value={getStatusLabel(report.status)} />
          <InfoRow
            label="Soumis le"
            value={
              report.submittedAt
                ? new Date(report.submittedAt).toLocaleString('fr-FR')
                : 'Non soumis'
            }
          />
          <Text style={styles.helperText}>Visible aux agents dès le statut SUBMITTED.</Text>
        </GlassCard>

        {report.analysis?.voice && (
          <GlassCard variant="elevated" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Voice notes</Text>
            <InfoRow
              label="Confiance transcription"
              value={
                typeof report.analysis.voice.confidence === 'number'
                  ? `${Math.round(report.analysis.voice.confidence * 100)}%`
                  : 'Non renseigné'
              }
            />
            <AnalysisBlock
              title="Transcription"
              content={formatOptionalText(report.analysis.voice.transcription)}
            />
            {Array.isArray(report.analysis.voice.warnings) &&
              report.analysis.voice.warnings.length > 0 && (
                <View style={styles.warningList}>
                  {report.analysis.voice.warnings.map((warning, index) => (
                    <Text key={`${warning}-${index}`} style={styles.warningText}>
                      • {warning}
                    </Text>
                  ))}
                </View>
              )}
            {report.analysis.voice.audioUrl && (
              <AnalysisBlock title="Audio source" content={report.analysis.voice.audioUrl} />
            )}
          </GlassCard>
        )}

        <GlassCard variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Analyse pro</Text>
          <AnalysisBlock
            title="Habileté technique avec ballon"
            content={formatOptionalText(report.withBallAnalysis)}
          />
          <AnalysisBlock
            title="Jeu sans ballon"
            content={formatOptionalText(report.offBallAnalysis)}
          />
          <AnalysisBlock
            title="Réflexion / intelligence de jeu"
            content={formatOptionalText(report.gameIntelligenceAnalysis)}
          />
          <AnalysisBlock title="Attitude" content={formatOptionalText(report.attitudeAnalysis)} />
          <AnalysisBlock
            title="Avis du scout-staff"
            content={formatOptionalText(report.staffOpinion || report.conclusion)}
          />
          <AnalysisBlock title="Résumé global" content={formatOptionalText(report.summary)} />
          <AnalysisBlock title="Points forts" content={formatOptionalText(report.strengths)} />
          <AnalysisBlock title="Points faibles" content={formatOptionalText(report.weaknesses)} />
        </GlassCard>

        <GlassCard variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tests athlétiques</Text>
          <InfoRow label="10m" value={formatOptionalNumber(report.sprint10mSec, ' s')} />
          <InfoRow label="20m" value={formatOptionalNumber(report.sprint20mSec, ' s')} />
          <InfoRow label="40m" value={formatOptionalNumber(report.sprint40mSec, ' s')} />
          <InfoRow label="VMA" value={formatOptionalNumber(report.vmaKmh, ' km/h')} />
        </GlassCard>

        {report.recommendation && (
          <GlassCard variant="elevated" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Recommandation</Text>
            <View
              style={[
                styles.recommendationBadge,
                { backgroundColor: getRecommendationColor(report.recommendation) },
              ]}
            >
              <Text style={styles.recommendationText}>{getRecommendationLabel(report.recommendation)}</Text>
            </View>
            {report.recommendationNotes && (
              <Text style={styles.recommendationNotes}>{report.recommendationNotes}</Text>
            )}
          </GlassCard>
        )}

        {report.tags && report.tags.length > 0 && (
          <GlassCard variant="elevated" style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {report.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        <GlassCard variant="elevated" style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Scout</Text>
          <Text style={styles.scoutName}>{scoutName}</Text>
          {report.scout?.email && <Text style={styles.scoutEmail}>{report.scout.email}</Text>}
          <Text style={styles.scoutDate}>
            Mis à jour le {new Date(report.updatedAt).toLocaleDateString('fr-FR')}
          </Text>
        </GlassCard>
      </ScrollView>

      {report.status === 'DRAFT' && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            testID="report-detail-submit"
            style={[styles.actionButton, styles.submitButton]}
            onPress={handleSubmit}
          >
            <Icon name="paperPlane" size={18} color={colors.background.primary} />
            <Text style={styles.actionButtonText}>Soumettre</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const renderRatingRow = (label: string, value?: number) => {
  if (value === undefined) return null;

  return (
    <View style={styles.ratingRow}>
      <View style={styles.ratingRowHeader}>
        <Text style={styles.ratingRowLabel}>{label}</Text>
        <Text style={[styles.ratingRowValue, { color: getRatingColor(value) }]}>{value}/100</Text>
      </View>
      <View style={styles.ratingBar}>
        <View style={[styles.ratingFill, { width: `${value}%` }]} />
      </View>
    </View>
  );
};

const AnalysisBlock = ({ title, content }: { title: string; content: string }) => (
  <View style={styles.analysisBlock}>
    <Text style={styles.analysisTitle}>{title}</Text>
    <Text style={styles.analysisText}>{content}</Text>
  </View>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  iconButton: {
    padding: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
  },
  heroCard: {
    borderRadius: 32,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    color: colors.background.primary,
  },
  heroPlayer: {
    fontSize: 28,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  heroSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metaValue: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.xs / 2,
  },
  ratingBubbleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  ratingBubbleLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  ratingBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.surface.border,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBubbleValue: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
  },
  sectionCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: '700',
    color: colors.text.primary,
  },
  identityBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  identityBadgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.borderLight,
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    fontWeight: '600',
  },
  matchTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  matchDate: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  matchScore: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  ratingRow: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  ratingRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingRowLabel: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  ratingRowValue: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  ratingBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surface.glassLight,
    overflow: 'hidden',
  },
  ratingFill: {
    height: '100%',
    backgroundColor: colors.brand.primary,
    borderRadius: 5,
  },
  analysisBlock: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  analysisTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
  },
  analysisText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  warningList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.semantic.warning,
  },
  helperText: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  recommendationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginBottom: spacing.sm,
  },
  recommendationText: {
    fontSize: typography.sizes.sm,
    fontWeight: '700',
    color: colors.background.primary,
  },
  recommendationNotes: {
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  tagText: {
    fontSize: typography.sizes.xs,
    color: colors.brand.primary,
    fontWeight: '600',
  },
  scoutName: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.text.primary,
  },
  scoutEmail: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  scoutDate: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  actionBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.surface.border,
    backgroundColor: colors.background.primary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
  },
  actionButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
    color: colors.background.primary,
  },
});

export default ReportDetailScreen;
