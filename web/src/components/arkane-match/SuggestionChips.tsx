"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface SuggestionChipsProps {
  suggestions: string[];
  onClick: (suggestion: string) => void;
}

/**
 * SuggestionChips Component
 * Quick reply chips for follow-up actions
 */
export function SuggestionChips({ suggestions, onClick }: SuggestionChipsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-3"
    >
      {/* Label */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-3 w-3 text-arcane-accent" />
        <p className="text-xs text-arcane-grey font-semibold uppercase tracking-wider">
          Follow up:
        </p>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            onClick={() => onClick(suggestion)}
            className="group relative px-4 py-2 rounded-full bg-arcane-darkCard border border-arcane-darkBorder hover:border-arcane-accent/50 text-sm text-arcane-greyLight hover:text-white transition-all duration-200"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Background Glow on Hover */}
            <div className="absolute inset-0 rounded-full bg-arcane-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Text */}
            <span className="relative z-10">{suggestion}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
