'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Target,
  Zap,
  Shield,
  Award,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getImpactColor,
  getImpactBgColor,
  getImpactIcon,
  formatFactorName,
} from '@/lib/utils/rating-helpers';
import { KeyFactor } from '@/types/performance-predictor';

interface KeyFactorsProps {
  factors: KeyFactor[];
}

const getFactorIcon = (factor: string) => {
  const factorLower = factor.toLowerCase();
  if (factorLower.includes('form')) return Activity;
  if (factorLower.includes('rest') || factorLower.includes('fitness')) return Clock;
  if (factorLower.includes('technical')) return Target;
  if (factorLower.includes('physical')) return Zap;
  if (factorLower.includes('mental')) return Shield;
  if (factorLower.includes('rating')) return Award;
  return TrendingUp;
};

export const KeyFactors: React.FC<KeyFactorsProps> = ({ factors }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Sort factors by importance (descending)
  const sortedFactors = [...factors].sort((a, b) => b.importance - a.importance);
  const topFactors = sortedFactors.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl"
    >
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <div className="w-1 h-6 bg-arcane-accent rounded-full" />
        Key Influencing Factors
      </h3>

      <div className="space-y-4">
        {topFactors.map((factor, index) => {
          const Icon = getFactorIcon(factor.factor);
          const isExpanded = expandedIndex === index;

          return (
            <motion.div
              key={factor.factor}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Factor Header */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getImpactBgColor(factor.impact)}`}>
                  <Icon className={`w-5 h-5 ${getImpactColor(factor.impact)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-white truncate">
                      {formatFactorName(factor.factor)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${getImpactColor(factor.impact)}`}>
                        {getImpactIcon(factor.impact)}{' '}
                        {(factor.importance * 100).toFixed(1)}%
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setExpandedIndex(isExpanded ? null : index)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.importance * 100}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`absolute inset-y-0 left-0 ${getImpactBgColor(factor.impact)}`}
                      style={{
                        background:
                          factor.impact === 'positive'
                            ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.6))'
                            : factor.impact === 'negative'
                            ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.3), rgba(239, 68, 68, 0.6))'
                            : 'linear-gradient(90deg, rgba(156, 163, 175, 0.3), rgba(156, 163, 175, 0.6))',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="pl-14 pr-4 py-3 bg-white/5 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Current Value:</span>
                          <span className="text-white font-medium">
                            {typeof factor.value === 'number'
                              ? factor.value.toFixed(2)
                              : factor.value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Impact:</span>
                          <span className={`font-medium ${getImpactColor(factor.impact)}`}>
                            {factor.impact.charAt(0).toUpperCase() + factor.impact.slice(1)}
                          </span>
                        </div>
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-sm text-gray-300">{factor.description}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Positive</span>
            </div>
            <div className="text-lg font-bold text-green-400">
              {factors.filter((f) => f.impact === 'positive').length}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-gray-400">Negative</span>
            </div>
            <div className="text-lg font-bold text-red-400">
              {factors.filter((f) => f.impact === 'negative').length}
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Neutral</span>
            </div>
            <div className="text-lg font-bold text-gray-400">
              {factors.filter((f) => f.impact === 'neutral').length}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
