"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  className?: string;
}

/**
 * StarRating Component
 * Displays a star rating with full, half, and empty stars
 * @param rating - The rating value (e.g., 4.5)
 * @param maxRating - Maximum rating (default: 5)
 * @param size - Size of stars: sm, md, lg
 * @param showNumber - Whether to display the numeric rating
 */
export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showNumber = false,
  className = ""
}: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const iconSize = sizeClasses[size];

  // Calculate filled stars
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <div className="flex items-center gap-0.5">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <motion.div
            key={`full-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <Star className={`${iconSize} fill-yellow-400 text-yellow-400`} />
          </motion.div>
        ))}

        {/* Half star */}
        {hasHalfStar && (
          <motion.div
            className="relative"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: fullStars * 0.05 }}
          >
            <Star className={`${iconSize} text-yellow-400`} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
              <Star className={`${iconSize} fill-yellow-400 text-yellow-400`} />
            </div>
          </motion.div>
        )}

        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <motion.div
            key={`empty-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: (fullStars + (hasHalfStar ? 1 : 0) + i) * 0.05 }}
          >
            <Star className={`${iconSize} text-arcane-grey/40`} />
          </motion.div>
        ))}
      </div>

      {showNumber && (
        <span className="text-sm font-bold text-white ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
