'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AccuracyTrendData } from '@/types/performance-predictor';

interface AccuracyTrendChartProps {
  data: AccuracyTrendData[];
}

export const AccuracyTrendChart: React.FC<AccuracyTrendChartProps> = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-4 rounded-lg border border-white/10">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-400">{entry.name}:</span>
              <span className="font-bold" style={{ color: entry.color }}>
                {typeof entry.value === 'number'
                  ? entry.name === 'Within CI'
                    ? `${entry.value.toFixed(1)}%`
                    : entry.value.toFixed(2)
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-6 mt-4">
        {payload.map((entry: any, index: number) => (
          <motion.div
            key={`legend-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-2"
          >
            <div
              className="w-8 h-1 rounded-full"
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
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-arcane-accent rounded-full" />
        Accuracy Trends Over Time
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="month"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Error', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#9CA3AF' }}
            label={{ value: 'Within CI (%)', angle: 90, position: 'insideRight', fill: '#9CA3AF' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="mae"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
            name="MAE"
            animationDuration={1000}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="rmse"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', r: 4 }}
            activeDot={{ r: 6 }}
            name="RMSE"
            animationDuration={1000}
            animationBegin={200}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="withinCI"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ fill: '#10B981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Within CI"
            animationDuration={1000}
            animationBegin={400}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Insights */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Trend</div>
          <div className="text-sm font-bold text-green-400">
            {data.length > 1 &&
            data[data.length - 1].mae < data[0].mae
              ? 'Improving'
              : data.length > 1 && data[data.length - 1].mae > data[0].mae
              ? 'Declining'
              : 'Stable'}
          </div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Best Month</div>
          <div className="text-sm font-bold text-blue-400">
            {data.reduce((best, curr) => (curr.mae < best.mae ? curr : best)).month}
          </div>
        </div>
        <div className="text-center p-3 bg-white/5 rounded-lg">
          <div className="text-xs text-gray-400 mb-1">Avg. CI Rate</div>
          <div className="text-sm font-bold text-green-400">
            {(data.reduce((sum, curr) => sum + curr.withinCI, 0) / data.length).toFixed(1)}%
          </div>
        </div>
      </div>
    </motion.div>
  );
};
