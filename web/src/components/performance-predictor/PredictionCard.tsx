'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, User, Activity } from 'lucide-react';
import {
  getRatingColor,
  getRatingBgColor,
  getRatingBorderColor,
  getRatingLabel,
  formatRating,
  formatConfidence,
  getConfidenceColor,
} from '@/lib/utils/rating-helpers';

interface PredictionCardProps {
  prediction: {
    predictedRating: number;
    confidenceInterval: number[];
    confidence: number;
  } | null;
  player: {
    name: string;
    position: string;
    photo?: string;
  } | null;
  isLoading?: boolean;
  onPredict?: () => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  prediction,
  player,
  isLoading = false,
  onPredict,
}) => {
  if (!player) {
    return (
      <div className="glass-card p-6 rounded-xl">
        <div className="text-center py-8 text-gray-400">
          <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Select a player to view prediction</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 rounded-xl space-y-6"
    >
      {/* Player Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-arcane-accent/30"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-arcane-accent/20 to-purple-500/20 flex items-center justify-center border-2 border-arcane-accent/30">
              <User className="w-8 h-8 text-arcane-accent" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{player.name}</h3>
          <p className="text-sm text-gray-400">{player.position}</p>
        </div>
      </div>

      {/* Prediction Display */}
      {isLoading ? (
        <div className="text-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-12 h-12 border-4 border-arcane-accent border-t-transparent rounded-full mx-auto"
          />
          <p className="mt-4 text-gray-400">Analyzing performance data...</p>
        </div>
      ) : prediction ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Predicted Rating */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-arcane-accent" />
              <span className="text-sm text-gray-400">Predicted Rating</span>
            </div>
            <div
              className={`text-6xl font-bold ${getRatingColor(prediction.predictedRating)} mb-2`}
            >
              {formatRating(prediction.predictedRating)}
              <span className="text-2xl text-gray-500">/10</span>
            </div>
            <div
              className={`inline-block px-4 py-2 rounded-full ${getRatingBgColor(prediction.predictedRating)} ${getRatingBorderColor(prediction.predictedRating)} border`}
            >
              <span className={`text-sm font-semibold ${getRatingColor(prediction.predictedRating)}`}>
                {getRatingLabel(prediction.predictedRating).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Confidence Interval */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Confidence Range</span>
              <span className="text-white font-medium">
                {formatRating(prediction.confidenceInterval[0])} -{' '}
                {formatRating(prediction.confidenceInterval[1])}
              </span>
            </div>
            <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className={`absolute inset-0 ${getRatingBgColor(prediction.predictedRating)}`}
              />
            </div>
          </div>

          {/* Confidence Score */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-arcane-accent" />
              <span className="text-gray-400">Prediction Confidence</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12">
                <svg className="transform -rotate-90 w-12 h-12">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-white/10"
                  />
                  <motion.circle
                    initial={{ strokeDashoffset: 125.6 }}
                    animate={{
                      strokeDashoffset: 125.6 * (1 - prediction.confidence),
                    }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray="125.6"
                    className={getConfidenceColor(prediction.confidence)}
                  />
                </svg>
              </div>
              <span className={`text-lg font-bold ${getConfidenceColor(prediction.confidence)}`}>
                {formatConfidence(prediction.confidence)}
              </span>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="text-center py-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPredict}
            className="px-6 py-3 bg-arcane-accent text-black font-semibold rounded-lg hover:bg-arcane-accent/90 transition-colors"
          >
            Generate Prediction
          </motion.button>
        </div>
      )}
    </motion.div>
  );
};
