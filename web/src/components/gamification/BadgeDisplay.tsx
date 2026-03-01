'use client';

import React from 'react';
import { Pin, Lock, Sparkles } from 'lucide-react';
import { ArcaneCard } from '@/components/primitives/Card/ArcaneCard';
import { CardContent } from '@/components/primitives/Card/CardContent';
import { Text } from '@/components/primitives/Typography/Text';
import { ArcaneButton } from '@/components/primitives/Button/ArcaneButton';
import { RarityBadge } from './RarityBadge';
import { cn } from '@/lib/utils';
import { Badge, getRarityColor } from '@/lib/api/gamification';
import { motion } from 'framer-motion';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showPin?: boolean;
  onPin?: () => void;
  onClick?: () => void;
  variant?: 'card' | 'minimal';
  showDetails?: boolean;
}

/**
 * BadgeDisplay - Display badge with rarity, pin status, and shine effects
 *
 * Features:
 * - Size variants
 * - Pin/unpin functionality
 * - Rarity border and glow
 * - Shine animation on hover
 * - Locked/unlocked states
 * - Card or minimal variants
 */
export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({
  badge,
  size = 'md',
  showPin = true,
  onPin,
  onClick,
  variant = 'card',
  showDetails = true,
}) => {
  const rarityColor = getRarityColor(badge.rarity);
  const isEarned = !!badge.earnedAt;

  const sizes = {
    sm: { container: 'h-16 w-16', icon: 'text-3xl', button: 'h-6 w-6' },
    md: { container: 'h-20 w-20', icon: 'text-4xl', button: 'h-8 w-8' },
    lg: { container: 'h-28 w-28', icon: 'text-5xl', button: 'h-10 w-10' },
  };

  const { container, icon: iconSize, button: buttonSize } = sizes[size];

  if (variant === 'minimal') {
    return (
      <motion.div
        className={cn(
          'relative rounded-full flex items-center justify-center',
          container,
          isEarned ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
        )}
        style={{
          borderWidth: 3,
          borderColor: isEarned ? rarityColor : '#b3afb2',
          backgroundColor: '#353439',
          boxShadow: isEarned ? `0 0 20px ${rarityColor}30` : undefined,
        }}
        onClick={isEarned ? onClick : undefined}
        whileHover={isEarned ? { scale: 1.1 } : undefined}
      >
        {/* Badge Icon */}
        <span className={cn(iconSize, !isEarned && 'grayscale')}>{badge.icon}</span>

        {/* Lock overlay */}
        {!isEarned && (
          <div className="absolute inset-0 flex items-center justify-center bg-arcane-black/60 rounded-full">
            <Lock className="h-6 w-6 text-arcane-gray-400" />
          </div>
        )}

        {/* Pin indicator */}
        {badge.isPinned && (
          <div className="absolute -top-1 -right-1">
            <div className="h-5 w-5 rounded-full bg-arcane-yellow flex items-center justify-center">
              <Pin className="h-3 w-3 text-arcane-black fill-arcane-black" />
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <ArcaneCard
      variant="standard"
      hover={!!onClick && isEarned}
      className={cn(
        'relative overflow-hidden group',
        !isEarned && 'opacity-60',
        onClick && isEarned && 'cursor-pointer'
      )}
      onClick={isEarned ? onClick : undefined}
    >
      {/* Shine effect overlay on hover */}
      {isEarned && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div
            className="absolute -inset-full animate-[shimmer_2s_infinite]"
            style={{
              background: `linear-gradient(90deg, transparent, ${rarityColor}20, transparent)`,
            }}
          />
        </div>
      )}

      {/* Rarity glow */}
      {isEarned && (
        <div
          className="absolute inset-0 opacity-20 blur-xl"
          style={{
            background: `radial-gradient(circle at center, ${rarityColor}, transparent 70%)`,
          }}
        />
      )}

      <CardContent className="p-4 relative">
        <div className="flex flex-col items-center text-center">
          {/* Badge Circle */}
          <motion.div
            className={cn(
              'relative rounded-full flex items-center justify-center mb-3',
              container
            )}
            style={{
              borderWidth: 3,
              borderColor: isEarned ? rarityColor : '#b3afb2',
              backgroundColor: '#353439',
              boxShadow: isEarned ? `0 0 20px ${rarityColor}30` : undefined,
            }}
            whileHover={isEarned ? { rotate: [0, -5, 5, -5, 0], scale: 1.05 } : undefined}
            transition={{ duration: 0.5 }}
          >
            {/* Badge Icon */}
            <span className={cn(iconSize, !isEarned && 'grayscale')}>{badge.icon}</span>

            {/* Lock overlay */}
            {!isEarned && (
              <div className="absolute inset-0 flex items-center justify-center bg-arcane-black/60 rounded-full">
                <Lock className="h-8 w-8 text-arcane-gray-400" />
              </div>
            )}

            {/* Pin indicator */}
            {badge.isPinned && (
              <div className="absolute -top-1 -right-1">
                <div className="h-6 w-6 rounded-full bg-arcane-yellow flex items-center justify-center shadow-glow-yellow">
                  <Pin className="h-4 w-4 text-arcane-black fill-arcane-black" />
                </div>
              </div>
            )}

            {/* Sparkles for epic/legendary */}
            {isEarned && (badge.rarity === 'legendary' || badge.rarity === 'epic') && (
              <Sparkles
                className="absolute -top-2 -left-2 h-5 w-5 text-yellow-400 animate-pulse"
                style={{ filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.8))' }}
              />
            )}
          </motion.div>

          {/* Badge Name */}
          {showDetails && (
            <>
              <Text size="sm" weight="semibold" className="mb-2 truncate w-full">
                {badge.name}
              </Text>

              {/* Rarity Badge */}
              <RarityBadge rarity={badge.rarity} size="sm" className="mb-2" />

              {/* Description */}
              <Text size="xs" color="tertiary" className="mb-3 line-clamp-2">
                {badge.description}
              </Text>

              {/* Earned Date */}
              {badge.earnedAt && (
                <Text size="xs" color="secondary" className="mb-3">
                  Earned {new Date(badge.earnedAt).toLocaleDateString()}
                </Text>
              )}

              {/* Pin Button */}
              {showPin && isEarned && onPin && (
                <ArcaneButton
                  variant={badge.isPinned ? 'primary' : 'secondary'}
                  size="sm"
                  icon={<Pin />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPin();
                  }}
                  fullWidth
                >
                  {badge.isPinned ? 'Pinned' : 'Pin to Profile'}
                </ArcaneButton>
              )}

              {/* Requirement for locked badges */}
              {!isEarned && badge.requirement && (
                <Text size="xs" color="tertiary" className="mt-2 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {badge.requirement}
                </Text>
              )}
            </>
          )}
        </div>
      </CardContent>
    </ArcaneCard>
  );
};

BadgeDisplay.displayName = 'BadgeDisplay';
