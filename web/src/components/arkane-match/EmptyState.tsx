"use client";

import { motion } from "framer-motion";
import { Bot, TrendingUp, Shield, DollarSign } from "lucide-react";

interface EmptyStateProps {
  onExampleClick: (query: string) => void;
}

/**
 * EmptyState Component
 * Welcome message and example queries to get started
 */
export function EmptyState({ onExampleClick }: EmptyStateProps) {
  const examples = [
    {
      icon: TrendingUp,
      text: "LaLiga specialists",
      query: "I need a LaLiga scout",
      color: "text-blue-400",
    },
    {
      icon: Shield,
      text: "Defensive scouts",
      query: "Find me a scout who specializes in center backs",
      color: "text-green-400",
    },
    {
      icon: DollarSign,
      text: "Budget-friendly options",
      query: "Show me scouts under 150 euros per hour",
      color: "text-yellow-400",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center h-full py-12 px-4"
    >
      {/* Robot Icon with Glow */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="relative mb-6"
      >
        <div className="absolute inset-0 bg-arcane-accent/20 blur-3xl rounded-full" />
        <div className="relative bg-gradient-to-br from-arcane-accent/20 to-arcane-accent/5 p-6 rounded-full border-2 border-arcane-accent/30">
          <Bot className="h-16 w-16 text-arcane-accent" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-4xl md:text-5xl font-black text-white mb-3 text-center"
      >
        ArkaneMatch
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-arcane-grey text-lg mb-8 text-center max-w-md"
      >
        Welcome! I'm your AI assistant for finding the perfect scout.
      </motion.p>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5 }}
        className="w-24 h-0.5 bg-gradient-to-r from-transparent via-arcane-accent to-transparent mb-8"
      />

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-arcane-greyLight text-sm mb-6 text-center font-semibold uppercase tracking-wider"
      >
        Tell me what you're looking for:
      </motion.p>

      {/* Example Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-8">
        {examples.map((example, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            onClick={() => onExampleClick(example.query)}
            className="group relative overflow-hidden p-6 rounded-lg bg-arcane-darkCard border border-arcane-darkBorder hover:border-arcane-accent/50 transition-all duration-300 text-left"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-arcane-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Icon */}
            <div className="relative mb-3">
              <example.icon className={`h-8 w-8 ${example.color}`} />
            </div>

            {/* Text */}
            <div className="relative">
              <p className="text-white font-bold text-sm mb-1">{example.text}</p>
              <p className="text-arcane-grey text-xs line-clamp-2">
                {example.query}
              </p>
            </div>

            {/* Arrow */}
            <motion.div
              className="absolute bottom-4 right-4 text-arcane-accent opacity-0 group-hover:opacity-100"
              initial={{ x: -10 }}
              whileHover={{ x: 0 }}
            >
              →
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Additional Prompt */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-arcane-grey text-sm text-center"
      >
        Or just type your needs in your own words!
      </motion.p>
    </motion.div>
  );
}
