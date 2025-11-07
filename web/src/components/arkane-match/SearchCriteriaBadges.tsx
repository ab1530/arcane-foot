"use client";

import { motion } from "framer-motion";
import { Trophy, Target, DollarSign, MapPin, Star, CheckCircle, Globe } from "lucide-react";
import { SearchCriteria } from "@/types/arkane-match";

interface SearchCriteriaBadgesProps {
  criteria: SearchCriteria;
  onRemoveCriteria?: (category: string, value: string) => void;
}

/**
 * SearchCriteriaBadges Component
 * Displays extracted search criteria as colored badges
 */
export function SearchCriteriaBadges({ criteria, onRemoveCriteria }: SearchCriteriaBadgesProps) {
  const hasCriteria = Object.values(criteria).some((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null;
  });

  if (!hasCriteria) return null;

  const renderBadge = (
    icon: React.ReactNode,
    label: string,
    value: string,
    color: string,
    category: string
  ) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-full ${color} border backdrop-blur-sm text-xs font-semibold`}
    >
      {icon}
      <span>{label}: {value}</span>
      {onRemoveCriteria && (
        <button
          onClick={() => onRemoveCriteria(category, value)}
          className="ml-1 hover:scale-125 transition-transform"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-3 p-3 rounded-lg bg-arcane-dark/50 border border-arcane-darkBorder/50"
    >
      {/* Label */}
      <p className="text-xs text-arcane-grey font-semibold uppercase tracking-wider mb-2">
        Extracted Criteria:
      </p>

      {/* Badges Grid */}
      <div className="flex flex-wrap gap-2">
        {/* Leagues */}
        {criteria.leagues?.map((league) =>
          renderBadge(
            <Trophy className="h-3 w-3" />,
            "League",
            league,
            "bg-blue-500/10 border-blue-500/30 text-blue-400",
            "leagues"
          )
        )}

        {/* Positions */}
        {criteria.positions?.map((position) =>
          renderBadge(
            <Target className="h-3 w-3" />,
            "Position",
            position,
            "bg-green-500/10 border-green-500/30 text-green-400",
            "positions"
          )
        )}

        {/* Countries */}
        {criteria.countries?.map((country) =>
          renderBadge(
            <MapPin className="h-3 w-3" />,
            "Country",
            country,
            "bg-purple-500/10 border-purple-500/30 text-purple-400",
            "countries"
          )
        )}

        {/* Languages */}
        {criteria.languages?.map((language) =>
          renderBadge(
            <Globe className="h-3 w-3" />,
            "Language",
            language,
            "bg-orange-500/10 border-orange-500/30 text-orange-400",
            "languages"
          )
        )}

        {/* Max Budget */}
        {criteria.maxBudget !== undefined && criteria.maxBudget > 0 &&
          renderBadge(
            <DollarSign className="h-3 w-3" />,
            "Budget",
            `< €${criteria.maxBudget}/hr`,
            "bg-yellow-500/10 border-yellow-500/30 text-yellow-400",
            "maxBudget"
          )
        }

        {/* Min Rating */}
        {criteria.minRating !== undefined && criteria.minRating > 0 &&
          renderBadge(
            <Star className="h-3 w-3" />,
            "Min Rating",
            `${criteria.minRating}+`,
            "bg-amber-500/10 border-amber-500/30 text-amber-400",
            "minRating"
          )
        }

        {/* Verified Only */}
        {criteria.verifiedOnly &&
          renderBadge(
            <CheckCircle className="h-3 w-3" />,
            "Filter",
            "Verified Only",
            "bg-arcane-accent/10 border-arcane-accent/30 text-arcane-accent",
            "verifiedOnly"
          )
        }
      </div>
    </motion.div>
  );
}
