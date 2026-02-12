"use client";

import { motion } from "framer-motion";
import { Eye, Star, BadgeCheck } from "lucide-react";
import { ScoutListing } from "@/types/marketplace";
import { Button } from "@/components/ui/button";

interface ScoutCardMiniProps {
  scout: ScoutListing;
  onClick?: () => void;
}

/**
 * ScoutCardMini Component
 * Compact scout card for chat display
 */
export function ScoutCardMini({ scout, onClick }: ScoutCardMiniProps) {
  const getInitials = () => {
    const first = scout.users.firstName?.charAt(0) || "";
    const last = scout.users.lastName?.charAt(0) || "";
    return `${first}${last}`.toUpperCase();
  };

  const formatRate = () => {
    const currency = scout.currency || "EUR";
    const rate = scout.hourlyRate || 0;
    return `${rate}${currency === "EUR" ? "€" : "$"}/hr`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden bg-arcane-darkCard backdrop-blur-md border border-arcane-darkBorder hover:border-arcane-accent/50 rounded-lg p-4 cursor-pointer transition-all duration-300"
      onClick={onClick}
    >
      {/* Background Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-arcane-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-arcane-accent/30 to-arcane-accent/10 border-2 border-arcane-accent/30 flex items-center justify-center overflow-hidden">
            {scout.users.avatar ? (
              <img
                src={scout.users.avatar}
                alt={`${scout.users.firstName} ${scout.users.lastName}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-arcane-accent font-black text-sm">
                {getInitials()}
              </span>
            )}
          </div>
          {/* Verified Badge */}
          {scout.isVerified && (
            <div className="absolute -top-1 -right-1">
              <BadgeCheck className="h-4 w-4 text-arcane-accent fill-arcane-accent drop-shadow-[0_0_4px_rgba(228,255,59,0.5)]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h4 className="text-sm font-bold text-white group-hover:text-arcane-accent transition-colors truncate">
            {scout.users.firstName} {scout.users.lastName}
          </h4>

          {/* Headline */}
          <p className="text-xs text-arcane-grey line-clamp-1 mt-0.5">
            {scout.headline}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-white">
                {scout.stats.avgRating?.toFixed(1) || "N/A"}
              </span>
              <span className="text-xs text-arcane-grey">
                ({scout.stats.totalReviews})
              </span>
            </div>

            {/* Rate */}
            {scout.hourlyRate && (
              <div className="flex items-center gap-1">
                <span className="text-xs font-semibold text-green-400">
                  {formatRate()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* View Button */}
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </div>

      {/* Expertise Tags (if space allows) */}
      {scout.expertise.leagues.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1 mt-3 pt-3 border-t border-arcane-darkBorder/50">
          {scout.expertise.leagues.slice(0, 3).map((league, index) => (
            <span
              key={index}
              className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold"
            >
              {league}
            </span>
          ))}
          {scout.expertise.leagues.length > 3 && (
            <span className="px-2 py-0.5 rounded-full bg-arcane-darkBorder text-arcane-grey text-xs">
              +{scout.expertise.leagues.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
