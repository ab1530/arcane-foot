"use client";

import { Button } from "@/components/ui/button";
import { Check, AlertCircle, Edit2, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ExtractedField {
  label: string;
  value: any;
  confidence: number;
  key: string;
}

interface ExtractedDataPreviewProps {
  extractedData: any;
  onApplyToForm: () => void;
  onEdit?: (key: string, value: any) => void;
  className?: string;
}

export default function ExtractedDataPreview({
  extractedData,
  onApplyToForm,
  onEdit,
  className = "",
}: ExtractedDataPreviewProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  if (!extractedData) {
    return null;
  }

  // Convert extracted data to fields array
  const fields: ExtractedField[] = [
    {
      label: "Player Name",
      value: extractedData.playerName,
      confidence: extractedData.playerNameConfidence || 0,
      key: "playerName"
    },
    {
      label: "Position",
      value: extractedData.position,
      confidence: extractedData.positionConfidence || 0,
      key: "position"
    },
    {
      label: "Technical Rating",
      value: extractedData.technicalRating,
      confidence: extractedData.technicalRatingConfidence || 0,
      key: "technicalRating"
    },
    {
      label: "Physical Rating",
      value: extractedData.physicalRating,
      confidence: extractedData.physicalRatingConfidence || 0,
      key: "physicalRating"
    },
    {
      label: "Mental Rating",
      value: extractedData.mentalRating,
      confidence: extractedData.mentalRatingConfidence || 0,
      key: "mentalRating"
    },
    {
      label: "Tactical Rating",
      value: extractedData.tacticalRating,
      confidence: extractedData.tacticalRatingConfidence || 0,
      key: "tacticalRating"
    },
    {
      label: "Overall Rating",
      value: extractedData.overallRating,
      confidence: extractedData.overallRatingConfidence || 0,
      key: "overallRating"
    },
    {
      label: "Strengths",
      value: extractedData.strengths,
      confidence: extractedData.strengthsConfidence || 0,
      key: "strengths"
    },
    {
      label: "Weaknesses",
      value: extractedData.weaknesses,
      confidence: extractedData.weaknessesConfidence || 0,
      key: "weaknesses"
    },
    {
      label: "Recommendation",
      value: extractedData.recommendation,
      confidence: extractedData.recommendationConfidence || 0,
      key: "recommendation"
    },
    {
      label: "Summary",
      value: extractedData.summary,
      confidence: extractedData.summaryConfidence || 0,
      key: "summary"
    },
  ].filter(field => field.value !== undefined && field.value !== null && field.value !== "");

  const missingFields = [
    "Match Date",
    "Opponent",
    "Venue",
  ].filter(field => {
    const key = field.toLowerCase().replace(/\s+/g, "");
    return !extractedData[key];
  });

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-500";
    if (confidence >= 0.6) return "text-yellow-500";
    return "text-red-500";
  };

  const handleEditStart = (field: ExtractedField) => {
    setEditingField(field.key);
    setEditValue(String(field.value));
  };

  const handleEditSave = (key: string) => {
    if (onEdit) {
      onEdit(key, editValue);
    }
    setEditingField(null);
    setEditValue("");
  };

  return (
    <div className={`bg-arcane-darkCard rounded-lg border border-arcane-darkBorder overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-arcane-darkBorder">
        <h3 className="text-lg font-bold text-white">Extracted Data</h3>
        <p className="text-sm text-arcane-grey mt-1">
          Review and edit the data before applying to the form
        </p>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
        {fields.map((field) => (
          <div
            key={field.key}
            className="bg-arcane-dark rounded-lg p-3 border border-arcane-darkBorder"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-arcane-grey">
                    {field.label}
                  </span>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className={`text-xs ${getConfidenceColor(field.confidence)}`}>
                    {Math.round(field.confidence * 100)}%
                  </span>
                </div>
                {editingField === field.key ? (
                  <div className="space-y-2">
                    {field.key.includes("Rating") ? (
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 bg-arcane-darkAlt border border-arcane-darkBorder rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent"
                      />
                    ) : (
                      <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-3 py-2 bg-arcane-darkAlt border border-arcane-darkBorder rounded text-white text-sm resize-y min-h-[60px] focus:outline-none focus:ring-2 focus:ring-arcane-accent"
                      />
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={() => setEditingField(null)}
                        variant="ghost"
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleEditSave(field.key)}
                        size="sm"
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-white">
                    {field.key.includes("Rating") ? (
                      <span className="text-lg font-bold text-arcane-accent">
                        {field.value}/10
                      </span>
                    ) : (
                      <p className="text-sm leading-relaxed">
                        {field.value}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {!editingField && onEdit && (
                <button
                  onClick={() => handleEditStart(field)}
                  className="text-arcane-grey hover:text-arcane-accent transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Missing Fields Warning */}
      {missingFields.length > 0 && (
        <div className="mx-4 mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-500 mb-1">
                Missing Fields
              </p>
              <p className="text-xs text-yellow-500/80">
                {missingFields.join(", ")} - You'll need to fill these manually in the form
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Apply Button */}
      <div className="px-4 pb-4">
        <Button
          onClick={onApplyToForm}
          className="w-full"
          size="lg"
        >
          Apply to Form
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
