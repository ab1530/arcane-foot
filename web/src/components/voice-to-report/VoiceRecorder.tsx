"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import WaveformVisualizer from "./WaveformVisualizer";
import RecordingControls from "./RecordingControls";
import TranscriptionDisplay from "./TranscriptionDisplay";
import ExtractedDataPreview from "./ExtractedDataPreview";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { apiClient } from "@/lib/api-client";
import {
  checkBrowserSupport,
  getRecommendedBrowser,
  formatRecordingTime,
  formatFileSize,
  isSecureContext,
} from "@/lib/browser-compatibility";

interface VoiceRecorderProps {
  onClose: () => void;
  onComplete?: (extractedData: any) => void;
  language?: string;
  className?: string;
}

export default function VoiceRecorder({
  onClose,
  onComplete,
  language = "en",
  className = "",
}: VoiceRecorderProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [transcription, setTranscription] = useState("");
  const [extractedData, setExtractedData] = useState<any>(null);
  const [confidence, setConfidence] = useState(0);
  const [processingMessage, setProcessingMessage] = useState("Processing audio...");

  const {
    recordingState,
    audioStream,
    audioBlob,
    audioUrl,
    recordingTime,
    error,
    isPlaying,
    startRecording,
    stopRecording,
    playRecording,
    pauseRecording,
    resetRecording,
    setRecordingState,
    setError,
  } = useVoiceRecorder(180); // 3 minutes max

  // Check browser support
  const browserSupport = checkBrowserSupport();
  const recommendedBrowser = getRecommendedBrowser();
  const isSecure = isSecureContext();

  // Process recording
  const processRecording = async () => {
    if (!audioBlob) {
      setError("No recording to process");
      return;
    }

    setRecordingState("processing");
    setProcessingMessage("Uploading audio...");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("language", selectedLanguage);

      setProcessingMessage("Transcribing audio...");

      const response = await apiClient.processVoiceReport(formData);

      setTranscription(response.transcription);
      setExtractedData(response.extractedData);
      setConfidence(response.confidence);
      setRecordingState("complete");
    } catch (err: any) {
      console.error("Error processing recording:", err);
      setError("Failed to process recording. Please try again or fill the form manually.");
      setRecordingState("recorded");
    }
  };

  // Apply extracted data to form
  const applyToForm = () => {
    if (onComplete && extractedData) {
      onComplete(extractedData);
    }
    onClose();
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space to start/stop recording
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        if (recordingState === "idle") {
          startRecording();
        } else if (recordingState === "recording") {
          stopRecording();
        }
      }

      // Escape to close
      if (e.code === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [recordingState, startRecording, stopRecording, onClose]);

  // Handle re-record
  const handleReRecord = () => {
    if (confirm("Are you sure you want to delete this recording and start over?")) {
      resetRecording();
    }
  };

  // Update transcription
  const handleEditTranscription = (newTranscription: string) => {
    setTranscription(newTranscription);
    // Could trigger re-extraction here if needed
  };

  // Edit extracted data
  const handleEditExtractedData = (key: string, value: any) => {
    setExtractedData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={`bg-arcane-dark border-2 border-arcane-darkBorder rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-arcane-darkCard border-b border-arcane-darkBorder px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Mic className="w-7 h-7 text-arcane-accent" />
              Voice to Report
            </h2>
            <p className="text-sm text-arcane-grey mt-1">
              Create reports 10x faster with voice
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-arcane-grey hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {/* Browser Support Warning */}
          {!browserSupport.supported && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-500 mb-1">
                    Browser Not Supported
                  </p>
                  <p className="text-sm text-red-500/80 mb-2">
                    {browserSupport.message}
                  </p>
                  <p className="text-sm text-red-500/80">
                    {recommendedBrowser}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Secure Context Warning */}
          {!isSecure && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-500 mb-1">
                    Insecure Connection
                  </p>
                  <p className="text-sm text-yellow-500/80">
                    Microphone access requires HTTPS. Please use a secure connection.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-red-500 mb-1">Error</p>
                    <p className="text-sm text-red-500/80">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-400"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Language Selector */}
          {recordingState === "idle" && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-arcane-grey mb-2">
                Recording Language
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-2.5 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-arcane-accent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
              </select>
            </div>
          )}

          {/* Recording State Display */}
          <div className="bg-arcane-darkCard rounded-xl p-8 mb-6 border border-arcane-darkBorder">
            {/* State Indicator */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center mb-4">
                {recordingState === "idle" && (
                  <Mic className="w-16 h-16 text-arcane-grey" />
                )}
                {recordingState === "recording" && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Mic className="w-16 h-16 text-red-500" />
                  </motion.div>
                )}
                {recordingState === "recorded" && (
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
                )}
                {recordingState === "processing" && (
                  <Loader2 className="w-16 h-16 text-arcane-accent animate-spin" />
                )}
                {recordingState === "complete" && (
                  <CheckCircle2 className="w-16 h-16 text-arcane-accent" />
                )}
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                {recordingState === "idle" && "Ready to Record"}
                {recordingState === "recording" && "Recording..."}
                {recordingState === "recorded" && "Recording Complete"}
                {recordingState === "processing" && processingMessage}
                {recordingState === "complete" && "Processing Complete!"}
              </h3>

              <p className="text-sm text-arcane-grey">
                {recordingState === "idle" &&
                  "Click the button below or press Space to start"}
                {recordingState === "recording" &&
                  "Speak clearly at a normal pace"}
                {recordingState === "recorded" &&
                  "Review your recording or process it"}
                {recordingState === "processing" &&
                  "This may take a few moments..."}
                {recordingState === "complete" &&
                  "Review the extracted data below"}
              </p>
            </div>

            {/* Waveform Visualizer */}
            <WaveformVisualizer
              isRecording={recordingState === "recording"}
              audioStream={audioStream}
              className="mb-6"
            />

            {/* Timer */}
            {(recordingState === "recording" || recordingState === "recorded") && (
              <div className="text-center mb-6">
                <div className="inline-block bg-arcane-dark rounded-lg px-6 py-2 border border-arcane-darkBorder">
                  <span className="text-2xl font-mono font-bold text-arcane-accent">
                    {formatRecordingTime(recordingTime)}
                  </span>
                  <span className="text-sm text-arcane-grey ml-2">
                    / {formatRecordingTime(180)}
                  </span>
                </div>
              </div>
            )}

            {/* File Size (if recorded) */}
            {audioBlob && recordingState === "recorded" && (
              <div className="text-center text-sm text-arcane-grey mb-4">
                File size: {formatFileSize(audioBlob.size)}
              </div>
            )}

            {/* Recording Controls */}
            <RecordingControls
              recordingState={recordingState}
              isPlaying={isPlaying}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onPlayRecording={playRecording}
              onPauseRecording={pauseRecording}
              onReRecord={handleReRecord}
              onProcess={processRecording}
              disabled={!browserSupport.supported || !isSecure}
            />
          </div>

          {/* Transcription Display */}
          {recordingState === "complete" && transcription && (
            <div className="mb-6">
              <TranscriptionDisplay
                transcription={transcription}
                confidence={confidence}
                onEdit={handleEditTranscription}
              />
            </div>
          )}

          {/* Extracted Data Preview */}
          {recordingState === "complete" && extractedData && (
            <div className="mb-6">
              <ExtractedDataPreview
                extractedData={extractedData}
                onApplyToForm={applyToForm}
                onEdit={handleEditExtractedData}
              />
            </div>
          )}

          {/* Tips Section */}
          {recordingState === "idle" && (
            <div className="bg-arcane-darkCard rounded-lg p-4 border border-arcane-darkBorder">
              <div className="flex items-start gap-3 mb-3">
                <Info className="w-5 h-5 text-arcane-accent flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white mb-2">Tips for Best Results:</h4>
                  <ul className="text-sm text-arcane-grey space-y-1.5">
                    <li>• Speak clearly and at a normal pace</li>
                    <li>• Include player name, position, and jersey number</li>
                    <li>• Mention technical, physical, mental, and tactical ratings</li>
                    <li>• Describe strengths and weaknesses</li>
                    <li>• State your final recommendation (Sign, Monitor, or Pass)</li>
                    <li>• Maximum recording time: 3 minutes</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-3 bg-arcane-dark rounded border border-arcane-darkBorder">
                <p className="text-xs font-semibold text-arcane-accent mb-1">
                  Example:
                </p>
                <p className="text-xs text-arcane-grey italic">
                  "Scouting report for John Smith, striker, number 9. Technical rating: 8 out of 10.
                  Physical rating: 9 out of 10. Mental rating: 7 out of 10. Tactical rating: 8 out of 10.
                  Overall rating: 8 out of 10. Strengths: excellent positioning, strong aerial ability,
                  clinical finisher. Weaknesses: needs to improve passing accuracy and defensive contribution.
                  My recommendation: Sign this player."
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
