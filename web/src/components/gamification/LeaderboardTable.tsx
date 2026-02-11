'use client';

import React from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Medal, Award, Crown } from 'lucide-react';
import { ArcaneCard } from '@/components/primitives/Card/ArcaneCard';
import { CardContent } from '@/components/primitives/Card/CardContent';
import { Text } from '@/components/primitives/Typography/Text';
import { Skeleton } from '@/components/composite/Progress/Skeleton';
import { Badge } from '@/components/primitives/Badge/Badge';
import { cn } from '@/lib/utils';
import { LeaderboardEntry, formatNumber } from '@/lib/api/gamification';
import { motion } from 'framer-motion';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  loading?: boolean;
  onUserClick?: (userId: string) => void;
  showTop3Podium?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
}

/**
 * LeaderboardTable - Display ranked users with stats
 *
 * Features:
 * - Top 3 podium display
 * - Current user highlight
 * - Rank change indicators
 * - Medal icons for top ranks
 * - Click to view profile
 * - Loading skeletons
 * - Pagination support
 */
export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  currentUserId,
  loading = false,
  onUserClick,
  showTop3Podium = true,
  itemsPerPage = 50,
  currentPage = 1,
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} type="custom" height="64px" />
        ))}
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <ArcaneCard variant="standard">
        <CardContent className="p-12 text-center">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-arcane-gray-500 opacity-50" />
          <Text color="secondary">No leaderboard data available</Text>
        </CardContent>
      </ArcaneCard>
    );
  }

  const top3 = showTop3Podium ? entries.slice(0, 3) : [];
  const remainingEntries = showTop3Podium ? entries.slice(3) : entries;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-400 fill-yellow-400" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400 fill-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-600 fill-orange-600" />;
    return null;
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'same', change?: number) => {
    if (!trend || trend === 'same') return <Minus className="h-4 w-4 text-arcane-gray-500" />;
    if (trend === 'up')
      return (
        <div className="flex items-center gap-1 text-success">
          <TrendingUp className="h-4 w-4" />
          {change && <Text size="xs">+{change}</Text>}
        </div>
      );
    return (
      <div className="flex items-center gap-1 text-error">
        <TrendingDown className="h-4 w-4" />
        {change && <Text size="xs">-{change}</Text>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Podium */}
      {showTop3Podium && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {/* 2nd Place */}
          {top3[1] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <ArcaneCard
                variant="standard"
                hover
                className={cn(
                  'w-full cursor-pointer',
                  'border-2 border-gray-400/30 bg-gradient-to-br from-gray-500/10 to-transparent'
                )}
                onClick={() => onUserClick?.(top3[1].userId)}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <Medal className="h-12 w-12 text-gray-400 fill-gray-400" />
                  </div>
                  <div className="h-16 w-16 rounded-full bg-arcane-slate mx-auto mb-3 overflow-hidden">
                    {top3[1].avatar ? (
                      <img
                        src={top3[1].avatar}
                        alt={top3[1].name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-arcane-yellow">
                        {top3[1].name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <Text size="sm" weight="bold" className="mb-1 truncate">
                    {top3[1].name}
                  </Text>
                  <Badge variant="info" size="sm" className="mb-2">
                    Level {top3[1].level}
                  </Badge>
                  <Text size="lg" weight="bold" className="text-arcane-yellow">
                    {formatNumber(top3[1].xp)} XP
                  </Text>
                  <Text size="xs" color="tertiary">
                    {top3[1].achievementCount} achievements
                  </Text>
                </CardContent>
              </ArcaneCard>
            </motion.div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
              className="flex flex-col items-center -mt-4"
            >
              <ArcaneCard
                variant="feature"
                hover
                glow
                className={cn(
                  'w-full cursor-pointer',
                  'border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/20 to-orange-500/10',
                  'shadow-glow-yellow'
                )}
                onClick={() => onUserClick?.(top3[0].userId)}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <Crown className="h-16 w-16 text-yellow-400 fill-yellow-400 animate-pulse" />
                  </div>
                  <div className="h-20 w-20 rounded-full bg-arcane-slate mx-auto mb-3 overflow-hidden border-2 border-yellow-500">
                    {top3[0].avatar ? (
                      <img
                        src={top3[0].avatar}
                        alt={top3[0].name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-arcane-yellow">
                        {top3[0].name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <Text size="md" weight="bold" className="mb-1 truncate">
                    {top3[0].name}
                  </Text>
                  <Badge variant="premium" size="sm" className="mb-2">
                    Level {top3[0].level}
                  </Badge>
                  <Text size="xl" weight="bold" className="text-arcane-yellow">
                    {formatNumber(top3[0].xp)} XP
                  </Text>
                  <Text size="xs" color="tertiary">
                    {top3[0].achievementCount} achievements
                  </Text>
                </CardContent>
              </ArcaneCard>
            </motion.div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <ArcaneCard
                variant="standard"
                hover
                className={cn(
                  'w-full cursor-pointer',
                  'border-2 border-orange-600/30 bg-gradient-to-br from-orange-600/10 to-transparent'
                )}
                onClick={() => onUserClick?.(top3[2].userId)}
              >
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-3">
                    <Award className="h-12 w-12 text-orange-600 fill-orange-600" />
                  </div>
                  <div className="h-16 w-16 rounded-full bg-arcane-slate mx-auto mb-3 overflow-hidden">
                    {top3[2].avatar ? (
                      <img
                        src={top3[2].avatar}
                        alt={top3[2].name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-arcane-yellow">
                        {top3[2].name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <Text size="sm" weight="bold" className="mb-1 truncate">
                    {top3[2].name}
                  </Text>
                  <Badge variant="warning" size="sm" className="mb-2">
                    Level {top3[2].level}
                  </Badge>
                  <Text size="lg" weight="bold" className="text-arcane-yellow">
                    {formatNumber(top3[2].xp)} XP
                  </Text>
                  <Text size="xs" color="tertiary">
                    {top3[2].achievementCount} achievements
                  </Text>
                </CardContent>
              </ArcaneCard>
            </motion.div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="space-y-2">
        {remainingEntries.map((entry, index) => {
          const isCurrentUser = entry.userId === currentUserId;
          const displayRank = showTop3Podium ? entry.rank : entry.rank;

          return (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <ArcaneCard
                variant="standard"
                hover={!!onUserClick}
                className={cn(
                  'transition-all duration-200',
                  isCurrentUser && 'border-arcane-yellow/50 bg-arcane-yellow/5',
                  onUserClick && 'cursor-pointer'
                )}
                onClick={() => onUserClick?.(entry.userId)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {displayRank <= 3 ? (
                        getRankIcon(displayRank)
                      ) : (
                        <Text size="lg" weight="bold" color="secondary">
                          {displayRank}
                        </Text>
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="h-12 w-12 rounded-full bg-arcane-slate overflow-hidden flex-shrink-0">
                      {entry.avatar ? (
                        <img src={entry.avatar} alt={entry.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xl font-bold text-arcane-yellow">
                          {entry.name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Name & Level */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Text size="sm" weight="semibold" className="truncate">
                          {entry.name}
                        </Text>
                        {isCurrentUser && (
                          <Badge variant="premium" size="sm">
                            YOU
                          </Badge>
                        )}
                      </div>
                      <Text size="xs" color="tertiary">
                        Level {entry.level}
                      </Text>
                    </div>

                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6">
                      <div className="text-right">
                        <Text size="sm" weight="bold" className="text-arcane-yellow">
                          {formatNumber(entry.xp)}
                        </Text>
                        <Text size="xs" color="tertiary">
                          XP
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text size="sm" weight="semibold">
                          {entry.achievementCount}
                        </Text>
                        <Text size="xs" color="tertiary">
                          Achievements
                        </Text>
                      </div>
                    </div>

                    {/* Trend */}
                    <div className="flex-shrink-0 w-16 flex justify-center">
                      {getTrendIcon(entry.trend, entry.trendChange)}
                    </div>
                  </div>
                </CardContent>
              </ArcaneCard>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

LeaderboardTable.displayName = 'LeaderboardTable';
