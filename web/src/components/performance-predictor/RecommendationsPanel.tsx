'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Lightbulb,
  Star,
  TrendingUp,
} from 'lucide-react';
import { getRatingLevel } from '@/lib/utils/rating-helpers';

interface RecommendationsPanelProps {
  recommendations: string[];
  predictedRating: number;
}

const getRecommendationType = (recommendation: string): 'warning' | 'positive' | 'info' => {
  const lowerRec = recommendation.toLowerCase();
  if (lowerRec.includes('caution') || lowerRec.includes('risk') || lowerRec.includes('concern')) {
    return 'warning';
  }
  if (
    lowerRec.includes('excellent') ||
    lowerRec.includes('strong') ||
    lowerRec.includes('high')
  ) {
    return 'positive';
  }
  return 'info';
};

const getRecommendationIcon = (type: 'warning' | 'positive' | 'info') => {
  switch (type) {
    case 'warning':
      return AlertTriangle;
    case 'positive':
      return CheckCircle;
    case 'info':
      return Info;
  }
};

const getRecommendationColor = (type: 'warning' | 'positive' | 'info') => {
  switch (type) {
    case 'warning':
      return {
        text: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/50',
      };
    case 'positive':
      return {
        text: 'text-green-400',
        bg: 'bg-green-500/20',
        border: 'border-green-500/50',
      };
    case 'info':
      return {
        text: 'text-blue-400',
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/50',
      };
  }
};

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  recommendations,
  predictedRating,
}) => {
  const ratingLevel = getRatingLevel(predictedRating);

  // Add contextual recommendations based on rating
  const contextualRecommendations = [...recommendations];

  if (ratingLevel === 'excellent') {
    contextualRecommendations.unshift(
      'High performance expected. Consider giving player key role in match strategy.'
    );
  } else if (ratingLevel === 'poor') {
    contextualRecommendations.unshift(
      'Below-average performance predicted. Consider alternatives or provide extra support.'
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-arcane-accent/20 rounded-lg">
          <Lightbulb className="w-6 h-6 text-arcane-accent" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Tactical Recommendations</h3>
          <p className="text-sm text-gray-400">
            ML-powered insights for match preparation
          </p>
        </div>
      </div>

      {/* Overall Assessment */}
      <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-arcane-accent/20 rounded-lg">
            <Star className="w-5 h-5 text-arcane-accent" />
          </div>
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-1">Performance Outlook</div>
            <div className="text-lg font-bold text-white">
              {ratingLevel === 'excellent' && 'Excellent performance expected'}
              {ratingLevel === 'good' && 'Good performance expected'}
              {ratingLevel === 'average' && 'Average performance expected'}
              {ratingLevel === 'poor' && 'Below-average performance expected'}
            </div>
          </div>
          <TrendingUp
            className={`w-6 h-6 ${
              ratingLevel === 'excellent'
                ? 'text-green-400'
                : ratingLevel === 'good'
                ? 'text-blue-400'
                : ratingLevel === 'average'
                ? 'text-yellow-400'
                : 'text-red-400'
            }`}
          />
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {contextualRecommendations.map((recommendation, index) => {
          const type = getRecommendationType(recommendation);
          const Icon = getRecommendationIcon(type);
          const colors = getRecommendationColor(type);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-4 rounded-lg border ${colors.bg} ${colors.border}`}
            >
              <div className={`mt-0.5 ${colors.text}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="flex-1 text-sm text-gray-200 leading-relaxed">
                {recommendation}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-gray-400 mb-1">Total</div>
            <div className="text-lg font-bold text-white">
              {contextualRecommendations.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Positive</div>
            <div className="text-lg font-bold text-green-400">
              {contextualRecommendations.filter(
                (r) => getRecommendationType(r) === 'positive'
              ).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Cautions</div>
            <div className="text-lg font-bold text-yellow-400">
              {contextualRecommendations.filter(
                (r) => getRecommendationType(r) === 'warning'
              ).length}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
