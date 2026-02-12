/**
 * RatingDistribution Component
 * Bar chart showing rating breakdown
 */

"use client";

import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface RatingDistributionProps {
  distribution: Record<string, number>;
  totalReviews: number;
  className?: string;
}

export function RatingDistribution({
  distribution,
  totalReviews,
  className,
}: RatingDistributionProps) {
  const ratings = [5, 4, 3, 2, 1];

  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  const getBarColor = (rating: number) => {
    if (rating === 5) return "bg-green-500";
    if (rating === 4) return "bg-blue-500";
    if (rating === 3) return "bg-yellow-500";
    if (rating === 2) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <GlassCard variant="bordered" className={className}>
      <h3 className="text-lg font-bold text-white mb-4">Rating Distribution</h3>

      <div className="space-y-3">
        {ratings.map((rating) => {
          const count = distribution[rating.toString()] || 0;
          const percentage = getPercentage(count);

          return (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-sm text-white font-medium">{rating}</span>
                <span className="text-yellow-400">★</span>
              </div>

              <div className="flex-1 h-4 bg-arcane-dark rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    getBarColor(rating)
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="text-sm text-arcane-grey w-12 text-right">
                {count}
              </div>
            </div>
          );
        })}
      </div>

      {totalReviews === 0 && (
        <div className="text-center text-arcane-grey py-4">
          No reviews yet
        </div>
      )}
    </GlassCard>
  );
}
