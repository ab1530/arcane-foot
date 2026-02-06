"use client";

import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "./RatingStars";
import { Review } from "@/lib/api/coaching";

export interface ReviewCardProps {
  review: Review;
  className?: string;
}

/**
 * ReviewCard Component
 * Displays a single coach review
 * Features:
 * - User avatar and name
 * - Star rating
 * - Relative date (e.g., "2 days ago")
 * - Review comment
 * - Smooth animations
 */
export function ReviewCard({ review, className }: ReviewCardProps) {
  const userName = review.user
    ? `${review.user.firstName} ${review.user.lastName}`
    : "Anonymous";

  const userInitial = review.user?.firstName?.charAt(0).toUpperCase() || "A";

  const relativeDate = formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-arcane-darkBorder flex items-center justify-center text-lg font-bold text-arcane-accent overflow-hidden">
                {review.user?.avatar ? (
                  <img
                    src={review.user.avatar}
                    alt={userName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h4 className="text-base font-bold text-white">{userName}</h4>
                  <p className="text-xs text-arcane-grey">{relativeDate}</p>
                </div>
                <RatingStars rating={review.rating} size="sm" />
              </div>

              {/* Comment */}
              {review.comment && (
                <p className="text-sm text-arcane-grey leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * ReviewCard Skeleton for loading states
 */
export function ReviewCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-arcane-darkBorder animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="h-5 bg-arcane-darkBorder rounded animate-pulse w-32" />
                <div className="h-3 bg-arcane-darkBorder rounded animate-pulse w-20" />
              </div>
              <div className="h-4 bg-arcane-darkBorder rounded animate-pulse w-24" />
            </div>
            <div className="space-y-1">
              <div className="h-4 bg-arcane-darkBorder rounded animate-pulse w-full" />
              <div className="h-4 bg-arcane-darkBorder rounded animate-pulse w-5/6" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
