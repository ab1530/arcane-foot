"use client";

import { motion } from "framer-motion";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  variant?: "spinner" | "dots" | "pulse" | "bars";
  color?: string;
  className?: string;
}

export function Loader({
  size = "md",
  variant = "spinner",
  color = "#E4FF3B",
  className = ""
}: LoaderProps) {
  const sizes = {
    sm: 16,
    md: 32,
    lg: 48
  };

  const sizeValue = sizes[size];

  if (variant === "spinner") {
    return (
      <motion.div
        className={`rounded-full border-2 ${className}`}
        style={{
          width: sizeValue,
          height: sizeValue,
          borderColor: `${color}30`,
          borderTopColor: color
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    );
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: sizeValue / 4,
              height: sizeValue / 4,
              backgroundColor: color
            }}
            animate={{
              y: [0, -sizeValue / 4, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <motion.div
        className={`rounded-full ${className}`}
        style={{
          width: sizeValue,
          height: sizeValue,
          backgroundColor: color
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    );
  }

  if (variant === "bars") {
    return (
      <div className={`flex items-end gap-1 ${className}`} style={{ height: sizeValue }}>
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            style={{
              width: sizeValue / 6,
              backgroundColor: color
            }}
            animate={{
              height: [sizeValue / 4, sizeValue, sizeValue / 4]
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }

  return null;
}

export function FullPageLoader({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-arcane-dark/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center">
        <Loader size="lg" variant="spinner" />
        <motion.p
          className="text-arcane-grey mt-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}

export function InlineLoader({ text, className = "" }: { text?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Loader size="sm" variant="spinner" />
      {text && <span className="text-sm text-arcane-grey">{text}</span>}
    </div>
  );
}
