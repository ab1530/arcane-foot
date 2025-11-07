"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VoiceRecorder } from "@/components/voice-to-report";
import { Button } from "@/components/ui/button";
import { Mic, ArrowLeft } from "lucide-react";

/**
 * Voice-to-Report Demo Page
 *
 * This page demonstrates the Voice-to-Report feature
 * In production, this would be integrated into the scouting reports form
 */
export default function VoiceReportPage() {
  const [showRecorder, setShowRecorder] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const router = useRouter();

  const handleComplete = (data: any) => {
    setExtractedData(data);
    setShowRecorder(false);

    // In production, this would navigate to the form with pre-filled data
    // router.push({
    //   pathname: '/reports/new',
    //   query: { voiceData: JSON.stringify(data) }
    // });
  };

  return (
    <div className="min-h-screen bg-arcane-dark">
      {/* Header */}
      <header className="bg-arcane-darkCard border-b border-arcane-darkBorder">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">Voice to Report</h1>
                <p className="text-sm text-arcane-grey">Create scouting reports using voice</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-arcane-accent/10 mb-6">
              <Mic className="w-10 h-10 text-arcane-accent" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              Create Reports 10x Faster
            </h2>
            <p className="text-xl text-arcane-grey max-w-2xl mx-auto mb-8">
              Use voice recording to quickly create detailed scouting reports.
              Our AI extracts player data, ratings, and recommendations automatically.
            </p>
            <Button
              onClick={() => setShowRecorder(true)}
              size="lg"
              className="px-8 py-6 text-lg"
            >
              <Mic className="w-6 h-6" />
              Start Voice Recording
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-arcane-darkCard border border-arcane-darkBorder rounded-lg p-6">
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-lg font-bold text-white mb-2">Voice Recording</h3>
              <p className="text-sm text-arcane-grey">
                Record your observations naturally as you speak
              </p>
            </div>

            <div className="bg-arcane-darkCard border border-arcane-darkBorder rounded-lg p-6">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-lg font-bold text-white mb-2">AI Processing</h3>
              <p className="text-sm text-arcane-grey">
                Automatic transcription and data extraction
              </p>
            </div>

            <div className="bg-arcane-darkCard border border-arcane-darkBorder rounded-lg p-6">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-bold text-white mb-2">Auto-Fill Forms</h3>
              <p className="text-sm text-arcane-grey">
                Extracted data automatically fills the report form
              </p>
            </div>
          </div>

          {/* Extracted Data Display */}
          {extractedData && (
            <div className="bg-arcane-darkCard border border-arcane-darkBorder rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Extracted Data (Demo)
              </h3>
              <div className="bg-arcane-dark rounded p-4 overflow-auto">
                <pre className="text-sm text-arcane-grey">
                  {JSON.stringify(extractedData, null, 2)}
                </pre>
              </div>
              <p className="text-sm text-arcane-grey mt-4">
                In production, this data would be used to pre-fill the scouting report form.
              </p>
            </div>
          )}

          {/* How It Works */}
          <div className="bg-arcane-darkCard border border-arcane-darkBorder rounded-lg p-8 mt-12">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">
              How It Works
            </h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-arcane-accent text-arcane-dark flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Click to Record</h4>
                  <p className="text-sm text-arcane-grey">
                    Start recording and speak naturally about the player you're scouting
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-arcane-accent text-arcane-dark flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Include Key Details</h4>
                  <p className="text-sm text-arcane-grey">
                    Mention player name, position, ratings, strengths, weaknesses, and your recommendation
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-arcane-accent text-arcane-dark flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Review & Process</h4>
                  <p className="text-sm text-arcane-grey">
                    Listen to your recording, then click process to transcribe and extract data
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-arcane-accent text-arcane-dark flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-white mb-1">Apply to Form</h4>
                  <p className="text-sm text-arcane-grey">
                    Review extracted data and apply it to the scouting report form with one click
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="bg-gradient-to-br from-arcane-accent/10 to-arcane-accent/5 border border-arcane-accent/20 rounded-lg p-8 mt-8">
            <h3 className="text-xl font-bold text-white mb-4">
              Tips for Best Results
            </h3>
            <ul className="space-y-2 text-arcane-grey">
              <li className="flex items-start gap-2">
                <span className="text-arcane-accent mt-1">•</span>
                <span>Speak clearly and at a normal pace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-arcane-accent mt-1">•</span>
                <span>Find a quiet environment with minimal background noise</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-arcane-accent mt-1">•</span>
                <span>State ratings as "X out of 10" for better recognition</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-arcane-accent mt-1">•</span>
                <span>Be specific about strengths and weaknesses</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-arcane-accent mt-1">•</span>
                <span>End with a clear recommendation (Sign, Monitor, or Pass)</span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Voice Recorder Modal */}
      {showRecorder && (
        <VoiceRecorder
          onClose={() => setShowRecorder(false)}
          onComplete={handleComplete}
          language="en"
        />
      )}
    </div>
  );
}
