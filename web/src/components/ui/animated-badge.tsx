"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedBadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  pulse?: boolean;
  glow?: boolean;
  className?: string;
}

export function AnimatedBadge({
  children,
  variant = "default",
  pulse = false,
  glow = false,
  className = ""
}: AnimatedBadgeProps) {
  const variants = {
    default: "bg-arcane-accent/20 text-arcane-accent border-arcane-accent/30",
    success: "bg-green-500/20 text-green-400 border-green-500/30",
    warning: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    error: "bg-red-500/20 text-red-400 border-red-500/30",
    info: "bg-blue-500/20 text-blue-400 border-blue-500/30"
  };

  const glowColors = {
    default: "rgba(228, 255, 59, 0.5)",
    success: "rgba(34, 197, 94, 0.5)",
    warning: "rgba(234, 179, 8, 0.5)",
    error: "rgba(239, 68, 68, 0.5)",
    info: "rgba(59, 130, 246, 0.5)"
  };

  const Badge = (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        ...(pulse && {
          scale: [1, 1.05, 1],
        }),
        ...(glow && {
          boxShadow: [
            `0 0 0px ${glowColors[variant]}`,
            `0 0 20px ${glowColors[variant]}`,
            `0 0 0px ${glowColors[variant]}`
          ]
        })
      }}
      transition={{
        duration: 0.3,
        scale: pulse ? {
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        } : undefined,
        boxShadow: glow ? {
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        } : undefined
      }}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${variants[variant]} ${className}`}
    >
      {children}
    </motion.span>
  );

  return Badge;
}

export function CountBadge({ count, max = 99, className = "" }: { count: number; max?: number; className?: string }) {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <AnimatedBadge variant="error" pulse={count > 0} className={className}>
      <motion.span
        key={count}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {displayCount}
      </motion.span>
    </AnimatedBadge>
  );
}

export function StatusBadge({
  status,
  className = ""
}: {
  status: "online" | "offline" | "away" | "busy";
  className?: string;
}) {
  const statusConfig = {
    online: { color: "bg-green-500", label: "En ligne" },
    offline: { color: "bg-gray-500", label: "Hors ligne" },
    away: { color: "bg-yellow-500", label: "Absent" },
    busy: { color: "bg-red-500", label: "Occupé" }
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-2 ${className}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <motion.span
        className={`h-2 w-2 rounded-full ${statusConfig[status].color}`}
        animate={{
          scale: status === "online" ? [1, 1.2, 1] : 1,
          opacity: status === "online" ? [1, 0.7, 1] : 1
        }}
        transition={{
          duration: 2,
          repeat: status === "online" ? Infinity : 0,
          ease: "easeInOut"
        }}
      />
      <span className="text-xs text-arcane-grey">{statusConfig[status].label}</span>
    </motion.div>
  );
}
