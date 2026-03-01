'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, CheckCircle, XCircle } from 'lucide-react';
import { ReportSection } from '@/types/auto-scout';

interface ReportSectionCardProps {
  title: string;
  section: ReportSection;
  defaultExpanded?: boolean;
}

export function ReportSectionCard({ title, section, defaultExpanded = false }: ReportSectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate star rating from 0-10 scale
  const fullStars = Math.floor(section.rating);
  const hasHalfStar = section.rating % 1 >= 0.5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-bold text-white">
            {title}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(10)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < fullStars
                      ? 'fill-[#e6ff3c] text-[#e6ff3c]'
                      : i === fullStars && hasHalfStar
                      ? 'fill-[#e6ff3c]/50 text-[#e6ff3c]'
                      : 'fill-none text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-bold text-white">
              {section.rating.toFixed(1)}/10
            </span>
          </div>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      {/* Expandable content */}
      <motion.div
        initial={false}
        animate={{
          height: isExpanded ? 'auto' : 0,
          opacity: isExpanded ? 1 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-6 pb-6 space-y-4">
          {/* Strengths */}
          {section.strengths && section.strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-semibold text-green-400">
                  Strengths
                </h4>
              </div>
              <ul className="space-y-2">
                {section.strengths.map((strength, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="text-green-400 mt-1">•</span>
                    <span>{strength}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {section.weaknesses && section.weaknesses.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <h4 className="text-sm font-semibold text-red-400">
                  Areas for Improvement
                </h4>
              </div>
              <ul className="space-y-2">
                {section.weaknesses.map((weakness, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-start gap-2 text-sm text-gray-300"
                  >
                    <span className="text-red-400 mt-1">•</span>
                    <span>{weakness}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed analysis */}
          {section.details && (
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-semibold text-white mb-2">
                Detailed Analysis
              </h4>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                {section.details}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
