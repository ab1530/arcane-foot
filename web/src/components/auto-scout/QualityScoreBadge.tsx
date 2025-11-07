'use client';

import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { useState } from 'react';
import { QualityScore, getGradeColor, getGradeDescription } from '@/types/auto-scout';

interface QualityScoreBadgeProps {
  qualityScore: QualityScore;
  size?: 'sm' | 'md' | 'lg';
}

export function QualityScoreBadge({ qualityScore, size = 'md' }: QualityScoreBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const sizeClasses = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-24 h-24 text-3xl',
    lg: 'w-32 h-32 text-4xl',
  };

  const gradeColor = getGradeColor(qualityScore.grade);
  const percentage = qualityScore.total;

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative inline-block"
        onMouseEnter={() => setShowBreakdown(true)}
        onMouseLeave={() => setShowBreakdown(false)}
      >
        {/* Circular progress */}
        <div className={`${sizeClasses[size]} relative`}>
          {/* Background circle */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke={gradeColor}
              strokeWidth="8"
              strokeDasharray={`${percentage * 2.83} 283`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>

          {/* Grade letter */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={`${sizeClasses[size].split(' ')[2]} font-bold`}
              style={{ color: gradeColor }}
            >
              {qualityScore.grade}
            </span>
            <span className="text-xs text-gray-400 mt-1">
              {qualityScore.total}/100
            </span>
          </div>
        </div>

        {/* Info icon */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
          <Info className="w-3 h-3 text-gray-400" />
        </div>

        {/* Hover tooltip */}
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 p-4 rounded-xl bg-black/95 backdrop-blur-sm border border-white/20 shadow-2xl z-50"
          >
            {/* Grade description */}
            <div className="mb-4">
              <h4 className="text-sm font-bold text-white mb-1">
                Grade {qualityScore.grade}
              </h4>
              <p className="text-xs text-gray-400">
                {getGradeDescription(qualityScore.grade)}
              </p>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Quality Breakdown
              </h5>

              {Object.entries(qualityScore.breakdown).map(([key, value]) => (
                <div key={key}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-xs font-bold text-white">
                      {value}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: gradeColor }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Grade label below */}
      <div className="text-center mt-2">
        <p className="text-xs font-semibold text-gray-300">
          Quality Score
        </p>
      </div>
    </div>
  );
}
