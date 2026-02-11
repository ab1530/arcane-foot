/**
 * ScoutStats Component
 * Display scout statistics in cards
 */

"use client";

import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

interface ScoutStatsProps {
  avgRating?: number;
  totalReviews: number;
  completionRate: number;
  className?: string;
}

export function ScoutStats({
  avgRating,
  totalReviews,
  completionRate,
  className,
}: ScoutStatsProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={cn(
            "text-xl",
            i <= Math.round(rating) ? "text-yellow-400" : "text-gray-600"
          )}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>
      {/* Average Rating */}
      <GlassCard variant="bordered" noPadding className="p-4">
        <div className="flex flex-col items-center justify-center">
          <div className="text-sm text-arcane-grey mb-2">Average Rating</div>
          {avgRating !== undefined && avgRating > 0 ? (
            <>
              <div className="flex items-center gap-1 mb-1">
                {renderStars(avgRating)}
              </div>
              <div className="text-2xl font-bold text-white">
                {avgRating.toFixed(1)}
              </div>
            </>
          ) : (
            <div className="text-lg text-arcane-grey">No ratings yet</div>
          )}
        </div>
      </GlassCard>

      {/* Total Reviews */}
      <GlassCard variant="bordered" noPadding className="p-4">
        <div className="flex flex-col items-center justify-center">
          <div className="text-sm text-arcane-grey mb-2">Total Reviews</div>
          <div className="text-3xl font-bold text-arcane-accent">
            {totalReviews}
          </div>
          <div className="text-xs text-arcane-grey mt-1">
            {totalReviews === 1 ? "review" : "reviews"}
          </div>
        </div>
      </GlassCard>

      {/* Completion Rate */}
      <GlassCard variant="bordered" noPadding className="p-4">
        <div className="flex flex-col items-center justify-center">
          <div className="text-sm text-arcane-grey mb-2">Completion Rate</div>
          <div className="text-3xl font-bold text-green-400">
            {completionRate}%
          </div>
          <div className="text-xs text-arcane-grey mt-1">success rate</div>
        </div>
      </GlassCard>
    </div>
  );
}
