/**
 * Voice-to-Report Types
 *
 * Types for the voice recording and scouting report generation feature.
 * These match the backend API structure from /backend/src/modules/voice-to-report/
 */

// Recording states
export type RecordingState = 'idle' | 'recording' | 'recorded' | 'processing' | 'complete' | 'error';

// Supported languages (matching backend)
export enum SupportedLanguage {
  EN = 'en',
  ES = 'es',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt',
}

// Language information
export interface LanguageInfo {
  code: string;
  name: string;
  whisperSupported: boolean;
}

// Voice report example/template
export interface VoiceReportExample {
  language: string;
  prompt: string;
  tips: string[];
}

// Recommendation types (matching Prisma enum)
export enum RecommendationType {
  BUY_NOW = 'BUY_NOW',
  WATCH = 'WATCH',
  NOT_INTERESTED = 'NOT_INTERESTED',
  NEEDS_DEVELOPMENT = 'NEEDS_DEVELOPMENT',
}

// Extracted report data from voice transcription
export interface ExtractedReportData {
  playerName?: string;
  position?: string;
  jerseyNumber?: number;
  team?: string;
  opponent?: string;
  competition?: string;
  matchDate?: string;
  venue?: string;
  technicalRating?: number;
  physicalRating?: number;
  tacticalRating?: number;
  mentalRating?: number;
  overallRating?: number;
  strengths?: string;
  weaknesses?: string;
  keyMoments?: string;
  observations?: string;
  minutesPlayed?: number;
  recommendation?: RecommendationType;
  tags?: string[];
}

// Voice report API response
export interface VoiceReportResponse {
  transcription: string;
  extractedData: ExtractedReportData;
  confidence: number;
  suggestions: string[];
  audioUrl?: string;
  useClientSide?: boolean;
  warnings?: string[];
  language: string;
  processingTimeMs: number;
}

// Request payload for processing voice
export interface ProcessVoiceRequest {
  language?: SupportedLanguage;
  matchId?: string;
  playerId?: string;
  keepAudio?: boolean;
}

// Audio recording metadata
export interface AudioRecording {
  uri: string;
  duration: number;
  size: number;
  mimeType: string;
}

// Waveform data for visualization
export interface WaveformData {
  samples: number[];
  duration: number;
  sampleRate: number;
}
