"use client";

import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FactorBreakdownProps {
  factors: Record<string, number>;
  className?: string;
}

export function FactorBreakdown({ factors, className = '' }: FactorBreakdownProps) {
  // Transform factors into chart data
  const chartData = Object.entries(factors)
    .map(([key, value]) => ({
      name: formatFactorName(key),
      value: value,
      fullName: key,
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  // Format factor names for display
  function formatFactorName(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/normalized/gi, '')
      .replace(/per 90/gi, '/90')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-arcane-dark/95 backdrop-blur-xl border border-arcane-darkBorder rounded-lg p-3 shadow-xl">
          <p className="text-sm font-bold text-white mb-1">{data.name}</p>
          <p className={`text-lg font-black ${data.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.value >= 0 ? '+' : ''}{data.value.toFixed(2)}M €
          </p>
          <p className="text-xs text-arcane-grey mt-1">
            {data.value >= 0 ? 'Positive contribution' : 'Negative contribution'}
          </p>
        </div>
      );
    }
    return null;
  };

  // Get color based on value
  const getColor = (value: number) => {
    if (value >= 0) return '#4ade80'; // green-400
    return '#f87171'; // red-400
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`bg-arcane-darkBorder/20 backdrop-blur-sm border border-arcane-darkBorder/50 rounded-xl p-6 ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-arcane-accent" />
          Contributing Factors
        </h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-green-400 rounded"></div>
            <span className="text-arcane-grey">Positive</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-400 rounded"></div>
            <span className="text-arcane-grey">Negative</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#666"
              tick={{ fill: '#999', fontSize: 12 }}
              axisLine={{ stroke: '#333' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#666"
              tick={{ fill: '#fff', fontSize: 12, fontWeight: 'bold' }}
              axisLine={{ stroke: '#333' }}
              width={110}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-arcane-darkBorder/50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-arcane-grey uppercase">Positive</span>
            </div>
            <p className="text-lg font-black text-green-400">
              {chartData.filter(f => f.value > 0).length}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-red-400" />
              <span className="text-xs text-arcane-grey uppercase">Negative</span>
            </div>
            <p className="text-lg font-black text-red-400">
              {chartData.filter(f => f.value < 0).length}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-xs text-arcane-grey uppercase">Total</span>
            </div>
            <p className="text-lg font-black text-white">
              {chartData.length}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
