/**
 * GRADIENT TEXT - 120K Premium
 * Texte avec gradients animés et effets néon
 */

"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  animated?: boolean;
  glow?: boolean;
}

export function GradientText({
  children,
  className = "",
  animated = false,
  glow = false,
}: GradientTextProps) {
  const baseStyles = `
    bg-clip-text text-transparent
    bg-gradient-to-r from-white via-arcane-accent to-white
  `;

  const glowStyles = glow
    ? "drop-shadow-[0_0_30px_rgba(228,255,59,0.5)]"
    : "";

  if (animated) {
    return (
      <motion.span
        className={`${baseStyles} ${glowStyles} ${className}`}
        style={{
          backgroundSize: "200% auto",
        }}
        animate={{
          backgroundPosition: ["0% center", "200% center", "0% center"],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {children}
      </motion.span>
    );
  }

  return (
    <span className={`${baseStyles} ${glowStyles} ${className}`}>
      {children}
    </span>
  );
}

export function NeonText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      className={`
        text-arcane-accent font-bold
        ${className}
      `}
      style={{
        textShadow: "0 0 30px rgba(228, 255, 59, 0.5), 0 0 60px rgba(228, 255, 59, 0.3)",
      }}
      animate={{
        textShadow: [
          "0 0 30px rgba(228, 255, 59, 0.5), 0 0 60px rgba(228, 255, 59, 0.3)",
          "0 0 40px rgba(228, 255, 59, 0.7), 0 0 80px rgba(228, 255, 59, 0.4)",
          "0 0 30px rgba(228, 255, 59, 0.5), 0 0 60px rgba(228, 255, 59, 0.3)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.span>
  );
}
