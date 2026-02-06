"use client";

import { motion } from "framer-motion";
import { MapPin, Star, Award, TrendingUp, DollarSign, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RatingStars } from "./RatingStars";
import { cn } from "@/lib/utils";
import { Coach } from "@/lib/api/coaching";
import Link from "next/link";

export interface CoachCardProps {
  coach: Coach;
  onClick?: () => void;
  featured?: boolean;
  className?: string;
}

/**
 * CoachCard Component
 * Displays coach information in a card format
 * Features:
 * - Coach photo/avatar
 * - Name, title, location
 * - Star rating + review count
 * - Expertise badges (max 3, +N more)
 * - Hourly rate
 * - Featured badge with glow effect
 * - Hover effects
 * - Click to view profile
 */
export function CoachCard({ coach, onClick, featured = false, className }: CoachCardProps) {
  const maxExpertiseBadges = 3;
  const visibleExpertise = coach.coachingType?.slice(0, maxExpertiseBadges) || [];
  const remainingExpertise = (coach.coachingType?.length || 0) - maxExpertiseBadges;

  const location = [coach.city, coach.country].filter(Boolean).join(", ");

  return (
    <Link href={`/coaching/${coach.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={cn("h-full", className)}
      >
        <Card
          className={cn(
            "h-full cursor-pointer overflow-hidden transition-all duration-300",
            "hover:border-arcane-accent/50 hover:shadow-lg",
            featured && "relative border-arcane-accent shadow-[0_0_30px_rgba(228,255,59,0.2)]"
          )}
          onClick={onClick}
        >
          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-arcane-accent text-arcane-dark px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1 shadow-lg">
                <Star className="h-3 w-3 fill-arcane-dark" />
                Featured
              </div>
            </div>
          )}

          <CardContent className="p-0">
            {/* Header with avatar and basic info */}
            <div className="relative p-6 pb-4">
              {/* Background gradient */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-arcane-darkBorder/50 to-transparent" />

              <div className="relative flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div
                    className={cn(
                      "h-16 w-16 rounded-full bg-arcane-darkBorder flex items-center justify-center text-2xl font-bold text-arcane-accent overflow-hidden",
                      featured && "ring-2 ring-arcane-accent ring-offset-2 ring-offset-arcane-dark"
                    )}
                  >
                    {coach.avatar ? (
                      <img
                        src={coach.avatar}
                        alt={coach.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{coach.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {coach.isActive && (
                    <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-arcane-dark rounded-full" />
                  )}
                </div>

                {/* Name and title */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">{coach.name}</h3>
                  <p className="text-sm text-arcane-grey truncate">{coach.title}</p>

                  {/* Location */}
                  {location && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-arcane-grey">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Rating */}
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RatingStars rating={coach.rating} size="sm" />
                  <span className="text-sm text-arcane-grey">
                    ({coach.reviewCount} {coach.reviewCount === 1 ? "review" : "reviews"})
                  </span>
                </div>
              </div>
            </div>

            {/* Bio snippet */}
            {coach.bio && (
              <div className="px-6 pb-4">
                <p className="text-sm text-arcane-grey line-clamp-2">{coach.bio}</p>
              </div>
            )}

            {/* Expertise badges */}
            {visibleExpertise.length > 0 && (
              <div className="px-6 pb-4">
                <div className="flex flex-wrap gap-2">
                  {visibleExpertise.map((expertise, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-arcane-darkBorder rounded-md text-xs font-medium text-arcane-accent"
                    >
                      {expertise}
                    </span>
                  ))}
                  {remainingExpertise > 0 && (
                    <span className="px-2 py-1 bg-arcane-darkBorder rounded-md text-xs font-medium text-arcane-grey">
                      +{remainingExpertise} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats row */}
            <div className="px-6 pb-4 grid grid-cols-3 gap-2 text-xs">
              {/* Years of experience */}
              <div className="flex items-center gap-1 text-arcane-grey">
                <Award className="h-3 w-3" />
                <span>{coach.yearsExperience}y exp</span>
              </div>

              {/* Total sessions */}
              <div className="flex items-center gap-1 text-arcane-grey">
                <TrendingUp className="h-3 w-3" />
                <span>{coach.totalSessions} sessions</span>
              </div>

              {/* Remote work */}
              {coach.canWorkRemote && (
                <div className="flex items-center gap-1 text-arcane-accent">
                  <Globe className="h-3 w-3" />
                  <span>Remote</span>
                </div>
              )}
            </div>

            {/* Footer with price and CTA */}
            <div className="px-6 pb-6 pt-4 border-t border-arcane-darkBorder/50 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-arcane-accent" />
                <span className="text-lg font-bold text-white">${coach.hourlyRate}</span>
                <span className="text-sm text-arcane-grey">/hour</span>
              </div>

              <Button
                size="sm"
                variant="primary"
                className="uppercase"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClick?.();
                }}
              >
                Book Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}

/**
 * CoachCard Skeleton for loading states
 */
export function CoachCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-0">
        <div className="p-6 pb-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-arcane-darkBorder animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 bg-arcane-darkBorder rounded animate-pulse w-3/4" />
              <div className="h-4 bg-arcane-darkBorder rounded animate-pulse w-1/2" />
              <div className="h-3 bg-arcane-darkBorder rounded animate-pulse w-2/3" />
            </div>
          </div>
          <div className="mt-3 h-4 bg-arcane-darkBorder rounded animate-pulse w-1/3" />
        </div>
        <div className="px-6 pb-4">
          <div className="h-8 bg-arcane-darkBorder rounded animate-pulse" />
        </div>
        <div className="px-6 pb-4 flex gap-2">
          <div className="h-6 bg-arcane-darkBorder rounded animate-pulse w-16" />
          <div className="h-6 bg-arcane-darkBorder rounded animate-pulse w-16" />
          <div className="h-6 bg-arcane-darkBorder rounded animate-pulse w-16" />
        </div>
        <div className="px-6 pb-6 pt-4 border-t border-arcane-darkBorder/50 flex items-center justify-between">
          <div className="h-6 bg-arcane-darkBorder rounded animate-pulse w-20" />
          <div className="h-9 bg-arcane-darkBorder rounded animate-pulse w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
