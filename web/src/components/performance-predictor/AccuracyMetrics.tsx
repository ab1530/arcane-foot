'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Target, TrendingDown, CheckCircle, BarChart3 } from 'lucide-react';
import { AccuracyMetrics as AccuracyMetricsType } from '@/types/performance-predictor';

interface AccuracyMetricsProps {
  metrics: AccuracyMetricsType;
}

export const AccuracyMetrics: React.FC<AccuracyMetricsProps> = ({ metrics }) => {
  const metricsData = [
    {
      icon: Target,
      label: 'Mean Absolute Error',
      value: `±${metrics.avgError.toFixed(2)}`,
      subtitle: 'rating points',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      description: 'Average prediction error',
    },
    {
      icon: TrendingDown,
      label: 'RMSE',
      value: metrics.rmse.toFixed(2),
      subtitle: 'root mean squared',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      description: 'Prediction accuracy metric',
    },
    {
      icon: CheckCircle,
      label: 'Within Confidence',
      value: `${(metrics.withinCI * 100).toFixed(1)}%`,
      subtitle: 'of predictions',
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      description: 'Predictions within CI',
    },
    {
      icon: BarChart3,
      label: 'Total Predictions',
      value: metrics.totalPredictions.toLocaleString(),
      subtitle: 'data points',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/20',
      description: 'Sample size',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
          <div className="w-1 h-6 bg-arcane-accent rounded-full" />
          Model Accuracy Metrics
        </h3>
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span>Date Range: {metrics.dateRange}</span>
          <span>•</span>
          <span>Model: {metrics.modelVersion}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metricsData.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border border-white/10 ${metric.bgColor}`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg bg-black/20`}>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-1">{metric.label}</div>
                <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                </div>
                <div className="text-xs text-gray-500">{metric.subtitle}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Optional R² Score */}
      {metrics.r2Score && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-400">R² Score</div>
              <div className="text-xs text-gray-500">Model fit quality</div>
            </div>
            <div className="text-2xl font-bold text-arcane-accent">
              {metrics.r2Score.toFixed(3)}
            </div>
          </div>
        </motion.div>
      )}

      {/* Performance Indicator */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Model Performance</span>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-8 rounded-full ${
                    i < Math.floor((metrics.withinCI * 5))
                      ? 'bg-arcane-accent'
                      : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-white">
              {metrics.withinCI >= 0.8
                ? 'Excellent'
                : metrics.withinCI >= 0.7
                ? 'Good'
                : metrics.withinCI >= 0.6
                ? 'Fair'
                : 'Needs Improvement'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
