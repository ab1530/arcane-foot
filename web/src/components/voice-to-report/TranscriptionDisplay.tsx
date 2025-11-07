"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Edit2, Check } from "lucide-react";

interface TranscriptionDisplayProps {
  transcription: string;
  confidence: number;
  onEdit?: (newTranscription: string) => void;
  className?: string;
}

export default function TranscriptionDisplay({
  transcription,
  confidence,
  onEdit,
  className = "",
}: TranscriptionDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(transcription);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit(editedText);
    }
    setIsEditing(false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return "text-green-500";
    if (confidence >= 0.7) return "text-yellow-500";
    return "text-red-500";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return "High";
    if (confidence >= 0.7) return "Medium";
    return "Low";
  };

  return (
    <div className={`bg-arcane-darkCard rounded-lg border border-arcane-darkBorder overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-arcane-darkBorder">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">Transcription</h3>
          <span className={`text-sm font-semibold ${getConfidenceColor(confidence)}`}>
            {getConfidenceLabel(confidence)} Confidence ({Math.round(confidence * 100)}%)
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && !isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              size="sm"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
          <Button
            onClick={handleCopy}
            variant="ghost"
            size="sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="w-full min-h-[150px] px-4 py-3 bg-arcane-dark border border-arcane-darkBorder rounded-lg text-white resize-y focus:outline-none focus:ring-2 focus:ring-arcane-accent"
              placeholder="Edit transcription..."
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => {
                  setEditedText(transcription);
                  setIsEditing(false);
                }}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="sm"
              >
                Save Changes
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-arcane-grey leading-relaxed whitespace-pre-wrap">
            {transcription || "No transcription available"}
          </div>
        )}
      </div>
    </div>
  );
}
