'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Users, Grid3x3, Palette, AlertCircle, Loader2 } from 'lucide-react';
import { DNARadarChart } from '@/components/playstyle-dna/DNARadarChart';
import { PlayStyleCard } from '@/components/playstyle-dna/PlayStyleCard';
import { SimilarPlayers } from '@/components/playstyle-dna/SimilarPlayers';
import { StyleRecommendations } from '@/components/playstyle-dna/StyleRecommendations';
import { ComparisonRadar } from '@/components/playstyle-dna/ComparisonRadar';
import { StyleExplorerGrid } from '@/components/playstyle-dna/StyleExplorerGrid';
import { StyleDetailModal } from '@/components/playstyle-dna/StyleDetailModal';
import { StyleBadge } from '@/components/playstyle-dna/StyleBadge';
import { playStyleDnaApi } from '@/lib/api/playstyle-dna';
import { getStyleColor } from '@/lib/utils/playstyle-colors';
import type { PlayStyleClassification, StyleDefinition, StyleDistribution } from '@/types/playstyle-dna';

type TabType = 'player-dna' | 'compare' | 'explorer';

export default function PlayStyleDNAPage() {
  const [activeTab, setActiveTab] = useState<TabType>('player-dna');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [playerClassification, setPlayerClassification] = useState<PlayStyleClassification | null>(null);
  const [comparisonPlayers, setComparisonPlayers] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<PlayStyleClassification[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<StyleDefinition | null>(null);
  const [styleModalOpen, setStyleModalOpen] = useState(false);
  const [styles, setStyles] = useState<StyleDefinition[]>([]);
  const [styleDistribution, setStyleDistribution] = useState<StyleDistribution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load styles on mount
  useEffect(() => {
    loadStyles();
    loadDistribution();
  }, []);

  const loadStyles = async () => {
    try {
      const data = await playStyleDnaApi.getStyles();
      setStyles(data);
    } catch (err) {
      console.error('Failed to load styles:', err);
    }
  };

  const loadDistribution = async () => {
    try {
      const data = await playStyleDnaApi.getDistribution();
      setStyleDistribution(data);
    } catch (err) {
      console.error('Failed to load distribution:', err);
    }
  };

  const handlePlayerSearch = async (playerId: string) => {
    if (!playerId.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const classification = await playStyleDnaApi.classify(playerId);
      setPlayerClassification(classification);
      setSelectedPlayerId(playerId);
    } catch (err) {
      setError('Failed to classify player. The PlayStyle DNA service may be unavailable.');
      console.error('Classification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (comparisonPlayers.length < 2) {
      setError('Please select at least 2 players to compare');
      return;
    }

    if (comparisonPlayers.length > 5) {
      setError('Maximum 5 players can be compared at once');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await playStyleDnaApi.compare(comparisonPlayers);
      setComparisonData(result.players);
    } catch (err) {
      setError('Failed to compare players. The PlayStyle DNA service may be unavailable.');
      console.error('Comparison error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStyleSelect = (styleName: string) => {
    const style = styles.find(s => s.styleName === styleName);
    if (style) {
      setSelectedStyle(style);
      setStyleModalOpen(true);
    }
  };

  const tabs = [
    {
      id: 'player-dna' as TabType,
      label: 'Player DNA',
      icon: Search,
      description: 'Analyze individual player style',
    },
    {
      id: 'compare' as TabType,
      label: 'Compare Styles',
      icon: Users,
      description: 'Compare multiple players',
    },
    {
      id: 'explorer' as TabType,
      label: 'Style Explorer',
      icon: Grid3x3,
      description: 'Discover all playing styles',
    },
  ];

  return (
    <div className="min-h-screen bg-arcane-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-arcane-darkBorder">
        <div className="absolute inset-0 bg-gradient-to-br from-arcane-accent/5 via-transparent to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-arcane-accent/10 flex items-center justify-center border border-arcane-accent/20">
              <Palette size={24} className="text-arcane-accent" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">PlayStyle DNA</h1>
              <p className="text-arcane-greyLight">AI-Powered Playing Style Classification</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <div className="px-3 py-1 rounded-full bg-arcane-accent/10 border border-arcane-accent/20 text-arcane-accent text-sm font-medium">
              ML Powered
            </div>
            <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
              12 Unique Styles
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
              8D Analysis
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-arcane-darkBorder bg-arcane-darkCard/30 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-arcane-accent'
                      : 'text-arcane-grey hover:text-arcane-greyLight'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>

                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-arcane-accent"
                      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </motion.div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Player DNA Tab */}
        {activeTab === 'player-dna' && (
          <div className="space-y-8">
            {/* Search */}
            <div className="max-w-2xl">
              <label className="block text-sm font-medium text-arcane-greyLight mb-2">
                Search Player
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Enter player ID or name..."
                  value={selectedPlayerId}
                  onChange={(e) => setSelectedPlayerId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePlayerSearch(selectedPlayerId)}
                  className="flex-1 px-4 py-3 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white placeholder:text-arcane-grey focus:outline-none focus:border-arcane-accent transition-colors"
                />
                <button
                  onClick={() => handlePlayerSearch(selectedPlayerId)}
                  disabled={loading}
                  className="px-6 py-3 bg-arcane-accent hover:bg-arcane-accentHover text-arcane-dark font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search size={18} />
                      <span>Classify</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results */}
            {playerClassification && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Player Card and Radar */}
                <div className="space-y-6">
                  <PlayStyleCard
                    style={{
                      name: playerClassification.playerName,
                      primaryStyle: playerClassification.primaryStyle,
                      secondaryStyle: playerClassification.secondaryStyle,
                      confidence: playerClassification.styleConfidence,
                      cluster: playerClassification.cluster,
                    }}
                    onExplore={() => {
                      const style = styles.find(s => s.styleName === playerClassification.primaryStyle);
                      if (style) {
                        setSelectedStyle(style);
                        setStyleModalOpen(true);
                      }
                    }}
                  />

                  <div className="p-6 rounded-xl border border-arcane-darkBorder bg-arcane-darkCard/50 backdrop-blur-sm">
                    <h3 className="text-lg font-semibold text-white mb-4">DNA Profile</h3>
                    <div className="h-80">
                      <DNARadarChart
                        dnaProfile={playerClassification.dnaProfile}
                        playerName={playerClassification.playerName}
                        color={getStyleColor(playerClassification.primaryStyle)}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Details */}
                <div className="space-y-6">
                  {/* Real-World Examples */}
                  {playerClassification.realWorldExamples.length > 0 && (
                    <div className="p-6 rounded-xl border border-arcane-darkBorder bg-arcane-darkCard/50 backdrop-blur-sm">
                      <h3 className="text-lg font-semibold text-white mb-4">Real-World Examples</h3>
                      <div className="flex flex-wrap gap-2">
                        {playerClassification.realWorldExamples.map((example) => (
                          <div
                            key={example}
                            className="px-3 py-1.5 rounded-lg bg-arcane-accent/10 border border-arcane-accent/20 text-arcane-accent text-sm font-medium"
                          >
                            {example}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Similar Players */}
                  {playerClassification.similarPlayers.length > 0 && (
                    <div className="p-6 rounded-xl border border-arcane-darkBorder bg-arcane-darkCard/50 backdrop-blur-sm">
                      <h3 className="text-lg font-semibold text-white mb-4">Similar Players in Database</h3>
                      <SimilarPlayers
                        players={playerClassification.similarPlayers}
                        onPlayerClick={(id) => handlePlayerSearch(id)}
                      />
                    </div>
                  )}

                  {/* Recommendations */}
                  {playerClassification.recommendations.length > 0 && (
                    <div className="p-6 rounded-xl border border-arcane-darkBorder bg-arcane-darkCard/50 backdrop-blur-sm">
                      <h3 className="text-lg font-semibold text-white mb-4">Training Recommendations</h3>
                      <StyleRecommendations
                        recommendations={playerClassification.recommendations}
                        style={playerClassification.primaryStyle}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!playerClassification && !loading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-arcane-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Search size={32} className="text-arcane-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Search for a Player</h3>
                <p className="text-arcane-greyLight max-w-md mx-auto">
                  Enter a player ID to analyze their playing style using AI-powered classification
                </p>
              </div>
            )}
          </div>
        )}

        {/* Compare Tab */}
        {activeTab === 'compare' && (
          <div className="space-y-8">
            {/* Player Selection */}
            <div>
              <label className="block text-sm font-medium text-arcane-greyLight mb-2">
                Select Players to Compare (2-5 players)
              </label>
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Add player ID..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      const value = input.value.trim();
                      if (value && !comparisonPlayers.includes(value)) {
                        setComparisonPlayers([...comparisonPlayers, value]);
                        input.value = '';
                      }
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-arcane-darkCard border border-arcane-darkBorder rounded-lg text-white placeholder:text-arcane-grey focus:outline-none focus:border-arcane-accent transition-colors"
                />
                <button
                  onClick={handleCompare}
                  disabled={loading || comparisonPlayers.length < 2}
                  className="px-6 py-3 bg-arcane-accent hover:bg-arcane-accentHover text-arcane-dark font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Comparing...</span>
                    </>
                  ) : (
                    <>
                      <Users size={18} />
                      <span>Compare</span>
                    </>
                  )}
                </button>
              </div>

              {/* Selected Players */}
              {comparisonPlayers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {comparisonPlayers.map((playerId) => (
                    <div
                      key={playerId}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-arcane-darkCard border border-arcane-darkBorder"
                    >
                      <span className="text-sm text-white">{playerId}</span>
                      <button
                        onClick={() => setComparisonPlayers(comparisonPlayers.filter(p => p !== playerId))}
                        className="text-arcane-grey hover:text-red-400 transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comparison Results */}
            {comparisonData.length > 0 && (
              <div className="space-y-6">
                {/* Comparison Radar */}
                <div className="p-6 rounded-xl border border-arcane-darkBorder bg-arcane-darkCard/50 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">DNA Comparison</h3>
                  <div className="h-96">
                    <ComparisonRadar
                      players={comparisonData.map((player, index) => ({
                        name: player.playerName,
                        dnaProfile: player.dnaProfile,
                        color: getStyleColor(player.primaryStyle),
                      }))}
                    />
                  </div>
                </div>

                {/* Style Matrix */}
                <div className="p-6 rounded-xl border border-arcane-darkBorder bg-arcane-darkCard/50 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-white mb-4">Style Comparison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comparisonData.map((player) => (
                      <div
                        key={player.playerId}
                        className="p-4 rounded-lg border border-arcane-darkBorder bg-arcane-dark/50"
                      >
                        <h4 className="font-semibold text-white mb-2">{player.playerName}</h4>
                        <StyleBadge styleName={player.primaryStyle} />
                        {player.secondaryStyle && (
                          <div className="mt-2">
                            <StyleBadge styleName={player.secondaryStyle} size="sm" />
                          </div>
                        )}
                        <div className="mt-3 text-sm text-arcane-greyLight">
                          Confidence: {Math.round(player.styleConfidence * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {comparisonData.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-arcane-accent/10 flex items-center justify-center mx-auto mb-4">
                  <Users size={32} className="text-arcane-accent" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Compare Player Styles</h3>
                <p className="text-arcane-greyLight max-w-md mx-auto">
                  Select 2-5 players to compare their playing styles and compatibility
                </p>
              </div>
            )}
          </div>
        )}

        {/* Explorer Tab */}
        {activeTab === 'explorer' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Explore Playing Styles</h2>
              <p className="text-arcane-greyLight">
                Discover all 12 unique playing style classifications and their characteristics
              </p>
            </div>

            <StyleExplorerGrid
              onStyleSelect={handleStyleSelect}
              styleCounts={styleDistribution.reduce((acc, s) => ({ ...acc, [s.style]: s.count }), {})}
            />
          </div>
        )}
      </div>

      {/* Style Detail Modal */}
      <StyleDetailModal
        style={selectedStyle}
        open={styleModalOpen}
        onClose={() => setStyleModalOpen(false)}
      />
    </div>
  );
}
