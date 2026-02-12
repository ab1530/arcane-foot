'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDistributionColors, formatPercentage } from '@/lib/utils/rating-helpers';
import { RatingDistribution as RatingDistributionType } from '@/types/performance-predictor';

interface RatingDistributionProps {
  distribution: RatingDistributionType;
}

export const RatingDistribution: React.FC<RatingDistributionProps> = ({ distribution }) => {
  const colors = getDistributionColors();

  const data = [
    {
      name: 'Excellent (8+)',
      value: distribution.excellent_8_plus * 100,
      color: colors.excellent_8_plus,
    },
    {
      name: 'Good (7-8)',
      value: distribution.good_7_8 * 100,
      color: colors.good_7_8,
    },
    {
      name: 'Average (5-7)',
      value: distribution.average_5_7 * 100,
      color: colors.average_5_7,
    },
    {
      name: 'Poor (0-5)',
      value: distribution.poor_0_5 * 100,
      color: colors.poor_0_5,
    },
  ].filter(item => item.value > 0); // Only show non-zero segments

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 rounded-lg border border-white/10">
          <p className="text-white font-medium">{payload[0].name}</p>
          <p className="text-arcane-accent text-lg font-bold">
            {payload[0].value.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => (
          <motion.div
            key={`legend-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-400">{entry.value}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl"
    >
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <div className="w-1 h-6 bg-arcane-accent rounded-full" />
        Rating Distribution
      </h3>

      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <div className="text-2xl font-bold text-white">Rating</div>
          <div className="text-sm text-gray-400">Probability</div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Most Likely</div>
          <div className="text-lg font-bold text-white">
            {Math.max(
              distribution.excellent_8_plus,
              distribution.good_7_8,
              distribution.average_5_7,
              distribution.poor_0_5
            ) === distribution.excellent_8_plus
              ? 'Excellent'
              : Math.max(
                  distribution.good_7_8,
                  distribution.average_5_7,
                  distribution.poor_0_5
                ) === distribution.good_7_8
              ? 'Good'
              : Math.max(distribution.average_5_7, distribution.poor_0_5) ===
                distribution.average_5_7
              ? 'Average'
              : 'Poor'}
          </div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Above Average</div>
          <div className="text-lg font-bold text-green-400">
            {formatPercentage(distribution.good_7_8 + distribution.excellent_8_plus)}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
