import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { scoutingReportsApi, RecommendationType } from '../../services/api/scouting-reports';
import api from '../../services/api';

const CreateReportScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  // Form state
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [overallRating, setOverallRating] = useState('');
  const [technicalRating, setTechnicalRating] = useState('');
  const [physicalRating, setPhysicalRating] = useState('');
  const [mentalRating, setMentalRating] = useState('');
  const [tacticalRating, setTacticalRating] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [conclusion, setConclusion] = useState('');
  const [recommendation, setRecommendation] = useState<RecommendationType | undefined>();
  const [recommendationNotes, setRecommendationNotes] = useState('');
  const [tags, setTags] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [playerMinutesPlayed, setPlayerMinutesPlayed] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [matchesData, playersData] = await Promise.all([
        api.getMatches({ limit: 50 }),
        api.getPlayers({ limit: 100 }),
      ]);
      setMatches(matchesData.items ?? matchesData.data ?? []);
      setPlayers(playersData.items ?? playersData.data ?? []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedMatchId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un match');
      return;
    }
    if (!selectedPlayerId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un joueur');
      return;
    }

    setLoading(true);
    try {
      const reportData: any = {
        matchId: selectedMatchId,
        playerId: selectedPlayerId,
      };

      // Add optional fields
      if (overallRating) reportData.overallRating = parseInt(overallRating);
      if (technicalRating) reportData.technicalRating = parseInt(technicalRating);
      if (physicalRating) reportData.physicalRating = parseInt(physicalRating);
      if (mentalRating) reportData.mentalRating = parseInt(mentalRating);
      if (tacticalRating) reportData.tacticalRating = parseInt(tacticalRating);
      if (strengths) reportData.strengths = strengths;
      if (weaknesses) reportData.weaknesses = weaknesses;
      if (conclusion) reportData.conclusion = conclusion;
      if (recommendation) reportData.recommendation = recommendation;
      if (recommendationNotes) reportData.recommendationNotes = recommendationNotes;
      if (tags) reportData.tags = tags.split(',').map(t => t.trim()).filter(t => t);
      if (playerPosition) reportData.playerPosition = playerPosition;
      if (playerMinutesPlayed) reportData.playerMinutesPlayed = parseInt(playerMinutesPlayed);

      const newReport = await scoutingReportsApi.create(reportData);
      Alert.alert('Succès', 'Rapport créé avec succès', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer le rapport');
    } finally {
      setLoading(false);
    }
  };

  const recommendations: { value: RecommendationType; label: string; color: string }[] = [
    { value: 'BUY_NOW', label: 'Recruter maintenant', color: '#e74c3c' },
    { value: 'MONITOR', label: 'Surveiller', color: '#f39c12' },
    { value: 'FOLLOW_UP', label: 'Suivre', color: '#3498db' },
    { value: 'NOT_INTERESTED', label: 'Pas intéressé', color: '#95a5a6' },
    { value: 'NEEDS_MORE_DATA', label: 'Plus de données', color: '#9b59b6' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity testID="create-report-close" onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#2c3e50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nouveau rapport</Text>
        <TouchableOpacity testID="create-report-submit" onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <ActivityIndicator testID="create-report-loading" size="small" color="#2c3e50" />
          ) : (
            <Text style={styles.saveText}>Créer</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Match Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Match *</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Sélectionner un match</Text>
            {matches.length > 0 ? (
              <ScrollView style={styles.optionsList} nestedScrollEnabled>
                {matches.slice(0, 10).map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    testID={`create-report-match-${match.id}`}
                    style={[
                      styles.optionItem,
                      selectedMatchId === match.id && styles.optionItemSelected,
                    ]}
                    onPress={() => setSelectedMatchId(match.id)}
                  >
                    <Text style={styles.optionText}>
                      {match.homeClub?.name || 'Home'} vs {match.awayClub?.name || 'Away'}
                    </Text>
                    <Text style={styles.optionSubtext}>
                      {new Date(match.date).toLocaleDateString('fr-FR')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Aucun match disponible</Text>
            )}
          </View>
        </View>

        {/* Player Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Joueur *</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Sélectionner un joueur</Text>
            {players.length > 0 ? (
              <ScrollView style={styles.optionsList} nestedScrollEnabled>
                {players.slice(0, 20).map((player) => (
                  <TouchableOpacity
                    key={player.id}
                    testID={`create-report-player-${player.id}`}
                    style={[
                      styles.optionItem,
                      selectedPlayerId === player.id && styles.optionItemSelected,
                    ]}
                    onPress={() => setSelectedPlayerId(player.id)}
                  >
                    <Text style={styles.optionText}>
                      {player.user?.firstName || ''} {player.user?.lastName || ''}
                    </Text>
                    {player.position && (
                      <Text style={styles.optionSubtext}>{player.position}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.emptyText}>Aucun joueur disponible</Text>
            )}
          </View>
        </View>

        {/* Player Context */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contexte du match</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Position jouée</Text>
            <TextInput
              testID="create-report-player-position"
              style={styles.input}
              value={playerPosition}
              onChangeText={setPlayerPosition}
              placeholder="Ex: Milieu central"
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.fieldLabel}>Minutes jouées</Text>
            <TextInput
              testID="create-report-player-minutes"
              style={styles.input}
              value={playerMinutesPlayed}
              onChangeText={setPlayerMinutesPlayed}
              placeholder="Ex: 90"
              keyboardType="numeric"
              placeholderTextColor="#95a5a6"
            />
          </View>
        </View>

        {/* Ratings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Évaluations (0-100)</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Note globale</Text>
            <TextInput
              testID="create-report-rating-overall"
              style={styles.input}
              value={overallRating}
              onChangeText={setOverallRating}
              placeholder="0-100"
              keyboardType="numeric"
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.fieldLabel}>Technique</Text>
            <TextInput
              testID="create-report-rating-technical"
              style={styles.input}
              value={technicalRating}
              onChangeText={setTechnicalRating}
              placeholder="0-100"
              keyboardType="numeric"
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.fieldLabel}>Physique</Text>
            <TextInput
              testID="create-report-rating-physical"
              style={styles.input}
              value={physicalRating}
              onChangeText={setPhysicalRating}
              placeholder="0-100"
              keyboardType="numeric"
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.fieldLabel}>Mental</Text>
            <TextInput
              testID="create-report-rating-mental"
              style={styles.input}
              value={mentalRating}
              onChangeText={setMentalRating}
              placeholder="0-100"
              keyboardType="numeric"
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.fieldLabel}>Tactique</Text>
            <TextInput
              testID="create-report-rating-tactical"
              style={styles.input}
              value={tacticalRating}
              onChangeText={setTacticalRating}
              placeholder="0-100"
              keyboardType="numeric"
              placeholderTextColor="#95a5a6"
            />
          </View>
        </View>

        {/* Analysis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analyse</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Points forts</Text>
            <TextInput
              testID="create-report-strengths"
              style={[styles.input, styles.textArea]}
              value={strengths}
              onChangeText={setStrengths}
              placeholder="Décrivez les points forts du joueur..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.fieldLabel}>Points faibles</Text>
            <TextInput
              testID="create-report-weaknesses"
              style={[styles.input, styles.textArea]}
              value={weaknesses}
              onChangeText={setWeaknesses}
              placeholder="Décrivez les points faibles du joueur..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#95a5a6"
            />

            <Text style={styles.fieldLabel}>Conclusion</Text>
            <TextInput
              testID="create-report-conclusion"
              style={[styles.input, styles.textArea]}
              value={conclusion}
              onChangeText={setConclusion}
              placeholder="Votre conclusion générale..."
              multiline
              numberOfLines={4}
              placeholderTextColor="#95a5a6"
            />
          </View>
        </View>

        {/* Recommendation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommandation</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Type de recommandation</Text>
            <View style={styles.recommendationButtons}>
              {recommendations.map((rec) => (
                <TouchableOpacity
                  key={rec.value}
                  testID={`create-report-reco-${rec.value}`}
                  style={[
                    styles.recommendationButton,
                    recommendation === rec.value && {
                      backgroundColor: rec.color,
                      borderColor: rec.color,
                    },
                  ]}
                  onPress={() => setRecommendation(rec.value)}
                >
                  <Text
                    style={[
                      styles.recommendationButtonText,
                      recommendation === rec.value && styles.recommendationButtonTextActive,
                    ]}
                  >
                    {rec.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Notes de recommandation</Text>
            <TextInput
              testID="create-report-recommendation-notes"
              style={[styles.input, styles.textArea]}
              value={recommendationNotes}
              onChangeText={setRecommendationNotes}
              placeholder="Détails sur votre recommandation..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#95a5a6"
            />
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Mots-clés (séparés par des virgules)</Text>
            <TextInput
              testID="create-report-tags"
              style={styles.input}
              value={tags}
              onChangeText={setTags}
              placeholder="Ex: rapide, bon pied gauche, leadership"
              placeholderTextColor="#95a5a6"
            />
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
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
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2ecc71',
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
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  optionItemSelected: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  optionSubtext: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    padding: 20,
  },
  recommendationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  recommendationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  recommendationButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
  },
  recommendationButtonTextActive: {
    color: '#fff',
  },
});

export default CreateReportScreen;
