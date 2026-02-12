'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { formatRating, getRatingColor } from '@/lib/utils/rating-helpers';

interface ConfidenceIntervalProps {
  predicted: number;
  low: number;
  high: number;
}

export const ConfidenceInterval: React.FC<ConfidenceIntervalProps> = ({
  predicted,
  low,
  high,
}) => {
  // Calculate percentages for positioning (scale 0-10)
  const lowPercent = (low / 10) * 100;
  const highPercent = (high / 10) * 100;
  const predictedPercent = (predicted / 10) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">95% Confidence Interval</span>
        <span className="text-white font-medium">
          {formatRating(low)} - {formatRating(high)}
        </span>
      </div>

      {/* Visual Slider */}
      <div className="relative h-12 bg-white/5 rounded-lg">
        {/* Scale Markers */}
        <div className="absolute inset-x-0 top-0 flex justify-between px-2 pt-1">
          {[0, 2, 4, 6, 8, 10].map((mark) => (
            <div key={mark} className="flex flex-col items-center">
              <div className="w-px h-2 bg-gray-600" />
              <span className="text-xs text-gray-500 mt-1">{mark}</span>
            </div>
          ))}
        </div>

        {/* Confidence Range */}
        <motion.div
          initial={{ width: 0, left: `${lowPercent}%` }}
          animate={{
            width: `${highPercent - lowPercent}%`,
            left: `${lowPercent}%`,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute top-1/2 h-2 -translate-y-1/2 bg-gradient-to-r from-blue-500/30 via-blue-500/50 to-blue-500/30 rounded-full"
        />

        {/* Predicted Value Marker */}
        <motion.div
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: `${predictedPercent}%`, opacity: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        >
          <div
            className={`w-4 h-4 rounded-full ${getRatingColor(predicted).replace('text-', 'bg-')} border-2 border-white shadow-lg`}
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className="px-2 py-1 bg-black/80 rounded text-xs font-bold text-white">
              {formatRating(predicted)}
            </div>
          </div>
        </motion.div>

        {/* Low/High Labels */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="absolute inset-x-0 bottom-1 flex justify-between px-2"
        >
          <div
            className="text-xs font-medium text-blue-400"
            style={{ position: 'absolute', left: `${lowPercent}%`, transform: 'translateX(-50%)' }}
          >
            {formatRating(low)}
          </div>
          <div
            className="text-xs font-medium text-blue-400"
            style={{ position: 'absolute', left: `${highPercent}%`, transform: 'translateX(-50%)' }}
          >
            {formatRating(high)}
          </div>
        </motion.div>
      </div>

      <div className="text-xs text-gray-400 text-center">
        There is a 95% probability the actual rating will fall within this range
      </div>
    </motion.div>
  );
};
