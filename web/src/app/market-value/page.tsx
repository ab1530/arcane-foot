"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  BarChart3,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { AnimatedBackground } from '@/components/ui/animated-background';
import MainLayout from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Breadcrumb } from '@/components/breadcrumb';
import { PlayerValuationCard } from '@/components/market-value/PlayerValuationCard';
import { FactorBreakdown } from '@/components/market-value/FactorBreakdown';
import { ValuationTrend } from '@/components/market-value/ValuationTrend';
import { ComparablePlayers } from '@/components/market-value/ComparablePlayers';
import { PlayerComparison } from '@/components/market-value/PlayerComparison';
import { PlayerValuation } from '@/types/market-value';
import { apiClient } from '@/lib/api-client';
import { marketValueApi } from '@/lib/api/market-value';
import { toast } from 'sonner';

type TabType = 'valuation' | 'comparison' | 'analytics';

export default function MarketValuePage() {
  const [activeTab, setActiveTab] = useState<TabType>('valuation');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [comparisonPlayerIds, setComparisonPlayerIds] = useState<string[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [currentValuation, setCurrentValuation] = useState<PlayerValuation | null>(null);
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'unavailable'>('healthy');
  const [loading, setLoading] = useState(false);

  // Check AI service health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const status = await marketValueApi.checkHealth();
        setHealthStatus(status.status);
      } catch (error) {
        console.error('Error checking health:', error);
        setHealthStatus('unavailable');
      }
    };

    checkHealth();
  }, []);

  // Search players
  useEffect(() => {
    const searchPlayers = async () => {
      if (playerSearch.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setLoading(true);
        const response = await apiClient.getPlayers({ search: playerSearch, limit: 10 });
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Error searching players:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      searchPlayers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [playerSearch]);

  const handlePlayerSelect = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setShowSearchDropdown(false);
    setPlayerSearch('');
    setSearchResults([]);
  };

  const handleAddToComparison = (playerId: string) => {
    if (comparisonPlayerIds.includes(playerId)) {
      toast.error('Player already added to comparison');
      return;
    }

    if (comparisonPlayerIds.length >= 5) {
      toast.error('Maximum 5 players can be compared');
      return;
    }

    setComparisonPlayerIds([...comparisonPlayerIds, playerId]);
    setShowSearchDropdown(false);
    setPlayerSearch('');
    setSearchResults([]);
    toast.success('Player added to comparison');
  };

  const handleRemoveFromComparison = (playerId: string) => {
    setComparisonPlayerIds(comparisonPlayerIds.filter((id) => id !== playerId));
    toast.success('Player removed from comparison');
  };

  const handleValuationComplete = (valuation: PlayerValuation) => {
    setCurrentValuation(valuation);
  };

  const tabs = [
    {
      id: 'valuation' as TabType,
      label: 'Player Valuation',
      icon: TrendingUp,
      description: 'AI-powered player market value estimation',
    },
    {
      id: 'comparison' as TabType,
      label: 'Comparison',
      icon: Users,
      description: 'Compare multiple players side-by-side',
    },
    {
      id: 'analytics' as TabType,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Market insights and trends',
    },
  ];

  return (
    <ProtectedRoute>
      <MainLayout>
        <main className="min-h-screen overflow-hidden relative">
          <AnimatedBackground />

          {/* Main Content */}
          <div className="relative z-10">
            {/* Top Bar */}
            <div className="sticky top-0 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-black text-white uppercase tracking-wide">
                        MarketValue AI
                      </h1>
                      <div className="flex items-center gap-2 px-3 py-1 bg-arcane-accent/20 border border-arcane-accent/30 rounded-full">
                        <Sparkles className="h-3.5 w-3.5 text-arcane-accent" />
                        <span className="text-xs font-bold text-arcane-accent uppercase">
                          ML Powered
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-arcane-grey">
                      AI-powered player market valuation and analysis
                    </p>
                  </div>

                  {/* Health Status Badge */}
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                      healthStatus === 'healthy'
                        ? 'bg-green-400/20 border-green-400/30 text-green-400'
                        : healthStatus === 'degraded'
                        ? 'bg-yellow-400/20 border-yellow-400/30 text-yellow-400'
                        : 'bg-red-400/20 border-red-400/30 text-red-400'
                    }`}
                  >
                    {healthStatus === 'healthy' ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <span className="text-xs font-bold uppercase">
                      {healthStatus === 'healthy' ? 'ML Active' : healthStatus === 'degraded' ? 'Degraded' : 'Offline'}
                    </span>
                  </div>
                </div>
                <Breadcrumb items={[{ label: 'Market Value AI' }]} />
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Tabs */}
              <div className="mb-6">
                <GlassCard variant="elevated" className="p-2">
                  <div className="flex gap-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold uppercase text-sm transition-all ${
                            activeTab === tab.id
                              ? 'bg-arcane-accent text-arcane-dark'
                              : 'text-arcane-grey hover:text-white hover:bg-arcane-darkBorder/30'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </GlassCard>

                {/* Tab Description */}
                <p className="text-sm text-arcane-grey mt-3 text-center">
                  {tabs.find((t) => t.id === activeTab)?.description}
                </p>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'valuation' && (
                  <motion.div
                    key="valuation"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Player Search */}
                    <GlassCard variant="elevated" className="p-6">
                      <h3 className="text-lg font-black text-white uppercase mb-4">
                        Select Player
                      </h3>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search players by name..."
                          value={playerSearch}
                          onChange={(e) => {
                            setPlayerSearch(e.target.value);
                            setShowSearchDropdown(true);
                          }}
                          onFocus={() => setShowSearchDropdown(true)}
                          className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white placeholder-arcane-grey focus:outline-none focus:border-arcane-accent/50 transition-colors"
                        />

                        {/* Search Dropdown */}
                        {showSearchDropdown && searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-arcane-dark border border-arcane-darkBorder rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                            {searchResults.map((player) => (
                              <button
                                key={player.id}
                                onClick={() => handlePlayerSelect(player.id)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-arcane-darkBorder/30 transition-colors text-left"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-white">{player.name}</p>
                                  <p className="text-xs text-arcane-grey">
                                    {player.position} • {player.age || 'N/A'} years
                                    {player.currentClub && ` • ${player.currentClub}`}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </GlassCard>

                    {/* Valuation Content */}
                    {selectedPlayerId ? (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Valuation Card */}
                        <div className="lg:col-span-1">
                          <PlayerValuationCard
                            playerId={selectedPlayerId}
                            onValuationComplete={handleValuationComplete}
                          />
                        </div>

                        {/* Right Column - Details */}
                        <div className="lg:col-span-2 space-y-6">
                          {currentValuation && (
                            <>
                              {/* Factor Breakdown */}
                              <FactorBreakdown factors={currentValuation.factors} />

                              {/* Valuation Trend */}
                              <ValuationTrend playerId={selectedPlayerId} />

                              {/* Comparable Players */}
                              <ComparablePlayers
                                players={currentValuation.comparablePlayers}
                                onPlayerClick={handlePlayerSelect}
                              />
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <GlassCard variant="elevated" className="p-12 text-center">
                        <TrendingUp className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">No Player Selected</h3>
                        <p className="text-arcane-grey">
                          Search and select a player to view their market valuation
                        </p>
                      </GlassCard>
                    )}
                  </motion.div>
                )}

                {activeTab === 'comparison' && (
                  <motion.div
                    key="comparison"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Player Search and Selection */}
                    <GlassCard variant="elevated" className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-black text-white uppercase">
                          Select Players to Compare
                        </h3>
                        <span className="text-sm text-arcane-grey">
                          {comparisonPlayerIds.length}/5 Selected
                        </span>
                      </div>

                      {/* Search Input */}
                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search players to add..."
                          value={playerSearch}
                          onChange={(e) => {
                            setPlayerSearch(e.target.value);
                            setShowSearchDropdown(true);
                          }}
                          onFocus={() => setShowSearchDropdown(true)}
                          className="w-full pl-10 pr-4 py-3 bg-arcane-darkBorder/30 border border-arcane-darkBorder/50 rounded-lg text-white placeholder-arcane-grey focus:outline-none focus:border-arcane-accent/50 transition-colors"
                        />

                        {/* Search Dropdown */}
                        {showSearchDropdown && searchResults.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-arcane-dark border border-arcane-darkBorder rounded-lg shadow-xl max-h-64 overflow-y-auto z-50">
                            {searchResults.map((player) => (
                              <button
                                key={player.id}
                                onClick={() => handleAddToComparison(player.id)}
                                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-arcane-darkBorder/30 transition-colors text-left"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-white">{player.name}</p>
                                  <p className="text-xs text-arcane-grey">
                                    {player.position} • {player.age || 'N/A'} years
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Selected Players */}
                      {comparisonPlayerIds.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {comparisonPlayerIds.map((playerId) => (
                            <div
                              key={playerId}
                              className="flex items-center gap-2 px-3 py-1.5 bg-arcane-accent/20 border border-arcane-accent/30 rounded-full"
                            >
                              <span className="text-xs font-bold text-arcane-accent">
                                Player {playerId.slice(0, 8)}
                              </span>
                              <button
                                onClick={() => handleRemoveFromComparison(playerId)}
                                className="text-arcane-accent hover:text-red-400 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </GlassCard>

                    {/* Comparison Results */}
                    <PlayerComparison playerIds={comparisonPlayerIds} />
                  </motion.div>
                )}

                {activeTab === 'analytics' && (
                  <motion.div
                    key="analytics"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GlassCard variant="elevated" className="p-12 text-center">
                      <BarChart3 className="h-16 w-16 text-arcane-grey mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        Market Analytics Coming Soon
                      </h3>
                      <p className="text-arcane-grey max-w-md mx-auto">
                        Position-based valuations, league analytics, and market trends will be
                        available in the next update
                      </p>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </MainLayout>
    </ProtectedRoute>
  );
}
