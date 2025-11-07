/**
 * ReviewList Component
 * List of reviews with pagination
 */

"use client";

import React, { useState } from "react";
import { ReviewCard } from "./ReviewCard";
import { Review } from "@/types/marketplace";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReviewListProps {
  reviews: Review[];
  className?: string;
  itemsPerPage?: number;
}

export function ReviewList({
  reviews,
  className,
  itemsPerPage = 5,
}: ReviewListProps) {
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);

  const visibleReviews = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  const loadMore = () => {
    setVisibleCount((prev) => Math.min(prev + itemsPerPage, reviews.length));
  };

  if (reviews.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="text-arcane-grey text-lg">No reviews yet</div>
        <p className="text-arcane-grey text-sm mt-2">
          Be the first to work with this scout and leave a review
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {visibleReviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore}>
            Load More Reviews ({reviews.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      {!hasMore && reviews.length > itemsPerPage && (
        <div className="text-center text-arcane-grey text-sm pt-2">
          Showing all {reviews.length} reviews
        </div>
      )}
    </div>
  );
}
