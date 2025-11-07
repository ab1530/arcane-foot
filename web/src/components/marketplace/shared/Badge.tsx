"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "league" | "position" | "filter";
  onRemove?: () => void;
  className?: string;
}

/**
 * Badge Component
 * Reusable badge for displaying leagues, positions, and filter tags
 * @param variant - Style variant: default, league, position, filter
 * @param onRemove - Optional callback for removable badges
 */
export function Badge({
  children,
  variant = "default",
  onRemove,
  className = ""
}: BadgeProps) {
  const variantStyles = {
    default: "bg-arcane-accent/20 text-arcane-accent border-arcane-accent/30",
    league: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    position: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    filter: "bg-arcane-accent/20 text-arcane-accent border-arcane-accent/30"
  };

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all hover:scale-105 ${variantStyles[variant]} ${className}`}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity"
          aria-label="Remove badge"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.span>
  );
}

interface ExpertiseBadgeProps {
  items: string[];
  maxVisible?: number;
  variant?: "league" | "position";
  className?: string;
}

/**
 * ExpertiseBadge Component
 * Displays a list of expertise items with overflow handling
 * @param items - Array of expertise strings
 * @param maxVisible - Maximum number of visible badges (default: 3)
 * @param variant - Badge variant
 */
export function ExpertiseBadge({
  items,
  maxVisible = 3,
  variant = "league",
  className = ""
}: ExpertiseBadgeProps) {
  const visibleItems = items.slice(0, maxVisible);
  const remainingCount = items.length - maxVisible;

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visibleItems.map((item, index) => (
        <Badge key={index} variant={variant}>
          {item}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant={variant} className="opacity-70">
          +{remainingCount} more
        </Badge>
      )}
    </div>
  );
}
