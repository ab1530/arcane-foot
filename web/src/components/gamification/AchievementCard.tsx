'use client';

import React from 'react';
import { Lock, CheckCircle2, Star, TrendingUp } from 'lucide-react';
import { ArcaneCard } from '@/components/primitives/Card/ArcaneCard';
import { CardContent } from '@/components/primitives/Card/CardContent';
import { Text } from '@/components/primitives/Typography/Text';
import { Badge } from '@/components/primitives/Badge/Badge';
import { cn } from '@/lib/utils';
import { Achievement, getRarityColor, getRarityLabel } from '@/lib/api/gamification';
import { motion } from 'framer-motion';

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: () => void;
  variant?: 'default' | 'compact';
  showProgress?: boolean;
  animate?: boolean;
}

/**
 * AchievementCard - Display achievement with progress, rarity, and status
 *
 * Features:
 * - Locked/unlocked states
 * - Progress tracking
 * - Rarity indicators
 * - XP rewards
 * - Hover animations
 * - Click interactions
 */
export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onClick,
  variant = 'default',
  showProgress = true,
  animate = true,
}) => {
  const rarityColor = getRarityColor(achievement.rarity);
  const rarityLabel = getRarityLabel(achievement.rarity);
  const isUnlocked = !achievement.isLocked;
  const hasProgress = achievement.progress && achievement.progress.total > 0;
  const progressPercentage = hasProgress
    ? (achievement.progress!.current / achievement.progress!.total) * 100
    : 0;

  const cardContent = (
    <ArcaneCard
      variant="standard"
      hover={!!onClick}
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        !isUnlocked && 'opacity-60',
        onClick && 'cursor-pointer',
        variant === 'compact' && 'p-3'
      )}
      onClick={onClick}
      style={{
        borderColor: isUnlocked ? `${rarityColor}20` : undefined,
      }}
    >
      {/* Rarity border overlay */}
      {isUnlocked && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${rarityColor}15 0%, transparent 70%)`,
          }}
        />
      )}

      <CardContent className={cn('relative', variant === 'compact' ? 'p-3' : 'p-4')}>
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 rounded-lg flex items-center justify-center relative',
              variant === 'compact' ? 'h-12 w-12' : 'h-16 w-16',
              isUnlocked ? 'bg-arcane-anthracite' : 'bg-arcane-slate/30'
            )}
            style={{
              borderWidth: 2,
              borderColor: isUnlocked ? rarityColor : 'transparent',
              boxShadow: isUnlocked ? `0 0 20px ${rarityColor}20` : undefined,
            }}
          >
            <span className={cn('text-2xl', !isUnlocked && 'grayscale opacity-50')}>
              {achievement.icon}
            </span>

            {/* Lock overlay for locked achievements */}
            {!isUnlocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-arcane-black/50 rounded-lg">
                <Lock className="h-6 w-6 text-arcane-gray-400" />
              </div>
            )}

            {/* Checkmark for unlocked */}
            {isUnlocked && (
              <div className="absolute -top-1 -right-1">
                <CheckCircle2
                  className="h-5 w-5 text-success"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.5))' }}
                />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <Text
                  size={variant === 'compact' ? 'sm' : 'md'}
                  weight="semibold"
                  className={cn('mb-1 truncate', !isUnlocked && 'text-arcane-gray-400')}
                >
                  {achievement.title}
                </Text>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={isUnlocked ? 'premium' : 'info'}
                    size="sm"
                    style={{
                      backgroundColor: isUnlocked ? `${rarityColor}20` : undefined,
                      color: isUnlocked ? rarityColor : undefined,
                      borderColor: isUnlocked ? `${rarityColor}30` : undefined,
                    }}
                  >
                    {rarityLabel}
                  </Badge>
                  {achievement.category && (
                    <Badge variant="info" size="sm">
                      {achievement.category}
                    </Badge>
                  )}
                </div>
              </div>

              {/* XP Reward */}
              <div
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md',
                  'bg-arcane-yellow/10 border border-arcane-yellow/20'
                )}
              >
                <Star className="h-3 w-3 text-arcane-yellow fill-arcane-yellow" />
                <Text size="xs" weight="semibold" className="text-arcane-yellow">
                  +{achievement.xpReward}
                </Text>
              </div>
            </div>

            {/* Description */}
            <Text
              size="xs"
              color="secondary"
              className={cn('mb-3 line-clamp-2', variant === 'compact' && 'mb-2')}
            >
              {achievement.description}
            </Text>

            {/* Progress Bar */}
            {showProgress && hasProgress && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Text size="xs" color="tertiary">
                    Progress
                  </Text>
                  <Text size="xs" weight="semibold" color="secondary">
                    {achievement.progress!.current} / {achievement.progress!.total}
                  </Text>
                </div>
                <div className="h-2 bg-arcane-slate/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isUnlocked
                        ? `linear-gradient(90deg, ${rarityColor}, ${rarityColor}dd)`
                        : 'linear-gradient(90deg, #71717A, #52525B)',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Unlock date */}
            {isUnlocked && achievement.unlockedAt && (
              <Text size="xs" color="tertiary" className="mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
              </Text>
            )}

            {/* Requirements for locked */}
            {!isUnlocked && achievement.requirements && (
              <Text size="xs" color="tertiary" className="mt-2 flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {achievement.requirements}
              </Text>
            )}

            {/* Earned by count */}
            {achievement.earnedBy && achievement.earnedBy > 0 && (
              <Text size="xs" color="tertiary" className="mt-2 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {achievement.earnedBy.toLocaleString()} scouts earned this
              </Text>
            )}
          </div>
        </div>
      </CardContent>
    </ArcaneCard>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={onClick ? { scale: 1.02 } : undefined}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

AchievementCard.displayName = 'AchievementCard';
