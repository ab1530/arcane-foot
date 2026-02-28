import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { scoutingReportsApi, RecommendationType } from '../../services/api/scouting-reports';
import { playersApi } from '../../services/api/players';
import api from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { AppStackParamList } from '../../types/navigation';
import type { ExtractedReportData } from '../../types/voice-to-report';

type CreateReportNavigationProp = NativeStackNavigationProp<AppStackParamList, 'CreateReport'>;
type CreateReportRouteProp = RouteProp<AppStackParamList, 'CreateReport'>;
type CreateReportVoicePayload = {
  transcription?: string;
  confidence?: number;
  audioUrl?: string;
  warnings?: string[];
};

const normalizeRecommendationFromVoice = (
  value?: ExtractedReportData['recommendation'],
): RecommendationType | undefined => {
  if (!value) return undefined;
  if (value === 'BUY_NOW') return 'BUY_NOW';
  if (value === 'NOT_INTERESTED') return 'NOT_INTERESTED';
  if (value === 'WATCH') return 'MONITOR';
  if (value === 'NEEDS_DEVELOPMENT') return 'NEEDS_MORE_DATA';
  return undefined;
};

const toStringValue = (value?: string | number | null): string => {
  if (value === null || value === undefined) return '';
  return String(value);
};

const getResolutionModeLabel = (mode?: 'exact_match' | 'probable_match' | 'created_new') => {
  if (mode === 'exact_match') return 'correspondance exacte';
  if (mode === 'probable_match') return 'correspondance probable';
  if (mode === 'created_new') return 'nouveau joueur prospect';
  return 'résolution inconnue';
};

const CreateReportScreen = () => {
  const navigation = useNavigation<CreateReportNavigationProp>();
  const route = useRoute<CreateReportRouteProp>();
  const { colors } = useTheme();
  const { dictionary } = useLocalization();
  const t = (dictionary as any).reports?.create ?? {
    title: 'Nouveau rapport',
    match: 'Match',
    player: 'Joueur',
    context: 'Contexte du match',
    ratings: 'Évaluations',
    analysis: 'Analyse',
    recommendation: 'Recommandation',
    metadata: 'Étiquettes',
    create: 'Créer',
  };

  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);

  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [assignmentId, setAssignmentId] = useState<string | undefined>(route.params?.assignmentId);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [overallRating, setOverallRating] = useState('');
  const [technicalRating, setTechnicalRating] = useState('');
  const [physicalRating, setPhysicalRating] = useState('');
  const [mentalRating, setMentalRating] = useState('');
  const [tacticalRating, setTacticalRating] = useState('');
  const [withBallAnalysis, setWithBallAnalysis] = useState('');
  const [offBallAnalysis, setOffBallAnalysis] = useState('');
  const [gameIntelligenceAnalysis, setGameIntelligenceAnalysis] = useState('');
  const [attitudeAnalysis, setAttitudeAnalysis] = useState('');
  const [staffOpinion, setStaffOpinion] = useState('');
  const [summary, setSummary] = useState('');
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [observedDominantFoot, setObservedDominantFoot] = useState('');
  const [observedHeightCm, setObservedHeightCm] = useState('');
  const [observedWeightKg, setObservedWeightKg] = useState('');
  const [observedClubName, setObservedClubName] = useState('');
  const [observedFirstName, setObservedFirstName] = useState('');
  const [observedLastName, setObservedLastName] = useState('');
  const [observedNationality, setObservedNationality] = useState('');
  const [observedPhone, setObservedPhone] = useState('');
  const [observedEmail, setObservedEmail] = useState('');
  const [sprint10mSec, setSprint10mSec] = useState('');
  const [sprint20mSec, setSprint20mSec] = useState('');
  const [sprint40mSec, setSprint40mSec] = useState('');
  const [vmaKmh, setVmaKmh] = useState('');
  const [recommendation, setRecommendation] = useState<RecommendationType | undefined>();
  const [recommendationNotes, setRecommendationNotes] = useState('');
  const [tags, setTags] = useState('');
  const [playerPosition, setPlayerPosition] = useState('');
  const [playerMinutesPlayed, setPlayerMinutesPlayed] = useState('');
  const [matchPickerVisible, setMatchPickerVisible] = useState(false);
  const [playerPickerVisible, setPlayerPickerVisible] = useState(false);
  const [matchSearch, setMatchSearch] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');
  const [voicePayload, setVoicePayload] = useState<CreateReportVoicePayload | undefined>(undefined);

  const selectedMatch = useMemo(
    () => matches.find((match) => String(match.id) === selectedMatchId),
    [matches, selectedMatchId],
  );
  const selectedPlayers = useMemo(
    () => players.filter((player) => selectedPlayerIds.includes(String(player.id))),
    [players, selectedPlayerIds],
  );
  const selectedPrimaryPlayer = selectedPlayers[0];

  useEffect(() => {
    if (!selectedPrimaryPlayer) {
      return;
    }

    const preferredFoot =
      selectedPrimaryPlayer.preferredFoot || selectedPrimaryPlayer.player?.preferredFoot || '';
    const height = selectedPrimaryPlayer.height || selectedPrimaryPlayer.player?.height;
    const weight = selectedPrimaryPlayer.weight || selectedPrimaryPlayer.player?.weight;
    const clubName =
      selectedPrimaryPlayer.club?.name ||
      selectedPrimaryPlayer.clubs?.name ||
      selectedPrimaryPlayer.team?.name ||
      selectedPrimaryPlayer.currentClub?.name ||
      '';

    setObservedDominantFoot(preferredFoot);
    setObservedHeightCm(height ? String(height) : '');
    setObservedWeightKg(weight ? String(weight) : '');
    setObservedClubName(clubName);
    setObservedFirstName((prev) => prev || selectedPrimaryPlayer.user?.firstName || '');
    setObservedLastName((prev) => prev || selectedPrimaryPlayer.user?.lastName || '');
    setObservedNationality(
      (prev) =>
        prev ||
        selectedPrimaryPlayer.nationality ||
        selectedPrimaryPlayer.player?.nationality ||
        '',
    );
    setObservedPhone((prev) => prev || selectedPrimaryPlayer.user?.phone || '');
    setObservedEmail((prev) => prev || selectedPrimaryPlayer.user?.email || '');

    if (!playerPosition && selectedPrimaryPlayer.position) {
      setPlayerPosition(selectedPrimaryPlayer.position);
    }
  }, [selectedPrimaryPlayer, playerPosition]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const params = route.params;
    if (!params) return;

    if (params.matchId) {
      setSelectedMatchId((prev) => prev || String(params.matchId));
    }
    if (params.assignmentId) {
      setAssignmentId(params.assignmentId);
    }
    if (params.voicePayload) {
      setVoicePayload(params.voicePayload);
    }

    if (Array.isArray(params.playerIds) && params.playerIds.length > 0) {
      setSelectedPlayerIds(Array.from(new Set(params.playerIds.filter(Boolean).map((id) => String(id)))));
    } else if (params.playerId) {
      setSelectedPlayerIds((prev) => (prev.length > 0 ? prev : [String(params.playerId)]));
    }

    if (params.prefillData) {
      const prefill = params.prefillData;
      setOverallRating(toStringValue(prefill.overallRating));
      setTechnicalRating(toStringValue(prefill.technicalRating));
      setPhysicalRating(toStringValue(prefill.physicalRating));
      setMentalRating(toStringValue(prefill.mentalRating));
      setTacticalRating(toStringValue(prefill.tacticalRating));
      setStrengths(prefill.strengths ?? '');
      setWeaknesses(prefill.weaknesses ?? '');
      setPlayerPosition(prefill.position ?? '');
      setPlayerMinutesPlayed(toStringValue(prefill.minutesPlayed));
      setSummary(prefill.observations ?? prefill.keyMoments ?? '');
      if (Array.isArray(prefill.tags) && prefill.tags.length > 0) {
        setTags(prefill.tags.join(','));
      }
      const mappedRecommendation = normalizeRecommendationFromVoice(prefill.recommendation);
      if (mappedRecommendation) {
        setRecommendation(mappedRecommendation);
      }
    }
  }, [route.params]);

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
    if (!selectedMatchId) {
      Alert.alert('Erreur', 'Veuillez sélectionner un match');
      return;
    }

    const hasObservedIdentity =
      observedFirstName.trim().length > 0 ||
      observedLastName.trim().length > 0 ||
      observedEmail.trim().length > 0 ||
      observedPhone.trim().length > 0;

    if (selectedPlayerIds.length === 0 && !hasObservedIdentity) {
      Alert.alert(
        'Erreur',
        'Veuillez sélectionner un joueur ou compléter une identité observée (nom, email ou téléphone).',
      );
      return;
    }

    setLoading(true);
    try {
      const template: any = {};

      if (overallRating) template.overallRating = parseInt(overallRating, 10);
      if (technicalRating) template.technicalRating = parseInt(technicalRating, 10);
      if (physicalRating) template.physicalRating = parseInt(physicalRating, 10);
      if (mentalRating) template.mentalRating = parseInt(mentalRating, 10);
      if (tacticalRating) template.tacticalRating = parseInt(tacticalRating, 10);
      if (withBallAnalysis) template.withBallAnalysis = withBallAnalysis;
      if (offBallAnalysis) template.offBallAnalysis = offBallAnalysis;
      if (gameIntelligenceAnalysis) template.gameIntelligenceAnalysis = gameIntelligenceAnalysis;
      if (attitudeAnalysis) template.attitudeAnalysis = attitudeAnalysis;
      if (staffOpinion) template.staffOpinion = staffOpinion;
      if (summary) template.summary = summary;
      if (strengths) template.strengths = strengths;
      if (weaknesses) template.weaknesses = weaknesses;
      if (observedDominantFoot) template.observedDominantFoot = observedDominantFoot;
      if (observedHeightCm) template.observedHeightCm = parseInt(observedHeightCm, 10);
      if (observedWeightKg) template.observedWeightKg = parseInt(observedWeightKg, 10);
      if (observedClubName) template.observedClubName = observedClubName;
      if (observedFirstName) template.observedFirstName = observedFirstName.trim();
      if (observedLastName) template.observedLastName = observedLastName.trim();
      if (observedNationality) template.observedNationality = observedNationality.trim();
      if (observedPhone) template.observedPhone = observedPhone.trim();
      if (observedEmail) template.observedEmail = observedEmail.trim().toLowerCase();
      if (sprint10mSec) template.sprint10mSec = parseFloat(sprint10mSec);
      if (sprint20mSec) template.sprint20mSec = parseFloat(sprint20mSec);
      if (sprint40mSec) template.sprint40mSec = parseFloat(sprint40mSec);
      if (vmaKmh) template.vmaKmh = parseFloat(vmaKmh);
      if (recommendation) template.recommendation = recommendation;
      if (recommendationNotes) template.recommendationNotes = recommendationNotes;
      if (tags) template.tags = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      if (playerPosition) template.playerPosition = playerPosition;
      if (playerMinutesPlayed) template.playerMinutesPlayed = parseInt(playerMinutesPlayed, 10);

      let targetPlayerIds = Array.from(new Set(selectedPlayerIds.filter(Boolean)));
      let resolutionSummary:
        | { mode: 'exact_match' | 'probable_match' | 'created_new'; confidence: number }
        | undefined;

      if (targetPlayerIds.length === 0) {
        const resolved = await playersApi.resolveObservedPlayer({
          observedFirstName: observedFirstName.trim() || undefined,
          observedLastName: observedLastName.trim() || undefined,
          observedNationality: observedNationality.trim() || undefined,
          observedPhone: observedPhone.trim() || undefined,
          observedEmail: observedEmail.trim().toLowerCase() || undefined,
          observedClubName: observedClubName.trim() || undefined,
          playerPosition: playerPosition.trim() || undefined,
          matchId: selectedMatchId,
        });
        targetPlayerIds = [resolved.playerId];
        resolutionSummary = {
          mode: resolved.resolutionMode,
          confidence: resolved.confidence,
        };
      }

      const result = await scoutingReportsApi.bulkSubmit({
        matchId: selectedMatchId,
        playerIds: targetPlayerIds,
        assignmentId,
        template,
        voice: voicePayload,
      });

      const createdCount = result?.meta?.created ?? targetPlayerIds.length;
      const reportWord = createdCount > 1 ? 'rapports' : 'rapport';
      let successMessage = `${createdCount} ${reportWord} envoyé(s) et visibles aux agents.`;

      if (resolutionSummary) {
        const confidence = Math.round((resolutionSummary.confidence ?? 0) * 100);
        successMessage += ` Rattachement auto: ${getResolutionModeLabel(
          resolutionSummary.mode,
        )} (${confidence}%).`;
      }

      Alert.alert('Succès', successMessage, [
        { text: 'OK', onPress: () => navigation.navigate('Reports') },
      ]);
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', error.response?.data?.message || 'Impossible de créer le rapport');
    } finally {
      setLoading(false);
    }
  };

  const recommendations: {
    value: RecommendationType;
    label: string;
    color: string;
    background: string;
  }[] = [
    {
      value: 'BUY_NOW',
      label: 'Recruter maintenant',
      color: colors.error,
      background: `${colors.error}22`,
    },
    {
      value: 'MONITOR',
      label: 'Surveiller',
      color: colors.warning,
      background: `${colors.warning}22`,
    },
    {
      value: 'FOLLOW_UP',
      label: 'Suivre',
      color: colors.info,
      background: `${colors.info}22`,
    },
    {
      value: 'NOT_INTERESTED',
      label: 'Pas intéressé',
      color: colors.textSecondary,
      background: colors.glassLight,
    },
    {
      value: 'NEEDS_MORE_DATA',
      label: 'Plus de données',
      color: colors.secondary,
      background: `${colors.secondary}22`,
    },
  ];

  const styles = useMemo(() => createStyles(colors), [colors]);

  const renderLogo = useCallback(
    (uri?: string, label?: string) => {
      const initials = (label || '?').slice(0, 2).toUpperCase();
      return (
        <View style={styles.logoRing}>
          {uri ? (
            <Image source={{ uri }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Text style={styles.logoFallback}>{initials}</Text>
          )}
        </View>
      );
    },
    [styles.logoRing, styles.logoImage, styles.logoFallback],
  );

  const formatPlayerName = useCallback((playerData?: any) => {
    if (!playerData) {
      return 'Joueur';
    }
    const fullName = `${playerData.user?.firstName || ''} ${playerData.user?.lastName || ''}`.trim();
    return fullName || playerData.user?.email || 'Joueur';
  }, []);

  const renderMatchOption = useCallback(
    (match: any) => {
      const matchDate = match.date ? new Date(match.date) : null;
      const dateLabel = matchDate
        ? matchDate.toLocaleString('fr-FR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'Date à confirmer';
      return (
        <View style={styles.modalRowContent}>
          <Text style={styles.modalRowTitle}>{`${match.homeClub?.name || 'Home'} vs ${match.awayClub?.name || 'Away'}`}</Text>
          <Text style={styles.modalRowSubtitle}>{dateLabel}</Text>
        </View>
      );
    },
    [styles],
  );

  const renderPlayerOption = useCallback(
    (player: any) => (
      <View style={styles.modalRowContent}>
        <Text style={styles.modalRowTitle}>{formatPlayerName(player)}</Text>
        <Text style={styles.modalRowSubtitle}>
          {player.position || player.team?.name || player.club?.name || 'Profil complet'}
        </Text>
      </View>
    ),
    [formatPlayerName, styles],
  );

  const handleMatchSelect = useCallback((match: any) => {
    setSelectedMatchId(String(match.id));
    setMatchPickerVisible(false);
  }, []);

  const handlePlayerSelect = useCallback((player: any) => {
    const playerId = String(player.id);
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId) ? prev.filter((id) => id !== playerId) : [...prev, playerId],
    );
  }, []);

  const renderInput = (
    label: string,
    value: string,
    setter: (text: string) => void,
    options?: { placeholder?: string; keyboardType?: 'default' | 'numeric'; multiline?: boolean },
  ) => (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, options?.multiline && styles.textArea]}
        value={value}
        onChangeText={setter}
        placeholder={options?.placeholder}
        placeholderTextColor={colors.textSecondary + '80'}
        keyboardType={options?.keyboardType || 'default'}
        multiline={options?.multiline}
        numberOfLines={options?.multiline ? 4 : 1}
        textAlignVertical={options?.multiline ? 'top' : 'center'}
      />
    </View>
  );

  const matchTitle = selectedMatch
    ? `${selectedMatch.homeClub?.name || 'Home'} vs ${selectedMatch.awayClub?.name || 'Away'}`
    : 'Match à sélectionner';
  const matchSubtitle = selectedMatch
    ? new Date(selectedMatch.date).toLocaleDateString('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
      })
    : 'Choisissez un match ci-dessous';
  const playerName = selectedPrimaryPlayer ? formatPlayerName(selectedPrimaryPlayer) : 'Sélectionnez';
  const playerSubtitle =
    selectedPlayerIds.length > 0
      ? `${selectedPlayerIds.length} joueur(s) sélectionné(s)`
      : "Sélectionnez un ou plusieurs joueurs (optionnel si identité observée)";

  const observedIdentityCompleteness = useMemo(() => {
    const filled = [
      observedFirstName,
      observedLastName,
      observedNationality,
      observedPhone,
      observedEmail,
    ].filter((value) => value.trim().length > 0).length;
    return Math.round((filled / 5) * 100);
  }, [observedEmail, observedFirstName, observedLastName, observedNationality, observedPhone]);

  const observedIdentityBadge = useMemo(() => {
    if (observedIdentityCompleteness >= 80) {
      return { label: 'Complet', color: '#16A34A' };
    }
    if (observedIdentityCompleteness >= 40) {
      return { label: 'Partiel', color: '#D97706' };
    }
    return { label: 'Minimal', color: '#6B7280' };
  }, [observedIdentityCompleteness]);

  const filteredMatches = useMemo(() => {
    if (!matchSearch.trim()) {
      return matches;
    }
    const query = matchSearch.toLowerCase();
    return matches.filter((match) => {
      const home = match.homeClub?.name?.toLowerCase() || '';
      const away = match.awayClub?.name?.toLowerCase() || '';
      return home.includes(query) || away.includes(query);
    });
  }, [matchSearch, matches]);

  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) {
      return players;
    }
    const query = playerSearch.toLowerCase();
    return players.filter((player) => {
      const fullName = formatPlayerName(player).toLowerCase();
      const position = player.position?.toLowerCase() || '';
      return fullName.includes(query) || position.includes(query);
    });
  }, [playerSearch, players, formatPlayerName]);

  useEffect(() => {
    const hintedName = route.params?.prefillData?.playerName?.trim();
    if (!hintedName || selectedPlayerIds.length > 0 || players.length === 0) {
      return;
    }

    const loweredHint = hintedName.toLowerCase();
    const matched = players.find((player) => formatPlayerName(player).toLowerCase().includes(loweredHint));
    if (matched?.id) {
      setSelectedPlayerIds([String(matched.id)]);
    }
  }, [formatPlayerName, players, route.params?.prefillData?.playerName, selectedPlayerIds.length]);
  const submitLabel =
    selectedPlayerIds.length > 1 ? `Envoyer ${selectedPlayerIds.length} rapports` : 'Envoyer rapport';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          <View style={styles.headerTitleBlock}>
            <Text style={styles.headerTitle}>{t.title}</Text>
            <Text style={styles.headerSubtitle}>
              {matches.length} matchs · {players.length} joueurs
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
        >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.match} *</Text>
              <GlassCard variant="elevated" style={styles.card}>
                <TouchableOpacity
                  style={styles.dropdownTrigger}
                  onPress={() => setMatchPickerVisible(true)}
                  testID="create-report-match-dropdown"
                >
                  <View style={styles.dropdownValueRow}>
                    <View style={styles.dropdownLogosMini}>
                      {renderLogo(
                        selectedMatch?.homeClub?.logoUrl || selectedMatch?.homeClub?.logo,
                        selectedMatch?.homeClub?.name,
                      )}
                      <Text style={styles.heroVs}>vs</Text>
                      {renderLogo(
                        selectedMatch?.awayClub?.logoUrl || selectedMatch?.awayClub?.logo,
                        selectedMatch?.awayClub?.name,
                      )}
                    </View>
                    <View style={styles.dropdownValueText}>
                      <Text style={styles.dropdownValueTitle} numberOfLines={1}>
                        {matchTitle}
                      </Text>
                      <Text style={styles.dropdownValueSubtitle}>{matchSubtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </GlassCard>
            </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.player}</Text>
          <GlassCard variant="elevated" style={styles.card}>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setPlayerPickerVisible(true)}
              testID="create-report-player-dropdown"
            >
              <View style={styles.dropdownValueRow}>
                {renderLogo(
                  selectedPrimaryPlayer?.user?.avatarUrl ||
                    selectedPrimaryPlayer?.avatarUrl ||
                    selectedPrimaryPlayer?.user?.avatar,
                  playerName,
                )}
                <View style={styles.dropdownValueText}>
                  <Text style={styles.dropdownValueTitle} numberOfLines={1}>
                    {playerName}
                  </Text>
                  <Text style={styles.dropdownValueSubtitle} numberOfLines={1}>
                    {playerSubtitle}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            {selectedPlayers.length > 0 ? (
              <View style={styles.selectedPlayersWrap}>
                {selectedPlayers.map((player) => (
                  <View key={player.id} style={styles.selectedPlayerChip}>
                    <Text style={styles.selectedPlayerChipText} numberOfLines={1}>
                      {formatPlayerName(player)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identité observée</Text>
          <GlassCard variant="default" style={styles.card}>
            <View style={styles.identityHeader}>
              <Text style={styles.sectionSubtitle}>
                Prérempli depuis le profil joueur. Vous pouvez ajuster selon le match observé.
              </Text>
              <View
                style={[
                  styles.completenessBadge,
                  { borderColor: observedIdentityBadge.color, backgroundColor: `${observedIdentityBadge.color}22` },
                ]}
              >
                <Text style={[styles.completenessBadgeText, { color: observedIdentityBadge.color }]}>
                  {observedIdentityBadge.label} ({observedIdentityCompleteness}%)
                </Text>
              </View>
            </View>
            {renderInput('Prénom observé', observedFirstName, setObservedFirstName, {
              placeholder: 'Walid',
            })}
            {renderInput('Nom observé', observedLastName, setObservedLastName, {
              placeholder: 'Regragui',
            })}
            {renderInput('Nationalité observée', observedNationality, setObservedNationality, {
              placeholder: 'Maroc',
            })}
            {renderInput('Téléphone observé', observedPhone, setObservedPhone, {
              placeholder: '+33 6 00 00 00 00',
            })}
            {renderInput('Email observé', observedEmail, setObservedEmail, {
              placeholder: 'joueur@club.com',
            })}
            {renderInput('Pied fort', observedDominantFoot, setObservedDominantFoot, {
              placeholder: 'Droitier',
            })}
            {renderInput('Taille (cm)', observedHeightCm, setObservedHeightCm, {
              placeholder: '178',
              keyboardType: 'numeric',
            })}
            {renderInput('Poids (kg)', observedWeightKg, setObservedWeightKg, {
              placeholder: '72',
              keyboardType: 'numeric',
            })}
            {renderInput('Club observé', observedClubName, setObservedClubName, {
              placeholder: 'FC Sochaux',
            })}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.context}</Text>
          <GlassCard variant="default" style={styles.card}>
            {renderInput('Position jouée', playerPosition, setPlayerPosition, {
              placeholder: 'Milieu central',
            })}
            {renderInput('Minutes jouées', playerMinutesPlayed, setPlayerMinutesPlayed, {
              placeholder: '90',
              keyboardType: 'numeric',
            })}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, styles.sectionTitleCompact]}>
                {t.ratings} (0-100)
              </Text>
              <Text style={styles.sectionSubtitle}>Ajustez chaque axe d'évaluation</Text>
            </View>
            <View style={styles.ratingBubble}>
              <Text style={styles.ratingBubbleValue}>{overallRating || '--'}</Text>
              <Text style={styles.ratingBubbleLabel}>OVR</Text>
            </View>
          </View>
          <GlassCard variant="default" style={styles.card}>
            <View style={styles.grid}>
              {renderInput('Globale', overallRating, setOverallRating, {
                placeholder: '75',
                keyboardType: 'numeric',
              })}
              {renderInput('Technique', technicalRating, setTechnicalRating, {
                placeholder: '80',
                keyboardType: 'numeric',
              })}
              {renderInput('Physique', physicalRating, setPhysicalRating, {
                placeholder: '78',
                keyboardType: 'numeric',
              })}
              {renderInput('Mental', mentalRating, setMentalRating, {
                placeholder: '82',
                keyboardType: 'numeric',
              })}
              {renderInput('Tactique', tacticalRating, setTacticalRating, {
                placeholder: '79',
                keyboardType: 'numeric',
              })}
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.analysis}</Text>
          <GlassCard variant="default" style={styles.card}>
            {renderInput('Habileté technique avec ballon', withBallAnalysis, setWithBallAnalysis, {
              placeholder: 'Première touche, qualité de passe, exécution sous pression…',
              multiline: true,
            })}
            {renderInput('Jeu sans ballon', offBallAnalysis, setOffBallAnalysis, {
              placeholder: 'Déplacements, replacement, disponibilité dans le jeu…',
              multiline: true,
            })}
            {renderInput(
              'Réflexion / intelligence de jeu',
              gameIntelligenceAnalysis,
              setGameIntelligenceAnalysis,
              {
                placeholder: 'Lecture du jeu, prise d’information, vitesse de décision…',
                multiline: true,
              },
            )}
            {renderInput('Attitude', attitudeAnalysis, setAttitudeAnalysis, {
              placeholder: 'Comportement, engagement, communication…',
              multiline: true,
            })}
            {renderInput('Avis du scout-staff', staffOpinion, setStaffOpinion, {
              placeholder: 'Synthèse staff et projection…',
              multiline: true,
            })}
            {renderInput('Résumé global', summary, setSummary, {
              placeholder: 'Synthèse du rapport…',
              multiline: true,
            })}
            {renderInput('Points forts', strengths, setStrengths, {
              placeholder: 'Décrivez les forces clés…',
              multiline: true,
            })}
            {renderInput('Points faibles', weaknesses, setWeaknesses, {
              placeholder: 'Décrivez les points faibles…',
              multiline: true,
            })}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tests athlétiques</Text>
          <GlassCard variant="default" style={styles.card}>
            <View style={styles.grid}>
              {renderInput('10m (s)', sprint10mSec, setSprint10mSec, {
                placeholder: '1.70',
                keyboardType: 'numeric',
              })}
              {renderInput('20m (s)', sprint20mSec, setSprint20mSec, {
                placeholder: '3.10',
                keyboardType: 'numeric',
              })}
              {renderInput('40m (s)', sprint40mSec, setSprint40mSec, {
                placeholder: '5.80',
                keyboardType: 'numeric',
              })}
              {renderInput('VMA (km/h)', vmaKmh, setVmaKmh, {
                placeholder: '18.5',
                keyboardType: 'numeric',
              })}
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.recommendation}</Text>
          <GlassCard variant="default" style={styles.card}>
            <View style={styles.recommendationButtons}>
              {recommendations.map((option) => {
                const active = recommendation === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.recommendationButton,
                      active && {
                        borderColor: option.color,
                        backgroundColor: option.background,
                      },
                    ]}
                    onPress={() => setRecommendation(option.value)}
                  >
                    <Text
                      style={[
                        styles.recommendationButtonText,
                        active && { color: option.color },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {renderInput('Notes', recommendationNotes, setRecommendationNotes, {
              placeholder: 'Précisez la recommandation…',
              multiline: true,
            })}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.metadata}</Text>
          <GlassCard variant="default" style={styles.card}>
            {renderInput('Tags', tags, setTags, {
              placeholder: 'ex : prospect,U19,priorité',
            })}
          </GlassCard>
        </View>

          <View style={styles.section}>
            <TouchableOpacity
              testID="create-report-submit"
              style={[styles.ctaButton, loading && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.darkBg} />
              ) : (
                <Text style={styles.ctaButtonText}>{submitLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

      <Modal
        visible={matchPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setMatchPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un match</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setMatchPickerVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchRow}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Rechercher un match"
                placeholderTextColor={colors.textSecondary + '80'}
                value={matchSearch}
                onChangeText={setMatchSearch}
              />
            </View>
            <FlatList
              data={filteredMatches}
              keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => handleMatchSelect(item)}
                  testID={`match-option-${item.id ?? index}`}
                >
                  {renderMatchOption(item)}
                  {selectedMatchId === String(item.id) && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>Aucun match trouvé</Text>
              )}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                filteredMatches.length === 0 ? styles.modalEmptyContent : undefined
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={playerPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPlayerPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sélectionner un joueur</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setPlayerPickerVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchRow}>
              <Ionicons name="search" size={16} color={colors.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Rechercher un joueur"
                placeholderTextColor={colors.textSecondary + '80'}
                value={playerSearch}
                onChangeText={setPlayerSearch}
              />
            </View>
            <Text style={styles.modalHelperText}>
              {selectedPlayerIds.length} joueur(s) sélectionné(s)
            </Text>
            <FlatList
              data={filteredPlayers}
              keyExtractor={(item, index) => item.id?.toString() ?? index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={styles.modalRow}
                  onPress={() => handlePlayerSelect(item)}
                  testID={`player-option-${item.id ?? index}`}
                >
                  {renderPlayerOption(item)}
                  {selectedPlayerIds.includes(String(item.id)) && (
                    <Ionicons name="checkmark" size={18} color={colors.accent} />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              ListEmptyComponent={() => (
                <Text style={styles.emptyText}>Aucun joueur trouvé</Text>
              )}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={
                filteredPlayers.length === 0 ? styles.modalEmptyContent : undefined
              }
            />
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.darkBg,
    },
    header: {
      paddingTop: 8,
      paddingHorizontal: 20,
      paddingBottom: 8,
      backgroundColor: colors.darkBg,
    },
    headerTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
    },
    headerBackButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.glass,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitleBlock: {
      marginTop: 10,
      marginBottom: 4,
    },
    headerTitle: {
      fontSize: 26,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    heroVs: {
      color: colors.textSecondary,
      fontWeight: '600',
    },
    logoRing: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.dark + '22',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    logoImage: {
      width: '100%',
      height: '100%',
    },
    logoFallback: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
    ctaButton: {
      marginTop: 16,
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: 16,
      alignItems: 'center',
    },
    ctaButtonText: {
      color: colors.darkBg,
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 60,
    },
    section: {
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingRight: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 12,
    },
    sectionTitleCompact: {
      marginBottom: 4,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    identityHeader: {
      marginBottom: 12,
      gap: 8,
    },
    completenessBadge: {
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    completenessBadgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    card: {
      padding: 16,
    },
    dropdownTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    dropdownValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    dropdownLogosMini: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dropdownValueText: {
      flex: 1,
    },
    dropdownValueTitle: {
      color: colors.textPrimary,
      fontWeight: '600',
      fontSize: 15,
    },
    dropdownValueSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    selectedPlayersWrap: {
      marginTop: 12,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    selectedPlayerChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: colors.glass,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      maxWidth: '100%',
    },
    selectedPlayerChipText: {
      color: colors.textPrimary,
      fontSize: 12,
      fontWeight: '600',
    },
    fieldBlock: {
      marginBottom: 12,
    },
    fieldLabel: {
      color: colors.textSecondary,
      fontSize: 13,
      marginBottom: 6,
    },
    input: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.textPrimary,
    },
    textArea: {
      minHeight: 100,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    ratingBubble: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingBubbleValue: {
      color: colors.darkBg,
      fontSize: 18,
      fontWeight: '700',
      lineHeight: 20,
    },
    ratingBubbleLabel: {
      color: colors.darkBg,
      fontSize: 10,
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    recommendationButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 16,
    },
    recommendationButton: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
    },
    recommendationButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    emptyText: {
      textAlign: 'center',
      color: colors.textSecondary,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalContainer: {
      maxHeight: '80%',
      padding: 20,
      backgroundColor: colors.dark,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      gap: 16,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: 18,
      fontWeight: '600',
    },
    modalCloseButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.glass,
    },
    modalSearchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      backgroundColor: colors.glass,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    modalSearchInput: {
      flex: 1,
      color: colors.textPrimary,
    },
    modalHelperText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: -4,
      marginBottom: 4,
    },
    modalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    modalRowContent: {
      flex: 1,
      paddingRight: 12,
    },
    modalRowTitle: {
      color: colors.textPrimary,
      fontSize: 15,
      fontWeight: '600',
    },
    modalRowSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    modalSeparator: {
      height: 1,
      backgroundColor: colors.glassBorder,
      opacity: 0.3,
    },
    modalEmptyContent: {
      flexGrow: 1,
      justifyContent: 'center',
    },
  });

export default CreateReportScreen;
