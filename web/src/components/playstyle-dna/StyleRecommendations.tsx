'use client';

import { motion } from 'framer-motion';
import { Target, TrendingUp, Lightbulb, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface StyleRecommendationsProps {
  recommendations: string[];
  style: string;
}

const getRecommendationType = (recommendation: string): 'training' | 'tactical' | 'development' => {
  const lower = recommendation.toLowerCase();
  if (lower.includes('train') || lower.includes('practice')) return 'training';
  if (lower.includes('tactical') || lower.includes('position')) return 'tactical';
  return 'development';
};

const getIcon = (type: string) => {
  switch (type) {
    case 'training':
      return Target;
    case 'tactical':
      return TrendingUp;
    case 'development':
      return Lightbulb;
    default:
      return CheckCircle2;
  }
};

const getIconColor = (type: string): string => {
  switch (type) {
    case 'training':
      return '#3B82F6'; // Blue
    case 'tactical':
      return '#10B981'; // Green
    case 'development':
      return '#F59E0B'; // Amber
    default:
      return '#E4FF3B'; // Arcane accent
  }
};

export function StyleRecommendations({ recommendations, style }: StyleRecommendationsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-arcane-grey">
        <p>No recommendations available</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recommendations.map((recommendation, index) => {
        const type = getRecommendationType(recommendation);
        const Icon = getIcon(type);
        const iconColor = getIconColor(type);
        const isExpanded = expandedIndex === index;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group"
          >
            <div
              className="flex items-start gap-3 p-4 rounded-lg border border-arcane-darkBorder bg-arcane-darkCard/30 backdrop-blur-sm hover:bg-arcane-darkCard/50 transition-all cursor-pointer"
              onClick={() => setExpandedIndex(isExpanded ? null : index)}
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                style={{
                  backgroundColor: `${iconColor}15`,
                  border: `1px solid ${iconColor}30`,
                }}
              >
                <Icon size={18} style={{ color: iconColor }} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm leading-relaxed">{recommendation}</p>

                {/* Type badge */}
                <div className="mt-2">
                  <span
                    className="inline-block px-2 py-0.5 text-xs rounded-md font-medium"
                    style={{
                      backgroundColor: `${iconColor}15`,
                      color: iconColor,
                    }}
                  >
                    {type}
                  </span>
                </div>
              </div>

              {/* Expand indicator */}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                className="flex-shrink-0 text-arcane-grey"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 p-4 rounded-lg border border-arcane-darkBorder bg-arcane-dark/50 text-sm text-arcane-greyLight">
                  <p className="italic">
                    This recommendation is tailored for your <span className="text-arcane-accent font-medium">{style}</span> playing style.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
