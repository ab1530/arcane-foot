"use client";

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

interface ConfidenceIndicatorProps {
  score: number; // 0-1
  interval: [number, number];
  className?: string;
}

export function ConfidenceIndicator({ score, interval, className = '' }: ConfidenceIndicatorProps) {
  const percentage = Math.round(score * 100);

  // Color coding based on confidence
  const getColor = () => {
    if (score >= 0.8) return {
      bg: 'bg-green-400/20',
      border: 'border-green-400/30',
      text: 'text-green-400',
      stroke: '#4ade80',
      icon: CheckCircle2,
      label: 'High Confidence'
    };
    if (score >= 0.6) return {
      bg: 'bg-yellow-400/20',
      border: 'border-yellow-400/30',
      text: 'text-yellow-400',
      stroke: '#facc15',
      icon: AlertCircle,
      label: 'Medium Confidence'
    };
    return {
      bg: 'bg-red-400/20',
      border: 'border-red-400/30',
      text: 'text-red-400',
      stroke: '#f87171',
      icon: AlertTriangle,
      label: 'Low Confidence'
    };
  };

  const colorConfig = getColor();
  const Icon = colorConfig.icon;

  // SVG circle properties
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score * circumference);

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {/* Circular Progress */}
        <div className="relative">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={colorConfig.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Icon className={`h-6 w-6 ${colorConfig.text} mb-1`} />
            <span className={`text-2xl font-black ${colorConfig.text}`}>
              {percentage}%
            </span>
          </div>
        </div>

        {/* Label and Interval */}
        <div className="text-center space-y-2">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorConfig.bg} ${colorConfig.border}`}>
            <span className={`text-xs font-bold uppercase ${colorConfig.text}`}>
              {colorConfig.label}
            </span>
          </div>

          <div className="text-sm text-arcane-grey">
            Range: €{interval[0].toFixed(1)}M - €{interval[1].toFixed(1)}M
          </div>
        </div>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute -top-2 -right-2 group">
        <div className="w-5 h-5 rounded-full bg-arcane-darkBorder/50 border border-arcane-darkBorder flex items-center justify-center text-arcane-grey text-xs cursor-help">
          ?
        </div>
        <div className="absolute hidden group-hover:block top-full right-0 mt-2 w-64 p-3 bg-arcane-dark border border-arcane-darkBorder rounded-lg shadow-xl z-10">
          <p className="text-xs text-arcane-grey leading-relaxed">
            Confidence score indicates how reliable this valuation is based on data quality
            and model certainty. Higher confidence means more accurate estimation.
          </p>
        </div>
      </div>
    </div>
  );
}
