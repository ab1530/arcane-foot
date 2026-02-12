"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface WaveformVisualizerProps {
  isRecording: boolean;
  audioStream: MediaStream | null;
  barCount?: number;
  className?: string;
}

export default function WaveformVisualizer({
  isRecording,
  audioStream,
  barCount = 20,
  className = "",
}: WaveformVisualizerProps) {
  const [levels, setLevels] = useState<number[]>(new Array(barCount).fill(0));
  const animationFrameRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | undefined>(undefined);
  const audioContextRef = useRef<AudioContext | undefined>(undefined);

  useEffect(() => {
    if (!isRecording || !audioStream) {
      // Reset to idle state
      setLevels(new Array(barCount).fill(0));

      // Cleanup
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }

      return;
    }

    try {
      // Create audio context and analyser
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(audioStream);

      source.connect(analyser);
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        analyser.getByteFrequencyData(dataArray);

        // Normalize and map to bar count
        const step = Math.floor(bufferLength / barCount);
        const normalized = Array.from({ length: barCount }, (_, i) => {
          const start = i * step;
          const end = start + step;
          const slice = dataArray.slice(start, end);
          const average = slice.reduce((a, b) => a + b, 0) / slice.length;
          return Math.min(average / 255, 1);
        });

        setLevels(normalized);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      };

      updateWaveform();
    } catch (error) {
      console.error("Error setting up waveform visualizer:", error);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [isRecording, audioStream, barCount]);

  return (
    <div className={`flex gap-1 justify-center items-center h-20 ${className}`}>
      {levels.map((level, i) => {
        // Add some variation to make it more dynamic
        const baseHeight = isRecording ? 20 : 10;
        const height = baseHeight + (level * 60);

        return (
          <motion.div
            key={i}
            className="w-1.5 rounded-full"
            style={{
              backgroundColor: isRecording
                ? `rgba(228, 255, 59, ${0.3 + level * 0.7})` // arcane-accent with opacity
                : "#9FA1A9", // arcane-grey
            }}
            animate={{
              height: `${height}%`,
              opacity: isRecording ? 1 : 0.5
            }}
            transition={{
              duration: 0.1,
              ease: "easeOut"
            }}
          />
        );
      })}
    </div>
  );
}
