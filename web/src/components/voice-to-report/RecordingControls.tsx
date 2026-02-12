"use client";

import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, RotateCcw, Check, Loader2 } from "lucide-react";

interface RecordingControlsProps {
  recordingState: "idle" | "recording" | "recorded" | "processing" | "complete";
  isPlaying: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onPlayRecording: () => void;
  onPauseRecording: () => void;
  onReRecord: () => void;
  onProcess: () => void;
  disabled?: boolean;
}

export default function RecordingControls({
  recordingState,
  isPlaying,
  onStartRecording,
  onStopRecording,
  onPlayRecording,
  onPauseRecording,
  onReRecord,
  onProcess,
  disabled = false,
}: RecordingControlsProps) {
  // Idle state: Show start button
  if (recordingState === "idle") {
    return (
      <div className="flex justify-center">
        <Button
          onClick={onStartRecording}
          disabled={disabled}
          size="lg"
          className="px-8 py-6 text-base"
        >
          <Mic className="w-6 h-6" />
          Start Recording
        </Button>
      </div>
    );
  }

  // Recording state: Show stop button
  if (recordingState === "recording") {
    return (
      <div className="flex justify-center">
        <Button
          onClick={onStopRecording}
          disabled={disabled}
          variant="destructive"
          size="lg"
          className="px-8 py-6 text-base bg-red-600 hover:bg-red-700 animate-pulse"
        >
          <Square className="w-6 h-6" />
          Stop Recording
        </Button>
      </div>
    );
  }

  // Recorded state: Show play, re-record, and process buttons
  if (recordingState === "recorded") {
    return (
      <div className="flex flex-wrap justify-center gap-4">
        <Button
          onClick={isPlaying ? onPauseRecording : onPlayRecording}
          disabled={disabled}
          variant="outline"
          size="lg"
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Play
            </>
          )}
        </Button>

        <Button
          onClick={onReRecord}
          disabled={disabled}
          variant="ghost"
          size="lg"
        >
          <RotateCcw className="w-5 h-5" />
          Re-record
        </Button>

        <Button
          onClick={onProcess}
          disabled={disabled}
          size="lg"
          className="px-8"
        >
          <Check className="w-5 h-5" />
          Process Recording
        </Button>
      </div>
    );
  }

  // Processing state: Show loading
  if (recordingState === "processing") {
    return (
      <div className="flex justify-center">
        <Button disabled size="lg" className="px-8 py-6 text-base">
          <Loader2 className="w-6 h-6 animate-spin" />
          Processing...
        </Button>
      </div>
    );
  }

  // Complete state: Show success
  if (recordingState === "complete") {
    return (
      <div className="flex justify-center">
        <div className="px-8 py-6 text-center">
          <div className="flex items-center justify-center gap-2 text-arcane-accent mb-2">
            <Check className="w-6 h-6" />
            <span className="text-lg font-bold">Processing Complete!</span>
          </div>
          <p className="text-sm text-arcane-grey">
            Review the extracted data below
          </p>
        </div>
      </div>
    );
  }

  return null;
}
