import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { scoutingReportsApi, ScoutingReport, ReportStatus } from '../../services/api/scouting-reports';

type ReportDetailRouteProp = RouteProp<{ params: { reportId: string } }, 'params'>;

const ReportDetailScreen = () => {
  const navigation = useNavigation();
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

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'DRAFT': return '#95a5a6';
      case 'SUBMITTED': return '#3498db';
      case 'APPROVED': return '#2ecc71';
      case 'REJECTED': return '#e74c3c';
      default: return '#95a5a6';
    }
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
      case 'BUY_NOW': return '#e74c3c';
      case 'MONITOR': return '#f39c12';
      case 'FOLLOW_UP': return '#3498db';
      case 'NOT_INTERESTED': return '#95a5a6';
      case 'NEEDS_MORE_DATA': return '#9b59b6';
      default: return '#bdc3c7';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator testID="report-detail-loading-indicator" size="large" color="#2c3e50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.container}>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="report-detail-back" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails du rapport</Text>
        <TouchableOpacity testID="report-detail-delete" onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#e74c3c" />
        </TouchableOpacity>
        </View>

      <ScrollView style={styles.content}>
        {/* Status Section */}
        <View style={styles.section}>
          <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(report.status) }]}>
            <Text style={styles.statusTextLarge}>{getStatusLabel(report.status)}</Text>
          </View>
        </View>

        {/* Player Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joueur</Text>
          <View style={styles.card}>
            <Text style={styles.playerName}>{playerName}</Text>
            {report.player?.position && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position:</Text>
                <Text style={styles.infoValue}>{report.player.position}</Text>
              </View>
            )}
            {report.playerPosition && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Position dans ce match:</Text>
                <Text style={styles.infoValue}>{report.playerPosition}</Text>
              </View>
            )}
            {report.playerMinutesPlayed !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Minutes jouées:</Text>
                <Text style={styles.infoValue}>{report.playerMinutesPlayed}'</Text>
              </View>
            )}
          </View>
        </View>

        {/* Match Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match</Text>
          <View style={styles.card}>
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
          </View>
        </View>

        {/* Ratings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évaluations</Text>
          <View style={styles.card}>
            {report.overallRating !== undefined && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Note globale</Text>
                <View style={styles.ratingBar}>
                  <View style={[styles.ratingFill, { width: `${report.overallRating}%` }]} />
                  <Text style={styles.ratingValue}>{report.overallRating}/100</Text>
                </View>
              </View>
            )}
            {report.technicalRating !== undefined && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Technique</Text>
                <View style={styles.ratingBar}>
                  <View style={[styles.ratingFill, { width: `${report.technicalRating}%` }]} />
                  <Text style={styles.ratingValue}>{report.technicalRating}/100</Text>
                </View>
              </View>
            )}
            {report.physicalRating !== undefined && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Physique</Text>
                <View style={styles.ratingBar}>
                  <View style={[styles.ratingFill, { width: `${report.physicalRating}%` }]} />
                  <Text style={styles.ratingValue}>{report.physicalRating}/100</Text>
                </View>
              </View>
            )}
            {report.mentalRating !== undefined && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Mental</Text>
                <View style={styles.ratingBar}>
                  <View style={[styles.ratingFill, { width: `${report.mentalRating}%` }]} />
                  <Text style={styles.ratingValue}>{report.mentalRating}/100</Text>
                </View>
              </View>
            )}
            {report.tacticalRating !== undefined && (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Tactique</Text>
                <View style={styles.ratingBar}>
                  <View style={[styles.ratingFill, { width: `${report.tacticalRating}%` }]} />
                  <Text style={styles.ratingValue}>{report.tacticalRating}/100</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Analysis Section */}
        {(report.strengths || report.weaknesses || report.conclusion) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analyse</Text>
            <View style={styles.card}>
              {report.strengths && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.analysisTitle}>Points forts</Text>
                  <Text style={styles.analysisText}>{report.strengths}</Text>
                </View>
              )}
              {report.weaknesses && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.analysisTitle}>Points faibles</Text>
                  <Text style={styles.analysisText}>{report.weaknesses}</Text>
                </View>
              )}
              {report.conclusion && (
                <View style={styles.analysisBlock}>
                  <Text style={styles.analysisTitle}>Conclusion</Text>
                  <Text style={styles.analysisText}>{report.conclusion}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Recommendation Section */}
        {report.recommendation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommandation</Text>
            <View style={styles.card}>
              <View style={[styles.recommendationBadge, { backgroundColor: getRecommendationColor(report.recommendation) }]}>
                <Text style={styles.recommendationText}>{getRecommendationLabel(report.recommendation)}</Text>
              </View>
              {report.recommendationNotes && (
                <Text style={styles.recommendationNotes}>{report.recommendationNotes}</Text>
              )}
            </View>
          </View>
        )}

        {/* Tags Section */}
        {report.tags && report.tags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {report.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Scout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Scout</Text>
          <View style={styles.card}>
            <Text style={styles.scoutName}>{scoutName}</Text>
            <Text style={styles.scoutEmail}>{report.scout?.email}</Text>
            <Text style={styles.scoutDate}>
              Créé le {new Date(report.createdAt).toLocaleDateString('fr-FR')}
            </Text>
            {report.submittedAt && (
              <Text style={styles.scoutDate}>
                Soumis le {new Date(report.submittedAt).toLocaleDateString('fr-FR')}
              </Text>
            )}
            {report.reviewedAt && (
              <Text style={styles.scoutDate}>
                Reviewé le {new Date(report.reviewedAt).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {report.status === 'DRAFT' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.submitButton]}
            onPress={handleSubmit}
            testID="report-detail-submit"
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Soumettre</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
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
    fontSize: 18,
    color: '#7f8c8d',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadgeLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  statusTextLarge: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  matchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  matchDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  matchScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  ratingRow: {
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  ratingBar: {
    height: 32,
    backgroundColor: '#ecf0f1',
    borderRadius: 16,
    position: 'relative',
    justifyContent: 'center',
  },
  ratingFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#3498db',
    borderRadius: 16,
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c3e50',
    textAlign: 'center',
    zIndex: 1,
  },
  analysisBlock: {
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  analysisText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  recommendationBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  recommendationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  recommendationNotes: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#3498db',
  },
  scoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  scoutEmail: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  scoutDate: {
    fontSize: 13,
    color: '#95a5a6',
    marginBottom: 2,
  },
  actionButtons: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
  },
  submitButton: {
    backgroundColor: '#2ecc71',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ReportDetailScreen;
