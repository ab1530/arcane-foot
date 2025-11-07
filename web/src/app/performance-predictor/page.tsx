'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  BarChart3,
  Search,
  Calendar,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PredictionCard } from '@/components/performance-predictor/PredictionCard';
import { RatingDistribution } from '@/components/performance-predictor/RatingDistribution';
import { KeyFactors } from '@/components/performance-predictor/KeyFactors';
import { RecommendationsPanel } from '@/components/performance-predictor/RecommendationsPanel';
import { ConfidenceInterval } from '@/components/performance-predictor/ConfidenceInterval';
import { AccuracyMetrics } from '@/components/performance-predictor/AccuracyMetrics';
import { AccuracyTrendChart } from '@/components/performance-predictor/AccuracyTrendChart';
import { LineupVisualization } from '@/components/performance-predictor/LineupVisualization';
import { performancePredictorApi } from '@/lib/api/performance-predictor';
import { apiClient } from '@/lib/api-client';
import {
  PerformancePrediction,
  AccuracyMetrics as AccuracyMetricsType,
  Player,
  Match,
  AccuracyTrendData,
} from '@/types/performance-predictor';

type TabType = 'prediction' | 'lineup' | 'accuracy';

export default function PerformancePredictorPage() {
  const [activeTab, setActiveTab] = useState<TabType>('prediction');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [lineupPredictions, setLineupPredictions] = useState<PerformancePrediction[]>([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState<AccuracyMetricsType | null>(null);
  const [accuracyTrends, setAccuracyTrends] = useState<AccuracyTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search states
  const [players, setPlayers] = useState<Player[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerSearch, setPlayerSearch] = useState('');
  const [matchSearch, setMatchSearch] = useState('');

  // Fetch players and matches
  useEffect(() => {
    fetchPlayers();
    fetchMatches();
    fetchAccuracyData();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await apiClient.getPlayers({ limit: 100 });
      const playerData = response.data.map((p: any) => ({
        id: p.id,
        name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || 'Unknown',
        firstName: p.firstName,
        lastName: p.lastName,
        position: p.position || 'Unknown',
        photo: p.photo || p.avatar,
        age: p.age,
        nationality: p.nationality,
      }));
      setPlayers(playerData);
    } catch (err) {
      console.error('Error fetching players:', err);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await apiClient.getMatches({ limit: 50, status: 'scheduled' });
      const matchData = response.data.map((m: any) => ({
        id: m.id,
        homeClub: {
          id: m.homeClub?.id || m.homeClubId,
          name: m.homeClub?.name || 'Home Team',
          logo: m.homeClub?.logo,
        },
        awayClub: {
          id: m.awayClub?.id || m.awayClubId,
          name: m.awayClub?.name || 'Away Team',
          logo: m.awayClub?.logo,
        },
        scheduledAt: m.scheduledAt,
        competition: m.competition || m.competitionOld,
        venue: m.venue || m.venueOld,
        status: m.status,
      }));
      setMatches(matchData);
    } catch (err) {
      console.error('Error fetching matches:', err);
    }
  };

  const fetchAccuracyData = async () => {
    try {
      const metrics = await performancePredictorApi.getAccuracy();
      if (metrics && metrics.length > 0) {
        setAccuracyMetrics(metrics[0]);

        // Generate trend data from metrics
        const trends: AccuracyTrendData[] = metrics.map((m) => ({
          month: m.dateRange,
          mae: m.avgError,
          rmse: m.rmse,
          withinCI: m.withinCI * 100,
        }));
        setAccuracyTrends(trends);
      }
    } catch (err) {
      console.error('Error fetching accuracy data:', err);
    }
  };

  const handlePredict = async () => {
    if (!selectedPlayer || !selectedMatch) {
      setError('Please select both a player and a match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await performancePredictorApi.predict(
        selectedPlayer.id,
        selectedMatch.id
      );

      // Enrich with player data
      const enrichedPrediction: PerformancePrediction = {
        ...result,
        playerName: selectedPlayer.name,
        playerPosition: selectedPlayer.position,
        playerPhoto: selectedPlayer.photo,
        matchId: selectedMatch.id,
      };

      setPrediction(enrichedPrediction);
    } catch (err: any) {
      console.error('Prediction error:', err);
      setError(err.message || 'Failed to generate prediction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchPredict = async () => {
    if (!selectedMatch) {
      setError('Please select a match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await performancePredictorApi.batchPredict(selectedMatch.id);

      // Enrich with player data
      const enrichedPredictions = results.map((pred) => {
        const player = players.find((p) => p.id === pred.playerId);
        return {
          ...pred,
          playerName: player?.name || 'Unknown',
          playerPosition: player?.position || 'Unknown',
          playerPhoto: player?.photo,
          matchId: selectedMatch.id,
        };
      });

      setLineupPredictions(enrichedPredictions);
    } catch (err: any) {
      console.error('Batch prediction error:', err);
      setError(err.message || 'Failed to generate lineup predictions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter players and matches
  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const filteredMatches = matches.filter(
    (m) =>
      m.homeClub.name.toLowerCase().includes(matchSearch.toLowerCase()) ||
      m.awayClub.name.toLowerCase().includes(matchSearch.toLowerCase())
  );

  const tabs = [
    { id: 'prediction' as TabType, label: 'Single Prediction', icon: TrendingUp },
    { id: 'lineup' as TabType, label: 'Team Lineup', icon: Users },
    { id: 'accuracy' as TabType, label: 'Accuracy Dashboard', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900/20 to-black p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-arcane-accent/20 rounded-xl">
              <Sparkles className="w-8 h-8 text-arcane-accent" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white">
              Performance Predictor
            </h1>
          </div>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            ML-Powered Player Performance Forecasting
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-arcane-accent/10 border border-arcane-accent/30 rounded-full">
            <div className="w-2 h-2 bg-arcane-accent rounded-full animate-pulse" />
            <span className="text-sm text-arcane-accent font-medium">AI Model Active</span>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center gap-2"
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-arcane-accent text-black'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-300"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {/* Single Prediction Tab */}
          {activeTab === 'prediction' && (
            <motion.div
              key="prediction"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Selection Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Player Selection */}
                <div className="glass-card p-6 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-arcane-accent" />
                    <h3 className="text-lg font-bold text-white">Select Player</h3>
                  </div>
                  <input
                    type="text"
                    placeholder="Search players..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-arcane-accent"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredPlayers.slice(0, 10).map((player) => (
                      <button
                        key={player.id}
                        onClick={() => setSelectedPlayer(player)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                          selectedPlayer?.id === player.id
                            ? 'bg-arcane-accent/20 border border-arcane-accent'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {player.photo ? (
                          <img
                            src={player.photo}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-arcane-accent/20 to-purple-500/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-arcane-accent" />
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <div className="text-white font-medium">{player.name}</div>
                          <div className="text-sm text-gray-400">{player.position}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Match Selection */}
                <div className="glass-card p-6 rounded-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-arcane-accent" />
                    <h3 className="text-lg font-bold text-white">Select Match</h3>
                  </div>
                  <input
                    type="text"
                    placeholder="Search matches..."
                    value={matchSearch}
                    onChange={(e) => setMatchSearch(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-arcane-accent"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                    {filteredMatches.slice(0, 10).map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedMatch(match)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                          selectedMatch?.id === match.id
                            ? 'bg-arcane-accent/20 border border-arcane-accent'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{match.homeClub.name}</span>
                          <span className="text-gray-400">vs</span>
                          <span className="text-white font-medium">{match.awayClub.name}</span>
                        </div>
                        <div className="text-sm text-gray-400">
                          {new Date(match.scheduledAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Predict Button */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePredict}
                  disabled={!selectedPlayer || !selectedMatch || isLoading}
                  className="px-8 py-4 bg-arcane-accent text-black font-bold rounded-lg hover:bg-arcane-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating Prediction...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Prediction
                    </>
                  )}
                </motion.button>
              </div>

              {/* Prediction Results */}
              {prediction && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PredictionCard
                    prediction={prediction}
                    player={selectedPlayer}
                    isLoading={false}
                  />
                  <RatingDistribution distribution={prediction.ratingDistribution} />
                  {prediction.keyFactors.length > 0 && (
                    <KeyFactors factors={prediction.keyFactors} />
                  )}
                  {prediction.recommendations.length > 0 && (
                    <RecommendationsPanel
                      recommendations={prediction.recommendations}
                      predictedRating={prediction.predictedRating}
                    />
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Team Lineup Tab */}
          {activeTab === 'lineup' && (
            <motion.div
              key="lineup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Match Selection */}
              <div className="glass-card p-6 rounded-xl space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-arcane-accent" />
                  <h3 className="text-lg font-bold text-white">Select Match</h3>
                </div>
                <input
                  type="text"
                  placeholder="Search matches..."
                  value={matchSearch}
                  onChange={(e) => setMatchSearch(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-arcane-accent"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredMatches.slice(0, 6).map((match) => (
                    <button
                      key={match.id}
                      onClick={() => setSelectedMatch(match)}
                      className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                        selectedMatch?.id === match.id
                          ? 'bg-arcane-accent/20 border border-arcane-accent'
                          : 'bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white font-medium">{match.homeClub.name}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-white font-medium">{match.awayClub.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <div className="text-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBatchPredict}
                  disabled={!selectedMatch || isLoading}
                  className="px-8 py-4 bg-arcane-accent text-black font-bold rounded-lg hover:bg-arcane-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Analyzing Team...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5" />
                      Generate Team Predictions
                    </>
                  )}
                </motion.button>
              </div>

              {/* Lineup Visualization */}
              {lineupPredictions.length > 0 && (
                <LineupVisualization formation="4-3-3" players={lineupPredictions} />
              )}
            </motion.div>
          )}

          {/* Accuracy Dashboard Tab */}
          {activeTab === 'accuracy' && (
            <motion.div
              key="accuracy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {accuracyMetrics ? (
                <>
                  <AccuracyMetrics metrics={accuracyMetrics} />
                  {accuracyTrends.length > 0 && (
                    <AccuracyTrendChart data={accuracyTrends} />
                  )}
                </>
              ) : (
                <div className="glass-card p-12 rounded-xl text-center">
                  <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No accuracy data available yet</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(228, 255, 59, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(228, 255, 59, 0.5);
        }
      `}</style>
    </div>
  );
}
