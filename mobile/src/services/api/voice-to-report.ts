/**
 * Voice-to-Report API Client
 *
 * Handles all API calls for voice recording and scouting report generation.
 * Backend endpoint: /voice-to-report
 */

import { api } from '../api';
import type {
  VoiceReportResponse,
  ProcessVoiceRequest,
  LanguageInfo,
  VoiceReportExample,
  SupportedLanguage,
} from '../../types/voice-to-report';

export class VoiceToReportApi {
  /**
   * Process voice recording and generate scouting report
   * @param audioUri - Local file URI of the audio recording
   * @param options - Additional options (language, matchId, playerId, keepAudio)
   * @returns Promise with transcription and extracted data
   */
  async processVoiceReport(
    audioUri: string,
    options: ProcessVoiceRequest = {}
  ): Promise<VoiceReportResponse> {
    const formData = new FormData();

    // Append audio file
    // @ts-ignore - FormData typing for React Native
    formData.append('audio', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    });

    // Append optional parameters
    if (options.language) {
      formData.append('language', options.language);
    }
    if (options.matchId) {
      formData.append('matchId', options.matchId);
    }
    if (options.playerId) {
      formData.append('playerId', options.playerId);
    }
    if (options.keepAudio !== undefined) {
      formData.append('keepAudio', String(options.keepAudio));
    }

    return api.postRaw<VoiceReportResponse>('/voice-to-report/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60 seconds for audio processing
    });
  }

  /**
   * Get list of supported languages
   * @returns Promise with array of supported languages
   */
  async getSupportedLanguages(): Promise<LanguageInfo[]> {
    return api.getRaw<LanguageInfo[]>('/voice-to-report/languages');
  }

  /**
   * Get example voice report templates
   * @returns Promise with array of example templates
   */
  async getExamples(): Promise<VoiceReportExample[]> {
    return api.getRaw<VoiceReportExample[]>('/voice-to-report/examples');
  }

  /**
   * Test transcription extraction without uploading audio (for development)
   * @param text - Sample transcription text
   * @param language - Language code
   * @returns Promise with extracted data
   */
  async testTranscription(
    text: string,
    language: SupportedLanguage = SupportedLanguage.EN
  ): Promise<VoiceReportResponse> {
    return api.postRaw<VoiceReportResponse>('/voice-to-report/test-transcription', {
      text,
      language,
    });
  }
}

// Export singleton instance
export const voiceToReportApi = new VoiceToReportApi();
export default voiceToReportApi;
