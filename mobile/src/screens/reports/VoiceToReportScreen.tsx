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

import React, { useState, useEffect } from 'react';
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
import type {
  RecordingState,
  ExtractedReportData,
  VoiceReportResponse,
  SupportedLanguage,
} from '../../types/voice-to-report';
import { voiceToReportApi } from '../../services/api/voice-to-report';

// Components
import { RecordButton } from '../../components/voice/RecordButton';
import { WaveformDisplay } from '../../components/voice/WaveformDisplay';
import { RecordingTimer } from '../../components/voice/RecordingTimer';
import { AudioPlayer } from '../../components/voice/AudioPlayer';
import { TranscriptionCard } from '../../components/voice/TranscriptionCard';
import { ExtractedDataCard } from '../../components/voice/ExtractedDataCard';

// Note: expo-av imports would be here
// import { Audio } from 'expo-av';
// import * as FileSystem from 'expo-file-system';

interface VoiceToReportScreenProps {
  navigation: any;
  route?: any;
}

export const VoiceToReportScreen: React.FC<VoiceToReportScreenProps> = ({
  navigation,
  route,
}) => {
  // State
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('en' as SupportedLanguage);
  const [voiceReport, setVoiceReport] = useState<VoiceReportResponse | null>(null);
  const [editedData, setEditedData] = useState<ExtractedReportData | null>(null);

  // Recording objects (would use expo-av)
  // const [recording, setRecording] = useState<Audio.Recording | null>(null);

  // Get optional params from route
  const matchId = route?.params?.matchId;
  const playerId = route?.params?.playerId;

  /**
   * Request audio permissions
   */
  const requestPermissions = async (): Promise<boolean> => {
    try {
      // TODO: Implement with expo-av
      // const { status } = await Audio.requestPermissionsAsync();
      // if (status !== 'granted') {
      //   Alert.alert(
      //     'Permission Required',
      //     'Microphone access is required to record voice notes. Please enable it in your device settings.',
      //     [{ text: 'OK' }]
      //   );
      //   return false;
      // }
      // return true;

      // Placeholder - always return true for now
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
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

      // TODO: Implement with expo-av
      // await Audio.setAudioModeAsync({
      //   allowsRecordingIOS: true,
      //   playsInSilentModeIOS: true,
      // });

      // const { recording } = await Audio.Recording.createAsync(
      //   Audio.RecordingOptionsPresets.HIGH_QUALITY
      // );

      // setRecording(recording);
      setRecordingState('recording');

      Toast.show({
        type: 'info',
        text1: 'Recording Started',
        text2: 'Speak your scouting report',
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  /**
   * Stop audio recording
   */
  const stopRecording = async () => {
    try {
      // TODO: Implement with expo-av
      // if (!recording) return;

      // await recording.stopAndUnloadAsync();
      // const uri = recording.getURI();
      // const status = await recording.getStatusAsync();

      // setAudioUri(uri);
      // setAudioDuration(status.durationMillis / 1000);
      // setRecording(null);

      // Placeholder
      setAudioUri('/tmp/recording.m4a');
      setAudioDuration(45);
      setRecordingState('recorded');

      Toast.show({
        type: 'success',
        text1: 'Recording Complete',
        text2: 'Tap "Process Recording" to generate report',
      });
    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop recording. Please try again.');
    }
  };

  /**
   * Handle record button press
   */
  const handleRecordPress = () => {
    if (recordingState === 'idle' || recordingState === 'recorded') {
      startRecording();
    } else if (recordingState === 'recording') {
      stopRecording();
    }
  };

  /**
   * Handle max recording duration reached
   */
  const handleMaxDurationReached = () => {
    stopRecording();
    Toast.show({
      type: 'warning',
      text1: 'Max Duration Reached',
      text2: 'Recording stopped at 5 minutes',
    });
  };

  /**
   * Process voice recording
   */
  const processRecording = async () => {
    if (!audioUri) {
      Alert.alert('Error', 'No audio recording found');
      return;
    }

    try {
      setRecordingState('processing');

      const response = await voiceToReportApi.processVoiceReport(audioUri, {
        language: selectedLanguage,
        matchId,
        playerId,
        keepAudio: false,
      });

      setVoiceReport(response);
      setEditedData(response.extractedData);
      setRecordingState('complete');

      Toast.show({
        type: 'success',
        text1: 'Processing Complete',
        text2: `Confidence: ${Math.round(response.confidence)}%`,
      });
    } catch (error: any) {
      console.error('Failed to process recording:', error);
      setRecordingState('error');

      Alert.alert(
        'Processing Failed',
        error?.response?.data?.message || 'Failed to process voice recording. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: processRecording },
        ]
      );
    }
  };

  /**
   * Generate final report from edited data
   */
  const generateReport = () => {
    if (!editedData) {
      Alert.alert('Error', 'No data to generate report');
      return;
    }

    // Navigate to create report screen with pre-filled data
    navigation.navigate('CreateReport', {
      prefillData: editedData,
      fromVoice: true,
    });

    Toast.show({
      type: 'success',
      text1: 'Report Draft Created',
      text2: 'Review and submit your report',
    });
  };

  /**
   * Reset to initial state
   */
  const resetRecording = () => {
    setRecordingState('idle');
    setAudioUri(null);
    setAudioDuration(0);
    setVoiceReport(null);
    setEditedData(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voice to Report</Text>
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
                {recordingState === 'idle' && 'Tap the microphone to start recording'}
                {recordingState === 'recording' && 'Recording... Tap again to stop'}
                {recordingState === 'recorded' && 'Recording saved. Process to generate report'}
                {recordingState === 'processing' && 'Processing your voice recording...'}
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
                <Text style={styles.processButtonText}>Process Recording</Text>
              </TouchableOpacity>
            )}

            {/* Processing Indicator */}
            {recordingState === 'processing' && (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={COLORS.arcane.accent} />
                <Text style={styles.processingText}>
                  Transcribing and analyzing...
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
                  <Text style={styles.warningsTitle}>Warnings</Text>
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
                  <Text style={styles.suggestionsTitle}>Suggestions</Text>
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
              <Text style={styles.generateButtonText}>Generate Report</Text>
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
