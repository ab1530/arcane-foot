"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: number) => void;
  showNumber?: boolean;
  className?: string;
}

/**
 * RatingStars Component
 * Displays star rating with optional interactivity for input
 * Features:
 * - Display mode: Shows filled/half/empty stars
 * - Interactive mode: Click to set rating
 * - Hover effects in interactive mode
 * - Size variants (sm, md, lg)
 * - Optional numeric display
 */
export function RatingStars({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onChange,
  showNumber = false,
  className = "",
}: RatingStarsProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const iconSize = sizeClasses[size];
  const displayRating = hoverRating !== null ? hoverRating : rating;

  // Calculate filled stars
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = !interactive && displayRating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  const handleStarClick = (starIndex: number) => {
    if (interactive && onChange) {
      onChange(starIndex + 1);
    }
  };

  const handleStarHover = (starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex + 1);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null);
    }
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
        role={interactive ? "radiogroup" : undefined}
        aria-label={interactive ? "Rating" : `Rating: ${rating} out of ${maxRating} stars`}
      >
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <motion.button
            key={`full-${i}`}
            type="button"
            disabled={!interactive}
            onClick={() => handleStarClick(i)}
            onMouseEnter={() => handleStarHover(i)}
            className={cn(
              "transition-transform",
              interactive && "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-arcane-accent focus:ring-offset-2 focus:ring-offset-arcane-dark rounded"
            )}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            aria-label={interactive ? `Rate ${i + 1} star${i + 1 > 1 ? 's' : ''}` : undefined}
            role={interactive ? "radio" : undefined}
            aria-checked={interactive ? rating === i + 1 : undefined}
          >
            <Star className={cn(iconSize, "fill-arcane-accent text-arcane-accent")} />
          </motion.button>
        ))}

        {/* Half star (display mode only) */}
        {hasHalfStar && (
          <motion.div
            className="relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: fullStars * 0.05 }}
          >
            <Star className={cn(iconSize, "text-arcane-accent")} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star className={cn(iconSize, "fill-arcane-accent text-arcane-accent")} />
            </div>
          </motion.div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => {
          const starIndex = fullStars + (hasHalfStar ? 1 : 0) + i;
          return (
            <motion.button
              key={`empty-${i}`}
              type="button"
              disabled={!interactive}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
              className={cn(
                "transition-transform",
                interactive && "cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-arcane-accent focus:ring-offset-2 focus:ring-offset-arcane-dark rounded"
              )}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: (fullStars + (hasHalfStar ? 1 : 0) + i) * 0.05 }}
              aria-label={interactive ? `Rate ${starIndex + 1} star${starIndex + 1 > 1 ? 's' : ''}` : undefined}
              role={interactive ? "radio" : undefined}
              aria-checked={interactive ? rating === starIndex + 1 : undefined}
            >
              <Star
                className={cn(
                  iconSize,
                  hoverRating !== null && hoverRating > starIndex
                    ? "fill-arcane-accent text-arcane-accent"
                    : "text-arcane-grey/40"
                )}
              />
            </motion.button>
          );
        })}
      </div>

      {showNumber && (
        <span className="text-sm font-bold text-white ml-1">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
