/**
 * ReviewCard Component
 * Single review display
 */

"use client";

import React from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { Review } from "@/types/marketplace";

interface ReviewCardProps {
  review: Review;
  className?: string;
}

export function ReviewCard({ review, className }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={cn(
            "text-lg",
            i <= rating ? "text-yellow-400" : "text-gray-600"
          )}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const getRelativeTime = (date: Date) => {
    try {
      const now = new Date();
      const reviewDate = new Date(date);
      const diffMs = now.getTime() - reviewDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return "Recently";
    }
  };

  return (
    <GlassCard variant="bordered" className={cn("", className)}>
      <div className="flex items-start gap-4">
        {/* Club Logo */}
        <div className="flex-shrink-0">
          {review.clubs.logo ? (
            <img
              src={review.clubs.logo}
              alt={review.clubs.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-arcane-accent/30"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-arcane-darkBorder flex items-center justify-center border-2 border-arcane-grey/30">
              <span className="text-lg font-bold text-arcane-grey">
                {review.clubs.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Review Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-white font-semibold">{review.clubs.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center">{renderStars(review.rating)}</div>
                {review.isVerified && (
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
            <div className="text-xs text-arcane-grey">
              {getRelativeTime(review.reviewedAt)}
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-arcane-grey text-sm mb-3 leading-relaxed">
              {review.comment}
            </p>
          )}

          {/* Tags */}
          {review.tags && review.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {review.tags.map((tag, index) => (
                <span
                  key={index}
                  className="text-xs bg-arcane-accent/10 text-arcane-accent px-2 py-1 rounded-full border border-arcane-accent/20"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
