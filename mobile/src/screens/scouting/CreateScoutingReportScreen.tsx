import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../contexts/ThemeContext';
import { useScouting, ScoutingReport } from '../../contexts/ScoutingContext';
import { GlassCard, GradientText } from '../../components/ui';
import { spacing, typography, radius } from '../../design/theme';

export const CreateScoutingReportScreen = ({ navigation, route }: any) => {
  const { colors } = useTheme();
  const { createReport, updateReport } = useScouting();
  const { playerId, playerName, playerPosition } = route.params || {};

  // Form state
  const [formData, setFormData] = useState({
    playerName: playerName || '',
    playerPosition: playerPosition || 'ST',
    scoutName: '',
    matchDate: new Date().toISOString().split('T')[0],
    opponent: '',
    competition: '',

    // Ratings
    technicalSkills: 5,
    tacticalAwareness: 5,
    physicalCondition: 5,
    mentalStrength: 5,

    // Skills
    pace: 5,
    shooting: 5,
    passing: 5,
    dribbling: 5,
    defending: 5,
    heading: 5,

    // Observations
    strengths: '',
    weaknesses: '',
    keyMoments: '',

    // Recommendation
    recommendation: 'monitor' as ScoutingReport['recommendation'],
    recommendationNotes: '',
    marketValueEstimate: 5000000,

    // Tags
    tags: '',
  });

  const positions = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF'];

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateOverallRating = () => {
    const { technicalSkills, tacticalAwareness, physicalCondition, mentalStrength } = formData;
    return ((technicalSkills + tacticalAwareness + physicalCondition + mentalStrength) / 4).toFixed(1);
  };

  const handleSaveDraft = async () => {
    if (!formData.playerName || !formData.scoutName) {
      Alert.alert('Erreur', 'Le nom du joueur et du scout sont requis');
      return;
    }

    try {
      const report = await createReport({
        playerId: playerId || `player_${Date.now()}`,
        playerName: formData.playerName,
        playerPosition: formData.playerPosition,
        scoutName: formData.scoutName,
        matchDate: formData.matchDate,
        opponent: formData.opponent,
        competition: formData.competition,

        technicalSkills: formData.technicalSkills,
        tacticalAwareness: formData.tacticalAwareness,
        physicalCondition: formData.physicalCondition,
        mentalStrength: formData.mentalStrength,
        overallRating: parseFloat(calculateOverallRating()),

        skills: {
          pace: formData.pace,
          shooting: formData.shooting,
          passing: formData.passing,
          dribbling: formData.dribbling,
          defending: formData.defending,
          heading: formData.heading,
        },

        strengths: formData.strengths.split('\n').filter(s => s.trim()),
        weaknesses: formData.weaknesses.split('\n').filter(w => w.trim()),
        keyMoments: formData.keyMoments.split('\n').filter(k => k.trim()),

        recommendation: formData.recommendation,
        recommendationNotes: formData.recommendationNotes,
        marketValueEstimate: formData.marketValueEstimate,

        status: 'draft',
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });

      navigation.goBack();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder le rapport');
    }
  };

  const handleSubmit = async () => {
    Alert.alert(
      'Soumettre le rapport',
      'Voulez-vous soumettre ce rapport pour révision ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Soumettre',
          onPress: async () => {
            if (!formData.playerName || !formData.scoutName) {
              Alert.alert('Erreur', 'Le nom du joueur et du scout sont requis');
              return;
            }

            try {
              const report = await createReport({
                playerId: playerId || `player_${Date.now()}`,
                playerName: formData.playerName,
                playerPosition: formData.playerPosition,
                scoutName: formData.scoutName,
                matchDate: formData.matchDate,
                opponent: formData.opponent,
                competition: formData.competition,

                technicalSkills: formData.technicalSkills,
                tacticalAwareness: formData.tacticalAwareness,
                physicalCondition: formData.physicalCondition,
                mentalStrength: formData.mentalStrength,
                overallRating: parseFloat(calculateOverallRating()),

                skills: {
                  pace: formData.pace,
                  shooting: formData.shooting,
                  passing: formData.passing,
                  dribbling: formData.dribbling,
                  defending: formData.defending,
                  heading: formData.heading,
                },

                strengths: formData.strengths.split('\n').filter(s => s.trim()),
                weaknesses: formData.weaknesses.split('\n').filter(w => w.trim()),
                keyMoments: formData.keyMoments.split('\n').filter(k => k.trim()),

                recommendation: formData.recommendation,
                recommendationNotes: formData.recommendationNotes,
                marketValueEstimate: formData.marketValueEstimate,

                status: 'submitted',
                tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
              });

              navigation.goBack();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de soumettre le rapport');
            }
          },
        },
      ]
    );
  };

  const RatingSlider = ({ label, value, onChange }: { label: string; value: number; onChange: (val: number) => void }) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, { color: colors.textPrimary }]}>{label}</Text>
        <View style={[styles.sliderValue, { backgroundColor: colors.accent + '20' }]}>
          <Text style={[styles.sliderValueText, { color: colors.accent }]}>{value.toFixed(1)}</Text>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={10}
        step={0.5}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={colors.accent}
        maximumTrackTintColor={colors.glassBorder}
        thumbTintColor={colors.accent}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.darkBg }]} edges={['top']}>
      <LinearGradient
        colors={[colors.dark, colors.darkBg]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <GradientText variant="arcane" style={styles.headerTitle}>
          Nouveau Rapport
        </GradientText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Player Info Section */}
        <GlassCard variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Informations du joueur
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nom du joueur *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ex: Kylian Mbappé"
              placeholderTextColor={colors.textTertiary}
              value={formData.playerName}
              onChangeText={(val) => updateField('playerName', val)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Position</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.positionButtons}>
                {positions.map(pos => (
                  <TouchableOpacity
                    key={pos}
                    style={[
                      styles.positionButton,
                      {
                        backgroundColor: formData.playerPosition === pos ? colors.accent : colors.glass,
                        borderColor: formData.playerPosition === pos ? colors.accent : colors.glassBorder,
                      }
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      updateField('playerPosition', pos);
                    }}
                  >
                    <Text
                      style={[
                        styles.positionText,
                        { color: formData.playerPosition === pos ? colors.textInverse : colors.textSecondary }
                      ]}
                    >
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </GlassCard>

        {/* Match Info Section */}
        <GlassCard variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Informations du match
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nom du scout *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Votre nom"
              placeholderTextColor={colors.textTertiary}
              value={formData.scoutName}
              onChangeText={(val) => updateField('scoutName', val)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Date du match</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textTertiary}
              value={formData.matchDate}
              onChangeText={(val) => updateField('matchDate', val)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Adversaire</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ex: Real Madrid"
              placeholderTextColor={colors.textTertiary}
              value={formData.opponent}
              onChangeText={(val) => updateField('opponent', val)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Compétition</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ex: Champions League"
              placeholderTextColor={colors.textTertiary}
              value={formData.competition}
              onChangeText={(val) => updateField('competition', val)}
            />
          </View>
        </GlassCard>

        {/* Performance Ratings */}
        <GlassCard variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Évaluation générale
          </Text>
          <View style={[styles.overallRating, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[styles.overallLabel, { color: colors.textSecondary }]}>Note globale</Text>
            <Text style={[styles.overallValue, { color: colors.accent }]}>
              {calculateOverallRating()}/10
            </Text>
          </View>

          <RatingSlider
            label="Compétences techniques"
            value={formData.technicalSkills}
            onChange={(val) => updateField('technicalSkills', val)}
          />
          <RatingSlider
            label="Conscience tactique"
            value={formData.tacticalAwareness}
            onChange={(val) => updateField('tacticalAwareness', val)}
          />
          <RatingSlider
            label="Condition physique"
            value={formData.physicalCondition}
            onChange={(val) => updateField('physicalCondition', val)}
          />
          <RatingSlider
            label="Force mentale"
            value={formData.mentalStrength}
            onChange={(val) => updateField('mentalStrength', val)}
          />
        </GlassCard>

        {/* Skills Section */}
        <GlassCard variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Compétences détaillées
          </Text>

          <RatingSlider
            label="Vitesse"
            value={formData.pace}
            onChange={(val) => updateField('pace', val)}
          />
          <RatingSlider
            label="Tir"
            value={formData.shooting}
            onChange={(val) => updateField('shooting', val)}
          />
          <RatingSlider
            label="Passe"
            value={formData.passing}
            onChange={(val) => updateField('passing', val)}
          />
          <RatingSlider
            label="Dribble"
            value={formData.dribbling}
            onChange={(val) => updateField('dribbling', val)}
          />
          <RatingSlider
            label="Défense"
            value={formData.defending}
            onChange={(val) => updateField('defending', val)}
          />
          <RatingSlider
            label="Jeu de tête"
            value={formData.heading}
            onChange={(val) => updateField('heading', val)}
          />
        </GlassCard>

        {/* Observations Section */}
        <GlassCard variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Observations
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Points forts (un par ligne)
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ex: Excellente vision du jeu&#10;Très rapide&#10;Bon dans les duels"
              placeholderTextColor={colors.textTertiary}
              value={formData.strengths}
              onChangeText={(val) => updateField('strengths', val)}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Points faibles (un par ligne)
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ex: Manque de constance&#10;Faiblesse défensive"
              placeholderTextColor={colors.textTertiary}
              value={formData.weaknesses}
              onChangeText={(val) => updateField('weaknesses', val)}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Moments clés (un par ligne)
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ex: 23' - But magnifique&#10;67' - Passe décisive"
              placeholderTextColor={colors.textTertiary}
              value={formData.keyMoments}
              onChangeText={(val) => updateField('keyMoments', val)}
              multiline
              numberOfLines={4}
            />
          </View>
        </GlassCard>

        {/* Recommendation Section */}
        <GlassCard variant="elevated" style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Recommandation
          </Text>

          <View style={styles.recommendationButtons}>
            {[
              { value: 'sign', label: 'Recruter', icon: 'checkmark-circle', color: colors.success },
              { value: 'monitor', label: 'Surveiller', icon: 'eye', color: colors.warning },
              { value: 'pass', label: 'Passer', icon: 'close-circle', color: colors.error },
            ].map(rec => (
              <TouchableOpacity
                key={rec.value}
                style={[
                  styles.recommendationButton,
                  {
                    backgroundColor: formData.recommendation === rec.value ? rec.color + '20' : colors.glass,
                    borderColor: formData.recommendation === rec.value ? rec.color : colors.glassBorder,
                  }
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  updateField('recommendation', rec.value);
                }}
              >
                <Ionicons
                  name={rec.icon as any}
                  size={24}
                  color={formData.recommendation === rec.value ? rec.color : colors.textTertiary}
                />
                <Text
                  style={[
                    styles.recommendationText,
                    { color: formData.recommendation === rec.value ? rec.color : colors.textSecondary }
                  ]}
                >
                  {rec.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Valeur marchande estimée (€)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ex: 5000000"
              placeholderTextColor={colors.textTertiary}
              value={formData.marketValueEstimate.toString()}
              onChangeText={(val) => updateField('marketValueEstimate', parseInt(val) || 0)}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Notes de recommandation
            </Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ajoutez vos commentaires..."
              placeholderTextColor={colors.textTertiary}
              value={formData.recommendationNotes}
              onChangeText={(val) => updateField('recommendationNotes', val)}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Tags (séparés par des virgules)
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.glass, color: colors.textPrimary }]}
              placeholder="Ex: jeune, prometteur, technique"
              placeholderTextColor={colors.textTertiary}
              value={formData.tags}
              onChangeText={(val) => updateField('tags', val)}
            />
          </View>
        </GlassCard>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.draftButton, { backgroundColor: colors.glass }]}
            onPress={handleSaveDraft}
          >
            <Ionicons name="save-outline" size={20} color={colors.textPrimary} />
            <Text style={[styles.actionButtonText, { color: colors.textPrimary }]}>
              Sauvegarder brouillon
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.submitButton, { backgroundColor: colors.accent }]}
            onPress={handleSubmit}
          >
            <Ionicons name="send" size={20} color={colors.textInverse} />
            <Text style={[styles.actionButtonText, { color: colors.textInverse }]}>
              Soumettre
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing["2xl"],
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    fontSize: typography.sizes.base,
  },
  textArea: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    fontSize: typography.sizes.base,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  positionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  positionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  positionText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
  },
  overallRating: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  overallLabel: {
    fontSize: typography.sizes.base,
    fontWeight: '600',
  },
  overallValue: {
    fontSize: typography.sizes.h3,
    fontWeight: 'bold',
  },
  sliderContainer: {
    marginBottom: spacing.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sliderLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: '500',
  },
  sliderValue: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  sliderValueText: {
    fontSize: typography.sizes.sm,
    fontWeight: 'bold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  recommendationButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  recommendationButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
  },
  recommendationText: {
    fontSize: typography.sizes.xs,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  draftButton: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButton: {},
  actionButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: 'bold',
  },
});