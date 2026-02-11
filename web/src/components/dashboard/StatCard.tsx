'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { ArcaneCard } from '@/components/primitives/Card/ArcaneCard';
import { CardContent } from '@/components/primitives/Card/CardContent';
import { Heading } from '@/components/primitives/Typography/Heading';
import { Text } from '@/components/primitives/Typography/Text';
import { Badge } from '@/components/primitives/Badge/Badge';
import { Skeleton } from '@/components/composite/Progress/Skeleton';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  /** Stat label */
  label: string;
  /** Stat value */
  value: number | string;
  /** Icon component */
  icon: LucideIcon;
  /** Trend indicator text (e.g., "+12%", "This week") */
  trend?: string;
  /** Trend direction */
  trendDirection?: 'up' | 'down' | 'neutral';
  /** Comparison text */
  comparison?: string;
  /** Color accent for icon background */
  accentColor?: 'blue' | 'purple' | 'yellow' | 'green' | 'red';
  /** Loading state */
  loading?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatCard - Premium stat card for dashboard metrics
 *
 * Features:
 * - Large value display with animated counter
 * - Icon with colored background
 * - Trend indicator with up/down arrows
 * - Comparison text
 * - Hover effects with glow
 * - Loading skeleton state
 * - Clickable with pointer cursor
 *
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Reports"
 *   value={42}
 *   icon={FileText}
 *   trend="+12%"
 *   trendDirection="up"
 *   comparison="vs last month"
 *   accentColor="purple"
 *   onClick={() => router.push('/reports')}
 * />
 * ```
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  trendDirection = 'neutral',
  comparison,
  accentColor = 'yellow',
  loading = false,
  onClick,
  className,
}) => {
  // Color configs
  const colorConfig = {
    blue: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
    purple: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
    },
    yellow: {
      bg: 'bg-arcane-yellow/20',
      text: 'text-arcane-yellow',
      border: 'border-arcane-yellow/30',
    },
    green: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
    },
    red: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
    },
  };

  const colors = colorConfig[accentColor];

  // Trend config
  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-success',
      variant: 'success' as const,
    },
    down: {
      icon: TrendingDown,
      color: 'text-error',
      variant: 'error' as const,
    },
    neutral: {
      icon: Minus,
      color: 'text-arcane-gray-400',
      variant: 'info' as const,
    },
  };

  const trendInfo = trendConfig[trendDirection];
  const TrendIcon = trendInfo.icon;

  if (loading) {
    return (
      <ArcaneCard variant="stat" className={cn('p-6', className)}>
        <CardContent>
          <div className="flex items-start justify-between mb-4">
            <Skeleton type="custom" width="48px" height="48px" rounded="lg" />
            <Skeleton type="custom" width="60px" height="24px" rounded="full" />
          </div>
          <Skeleton type="text" lines={1} className="mb-2" />
          <Skeleton type="text" lines={1} />
        </CardContent>
      </ArcaneCard>
    );
  }

  return (
    <ArcaneCard
      variant="stat"
      hover
      glow
      onClick={onClick}
      className={cn(
        'group transition-all duration-300',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <CardContent className="p-6">
        {/* Top Section: Icon and Trend Badge */}
        <div className="flex items-start justify-between mb-4">
          {/* Icon */}
          <div
            className={cn(
              'h-12 w-12 rounded-lg flex items-center justify-center',
              'transition-all duration-300',
              'group-hover:scale-110 group-hover:rotate-3',
              colors.bg
            )}
          >
            <Icon className={cn('h-6 w-6', colors.text)} strokeWidth={2.5} />
          </div>

          {/* Trend Badge */}
          {trend && (
            <Badge
              variant={trendInfo.variant}
              size="sm"
              icon={<TrendIcon />}
            >
              {trend}
            </Badge>
          )}
        </div>

        {/* Value */}
        <Heading
          level={3}
          className={cn(
            'text-4xl font-black mb-1 transition-all duration-300',
            'group-hover:text-arcane-yellow'
          )}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Heading>

        {/* Label */}
        <Text size="sm" color="secondary" weight="medium" className="uppercase tracking-wide">
          {label}
        </Text>

        {/* Comparison */}
        {comparison && (
          <Text size="xs" color="tertiary" className="mt-2">
            {comparison}
          </Text>
        )}
      </CardContent>
    </ArcaneCard>
  );
};

StatCard.displayName = 'StatCard';
