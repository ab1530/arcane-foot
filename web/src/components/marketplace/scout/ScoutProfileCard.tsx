"use client";

import { motion } from "framer-motion";
import { Heart, BadgeCheck, Eye, DollarSign, FileText } from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { StarRating } from "../shared/StarRating";
import { ExpertiseBadge } from "../shared/Badge";
import { useState } from "react";

export interface ScoutListing {
  id: string;
  headline: string;
  expertise: {
    leagues: string[];
    positions: string[];
  };
  hourlyRate?: number;
  currency?: string;
  stats: {
    avgRating?: number;
    totalReviews: number;
  };
  isVerified: boolean;
  users: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface ScoutProfileCardProps {
  listing: ScoutListing;
  onFavoriteToggle?: (id: string) => void;
  onClick?: () => void;
  isFavorite?: boolean;
}

/**
 * ScoutProfileCard Component
 * Displays a scout listing card with all key information
 * Features: Avatar, name, headline, expertise badges, stats, verified badge, actions
 */
export function ScoutProfileCard({
  listing,
  onFavoriteToggle,
  onClick,
  isFavorite = false
}: ScoutProfileCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavoriteState, setIsFavoriteState] = useState(isFavorite);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavoriteState(!isFavoriteState);
    if (onFavoriteToggle) {
      onFavoriteToggle(listing.id);
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Get initials for avatar
  const getInitials = () => {
    const first = listing.users.firstName?.charAt(0) || "";
    const last = listing.users.lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase();
  };

  // Format currency
  const formatRate = () => {
    const currency = listing.currency || "EUR";
    const rate = listing.hourlyRate || 0;
    return `${rate}${currency === "EUR" ? "€" : "$"}/hr`;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      transition={{ duration: 0.2 }}
    >
      <GlassCard
        variant="elevated"
        glowOnHover
        className="cursor-pointer h-full relative group"
        onClick={handleCardClick}
      >
        {/* Verified Badge - Top Right */}
        {listing.isVerified && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="absolute top-4 right-4 z-10"
          >
            <div className="relative">
              <BadgeCheck className="h-6 w-6 text-arcane-accent fill-arcane-accent drop-shadow-[0_0_8px_rgba(228,255,59,0.5)]" />
              <div className="absolute -inset-1 bg-arcane-accent/20 rounded-full blur-sm -z-10" />
            </div>
          </motion.div>
        )}

        {/* Favorite Button - Top Left */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 left-4 z-10 p-2 rounded-full bg-arcane-dark/80 backdrop-blur-sm border border-arcane-darkBorder/50 hover:border-arcane-accent/50 transition-all group/btn"
          aria-label={isFavoriteState ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`h-5 w-5 transition-all group-hover/btn:scale-110 ${
              isFavoriteState
                ? "text-red-500 fill-red-500"
                : "text-arcane-grey"
            }`}
          />
        </button>

        <div className="space-y-4">
          {/* Header: Avatar + Name + Headline */}
          <div className="flex items-start gap-4 pt-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-arcane-accent/30 to-arcane-accent/10 border-2 border-arcane-accent/30 flex items-center justify-center overflow-hidden">
                {listing.users.avatar ? (
                  <img
                    src={listing.users.avatar}
                    alt={`${listing.users.firstName} ${listing.users.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-arcane-accent font-black text-xl">
                    {getInitials()}
                  </span>
                )}
              </div>
              {/* Animated ring on hover */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-arcane-accent"
                initial={{ scale: 1, opacity: 0 }}
                animate={isHovered ? { scale: 1.2, opacity: [0, 0.5, 0] } : { scale: 1, opacity: 0 }}
                transition={{ duration: 1, repeat: isHovered ? Infinity : 0 }}
              />
            </div>

            {/* Name + Headline */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-black text-white group-hover:text-arcane-accent transition-colors uppercase truncate">
                {listing.users.firstName} {listing.users.lastName}
              </h3>
              <p className="text-sm text-arcane-grey mt-1 line-clamp-2">
                {listing.headline}
              </p>
            </div>
          </div>

          {/* Expertise Badges */}
          <div className="space-y-2">
            {listing.expertise.leagues.length > 0 && (
              <div>
                <span className="text-xs text-arcane-grey uppercase font-bold tracking-wider mb-1.5 block">
                  Leagues
                </span>
                <ExpertiseBadge
                  items={listing.expertise.leagues}
                  maxVisible={3}
                  variant="league"
                />
              </div>
            )}
            {listing.expertise.positions.length > 0 && (
              <div>
                <span className="text-xs text-arcane-grey uppercase font-bold tracking-wider mb-1.5 block">
                  Positions
                </span>
                <ExpertiseBadge
                  items={listing.expertise.positions}
                  maxVisible={3}
                  variant="position"
                />
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-arcane-darkBorder/50">
            {/* Rating */}
            <div className="text-center">
              <div className="flex justify-center mb-1">
                <StarRating rating={listing.stats.avgRating || 0} size="sm" />
              </div>
              <p className="text-xs text-arcane-grey">Rating</p>
            </div>

            {/* Reviews */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <FileText className="h-4 w-4 text-arcane-accent" />
                <span className="text-sm font-bold text-white">
                  {listing.stats.totalReviews}
                </span>
              </div>
              <p className="text-xs text-arcane-grey">Reviews</p>
            </div>

            {/* Rate */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm font-bold text-white">
                  {listing.hourlyRate || "N/A"}
                </span>
              </div>
              <p className="text-xs text-arcane-grey">
                {listing.hourlyRate ? `${listing.currency || "EUR"}/hr` : "Rate"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-3 border-t border-arcane-darkBorder/50">
            <Button
              variant="primary"
              size="sm"
              className="flex-1 group/btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
            >
              <Eye className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
              View Profile
            </Button>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-arcane-accent/5 to-transparent opacity-0 pointer-events-none"
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </GlassCard>
    </motion.div>
  );
}
