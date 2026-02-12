/**
 * TypeScript types for Voice-to-Report system
 */

export type RecordingState = "idle" | "recording" | "recorded" | "processing" | "complete";

export interface ExtractedReportData {
  // Player Information
  playerName?: string;
  playerNameConfidence?: number;
  position?: string;
  positionConfidence?: number;
  jerseyNumber?: string;
  jerseyNumberConfidence?: number;

  // Ratings (0-10)
  technicalRating?: number;
  technicalRatingConfidence?: number;
  physicalRating?: number;
  physicalRatingConfidence?: number;
  mentalRating?: number;
  mentalRatingConfidence?: number;
  tacticalRating?: number;
  tacticalRatingConfidence?: number;
  overallRating?: number;
  overallRatingConfidence?: number;

  // Detailed Information
  strengths?: string;
  strengthsConfidence?: number;
  weaknesses?: string;
  weaknessesConfidence?: number;
  summary?: string;
  summaryConfidence?: number;

  // Recommendation
  recommendation?: "SIGN" | "MONITOR" | "PASS" | string;
  recommendationConfidence?: number;
  recommendationNotes?: string;

  // Match Context (if mentioned)
  matchDate?: string;
  opponent?: string;
  venue?: string;
  competition?: string;
  minutesPlayed?: number;

  // Additional
  tags?: string[];
  notes?: string;
}

export interface VoiceReportResponse {
  // Transcription
  transcription: string;
  confidence: number;

  // Extracted Data
  extractedData: ExtractedReportData;

  // Metadata
  suggestions?: string[];
  warnings?: string[];
  audioUrl?: string;
  audioSize?: number;
  processingTime?: number;
  language?: string;

  // Fallback info
  useClientSide?: boolean;
  fallbackMessage?: string;
}

export interface VoiceRecorderProps {
  onClose: () => void;
  onComplete?: (data: ExtractedReportData) => void;
  language?: string;
  className?: string;
}

export interface WaveformVisualizerProps {
  isRecording: boolean;
  audioStream: MediaStream | null;
  barCount?: number;
  className?: string;
}

export interface RecordingControlsProps {
  recordingState: RecordingState;
  isPlaying: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onPauseRecording: () => void;
  onReRecord: () => void;
  onProcess: () => void;
  disabled?: boolean;
}

export interface TranscriptionDisplayProps {
  transcription: string;
  confidence: number;
  onEdit?: (newTranscription: string) => void;
  className?: string;
}

export interface ExtractedDataPreviewProps {
  extractedData: ExtractedReportData;
  onApplyToForm: () => void;
  onEdit?: (key: string, value: any) => void;
  className?: string;
}

export interface BrowserSupport {
  supported: boolean;
  message?: string;
  format?: string;
  features: {
    mediaRecorder: boolean;
    getUserMedia: boolean;
    audioContext: boolean;
    webAudio: boolean;
  };
}

export interface VoiceRecorderHook {
  recordingState: RecordingState;
  audioStream: MediaStream | null;
  mediaRecorder: MediaRecorder | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  recordingTime: number;
  error: string | null;
  isPlaying: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  playRecording: () => void;
  pauseRecording: () => void;
  resetRecording: () => void;
  setRecordingState: (state: RecordingState) => void;
  setError: (error: string | null) => void;
}

export interface AudioFormat {
  mimeType: string;
  extension: string;
  supported: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  supported: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", supported: true },
  { code: "es", name: "Spanish", nativeName: "Español", supported: true },
  { code: "fr", name: "French", nativeName: "Français", supported: true },
  { code: "de", name: "German", nativeName: "Deutsch", supported: true },
  { code: "it", name: "Italian", nativeName: "Italiano", supported: true },
  { code: "pt", name: "Portuguese", nativeName: "Português", supported: true },
];

export const AUDIO_FORMATS: AudioFormat[] = [
  { mimeType: "audio/webm;codecs=opus", extension: "webm", supported: true },
  { mimeType: "audio/webm", extension: "webm", supported: true },
  { mimeType: "audio/ogg;codecs=opus", extension: "ogg", supported: true },
  { mimeType: "audio/mp4", extension: "m4a", supported: true },
];

export const MAX_RECORDING_DURATION = 180; // 3 minutes in seconds
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export enum RecordingError {
  PERMISSION_DENIED = "PERMISSION_DENIED",
  NO_MICROPHONE = "NO_MICROPHONE",
  MICROPHONE_BUSY = "MICROPHONE_BUSY",
  UNSUPPORTED_BROWSER = "UNSUPPORTED_BROWSER",
  NETWORK_ERROR = "NETWORK_ERROR",
  PROCESSING_ERROR = "PROCESSING_ERROR",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  RECORDING_TOO_SHORT = "RECORDING_TOO_SHORT",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export interface RecordingErrorDetail {
  code: RecordingError;
  message: string;
  userMessage: string;
  recovery?: string;
}
