'use client';

import React, { ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface PremiumCardProps extends MotionProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'gradient' | 'glass' | 'glow' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  blur?: boolean;
  icon?: LucideIcon;
  title?: string;
  subtitle?: string;
  badge?: string | ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
}

export const PremiumCard = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = true,
  blur = false,
  icon: Icon,
  title,
  subtitle,
  badge,
  action,
  footer,
  onClick,
  ...motionProps
}: PremiumCardProps) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const variantClasses = {
    default: `
      bg-white dark:bg-neutral-900
      border border-neutral-200 dark:border-neutral-800
      shadow-sm
    `,
    gradient: `
      bg-gradient-to-br from-primary-50 via-white to-secondary-50
      dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800
      border border-neutral-200 dark:border-neutral-700
      shadow-md
    `,
    glass: `
      backdrop-blur-xl
      bg-white/70 dark:bg-neutral-900/70
      border border-white/20 dark:border-white/10
      shadow-xl
    `,
    glow: `
      bg-white dark:bg-neutral-900
      border border-primary-200 dark:border-primary-800
      shadow-lg shadow-primary-500/10 dark:shadow-primary-400/10
    `,
    elevated: `
      bg-white dark:bg-neutral-900
      border border-neutral-200 dark:border-neutral-800
      shadow-xl
    `,
  };

  const hoverClasses = hover
    ? `
      hover:shadow-2xl
      hover:scale-[1.02]
      hover:border-primary-300 dark:hover:border-primary-700
      cursor-pointer
    `
    : '';

  return (
    <motion.div
      className={cn(
        'rounded-2xl transition-all duration-300',
        variantClasses[variant],
        paddingClasses[padding],
        hoverClasses,
        onClick && 'cursor-pointer',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4 } : undefined}
      onClick={onClick}
      {...motionProps}
    >
      {/* Header Section */}
      {(Icon || title || subtitle || badge || action) && (
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            {Icon && (
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
            )}
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {badge && (
              <div className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium">
                {badge}
              </div>
            )}
            {action && <div>{action}</div>}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative">
        {blur && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-neutral-900/50 animate-shimmer" />
        )}
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          {footer}
        </div>
      )}
    </motion.div>
  );
};

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: LucideIcon;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

export const StatsCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'primary',
  loading = false,
}: StatsCardProps) => {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    secondary: 'bg-secondary-100 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400',
    success: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-neutral-600 dark:text-neutral-400',
  };

  return (
    <PremiumCard variant="elevated" padding="md" hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            {title}
          </p>

          {loading ? (
            <div className="mt-2 h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
          ) : (
            <motion.p
              className="mt-2 text-3xl font-bold text-neutral-900 dark:text-neutral-100"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              {value}
            </motion.p>
          )}

          {change && !loading && (
            <div className={cn('mt-2 text-sm font-medium', trendColors[change.trend])}>
              <span>{change.trend === 'up' ? '↑' : change.trend === 'down' ? '↓' : '→'}</span>
              <span className="ml-1">{change.value}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className={cn('p-3 rounded-xl', colorClasses[color])}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </PremiumCard>
  );
};

// Feature Card Component
interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  gradient?: boolean;
}

export const FeatureCard = ({
  icon: Icon,
  title,
  description,
  action,
  gradient = false,
}: FeatureCardProps) => {
  return (
    <PremiumCard
      variant={gradient ? 'gradient' : 'default'}
      hover
      className="group h-full"
    >
      <div className="flex flex-col h-full">
        <motion.div
          className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30 w-fit mb-4"
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </motion.div>

        <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {title}
        </h3>

        <p className="text-sm text-neutral-600 dark:text-neutral-400 flex-1">
          {description}
        </p>

        {action && (
          <motion.button
            className="mt-4 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 flex items-center gap-2"
            onClick={action.onClick}
            whileHover={{ x: 5 }}
          >
            {action.label}
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </motion.button>
        )}
      </div>
    </PremiumCard>
  );
};

export default PremiumCard;