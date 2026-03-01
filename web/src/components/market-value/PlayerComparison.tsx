"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { Users, TrendingUp, Trophy, Loader2, AlertCircle } from 'lucide-react';
import { marketValueApi } from '@/lib/api/market-value';
import { ComparisonResult } from '@/types/market-value';
import { toast } from 'sonner';

interface PlayerComparisonProps {
  playerIds: string[];
  className?: string;
}

export function PlayerComparison({ playerIds, className = '' }: PlayerComparisonProps) {
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparison = async () => {
      if (playerIds.length < 2) {
        setError('Please select at least 2 players to compare');
        return;
      }

      if (playerIds.length > 5) {
        setError('Maximum 5 players can be compared at once');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await marketValueApi.comparePlayers(playerIds);
        setComparison(data);
      } catch (err: any) {
        console.error('Error fetching comparison:', err);
        const errorMessage = err.message || 'Failed to compare players';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (playerIds.length > 0) {
      fetchComparison();
    }
  }, [playerIds]);

  if (loading) {
    return (
      <div className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-arcane-accent animate-spin mx-auto mb-4" />
            <p className="text-white font-bold">Comparing Players...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-white font-bold mb-2">Error</p>
            <p className="text-sm text-arcane-grey">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!comparison) {
    return (
      <div className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Users className="h-12 w-12 text-arcane-grey mx-auto mb-4" />
            <p className="text-white font-bold mb-2">Select Players to Compare</p>
            <p className="text-sm text-arcane-grey">Choose 2-5 players to see detailed comparison</p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for radar chart
  const radarData = [
    {
      category: 'Value',
      ...Object.fromEntries(
        comparison.players.map((p) => [
          p.playerName,
          (p.estimatedValue / comparison.highestValue) * 100,
        ])
      ),
    },
    {
      category: 'Confidence',
      ...Object.fromEntries(comparison.players.map((p) => [p.playerName, p.confidenceScore * 100])),
    },
    {
      category: 'Goals',
      ...Object.fromEntries(
        comparison.players.map((p) => [
          p.playerName,
          (p.goals / Math.max(...comparison.players.map((pl) => pl.goals))) * 100,
        ])
      ),
    },
    {
      category: 'Assists',
      ...Object.fromEntries(
        comparison.players.map((p) => [
          p.playerName,
          (p.assists / Math.max(...comparison.players.map((pl) => pl.assists))) * 100,
        ])
      ),
    },
    {
      category: 'Rating',
      ...Object.fromEntries(
        comparison.players.map((p) => [
          p.playerName,
          (p.rating / Math.max(...comparison.players.map((pl) => pl.rating))) * 100,
        ])
      ),
    },
    {
      category: 'Apps',
      ...Object.fromEntries(
        comparison.players.map((p) => [
          p.playerName,
          (p.appearances / Math.max(...comparison.players.map((pl) => pl.appearances))) * 100,
        ])
      ),
    },
  ];

  const colors = ['#e6ff3c', '#4ade80', '#60a5fa', '#f87171', '#a78bfa'];

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-arcane-dark/95 backdrop-blur-xl border border-arcane-darkBorder rounded-lg p-3 shadow-xl">
          <p className="text-sm font-bold text-white mb-2">{payload[0].payload.category}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-arcane-grey">{entry.name}</span>
              </div>
              <span className="text-xs font-bold text-white">{entry.value.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
          <Users className="h-5 w-5 text-arcane-accent" />
          Player Comparison
        </h3>
        <div className="text-xs text-arcane-grey">{comparison.players.length} Players</div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-arcane-darkBorder/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span className="text-xs text-arcane-grey uppercase">Highest</span>
          </div>
          <p className="text-xl font-black text-white">€{comparison.highestValue.toFixed(1)}M</p>
          <p className="text-xs text-arcane-grey mt-1">
            {comparison.players.find((p) => p.playerId === comparison.highestValuePlayerId)?.playerName}
          </p>
        </div>

        <div className="bg-arcane-darkBorder/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-arcane-accent" />
            <span className="text-xs text-arcane-grey uppercase">Average</span>
          </div>
          <p className="text-xl font-black text-white">€{comparison.averageValue.toFixed(1)}M</p>
        </div>

        <div className="bg-arcane-darkBorder/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-arcane-grey uppercase">Std Dev</span>
          </div>
          <p className="text-xl font-black text-white">€{comparison.valueStdDev.toFixed(1)}M</p>
        </div>

        <div className="bg-arcane-darkBorder/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-arcane-grey uppercase">Range</span>
          </div>
          <p className="text-xl font-black text-white">
            €
            {(
              comparison.highestValue - Math.min(...comparison.players.map((p) => p.estimatedValue))
            ).toFixed(1)}
            M
          </p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-96 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis
              dataKey="category"
              tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#999', fontSize: 10 }} />
            <Tooltip content={<CustomTooltip />} />
            {comparison.players.map((player, index) => (
              <Radar
                key={player.playerId}
                name={player.playerName}
                dataKey={player.playerName}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ))}
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm font-bold text-white">{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Player Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {comparison.players.map((player, index) => (
          <motion.div
            key={player.playerId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-arcane-darkBorder/30 rounded-lg p-4 border-2 ${
              player.playerId === comparison.highestValuePlayerId
                ? 'border-yellow-400/50'
                : 'border-arcane-darkBorder/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <h4 className="text-sm font-black text-white">{player.playerName}</h4>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-arcane-grey">Value</span>
                <span className="font-bold text-arcane-accent">
                  €{player.estimatedValue.toFixed(1)}M
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-arcane-grey">Position</span>
                <span className="font-bold text-white">{player.position}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-arcane-grey">Age</span>
                <span className="font-bold text-white">{player.age}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-arcane-grey">Rating</span>
                <span className="font-bold text-white">{player.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-arcane-grey">Goals / Assists</span>
                <span className="font-bold text-white">
                  {player.goals} / {player.assists}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-arcane-grey">Appearances</span>
                <span className="font-bold text-white">{player.appearances}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
