"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Loader2 } from 'lucide-react';
import { marketValueApi } from '@/lib/api/market-value';
import { ValuationTrend as ValuationTrendType } from '@/types/market-value';
import { toast } from 'sonner';

interface ValuationTrendProps {
  playerId: string;
  className?: string;
}

export function ValuationTrend({ playerId, className = '' }: ValuationTrendProps) {
  const [trendData, setTrendData] = useState<ValuationTrendType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        setLoading(true);
        const data = await marketValueApi.getValuationTrend(playerId);
        setTrendData(data);
      } catch (error) {
        console.error('Error fetching valuation trend:', error);
        toast.error('Failed to load valuation trend');
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchTrend();
    }
  }, [playerId]);

  if (loading) {
    return (
      <div className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-arcane-accent animate-spin" />
        </div>
      </div>
    );
  }

  if (!trendData || trendData.valuations.length === 0) {
    return (
      <div className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Calendar className="h-12 w-12 text-arcane-grey mb-3" />
          <p className="text-white font-bold mb-1">No Historical Data</p>
          <p className="text-sm text-arcane-grey">
            Valuation trend will appear once more data is collected
          </p>
        </div>
      </div>
    );
  }

  // Format data for chart
  const chartData = trendData.valuations.map(point => ({
    date: new Date(point.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: point.value,
    confidence: point.confidence * 100,
  }));

  // Determine trend icon and color
  const getTrendInfo = () => {
    if (trendData.trend === 'up') {
      return {
        icon: TrendingUp,
        color: 'text-green-400',
        bg: 'bg-green-400/20',
        border: 'border-green-400/30',
        label: 'Trending Up',
      };
    } else if (trendData.trend === 'down') {
      return {
        icon: TrendingDown,
        color: 'text-red-400',
        bg: 'bg-red-400/20',
        border: 'border-red-400/30',
        label: 'Trending Down',
      };
    } else {
      return {
        icon: Minus,
        color: 'text-yellow-400',
        bg: 'bg-yellow-400/20',
        border: 'border-yellow-400/30',
        label: 'Stable',
      };
    }
  };

  const trendInfo = getTrendInfo();
  const TrendIcon = trendInfo.icon;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-arcane-dark/95 backdrop-blur-xl border border-arcane-darkBorder rounded-lg p-3 shadow-xl">
          <p className="text-sm font-bold text-white mb-1">{payload[0].payload.date}</p>
          <p className="text-lg font-black text-arcane-accent">
            €{payload[0].value.toFixed(1)}M
          </p>
          <p className="text-xs text-arcane-grey mt-1">
            Confidence: {payload[0].payload.confidence.toFixed(0)}%
          </p>
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
          <Calendar className="h-5 w-5 text-arcane-accent" />
          Valuation Trend
        </h3>

        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${trendInfo.bg} ${trendInfo.border}`}>
          <TrendIcon className={`h-4 w-4 ${trendInfo.color}`} />
          <span className={`text-xs font-bold uppercase ${trendInfo.color}`}>
            {trendInfo.label}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-arcane-darkBorder/30 rounded-lg p-3">
          <p className="text-xs text-arcane-grey uppercase mb-1">Current</p>
          <p className="text-xl font-black text-white">€{trendData.currentValue.toFixed(1)}M</p>
        </div>
        <div className="bg-arcane-darkBorder/30 rounded-lg p-3">
          <p className="text-xs text-arcane-grey uppercase mb-1">Previous</p>
          <p className="text-xl font-black text-white">€{trendData.previousValue.toFixed(1)}M</p>
        </div>
        <div className="bg-arcane-darkBorder/30 rounded-lg p-3">
          <p className="text-xs text-arcane-grey uppercase mb-1">Change</p>
          <p className={`text-xl font-black ${trendData.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {trendData.changePercent >= 0 ? '+' : ''}{trendData.changePercent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E4FF3B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#E4FF3B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              stroke="#666"
              tick={{ fill: '#999', fontSize: 11 }}
              axisLine={{ stroke: '#333' }}
            />
            <YAxis
              stroke="#666"
              tick={{ fill: '#999', fontSize: 11 }}
              axisLine={{ stroke: '#333' }}
              tickFormatter={(value) => `€${value}M`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#E4FF3B"
              strokeWidth={2}
              fill="url(#colorValue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Data Points Info */}
      <div className="mt-4 pt-4 border-t border-arcane-darkBorder/50 flex items-center justify-between text-xs text-arcane-grey">
        <span>{trendData.valuations.length} data points</span>
        <span>Last updated: {new Date(trendData.valuations[trendData.valuations.length - 1].timestamp).toLocaleDateString()}</span>
      </div>
    </motion.div>
  );
}
