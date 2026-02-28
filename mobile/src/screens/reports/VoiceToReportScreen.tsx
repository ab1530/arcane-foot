/**
 * VoiceToReportScreen
 *
 * Main screen for voice-to-report feature.
 * Allows users to record voice notes and generate scouting reports.
 *
 * Flow:
 * 1. IDLE - Ready to record
 * 2. RECORDING - Active recording with waveform
 * 3. RECORDED - Audio captured, ready to process
 * 4. PROCESSING - Sending to API
 * 5. COMPLETE - Report generated, show results
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { COLORS, FONT_SIZES, SPACING } from '../../constants/config';
import { Audio } from 'expo-av';
import type {
  RecordingState,
  ExtractedReportData,
  VoiceReportResponse,
  SupportedLanguage,
} from '../../types/voice-to-report';
import { voiceToReportApi } from '../../services/api/voice-to-report';
import { useLocalization } from '../../contexts/LocalizationContext';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AppStackParamList } from '../../types/navigation';

// Components
import { RecordButton } from '../../components/voice/RecordButton';
import { WaveformDisplay } from '../../components/voice/WaveformDisplay';
import { RecordingTimer } from '../../components/voice/RecordingTimer';
import { AudioPlayer } from '../../components/voice/AudioPlayer';
import { TranscriptionCard } from '../../components/voice/TranscriptionCard';
import { ExtractedDataCard } from '../../components/voice/ExtractedDataCard';

type VoiceToReportScreenProps = NativeStackScreenProps<AppStackParamList, 'VoiceToReport'>;

export const VoiceToReportScreen: React.FC<VoiceToReportScreenProps> = ({ navigation, route }) => {
  const { dictionary } = useLocalization();
  const t = dictionary.voiceReport || {
    header: { title: 'Voice to Report' },
    toasts: {
      recordingStarted: { title: 'Recording', message: 'Recording started' },
      recordingComplete: { title: 'Done', message: 'Recording complete' },
      maxDuration: { title: 'Limit reached', message: 'Max duration reached' },
      processingComplete: { title: 'Processed', message: 'Confidence: {{confidence}}%' },
      draftCreated: { title: 'Draft created', message: 'Draft created successfully' },
    },
    errors: {
      startRecording: 'Failed to start recording',
      stopRecording: 'Failed to stop recording',
      noAudio: 'No audio recorded',
      noData: 'No data available',
      processingFailed: { title: 'Processing failed', message: 'Failed to process audio' },
    },
    instructions: {
      idle: 'Tap to start recording',
      recording: 'Recording... Tap to stop',
      recorded: 'Recording complete. Process to continue',
      processing: 'Processing your audio...',
    },
    actions: {
      process: 'Process Recording',
      generate: 'Generate Report',
    },
    processing: {
      message: 'Processing your audio...',
    },
    sections: {
      warnings: 'Warnings',
      suggestions: 'Suggestions',
    },
  };

  // State
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en' as SupportedLanguage);
  const [voiceReport, setVoiceReport] = useState<VoiceReportResponse | null>(null);
  const [editedData, setEditedData] = useState<ExtractedReportData | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Get optional params from route
  const matchId = route?.params?.matchId;
  const playerId = route?.params?.playerId;
  const playerIds = route?.params?.playerIds;
  const assignmentId = route?.params?.assignmentId;

  /**
   * Request audio permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          dictionary?.common?.feedback?.error || 'Error',
          'Microphone permission is required to record voice notes.',
        );
      }
      return permission.granted;
    } catch (error) {
      console.error('Failed to request recording permission', error);
      return false;
    }
  };

  /**
   * Start audio recording
   */
  const startRecording = async () => {
    try {
      const hasPermission = await requestPermissions();
      if (!hasPermission) return;

      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setAudioUri(null);
      setAudioDuration(0);
      setVoiceReport(null);
      setEditedData(null);
      setRecordingState('recording');

      Toast.show({
        type: 'info',
        text1: t.toasts.recordingStarted.title,
        text2: t.toasts.recordingStarted.message,
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert(dictionary?.common?.feedback?.error || 'Error', t.errors.startRecording);
    }
  };

  /**
   * Stop audio recording
   */
  const stopRecording = async () => {
    try {
      const currentRecording = recordingRef.current;
      if (!currentRecording) {
        return;
      }

      await currentRecording.stopAndUnloadAsync();
      const status = await currentRecording.getStatusAsync();
      const uri = currentRecording.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (!uri) {
        throw new Error('Recording URI is empty');
      }

      const durationMillis = status && 'durationMillis' in status ? status.durationMillis ?? 0 : 0;
      setAudioUri(uri);
      setAudioDuration(Math.max(1, Math.round(durationMillis / 1000)));
      setRecordingState('recorded');

      Toast.show({
        type: 'success',
        text1: t.toasts.recordingComplete.title,
        text2: t.toasts.recordingComplete.message,
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert(dictionary?.common?.feedback?.error || 'Error', t.errors.stopRecording);
    }
  };

  /**
   * Handle record button press
   */
  const handleRecordPress = () => {
    if (recordingState === 'idle' || recordingState === 'recorded') {
      startRecording().catch((error) => {
        console.error('Failed to start recording from button', error);
      });
    } else if (recordingState === 'recording') {
      stopRecording().catch((error) => {
        console.error('Failed to stop recording from button', error);
      });
    }
  };

  /**
   * Handle max recording duration reached
   */
  const handleMaxDurationReached = () => {
    stopRecording().catch((error) => {
      console.error('Failed to stop recording at max duration', error);
    });
    Toast.show({
      type: 'warning',
      text1: t.toasts.maxDuration.title,
      text2: t.toasts.maxDuration.message,
    });
  };

  /**
   * Process voice recording
   */
  const processRecording = async () => {
    if (!audioUri) {
      Alert.alert(dictionary?.common?.feedback?.error || 'Error', t.errors.noAudio);
      return;
    }

    try {
      setRecordingState('processing');

      const response = await voiceToReportApi.processVoiceReport(audioUri, {
        language: selectedLanguage,
        matchId,
        playerId: playerId ?? playerIds?.[0],
        keepAudio: false,
      });

      setVoiceReport(response);
      setEditedData(response.extractedData);
      setRecordingState('complete');

      Toast.show({
        type: 'success',
        text1: t.toasts.processingComplete.title,
        text2: t.toasts.processingComplete.message.replace('{{confidence}}', Math.round(response.confidence).toString()),
      });
    } catch (error: any) {
      console.error('Failed to process recording:', error);
      setRecordingState('recorded');

      Alert.alert(
        t.errors.processingFailed.title,
        error?.response?.data?.message || t.errors.processingFailed.message,
        [
          { text: dictionary?.common?.actions?.cancel || 'Cancel', style: 'cancel' },
          { text: dictionary?.common?.actions?.retry || 'Retry', onPress: processRecording },
        ]
      );
    }
  };

  /**
   * Generate final report from edited data
   */
  const generateReport = () => {
    if (!editedData) {
      Alert.alert(dictionary?.common?.feedback?.error || 'Error', t.errors.noData);
      return;
    }

    // Navigate to create report screen with pre-filled data
    navigation.navigate('CreateReport', {
      prefillData: editedData,
      fromVoice: true,
      matchId,
      playerId,
      playerIds,
      assignmentId,
      voicePayload: {
        transcription: voiceReport?.transcription,
        confidence: voiceReport?.confidence,
        audioUrl: voiceReport?.audioUrl,
        warnings: voiceReport?.warnings,
      },
    });

    Toast.show({
      type: 'success',
      text1: t.toasts.draftCreated.title,
      text2: t.toasts.draftCreated.message,
    });
  };

  /**
   * Reset to initial state
   */
  const resetRecording = () => {
    if (recordingRef.current) {
      recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
      recordingRef.current = null;
    }
    setRecordingState('idle');
    setAudioUri(null);
    setAudioDuration(0);
    setVoiceReport(null);
    setEditedData(null);
  };

  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(() => undefined);
        recordingRef.current = null;
      }
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      }).catch(() => undefined);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.header.title}</Text>
        <TouchableOpacity onPress={resetRecording}>
          <Ionicons name="refresh" size={24} color={COLORS.arcane.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Recording Section */}
        {recordingState !== 'complete' && (
          <View style={styles.recordingSection}>
            {/* Timer */}
            <RecordingTimer
              isRecording={recordingState === 'recording'}
              maxDuration={300}
              onMaxReached={handleMaxDurationReached}
            />

            {/* Record Button */}
            <View style={styles.recordButtonContainer}>
              <RecordButton
                state={recordingState}
                onPress={handleRecordPress}
                disabled={recordingState === 'processing'}
                size={120}
              />
            </View>

            {/* Waveform */}
            <WaveformDisplay
              isRecording={recordingState === 'recording'}
              height={80}
            />

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsText}>
                {recordingState === 'idle' && t.instructions.idle}
                {recordingState === 'recording' && t.instructions.recording}
                {recordingState === 'recorded' && t.instructions.recorded}
                {recordingState === 'processing' && t.instructions.processing}
              </Text>
            </View>

            {/* Audio Player (when recorded) */}
            {recordingState === 'recorded' && audioUri && (
              <View style={styles.playerSection}>
                <AudioPlayer
                  audioUri={audioUri}
                  duration={audioDuration}
                />
              </View>
            )}

            {/* Process Button */}
            {recordingState === 'recorded' && (
              <TouchableOpacity
                style={styles.processButton}
                onPress={processRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="sparkles" size={20} color={COLORS.arcane.dark} />
                <Text style={styles.processButtonText}>{t.actions.process}</Text>
              </TouchableOpacity>
            )}

            {/* Processing Indicator */}
            {recordingState === 'processing' && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={COLORS.arcane.accent} />
                <Text style={styles.processingText}>
                  {t.processing.message}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Results Section */}
        {recordingState === 'complete' && voiceReport && (
          <View style={styles.resultsSection}>
            {/* Transcription */}
            <View style={styles.resultCard}>
              <TranscriptionCard
                transcription={voiceReport.transcription}
                language={voiceReport.language}
                confidence={voiceReport.confidence}
              />
            </View>

            {/* Warnings */}
            {voiceReport.warnings && voiceReport.warnings.length > 0 && (
              <View style={styles.warningsCard}>
                <View style={styles.warningsHeader}>
                  <Ionicons name="warning" size={20} color={COLORS.warning} />
                  <Text style={styles.warningsTitle}>{t.sections.warnings}</Text>
                </View>
                {voiceReport.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>
                    • {warning}
                  </Text>
                ))}
              </View>
            )}

            {/* Suggestions */}
            {voiceReport.suggestions && voiceReport.suggestions.length > 0 && (
              <View style={styles.suggestionsCard}>
                <View style={styles.suggestionsHeader}>
                  <Ionicons name="bulb" size={20} color={COLORS.info} />
                  <Text style={styles.suggestionsTitle}>{t.sections.suggestions}</Text>
                </View>
                {voiceReport.suggestions.map((suggestion, index) => (
                  <Text key={index} style={styles.suggestionText}>
                    • {suggestion}
                  </Text>
                ))}
              </View>
            )}

            {/* Extracted Data */}
            <View style={styles.resultCard}>
              <ExtractedDataCard
                data={editedData || voiceReport.extractedData}
                onChange={setEditedData}
                editable={true}
              />
            </View>

            {/* Generate Report Button */}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={generateReport}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={20} color={COLORS.arcane.dark} />
              <Text style={styles.generateButtonText}>{t.actions.generate}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.arcane.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.arcane.darkBorder,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.white,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  recordingSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  recordButtonContainer: {
    marginVertical: SPACING.xl,
  },
  instructions: {
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  instructionsText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[600],
    textAlign: 'center',
    lineHeight: 22,
  },
  playerSection: {
    width: '100%',
    marginTop: SPACING.xl,
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.arcane.accent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    marginTop: SPACING.xl,
    width: '100%',
  },
  processButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.arcane.dark,
  },
  processingContainer: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  processingText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray[600],
    marginTop: SPACING.md,
  },
  resultsSection: {
    gap: SPACING.md,
  },
  resultCard: {
    marginBottom: SPACING.md,
  },
  warningsCard: {
    backgroundColor: COLORS.arcane.darkAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.warning,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  warningsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  warningsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.warning,
  },
  warningText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[700],
    marginTop: SPACING.xs,
  },
  suggestionsCard: {
    backgroundColor: COLORS.arcane.darkAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.info,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  suggestionsTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.info,
  },
  suggestionText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.gray[700],
    marginTop: SPACING.xs,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.arcane.accent,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: 12,
    marginTop: SPACING.md,
  },
  generateButtonText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.arcane.dark,
  },
});

export default VoiceToReportScreen;
