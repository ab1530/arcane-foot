"use client";

import { GlassCard } from "@/components/ui/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * ScoutCardSkeleton Component
 * Loading skeleton for scout profile cards
 */
export function ScoutCardSkeleton() {
  return (
    <GlassCard variant="elevated" className="h-full">
      <div className="space-y-4">
        {/* Avatar */}
        <div className="flex items-start gap-4">
          <Skeleton variant="circular" width={64} height={64} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="80%" height={16} />
          </div>
        </div>

        {/* Expertise badges */}
        <div className="flex flex-wrap gap-2">
          <Skeleton variant="rectangular" width={80} height={24} className="rounded-full" />
          <Skeleton variant="rectangular" width={70} height={24} className="rounded-full" />
          <Skeleton variant="rectangular" width={90} height={24} className="rounded-full" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-arcane-darkBorder/50">
          <div className="space-y-1">
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="60%" height={12} />
          </div>
          <div className="space-y-1">
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="60%" height={12} />
          </div>
          <div className="space-y-1">
            <Skeleton variant="text" width="100%" height={16} />
            <Skeleton variant="text" width="60%" height={12} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-arcane-darkBorder/50">
          <Skeleton variant="rectangular" width={40} height={40} className="rounded-lg" />
          <Skeleton variant="rectangular" className="flex-1 rounded-lg" height={40} />
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * ScoutCardSkeletonGrid Component
 * Grid of loading skeletons
 */
export function ScoutCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ScoutCardSkeleton key={i} />
      ))}
    </div>
  );
}
