'use client';

import React from 'react';
import { Star, Sparkles, Crown, Shield } from 'lucide-react';
import { Badge } from '@/components/primitives/Badge/Badge';
import { cn } from '@/lib/utils';
import { AchievementRarity, getRarityColor, getRarityLabel } from '@/lib/api/gamification';

interface RarityBadgeProps {
  rarity: AchievementRarity;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

/**
 * RarityBadge - Color-coded rarity indicator
 *
 * Features:
 * - Color-coded by rarity (common, rare, epic, legendary)
 * - Size variants
 * - Optional icon
 * - Glow effect for higher rarities
 */
export const RarityBadge: React.FC<RarityBadgeProps> = ({
  rarity,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const color = getRarityColor(rarity);
  const label = getRarityLabel(rarity);

  const icons = {
    common: Shield,
    rare: Star,
    epic: Sparkles,
    legendary: Crown,
  };

  const Icon = icons[rarity];

  return (
    <Badge
      variant="premium"
      size={size}
      icon={showIcon ? <Icon /> : undefined}
      className={cn(className)}
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: `${color}30`,
        boxShadow: rarity === 'legendary' || rarity === 'epic' ? `0 0 12px ${color}30` : undefined,
      }}
    >
      {label}
    </Badge>
  );
};

RarityBadge.displayName = 'RarityBadge';
