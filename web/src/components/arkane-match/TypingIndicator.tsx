"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";

/**
 * TypingIndicator Component
 * Animated indicator showing AI is processing
 */
export function TypingIndicator() {
  const dotVariants = {
    initial: { y: 0 },
    animate: { y: -8 },
  };

  const dotTransition = {
    duration: 0.5,
    repeat: Infinity,
    repeatType: "reverse" as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-start gap-3 mb-4"
    >
      {/* AI Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-arcane-accent/30 to-arcane-accent/10 border border-arcane-accent/30 flex items-center justify-center">
        <Bot className="h-4 w-4 text-arcane-accent" />
      </div>

      {/* Typing Bubble */}
      <div className="bg-arcane-darkCard backdrop-blur-md border border-arcane-darkBorder/50 rounded-2xl rounded-tl-sm px-6 py-4 max-w-xs">
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 bg-arcane-accent rounded-full"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{ ...dotTransition, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-arcane-accent rounded-full"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{ ...dotTransition, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-arcane-accent rounded-full"
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{ ...dotTransition, delay: 0.4 }}
          />
        </div>
        <p className="text-xs text-arcane-grey mt-2">
          ArkaneMatch is thinking...
        </p>
      </div>
    </motion.div>
  );
}
