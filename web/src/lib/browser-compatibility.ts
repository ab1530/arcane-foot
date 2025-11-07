/**
 * Browser compatibility checker for Voice-to-Report features
 */

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

/**
 * Check if the browser supports all required features for voice recording
 */
export function checkBrowserSupport(): BrowserSupport {
  const features = {
    mediaRecorder: typeof MediaRecorder !== "undefined",
    getUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
    audioContext: !!(window.AudioContext || (window as any).webkitAudioContext),
    webAudio: typeof AudioContext !== "undefined" || typeof (window as any).webkitAudioContext !== "undefined",
  };

  // Check MediaRecorder support
  if (!features.mediaRecorder) {
    return {
      supported: false,
      message: "Your browser does not support audio recording. Please use Chrome, Firefox, Edge, or Safari.",
      features,
    };
  }

  // Check getUserMedia support
  if (!features.getUserMedia) {
    return {
      supported: false,
      message: "Your browser does not support microphone access. Please update your browser.",
      features,
    };
  }

  // Check for supported audio formats
  const formats = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];

  let supportedFormat: string | undefined;
  for (const format of formats) {
    if (MediaRecorder.isTypeSupported(format)) {
      supportedFormat = format;
      break;
    }
  }

  if (!supportedFormat) {
    return {
      supported: false,
      message: "No supported audio format found. Please use a modern browser.",
      features,
    };
  }

  return {
    supported: true,
    format: supportedFormat,
    features,
  };
}

/**
 * Get recommended browser message based on user agent
 */
export function getRecommendedBrowser(): string {
  if (typeof window === "undefined") return "";

  const userAgent = navigator.userAgent.toLowerCase();

  if (userAgent.includes("chrome") && !userAgent.includes("edge")) {
    return "You're using Chrome - all features are supported!";
  }

  if (userAgent.includes("firefox")) {
    return "You're using Firefox - all features are supported!";
  }

  if (userAgent.includes("edge")) {
    return "You're using Edge - all features are supported!";
  }

  if (userAgent.includes("safari") && !userAgent.includes("chrome")) {
    return "You're using Safari. Some features may have limited support.";
  }

  return "For the best experience, we recommend using Chrome, Firefox, or Edge.";
}

/**
 * Check if the browser is running in a secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  if (typeof window === "undefined") return false;
  return window.isSecureContext;
}

/**
 * Get user-friendly error message for permission errors
 */
export function getMicrophonePermissionMessage(error: any): string {
  if (!error) return "Unknown error occurred";

  const errorName = error.name || "";

  switch (errorName) {
    case "NotAllowedError":
    case "PermissionDeniedError":
      return "Microphone access was denied. Please allow microphone access in your browser settings and try again.";

    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No microphone found. Please connect a microphone and try again.";

    case "NotReadableError":
    case "TrackStartError":
      return "Could not access microphone. It may be in use by another application.";

    case "OverconstrainedError":
    case "ConstraintNotSatisfiedError":
      return "Microphone does not support the required settings.";

    case "TypeError":
      return "Invalid microphone configuration.";

    case "SecurityError":
      return "Microphone access blocked due to security settings. Please ensure you're using HTTPS.";

    default:
      return `Microphone error: ${error.message || "Unknown error"}`;
  }
}

/**
 * Format recording time in MM:SS format
 */
export function formatRecordingTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
