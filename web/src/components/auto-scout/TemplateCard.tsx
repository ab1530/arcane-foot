'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ReportTemplate } from '@/types/auto-scout';

interface TemplateCardProps {
  template: ReportTemplate;
  selected: boolean;
  onClick: () => void;
}

export function TemplateCard({ template, selected, onClick }: TemplateCardProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-6 rounded-xl border-2 transition-all duration-300
        bg-black/30 backdrop-blur-sm
        ${selected
          ? 'border-[#E4FF3B] shadow-lg shadow-[#E4FF3B]/20'
          : 'border-white/10 hover:border-white/30'
        }
      `}
    >
      {/* Selection indicator */}
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#E4FF3B] flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-black" />
        </motion.div>
      )}

      {/* Icon */}
      <div
        className="text-4xl mb-4 w-16 h-16 rounded-xl flex items-center justify-center mx-auto"
        style={{
          backgroundColor: `${template.color}20`,
          color: template.color,
        }}
      >
        {template.icon}
      </div>

      {/* Content */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-white mb-2">
          {template.name}
        </h3>

        <p className="text-sm text-gray-400 mb-4 min-h-[3rem]">
          {template.description}
        </p>

        {/* Cost estimate */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <span className="text-xs text-gray-400">Est. cost:</span>
          <span className="text-sm font-bold text-[#E4FF3B]">
            {template.costEstimate}
          </span>
        </div>

        {/* Use case */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-1">Best for:</p>
          <p className="text-xs text-white/70">{template.useCase}</p>
        </div>

        {/* Sections count */}
        <div className="mt-3">
          <span className="text-xs text-gray-500">
            {template.sections.length} sections • ~{template.estimatedTokens} tokens
          </span>
        </div>
      </div>
    </motion.button>
  );
}
