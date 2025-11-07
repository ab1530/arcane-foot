"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Zap, Brain, ChevronRight } from "lucide-react";
import { SuggestionsPanel } from "@/components/smart-scout/SuggestionsPanel";
import { AutocompleteField } from "@/components/smart-scout/AutocompleteField";
import { PlayerInsights } from "@/components/smart-scout/PlayerInsights";
import { ReportModal } from "@/components/smart-scout/ReportModal";
import { GlassCard } from "@/components/ui/glass-card";
import { apiClient } from "@/lib/api-client";
import type { Player, ReportContext } from "@/types/smart-scout";

export default function SmartScoutPage() {
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(true);

  // Autocomplete demo state
  const [strengthsValue, setStrengthsValue] = useState('');
  const [weaknessesValue, setWeaknessesValue] = useState('');
  const [summaryValue, setSummaryValue] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  const positions = [
    "Goalkeeper", "Right Back", "Center Back", "Left Back",
    "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder",
    "Right Winger", "Left Winger", "Striker"
  ];

  // Fetch players for insights
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const response = await apiClient.getPlayers({ limit: 100 });
        const playerList = response.data || [];
        setPlayers(playerList.map((p: any) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          fullName: `${p.firstName} ${p.lastName}`,
          position: p.position,
          club: p.club?.name,
          nationality: p.nationality,
          age: p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : undefined,
          photoUrl: p.photoUrl,
        })));
      } catch (error) {
        console.error('Error fetching players:', error);
      } finally {
        setIsLoadingPlayers(false);
      }
    };

    fetchPlayers();
  }, []);

  const handleReportSelect = (reportId: string) => {
    setSelectedReportId(reportId);
    setIsReportModalOpen(true);
  };

  const autocompleteContext: ReportContext = {
    position: selectedPosition || undefined,
  };

  return (
    <div className="min-h-screen bg-arcane-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-arcane-dark via-arcane-darkAlt to-arcane-dark border-b border-arcane-darkBorder">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-arcane-accent/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-arcane-accent/3 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative container mx-auto px-4 py-12 md:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 bg-arcane-accent/20 text-arcane-accent px-4 py-2 rounded-full text-sm font-bold mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Intelligence
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              SmartScout AI
              <span className="block text-arcane-accent mt-2">Intelligent Report Suggestions</span>
            </h1>

            <p className="text-lg text-arcane-grey mb-8 max-w-2xl leading-relaxed">
              Leverage advanced AI to enhance your scouting reports. Get intelligent suggestions,
              real-time autocomplete, and deep player insights powered by machine learning.
            </p>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-arcane-accent/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-arcane-accent" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Smart Suggestions</div>
                  <div className="text-xs text-arcane-grey">Find similar reports</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-arcane-accent/20 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-arcane-accent" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Auto-Complete</div>
                  <div className="text-xs text-arcane-grey">AI-powered text</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-arcane-accent/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-arcane-accent" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Player Insights</div>
                  <div className="text-xs text-arcane-grey">Trend analysis</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Desktop: 3 Column Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Left: Suggestions Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-[calc(100vh-280px)] min-h-[600px]"
          >
            <SuggestionsPanel onReportSelect={handleReportSelect} />
          </motion.div>

          {/* Center: Autocomplete Demo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-[calc(100vh-280px)] min-h-[600px]"
          >
            <GlassCard variant="elevated" className="h-full flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-arcane-accent" />
                <h2 className="text-xl font-bold text-white">Smart Autocomplete</h2>
              </div>

              <div className="flex-1 overflow-y-auto space-y-6 pr-2 scrollbar-thin scrollbar-thumb-arcane-accent/20 scrollbar-track-transparent">
                {/* Position Context */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Position Context (Optional)
                  </label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all"
                  >
                    <option value="">All positions</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <p className="text-xs text-arcane-grey mt-2">
                    Position context helps provide more relevant suggestions
                  </p>
                </div>

                {/* Strengths Field */}
                <AutocompleteField
                  label="Strengths"
                  fieldName="strengths"
                  value={strengthsValue}
                  onChange={setStrengthsValue}
                  context={autocompleteContext}
                  placeholder="Start typing player strengths..."
                  multiline
                />

                {/* Weaknesses Field */}
                <AutocompleteField
                  label="Weaknesses"
                  fieldName="weaknesses"
                  value={weaknessesValue}
                  onChange={setWeaknessesValue}
                  context={autocompleteContext}
                  placeholder="Start typing player weaknesses..."
                  multiline
                />

                {/* Summary Field */}
                <AutocompleteField
                  label="Summary"
                  fieldName="summary"
                  value={summaryValue}
                  onChange={setSummaryValue}
                  context={autocompleteContext}
                  placeholder="Start typing report summary..."
                  multiline
                />

                {/* Info Box */}
                <div className="bg-arcane-accent/10 border border-arcane-accent/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-arcane-accent flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-arcane-accent mb-1">
                        How It Works
                      </h4>
                      <ul className="text-xs text-arcane-grey space-y-1">
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-arcane-accent mt-0.5 flex-shrink-0" />
                          <span>Type at least 2 characters to trigger suggestions</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-arcane-accent mt-0.5 flex-shrink-0" />
                          <span>Use arrow keys to navigate, Enter to select</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-arcane-accent mt-0.5 flex-shrink-0" />
                          <span>AI learns from historical scouting reports</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ChevronRight className="w-3 h-3 text-arcane-accent mt-0.5 flex-shrink-0" />
                          <span>Confidence scores show prediction accuracy</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Right: Player Insights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="h-[calc(100vh-280px)] min-h-[600px]"
          >
            <PlayerInsights players={players} />
          </motion.div>
        </div>

        {/* Tablet: 2 Column Layout */}
        <div className="hidden md:grid lg:hidden md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="h-[calc(100vh-280px)] min-h-[600px]"
          >
            <SuggestionsPanel onReportSelect={handleReportSelect} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <GlassCard variant="elevated">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-arcane-accent" />
                <h2 className="text-xl font-bold text-white">Smart Autocomplete</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Position Context
                  </label>
                  <select
                    value={selectedPosition}
                    onChange={(e) => setSelectedPosition(e.target.value)}
                    className="w-full bg-arcane-darkCard/60 border border-arcane-darkBorder rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-arcane-accent/50 focus:border-arcane-accent transition-all"
                  >
                    <option value="">All positions</option>
                    {positions.map(pos => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                </div>

                <AutocompleteField
                  label="Strengths"
                  fieldName="strengths"
                  value={strengthsValue}
                  onChange={setStrengthsValue}
                  context={autocompleteContext}
                  placeholder="Start typing..."
                  multiline
                />

                <AutocompleteField
                  label="Weaknesses"
                  fieldName="weaknesses"
                  value={weaknessesValue}
                  onChange={setWeaknessesValue}
                  context={autocompleteContext}
                  placeholder="Start typing..."
                  multiline
                />
              </div>
            </GlassCard>

            <PlayerInsights players={players} />
          </motion.div>
        </div>

        {/* Mobile: Stacked Layout with Tabs */}
        <div className="md:hidden space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <SuggestionsPanel onReportSelect={handleReportSelect} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <GlassCard variant="elevated">
              <div className="flex items-center gap-2 mb-6">
                <Zap className="w-5 h-5 text-arcane-accent" />
                <h2 className="text-xl font-bold text-white">Autocomplete</h2>
              </div>

              <div className="space-y-4">
                <AutocompleteField
                  label="Strengths"
                  fieldName="strengths"
                  value={strengthsValue}
                  onChange={setStrengthsValue}
                  context={autocompleteContext}
                  placeholder="Type to get suggestions..."
                />

                <AutocompleteField
                  label="Weaknesses"
                  fieldName="weaknesses"
                  value={weaknessesValue}
                  onChange={setWeaknessesValue}
                  context={autocompleteContext}
                  placeholder="Type to get suggestions..."
                />
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <PlayerInsights players={players} />
          </motion.div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedReportId('');
        }}
        reportId={selectedReportId}
      />
    </div>
  );
}
